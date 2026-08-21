import type { AuthChangeEvent, AuthError, Session, User } from '@supabase/supabase-js';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { normalizeEmail } from '@/domain/authValidation';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

const SUPABASE_CONFIGURATION_ERROR =
  'Piggi needs Supabase configuration before you can sign in.';

type AuthActionFailure = {
  error: string;
  success: false;
};

type AuthActionSuccess = {
  success: true;
};

export type AuthActionResult = AuthActionFailure | AuthActionSuccess;

export type SignUpResult = AuthActionFailure | (AuthActionSuccess & {
  requiresEmailConfirmation: boolean;
});

type SignOutCleanup = () => Promise<void> | void;

type AuthContextValue = {
  initializationError: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  registerSignOutCleanup: (cleanup: SignOutCleanup) => () => void;
  retrySessionRestore: () => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [initializationError, setInitializationError] = useState<string | null>(
    isSupabaseConfigured ? null : SUPABASE_CONFIGURATION_ERROR,
  );
  const cleanupCallbacksRef = useRef(new Set<SignOutCleanup>());
  const activeUserIdRef = useRef<string | null>(null);
  const pendingCleanupRef = useRef<Promise<void>>(Promise.resolve());
  const isMountedRef = useRef(true);

  const clearUserMemory = useCallback(async () => {
    const callbacks = Array.from(cleanupCallbacksRef.current);
    await Promise.allSettled(callbacks.map(async (cleanup) => cleanup()));
  }, []);

  const applySession = useCallback(async (nextSession: Session | null) => {
    const previousUserId = activeUserIdRef.current;
    const nextUserId = nextSession?.user.id ?? null;

    activeUserIdRef.current = nextUserId;

    if (previousUserId && previousUserId !== nextUserId) {
      pendingCleanupRef.current = pendingCleanupRef.current.then(clearUserMemory);
    }

    await pendingCleanupRef.current;

    if (isMountedRef.current && activeUserIdRef.current === nextUserId) {
      if (nextSession) {
        setInitializationError(null);
      }
      setSession(nextSession);
      setIsLoading(false);
    }
  }, [clearUserMemory]);

  const restoreSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setInitializationError(SUPABASE_CONFIGURATION_ERROR);
      setIsLoading(false);
      return;
    }

    setInitializationError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setInitializationError(
          'We could not restore your session. Check your connection and try again.',
        );
        await applySession(null);
        return;
      }

      await applySession(data.session);
    } catch {
      setInitializationError(
        'We could not restore your session. Check your connection and try again.',
      );
      await applySession(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applySession]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      nextSession: Session | null,
    ) => {
      void applySession(nextSession);
    });

    void restoreSession();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, restoreSession]);

  const registerSignOutCleanup = useCallback((cleanup: SignOutCleanup) => {
    cleanupCallbacksRef.current.add(cleanup);

    return () => {
      cleanupCallbacksRef.current.delete(cleanup);
    };
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string,
  ): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        return { error: getFriendlyAuthError(error, 'signIn'), success: false };
      }

      await applySession(data.session);
      return { success: true };
    } catch {
      return {
        error: 'We could not sign you in. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession]);

  const signUp = useCallback(async (
    email: string,
    password: string,
  ): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        return { error: getFriendlyAuthError(error, 'signUp'), success: false };
      }

      if (data.user?.identities?.length === 0) {
        return {
          error: 'An account already exists with this email.',
          success: false,
        };
      }

      if (data.session) {
        await applySession(data.session);
      }

      return {
        requiresEmailConfirmation: data.session === null,
        success: true,
      };
    } catch {
      return {
        error: 'We could not create your account. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession]);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: getFriendlyAuthError(error, 'signOut'), success: false };
      }

      await applySession(null);
      return { success: true };
    } catch {
      return {
        error: 'We could not sign you out. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    initializationError,
    isConfigured: isSupabaseConfigured,
    isLoading,
    registerSignOutCleanup,
    retrySessionRestore: restoreSession,
    session,
    signIn,
    signOut,
    signUp,
    user: session?.user ?? null,
  }), [
    initializationError,
    isLoading,
    registerSignOutCleanup,
    restoreSession,
    session,
    signIn,
    signOut,
    signUp,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

type AuthOperation = 'signIn' | 'signOut' | 'signUp';

function getFriendlyAuthError(error: AuthError, operation: AuthOperation): string {
  const errorCode = error.code ?? '';
  const normalizedMessage = error.message.toLowerCase();

  if (errorCode === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }

  if (errorCode === 'email_not_confirmed') {
    return 'Confirm your email before signing in.';
  }

  if (errorCode === 'email_address_invalid' || normalizedMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (
    errorCode === 'weak_password'
    || normalizedMessage.includes('password should be')
    || normalizedMessage.includes('password must be')
  ) {
    return 'Your password is too short or too easy to guess.';
  }

  if (
    errorCode === 'user_already_exists'
    || normalizedMessage.includes('already registered')
    || normalizedMessage.includes('already exists')
  ) {
    return 'An account already exists with this email.';
  }

  if (errorCode.includes('rate_limit') || normalizedMessage.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (errorCode === 'signup_disabled') {
    return 'Account creation is not available right now.';
  }

  if (operation === 'signIn') {
    return 'Something went wrong while signing in. Please try again.';
  }

  if (operation === 'signUp') {
    return 'Something went wrong while creating your account. Please try again.';
  }

  return 'Something went wrong while signing out. Please try again.';
}
