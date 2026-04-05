import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import { resolveBackgroundImageUrl, COMPONENT_IDS, type ComponentId } from '@/lib/app-settings';
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

  // Timer state
  const [studyTime, setStudyTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [minuteCount, setMinuteCount] = useState<number>(0);
  const [secondCount, setSecondCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [timerSwitch, setTimerSwitch] = useState<boolean>(true);
  const [timerContext, setTimerContext] = useState<string>('Timer');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [now, setNow] = useState(() => new Date());
  const [bgBroken, setBgBroken] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioSecondRef = useRef<number>(0);
  const tickRef = useRef<() => void>(() => {});

  const pad = (digit: number): string => (digit < 10 ? '0' + digit : digit.toString());

  const currContext = (context: string, cur: number, total: number): string =>
    `${context} ${cur}/${total}`;

  const updateClock = useCallback(() => setNow(new Date()), []);

  const playAlertAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (alertAudioRef.current) {
      alertAudioRef.current.play();
      alertAudioRef.current.loop = true;
    }
    audioSecondRef.current = 0;
    audioIntervalRef.current = setInterval(() => {
      if (audioSecondRef.current <= AUDIO_ALERT_DURATION) {
        audioSecondRef.current++;
      } else {
        if (alertAudioRef.current) alertAudioRef.current.pause();
        if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
        }
        audioSecondRef.current = 0;
      }
    }, 1000);
  }, []);

  const tick = useCallback(() => {
    if (sessionCount > totalSessions) {
      setMinuteCount(0);
      setSecondCount(0);
      setSessionCount(1);
      setTimerSwitch(true);
      setStudyTime(0);
      setBreakTime(0);
      setTotalSessions(0);
      setTimerContext('Timer');
      setIsRunning(false);
      if (alertAudioRef.current) alertAudioRef.current.pause();
      if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      return;
    }

    const studyLabel = settings.labels.study || 'Timer';
    const breakLabel = settings.labels.break || 'Break';

    if (timerSwitch) {
      if (secondCount < 59 && minuteCount < studyTime) {
        setTimerContext(currContext(studyLabel, sessionCount, totalSessions));
        setSecondCount(secondCount + 1);
      } else if (minuteCount < studyTime - 1) {
        setSecondCount(0);
        setMinuteCount(minuteCount + 1);
      } else if (minuteCount === studyTime - 1 && secondCount === 59) {
        setSecondCount(0);
        setMinuteCount(0);
        setTimerSwitch(false);
        setTimerContext(currContext(breakLabel, sessionCount, totalSessions));
        setSessionCount(sessionCount + 1);
        playAlertAudio();
      } else {
        setSecondCount(secondCount + 1);
      }
    } else {
      if (secondCount < 59 && minuteCount < breakTime) {
        setTimerContext(currContext(breakLabel, sessionCount - 1, totalSessions));
        setSecondCount(secondCount + 1);
      } else if (minuteCount < breakTime - 1) {
        setSecondCount(0);
        setMinuteCount(minuteCount + 1);
      } else if (minuteCount === breakTime - 1 && secondCount === 59) {
        setSecondCount(0);
        setMinuteCount(0);
        setTimerSwitch(true);
        setTimerContext(currContext(studyLabel, sessionCount, totalSessions));
        playAlertAudio();
      } else {
        setSecondCount(secondCount + 1);
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
      if (alertAudioRef.current) alertAudioRef.current.pause();
    };
  }, [updateClock]);

  useEffect(() => {
    if (!isRunning) return;
    timerIntervalRef.current = setInterval(() => { tickRef.current(); }, 1000);
    return () => {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
      if (alertAudioRef.current) alertAudioRef.current.pause();
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    }
  };

  const resetTimer = () => {
    setMinuteCount(0);
    setSecondCount(0);
    setSessionCount(1);
    setTimerSwitch(true);
    setStudyTime(0);
    setBreakTime(0);
    setTotalSessions(0);
    setTimerContext('Timer');
    setIsRunning(false);
    if (alertAudioRef.current) alertAudioRef.current.pause();
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
  };

  // Resolve background URL
  const bgUrl = hydrated ? resolveBackgroundImageUrl(settings) : null;

  useEffect(() => { setBgBroken(false); }, [bgUrl]);

  // Auto-detect background brightness and set dark/light theme
  useEffect(() => {
    if (!bgUrl) {
      setTheme('system');
      return;
    }
    detectImageBrightness(bgUrl).then((brightness) => {
      setTheme(brightness === 'dark' ? 'dark' : 'light');
    });
  }, [bgUrl, setTheme]);

  // Build individual component nodes
  const comps = settings.components;

  // Determine if clock should be suppressed (timer face takes priority in same slot)
  const clockSuppressed =
    comps.timerFace.slot !== null &&
    comps.clock.slot !== null &&
    comps.timerFace.slot === comps.clock.slot;

  const componentNodes: Record<ComponentId, ComponentEntry | null> = {
    timerFace: {
      id: 'timerFace',
      node: (
        <TimerFaceBlock
          timerContext={timerContext}
          minuteCount={minuteCount}
          secondCount={secondCount}
          pad={pad}
          titleOverride={settings.labels.timerTitleOverride}
          size={comps.timerFace.size}
          color={comps.timerFace.color}
        />
      ),
    },
    timerStudyInput: {
      id: 'timerStudyInput',
      node: (
        <TimerInputBlock
          inputType="study"
          value={studyTime}
          isRunning={isRunning}
          onChange={setStudyTime}
          label={settings.labels.study || 'Study'}
          color={comps.timerStudyInput.color}
          size={comps.timerStudyInput.size}
        />
      ),
    },
    timerBreakInput: {
      id: 'timerBreakInput',
      node: (
        <TimerInputBlock
          inputType="break"
          value={breakTime}
          isRunning={isRunning}
          onChange={setBreakTime}
          label={settings.labels.break || 'Break'}
          color={comps.timerBreakInput.color}
          size={comps.timerBreakInput.size}
        />
      ),
    },
    timerSessionsInput: {
      id: 'timerSessionsInput',
      node: (
        <TimerInputBlock
          inputType="sessions"
          value={totalSessions}
          isRunning={isRunning}
          onChange={setTotalSessions}
          label={settings.labels.sessions || 'Sessions'}
          color={comps.timerSessionsInput.color}
          size={comps.timerSessionsInput.size}
        />
      ),
    },
    timerStartBtn: {
      id: 'timerStartBtn',
      node: (
        <TimerBtnBlock
          btnType="start"
          isRunning={isRunning}
          onClick={handleStart}
          color={comps.timerStartBtn.color}
          size={comps.timerStartBtn.size}
        />
      ),
    },
    timerResetBtn: {
      id: 'timerResetBtn',
      node: (
        <TimerBtnBlock
          btnType="reset"
          isRunning={isRunning}
          onClick={resetTimer}
          color={comps.timerResetBtn.color}
          size={comps.timerResetBtn.size}
        />
      ),
    },
    clock: clockSuppressed
      ? null
      : {
          id: 'clock',
          node: (
            <ClockBlock
              now={now}
              settings={settings}
              size={comps.clock.size}
              color={comps.clock.color}
            />
          ),
        },
    dateLine: {
      id: 'dateLine',
      node: (
        <DateLineBlock
          now={now}
          color={comps.dateLine.color}
          size={comps.dateLine.size}
        />
      ),
    },
  };

  // Build slot map: slot → ComponentEntry[]
  const slotMap: Record<string, ComponentEntry[]> = {};
  for (const id of COMPONENT_IDS) {
    const slot = comps[id].slot;
    if (!slot) continue;
    const entry = componentNodes[id];
    if (!entry) continue;
    if (!slotMap[slot]) slotMap[slot] = [];
    slotMap[slot].push(entry);
  }

  const opacity = settings.background.opacity;

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-x-hidden font-['Rubik',sans-serif] font-sans transition-colors duration-300",
        !bgUrl && 'bg-background text-foreground'
      )}
    >
      {/* Background image */}
      {bgUrl && !bgBroken && (
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
          role="img"
          aria-hidden
        />
      )}
      {/* Overlay with user-configurable opacity */}
      {bgUrl && !bgBroken && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-background"
          style={{ opacity }}
        />
      )}

      {/* Hidden img for error detection */}
      {bgUrl ? (
        <img src={bgUrl} alt="" className="hidden" onError={() => setBgBroken(true)} />
      ) : null}

      <div className="relative z-[2] flex min-h-screen flex-col">
        {/* Settings button */}
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
