import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  completeMaturePigs,
  createPig,
  CreatePigResult,
} from '@/domain/pigs';
import { CreatePigInput, Pig } from '@/models/pig';
import {
  getFinancialStateForUser,
  updateMockBankBalanceForUser,
} from '@/repositories/financialStateRepository';
import {
  breakPigForUser,
  completePigForUser,
  createPigForUser,
  deletePigForUser,
  getPigsForUser,
} from '@/repositories/pigRepository';
import {
  getRepositoryErrorMessage,
  isRepositoryConflict,
} from '@/repositories/repositoryError';
import { useAuth } from '@/state/AuthProvider';
import {
  EMPTY_PIGGI_DATA,
  piggiDataReducer,
  selectPiggiDataForUser,
} from '@/state/piggiData';

export type ReleaseReason = 'broken' | 'completed';

export type ReleaseNotice = {
  pigId: string;
  reason: ReleaseReason;
};

export type PiggiOperationResult =
  | { ok: true }
  | { error: string; ok: false };

type PiggiContextValue = {
  addPig: (input: CreatePigInput) => Promise<CreatePigResult>;
  bankBalance: number;
  breakPig: (pigId: string) => Promise<PiggiOperationResult>;
  clearCreationNotice: () => void;
  clearReleaseNotice: () => void;
  getPigById: (id: string | undefined) => Pig | undefined;
  hasLoadedData: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  lastCreatedPigId: string | null;
  loadError: string | null;
  pigs: Pig[];
  progressionDate: Date;
  refreshData: () => Promise<void>;
  releaseNotice: ReleaseNotice | null;
  removePig: (pigId: string) => Promise<PiggiOperationResult>;
  updateMockBankBalance: (balance: number) => Promise<PiggiOperationResult>;
};

const PiggiContext = createContext<PiggiContextValue | undefined>(undefined);

