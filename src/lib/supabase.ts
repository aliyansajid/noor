import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** True when both env vars are present. When false, the app runs without auth
 * (onboarding → straight to the app) so nothing breaks before creds are set. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * The Supabase client. Sessions persist in AsyncStorage and auto-refresh.
 * `detectSessionInUrl` is off — this is native, not a web redirect page; we
 * complete OAuth manually via exchangeCodeForSession.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_KEY as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // PKCE: the redirect returns `?code=` which we exchange for a session.
        flowType: 'pkce',
      },
    })
  : null;

// Refresh the session while the app is foregrounded; pause it in the background.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
