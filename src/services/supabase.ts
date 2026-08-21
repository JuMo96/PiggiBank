import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const configuredAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  configuredUrl
  && configuredAnonKey
  && isValidSupabaseUrl(configuredUrl),
);

const clientUrl = isSupabaseConfigured
  ? configuredUrl!
  : 'https://supabase-not-configured.invalid';
const clientAnonKey = isSupabaseConfigured
  ? configuredAnonKey!
  : 'supabase-not-configured';

export class SupabaseConfigurationError extends Error {
  constructor() {
    super('Supabase has not been configured for this build.');
    this.name = 'SupabaseConfigurationError';
  }
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) throw new SupabaseConfigurationError();
}

export const supabase = createClient<Database>(clientUrl, clientAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
    persistSession: true,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (!isSupabaseConfigured) return;

    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}
