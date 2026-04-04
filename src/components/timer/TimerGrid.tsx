import { type ReactNode } from 'react';
import { GRID_SLOTS, type AppSettings, type GridSlot } from '@/lib/app-settings';
import { cn } from '@/lib/utils';

type BlockNodes = {
  studyInputs: ReactNode;
  timerFace: ReactNode;
  hero: ReactNode;
  themeToggle: ReactNode;
};

type Props = {
  placement: AppSettings['placement'];
  blocks: BlockNodes;
};

function buildSlotMap(placement: AppSettings['placement'], blocks: BlockNodes): Record<GridSlot, ReactNode | null> {
  const out: Record<GridSlot, ReactNode | null> = {
    TL: null,
    T: null,
    TR: null,
    L: null,
    C: null,
    R: null,
    BL: null,
    B: null,
    BR: null,
  };
  const put = (slot: GridSlot | null, node: ReactNode) => {
    if (!slot) return;
    out[slot] = node;
  };
  put(placement.studyInputs, blocks.studyInputs);
  put(placement.timerFace, blocks.timerFace);
  put(placement.hero, blocks.hero);
  put(placement.themeToggle, blocks.themeToggle);
  return out;
}

export function TimerGrid({ placement, blocks }: Props) {
  const map = buildSlotMap(placement, blocks);

  return (
    <div
      className={cn('grid min-h-screen w-full flex-1 gap-2 p-3 md:p-4')}
      style={{
        gridTemplateAreas: `"TL T TR" "L C R" "BL B BR"`,
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
      }}
    >
      {GRID_SLOTS.map((slot) => (
        <div
          key={slot}
          className="flex min-h-0 min-w-0 items-center justify-center overflow-auto p-2"
          style={{ gridArea: slot }}
        >
          {map[slot]}
        </div>
      ))}
    </div>
  );
}
