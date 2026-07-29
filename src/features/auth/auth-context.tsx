import { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Lets the auth browser tab close and hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

// Where Google/Supabase send the user back to. Must be added to Supabase Auth →
// URL Configuration → Redirect URLs. In a dev/standalone build this is
// `noor://auth-callback`; Expo Go can't receive a custom scheme, so OAuth needs
// a dev build.
const redirectTo = AuthSession.makeRedirectUri({ scheme: 'noor', path: 'auth-callback' });

type AuthContextValue = {
  session: Session | null;
  /** True while the persisted session is being restored on launch. */
  loading: boolean;
  /** False when Supabase env vars are missing — the app then runs without auth. */
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Read params from a URL's query string and its #fragment (OAuth may use either). */
function paramsFromUrl(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const { queryParams } = Linking.parse(url);
  for (const [k, v] of Object.entries(queryParams ?? {})) {
    if (typeof v === 'string') out[k] = v;
  }
  const hash = url.indexOf('#');
  if (hash >= 0) {
    for (const pair of url.slice(hash + 1).split('&')) {
      const [k, v] = pair.split('=');
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  return out;
}

/** Establish a session from the OAuth redirect URL — PKCE (`code`) or, as a
 * fallback, implicit (`access_token`/`refresh_token`). Throws on provider errors. */
async function completeFromUrl(url: string) {
  if (!supabase) return;
  const p = paramsFromUrl(url);
  if (p.error_description || p.error) {
    throw new Error(p.error_description || p.error);
  }
  if (p.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(p.code);
    if (error) throw error;
  } else if (p.access_token && p.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: p.access_token,
      refresh_token: p.refresh_token,
    });
    if (error) throw error;
  } else if (__DEV__) {
    console.warn('[Noor auth] redirect had no code/token', Object.keys(p));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Keep the profile row fresh with the Google identity (name, avatar, email).
  useEffect(() => {
    const user = session?.user;
    if (!supabase || !user) return;
    const meta = user.user_metadata ?? {};
    supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: meta.full_name ?? meta.name ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      })
      .then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign-in.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (__DEV__) console.log('[Noor auth] redirect result:', result.type);
    if (result.type === 'success' && result.url) {
      await completeFromUrl(result.url);
    }
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, configured: isSupabaseConfigured, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
