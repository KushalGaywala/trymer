import { useRef, type Dispatch, type SetStateAction } from 'react';
import {
  STORAGE_KEY,
  type AppSettings,
  type ComponentId,
  type ComponentConfig,
  COMPONENT_IDS,
  HERO_MODE_KINDS,
  LAYOUT_PRESETS,
  FONT_FAMILIES,
} from '@/lib/app-settings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GridPositionPicker } from '@/components/settings/GridPositionPicker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COMPONENT_LABELS: Record<ComponentId, string> = {
  timerFace:          'Timer display',
  timerStudyInput:    'Study time input',
  timerBreakInput:    'Break time input',
  timerSessionsInput: 'Sessions input',
  timerStartBtn:      'Start / Stop button',
  timerResetBtn:      'Reset button',
  clock:              'Clock / quotes',
  dateLine:           'Date line',
};

const HERO_MODE_LABELS: Record<AppSettings['heroModeKind'], string> = {
  digital:         'Digital time',
  timeInQuotes:    'Time in quotes',
  timeWords:       'Time in words',
  quote:           'Random quote',
  greeting:        'Greeting',
  creativeGreeting:'Creative greeting',
  custom:          'Custom template',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  updateComponent: (id: ComponentId, patch: Partial<ComponentConfig>) => void;
  moveComponent: (id: ComponentId, slot: string | null) => void;
  resetToDefaults: () => void;
};

// ── small helpers ────────────────────────────────────────────────────────────

