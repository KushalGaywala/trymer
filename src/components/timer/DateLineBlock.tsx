import { formatDateLine } from '@/lib/hero-format';
import { sizeClass, type TextSize } from '@/lib/app-settings';
import { cn } from '@/lib/utils';

type Align = 'left' | 'center' | 'right';
type Props = { now: Date; size: TextSize; align?: Align };

const textAlign: Record<Align, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right',
};

export function DateLineBlock({ now, size, align = 'center' }: Props) {
  return (
    <p className={cn('text-muted-foreground w-full', sizeClass(size, 'body'), textAlign[align])}>
      {formatDateLine(now)}
    </p>
  );
}