export function PiggiProvider({ children }: PropsWithChildren) {
  const { registerSignOutCleanup, user } = useAuth();
  const userId = user?.id ?? null;
  const [dataState, dispatch] = useReducer(piggiDataReducer, EMPTY_PIGGI_DATA);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastCreatedPigId, setLastCreatedPigId] = useState<string | null>(null);
  const [releaseNotice, setReleaseNotice] = useState<ReleaseNotice | null>(null);
  const [progressionDate, setProgressionDate] = useState(() => new Date());
  const ownerIdRef = useRef<string | null>(null);
  const pigsRef = useRef<Pig[]>([]);
  const bankBalanceRef = useRef(0);
  const progressionDayRef = useRef(getLocalDayKey(progressionDate));
  const sessionEpochRef = useRef(0);
  const loadRequestRef = useRef(0);
  const dataVersionRef = useRef(0);
  const createInFlightRef = useRef<symbol | null>(null);
  const completionSyncsRef = useRef(new Map<string, Promise<void>>());
  const conflictRefreshRef = useRef<(targetUserId: string) => Promise<void>>(async () => {});
  const mountedRef = useRef(true);

  const visibleData = selectPiggiDataForUser(dataState, userId);
  const isCurrentUserHydrated = isHydrated && (
    !userId || dataState.ownerId === userId
  );

  const clearUserData = useCallback(() => {
    sessionEpochRef.current += 1;
    loadRequestRef.current += 1;
    dataVersionRef.current += 1;
    ownerIdRef.current = null;
    pigsRef.current = [];
    bankBalanceRef.current = 0;
    createInFlightRef.current = null;
    completionSyncsRef.current.clear();
    dispatch({ type: 'authChanged', userId: null });
    setLastCreatedPigId(null);
    setReleaseNotice(null);
    setLoadError(null);
    setIsRefreshing(false);
    setIsHydrated(true);
  }, []);

  const commitPigs = useCallback((targetUserId: string, nextPigs: Pig[]) => {
    if (ownerIdRef.current !== targetUserId) return false;

    pigsRef.current = nextPigs;
    dispatch({ pigs: nextPigs, type: 'pigsChanged', userId: targetUserId });
    return true;
  }, []);

  const persistCompletions = useCallback(async (
    targetUserId: string,
    previousPigs: Pig[],
    nextPigs: Pig[],
    completedAt: Date,
  ) => {
    const sessionEpoch = sessionEpochRef.current;
    const completedPigs = nextPigs
      .filter((pig) => (
        pig.status === 'completed'
        && previousPigs.find((previousPig) => previousPig.id === pig.id)?.status === 'locked'
      ));

    if (!completedPigs.length) return;

    const syncs = completedPigs.map((pig) => {
      const syncKey = `${sessionEpoch}:${targetUserId}:${pig.id}`;
      const existingSync = completionSyncsRef.current.get(syncKey);
      if (existingSync) return existingSync;

      let syncPromise: Promise<void>;
      syncPromise = completePigForUser(targetUserId, pig.id, completedAt)
        .then(() => undefined)
        .catch((error: unknown) => {
          if (
            ownerIdRef.current !== targetUserId
            || sessionEpochRef.current !== sessionEpoch
            || !mountedRef.current
            || !pigsRef.current.some((currentPig) => currentPig.id === pig.id)
          ) {
            return;
          }

          console.warn('Piggi could not sync an automatically completed Pig.', error);
          if (isRepositoryConflict(error)) {
            void conflictRefreshRef.current(targetUserId);
            return;
          }
          setLoadError(getRepositoryErrorMessage(
            error,
            'Your Pig opened, but its cloud status could not be synced. Pull to refresh and try again.',
          ));
        })
        .finally(() => {
          if (completionSyncsRef.current.get(syncKey) === syncPromise) {
            completionSyncsRef.current.delete(syncKey);
          }
        });

      completionSyncsRef.current.set(syncKey, syncPromise);
      return syncPromise;
    });

    await Promise.all(syncs);
  }, []);

  const completeDuePigs = useCallback((targetUserId: string, now = new Date()) => {
    if (ownerIdRef.current !== targetUserId) return;

    const currentDay = getLocalDayKey(now);
    if (currentDay !== progressionDayRef.current) {
      progressionDayRef.current = currentDay;
      setProgressionDate(now);
    }

    const previousPigs = pigsRef.current;
    const nextPigs = completeMaturePigs(previousPigs, now);
    if (nextPigs === previousPigs) return;

    dataVersionRef.current += 1;
    if (!commitPigs(targetUserId, nextPigs)) return;

    const completedPig = findNewlyCompletedPig(previousPigs, nextPigs);
    setLastCreatedPigId(null);
    if (completedPig) {
      setReleaseNotice({ pigId: completedPig.id, reason: 'completed' });
    }
    void persistCompletions(targetUserId, previousPigs, nextPigs, now);
  }, [commitPigs, persistCompletions]);

  const loadUserData = useCallback(async (
    targetUserId: string,
    refresh: boolean,
  ) => {
    const requestId = ++loadRequestRef.current;
    const sessionEpoch = sessionEpochRef.current;
    const versionAtStart = dataVersionRef.current;

    if (refresh) setIsRefreshing(true);
    setLoadError(null);

    try {
      const [financialState, storedPigs] = await Promise.all([
        getFinancialStateForUser(targetUserId),
        getPigsForUser(targetUserId),
      ]);

      if (
        !mountedRef.current
        || ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
        || loadRequestRef.current !== requestId
        || dataVersionRef.current !== versionAtStart
      ) {
        return;
      }

      const now = new Date();
      const currentPigs = completeMaturePigs(storedPigs, now);
      pigsRef.current = currentPigs;
      bankBalanceRef.current = financialState.mockBankBalance;
      dispatch({
        bankBalance: financialState.mockBankBalance,
        pigs: currentPigs,
        type: 'loaded',
        userId: targetUserId,
      });

      const completedPig = findNewlyCompletedPig(storedPigs, currentPigs);
      if (completedPig) {
        setLastCreatedPigId(null);
        setReleaseNotice({ pigId: completedPig.id, reason: 'completed' });
        void persistCompletions(targetUserId, storedPigs, currentPigs, now);
      }
    } catch (error) {
      if (
        !mountedRef.current
        || ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
        || loadRequestRef.current !== requestId
      ) {
        return;
      }

      console.warn('Piggi could not load cloud data.', error);
      setLoadError(getRepositoryErrorMessage(
        error,
        'We could not load your Pigs. Check your connection and try again.',
      ));
    } finally {
      if (
        mountedRef.current
        && ownerIdRef.current === targetUserId
        && sessionEpochRef.current === sessionEpoch
        && loadRequestRef.current === requestId
      ) {
        setIsHydrated(true);
        if (refresh) setIsRefreshing(false);
      }
    }
  }, [persistCompletions]);

  useEffect(() => {
    conflictRefreshRef.current = (targetUserId) => loadUserData(targetUserId, true);
  }, [loadUserData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      loadRequestRef.current += 1;
    };
  }, []);

  useEffect(() => registerSignOutCleanup(clearUserData), [
    clearUserData,
    registerSignOutCleanup,
  ]);

  useEffect(() => {
    sessionEpochRef.current += 1;
    loadRequestRef.current += 1;
    dataVersionRef.current += 1;
    ownerIdRef.current = userId;
    pigsRef.current = [];
    bankBalanceRef.current = 0;
    createInFlightRef.current = null;
    completionSyncsRef.current.clear();
    dispatch({ type: 'authChanged', userId });
    setLastCreatedPigId(null);
    setReleaseNotice(null);
    setLoadError(null);
    setIsRefreshing(false);

    if (!userId) {
      setIsHydrated(true);
      return;
    }

    setIsHydrated(false);
    void loadUserData(userId, false);
  }, [loadUserData, userId]);

  useEffect(() => {
    if (!userId || !isHydrated || !visibleData.hasLoadedData) return undefined;

    const checkForCompletion = () => completeDuePigs(userId);
    checkForCompletion();
    const completionTimer = setInterval(checkForCompletion, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForCompletion();
    });

    return () => {
      clearInterval(completionTimer);
      subscription.remove();
    };
  }, [completeDuePigs, isHydrated, userId, visibleData.hasLoadedData]);

  const refreshData = useCallback(async () => {
    const targetUserId = ownerIdRef.current;
    if (!targetUserId) return;
    await loadUserData(targetUserId, true);
  }, [loadUserData]);

  const addPig = useCallback(async (input: CreatePigInput): Promise<CreatePigResult> => {
    const targetUserId = ownerIdRef.current;
    const sessionEpoch = sessionEpochRef.current;
    if (!targetUserId) {
      return { error: 'Sign in to create a Pig.', field: 'form', ok: false };
    }

    if (createInFlightRef.current) {
      return { error: 'Your Pig is already being created.', field: 'form', ok: false };
    }

    const initialValidation = createPig(input, bankBalanceRef.current, pigsRef.current);
    if (!initialValidation.ok) return initialValidation;

    const createOperation = Symbol('create-pig');
    createInFlightRef.current = createOperation;
    try {
      const pendingCompletions = Array.from(completionSyncsRef.current.entries())
        .filter(([syncKey]) => syncKey.startsWith(`${sessionEpoch}:${targetUserId}:`))
        .map(([, sync]) => sync);
      await Promise.all(pendingCompletions);

      if (
        ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
      ) {
        if (ownerIdRef.current === targetUserId) {
          void conflictRefreshRef.current(targetUserId);
        }
        return { error: 'Your account changed before this Pig was saved.', field: 'form', ok: false };
      }

      const validation = createPig(input, bankBalanceRef.current, pigsRef.current);
      if (!validation.ok) return validation;

      const savedPig = await createPigForUser(targetUserId, validation.pig);
      if (
        ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
      ) {
        if (ownerIdRef.current === targetUserId) {
          void conflictRefreshRef.current(targetUserId);
        }
        return { error: 'Your account changed before this Pig was saved.', field: 'form', ok: false };
      }

      dataVersionRef.current += 1;
      const nextPigs = pigsRef.current.some((pig) => pig.id === savedPig.id)
        ? pigsRef.current.map((pig) => (pig.id === savedPig.id ? savedPig : pig))
        : [...pigsRef.current, savedPig];
      commitPigs(targetUserId, nextPigs);
      setLastCreatedPigId(savedPig.id);
      setReleaseNotice(null);
      setLoadError(null);
      return { ok: true, pig: savedPig };
    } catch (error) {
      console.warn('Piggi could not create a Pig.', error);
      if (
        isRepositoryConflict(error)
        && ownerIdRef.current === targetUserId
        && sessionEpochRef.current === sessionEpoch
      ) {
        void loadUserData(targetUserId, true);
      }
      return {
        error: getRepositoryErrorMessage(error, 'Your Pig could not be created. Try again.'),
        field: 'form',
        ok: false,
      };
    } finally {
      if (createInFlightRef.current === createOperation) {
        createInFlightRef.current = null;
      }
    }
  }, [commitPigs, loadUserData]);

  const breakPig = useCallback(async (pigId: string): Promise<PiggiOperationResult> => {
    const targetUserId = ownerIdRef.current;
    const sessionEpoch = sessionEpochRef.current;
    const pigToBreak = pigsRef.current.find(
      (pig) => pig.id === pigId && pig.status === 'locked',
    );
    if (!targetUserId || !pigToBreak) {
      return { error: 'This Pig is no longer available to break.', ok: false };
    }

    try {
      const savedPig = await breakPigForUser(targetUserId, pigId);
      if (
        ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
      ) {
        if (ownerIdRef.current === targetUserId) {
          void conflictRefreshRef.current(targetUserId);
        }
        return { error: 'Your account changed before this Pig was updated.', ok: false };
      }

      dataVersionRef.current += 1;
      const nextPigs = pigsRef.current.map((pig) => (
        pig.id === savedPig.id ? savedPig : pig
      ));
      commitPigs(targetUserId, nextPigs);
      setLastCreatedPigId(null);
      setReleaseNotice({ pigId, reason: 'broken' });
      setLoadError(null);
      return { ok: true };
    } catch (error) {
      console.warn('Piggi could not break a Pig.', error);
      if (
        isRepositoryConflict(error)
        && ownerIdRef.current === targetUserId
        && sessionEpochRef.current === sessionEpoch
      ) {
        void loadUserData(targetUserId, true);
      }
      return {
        error: getRepositoryErrorMessage(error, 'Your Pig could not be broken. Try again.'),
        ok: false,
      };
    }
  }, [commitPigs, loadUserData]);

  const removePig = useCallback(async (pigId: string): Promise<PiggiOperationResult> => {
    const targetUserId = ownerIdRef.current;
    const sessionEpoch = sessionEpochRef.current;
    if (!targetUserId || !pigsRef.current.some((pig) => pig.id === pigId)) {
      return { error: 'This Pig is no longer available to remove.', ok: false };
    }

    try {
      await deletePigForUser(targetUserId, pigId);
      if (
        ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
      ) {
        if (ownerIdRef.current === targetUserId) {
          void conflictRefreshRef.current(targetUserId);
        }
        return { error: 'Your account changed before this Pig was removed.', ok: false };
      }

      dataVersionRef.current += 1;
      commitPigs(
        targetUserId,
        pigsRef.current.filter((pig) => pig.id !== pigId),
      );
      setLastCreatedPigId((current) => (current === pigId ? null : current));
      setReleaseNotice((current) => (current?.pigId === pigId ? null : current));
      setLoadError(null);
      return { ok: true };
    } catch (error) {
      console.warn('Piggi could not delete a Pig.', error);
      return {
        error: getRepositoryErrorMessage(error, 'This Pig could not be removed. Try again.'),
        ok: false,
      };
    }
  }, [commitPigs]);

  const updateMockBankBalance = useCallback(async (
    balance: number,
  ): Promise<PiggiOperationResult> => {
    const targetUserId = ownerIdRef.current;
    const sessionEpoch = sessionEpochRef.current;
    if (!targetUserId) {
      return { error: 'Sign in to update your demo balance.', ok: false };
    }

    try {
      const financialState = await updateMockBankBalanceForUser(targetUserId, balance);
      if (
        ownerIdRef.current !== targetUserId
        || sessionEpochRef.current !== sessionEpoch
      ) {
        if (ownerIdRef.current === targetUserId) {
          void conflictRefreshRef.current(targetUserId);
        }
        return { error: 'Your account changed before this balance was saved.', ok: false };
      }

      dataVersionRef.current += 1;
      bankBalanceRef.current = financialState.mockBankBalance;
      dispatch({
        bankBalance: financialState.mockBankBalance,
        type: 'balanceChanged',
        userId: targetUserId,
      });
      setLoadError(null);
      return { ok: true };
    } catch (error) {
      console.warn('Piggi could not update the demo balance.', error);
      if (
        isRepositoryConflict(error)
        && ownerIdRef.current === targetUserId
        && sessionEpochRef.current === sessionEpoch
      ) {
        void loadUserData(targetUserId, true);
      }
      return {
        error: getRepositoryErrorMessage(error, 'We could not save your demo balance. Try again.'),
        ok: false,
      };
    }
  }, [loadUserData]);

  const clearCreationNotice = useCallback(() => setLastCreatedPigId(null), []);
  const clearReleaseNotice = useCallback(() => setReleaseNotice(null), []);
  const getPigById = useCallback(
    (id: string | undefined) => visibleData.pigs.find((pig) => pig.id === id),
    [visibleData.pigs],
  );

  const value = useMemo<PiggiContextValue>(() => ({
    addPig,
    bankBalance: visibleData.bankBalance,
    breakPig,
    clearCreationNotice,
    clearReleaseNotice,
    getPigById,
    hasLoadedData: visibleData.hasLoadedData,
    isHydrated: isCurrentUserHydrated,
    isRefreshing,
    lastCreatedPigId,
    loadError,
    pigs: visibleData.pigs,
    progressionDate,
    refreshData,
    releaseNotice,
    removePig,
    updateMockBankBalance,
  }), [
    addPig,
    breakPig,
    clearCreationNotice,
    clearReleaseNotice,
    getPigById,
    isCurrentUserHydrated,
    isRefreshing,
    lastCreatedPigId,
    loadError,
    progressionDate,
    refreshData,
    releaseNotice,
    removePig,
    updateMockBankBalance,
    visibleData.bankBalance,
    visibleData.hasLoadedData,
    visibleData.pigs,
  ]);

  return <PiggiContext.Provider value={value}>{children}</PiggiContext.Provider>;
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function findNewlyCompletedPig(previousPigs: Pig[], nextPigs: Pig[]) {
  return nextPigs.find((nextPig) => (
    nextPig.status === 'completed'
    && previousPigs.find((previousPig) => previousPig.id === nextPig.id)?.status === 'locked'
  ));
}

export function usePiggi() {
  const context = useContext(PiggiContext);
  if (!context) {
    throw new Error('usePiggi must be used inside PiggiProvider.');
  }
  return context;
}
