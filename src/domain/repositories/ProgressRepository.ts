import { Day } from '../entities/Day';

export interface ProgressData {
  fecha: string;
  [key: string]: string | number; // Permite claves dinámicas para hábitos (habito_1, habito_2, etc.)
}

export interface ProgressRepository {
  getProgressByMonth(year: number, month: number): Promise<Day[]>;
  saveDay(day: Day): Promise<void>;
  getAllProgress(): Promise<ProgressData[]>;
}

