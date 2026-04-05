import { type ReactNode, type CSSProperties, useState, useCallback, useRef } from 'react';
import { type ComponentId, gridSlotId } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export type ComponentEntry = {
  id: ComponentId;
  node: ReactNode;
  wrapperStyle?: CSSProperties;
  align?: 'left' | 'center' | 'right';
};

type Props = {
  cols: number;
  rows: number;
  /** slot → ordered ComponentEntry[] (already sorted by caller) */
  slotMap: Record<string, ComponentEntry[]>;
  /** flex direction per slot — 'column' = top→bottom, 'row' = left→right */
  slotDirections: Record<string, 'column' | 'row'>;
  onMove: (id: ComponentId, newSlot: string) => void;
  onReorder: (id: ComponentId, direction: 'up' | 'down') => void;
};

const alignSelf: Record<'left' | 'center' | 'right', string> = {
  left:   'items-start text-left  self-start',
  center: 'items-center text-center',
  right:  'items-end   text-right self-end',
};

function DraggableItem({
  entry,
  isFirst,
  isLast,
  showReorder,
  onDragStart,
  onDragEnd,
  onReorder,
}: {
  entry: ComponentEntry;
  isFirst: boolean;
  isLast: boolean;
  showReorder: boolean;
  onDragStart: (id: ComponentId) => void;
  onDragEnd: () => void;
  onReorder: (dir: 'up' | 'down') => void;
}) {
  const align = entry.align ?? 'center';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entry.id);
        onDragStart(entry.id);
      }}
      onDragEnd={onDragEnd}
      style={entry.wrapperStyle}
      className={cn(
        'group relative w-full cursor-grab active:cursor-grabbing active:opacity-50',
        'flex flex-col',
        alignSelf[align]
      )}
    >
      {/* Drag hint */}
      <div className="pointer-events-none absolute -right-1 -top-1 z-10 opacity-0 transition-opacity group-hover:opacity-30">
        <GripVertical className="h-3 w-3 text-current" />
      </div>

      {/* Up / down reorder buttons — only when slot has multiple components */}
      {showReorder && (
        <div
          className="absolute -left-5 top-1/2 z-20 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-70"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onReorder('up'); }}
            className="rounded bg-background/80 p-0.5 hover:bg-accent disabled:opacity-20"
            aria-label="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onReorder('down'); }}
            className="rounded bg-background/80 p-0.5 hover:bg-accent disabled:opacity-20"
            aria-label="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}

      {entry.node}
    </div>
  );
}

export function TimerGrid({ cols, rows, slotMap, slotDirections, onMove, onReorder }: Props) {
  const [draggedId, setDraggedId] = useState<ComponentId | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDragStart = useCallback((id: ComponentId) => setDraggedId(id), []);
  const onDragEnd   = useCallback(() => { setDraggedId(null); setDragOverSlot(null); }, []);

  const onDragOver = useCallback((e: React.DragEvent, slot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    setDragOverSlot(slot);
  }, []);

  const onDragLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setDragOverSlot(null), 60);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, slot: string) => {
    e.preventDefault();
    const id = (e.dataTransfer.getData('text/plain') || draggedId) as ComponentId | null;
    if (id) onMove(id, slot);
    setDraggedId(null); setDragOverSlot(null);
  }, [draggedId, onMove]);

  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slot = gridSlotId(r, c);
      const entries = slotMap[slot] ?? [];
      const dir = slotDirections[slot] ?? 'column';
      const isOver    = dragOverSlot === slot;
      const isDragging = draggedId !== null;
      const multi = entries.length > 1;

      cells.push(
        <div
          key={slot}
          className={cn(
            'flex min-h-0 min-w-0 items-center justify-center gap-2 rounded-lg p-2 transition-all duration-150',
            dir === 'column' ? 'flex-col' : 'flex-row flex-wrap',
            isDragging && 'ring-1 ring-border/30',
            isOver && isDragging && 'bg-accent/25 ring-2 ring-primary/50 scale-[1.01]'
          )}
          style={{ gridRow: r + 1, gridColumn: c + 1 }}
          onDragOver={(e) => onDragOver(e, slot)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, slot)}
        >
          {entries.map((entry, idx) => (
            <DraggableItem
              key={entry.id}
              entry={entry}
              isFirst={idx === 0}
              isLast={idx === entries.length - 1}
              showReorder={multi}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onReorder={(dir) => onReorder(entry.id, dir)}
            />
          ))}
        </div>
      );
    }
  }

  return (
    <div
      className="grid min-h-screen w-full flex-1 gap-2 p-3 md:p-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {cells}
    </div>
  );
}
