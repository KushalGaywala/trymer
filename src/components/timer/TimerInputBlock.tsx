import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Align = 'left' | 'center' | 'right';

type Props = {
  inputType: 'study' | 'break' | 'sessions';
  value: number;
  isRunning: boolean;
  onChange: (n: number) => void;
  label: string;
  size: TextSize;
  align?: Align;
};

const PLACEHOLDERS = { study: 'min', break: 'min', sessions: 'count' } as const;

const justifyClass: Record<Align, string> = {
  left:   'justify-start',
  center: 'justify-center',
  right:  'justify-end',
};

export function TimerInputBlock({ inputType, value, isRunning, onChange, label, size, align = 'center' }: Props) {
  const body = sizeClass(size, 'body');
  const titleCls = sizeClass(size, 'title');

  return (
    <div className={cn('flex items-center gap-2 w-full max-w-[300px]', body, justifyClass[align])}>
      <Label className={cn('shrink-0', titleCls)}>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isRunning}
        placeholder={PLACEHOLDERS[inputType]}
        className="h-[30px] w-[80px] shrink-0 border-border bg-background/80 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
