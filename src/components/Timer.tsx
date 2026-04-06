import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, LayoutGrid } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import { resolveBackgroundImageUrl, buildComponentStyle, type ComponentId } from '@/lib/app-settings';
import { detectImageBrightness } from '@/lib/color-utils';
import { AppSettingsSheet } from '@/components/settings/AppSettingsSheet';
import { TimerFaceBlock } from '@/components/timer/TimerFaceBlock';
import { TimerInputBlock } from '@/components/timer/TimerInputBlock';
import { TimerBtnBlock } from '@/components/timer/TimerBtnBlock';
import { ClockBlock } from '@/components/timer/ClockBlock';
import { DateLineBlock } from '@/components/timer/DateLineBlock';
import { LayoutCanvas, type ComponentEntry } from '@/components/timer/LayoutCanvas';
import { cn } from '@/lib/utils';

const AUDIO_ALERT_DURATION = 8;

export function Timer() {
  const {
    settings, setSettings,
    setComponentPosition, updateComponent,
    resetToDefaults, hydrated,
  } = useAppSettings();
  const { setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);

  const [focusTime,       setFocusTime]       = useState(0);
  const [breakTime,       setBreakTime]       = useState(0);
  const [totalSessions,   setTotalSessions]   = useState(0);
  const [minuteCount,     setMinuteCount]     = useState(0);
  const [secondCount,     setSecondCount]     = useState(0);
  const [sessionCount,    setSessionCount]    = useState(1);
  const [timerSwitch,     setTimerSwitch]     = useState(true);
  const [timerContext,    setTimerContext]    = useState('Timer');
  const [isRunning,       setIsRunning]       = useState(false);
  const [now,             setNow]             = useState(() => new Date());
  const [bgBroken,        setBgBroken]        = useState(false);

  const alertAudioRef    = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioSecondRef   = useRef(0);
  const tickRef          = useRef<() => void>(() => {});

  const pad = (n: number) => n < 10 ? '0' + n : String(n);
  const ctx = (label: string, cur: number, total: number) => `${label} ${cur}/${total}`;
  const updateClock = useCallback(() => setNow(new Date()), []);

  const playAlertAudio = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (alertAudioRef.current) { alertAudioRef.current.play(); alertAudioRef.current.loop = true; }
    audioSecondRef.current = 0;
    audioIntervalRef.current = setInterval(() => {
      if (audioSecondRef.current++ > AUDIO_ALERT_DURATION) {
        alertAudioRef.current?.pause();
        if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
        audioSecondRef.current = 0;
      }
    }, 1000);
  }, []);

  const tick = useCallback(() => {
    const fl = settings.labels.focus || 'Timer';
    const bl = settings.labels.break || 'Break';

    if (sessionCount > totalSessions) {
      setMinuteCount(0); setSecondCount(0); setSessionCount(1); setTimerSwitch(true);
      setFocusTime(0); setBreakTime(0); setTotalSessions(0); setTimerContext('Timer'); setIsRunning(false);
      alertAudioRef.current?.pause();
      [audioIntervalRef, timerIntervalRef].forEach((r) => { if (r.current) { clearInterval(r.current); r.current = null; } });
      return;
    }
    if (timerSwitch) {
      if (secondCount < 59 && minuteCount < focusTime) {
        setTimerContext(ctx(fl, sessionCount, totalSessions)); setSecondCount((s) => s + 1);
      } else if (minuteCount < focusTime - 1) {
        setSecondCount(0); setMinuteCount((m) => m + 1);
      } else if (minuteCount === focusTime - 1 && secondCount === 59) {
        setSecondCount(0); setMinuteCount(0); setTimerSwitch(false);
        setTimerContext(ctx(bl, sessionCount, totalSessions)); setSessionCount((s) => s + 1); playAlertAudio();
      } else { setSecondCount((s) => s + 1); }
    } else {
      if (secondCount < 59 && minuteCount < breakTime) {
        setTimerContext(ctx(bl, sessionCount - 1, totalSessions)); setSecondCount((s) => s + 1);
      } else if (minuteCount < breakTime - 1) {
        setSecondCount(0); setMinuteCount((m) => m + 1);
      } else if (minuteCount === breakTime - 1 && secondCount === 59) {
        setSecondCount(0); setMinuteCount(0); setTimerSwitch(true);
        setTimerContext(ctx(fl, sessionCount, totalSessions)); playAlertAudio();
      } else { setSecondCount((s) => s + 1); }
    }
  }, [sessionCount, totalSessions, timerSwitch, secondCount, minuteCount, focusTime, breakTime, playAlertAudio, settings.labels]);

  tickRef.current = tick;

  useEffect(() => {
    alertAudioRef.current = new Audio('/mixkit-industry-alarm-tone-2979.wav');
    updateClock();
    clockIntervalRef.current = setInterval(updateClock, 1000);
    return () => {
      [clockIntervalRef, timerIntervalRef, audioIntervalRef].forEach((r) => { if (r.current) clearInterval(r.current); });
      alertAudioRef.current?.pause();
    };
  }, [updateClock]);

  useEffect(() => {
    if (!isRunning) return;
    timerIntervalRef.current = setInterval(() => tickRef.current(), 1000);
    return () => { if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; } };
  }, [isRunning]);

  const handleStart = () => {
    if (!isRunning) { setIsRunning(true); return; }
    setIsRunning(false);
    alertAudioRef.current?.pause();
    [timerIntervalRef, audioIntervalRef].forEach((r) => { if (r.current) { clearInterval(r.current); r.current = null; } });
  };

  const resetTimer = () => {
    setMinuteCount(0); setSecondCount(0); setSessionCount(1); setTimerSwitch(true);
    setFocusTime(0); setBreakTime(0); setTotalSessions(0); setTimerContext('Timer'); setIsRunning(false);
    alertAudioRef.current?.pause();
    [timerIntervalRef, audioIntervalRef].forEach((r) => { if (r.current) { clearInterval(r.current); r.current = null; } });
  };

  const bgUrl = hydrated ? resolveBackgroundImageUrl(settings) : null;
  useEffect(() => { setBgBroken(false); }, [bgUrl]);
  useEffect(() => {
    if (!bgUrl) { setTheme('system'); return; }
    detectImageBrightness(bgUrl).then((b) => setTheme(b === 'dark' ? 'dark' : 'light'));
  }, [bgUrl, setTheme]);

  const comps = settings.components;

  const makeEntry = (id: ComponentId, node: React.ReactNode): ComponentEntry => ({
    id,
    node,
    wrapperStyle: buildComponentStyle(comps[id]),
    align: comps[id].align,
  });

  const allEntries: Record<ComponentId, ComponentEntry> = {
    timerFace: makeEntry('timerFace',
      <TimerFaceBlock
        timerContext={timerContext} minuteCount={minuteCount} secondCount={secondCount}
        pad={pad} titleOverride={settings.labels.timerTitleOverride}
        size={comps.timerFace.size} align={comps.timerFace.align}
      />),
    timerFocusInput: makeEntry('timerFocusInput',
      <TimerInputBlock inputType="focus" value={focusTime} isRunning={isRunning}
        onChange={setFocusTime} label={settings.labels.focus || 'Focus'}
        size={comps.timerFocusInput.size} align={comps.timerFocusInput.align}
      />),
    timerBreakInput: makeEntry('timerBreakInput',
      <TimerInputBlock inputType="break" value={breakTime} isRunning={isRunning}
        onChange={setBreakTime} label={settings.labels.break || 'Break'}
        size={comps.timerBreakInput.size} align={comps.timerBreakInput.align}
      />),
    timerSessionsInput: makeEntry('timerSessionsInput',
      <TimerInputBlock inputType="sessions" value={totalSessions} isRunning={isRunning}
        onChange={setTotalSessions} label={settings.labels.sessions || 'Sessions'}
        size={comps.timerSessionsInput.size} align={comps.timerSessionsInput.align}
      />),
    timerStartBtn: makeEntry('timerStartBtn',
      <TimerBtnBlock btnType="start" isRunning={isRunning} onClick={handleStart}
        size={comps.timerStartBtn.size} align={comps.timerStartBtn.align}
      />),
    timerResetBtn: makeEntry('timerResetBtn',
      <TimerBtnBlock btnType="reset" isRunning={isRunning} onClick={resetTimer}
        size={comps.timerResetBtn.size} align={comps.timerResetBtn.align}
      />),
    clock: makeEntry('clock',
      <ClockBlock now={now} settings={settings}
        size={comps.clock.size} align={comps.clock.align}
      />),
    dateLine: makeEntry('dateLine',
      <DateLineBlock now={now} size={comps.dateLine.size} align={comps.dateLine.align} />),
  };

  return (
    <div className={cn(
      "relative min-h-screen w-full overflow-x-hidden font-['Rubik',sans-serif] transition-colors duration-300",
      !bgUrl && 'bg-background text-foreground'
    )}>
      {bgUrl && !bgBroken && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      )}
      {bgUrl && !bgBroken && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-background"
          style={{ opacity: settings.background.opacity }} />
      )}
      {bgUrl && <img src={bgUrl} alt="" className="hidden" onError={() => setBgBroken(true)} />}

      <div className="relative z-[2] flex min-h-screen flex-col">
        <div className="absolute left-4 top-4 z-[5] flex gap-2">
          <Button type="button" variant="outline" size="icon"
            className="rounded-full border-border bg-background/80 shadow-sm"
            aria-label="Open settings" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant={layoutEditMode ? 'default' : 'outline'}
            size="icon"
            className="rounded-full border-border bg-background/80 shadow-sm"
            aria-label={layoutEditMode ? 'Done editing layout' : 'Edit layout'}
            aria-pressed={layoutEditMode}
            onClick={() => setLayoutEditMode((v) => !v)}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
        </div>

        <AppSettingsSheet
          open={settingsOpen} onOpenChange={setSettingsOpen}
          settings={settings} setSettings={setSettings}
          updateComponent={updateComponent}
          resetToDefaults={resetToDefaults}
        />

        <LayoutCanvas
          components={comps}
          entries={allEntries}
          layoutEditMode={layoutEditMode}
          onPositionChange={setComponentPosition}
        />
      </div>
    </div>
  );
}
