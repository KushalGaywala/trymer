import { useRef, type Dispatch, type SetStateAction } from 'react';
import {
  STORAGE_KEY,
  type AppSettings,
  type ComponentId,
  type ComponentConfig,
  COMPONENT_IDS,
  HERO_MODE_KINDS,
  LAYOUT_PRESETS,
} from '@/lib/app-settings';
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

// Human-readable labels for each component
const COMPONENT_LABELS: Record<ComponentId, string> = {
  timerFace: 'Timer display',
  timerStudyInput: 'Study time input',
  timerBreakInput: 'Break time input',
  timerSessionsInput: 'Sessions input',
  timerStartBtn: 'Start / Stop button',
  timerResetBtn: 'Reset button',
  clock: 'Clock / quotes / greetings',
  dateLine: 'Date line',
};

const HERO_MODE_LABELS: Record<AppSettings['heroModeKind'], string> = {
  digital: 'Digital time',
  timeInQuotes: 'Time in quotes',
  timeWords: 'Time in words',
  quote: 'Random quote',
  greeting: 'Greeting',
  creativeGreeting: 'Creative greeting',
  custom: 'Custom template',
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

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const next: AppSettings = {
        ...settingsRef.current,
        background: { ...settingsRef.current.background, mode: 'upload', dataUrl },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSettings(next);
        toast.success('Background image saved');
      } catch {
        toast.error('Image is too large. Use an image URL instead.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Collect all occupied slots for "taken" display
  const takenSlotsFor = (excludeId: ComponentId): string[] => {
    return COMPONENT_IDS.filter((id) => id !== excludeId)
      .map((id) => settings.components[id].slot)
      .filter((s): s is string => s !== null);
  };

  const applyPreset = (presetId: string) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const next: AppSettings = { ...settingsRef.current };
    if (preset.grid) {
      next.grid = { ...next.grid, ...preset.grid };
    }
    const updatedComponents = { ...next.components };
    for (const [id, cfg] of Object.entries(preset.components) as [ComponentId, { slot: string | null }][]) {
      updatedComponents[id] = { ...updatedComponents[id], slot: cfg.slot };
    }
    next.components = updatedComponents;
    trySave(next);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Drag components on the canvas or use the pickers below. Changes save automatically.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="space-y-6 pr-4 pt-2">

            {/* ── Presets ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Layout presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-accent hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            {/* ── Grid size ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Grid size</h3>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <Label className="text-xs">Columns</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.grid.cols}
                    onChange={(e) => {
                      const cols = Math.max(1, Math.min(8, Number(e.target.value) || 1));
                      trySave({ ...settingsRef.current, grid: { ...settingsRef.current.grid, cols } });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <Label className="text-xs">Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.grid.rows}
                    onChange={(e) => {
                      const rows = Math.max(1, Math.min(8, Number(e.target.value) || 1));
                      trySave({ ...settingsRef.current, grid: { ...settingsRef.current.grid, rows } });
                    }}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* ── Background ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Background</h3>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={settings.background.mode}
                  onValueChange={(mode: AppSettings['background']['mode']) =>
                    trySave({
                      ...settingsRef.current,
                      background: { ...settingsRef.current.background, mode },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="url">Image URL</SelectItem>
                    <SelectItem value="upload">Upload image</SelectItem>
                    <SelectItem value="category">Category (Lorem Flickr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.background.mode === 'url' && (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={settings.background.url}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        background: { ...s.background, url: e.target.value },
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              )}

              {settings.background.mode === 'upload' && (
                <div className="space-y-2">
                  <Label>Image file</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onUpload(e.target.files?.[0])}
                  />
                </div>
              )}

              {settings.background.mode === 'category' && (
                <div className="space-y-2">
                  <Label>Category / tag</Label>
                  <Input
                    value={settings.background.category}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        background: { ...s.background, category: e.target.value },
                      }))
                    }
                    placeholder="e.g. nature, cat, city"
                  />
                  <p className="text-xs text-muted-foreground">
                    Uses loremflickr.com — random image each load.
                  </p>
                </div>
              )}

              {settings.background.mode !== 'none' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Overlay opacity</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round(settings.background.opacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[settings.background.opacity]}
                    onValueChange={([opacity]) =>
                      trySave({
                        ...settingsRef.current,
                        background: { ...settingsRef.current.background, opacity },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher opacity = more overlay, less image showing through.
                  </p>
                </div>
              )}
            </section>

            <Separator />

            {/* ── Components ── */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Components</h3>
              <p className="text-xs text-muted-foreground">
                Click a cell to place the component, or drag it on the canvas.
                Pick a color or leave on auto.
              </p>

              {COMPONENT_IDS.map((id) => {
                const cfg = settings.components[id];
                const taken = takenSlotsFor(id);

                return (
                  <div key={id} className="space-y-2 rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{COMPONENT_LABELS[id]}</span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          cfg.slot !== null
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {cfg.slot !== null ? cfg.slot : 'hidden'}
                      </span>
                    </div>

                    {/* Position picker */}
                    <GridPositionPicker
                      value={cfg.slot}
                      gridCols={settings.grid.cols}
                      gridRows={settings.grid.rows}
                      onChange={(slot) => moveComponent(id, slot)}
                      takenSlots={taken}
                    />

                    {/* Color + size row */}
                    <div className="flex items-center gap-3">
                      {/* Color */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0">Color</Label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateComponent(id, { color: 'auto' })}
                            className={cn(
                              'rounded border px-2 py-0.5 text-xs transition-colors',
                              cfg.color === 'auto'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                            )}
                          >
                            Auto
                          </button>
                          <label className="relative cursor-pointer" title="Pick custom color">
                            <div
                              className={cn(
                                'h-6 w-6 rounded border transition-all',
                                cfg.color !== 'auto'
                                  ? 'border-primary shadow-sm'
                                  : 'border-border opacity-50'
                              )}
                              style={{ backgroundColor: cfg.color !== 'auto' ? cfg.color : '#888888' }}
                            />
                            <input
                              type="color"
                              className="absolute inset-0 cursor-pointer opacity-0 w-full h-full"
                              value={cfg.color !== 'auto' ? cfg.color : '#888888'}
                              onChange={(e) => updateComponent(id, { color: e.target.value })}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Size */}
                      <div className="flex items-center gap-2 ml-auto">
                        <Label className="text-xs shrink-0">Size</Label>
                        <Select
                          value={cfg.size}
                          onValueChange={(v) =>
                            updateComponent(id, {
                              size: v as ComponentConfig['size'],
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-[90px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="xl">X-Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <Separator />

            {/* ── Clock / Hero ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Clock display mode</h3>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={settings.heroModeKind}
                  onValueChange={(heroModeKind) =>
                    trySave({
                      ...settingsRef.current,
                      heroModeKind: heroModeKind as AppSettings['heroModeKind'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HERO_MODE_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {HERO_MODE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.heroModeKind === 'digital' && (
                <>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={settings.digitalFormat}
                      onValueChange={(v) =>
                        trySave({
                          ...settingsRef.current,
                          digitalFormat: v as '12h' | '24h',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-hour</SelectItem>
                        <SelectItem value="12h">12-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="secs">Show seconds</Label>
                    <Switch
                      id="secs"
                      checked={settings.digitalShowSeconds}
                      onCheckedChange={(v) =>
                        trySave({ ...settingsRef.current, digitalShowSeconds: v })
                      }
                    />
                  </div>
                </>
              )}

              {settings.heroModeKind === 'custom' && (
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Input
                    value={settings.customHeroTemplate}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, customHeroTemplate: e.target.value }))
                    }
                    placeholder="{time} and {date}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{time}'} and {'{date}'} as placeholders.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="dateunder">Show date below clock</Label>
                <Switch
                  id="dateunder"
                  checked={settings.showDateUnderHero}
                  onCheckedChange={(v) =>
                    trySave({ ...settingsRef.current, showDateUnderHero: v })
                  }
                />
              </div>
            </section>

            <Separator />

            {/* ── Labels ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Labels</h3>
              <p className="text-xs text-muted-foreground">Leave blank to use defaults.</p>
              <div className="grid gap-2">
                {[
                  { key: 'study' as const, label: 'Study label', placeholder: 'Study' },
                  { key: 'break' as const, label: 'Break label', placeholder: 'Break' },
                  { key: 'sessions' as const, label: 'Sessions label', placeholder: 'Sessions' },
                  {
                    key: 'timerTitleOverride' as const,
                    label: 'Timer title override',
                    placeholder: 'Leave empty for session context',
                  },
                  {
                    key: 'heroFooterOverride' as const,
                    label: 'Extra line under clock',
                    placeholder: 'Optional',
                  },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      value={settings.labels[key]}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          labels: { ...s.labels, [key]: e.target.value },
                        }))
                      }
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
              onClick={() => {
                resetToDefaults();
                toast.message('Reset to defaults');
              }}
            >
              Reset all to defaults
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
