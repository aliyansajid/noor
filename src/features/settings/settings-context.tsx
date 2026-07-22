import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import {
  DEFAULT_SETTINGS,
  getSettings,
  loadSettings,
  persistSettings,
  setSnapshot,
  Settings,
} from '@/features/settings/settings';
import { supabase } from '@/lib/supabase';

// Set once the intro has been seen (finished or skipped); gates the launch route.
const ONBOARDED_KEY = 'noor.onboarded';

type SettingsContextValue = {
  settings: Settings;
  /** Merge a partial update; persists locally, syncs to Supabase, updates the snapshot. */
  update: (patch: Partial<Settings>) => void;
  /** True once persisted state has loaded (before this, defaults are shown). */
  loaded: boolean;
  /** Whether the user has already been through onboarding. */
  onboarded: boolean;
  /** Mark onboarding as done (persists); call on finish or skip. */
  completeOnboarding: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Push the whole settings object to the user's row (fire-and-forget). */
function pushRemote(userId: string, next: Settings) {
  supabase
    ?.from('user_settings')
    .upsert({ user_id: userId, preferences: next })
    .then(() => {});
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load locally-cached settings first (instant, offline-friendly).
  useEffect(() => {
    Promise.all([loadSettings(), AsyncStorage.getItem(ONBOARDED_KEY)]).then(([s, flag]) => {
      setSnapshot(s);
      setSettings(s);
      setOnboarded(flag === '1');
      setLoaded(true);
    });
  }, []);

  // On sign-in, the cloud is the source of truth: pull the user's saved
  // preferences (or seed the row from local on first sign-in).
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();
      if (!active) return;
      if (data?.preferences) {
        const merged = { ...DEFAULT_SETTINGS, ...(data.preferences as Partial<Settings>) };
        setSnapshot(merged);
        setSettings(merged);
        persistSettings(merged);
      } else {
        pushRemote(userId, getSettings());
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        setSnapshot(next);
        persistSettings(next);
        if (userId) pushRemote(userId, next);
        return next;
      });
    },
    [userId],
  );

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, loaded, onboarded, completeOnboarding }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
