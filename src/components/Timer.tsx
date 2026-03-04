import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AUDIO_ALERT_DURATION = 8; // seconds

export function Timer() {
  const { theme, setTheme } = useTheme();
  const { user, signInWithGitHub, signOut } = useAuth();
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
    if (isRunning && !audioIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 font-['Rubik',sans-serif]">
      {/* GitHub auth */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {user ? (
          <>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.user_name ? `${user.user_metadata.user_name}'s GitHub avatar` : 'GitHub user avatar'}
                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
              />
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
              {user.user_metadata?.user_name ?? user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Sign out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={signInWithGitHub}
            className="flex items-center gap-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </Button>
        )}
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // Determine effective theme: if 'system', check actual resolved theme
            const effectiveTheme = theme === 'system'
              ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
              : theme;
            setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
          }}
          className="rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      {/* Input fields */}
      <div className="flex flex-col items-center justify-center h-[25vh] space-y-2">
        <div className="flex justify-between items-center w-[300px]">
          <Label className="flex-1 text-gray-900 dark:text-white">Study Time</Label>
          <Input
            type="number"
            value={studyTime || ''}
            onChange={(e) => setStudyTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className="h-[30px] text-sm flex-1 ml-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex justify-between items-center w-[300px]">
          <Label className="flex-1 text-gray-900 dark:text-white">Break Time</Label>
          <Input
            type="number"
            value={breakTime || ''}
            onChange={(e) => setBreakTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className="h-[30px] text-sm flex-1 ml-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex justify-between items-center w-[300px] mb-2">
          <Label className="flex-1 text-gray-900 dark:text-white">Sessions</Label>
          <Input
            type="number"
            value={totalSessions || ''}
            onChange={(e) => setTotalSessions(Number(e.target.value))}
            placeholder="No. of Sessions"
            className="h-[30px] text-sm flex-1 ml-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex justify-center items-center w-[300px] space-x-2">
          <Button
            onClick={handleStart}
            className={`h-[35px] flex-[0.5] ${isRunning ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600'}`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </Button>
          <Button
            onClick={resetTimer}
            className="h-[35px] flex-[0.5] bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Timer display */}
      <main className="flex flex-col items-center justify-center text-[2em] h-[50vh]">
        <h3 className="mb-4 text-gray-700 dark:text-gray-300">{timerContext}</h3>
        <h1 className="text-[2em] font-bold text-gray-900 dark:text-white">{pad(minuteCount)}:{pad(secondCount)}</h1>
      </main>

      {/* Clock/Date display */}
      <footer className="flex flex-col items-center justify-center text-[2em] h-[25vh]">
        <h1 className="text-[2em] font-bold text-gray-900 dark:text-white">{currentTime}</h1>
        <h3 className="text-gray-600 dark:text-gray-400">{currentDate}</h3>
      </footer>
    </div>
  );
}
