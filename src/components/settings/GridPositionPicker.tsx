import { gridSlotId, parseGridSlot } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type Props = {
  /** Currently selected slot id (e.g. "r1c1") or null = hidden */
  value: string | null;
  gridCols: number;
  gridRows: number;
  onChange: (slot: string | null) => void;
  /** Slots occupied by *other* components — shown dimmed */
  takenSlots?: string[];
  /** Label for the hidden/none button */
  noneLabel?: string;
};

// Cap display to 6x6 to avoid overflow
const MAX_DISPLAY = 6;

export function GridPositionPicker({
  value,
  gridCols,
  gridRows,
  onChange,
  takenSlots = [],
  noneLabel = 'Hidden',
}: Props) {
  const displayCols = Math.min(gridCols, MAX_DISPLAY);
  const displayRows = Math.min(gridRows, MAX_DISPLAY);

  const cellSize = displayCols <= 3 && displayRows <= 3 ? 'w-8 h-8' : 'w-6 h-6';

  const rows: React.ReactNode[] = [];
  for (let r = 0; r < displayRows; r++) {
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < displayCols; c++) {
      const slot = gridSlotId(r, c);
      const isSelected = value === slot;
      const isTaken = takenSlots.includes(slot) && !isSelected;

      cells.push(
        <button
          key={slot}
          type="button"
          title={slot}
          onClick={() => onChange(isSelected ? null : slot)}
          className={cn(
            cellSize,
            'rounded border text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : isTaken
              ? 'border-border/60 bg-muted/40 text-muted-foreground/50 hover:border-primary/60 hover:bg-primary/10'
              : 'border-border bg-background hover:border-primary/70 hover:bg-primary/10'
          )}
          aria-pressed={isSelected}
          aria-label={`Grid position ${slot}`}
        >
          {/* Show a dot if selected */}
          {isSelected && <span className="block h-2 w-2 rounded-full bg-current mx-auto" />}
        </button>
      );
    }
    rows.push(
      <div key={r} className="flex gap-1">
        {cells}
      </div>
    );
  }

  // Show note if grid is larger than display cap
  const clipped = gridCols > MAX_DISPLAY || gridRows > MAX_DISPLAY;

  // Show current position label
  const posLabel = value ? (() => {
    const parsed = parseGridSlot(value);
    if (!parsed) return value;
    return `Row ${parsed.row + 1}, Col ${parsed.col + 1}`;
  })() : null;

  return (
    <div className="flex items-start gap-3">
      {/* Grid visual */}
      <div className="flex flex-col gap-1">{rows}</div>

      <div className="flex flex-col gap-1 pt-0.5">
        {/* Hidden button */}
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
          {noneLabel}
        </button>

        {posLabel && (
          <span className="text-[10px] text-muted-foreground leading-tight">{posLabel}</span>
        )}

        {clipped && (
          <span className="text-[10px] text-muted-foreground leading-tight">
            Grid capped at {MAX_DISPLAY}×{MAX_DISPLAY}
          </span>
        )}
      </div>
    </div>
  );
}
