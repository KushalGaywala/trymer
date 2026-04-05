import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import {
  resolveBackgroundImageUrl,
  buildComponentStyle,
  COMPONENT_IDS,
  type ComponentId,
} from '@/lib/app-settings';
import { detectImageBrightness } from '@/lib/color-utils';
import { AppSettingsSheet } from '@/components/settings/AppSettingsSheet';
import { TimerFaceBlock } from '@/components/timer/TimerFaceBlock';
import { TimerInputBlock } from '@/components/timer/TimerInputBlock';
import { TimerBtnBlock } from '@/components/timer/TimerBtnBlock';
import { ClockBlock } from '@/components/timer/ClockBlock';
import { DateLineBlock } from '@/components/timer/DateLineBlock';
import { TimerGrid, type ComponentEntry } from '@/components/timer/TimerGrid';
import { cn } from '@/lib/utils';

const AUDIO_ALERT_DURATION = 8;

export function Timer() {
  const { settings, setSettings, moveComponent, updateComponent, resetToDefaults, hydrated } =
    useAppSettings();
  const { setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [studyTime, setStudyTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [minuteCount, setMinuteCount] = useState(0);
  const [secondCount, setSecondCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(1);
  const [timerSwitch, setTimerSwitch] = useState(true);
  const [timerContext, setTimerContext] = useState('Timer');
  const [isRunning, setIsRunning] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [bgBroken, setBgBroken] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioSecondRef = useRef(0);
  const tickRef = useRef<() => void>(() => {});

  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const ctx = (label: string, cur: number, total: number) => `${label} ${cur}/${total}`;

  const updateClock = useCallback(() => setNow(new Date()), []);

  const playAlertAudio = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    alertAudioRef.current?.play();
    if (alertAudioRef.current) alertAudioRef.current.loop = true;
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
    const studyLabel = settings.labels.study || 'Timer';
    const breakLabel = settings.labels.break || 'Break';

    if (sessionCount > totalSessions) {
      setMinuteCount(0); setSecondCount(0); setSessionCount(1); setTimerSwitch(true);
      setStudyTime(0); setBreakTime(0); setTotalSessions(0);
      setTimerContext('Timer'); setIsRunning(false);
      alertAudioRef.current?.pause();
      if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      return;
    }

    if (timerSwitch) {
      if (secondCount < 59 && minuteCount < studyTime) {
        setTimerContext(ctx(studyLabel, sessionCount, totalSessions));
        setSecondCount((s) => s + 1);
      } else if (minuteCount < studyTime - 1) {
        setSecondCount(0); setMinuteCount((m) => m + 1);
      } else if (minuteCount === studyTime - 1 && secondCount === 59) {
        setSecondCount(0); setMinuteCount(0); setTimerSwitch(false);
        setTimerContext(ctx(breakLabel, sessionCount, totalSessions));
        setSessionCount((s) => s + 1);
        playAlertAudio();
      } else {
        setSecondCount((s) => s + 1);
      }
    } else {
      if (secondCount < 59 && minuteCount < breakTime) {
        setTimerContext(ctx(breakLabel, sessionCount - 1, totalSessions));
        setSecondCount((s) => s + 1);
      } else if (minuteCount < breakTime - 1) {
        setSecondCount(0); setMinuteCount((m) => m + 1);
      } else if (minuteCount === breakTime - 1 && secondCount === 59) {
        setSecondCount(0); setMinuteCount(0); setTimerSwitch(true);
        setTimerContext(ctx(studyLabel, sessionCount, totalSessions));
        playAlertAudio();
      } else {
        setSecondCount((s) => s + 1);
      }
    }
  }, [sessionCount, totalSessions, timerSwitch, secondCount, minuteCount, studyTime, breakTime, playAlertAudio, settings.labels]);

  tickRef.current = tick;

  useEffect(() => {
    alertAudioRef.current = new Audio('/mixkit-industry-alarm-tone-2979.wav');
    updateClock();
    clockIntervalRef.current = setInterval(updateClock, 1000);
    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
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
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
  };

  const resetTimer = () => {
    setMinuteCount(0); setSecondCount(0); setSessionCount(1); setTimerSwitch(true);
    setStudyTime(0); setBreakTime(0); setTotalSessions(0); setTimerContext('Timer'); setIsRunning(false);
    alertAudioRef.current?.pause();
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
  };

  const bgUrl = hydrated ? resolveBackgroundImageUrl(settings) : null;
  useEffect(() => { setBgBroken(false); }, [bgUrl]);

  // Auto-detect background brightness → set dark/light theme
  useEffect(() => {
    if (!bgUrl) { setTheme('system'); return; }
    detectImageBrightness(bgUrl).then((b) => setTheme(b === 'dark' ? 'dark' : 'light'));
  }, [bgUrl, setTheme]);

  const comps = settings.components;

  // If timerFace and clock share a slot, suppress the clock in that slot
  const clockSuppressed =
    comps.timerFace.slot !== null &&
    comps.clock.slot !== null &&
    comps.timerFace.slot === comps.clock.slot;

  // Build component entries (node + wrapperStyle + align per component)
  const makeEntry = (id: ComponentId, node: React.ReactNode): ComponentEntry => ({
    id,
    node,
    wrapperStyle: buildComponentStyle(comps[id]),
    align: comps[id].align,
  });

  const entries: Partial<Record<ComponentId, ComponentEntry | null>> = {
    timerFace: makeEntry('timerFace', (
      <TimerFaceBlock
        timerContext={timerContext}
        minuteCount={minuteCount}
        secondCount={secondCount}
        pad={pad}
        titleOverride={settings.labels.timerTitleOverride}
        size={comps.timerFace.size}
        align={comps.timerFace.align}
      />
    )),
    timerStudyInput: makeEntry('timerStudyInput', (
      <TimerInputBlock
        inputType="study"
        value={studyTime}
        isRunning={isRunning}
        onChange={setStudyTime}
        label={settings.labels.study || 'Study'}
        size={comps.timerStudyInput.size}
        align={comps.timerStudyInput.align}
      />
    )),
    timerBreakInput: makeEntry('timerBreakInput', (
      <TimerInputBlock
        inputType="break"
        value={breakTime}
        isRunning={isRunning}
        onChange={setBreakTime}
        label={settings.labels.break || 'Break'}
        size={comps.timerBreakInput.size}
        align={comps.timerBreakInput.align}
      />
    )),
    timerSessionsInput: makeEntry('timerSessionsInput', (
      <TimerInputBlock
        inputType="sessions"
        value={totalSessions}
        isRunning={isRunning}
        onChange={setTotalSessions}
        label={settings.labels.sessions || 'Sessions'}
        size={comps.timerSessionsInput.size}
        align={comps.timerSessionsInput.align}
      />
    )),
    timerStartBtn: makeEntry('timerStartBtn', (
      <TimerBtnBlock
        btnType="start"
        isRunning={isRunning}
        onClick={handleStart}
        size={comps.timerStartBtn.size}
        align={comps.timerStartBtn.align}
      />
    )),
    timerResetBtn: makeEntry('timerResetBtn', (
      <TimerBtnBlock
        btnType="reset"
        isRunning={isRunning}
        onClick={resetTimer}
        size={comps.timerResetBtn.size}
        align={comps.timerResetBtn.align}
      />
    )),
    clock: clockSuppressed ? null : makeEntry('clock', (
      <ClockBlock
        now={now}
        settings={settings}
        size={comps.clock.size}
        align={comps.clock.align}
      />
    )),
    dateLine: makeEntry('dateLine', (
      <DateLineBlock
        now={now}
        size={comps.dateLine.size}
        align={comps.dateLine.align}
      />
    )),
  };

  // Build slot map: slot → ComponentEntry[]
  const slotMap: Record<string, ComponentEntry[]> = {};
  for (const id of COMPONENT_IDS) {
    const slot = comps[id].slot;
    if (!slot) continue;
    const entry = entries[id];
    if (!entry) continue;
    if (!slotMap[slot]) slotMap[slot] = [];
    slotMap[slot].push(entry);
  }

  const overlayOpacity = settings.background.opacity;

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-x-hidden font-['Rubik',sans-serif] transition-colors duration-300",
        !bgUrl && 'bg-background text-foreground'
      )}
    >
      {bgUrl && !bgBroken && (
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
          aria-hidden
        />
      )}
      {bgUrl && !bgBroken && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-background"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {bgUrl && <img src={bgUrl} alt="" className="hidden" onError={() => setBgBroken(true)} />}

      <div className="relative z-[2] flex min-h-screen flex-col">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute left-4 top-4 z-[5] rounded-full border-border bg-background/80 shadow-sm"
          aria-label="Open settings"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>

        <AppSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          setSettings={setSettings}
          updateComponent={updateComponent}
          moveComponent={moveComponent}
          resetToDefaults={resetToDefaults}
        />

        <TimerGrid
          cols={settings.grid.cols}
          rows={settings.grid.rows}
          slotMap={slotMap}
          onMove={moveComponent}
        />
      </div>
    </div>
  );
}
