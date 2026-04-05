import { useEffect, useState, type ReactNode } from 'react';
import type { AppSettings, TextSize } from '@/lib/app-settings';
import { sizeClass } from '@/lib/app-settings';
import { creativeGreeting, simpleGreeting } from '@/lib/hero-greetings';
import {
  formatDateLine,
  formatDigitalTime,
  interpolateHeroTemplate,
} from '@/lib/hero-format';
import { timeInWords } from '@/lib/time-words';
import { cn } from '@/lib/utils';

type Quote = { text: string; author: string };

type Props = {
  now: Date;
  settings: AppSettings;
  size: TextSize;
  color?: string; // 'auto' or CSS color
};

export function ClockBlock({ now, settings, size, color }: Props) {
  const heroClass = sizeClass(size, 'hero');
  const subClass = cn(
    'text-muted-foreground text-center max-w-[90vw]',
    size === 'sm' && 'text-xs',
    size === 'normal' && 'text-sm md:text-base',
    size === 'lg' && 'text-base md:text-lg',
    size === 'xl' && 'text-lg md:text-xl'
  );

  const customColor = color && color !== 'auto' ? color : undefined;

  const [quote, setQuote] = useState<Quote | null>(null);
  const kind = settings.heroModeKind;

  useEffect(() => {
    if (kind !== 'quote') return;
    let cancelled = false;
    fetch('https://api.quotable.io/random')
      .then((r) => r.json())
      .then((data: { content?: string; author?: string }) => {
        if (cancelled || !data.content) return;
        setQuote({ text: data.content, author: data.author ?? '' });
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const timeStr = formatDigitalTime(now, settings.digitalFormat, settings.digitalShowSeconds);
  const dateStr = formatDateLine(now);
  const footerLine = settings.labels.heroFooterOverride.trim();

  let primary: ReactNode = null;

  switch (kind) {
    case 'quote':
      primary = quote ? (
        <div className="flex flex-col items-center gap-2 px-2 text-center">
          <p
            className={cn(heroClass, 'font-serif italic leading-snug')}
            style={customColor ? { color: customColor } : undefined}
          >
            {/* Typographic curly quotes */}
            {'\u201c'}{quote.text}{'\u201d'}
          </p>
          {quote.author && (
            <p className={subClass}>— {quote.author}</p>
          )}
        </div>
      ) : (
        <p
          className={cn(heroClass, 'text-muted-foreground')}
          style={customColor ? { color: customColor } : undefined}
        >
          {timeStr}
        </p>
      );
      break;

    case 'timeInQuotes':
      // Time rendered as a casual spoken quote with typographic curly quotes
      primary = (
        <p
          className={cn(heroClass, 'font-serif italic leading-snug text-center px-4')}
          style={customColor ? { color: customColor } : undefined}
        >
          {'\u201c'}It\u2019s {timeStr}.{'\u201d'}
        </p>
      );
      break;

    case 'timeWords':
      primary = (
        <p
          className={cn(heroClass, 'font-medium capitalize text-center')}
          style={customColor ? { color: customColor } : undefined}
        >
          {timeInWords(now)}
        </p>
      );
      break;

    case 'digital':
      primary = (
        <p
          className={cn(heroClass, 'font-bold tabular-nums')}
          style={customColor ? { color: customColor } : undefined}
        >
          {timeStr}
        </p>
      );
      break;

    case 'greeting':
      primary = (
        <p
          className={cn(heroClass, 'font-semibold')}
          style={customColor ? { color: customColor } : undefined}
        >
          {simpleGreeting(now)}
        </p>
      );
      break;

    case 'creativeGreeting':
      primary = (
        <p
          className={cn(heroClass, 'font-semibold')}
          style={customColor ? { color: customColor } : undefined}
        >
          {creativeGreeting(now)}
        </p>
      );
      break;

    case 'custom':
      primary = (
        <p
          className={cn(heroClass, 'whitespace-pre-wrap font-medium')}
          style={customColor ? { color: customColor } : undefined}
        >
          {interpolateHeroTemplate(settings.customHeroTemplate, timeStr, dateStr)}
        </p>
      );
      break;

    default:
      primary = (
        <p
          className={heroClass}
          style={customColor ? { color: customColor } : undefined}
        >
          {timeStr}
        </p>
      );
  }

  const dateEmbeddedInCustom =
    kind === 'custom' && settings.customHeroTemplate.includes('{date}');
  const showDateLine = settings.showDateUnderHero && !dateEmbeddedInCustom;

  return (
    <div className="flex w-full min-h-0 flex-col items-center justify-center gap-1 py-2">
      {primary}
      {footerLine ? <p className={subClass}>{footerLine}</p> : null}
      {showDateLine ? <p className={subClass}>{dateStr}</p> : null}
    </div>
  );
}
