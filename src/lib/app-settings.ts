import { z } from 'zod';

export const STORAGE_KEY = 'trymer-app-settings';

export const GRID_SLOTS = ['TL', 'T', 'TR', 'L', 'C', 'R', 'BL', 'B', 'BR'] as const;
export type GridSlot = (typeof GRID_SLOTS)[number];

export const BLOCK_IDS = ['studyInputs', 'timerFace', 'hero', 'themeToggle'] as const;
export type BlockId = (typeof BLOCK_IDS)[number];

export const TEXT_SIZES = ['sm', 'normal', 'lg', 'xl'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const HERO_MODE_KINDS = [
  'quote',
  'timeInQuotes',
  'timeWords',
  'digital',
  'greeting',
  'creativeGreeting',
  'custom',
] as const;
export type HeroModeKind = (typeof HERO_MODE_KINDS)[number];

const slotEnum = z.enum(['TL', 'T', 'TR', 'L', 'C', 'R', 'BL', 'B', 'BR']);

const placementSchema = z
  .object({
    studyInputs: slotEnum.nullable(),
    timerFace: slotEnum.nullable(),
    hero: slotEnum.nullable(),
    themeToggle: slotEnum.nullable(),
  })
  .default({
    studyInputs: 'T',
    timerFace: 'C',
    hero: 'B',
    themeToggle: 'TR',
  });

const backgroundSchema = z
  .object({
    mode: z.enum(['none', 'url', 'upload', 'category']),
    url: z.string(),
    dataUrl: z.string(),
    category: z.string(),
  })
  .default({
    mode: 'none',
    url: '',
    dataUrl: '',
    category: 'nature',
  });

const labelsSchema = z
  .object({
    study: z.string(),
    break: z.string(),
    sessions: z.string(),
    timerTitleOverride: z.string(),
    heroFooterOverride: z.string(),
  })
  .default({
    study: '',
    break: '',
    sessions: '',
    timerTitleOverride: '',
    heroFooterOverride: '',
  });

const blockSizesSchema = z
  .object({
    studyInputs: z.enum(['sm', 'normal', 'lg', 'xl']),
    timerFace: z.enum(['sm', 'normal', 'lg', 'xl']),
    hero: z.enum(['sm', 'normal', 'lg', 'xl']),
    themeToggle: z.enum(['sm', 'normal', 'lg', 'xl']),
  })
  .default({
    studyInputs: 'normal',
    timerFace: 'normal',
    hero: 'normal',
    themeToggle: 'normal',
  });

export const appSettingsSchema = z.object({
  placement: placementSchema,
  background: backgroundSchema,
  labels: labelsSchema,
  heroModeKind: z.enum(HERO_MODE_KINDS).default('digital'),
  digitalFormat: z.enum(['12h', '24h']).default('24h'),
  digitalShowSeconds: z.boolean().default(true),
  customHeroTemplate: z.string().default('{time}'),
  showDateUnderHero: z.boolean().default(true),
  blockSizes: blockSizesSchema,
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultAppSettings: AppSettings = appSettingsSchema.parse({});

export function mergeWithDefaults(partial: unknown): AppSettings {
  const parsed = appSettingsSchema.safeParse(partial);
  if (parsed.success) return parsed.data;
  return defaultAppSettings;
}

export function resolveBackgroundImageUrl(settings: AppSettings): string | null {
  const { mode, url, dataUrl, category } = settings.background;
  if (mode === 'none') return null;
  if (mode === 'url' && url.trim()) return url.trim();
  if (mode === 'upload' && dataUrl) return dataUrl;
  if (mode === 'category' && category.trim()) {
    const tag = category.trim().split(/[,\s]+/)[0] || 'nature';
    return `https://loremflickr.com/1920/1080/${encodeURIComponent(tag)}`;
  }
  return null;
}

export function sizeClass(
  size: TextSize,
  role: 'body' | 'title' | 'hero' | 'icon'
): string {
  const map: Record<TextSize, Record<typeof role, string>> = {
    sm: {
      body: 'text-sm',
      title: 'text-base font-semibold',
      hero: 'text-lg md:text-xl',
      icon: 'h-4 w-4',
    },
    normal: {
      body: 'text-sm',
      title: 'text-lg',
      hero: 'text-2xl md:text-3xl',
      icon: 'h-5 w-5',
    },
    lg: {
      body: 'text-base',
      title: 'text-xl md:text-2xl',
      hero: 'text-3xl md:text-4xl',
      icon: 'h-6 w-6',
    },
    xl: {
      body: 'text-lg',
      title: 'text-2xl md:text-3xl',
      hero: 'text-4xl md:text-5xl',
      icon: 'h-7 w-7',
    },
  };
  return map[size][role];
}
