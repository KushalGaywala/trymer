import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Props = {
  inputType: 'study' | 'break' | 'sessions';
  value: number;
  isRunning: boolean;
  onChange: (n: number) => void;
  label: string;
  color?: string; // 'auto' or CSS color
  size: TextSize;
};

const PLACEHOLDERS: Record<Props['inputType'], string> = {
  study: 'minutes',
  break: 'minutes',
  sessions: 'count',
};

export function TimerInputBlock({
  inputType,
  value,
  isRunning,
  onChange,
  label,
  color,
  size,
}: Props) {
  const body = sizeClass(size, 'body');
  const titleCls = sizeClass(size, 'title');
  const customColor = color && color !== 'auto' ? color : undefined;

  return (
    <div
      className={cn('flex items-center gap-2 w-full max-w-[280px]', body)}
      style={customColor ? { color: customColor } : undefined}
    >
      <Label
        className={cn('flex-1 shrink-0', titleCls)}
        style={customColor ? { color: customColor } : undefined}
      >
        {label}
      </Label>
      <Input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isRunning}
        placeholder={PLACEHOLDERS[inputType]}
        className="h-[30px] w-[90px] shrink-0 border-border bg-background/80 text-sm text-foreground placeholder:text-muted-foreground"
        style={customColor ? { color: customColor } : undefined}
      />
    </div>
  );
}
