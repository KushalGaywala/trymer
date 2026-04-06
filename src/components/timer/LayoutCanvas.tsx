import {
  type ReactNode,
  type CSSProperties,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { type ComponentId, type ComponentConfig, COMPONENT_IDS, LAYOUT_XY_CLAMP } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export type ComponentEntry = {
  id: ComponentId;
  node: ReactNode;
  wrapperStyle?: CSSProperties;
  align?: 'left' | 'center' | 'right';
};

const alignSelf: Record<'left' | 'center' | 'right', string> = {
  left:   'items-start text-left  self-start',
  center: 'items-center text-center',
  right:  'items-end   text-right self-end',
};

type Props = {
  components: Record<ComponentId, ComponentConfig>;
  entries: Record<ComponentId, ComponentEntry>;
  layoutEditMode: boolean;
  onPositionChange: (id: ComponentId, x: number, y: number) => void;
  onStackAdjust: (id: ComponentId, direction: 'forward' | 'backward') => void;
};

export function LayoutCanvas({
  components,
  entries,
  layoutEditMode,
  onPositionChange,
  onStackAdjust,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<{ id: ComponentId; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{
    id: ComponentId;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [preview, setPreview] = useState<{ id: ComponentId; x: number; y: number } | null>(null);

  const clampPct = useCallback((x: number, y: number) => ({
    x: Math.min(LAYOUT_XY_CLAMP.max, Math.max(LAYOUT_XY_CLAMP.min, x)),
    y: Math.min(LAYOUT_XY_CLAMP.max, Math.max(LAYOUT_XY_CLAMP.min, y)),
  }), []);

  const visibleSorted = useMemo(
    () =>
      (COMPONENT_IDS as readonly ComponentId[])
        .filter((id) => !components[id].hidden)
        .sort((a, b) => components[a].zIndex - components[b].zIndex),
    [components]
  );

  const stackIndex = useCallback(
    (id: ComponentId) => visibleSorted.indexOf(id),
    [visibleSorted]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - drag.startClientX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startClientY) / rect.height) * 100;
      const { x: nx, y: ny } = clampPct(drag.startX + dx, drag.startY + dy);
      const next = { id: drag.id, x: nx, y: ny };
      previewRef.current = next;
      setPreview(next);
    },
    [drag, clampPct]
  );

  const endDrag = useCallback(() => {
    const p = previewRef.current;
    if (p) onPositionChange(p.id, p.x, p.y);
    previewRef.current = null;
    setDrag(null);
    setPreview(null);
  }, [onPositionChange]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [drag, onPointerMove, endDrag]);

  const startDrag = useCallback(
    (e: React.PointerEvent, id: ComponentId) => {
      if (!layoutEditMode || !containerRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const cfg = components[id];
      const { x: px, y: py } = clampPct(cfg.x, cfg.y);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const initial = { id, x: px, y: py };
      previewRef.current = initial;
      setDrag({
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: px,
        startY: py,
      });
      setPreview(initial);
    },
    [layoutEditMode, components, clampPct]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative min-h-screen w-full flex-1',
        layoutEditMode && 'ring-1 ring-dashed ring-border/60'
      )}
    >
      {layoutEditMode && (
        <div className="pointer-events-none absolute left-3 top-14 z-[4] rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          Edit layout — drag the handle on each block
        </div>
      )}

      {(COMPONENT_IDS as readonly ComponentId[]).map((id) => {
        const cfg = components[id];
        if (cfg.hidden) return null;

        const entry = entries[id];
        if (!entry) return null;

        const pos =
          preview?.id === id ? preview : { x: cfg.x, y: cfg.y };
        const align = entry.align ?? 'center';
        const si = stackIndex(id);
        const canSendBack = si > 0;
        const canBringFwd = si >= 0 && si < visibleSorted.length - 1;

        return (
          <div
            key={id}
            className={cn('absolute flex max-w-[min(100vw,480px)] flex-col', alignSelf[align])}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: cfg.zIndex + 2,
            }}
          >
            <div
              className="relative flex flex-col"
              style={entry.wrapperStyle}
            >
              {layoutEditMode && (
                <div className="mb-1 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    aria-label="Drag to move"
                    className="cursor-grab touch-manipulation rounded border border-border/80 bg-background/90 p-1.5 shadow-sm active:cursor-grabbing"
                    onPointerDown={(e) => startDrag(e, id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    aria-label="Send backward"
                    disabled={!canSendBack}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStackAdjust(id, 'backward');
                    }}
                    className="rounded border border-border/80 bg-background/90 p-1 shadow-sm disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bring forward"
                    disabled={!canBringFwd}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStackAdjust(id, 'forward');
                    }}
                    className="rounded border border-border/80 bg-background/90 p-1 shadow-sm disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {entry.node}
            </div>
          </div>
        );
      })}
    </div>
  );
}
