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
import {
  AuthFailureCode,
  AuthOperation,
  getAuthFailureCode,
  getFriendlyAuthError,
} from '@/domain/authErrors';
import { useAuthLinkFlow } from '@/hooks/useAuthLinkFlow';
import type { AuthFlowState } from '@/hooks/useAuthLinkFlow';
import {
  CONFIRM_EMAIL_REDIRECT_URL,
  RESET_PASSWORD_REDIRECT_URL,
} from '@/services/authRedirects';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

const SUPABASE_CONFIGURATION_ERROR =
  'Piggi needs Supabase configuration before you can sign in.';

type AuthActionFailure = {
  code: AuthFailureCode;
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
  authFlow: AuthFlowState;
  cancelAuthFlow: () => Promise<void>;
  clearAuthFlow: () => void;
  completeConfirmation: () => void;
  initializationError: string | null;
  hasCheckedInitialAuthLink: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  registerSignOutCleanup: (cleanup: SignOutCleanup) => () => void;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;
  retryAuthFlow: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  updateRecoveredPassword: (password: string) => Promise<AuthActionResult>;
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
  const {
    authFlow,
    authFlowRef,
    clearAuthFlow,
    hasCheckedInitialUrl,
    handleAuthEvent,
    retryAuthFlow,
  } = useAuthLinkFlow();

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
      event: AuthChangeEvent,
      nextSession: Session | null,
    ) => {
      handleAuthEvent(event);
      void applySession(nextSession);
    });

    void restoreSession();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, handleAuthEvent, restoreSession]);

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
      return { code: 'not-configured', error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        return makeAuthFailure(error, 'signIn');
      }

      await applySession(data.session);
      return { success: true };
    } catch {
      return {
        code: 'offline',
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
      return { code: 'not-configured', error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        options: { emailRedirectTo: CONFIRM_EMAIL_REDIRECT_URL },
        password,
      });

      if (error) {
        return makeAuthFailure(error, 'signUp');
      }

      if (data.user?.identities?.length === 0) {
        return {
          code: 'unknown',
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
        code: 'offline',
        error: 'We could not create your account. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession]);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { code: 'not-configured', error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { error } = await supabase.auth.resend({
        email: normalizeEmail(email),
        options: { emailRedirectTo: CONFIRM_EMAIL_REDIRECT_URL },
        type: 'signup',
      });

      if (error) return makeAuthFailure(error, 'resendConfirmation');
      return { success: true };
    } catch {
      return {
        code: 'offline',
        error: 'We could not resend the confirmation email. Check your connection and try again.',
        success: false,
      };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { code: 'not-configured', error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: RESET_PASSWORD_REDIRECT_URL,
      });

      if (error) return makeAuthFailure(error, 'requestPasswordReset');
      return { success: true };
    } catch {
      return {
        code: 'offline',
        error: 'We could not send a reset link. Check your connection and try again.',
        success: false,
      };
    }
  }, []);

  const updateRecoveredPassword = useCallback(async (
    password: string,
  ): Promise<AuthActionResult> => {
    if (authFlowRef.current.kind !== 'recovery' || authFlowRef.current.status !== 'ready') {
      return {
        code: 'unknown',
        error: 'Open a valid Piggi password reset link before changing your password.',
        success: false,
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return makeAuthFailure(error, 'updatePassword');

      const { error: globalSignOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (globalSignOutError) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      await applySession(null);
      clearAuthFlow();
      return { success: true };
    } catch {
      return {
        code: 'offline',
        error: 'We could not update your password. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession, authFlowRef, clearAuthFlow]);

  const cancelAuthFlow = useCallback(async () => {
    const isRecoveryFlow = authFlowRef.current.kind === 'recovery';
    if (isRecoveryFlow) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } finally {
        await applySession(null);
      }
    }
    clearAuthFlow();
  }, [applySession, authFlowRef, clearAuthFlow]);

  const completeConfirmation = useCallback(() => clearAuthFlow(), [clearAuthFlow]);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { code: 'not-configured', error: SUPABASE_CONFIGURATION_ERROR, success: false };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return makeAuthFailure(error, 'signOut');
      }

      await applySession(null);
      return { success: true };
    } catch {
      return {
        code: 'offline',
        error: 'We could not sign you out. Check your connection and try again.',
        success: false,
      };
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    authFlow,
    cancelAuthFlow,
    clearAuthFlow,
    completeConfirmation,
    hasCheckedInitialAuthLink: hasCheckedInitialUrl,
    initializationError,
    isConfigured: isSupabaseConfigured,
    isLoading,
    registerSignOutCleanup,
    requestPasswordReset,
    resendConfirmation,
    retryAuthFlow,
    retrySessionRestore: restoreSession,
    session,
    signIn,
    signOut,
    signUp,
    updateRecoveredPassword,
    user: session?.user ?? null,
  }), [
    authFlow,
    cancelAuthFlow,
    clearAuthFlow,
    completeConfirmation,
    hasCheckedInitialUrl,
    initializationError,
    isLoading,
    registerSignOutCleanup,
    requestPasswordReset,
    resendConfirmation,
    restoreSession,
    retryAuthFlow,
    session,
    signIn,
    signOut,
    signUp,
    updateRecoveredPassword,
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

function makeAuthFailure(error: AuthError, operation: AuthOperation): AuthActionFailure {
  return {
    code: getAuthFailureCode(error),
    error: getFriendlyAuthError(error, operation),
    success: false,
  };
}
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;
  retryAuthFlow: () => Promise<void>;
