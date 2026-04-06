import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type AppSettings,
  type ComponentId,
  type ComponentConfig,
  COMPONENT_IDS,
  STORAGE_KEY,
  defaultAppSettings,
  mergeWithDefaults,
  LAYOUT_XY_CLAMP,
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

function save(s: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('Failed to save', e);
    throw e;
  }
}

function clampXY(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(LAYOUT_XY_CLAMP.max, Math.max(LAYOUT_XY_CLAMP.min, x)),
    y: Math.min(LAYOUT_XY_CLAMP.max, Math.max(LAYOUT_XY_CLAMP.min, y)),
  };
}

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaultAppSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(load());
    setHydrated(true);
  }, []);

  const setSettings = useCallback((next: AppSettings | ((p: AppSettings) => AppSettings)) => {
    setSettingsState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        save(resolved);
      } catch {
        /* quota */
      }
      return resolved;
    });
  }, []);

  /** Update position as percent of canvas (center anchor). Values are clamped. */
  const setComponentPosition = useCallback(
    (id: ComponentId, x: number, y: number) => {
      const { x: cx, y: cy } = clampXY(x, y);
      setSettings((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [id]: { ...prev.components[id], x: cx, y: cy, hidden: false },
        },
      }));
    },
    [setSettings]
  );

  /** Swap z-order with the next component above or below in stack order (visible only). */
  const adjustStackOrder = useCallback(
    (id: ComponentId, direction: 'forward' | 'backward') => {
      setSettings((prev) => {
        const visible = (COMPONENT_IDS as readonly ComponentId[]).filter(
          (cid) => !prev.components[cid].hidden
        );
        const sorted = [...visible].sort(
          (a, b) => prev.components[a].zIndex - prev.components[b].zIndex
        );
        const idx = sorted.indexOf(id);
        if (idx < 0) return prev;
        const swapIdx = direction === 'forward' ? idx + 1 : idx - 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

        const other = sorted[swapIdx];
        const updated = { ...prev.components };
        const za = updated[id].zIndex;
        const zb = updated[other].zIndex;
        updated[id] = { ...updated[id], zIndex: zb };
        updated[other] = { ...updated[other], zIndex: za };
        return { ...prev, components: updated };
      });
    },
    [setSettings]
  );

  /** Update any style/config field of a component. */
  const updateComponent = useCallback(
    (id: ComponentId, patch: Partial<ComponentConfig>) => {
      setSettings((prev) => ({
        ...prev,
        components: { ...prev.components, [id]: { ...prev.components[id], ...patch } },
      }));
    },
    [setSettings]
  );

  const resetToDefaults = useCallback(() => setSettings(defaultAppSettings), [setSettings]);

  return useMemo(
    () => ({
      settings,
      setSettings,
      setComponentPosition,
      adjustStackOrder,
      updateComponent,
      resetToDefaults,
      hydrated,
    }),
    [settings, setSettings, setComponentPosition, adjustStackOrder, updateComponent, resetToDefaults, hydrated]
  );
}