function ColorSwatch({
  color,
  onChange,
  allowAuto,
  autoActive,
  onAuto,
}: {
  color: string;
  onChange: (c: string) => void;
  allowAuto?: boolean;
  autoActive?: boolean;
  onAuto?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {allowAuto && (
        <button
          type="button"
          onClick={onAuto}
          className={cn(
            'rounded border px-2 py-0.5 text-xs transition-colors',
            autoActive
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50'
          )}
        >
          Auto
        </button>
      )}
      <label className="relative cursor-pointer" title="Pick color">
        <div
          className={cn(
            'h-6 w-6 rounded border transition-all',
            !autoActive ? 'border-primary shadow-sm' : 'border-border opacity-50'
          )}
          style={{ backgroundColor: color !== 'auto' ? color : '#888888' }}
        />
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={color !== 'auto' ? color : '#888888'}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs shrink-0">{label}</Label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}{unit}
        </span>
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export function AppSettingsSheet({
  open,
  onOpenChange,
  settings,
  setSettings,
  updateComponent,
  moveComponent,
  resetToDefaults,
}: Props) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const trySave = (next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
    } catch {
      toast.error('Could not save — storage may be full.');
    }
  };

  const patch = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    trySave({ ...settingsRef.current, [key]: value });

  const patchBg = (partial: Partial<AppSettings['background']>) =>
    trySave({ ...settingsRef.current, background: { ...settingsRef.current.background, ...partial } });

  const patchGrid = (partial: Partial<AppSettings['grid']>) =>
    trySave({ ...settingsRef.current, grid: { ...settingsRef.current.grid, ...partial } });

  const patchLabels = (partial: Partial<AppSettings['labels']>) =>
    setSettings((s) => ({ ...s, labels: { ...s.labels, ...partial } }));

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        trySave({ ...settingsRef.current, background: { ...settingsRef.current.background, mode: 'upload', dataUrl } });
        toast.success('Background image saved');
      } catch {
        toast.error('Image too large. Use a URL instead.');
      }
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (presetId: string) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const next: AppSettings = { ...settingsRef.current };
    if (preset.grid) next.grid = { ...next.grid, ...preset.grid };
    const updatedComponents = { ...next.components };
    for (const [id, cfg] of Object.entries(preset.components) as [ComponentId, { slot: string | null }][]) {
      updatedComponents[id] = { ...updatedComponents[id], slot: cfg.slot };
    }
    next.components = updatedComponents;
    trySave(next);
  };

  // Slots taken by OTHER components (for picker dim hints)
  const takenSlotsFor = (excludeId: ComponentId) =>
    COMPONENT_IDS.filter((id) => id !== excludeId)
      .map((id) => settings.components[id].slot)
      .filter((s): s is string => s !== null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-3">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Drag components on the canvas, or configure them below.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="space-y-5 pr-4 pt-1">

            {/* ── Presets ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Layout presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-border bg-background p-3 text-left hover:bg-accent hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{p.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Grid ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Grid size</h3>
              <div className="flex gap-3">
                {(['cols', 'rows'] as const).map((k) => (
                  <div key={k} className="flex flex-1 flex-col gap-1">
                    <Label className="text-xs capitalize">{k}</Label>
                    <Input
                      type="number" min={1} max={8}
                      value={settings.grid[k]}
                      onChange={(e) => patchGrid({ [k]: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })}
                    />
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Background ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Background</h3>
              <div className="space-y-2">
                <Label className="text-xs">Mode</Label>
                <Select value={settings.background.mode} onValueChange={(v) => patchBg({ mode: v as AppSettings['background']['mode'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="url">Image URL</SelectItem>
                    <SelectItem value="upload">Upload file</SelectItem>
                    <SelectItem value="category">Category (Lorem Flickr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.background.mode === 'url' && (
                <div className="space-y-1">
                  <Label className="text-xs">URL</Label>
                  <Input value={settings.background.url} onChange={(e) => setSettings((s) => ({ ...s, background: { ...s.background, url: e.target.value } }))} placeholder="https://..." />
                </div>
              )}
              {settings.background.mode === 'upload' && (
                <div className="space-y-1">
                  <Label className="text-xs">File</Label>
                  <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
                </div>
              )}
              {settings.background.mode === 'category' && (
                <div className="space-y-1">
                  <Label className="text-xs">Category tag</Label>
                  <Input value={settings.background.category} onChange={(e) => setSettings((s) => ({ ...s, background: { ...s.background, category: e.target.value } }))} placeholder="nature, city, cat…" />
                </div>
              )}

              {settings.background.mode !== 'none' && (
                <SliderRow
                  label="Overlay opacity"
                  value={Math.round(settings.background.opacity * 100)}
                  min={0} max={100}
                  unit="%"
                  onChange={(v) => patchBg({ opacity: v / 100 })}
                />
              )}
            </section>

            <Separator />

            {/* ── Components ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Components</h3>
              <p className="text-xs text-muted-foreground">
                Each component occupies its own slot — dragging onto an occupied cell swaps them.
              </p>

              <Accordion type="multiple" className="space-y-1">
                {COMPONENT_IDS.map((id) => {
                  const cfg = settings.components[id];
                  const taken = takenSlotsFor(id);

                  return (
                    <AccordionItem key={id} value={id} className="rounded-lg border border-border/70 px-3">
                      <AccordionTrigger className="py-2 text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{COMPONENT_LABELS[id]}</span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded leading-none',
                            cfg.slot !== null ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            {cfg.slot ?? 'hidden'}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="space-y-4 pb-3">

                        {/* Position */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <GridPositionPicker
                            value={cfg.slot}
                            gridCols={settings.grid.cols}
                            gridRows={settings.grid.rows}
                            onChange={(slot) => moveComponent(id, slot)}
                            takenSlots={taken}
                          />
                        </div>

                        {/* Alignment */}
                        <Row label="Alignment">
                          {(['left', 'center', 'right'] as const).map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => updateComponent(id, { align: a })}
                              className={cn(
                                'rounded border px-2 py-0.5 text-xs transition-colors capitalize',
                                cfg.align === a
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                              )}
                            >
                              {a}
                            </button>
                          ))}
                        </Row>

                        {/* Text size */}
                        <Row label="Size">
                          <Select value={cfg.size} onValueChange={(v) => updateComponent(id, { size: v as ComponentConfig['size'] })}>
                            <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">X-Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </Row>

                        {/* Text color */}
                        <Row label="Text color">
                          <ColorSwatch
                            color={cfg.color}
                            allowAuto
                            autoActive={cfg.color === 'auto'}
                            onAuto={() => updateComponent(id, { color: 'auto' })}
                            onChange={(c) => updateComponent(id, { color: c })}
                          />
                        </Row>

                        {/* Font */}
                        <Row label="Font family">
                          <Select
                            value={FONT_FAMILIES.find((f) => f.value === cfg.fontFamily) ? cfg.fontFamily : 'custom'}
                            onValueChange={(v) => {
                              if (v !== 'custom') updateComponent(id, { fontFamily: v });
                            }}
                          >
                            <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Row>

                        {(cfg.fontFamily === 'custom' || !FONT_FAMILIES.find((f) => f.value === cfg.fontFamily)) && (
                          <div className="space-y-1">
                            <Label className="text-xs">Custom font-family</Label>
                            <Input
                              className="h-7 text-xs"
                              value={cfg.fontFamily === 'inherit' ? '' : cfg.fontFamily}
                              placeholder="e.g. 'Playfair Display', serif"
                              onChange={(e) => updateComponent(id, { fontFamily: e.target.value || 'inherit' })}
                            />
                          </div>
                        )}

                        <SliderRow
                          label="Font weight"
                          value={cfg.fontWeight}
                          min={100} max={900} step={100}
                          onChange={(v) => updateComponent(id, { fontWeight: v })}
                        />

                        <Row label="Italic">
                          <Switch
                            checked={cfg.italic}
                            onCheckedChange={(v) => updateComponent(id, { italic: v })}
                          />
                        </Row>

                        <SliderRow
                          label="Letter spacing"
                          value={cfg.letterSpacing}
                          min={-5} max={20} step={0.5}
                          unit="px"
                          onChange={(v) => updateComponent(id, { letterSpacing: v })}
                        />

                        <Separator className="my-1" />

                        {/* Box */}
                        <Row label="Background">
                          <ColorSwatch
                            color={cfg.bgColor === 'transparent' ? '#ffffff' : cfg.bgColor}
                            allowAuto
                            autoActive={cfg.bgColor === 'transparent'}
                            onAuto={() => updateComponent(id, { bgColor: 'transparent' })}
                            onChange={(c) => updateComponent(id, { bgColor: c })}
                          />
                        </Row>

                        <Row label="Border color">
                          <ColorSwatch
                            color={cfg.borderColor === 'transparent' ? '#888888' : cfg.borderColor}
                            allowAuto
                            autoActive={cfg.borderColor === 'transparent'}
                            onAuto={() => updateComponent(id, { borderColor: 'transparent' })}
                            onChange={(c) => updateComponent(id, { borderColor: c })}
                          />
                        </Row>

                        <SliderRow
                          label="Border width"
                          value={cfg.borderWidth}
                          min={0} max={20}
                          unit="px"
                          onChange={(v) => updateComponent(id, { borderWidth: v })}
                        />

                        <SliderRow
                          label="Border radius"
                          value={cfg.borderRadius}
                          min={0} max={100}
                          unit="px"
                          onChange={(v) => updateComponent(id, { borderRadius: v })}
                        />

                        <SliderRow
                          label="Padding (horizontal)"
                          value={cfg.paddingX}
                          min={0} max={120}
                          unit="px"
                          onChange={(v) => updateComponent(id, { paddingX: v })}
                        />

                        <SliderRow
                          label="Padding (vertical)"
                          value={cfg.paddingY}
                          min={0} max={120}
                          unit="px"
                          onChange={(v) => updateComponent(id, { paddingY: v })}
                        />

                        <SliderRow
                          label="Opacity"
                          value={Math.round(cfg.opacity * 100)}
                          min={0} max={100}
                          unit="%"
                          onChange={(v) => updateComponent(id, { opacity: v / 100 })}
                        />

                        <Row label="Shadow">
                          <Switch
                            checked={cfg.shadow}
                            onCheckedChange={(v) => updateComponent(id, { shadow: v })}
                          />
                        </Row>

                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </section>

            <Separator />

            {/* ── Clock mode ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Clock display mode</h3>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={settings.heroModeKind} onValueChange={(v) => patch('heroModeKind', v as AppSettings['heroModeKind'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HERO_MODE_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{HERO_MODE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.heroModeKind === 'digital' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Format</Label>
                    <Select value={settings.digitalFormat} onValueChange={(v) => patch('digitalFormat', v as '12h' | '24h')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-hour</SelectItem>
                        <SelectItem value="12h">12-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="secs" className="text-xs">Show seconds</Label>
                    <Switch id="secs" checked={settings.digitalShowSeconds} onCheckedChange={(v) => patch('digitalShowSeconds', v)} />
                  </div>
                </>
              )}

              {settings.heroModeKind === 'custom' && (
                <div className="space-y-1">
                  <Label className="text-xs">Template</Label>
                  <Input value={settings.customHeroTemplate} onChange={(e) => setSettings((s) => ({ ...s, customHeroTemplate: e.target.value }))} placeholder="{time} — {date}" />
                  <p className="text-xs text-muted-foreground">Use {'{time}'} and {'{date}'}.</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="dateunder" className="text-xs">Show date below clock</Label>
                <Switch id="dateunder" checked={settings.showDateUnderHero} onCheckedChange={(v) => patch('showDateUnderHero', v)} />
              </div>
            </section>

            <Separator />

            {/* ── Labels ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Labels</h3>
              <p className="text-xs text-muted-foreground">Leave blank for defaults.</p>
              <div className="grid gap-2">
                {[
                  { key: 'study'              as const, label: 'Study',              placeholder: 'Study' },
                  { key: 'break'              as const, label: 'Break',              placeholder: 'Break' },
                  { key: 'sessions'           as const, label: 'Sessions',           placeholder: 'Sessions' },
                  { key: 'timerTitleOverride' as const, label: 'Timer title',        placeholder: 'Auto (session context)' },
                  { key: 'heroFooterOverride' as const, label: 'Clock footer line',  placeholder: 'Optional' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-xs">{label}</Label>
                    <Input
                      className="h-7 text-xs"
                      value={settings.labels[key]}
                      onChange={(e) => patchLabels({ [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </section>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { resetToDefaults(); toast.message('Reset to defaults'); }}
            >
              Reset all to defaults
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
