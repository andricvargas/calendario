import { Day } from '../entities/Day';

export interface ProgressData {
  fecha: string;
  habito_1: number;
  habito_2: number;
  habito_3: number;
  habito_4: number;
  habito_5: number;
  habito_6: number;
  habito_7: number;
  habito_8: number;
}

export interface ProgressRepository {
  getProgressByMonth(year: number, month: number): Promise<Day[]>;
  saveDay(day: Day): Promise<void>;
  getAllProgress(): Promise<ProgressData[]>;
}

