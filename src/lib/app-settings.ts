import { z } from 'zod';

export const STORAGE_KEY = 'trymer-settings-v5';

export const COMPONENT_IDS = [
  'timerFace',
  'timerFocusInput',
  'timerBreakInput',
  'timerSessionsInput',
  'timerStartBtn',
  'timerResetBtn',
  'clock',
  'dateLine',
] as const;
export type ComponentId = (typeof COMPONENT_IDS)[number];

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

export const FONT_FAMILIES = [
  { label: 'App default (Rubik)', value: 'inherit' },
  { label: 'Sans-serif', value: 'Arial, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: '"Courier New", monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Custom…', value: 'custom' },
] as const;

// ── Component config ─────────────────────────────────────────────────────────

const componentConfigSchema = z.object({
  // Layout (% of canvas width/height, center-anchored)
  x:       z.number().min(0).max(100).default(50),
  y:       z.number().min(0).max(100).default(50),
  zIndex:  z.number().int().default(0),
  hidden:  z.boolean().default(false),
  align:   z.enum(['left', 'center', 'right']).default('center'),

  // Text
  color:         z.string().default('auto'),
  size:          z.enum(TEXT_SIZES).default('normal'),
  fontFamily:    z.string().default('inherit'),
  fontWeight:    z.number().min(100).max(900).default(400),
  italic:        z.boolean().default(false),
  letterSpacing: z.number().min(-5).max(20).default(0),

  // Box
  bgColor:      z.string().default('transparent'),
  borderColor:  z.string().default('transparent'),
  borderWidth:  z.number().min(0).max(20).default(0),
  borderRadius: z.number().min(0).max(100).default(0),
  paddingX:     z.number().min(0).max(120).default(8),
  paddingY:     z.number().min(0).max(120).default(4),
  opacity:      z.number().min(0).max(1).default(1),
  shadow:       z.boolean().default(false),
});
export type ComponentConfig = z.infer<typeof componentConfigSchema>;

const base = {
  x: 50,
  y: 50,
  zIndex: 0,
  hidden: false,
  align: 'center' as const,
  color: 'auto',
  size: 'normal' as const,
  fontFamily: 'inherit',
  fontWeight: 400,
  italic: false,
  letterSpacing: 0,
  bgColor: 'transparent',
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: 0,
  paddingX: 8,
  paddingY: 4,
  opacity: 1,
  shadow: false,
};

const componentsSchema = z
  .object({
    timerFace:          componentConfigSchema,
    timerFocusInput:    componentConfigSchema,
    timerBreakInput:    componentConfigSchema,
    timerSessionsInput: componentConfigSchema,
    timerStartBtn:      componentConfigSchema,
    timerResetBtn:      componentConfigSchema,
    clock:              componentConfigSchema,
    dateLine:           componentConfigSchema,
  })
  .default({
    timerFace:          { ...base, x: 50, y: 50, zIndex: 4 },
    timerFocusInput:    { ...base, x: 50, y: 16.67, zIndex: 1 },
    timerBreakInput:    { ...base, x: 83.33, y: 16.67, zIndex: 2 },
    timerSessionsInput: { ...base, x: 16.67, y: 16.67, zIndex: 0 },
    timerStartBtn:      { ...base, x: 16.67, y: 83.33, zIndex: 5 },
    timerResetBtn:      { ...base, x: 83.33, y: 83.33, zIndex: 7 },
    clock:              { ...base, x: 50, y: 83.33, zIndex: 6 },
    dateLine:           { ...base, hidden: true, x: 50, y: 92, zIndex: 3 },
  });

// ── Background ───────────────────────────────────────────────────────────────

const backgroundSchema = z
  .object({
    mode:    z.enum(['none', 'url', 'upload', 'category']),
    url:     z.string(),
    dataUrl: z.string(),
    category:z.string(),
    opacity: z.number().min(0).max(1).default(0.5),
  })
  .default({ mode: 'category', url: '', dataUrl: '', category: 'nature', opacity: 0.5 });

// ── Labels ───────────────────────────────────────────────────────────────────

const labelsSchema = z
  .object({
    focus:              z.string(),
    break:              z.string(),
    sessions:           z.string(),
    timerTitleOverride: z.string(),
    heroFooterOverride: z.string(),
  })
  .default({ focus: '', break: '', sessions: '', timerTitleOverride: '', heroFooterOverride: '' });

// ── Root ─────────────────────────────────────────────────────────────────────

export const appSettingsSchema = z.object({
  components:           componentsSchema,
  background:           backgroundSchema,
  labels:               labelsSchema,
  heroModeKind:         z.enum(HERO_MODE_KINDS).default('digital'),
  digitalFormat:        z.enum(['12h', '24h']).default('24h'),
  digitalShowSeconds:   z.boolean().default(true),
  customHeroTemplate:   z.string().default('{time}'),
  showDateUnderHero:    z.boolean().default(false),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultAppSettings: AppSettings = appSettingsSchema.parse({});

/** Parse stored JSON; invalid or partial data falls back to defaults. */
export function mergeWithDefaults(partial: unknown): AppSettings {
  const parsed = appSettingsSchema.safeParse(partial);
  return parsed.success ? parsed.data : defaultAppSettings;
}

// ── Utilities ────────────────────────────────────────────────────────────────

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

/** Convert a ComponentConfig's style fields into an inline React style object. */
export function buildComponentStyle(cfg: ComponentConfig): React.CSSProperties {
  return {
    fontFamily:    cfg.fontFamily !== 'inherit' ? cfg.fontFamily : undefined,
    fontWeight:    cfg.fontWeight !== 400 ? cfg.fontWeight : undefined,
    fontStyle:     cfg.italic ? 'italic' : undefined,
    letterSpacing: cfg.letterSpacing !== 0 ? `${cfg.letterSpacing}px` : undefined,
    backgroundColor: cfg.bgColor !== 'transparent' ? cfg.bgColor : undefined,
    border:
      cfg.borderWidth > 0
        ? `${cfg.borderWidth}px solid ${cfg.borderColor || 'currentColor'}`
        : undefined,
    borderRadius: cfg.borderRadius > 0 ? `${cfg.borderRadius}px` : undefined,
    padding:  `${cfg.paddingY}px ${cfg.paddingX}px`,
    opacity:  cfg.opacity < 1 ? cfg.opacity : undefined,
    boxShadow: cfg.shadow ? '0 4px 24px 0 rgba(0,0,0,0.25)' : undefined,
    color:    cfg.color !== 'auto' ? cfg.color : undefined,
  };
}

export function sizeClass(size: TextSize, role: 'body' | 'title' | 'hero' | 'icon'): string {
  const map: Record<TextSize, Record<typeof role, string>> = {
    sm:     { body: 'text-sm',   title: 'text-base font-semibold', hero: 'text-lg md:text-xl',     icon: 'h-4 w-4' },
    normal: { body: 'text-sm',   title: 'text-lg',                  hero: 'text-2xl md:text-3xl',   icon: 'h-5 w-5' },
    lg:     { body: 'text-base', title: 'text-xl md:text-2xl',      hero: 'text-3xl md:text-4xl',   icon: 'h-6 w-6' },
    xl:     { body: 'text-lg',   title: 'text-2xl md:text-3xl',     hero: 'text-4xl md:text-5xl',   icon: 'h-7 w-7' },
  };
  return map[size][role];
}

/** Clamp canvas X/Y position (percent) so widgets stay reachable near edges. */
export const LAYOUT_XY_CLAMP = { min: 2, max: 98 } as const;

// ── Layout presets ───────────────────────────────────────────────────────────

export type LayoutPresetPiece = { x: number; y: number; zIndex: number; hidden?: boolean };

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  components: Partial<Record<ComponentId, LayoutPresetPiece>>;
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'timer-clock',
    name: 'Timer + Clock',
    description: 'Inputs along the top, timer center, clock and controls along the bottom',
    components: {
      timerSessionsInput: { x: 16.67, y: 16.67, zIndex: 0 },
      timerFocusInput:    { x: 50, y: 16.67, zIndex: 1 },
      timerBreakInput:    { x: 83.33, y: 16.67, zIndex: 2 },
      timerFace:          { x: 50, y: 50, zIndex: 4 },
      timerStartBtn:      { x: 16.67, y: 83.33, zIndex: 5 },
      clock:              { x: 50, y: 83.33, zIndex: 6 },
      timerResetBtn:      { x: 83.33, y: 83.33, zIndex: 7 },
      dateLine:           { hidden: true, x: 50, y: 92, zIndex: 3 },
    },
  },
  {
    id: 'stacked-center',
    name: 'Stacked center',
    description: 'All main controls stacked vertically in the center',
    components: {
      timerFocusInput:    { x: 50, y: 30, zIndex: 0 },
      timerBreakInput:    { x: 50, y: 40, zIndex: 1 },
      timerSessionsInput: { x: 50, y: 50, zIndex: 2 },
      timerFace:          { x: 50, y: 58, zIndex: 3 },
      timerStartBtn:      { x: 50, y: 68, zIndex: 4 },
      timerResetBtn:      { x: 50, y: 76, zIndex: 5 },
      clock:              { x: 50, y: 86, zIndex: 6 },
      dateLine:           { hidden: true, x: 50, y: 94, zIndex: 7 },
    },
  },
  {
    id: 'clock-only',
    name: 'Clock only',
    description: 'Just the clock and date, centered',
    components: {
      timerFocusInput:    { hidden: true, x: 50, y: 30, zIndex: 0 },
      timerBreakInput:    { hidden: true, x: 50, y: 40, zIndex: 1 },
      timerSessionsInput: { hidden: true, x: 50, y: 50, zIndex: 2 },
      timerFace:          { hidden: true, x: 50, y: 50, zIndex: 3 },
      timerStartBtn:      { hidden: true, x: 50, y: 70, zIndex: 4 },
      timerResetBtn:      { hidden: true, x: 50, y: 80, zIndex: 5 },
      clock:              { x: 50, y: 45, zIndex: 10 },
      dateLine:           { x: 50, y: 58, zIndex: 9 },
    },
  },
  {
    id: 'full-spread',
    name: 'Full spread',
    description: 'Each widget in its own area across the canvas',
    components: {
      timerFocusInput:    { x: 16.67, y: 16.67, zIndex: 0 },
      timerBreakInput:    { x: 50, y: 16.67, zIndex: 1 },
      timerSessionsInput: { x: 83.33, y: 16.67, zIndex: 2 },
      timerFace:          { x: 50, y: 50, zIndex: 3 },
      timerStartBtn:      { x: 16.67, y: 50, zIndex: 4 },
      timerResetBtn:      { x: 83.33, y: 50, zIndex: 5 },
      clock:              { x: 50, y: 83.33, zIndex: 6 },
      dateLine:           { x: 83.33, y: 83.33, zIndex: 7 },
    },
  },
];
