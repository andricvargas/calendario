import { RadialChartProps } from '../RadialChart/RadialChart.types';

export interface MobileHabitViewProps {
  progress: RadialChartProps['progress'];
  onHabitToggle?: RadialChartProps['onHabitToggle'];
  currentDate: Date;
  viewDate: Date;
  habitNames?: string[];
  habitCount?: number;
  onUpdateHabitName?: (habitId: number, newName: string) => Promise<void> | void;
  selectedDay?: number | null;
  onNextDay?: () => void;
  onPreviousDay?: () => void;
}

