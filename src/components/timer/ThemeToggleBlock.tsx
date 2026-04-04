import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sizeClass, type TextSize } from '@/lib/app-settings';
import { cn } from '@/lib/utils';

type Props = {
  size: TextSize;
};

export function ThemeToggleBlock({ size }: Props) {
  const { theme, setTheme } = useTheme();
  const icon = sizeClass(size, 'icon');

  const sizeMap: Record<TextSize, string> = {
    sm: 'h-9 w-9',
    normal: 'h-10 w-10',
    lg: 'h-11 w-11',
    xl: 'h-12 w-12',
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => {
        const effectiveTheme =
          theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : theme;
        setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
      }}
      className={cn(
        'relative rounded-full border-border bg-background/80 hover:bg-muted',
        sizeMap[size]
      )}
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          icon,
          'rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0'
        )}
      />
      <Moon
        className={cn(
          icon,
          'absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100'
        )}
      />
    </Button>
  );
}
