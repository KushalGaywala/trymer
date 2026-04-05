import { formatDateLine } from '@/lib/hero-format';
import { sizeClass, type TextSize } from '@/lib/app-settings';
import { cn } from '@/lib/utils';

type Props = {
  now: Date;
  color?: string;
  size: TextSize;
};

export function DateLineBlock({ now, color, size }: Props) {
  const customColor = color && color !== 'auto' ? color : undefined;
  const cls = cn(
    'text-muted-foreground text-center',
    sizeClass(size, 'body')
  );

  return (
    <p
      className={cls}
      style={customColor ? { color: customColor } : undefined}
    >
      {formatDateLine(now)}
    </p>
  );
}
