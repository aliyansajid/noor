import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import {
  DEFAULT_SETTINGS,
  loadSettings,
  persistSettings,
  setSnapshot,
  Settings,
} from '@/features/settings/settings';

// Set once the intro has been seen (finished or skipped); gates the launch route.
const ONBOARDED_KEY = 'noor.onboarded';

type SettingsContextValue = {
  settings: Settings;
  /** Merge a partial update; persists and updates the module snapshot. */
  update: (patch: Partial<Settings>) => void;
  /** True once persisted state has loaded (before this, defaults are shown). */
  loaded: boolean;
  /** Whether the user has already been through onboarding. */
  onboarded: boolean;
  /** Mark onboarding as done (persists); call on finish or skip. */
  completeOnboarding: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadSettings(), AsyncStorage.getItem(ONBOARDED_KEY)]).then(([s, flag]) => {
      setSnapshot(s);
      setSettings(s);
      setOnboarded(flag === '1');
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      setSnapshot(next);
      persistSettings(next);
      return next;
    });
  }, []);

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
