import { z } from 'zod';

export const STORAGE_KEY = 'trymer-settings-v4';

export type GridSlot = string;

export const COMPONENT_IDS = [
  'timerFace',
  'timerStudyInput',
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
  // Layout
  slot:  z.string().nullable(),
  order: z.number().default(0),          // sort order within a shared slot
  align: z.enum(['left', 'center', 'right']).default('center'),

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
  order: 0, align: 'center' as const, color: 'auto',
  size: 'normal' as const, fontFamily: 'inherit', fontWeight: 400,
  italic: false, letterSpacing: 0, bgColor: 'transparent',
  borderColor: 'transparent', borderWidth: 0, borderRadius: 0,
  paddingX: 8, paddingY: 4, opacity: 1, shadow: false,
};

const componentsSchema = z
  .object({
    timerFace:          componentConfigSchema,
    timerStudyInput:    componentConfigSchema,
    timerBreakInput:    componentConfigSchema,
    timerSessionsInput: componentConfigSchema,
    timerStartBtn:      componentConfigSchema,
    timerResetBtn:      componentConfigSchema,
    clock:              componentConfigSchema,
    dateLine:           componentConfigSchema,
  })
  .default({
    timerFace:          { ...base, slot: 'r1c1' },
    timerStudyInput:    { ...base, slot: 'r0c1' },
    timerBreakInput:    { ...base, slot: 'r0c2' },
    timerSessionsInput: { ...base, slot: 'r0c0' },
    timerStartBtn:      { ...base, slot: 'r2c0' },
    timerResetBtn:      { ...base, slot: 'r2c2' },
    clock:              { ...base, slot: 'r2c1' },
    dateLine:           { ...base, slot: null   },
  });

// ── Grid ─────────────────────────────────────────────────────────────────────

const gridSchema = z
  .object({
    cols: z.number().int().min(1).max(8).default(3),
    rows: z.number().int().min(1).max(8).default(3),
  })
  .default({ cols: 3, rows: 3 });

// Per-slot stack direction: 'column' = top→bottom, 'row' = left→right
const slotDirectionsSchema = z
  .record(z.string(), z.enum(['column', 'row']))
  .default({});

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
    study:              z.string(),
    break:              z.string(),
    sessions:           z.string(),
    timerTitleOverride: z.string(),
    heroFooterOverride: z.string(),
  })
  .default({ study: '', break: '', sessions: '', timerTitleOverride: '', heroFooterOverride: '' });

// ── Root ─────────────────────────────────────────────────────────────────────

export const appSettingsSchema = z.object({
  grid:           gridSchema,
  slotDirections: slotDirectionsSchema,
  components:     componentsSchema,
  background:     backgroundSchema,
  labels:         labelsSchema,
  heroModeKind:         z.enum(HERO_MODE_KINDS).default('digital'),
  digitalFormat:        z.enum(['12h', '24h']).default('24h'),
  digitalShowSeconds:   z.boolean().default(true),
  customHeroTemplate:   z.string().default('{time}'),
  showDateUnderHero:    z.boolean().default(false),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultAppSettings: AppSettings = appSettingsSchema.parse({});

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

export function gridSlotId(row: number, col: number): string {
  return `r${row}c${col}`;
}

export function parseGridSlot(slot: string): { row: number; col: number } | null {
  const m = slot.match(/^r(\d+)c(\d+)$/);
  return m ? { row: parseInt(m[1]), col: parseInt(m[2]) } : null;
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

// ── Layout presets ───────────────────────────────────────────────────────────

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  components: Partial<Record<ComponentId, { slot: string | null; order?: number }>>;
  grid?: { cols: number; rows: number };
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'timer-clock',
    name: 'Timer + Clock',
    description: 'Inputs spread top, timer center, clock & controls bottom',
    components: {
      timerSessionsInput: { slot: 'r0c0', order: 0 },
      timerStudyInput:    { slot: 'r0c1', order: 0 },
      timerBreakInput:    { slot: 'r0c2', order: 0 },
      timerFace:          { slot: 'r1c1', order: 0 },
      timerStartBtn:      { slot: 'r2c0', order: 0 },
      clock:              { slot: 'r2c1', order: 0 },
      timerResetBtn:      { slot: 'r2c2', order: 0 },
      dateLine:           { slot: null   },
    },
    grid: { cols: 3, rows: 3 },
  },
  {
    id: 'stacked-center',
    name: 'Stacked center',
    description: 'Timer + clock + inputs all stacked in one column',
    components: {
      timerStudyInput:    { slot: 'r1c1', order: 0 },
      timerBreakInput:    { slot: 'r1c1', order: 1 },
      timerSessionsInput: { slot: 'r1c1', order: 2 },
      timerFace:          { slot: 'r1c1', order: 3 },
      timerStartBtn:      { slot: 'r1c1', order: 4 },
      timerResetBtn:      { slot: 'r1c1', order: 5 },
      clock:              { slot: 'r2c1', order: 0 },
      dateLine:           { slot: null   },
    },
    grid: { cols: 3, rows: 3 },
  },
  {
    id: 'clock-only',
    name: 'Clock Only',
    description: 'Just the clock, centered',
    components: {
      timerStudyInput:    { slot: null },
      timerBreakInput:    { slot: null },
      timerSessionsInput: { slot: null },
      timerFace:          { slot: null },
      timerStartBtn:      { slot: null },
      clock:              { slot: 'r1c1', order: 0 },
      timerResetBtn:      { slot: null },
      dateLine:           { slot: 'r2c1', order: 0 },
    },
    grid: { cols: 3, rows: 3 },
  },
  {
    id: 'full-spread',
    name: 'Full Spread',
    description: 'Every component in its own cell',
    components: {
      timerStudyInput:    { slot: 'r0c0', order: 0 },
      timerBreakInput:    { slot: 'r0c1', order: 0 },
      timerSessionsInput: { slot: 'r0c2', order: 0 },
      timerFace:          { slot: 'r1c1', order: 0 },
      timerStartBtn:      { slot: 'r1c0', order: 0 },
      timerResetBtn:      { slot: 'r1c2', order: 0 },
      clock:              { slot: 'r2c1', order: 0 },
      dateLine:           { slot: 'r2c2', order: 0 },
    },
    grid: { cols: 3, rows: 3 },
  },
];
