import { useState, useEffect, useRef } from 'react';
import styles from './Timer.module.css';

export function Timer() {
  const [studyTime, setStudyTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [minuteCount, setMinuteCount] = useState<number>(0);
  const [secondCount, setSecondCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [timerSwitch, setTimerSwitch] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [audioSwitch, setAudioSwitch] = useState<number>(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/mixkit-industry-alarm-tone-2979.wav');
  }, []);

  const clearTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const clearAudioInterval = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  const playAlertAudio = () => {
    clearTimerInterval();
    if (audioRef.current) {
      audioRef.current.play();
      audioRef.current.loop = true;
    }
    
    let audioSecondCount = 0;
    audioIntervalRef.current = setInterval(() => {
      if (audioSecondCount <= 8) {
        setAudioSwitch(1);
        audioSecondCount++;
      } else {
        setAudioSwitch(0);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        clearAudioInterval();
        audioSecondCount = 0;
        startTimerInterval();
      }
    }, 1000);
  };

  const startTimerInterval = () => {
    timerIntervalRef.current = setInterval(() => {
      setSecondCount(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (!isRunning) return;

    if (sessionCount <= totalSessions) {
      if (timerSwitch) {
        if (secondCount < 59 && minuteCount < studyTime) {
          // Continue study timer
        } else if (minuteCount < studyTime) {
          setSecondCount(0);
          setMinuteCount(prev => prev + 1);
        } else {
          setSecondCount(0);
          setMinuteCount(0);
          setTimerSwitch(false);
          playAlertAudio();
          setSessionCount(prev => prev + 1);
        }
      } else {
        if (secondCount < 59 && minuteCount < breakTime) {
          // Continue break timer
        } else if (minuteCount < breakTime) {
          setSecondCount(0);
          setMinuteCount(prev => prev + 1);
        } else {
          setSecondCount(0);
          setMinuteCount(0);
          setTimerSwitch(true);
          playAlertAudio();
        }
      }
    } else {
      handleReset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondCount, isRunning]);

  const handleStartStop = () => {
    if (!isRunning) {
      if (audioSwitch) {
        if (audioRef.current) {
          audioRef.current.play();
        }
        startTimerInterval();
      } else {
        startTimerInterval();
      }
      setIsRunning(true);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      clearTimerInterval();
      clearAudioInterval();
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setMinuteCount(0);
    setSecondCount(0);
    setSessionCount(1);
    setTimerSwitch(true);
    setAudioSwitch(0);
    setStudyTime(0);
    setBreakTime(0);
    setTotalSessions(0);
    setIsRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    clearAudioInterval();
    clearTimerInterval();
  };

  const pad = (digit: number): string => {
    return digit < 10 ? `0${digit}` : `${digit}`;
  };

  const getContext = (): string => {
    const sessionInfo = `${sessionCount}/${totalSessions}`;
    return timerSwitch ? `Study Timer ${sessionInfo}` : `Break Timer ${sessionCount - 1}/${totalSessions}`;
  };

  return (
    <div className={styles.body}>
      <div className={styles.fields}>
        <div className={styles.control}>
          <h3 className={styles.label}>Study Time</h3>
          <input
            type="number"
            value={studyTime || ''}
            onChange={(e) => setStudyTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className={styles.input}
          />
        </div>
        <div className={styles.control}>
          <h3 className={styles.label}>Break Time</h3>
          <input
            type="number"
            value={breakTime || ''}
            onChange={(e) => setBreakTime(Number(e.target.value))}
            placeholder="(in minutes)"
            className={styles.input}
          />
        </div>
        <div className={styles.control}>
          <h3 className={styles.label}>Sessions</h3>
          <input
            type="number"
            value={totalSessions || ''}
            onChange={(e) => setTotalSessions(Number(e.target.value))}
            placeholder="No. of Sessions"
            className={styles.input}
          />
        </div>
        <div className={styles.control}>
          <button
            onClick={handleStartStop}
            className={isRunning ? styles.buttonActive : styles.button}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className={`${styles.button} ${styles.resetButton}`}
          >
            Reset
          </button>
        </div>
      </div>
      
      <main className={styles.container}>
        <h3 className={styles.contextText}>{getContext()}</h3>
        <h1 className={styles.timerText}>{pad(minuteCount)}:{pad(secondCount)}</h1>
      </main>
      
      <footer className={styles.footer}>
        <Clock />
      </footer>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date();
      const hours = today.getHours();
      const minutes = today.getMinutes();
      const seconds = today.getSeconds();
      const day = today.getDay();
      const month = today.getMonth() + 1;
      const dateNum = today.getDate();

      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      
      setTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      setDate(`${getDay(day)}, ${getMonth(month)} ${pad(dateNum)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getDay = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'No Day';
  };

  const getMonth = (month: number): string => {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || 'No Month';
  };

  return (
    <>
      <h1 className={styles.clockText}>{time}</h1>
      <h3 className={styles.dateText}>{date}</h3>
    </>
  );
}
