import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import {
  DEFAULT_SETTINGS,
  loadSettings,
  persistSettings,
  setSnapshot,
  Settings,
} from '@/features/settings/settings';

type SettingsContextValue = {
  settings: Settings;
  /** Merge a partial update; persists and updates the module snapshot. */
  update: (patch: Partial<Settings>) => void;
  /** True once persisted settings have loaded (before this, defaults are shown). */
  loaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSnapshot(s);
      setSettings(s);
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

  return (
    <SettingsContext.Provider value={{ settings, update, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
