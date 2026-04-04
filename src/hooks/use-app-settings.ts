import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type AppSettings,
  type BlockId,
  type GridSlot,
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

  const setSettings = useCallback((next: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    setSettingsState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        save(resolved);
      } catch {
        /* quota — caller may toast */
      }
      return resolved;
    });
  }, []);

  const updatePlacement = useCallback((block: BlockId, slot: GridSlot | null) => {
    setSettings((prev) => {
      const next = { ...prev, placement: { ...prev.placement } };
      const previousOwner = (Object.entries(next.placement) as [BlockId, GridSlot | null][]).find(
        ([id, s]) => id !== block && s === slot && slot !== null
      );
      if (previousOwner) {
        next.placement[previousOwner[0]] = prev.placement[block];
      }
      next.placement[block] = slot;
      return next;
    });
  }, [setSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultAppSettings);
  }, [setSettings]);

  return useMemo(
    () => ({
      settings,
      setSettings,
      updatePlacement,
      resetToDefaults,
      hydrated,
    }),
    [settings, setSettings, updatePlacement, resetToDefaults, hydrated]
  );
}
