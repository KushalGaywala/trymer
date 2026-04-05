import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Props = {
  btnType: 'start' | 'reset';
  isRunning: boolean;
  onClick: () => void;
  color?: string; // 'auto' or CSS color
  size: TextSize;
};

export function TimerBtnBlock({ btnType, isRunning, onClick, color, size }: Props) {
  const customColor = color && color !== 'auto' ? color : undefined;
  const body = sizeClass(size, 'body');

  const sizeMap: Record<TextSize, string> = {
    sm: 'h-[28px] px-3 text-xs',
    normal: 'h-[35px] px-4 text-sm',
    lg: 'h-[40px] px-5 text-base',
    xl: 'h-[46px] px-6 text-lg',
  };

  if (btnType === 'start') {
    return (
      <Button
        onClick={onClick}
        className={cn(
          sizeMap[size],
          body,
          isRunning
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-border bg-background/80 text-foreground hover:bg-muted'
        )}
        style={customColor ? { color: customColor, borderColor: customColor } : undefined}
      >
        {isRunning ? 'Stop' : 'Start'}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(sizeMap[size], body, 'bg-background/80')}
      style={customColor ? { color: customColor, borderColor: customColor } : undefined}
    >
      Reset
    </Button>
  );
}
