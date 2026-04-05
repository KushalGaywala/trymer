import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Align = 'left' | 'center' | 'right';

type Props = {
  timerContext: string;
  minuteCount: number;
  secondCount: number;
  pad: (n: number) => string;
  titleOverride: string;
  size: TextSize;
  align?: Align;
};

const flexAlign: Record<Align, string> = {
  left:   'items-start',
  center: 'items-center',
  right:  'items-end',
};
const textAlign: Record<Align, string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
};

export function TimerFaceBlock({
  timerContext,
  minuteCount,
  secondCount,
  pad,
  titleOverride,
  size,
  align = 'center',
}: Props) {
  const title = titleOverride.trim() || timerContext;
  const titleCls = sizeClass(size, 'title');
  const hero = sizeClass(size, 'hero');

  return (
    <div
      className={cn(
        'flex w-full min-h-0 flex-col',
        flexAlign[align],
        textAlign[align]
      )}
    >
      <h3 className={cn('mb-2 text-muted-foreground', titleCls)}>{title}</h3>
      <h1 className={cn('font-bold tabular-nums', hero)}>
        {pad(minuteCount)}:{pad(secondCount)}
      </h1>
    </div>
  );
}
