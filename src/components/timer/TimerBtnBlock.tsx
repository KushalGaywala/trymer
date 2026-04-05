import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type TextSize } from '@/lib/app-settings';

type Align = 'left' | 'center' | 'right';

type Props = {
  btnType: 'start' | 'reset';
  isRunning: boolean;
  onClick: () => void;
  size: TextSize;
  align?: Align;
};

const sizeMap: Record<TextSize, string> = {
  sm:     'h-[28px] px-3 text-xs',
  normal: 'h-[35px] px-4 text-sm',
  lg:     'h-[40px] px-5 text-base',
  xl:     'h-[46px] px-6 text-lg',
};

const alignClass: Record<Align, string> = {
  left:   'self-start',
  center: 'self-center',
  right:  'self-end',
};

export function TimerBtnBlock({ btnType, isRunning, onClick, size, align = 'center' }: Props) {
  const cls = cn(sizeMap[size], alignClass[align]);

  if (btnType === 'start') {
    return (
      <Button
        onClick={onClick}
        className={cn(
          cls,
          isRunning
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-border bg-background/80 text-foreground hover:bg-muted'
        )}
      >
        {isRunning ? 'Stop' : 'Start'}
      </Button>
    );
  }

  return (
    <Button onClick={onClick} variant="outline" className={cn(cls, 'bg-background/80')}>
      Reset
    </Button>
  );
}
