import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Props = {
  timerContext: string;
  minuteCount: number;
  secondCount: number;
  pad: (n: number) => string;
  titleOverride: string;
  size: TextSize;
  color?: string; // 'auto' or CSS color
};

export function TimerFaceBlock({
  timerContext,
  minuteCount,
  secondCount,
  pad,
  titleOverride,
  size,
  color,
}: Props) {
  const title = titleOverride.trim() || timerContext;
  const titleCls = sizeClass(size, 'title');
  const hero = sizeClass(size, 'hero');
  const customColor = color && color !== 'auto' ? color : undefined;

  return (
    <div
      className="flex w-full min-h-0 flex-col items-center justify-center text-center"
      style={customColor ? { color: customColor } : undefined}
    >
      <h3
        className={cn('mb-2 text-muted-foreground', titleCls)}
        style={customColor ? { color: customColor } : undefined}
      >
        {title}
      </h3>
      <h1
        className={cn('font-bold tabular-nums', hero)}
        style={customColor ? { color: customColor } : { color: undefined }}
      >
        {pad(minuteCount)}:{pad(secondCount)}
      </h1>
    </div>
  );
}
