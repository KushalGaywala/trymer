import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Props = {
  timerContext: string;
  minuteCount: number;
  secondCount: number;
  pad: (n: number) => string;
  titleOverride: string;
  size: TextSize;
};

export function TimerFaceBlock({
  timerContext,
  minuteCount,
  secondCount,
  pad,
  titleOverride,
  size,
}: Props) {
  const title = titleOverride.trim() || timerContext;
  const titleCls = sizeClass(size, 'title');
  const hero = sizeClass(size, 'hero');

  return (
    <main className="flex flex-col items-center justify-center text-center w-full min-h-0">
      <h3 className={cn('mb-2 text-muted-foreground', titleCls)}>{title}</h3>
      <h1 className={cn('font-bold text-foreground tabular-nums', hero)}>
        {pad(minuteCount)}:{pad(secondCount)}
      </h1>
    </main>
  );
}
