import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const AUDIO_ALERT_DURATION = 8; // seconds

export function Timer() {
  const [studyTime, setStudyTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [minuteCount, setMinuteCount] = useState<number>(0);
  const [secondCount, setSecondCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [timerSwitch, setTimerSwitch] = useState<boolean>(true);
  const [timerContext, setTimerContext] = useState<string>('Study Timer');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioSecondRef = useRef<number>(0);
  const tickRef = useRef<() => void>(() => {});
  const isRunningRef = useRef<boolean>(false);

  const pad = (digit: number): string => {
    return digit < 10 ? '0' + digit : digit.toString();
  };

  const getDay = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'No Day';
  };

  const getMonth = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month] || 'No Month';
  };

  const updateClock = useCallback(() => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDay();
    const date = today.getDate();
    const hour = today.getHours();
    const minute = today.getMinutes();
    const seconds = today.getSeconds();

    setCurrentTime(`${pad(hour)}:${pad(minute)}:${pad(seconds)}`);
    setCurrentDate(`${getDay(day)}, ${getMonth(month)} ${pad(date)}`);
  }, []);

  const currContext = (context: string, cur: number, total: number): string => {
    return `${context} ${cur}/${total}`;
  };

  // Keep ref current so interval callbacks always call the latest tick
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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
        // Restart the timer interval after audio finishes (mirrors original JS callTimerInterval())
        if (isRunningRef.current) {
          timerIntervalRef.current = setInterval(() => {
            tickRef.current();
          }, 1000);
        }
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
      // Study timer
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
      // Break timer
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

  useEffect(() => {
    alertAudioRef.current = new Audio('/mixkit-industry-alarm-tone-2979.wav');
    
    // Start clock
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
    if (isRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        tickRef.current();
      }, 1000);
    }

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white transition-colors duration-300 font-['Rubik',sans-serif] relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600 rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Input fields */}
      <div className="flex flex-col items-center justify-center h-[25vh] space-y-2 relative z-10">
        <div className="flex justify-between items-center w-[300px]">
          <Label className="flex-1 text-white/90">Study Time</Label>
          <Input
            type="number"
            value={studyTime || ''}
            onChange={(e) => setStudyTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className="h-[30px] text-sm flex-1 ml-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm"
          />
        </div>
        <div className="flex justify-between items-center w-[300px]">
          <Label className="flex-1 text-white/90">Break Time</Label>
          <Input
            type="number"
            value={breakTime || ''}
            onChange={(e) => setBreakTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className="h-[30px] text-sm flex-1 ml-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm"
          />
        </div>
        <div className="flex justify-between items-center w-[300px] mb-2">
          <Label className="flex-1 text-white/90">Sessions</Label>
          <Input
            type="number"
            value={totalSessions || ''}
            onChange={(e) => setTotalSessions(Number(e.target.value))}
            placeholder="No. of Sessions"
            className="h-[30px] text-sm flex-1 ml-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm"
          />
        </div>
        <div className="flex justify-center items-center w-[300px] space-x-2">
          <Button
            onClick={handleStart}
            className={`h-[35px] flex-[0.5] ${isRunning ? 'bg-white text-indigo-950 hover:bg-white/90 border-0' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm'}`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </Button>
          <Button
            onClick={resetTimer}
            className="h-[35px] flex-[0.5] bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Timer display */}
      <main className="flex flex-col items-center justify-center text-[2em] h-[50vh] relative z-10">
        <h3 className="mb-4 text-white/80 text-[0.5em] tracking-widest uppercase">{timerContext}</h3>
        <h1 className="text-[2em] font-bold text-white drop-shadow-lg">{pad(minuteCount)}:{pad(secondCount)}</h1>
      </main>

      {/* Clock/Date display */}
      <footer className="flex flex-col items-center justify-center text-[2em] h-[25vh] relative z-10">
        <h1 className="text-[2em] font-bold text-white drop-shadow-lg">{currentTime}</h1>
        <h3 className="text-white/80 text-[0.5em] mt-2">{currentDate}</h3>
      </footer>
    </div>
  );
}
