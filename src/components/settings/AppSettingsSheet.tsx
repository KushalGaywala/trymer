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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COMPONENT_LABELS: Record<ComponentId, string> = {
  timerFace:          'Timer display',
  timerFocusInput:    'Focus time input',
  timerBreakInput:    'Break time input',
  timerSessionsInput: 'Sessions input',
  timerStartBtn:      'Start / Stop button',
  timerResetBtn:      'Reset button',
  clock:              'Clock / quotes',
  dateLine:           'Date line',
};

const HERO_MODE_LABELS: Record<AppSettings['heroModeKind'], string> = {
  digital:          'Digital time',
  timeInQuotes:     'Time in quotes',
  timeWords:        'Time in words',
  quote:            'Random quote',
  greeting:         'Greeting',
  creativeGreeting: 'Creative greeting',
  custom:           'Custom template',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  updateComponent: (id: ComponentId, patch: Partial<ComponentConfig>) => void;
  resetToDefaults: () => void;
};

type BackgroundPatch = Partial<AppSettings['background']>;
type LabelsPatch = Partial<AppSettings['labels']>;

// ── tiny helpers ─────────────────────────────────────────────────────────────

function ColorSwatch({
  color, onChange, allowAuto = false, autoActive = false, onAuto,
}: {
  color: string; onChange: (c: string) => void;
  allowAuto?: boolean; autoActive?: boolean; onAuto?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {allowAuto && (
        <button type="button" onClick={onAuto}
          className={cn('rounded border px-2 py-0.5 text-xs transition-colors',
            autoActive
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50'
          )}
        >Auto</button>
      )}
      <label className="relative cursor-pointer" title="Pick color">
        <div className={cn('h-6 w-6 rounded border', !autoActive ? 'border-primary shadow-sm' : 'border-border opacity-50')}
          style={{ backgroundColor: color !== 'auto' && color !== 'transparent' ? color : '#888888' }} />
        <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={color !== 'auto' && color !== 'transparent' ? color : '#888888'}
          onChange={(e) => onChange(e.target.value)} />
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

function SliderRow({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

export function AppSettingsSheet({
  open, onOpenChange, settings, setSettings,
  updateComponent, resetToDefaults,
}: Props) {
  const ref = useRef(settings);
  ref.current = settings;

  const trySave = (next: AppSettings) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSettings(next); }
    catch { toast.error('Could not save — storage may be full.'); }
  };

  function patchSetting<K extends keyof AppSettings>(key: K, val: AppSettings[K]) {
    trySave({ ...ref.current, [key]: val });
  }

  const patchBg = (p: BackgroundPatch) =>
    trySave({ ...ref.current, background: { ...ref.current.background, ...p } });

  const patchLabels = (p: LabelsPatch) =>
    setSettings((s) => ({ ...s, labels: { ...s.labels, ...p } }));

  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        trySave({ ...ref.current, background: { ...ref.current.background, mode: 'upload', dataUrl: reader.result as string } });
        toast.success('Background saved');
      } catch { toast.error('Image too large — use a URL instead.'); }
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (presetId: string) => {
    const p = LAYOUT_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    const next = { ...ref.current };
    const comps = { ...next.components };
    for (const [cid, piece] of Object.entries(p.components)) {
      const id = cid as ComponentId;
      comps[id] = {
        ...comps[id],
        x: piece.x,
        y: piece.y,
        zIndex: piece.zIndex,
        hidden: piece.hidden ?? false,
      };
    }
    next.components = comps;
    trySave(next);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-3">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Drag blocks on the canvas in edit layout mode, or set position and visibility below.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="space-y-5 pr-4 pt-1">

            {/* ── Presets ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Layout presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-border bg-background p-3 text-left hover:bg-accent hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Background ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Background</h3>
              <div className="space-y-1">
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
                <div className="space-y-1"><Label className="text-xs">URL</Label>
                  <Input value={settings.background.url} placeholder="https://…"
                    onChange={(e) => setSettings((s) => ({ ...s, background: { ...s.background, url: e.target.value } }))} />
                </div>
              )}
              {settings.background.mode === 'upload' && (
                <div className="space-y-1"><Label className="text-xs">File</Label>
                  <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
                </div>
              )}
              {settings.background.mode === 'category' && (
                <div className="space-y-1"><Label className="text-xs">Category tag</Label>
                  <Input value={settings.background.category} placeholder="nature, city, cat…"
                    onChange={(e) => setSettings((s) => ({ ...s, background: { ...s.background, category: e.target.value } }))} />
                </div>
              )}
              {settings.background.mode !== 'none' && (
                <SliderRow label="Overlay opacity" value={Math.round(settings.background.opacity * 100)}
                  min={0} max={100} unit="%" onChange={(v) => patchBg({ opacity: v / 100 })} />
              )}
            </section>

            <Separator />

            {/* ── Components ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Components</h3>
              <p className="text-xs text-muted-foreground">
                Use the layout button on the main screen to drag blocks. Overlapping order uses the stack controls on each block.
              </p>

              <Accordion type="multiple" className="space-y-1">
                {COMPONENT_IDS.map((id) => {
                  const cfg = settings.components[id];

                  return (
                    <AccordionItem key={id} value={id} className="rounded-lg border border-border/70 px-3">
                      <AccordionTrigger className="py-2 text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{COMPONENT_LABELS[id]}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded leading-none',
                            cfg.hidden ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                            {cfg.hidden ? 'hidden' : `${Math.round(cfg.x)}%, ${Math.round(cfg.y)}%`}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="space-y-4 pb-3">

                        <Row label="Visible">
                          <Switch
                            checked={!cfg.hidden}
                            onCheckedChange={(v) => updateComponent(id, { hidden: !v })}
                          />
                        </Row>

                        {!cfg.hidden && (
                          <>
                            <div className="flex gap-2">
                              <div className="flex flex-1 flex-col gap-1">
                                <Label className="text-xs">X (%)</Label>
                                <Input type="number" min={0} max={100} step={0.5} className="h-7 text-xs"
                                  value={cfg.x}
                                  onChange={(e) => updateComponent(id, { x: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
                              </div>
                              <div className="flex flex-1 flex-col gap-1">
                                <Label className="text-xs">Y (%)</Label>
                                <Input type="number" min={0} max={100} step={0.5} className="h-7 text-xs"
                                  value={cfg.y}
                                  onChange={(e) => updateComponent(id, { y: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
                              </div>
                            </div>
                            <Row label="Stack (z-index)">
                              <Input type="number" className="h-7 w-20 text-xs"
                                value={cfg.zIndex}
                                onChange={(e) => updateComponent(id, { zIndex: Math.round(Number(e.target.value) || 0) })} />
                            </Row>
                          </>
                        )}

                        <Separator className="my-1" />

                        {/* Alignment */}
                        <Row label="Alignment">
                          {(['left', 'center', 'right'] as const).map((a) => (
                            <button key={a} type="button"
                              onClick={() => updateComponent(id, { align: a })}
                              className={cn('rounded border px-2 py-0.5 text-xs capitalize transition-colors',
                                cfg.align === a
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/50')}>
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
                          <ColorSwatch color={cfg.color} allowAuto autoActive={cfg.color === 'auto'}
                            onAuto={() => updateComponent(id, { color: 'auto' })}
                            onChange={(c) => updateComponent(id, { color: c })} />
                        </Row>

                        {/* Font */}
                        <Row label="Font">
                          <Select
                            value={FONT_FAMILIES.find((f) => f.value === cfg.fontFamily) ? cfg.fontFamily : 'custom'}
                            onValueChange={(v) => { if (v !== 'custom') updateComponent(id, { fontFamily: v }); }}>
                            <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Row>

                        {(!FONT_FAMILIES.find((f) => f.value === cfg.fontFamily) || cfg.fontFamily === 'custom') && (
                          <div className="space-y-1">
                            <Label className="text-xs">Custom font-family value</Label>
                            <Input className="h-7 text-xs"
                              value={cfg.fontFamily === 'inherit' ? '' : cfg.fontFamily}
                              placeholder="'Playfair Display', serif"
                              onChange={(e) => updateComponent(id, { fontFamily: e.target.value || 'inherit' })} />
                          </div>
                        )}

                        <SliderRow label="Font weight" value={cfg.fontWeight} min={100} max={900} step={100}
                          onChange={(v) => updateComponent(id, { fontWeight: v })} />

                        <Row label="Italic">
                          <Switch checked={cfg.italic} onCheckedChange={(v) => updateComponent(id, { italic: v })} />
                        </Row>

                        <SliderRow label="Letter spacing" value={cfg.letterSpacing} min={-5} max={20} step={0.5} unit="px"
                          onChange={(v) => updateComponent(id, { letterSpacing: v })} />

                        <Separator className="my-1" />

                        {/* Box */}
                        <Row label="Background color">
                          <ColorSwatch color={cfg.bgColor === 'transparent' ? '#ffffff' : cfg.bgColor}
                            allowAuto autoActive={cfg.bgColor === 'transparent'}
                            onAuto={() => updateComponent(id, { bgColor: 'transparent' })}
                            onChange={(c) => updateComponent(id, { bgColor: c })} />
                        </Row>

                        <Row label="Border color">
                          <ColorSwatch color={cfg.borderColor === 'transparent' ? '#888888' : cfg.borderColor}
                            allowAuto autoActive={cfg.borderColor === 'transparent'}
                            onAuto={() => updateComponent(id, { borderColor: 'transparent' })}
                            onChange={(c) => updateComponent(id, { borderColor: c })} />
                        </Row>

                        <SliderRow label="Border width" value={cfg.borderWidth} min={0} max={20} unit="px"
                          onChange={(v) => updateComponent(id, { borderWidth: v })} />

                        <SliderRow label="Border radius" value={cfg.borderRadius} min={0} max={100} unit="px"
                          onChange={(v) => updateComponent(id, { borderRadius: v })} />

                        <SliderRow label="Horizontal padding" value={cfg.paddingX} min={0} max={120} unit="px"
                          onChange={(v) => updateComponent(id, { paddingX: v })} />

                        <SliderRow label="Vertical padding" value={cfg.paddingY} min={0} max={120} unit="px"
                          onChange={(v) => updateComponent(id, { paddingY: v })} />

                        <SliderRow label="Opacity" value={Math.round(cfg.opacity * 100)} min={0} max={100} unit="%"
                          onChange={(v) => updateComponent(id, { opacity: v / 100 })} />

                        <Row label="Shadow">
                          <Switch checked={cfg.shadow} onCheckedChange={(v) => updateComponent(id, { shadow: v })} />
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
                <Select value={settings.heroModeKind} onValueChange={(v) => patchSetting('heroModeKind', v as AppSettings['heroModeKind'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HERO_MODE_KINDS.map((k) => <SelectItem key={k} value={k}>{HERO_MODE_LABELS[k]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {settings.heroModeKind === 'digital' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Format</Label>
                    <Select value={settings.digitalFormat} onValueChange={(v) => patchSetting('digitalFormat', v as '12h' | '24h')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-hour</SelectItem>
                        <SelectItem value="12h">12-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="secs" className="text-xs">Show seconds</Label>
                    <Switch id="secs" checked={settings.digitalShowSeconds} onCheckedChange={(v) => patchSetting('digitalShowSeconds', v)} />
                  </div>
                </>
              )}
              {settings.heroModeKind === 'custom' && (
                <div className="space-y-1">
                  <Label className="text-xs">Template</Label>
                  <Input value={settings.customHeroTemplate}
                    onChange={(e) => setSettings((s) => ({ ...s, customHeroTemplate: e.target.value }))}
                    placeholder="{time} — {date}" />
                  <p className="text-xs text-muted-foreground">Use {'{time}'} and {'{date}'}.</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="dateunder" className="text-xs">Show date below clock</Label>
                <Switch id="dateunder" checked={settings.showDateUnderHero} onCheckedChange={(v) => patchSetting('showDateUnderHero', v)} />
              </div>
            </section>

            <Separator />

            {/* ── Labels ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Labels</h3>
              <p className="text-xs text-muted-foreground">Leave blank for defaults.</p>
              <div className="grid gap-2">
                {[
                  { key: 'focus'              as const, label: 'Focus',             placeholder: 'Focus' },
                  { key: 'break'              as const, label: 'Break',             placeholder: 'Break' },
                  { key: 'sessions'           as const, label: 'Sessions',          placeholder: 'Sessions' },
                  { key: 'timerTitleOverride' as const, label: 'Timer title',       placeholder: 'Auto (session context)' },
                  { key: 'heroFooterOverride' as const, label: 'Clock footer line', placeholder: 'Optional' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-xs">{label}</Label>
                    <Input className="h-7 text-xs" value={settings.labels[key]}
                      onChange={(e) => patchLabels({ [key]: e.target.value })} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </section>

            <Button type="button" variant="outline" className="w-full"
              onClick={() => { resetToDefaults(); toast.message('Reset to defaults'); }}>
              Reset all to defaults
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
