import { useRef, type Dispatch, type SetStateAction } from 'react';
import { STORAGE_KEY, type AppSettings, type BlockId, type GridSlot } from '@/lib/app-settings';
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
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GRID_SLOTS, HERO_MODE_KINDS } from '@/lib/app-settings';
import { toast } from 'sonner';

const SLOT_OPTIONS: (GridSlot | 'hidden')[] = ['hidden', ...GRID_SLOTS];

function slotValue(slot: GridSlot | null): string {
  return slot ?? 'hidden';
}

function parseSlot(value: string): GridSlot | null {
  return value === 'hidden' ? null : (value as GridSlot);
}

const BLOCK_LABELS: Record<BlockId, string> = {
  studyInputs: 'Study inputs',
  timerFace: 'Timer',
  hero: 'Quotes / time / greetings',
  themeToggle: 'Theme toggle',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  updatePlacement: (block: BlockId, slot: GridSlot | null) => void;
  resetToDefaults: () => void;
};

export function AppSettingsSheet({
  open,
  onOpenChange,
  settings,
  setSettings,
  updatePlacement,
  resetToDefaults,
}: Props) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const trySave = (next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
    } catch {
      toast.error('Could not save — storage may be full. Try a smaller image or clear site data.');
    }
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const next: AppSettings = {
        ...settingsRef.current,
        background: {
          ...settingsRef.current.background,
          mode: 'upload',
          dataUrl,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSettings(next);
        toast.success('Background image saved');
      } catch {
        toast.error('Image is too large for browser storage. Use an image URL instead.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Layout, background, labels, and hero display. Changes save automatically.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="space-y-6 pr-4">
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
                    Uses loremflickr.com with your tag (random image per load).
                  </p>
                </div>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Grid placement</h3>
              <p className="text-xs text-muted-foreground">
                Choose a cell for each block, or Hidden. Picking a taken cell swaps.
              </p>
              {(Object.keys(BLOCK_LABELS) as BlockId[]).map((block) => (
                <div key={block} className="space-y-1">
                  <Label>{BLOCK_LABELS[block]}</Label>
                  <Select
                    value={slotValue(settings.placement[block])}
                    onValueChange={(v) => updatePlacement(block, parseSlot(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt === 'hidden' ? 'Hidden' : opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Labels</h3>
              <p className="text-xs text-muted-foreground">
                Leave blank to use defaults. Timer title override replaces the session label line.
              </p>
              <div className="grid gap-2">
                <div>
                  <Label>Study</Label>
                  <Input
                    value={settings.labels.study}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, labels: { ...s.labels, study: e.target.value } }))
                    }
                    placeholder="Study Time"
                  />
                </div>
                <div>
                  <Label>Break</Label>
                  <Input
                    value={settings.labels.break}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, labels: { ...s.labels, break: e.target.value } }))
                    }
                    placeholder="Break Time"
                  />
                </div>
                <div>
                  <Label>Sessions</Label>
                  <Input
                    value={settings.labels.sessions}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, labels: { ...s.labels, sessions: e.target.value } }))
                    }
                    placeholder="Sessions"
                  />
                </div>
                <div>
                  <Label>Timer title override</Label>
                  <Input
                    value={settings.labels.timerTitleOverride}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        labels: { ...s.labels, timerTitleOverride: e.target.value },
                      }))
                    }
                    placeholder="Empty = show session context"
                  />
                </div>
                <div>
                  <Label>Extra line under hero (optional)</Label>
                  <Input
                    value={settings.labels.heroFooterOverride}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        labels: { ...s.labels, heroFooterOverride: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Hero (quotes / time / greetings)</h3>
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
                        {k}
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
                      onValueChange={(digitalFormat) =>
                        trySave({
                          ...settingsRef.current,
                          digitalFormat: digitalFormat as '12h' | '24h',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h</SelectItem>
                        <SelectItem value="12h">12h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="secs">Show seconds</Label>
                    <Switch
                      id="secs"
                      checked={settings.digitalShowSeconds}
                      onCheckedChange={(digitalShowSeconds) =>
                        trySave({ ...settingsRef.current, digitalShowSeconds })
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
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="dateunder">Show date line under hero</Label>
                <Switch
                  id="dateunder"
                  checked={settings.showDateUnderHero}
                  onCheckedChange={(showDateUnderHero) =>
                    trySave({ ...settingsRef.current, showDateUnderHero })
                  }
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Text size</h3>
              {(Object.keys(BLOCK_LABELS) as BlockId[]).map((block) => (
                <div key={block} className="space-y-1">
                  <Label>{BLOCK_LABELS[block]}</Label>
                  <Select
                    value={settings.blockSizes[block]}
                    onValueChange={(v) =>
                      trySave({
                        ...settingsRef.current,
                        blockSizes: {
                          ...settingsRef.current.blockSizes,
                          [block]: v as AppSettings['blockSizes'][typeof block],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
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
