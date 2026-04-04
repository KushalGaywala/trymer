import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import { resolveBackgroundImageUrl } from '@/lib/app-settings';
import { AppSettingsSheet } from '@/components/settings/AppSettingsSheet';
import { StudyInputsBlock } from '@/components/timer/StudyInputsBlock';
import { TimerFaceBlock } from '@/components/timer/TimerFaceBlock';
import { HeroBlock } from '@/components/timer/HeroBlock';
import { ThemeToggleBlock } from '@/components/timer/ThemeToggleBlock';
import { TimerGrid } from '@/components/timer/TimerGrid';
import { cn } from '@/lib/utils';

const AUDIO_ALERT_DURATION = 8;

export function Timer() {
  const { settings, setSettings, updatePlacement, resetToDefaults, hydrated } = useAppSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [studyTime, setStudyTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [minuteCount, setMinuteCount] = useState<number>(0);
  const [secondCount, setSecondCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [timerSwitch, setTimerSwitch] = useState<boolean>(true);
  const [timerContext, setTimerContext] = useState<string>('Study Timer');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [now, setNow] = useState(() => new Date());
  const [bgBroken, setBgBroken] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioSecondRef = useRef<number>(0);
  const tickRef = useRef<() => void>(() => {});

  const pad = (digit: number): string => {
    return digit < 10 ? '0' + digit : digit.toString();
  };

  const currContext = (context: string, cur: number, total: number): string => {
    return `${context} ${cur}/${total}`;
  };

  const updateClock = useCallback(() => {
    setNow(new Date());
  }, []);

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
        if (alertAudioRef.current) {
          alertAudioRef.current.pause();
        }
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
      setTimerContext('Study Timer');
      setIsRunning(false);
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    if (timerSwitch) {
      if (secondCount < 59 && minuteCount < studyTime) {
        setTimerContext(currContext('Study Timer', sessionCount, totalSessions));
        setSecondCount(secondCount + 1);
      } else if (minuteCount < studyTime - 1) {
        setSecondCount(0);
        setMinuteCount(minuteCount + 1);
      } else if (minuteCount === studyTime - 1 && secondCount === 59) {
        setSecondCount(0);
        setMinuteCount(0);
        setTimerSwitch(false);
        setTimerContext(currContext('Break Timer', sessionCount, totalSessions));
        setSessionCount(sessionCount + 1);
        playAlertAudio();
      } else {
        setSecondCount(secondCount + 1);
      }
    } else {
      if (secondCount < 59 && minuteCount < breakTime) {
        setTimerContext(currContext('Break Timer', sessionCount - 1, totalSessions));
        setSecondCount(secondCount + 1);
      } else if (minuteCount < breakTime - 1) {
        setSecondCount(0);
        setMinuteCount(minuteCount + 1);
      } else if (minuteCount === breakTime - 1 && secondCount === 59) {
        setSecondCount(0);
        setMinuteCount(0);
        setTimerSwitch(true);
        setTimerContext(currContext('Study Timer', sessionCount, totalSessions));
        playAlertAudio();
      } else {
        setSecondCount(secondCount + 1);
      }
    }
  }, [sessionCount, totalSessions, timerSwitch, secondCount, minuteCount, studyTime, breakTime, playAlertAudio]);

  tickRef.current = tick;

  useEffect(() => {
    alertAudioRef.current = new Audio('/mixkit-industry-alarm-tone-2979.wav');

    updateClock();
    clockIntervalRef.current = setInterval(updateClock, 1000);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
      }
    };
  }, [updateClock]);

  useEffect(() => {
    if (!isRunning) return;

    timerIntervalRef.current = setInterval(() => {
      tickRef.current();
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
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
    setTimerContext('Study Timer');
    setIsRunning(false);
    if (alertAudioRef.current) {
      alertAudioRef.current.pause();
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const bgUrl = hydrated ? resolveBackgroundImageUrl(settings) : null;

  useEffect(() => {
    setBgBroken(false);
  }, [bgUrl]);

  const blocks = {
    studyInputs: settings.placement.studyInputs ? (
      <StudyInputsBlock
        studyTime={studyTime}
        breakTime={breakTime}
        totalSessions={totalSessions}
        isRunning={isRunning}
        onStudyTime={setStudyTime}
        onBreakTime={setBreakTime}
        onTotalSessions={setTotalSessions}
        onStart={handleStart}
        onReset={resetTimer}
        labelStudy={settings.labels.study}
        labelBreak={settings.labels.break}
        labelSessions={settings.labels.sessions}
        size={settings.blockSizes.studyInputs}
      />
    ) : null,
    timerFace: settings.placement.timerFace ? (
      <TimerFaceBlock
        timerContext={timerContext}
        minuteCount={minuteCount}
        secondCount={secondCount}
        pad={pad}
        titleOverride={settings.labels.timerTitleOverride}
        size={settings.blockSizes.timerFace}
      />
    ) : null,
    hero: settings.placement.hero ? (
      <HeroBlock now={now} settings={settings} heroSize={settings.blockSizes.hero} />
    ) : null,
    themeToggle: settings.placement.themeToggle ? (
      <ThemeToggleBlock size={settings.blockSizes.themeToggle} />
    ) : null,
  };

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-x-hidden font-['Rubik',sans-serif] font-sans transition-colors duration-300",
        !bgUrl && 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
      )}
    >
      {bgUrl && !bgBroken && (
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
          role="img"
          aria-hidden
        />
      )}
      {bgUrl && !bgBroken && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-background/75 dark:bg-background/80" />
      )}

      {bgUrl ? (
        <img src={bgUrl} alt="" className="hidden" onError={() => setBgBroken(true)} />
      ) : null}

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
          updatePlacement={updatePlacement}
          resetToDefaults={resetToDefaults}
        />

        <TimerGrid placement={settings.placement} blocks={blocks} />
      </div>
    </div>
  );
}
