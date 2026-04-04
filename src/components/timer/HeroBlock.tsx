import { useEffect, useState, type ReactNode } from 'react';
import type { AppSettings } from '@/lib/app-settings';
import { sizeClass, type TextSize } from '@/lib/app-settings';
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
  heroSize: TextSize;
};

export function HeroBlock({ now, settings, heroSize }: Props) {
  const hero = sizeClass(heroSize, 'hero');
  const sub = cn(
    'text-muted-foreground text-center max-w-[90vw]',
    heroSize === 'sm' && 'text-xs',
    heroSize === 'normal' && 'text-sm md:text-base',
    heroSize === 'lg' && 'text-base md:text-lg',
    heroSize === 'xl' && 'text-lg md:text-xl'
  );

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
        <div className="flex flex-col items-center gap-2 text-center px-2">
          <p className={cn(hero, 'font-serif italic leading-snug')}>“{quote.text}”</p>
          {quote.author ? (
            <p className={sub}>— {quote.author}</p>
          ) : null}
        </div>
      ) : (
        <p className={cn(hero, 'text-muted-foreground')}>{timeStr}</p>
      );
      break;
    case 'timeInQuotes':
      primary = (
        <blockquote
          className={cn(
            hero,
            'border-l-4 border-primary pl-4 italic text-left max-w-md mx-auto'
          )}
        >
          {timeStr}
        </blockquote>
      );
      break;
    case 'timeWords':
      primary = (
        <p className={cn(hero, 'font-medium capitalize')}>{timeInWords(now)}</p>
      );
      break;
    case 'digital':
      primary = <p className={cn(hero, 'font-bold tabular-nums')}>{timeStr}</p>;
      break;
    case 'greeting':
      primary = (
        <p className={cn(hero, 'font-semibold')}>{simpleGreeting(now)}</p>
      );
      break;
    case 'creativeGreeting':
      primary = (
        <p className={cn(hero, 'font-semibold')}>{creativeGreeting(now)}</p>
      );
      break;
    case 'custom':
      primary = (
        <p className={cn(hero, 'font-medium whitespace-pre-wrap')}>
          {interpolateHeroTemplate(settings.customHeroTemplate, timeStr, dateStr)}
        </p>
      );
      break;
    default:
      primary = <p className={hero}>{timeStr}</p>;
  }

  const dateEmbeddedInCustom =
    kind === 'custom' && settings.customHeroTemplate.includes('{date}');
  const showDateLine =
    settings.showDateUnderHero && !dateEmbeddedInCustom;

  return (
    <footer className="flex flex-col items-center justify-center gap-1 w-full min-h-0 py-2">
      {primary}
      {footerLine ? <p className={sub}>{footerLine}</p> : null}
      {showDateLine ? <p className={sub}>{dateStr}</p> : null}
    </footer>
  );
}
