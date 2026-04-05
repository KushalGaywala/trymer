import { type ReactNode, useState, useCallback, useRef } from 'react';
import { type ComponentId, gridSlotId } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

export type ComponentEntry = {
  id: ComponentId;
  node: ReactNode;
};

type Props = {
  cols: number;
  rows: number;
  /** Maps slot id → array of component entries that live in that slot */
  slotMap: Record<string, ComponentEntry[]>;
  onMove: (id: ComponentId, newSlot: string) => void;
};

function DraggableItem({
  entry,
  onDragStart,
  onDragEnd,
}: {
  entry: ComponentEntry;
  onDragStart: (id: ComponentId) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entry.id);
        onDragStart(entry.id);
      }}
      onDragEnd={onDragEnd}
      className="group relative w-full cursor-grab active:cursor-grabbing active:opacity-50"
    >
      {/* Drag handle hint */}
      <div className="pointer-events-none absolute -right-1 -top-1 z-10 opacity-0 transition-opacity group-hover:opacity-40">
        <GripVertical className="h-3 w-3 text-current" />
      </div>
      {entry.node}
    </div>
  );
}

export function TimerGrid({ cols, rows, slotMap, onMove }: Props) {
  const [draggedId, setDraggedId] = useState<ComponentId | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  // Debounce dragLeave to avoid flicker when moving between child elements
  const dragLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = useCallback((id: ComponentId) => {
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverSlot(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, slot: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragLeaveTimer.current) {
        clearTimeout(dragLeaveTimer.current);
        dragLeaveTimer.current = null;
      }
      setDragOverSlot(slot);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    dragLeaveTimer.current = setTimeout(() => {
      setDragOverSlot(null);
    }, 50);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, slot: string) => {
      e.preventDefault();
      const id = (e.dataTransfer.getData('text/plain') || draggedId) as ComponentId | null;
      if (id) onMove(id, slot);
      setDraggedId(null);
      setDragOverSlot(null);
    },
    [draggedId, onMove]
  );

  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slot = gridSlotId(r, c);
      const entries = slotMap[slot] ?? [];
      const isOver = dragOverSlot === slot;
      const isDragging = draggedId !== null;

      cells.push(
        <div
          key={slot}
          className={cn(
            'flex min-h-0 min-w-0 flex-col items-center justify-center gap-2 rounded-lg p-2 transition-all duration-150',
            isDragging && 'ring-1 ring-border/30',
            isOver && isDragging && 'bg-accent/25 ring-2 ring-primary/50 scale-[1.01]'
          )}
          style={{ gridRow: r + 1, gridColumn: c + 1 }}
          onDragOver={(e) => handleDragOver(e, slot)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, slot)}
        >
          {entries.map((entry) => (
            <DraggableItem
              key={entry.id}
              entry={entry}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
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
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {cells}
    </div>
  );
}
