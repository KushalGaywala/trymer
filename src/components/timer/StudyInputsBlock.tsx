import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { sizeClass, type TextSize } from '@/lib/app-settings';

type Props = {
  studyTime: number;
  breakTime: number;
  totalSessions: number;
  isRunning: boolean;
  onStudyTime: (n: number) => void;
  onBreakTime: (n: number) => void;
  onTotalSessions: (n: number) => void;
  onStart: () => void;
  onReset: () => void;
  labelStudy: string;
  labelBreak: string;
  labelSessions: string;
  size: TextSize;
};

export function StudyInputsBlock({
  studyTime,
  breakTime,
  totalSessions,
  isRunning,
  onStudyTime,
  onBreakTime,
  onTotalSessions,
  onStart,
  onReset,
  labelStudy,
  labelBreak,
  labelSessions,
  size,
}: Props) {
  const ls = labelStudy || 'Study Time';
  const lb = labelBreak || 'Break Time';
  const lss = labelSessions || 'Sessions';
  const body = sizeClass(size, 'body');
  const title = sizeClass(size, 'title');

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2 w-full max-w-[300px]', body)}>
      <div className="flex justify-between items-center w-full gap-2">
        <Label className={cn('flex-1 text-foreground', title)}>{ls}</Label>
        <Input
          type="number"
          value={studyTime || ''}
          onChange={(e) => onStudyTime(Number(e.target.value))}
          placeholder="(in minutes)"
          className="h-[30px] text-sm flex-1 bg-background/80 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex justify-between items-center w-full gap-2">
        <Label className={cn('flex-1 text-foreground', title)}>{lb}</Label>
        <Input
          type="number"
          value={breakTime || ''}
          onChange={(e) => onBreakTime(Number(e.target.value))}
          placeholder="(in minutes)"
          className="h-[30px] text-sm flex-1 bg-background/80 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex justify-between items-center w-full gap-2 mb-2">
        <Label className={cn('flex-1 text-foreground', title)}>{lss}</Label>
        <Input
          type="number"
          value={totalSessions || ''}
          onChange={(e) => onTotalSessions(Number(e.target.value))}
          placeholder="No. of Sessions"
          className="h-[30px] text-sm flex-1 bg-background/80 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex justify-center items-center w-full space-x-2">
        <Button
          onClick={onStart}
          className={cn(
            'h-[35px] flex-[0.5]',
            isRunning
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-background/80 hover:bg-muted text-foreground border border-border'
          )}
        >
          {isRunning ? 'Stop' : 'Start'}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="h-[35px] flex-[0.5] bg-background/80"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
