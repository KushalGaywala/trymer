import { gridSlotId, parseGridSlot } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type Props = {
  /** Currently selected slot id (e.g. "r1c1") or null = hidden */
  value: string | null;
  gridCols: number;
  gridRows: number;
  onChange: (slot: string | null) => void;
  /**
   * Map of slot → count of OTHER components already in that slot.
   * Used to show occupancy badges (does NOT block selection).
   */
  occupancy?: Record<string, number>;
};

const MAX = 6;

export function GridPositionPicker({ value, gridCols, gridRows, onChange, occupancy = {} }: Props) {
  const displayCols = Math.min(gridCols, MAX);
  const displayRows = Math.min(gridRows, MAX);
  const cellSize = displayCols <= 3 && displayRows <= 3 ? 'w-8 h-8' : 'w-6 h-6';

  const rows = Array.from({ length: displayRows }, (_, r) =>
    Array.from({ length: displayCols }, (_, c) => {
      const slot = gridSlotId(r, c);
      const isSelected = value === slot;
      const count = occupancy[slot] ?? 0;   // other components here

      return (
        <button
          key={slot}
          type="button"
          title={count > 0 ? `${slot} — ${count} other component${count > 1 ? 's' : ''} here` : slot}
          onClick={() => onChange(isSelected ? null : slot)}
          className={cn(
            cellSize,
            'relative rounded border text-[9px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : count > 0
              ? 'border-primary/40 bg-primary/10 text-primary/70 hover:border-primary hover:bg-primary/20'
              : 'border-border bg-background hover:border-primary/70 hover:bg-primary/10'
          )}
          aria-pressed={isSelected}
          aria-label={`Grid position ${slot}`}
        >
          {isSelected && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="block h-2 w-2 rounded-full bg-current" />
            </span>
          )}
          {!isSelected && count > 0 && (
            <span className="absolute inset-0 flex items-center justify-center leading-none">
              +{count}
            </span>
          )}
        </button>
      );
    })
  );

  const clipped = gridCols > MAX || gridRows > MAX;

  const posLabel = value
    ? (() => {
        const p = parseGridSlot(value);
        return p ? `Row ${p.row + 1}, Col ${p.col + 1}` : value;
      })()
    : null;

  return (
    <div className="flex items-start gap-3">
      {/* Grid */}
      <div className="flex flex-col gap-1">
        {rows.map((cells, r) => (
          <div key={r} className="flex gap-1">{cells}</div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-1 pt-0.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'flex items-center gap-1 rounded border px-2 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background hover:border-primary/70 hover:bg-primary/10'
          )}
          aria-pressed={value === null}
        >
          <X className="h-3 w-3" />
          Hidden
        </button>

        {posLabel && (
          <span className="text-[10px] text-muted-foreground">{posLabel}</span>
        )}
        {clipped && (
          <span className="text-[10px] text-muted-foreground">Showing {MAX}×{MAX}</span>
        )}
      </div>
    </div>
  );
}
