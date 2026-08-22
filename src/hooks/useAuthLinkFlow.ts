import type { AuthChangeEvent } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AuthLinkPurpose,
  isLikelyNetworkAuthError,
  parseAuthLink,
  rememberProcessedAuthLink,
} from '@/domain/authLinks';
import { supabase } from '@/services/supabase';

export type AuthFlowState =
  | { kind: 'idle'; status: 'idle' }
  | {
      kind: AuthLinkPurpose;
      status: 'invalid' | 'network-error' | 'processing' | 'ready' | 'success';
    };

const INITIAL_AUTH_FLOW: AuthFlowState = { kind: 'idle', status: 'idle' };
export function useAuthLinkFlow() {
  const [authFlow, setAuthFlow] = useState<AuthFlowState>(INITIAL_AUTH_FLOW);
  const [hasCheckedInitialUrl, setHasCheckedInitialUrl] = useState(false);
  const authFlowRef = useRef<AuthFlowState>(INITIAL_AUTH_FLOW);
  const retryUrlRef = useRef<string | null>(null);
  const processedLinksRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  const commitFlow = useCallback((nextFlow: AuthFlowState) => {
    authFlowRef.current = nextFlow;
    if (mountedRef.current) setAuthFlow(nextFlow);
  }, []);

  const processAuthLink = useCallback(async (url: string, retry = false) => {
    const parsedLink = parseAuthLink(url);
    if (!parsedLink.ok) {
      if (parsedLink.purpose) {
        retryUrlRef.current = null;
        commitFlow({ kind: parsedLink.purpose, status: 'invalid' });
      }
      return;
    }

    if (
      !retry
      && !rememberProcessedAuthLink(processedLinksRef.current, parsedLink.fingerprint)
    ) return;
    if (retry) rememberProcessedAuthLink(processedLinksRef.current, parsedLink.fingerprint);

    retryUrlRef.current = url;
    commitFlow({ kind: parsedLink.purpose, status: 'processing' });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(parsedLink.code);
      if (error) throw error;

      retryUrlRef.current = null;
      commitFlow({
        kind: parsedLink.purpose,
        status: parsedLink.purpose === 'recovery' ? 'ready' : 'success',
      });
    } catch (error) {
      const isNetworkError = isLikelyNetworkAuthError(error);
      commitFlow({
        kind: parsedLink.purpose,
        status: isNetworkError ? 'network-error' : 'invalid',
      });
      if (isNetworkError) {
        processedLinksRef.current.delete(parsedLink.fingerprint);
      } else {
        retryUrlRef.current = null;
      }
    }
  }, [commitFlow]);

  useEffect(() => {
    mountedRef.current = true;
    void Linking.getInitialURL()
      .then((url) => {
        if (url && mountedRef.current) void processAuthLink(url);
      })
      .finally(() => {
        if (mountedRef.current) setHasCheckedInitialUrl(true);
      });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processAuthLink(url);
    });

    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [processAuthLink]);

  const handleAuthEvent = useCallback((event: AuthChangeEvent) => {
    if (event === 'PASSWORD_RECOVERY') {
      retryUrlRef.current = null;
      commitFlow({ kind: 'recovery', status: 'ready' });
    }
  }, [commitFlow]);

  const retryAuthFlow = useCallback(async () => {
    const retryUrl = retryUrlRef.current;
    if (retryUrl) await processAuthLink(retryUrl, true);
  }, [processAuthLink]);

  const clearAuthFlow = useCallback(() => {
    retryUrlRef.current = null;
    commitFlow(INITIAL_AUTH_FLOW);
  }, [commitFlow]);

  return {
    authFlow,
    authFlowRef,
    clearAuthFlow,
    hasCheckedInitialUrl,
    handleAuthEvent,
    retryAuthFlow,
  };
}
