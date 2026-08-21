import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { MOCK_BANK_BALANCE, MOCK_PIGS } from '@/data/mockSavings';
import {
  breakPigById,
  completeMaturePigs,
  createPig,
  CreatePigResult,
  removePigById,
} from '@/domain/pigs';
import { CreatePigInput, Pig } from '@/models/pig';
import { loadStoredPigs, saveStoredPigs } from '@/services/pigStorage';

export type ReleaseReason = 'broken' | 'completed';

export type ReleaseNotice = {
  pigId: string;
  reason: ReleaseReason;
};

type PiggiContextValue = {
  addPig: (input: CreatePigInput) => CreatePigResult;
  bankBalance: number;
  breakPig: (pigId: string) => void;
  clearCreationNotice: () => void;
  clearReleaseNotice: () => void;
  getPigById: (id: string | undefined) => Pig | undefined;
  lastCreatedPigId: string | null;
  progressionDate: Date;
  releaseNotice: ReleaseNotice | null;
  isHydrated: boolean;
  pigs: Pig[];
  removePig: (pigId: string) => void;
};

const PiggiContext = createContext<PiggiContextValue | undefined>(undefined);

export function PiggiProvider({ children }: PropsWithChildren) {
  const [pigs, setPigs] = useState<Pig[]>(MOCK_PIGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastCreatedPigId, setLastCreatedPigId] = useState<string | null>(null);
  const [releaseNotice, setReleaseNotice] = useState<ReleaseNotice | null>(null);
  const [progressionDate, setProgressionDate] = useState(() => new Date());
  const pigsRef = useRef(pigs);
  const progressionDayRef = useRef(getLocalDayKey(progressionDate));

  const commitPigs = useCallback((nextPigs: Pig[]) => {
    pigsRef.current = nextPigs;
    setPigs(nextPigs);
    void saveStoredPigs(nextPigs).catch((error: unknown) => {
      console.warn('Piggi could not persist Pigs.', error);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedPigs = await loadStoredPigs();
        const sourcePigs = storedPigs ?? MOCK_PIGS;
        const currentPigs = completeMaturePigs(sourcePigs);
        if (!isMounted) return;

        pigsRef.current = currentPigs;
        setPigs(currentPigs);
        setIsHydrated(true);
        if (currentPigs !== sourcePigs) {
          const completedPig = findNewlyCompletedPig(sourcePigs, currentPigs);
          if (completedPig) {
            setReleaseNotice({ pigId: completedPig.id, reason: 'completed' });
          }
          await saveStoredPigs(currentPigs);
        }
      } catch (error) {
        console.warn('Piggi could not load stored Pigs.', error);
        if (isMounted) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return undefined;

    const completeDuePigs = () => {
      const now = new Date();
      const currentDay = getLocalDayKey(now);
      if (currentDay !== progressionDayRef.current) {
        progressionDayRef.current = currentDay;
        setProgressionDate(now);
      }

      const previousPigs = pigsRef.current;
      const nextPigs = completeMaturePigs(previousPigs, now);
      if (nextPigs !== previousPigs) {
        const completedPig = findNewlyCompletedPig(previousPigs, nextPigs);
        commitPigs(nextPigs);
        setLastCreatedPigId(null);
        if (completedPig) {
          setReleaseNotice({ pigId: completedPig.id, reason: 'completed' });
        }
      }
    };

    completeDuePigs();
    const completionTimer = setInterval(completeDuePigs, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') completeDuePigs();
    });
    return () => {
      clearInterval(completionTimer);
      subscription.remove();
    };
  }, [commitPigs, isHydrated]);

  const addPig = useCallback((input: CreatePigInput) => {
    const result = createPig(input, MOCK_BANK_BALANCE, pigsRef.current);
    if (result.ok) {
      const nextPigs = [...pigsRef.current, result.pig];
      commitPigs(nextPigs);
      setLastCreatedPigId(result.pig.id);
      setReleaseNotice(null);
    }
    return result;
  }, [commitPigs]);

  const breakPig = useCallback((pigId: string) => {
    const pigToBreak = pigsRef.current.find((pig) => pig.id === pigId && pig.status === 'locked');
    const nextPigs = breakPigById(pigsRef.current, pigId);
    commitPigs(nextPigs);
    setLastCreatedPigId(null);
    if (pigToBreak) setReleaseNotice({ pigId, reason: 'broken' });
  }, [commitPigs]);

  const removePig = useCallback((pigId: string) => {
    const nextPigs = removePigById(pigsRef.current, pigId);
    commitPigs(nextPigs);
    setLastCreatedPigId((current) => (current === pigId ? null : current));
    setReleaseNotice((current) => (current?.pigId === pigId ? null : current));
  }, [commitPigs]);

  const clearCreationNotice = useCallback(() => setLastCreatedPigId(null), []);
  const clearReleaseNotice = useCallback(() => setReleaseNotice(null), []);

  const getPigById = useCallback(
    (id: string | undefined) => pigs.find((pig) => pig.id === id),
    [pigs],
  );

  return (
    <PiggiContext.Provider
      value={{
        addPig,
        bankBalance: MOCK_BANK_BALANCE,
        breakPig,
        clearCreationNotice,
        clearReleaseNotice,
        getPigById,
        isHydrated,
        lastCreatedPigId,
        pigs,
        progressionDate,
        releaseNotice,
        removePig,
      }}
    >
      {children}
    </PiggiContext.Provider>
  );
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function findNewlyCompletedPig(previousPigs: Pig[], nextPigs: Pig[]) {
  return nextPigs.find((nextPig) => (
    nextPig.status === 'completed' &&
    previousPigs.find((previousPig) => previousPig.id === nextPig.id)?.status === 'locked'
  ));
}

export function usePiggi() {
  const context = useContext(PiggiContext);
  if (!context) {
    throw new Error('usePiggi must be used inside PiggiProvider.');
  }
  return context;
}
