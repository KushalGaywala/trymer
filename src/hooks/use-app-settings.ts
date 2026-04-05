import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type AppSettings,
  type ComponentId,
  type ComponentConfig,
  COMPONENT_IDS,
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

function save(s: AppSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch (e) { console.error('Failed to save', e); throw e; }
}

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaultAppSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setSettingsState(load()); setHydrated(true); }, []);

  const setSettings = useCallback(
    (next: AppSettings | ((p: AppSettings) => AppSettings)) => {
      setSettingsState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try { save(resolved); } catch { /* quota */ }
        return resolved;
      });
    },
    []
  );

  /**
   * Move a component to a new slot.
   * • If slot === current slot → no-op (reorder via reorderWithinSlot).
   * • Multiple components may share a slot — the moved component is appended
   *   at the end (max order + 1) in the target slot.
   * • Pass null to hide.
   */
  const moveComponent = useCallback(
    (id: ComponentId, slot: string | null) => {
      setSettings((prev) => {
        const current = prev.components[id].slot;
        if (slot === current) return prev;          // same slot → no-op

        const updated = { ...prev.components };

        if (slot !== null) {
          const maxOrder = (COMPONENT_IDS as readonly ComponentId[])
            .filter((cid) => cid !== id && updated[cid].slot === slot)
            .reduce((m, cid) => Math.max(m, updated[cid].order), -1);
          updated[id] = { ...updated[id], slot, order: maxOrder + 1 };
        } else {
          updated[id] = { ...updated[id], slot: null, order: 0 };
        }

        return { ...prev, components: updated };
      });
    },
    [setSettings]
  );

  /** Swap ordering with the previous or next component in the same slot. */
  const reorderWithinSlot = useCallback(
    (id: ComponentId, direction: 'up' | 'down') => {
      setSettings((prev) => {
        const slot = prev.components[id].slot;
        if (!slot) return prev;

        const peers = (COMPONENT_IDS as readonly ComponentId[])
          .filter((cid) => prev.components[cid].slot === slot)
          .sort((a, b) => prev.components[a].order - prev.components[b].order);

        const idx = peers.indexOf(id);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= peers.length) return prev;

        const other = peers[swapIdx];
        const updated = { ...prev.components };
        const myOrder = updated[id].order;
        updated[id]    = { ...updated[id],    order: updated[other].order };
        updated[other] = { ...updated[other], order: myOrder };
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

  /** Set the flex-direction for a slot. */
  const setSlotDirection = useCallback(
    (slot: string, dir: 'column' | 'row') => {
      setSettings((prev) => ({
        ...prev,
        slotDirections: { ...prev.slotDirections, [slot]: dir },
      }));
    },
    [setSettings]
  );

  const resetToDefaults = useCallback(() => setSettings(defaultAppSettings), [setSettings]);

  return useMemo(
    () => ({ settings, setSettings, moveComponent, reorderWithinSlot, updateComponent, setSlotDirection, resetToDefaults, hydrated }),
    [settings, setSettings, moveComponent, reorderWithinSlot, updateComponent, setSlotDirection, resetToDefaults, hydrated]
  );
}
