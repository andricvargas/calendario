export interface HabitProgress {
  fecha: string;
  [key: string]: string | number | boolean | undefined; // Permite claves dinámicas para hábitos (habito_1, habito_2, etc.)
  isEditable?: boolean;
}

export interface RadialChartProps {
  progress: HabitProgress[];
  onHabitToggle?: (fecha: string, habitId: number) => Promise<void>;
  currentDate: Date;
  viewDate: Date; // Fecha del mes que se está visualizando
  habitNames?: string[]; // Nombres editables de los hábitos
  habitCount?: number; // Número de hábitos (por defecto 8)
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

