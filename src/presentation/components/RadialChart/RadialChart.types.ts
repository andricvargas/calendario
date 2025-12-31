export interface HabitProgress {
  fecha: string;
  habito_1: number;
  habito_2: number;
  habito_3: number;
  habito_4: number;
  habito_5: number;
  habito_6: number;
  habito_7: number;
  habito_8: number;
  isEditable?: boolean;
}

export interface RadialChartProps {
  progress: HabitProgress[];
  onDayClick?: (fecha: string) => void;
  onHabitToggle?: (fecha: string, habitId: number) => Promise<void>;
  currentDate: Date;
  viewDate: Date; // Fecha del mes que se está visualizando
  habitNames?: string[]; // Nombres editables de los hábitos
  selectedDay?: string; // Fecha del día seleccionado
}

export interface SegmentData {
  day: number;
  fecha: string;
  habits: number[];
  isToday: boolean;
  isEditable: boolean;
  angle: number;
  startAngle: number;
  endAngle: number;
}

