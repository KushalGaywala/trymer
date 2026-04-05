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

type Align = 'left' | 'center' | 'right';
type Quote = { text: string; author: string };

const flexAlign: Record<Align, string> = {
  left:   'items-start',
  center: 'items-center',
  right:  'items-end',
};
const textAlign: Record<Align, string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
};

type Props = {
  now: Date;
  settings: AppSettings;
  size: TextSize;
  align?: Align;
};

export function ClockBlock({ now, settings, size, align = 'center' }: Props) {
  const heroClass = sizeClass(size, 'hero');
  const subClass = cn(
    'text-muted-foreground max-w-[90vw]',
    textAlign[align],
    size === 'sm'     && 'text-xs',
    size === 'normal' && 'text-sm md:text-base',
    size === 'lg'     && 'text-base md:text-lg',
    size === 'xl'     && 'text-lg md:text-xl'
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
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [kind]);

  const timeStr = formatDigitalTime(now, settings.digitalFormat, settings.digitalShowSeconds);
  const dateStr = formatDateLine(now);
  const footerLine = settings.labels.heroFooterOverride.trim();

  let primary: ReactNode = null;

  switch (kind) {
    case 'quote':
      primary = quote ? (
        <div className={cn('flex flex-col gap-2 px-2', textAlign[align])}>
          <p className={cn(heroClass, 'font-serif italic leading-snug')}>
            {'\u201c'}{quote.text}{'\u201d'}
          </p>
          {quote.author && <p className={subClass}>— {quote.author}</p>}
        </div>
      ) : (
        <p className={cn(heroClass, 'text-muted-foreground', textAlign[align])}>{timeStr}</p>
      );
      break;

    case 'timeInQuotes':
      primary = (
        <p className={cn(heroClass, 'font-serif italic leading-snug px-4', textAlign[align])}>
          {'\u201c'}It\u2019s {timeStr}.{'\u201d'}
        </p>
      );
      break;

    case 'timeWords':
      primary = (
        <p className={cn(heroClass, 'font-medium capitalize', textAlign[align])}>
          {timeInWords(now)}
        </p>
      );
      break;

    case 'digital':
      primary = (
        <p className={cn(heroClass, 'font-bold tabular-nums', textAlign[align])}>{timeStr}</p>
      );
      break;

    case 'greeting':
      primary = (
        <p className={cn(heroClass, 'font-semibold', textAlign[align])}>{simpleGreeting(now)}</p>
      );
      break;

    case 'creativeGreeting':
      primary = (
        <p className={cn(heroClass, 'font-semibold', textAlign[align])}>{creativeGreeting(now)}</p>
      );
      break;

    case 'custom':
      primary = (
        <p className={cn(heroClass, 'whitespace-pre-wrap font-medium', textAlign[align])}>
          {interpolateHeroTemplate(settings.customHeroTemplate, timeStr, dateStr)}
        </p>
      );
      break;

    default:
      primary = <p className={cn(heroClass, textAlign[align])}>{timeStr}</p>;
  }

  const dateEmbeddedInCustom = kind === 'custom' && settings.customHeroTemplate.includes('{date}');
  const showDateLine = settings.showDateUnderHero && !dateEmbeddedInCustom;

  return (
    <div className={cn('flex w-full min-h-0 flex-col gap-1 py-2', flexAlign[align])}>
      {primary}
      {footerLine ? <p className={subClass}>{footerLine}</p> : null}
      {showDateLine ? <p className={subClass}>{dateStr}</p> : null}
    </div>
  );
}
