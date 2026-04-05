import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type AppSettings,
  type ComponentId,
  type ComponentConfig,
  STORAGE_KEY,
  defaultAppSettings,
  mergeWithDefaults,
} from '@/lib/app-settings';

function load(): AppSettings {
  if (typeof window === 'undefined') return defaultAppSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppSettings;
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultAppSettings;
  }
}

function save(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
    throw e;
  }
}

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaultAppSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(load());
    setHydrated(true);
  }, []);

  const setSettings = useCallback(
    (next: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      setSettingsState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          save(resolved);
        } catch {
          /* quota — caller may toast */
        }
        return resolved;
      });
    },
    []
  );

  /** Move a component to a new slot (or null to hide it). */
  const moveComponent = useCallback(
    (id: ComponentId, slot: string | null) => {
      setSettings((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [id]: { ...prev.components[id], slot },
        },
      }));
    },
    [setSettings]
  );

  /** Update any field of a component's config. */
  const updateComponent = useCallback(
    (id: ComponentId, patch: Partial<ComponentConfig>) => {
      setSettings((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [id]: { ...prev.components[id], ...patch },
        },
      }));
    },
    [setSettings]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(defaultAppSettings);
  }, [setSettings]);

  return useMemo(
    () => ({
      settings,
      setSettings,
      moveComponent,
      updateComponent,
      resetToDefaults,
      hydrated,
    }),
    [settings, setSettings, moveComponent, updateComponent, resetToDefaults, hydrated]
  );
}
