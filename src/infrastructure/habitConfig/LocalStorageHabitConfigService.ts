import { HabitConfigService } from '@domain/services/HabitConfigService';

const STORAGE_KEY = 'habit_count';
const DEFAULT_HABIT_COUNT = 8;
const MIN_HABIT_COUNT = 1;
const MAX_HABIT_COUNT = 20; // Límite razonable

export class LocalStorageHabitConfigService implements HabitConfigService {
  getHabitCount(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const count = parseInt(stored, 10);
        if (!isNaN(count) && count >= MIN_HABIT_COUNT && count <= MAX_HABIT_COUNT) {
          return count;
        }
      }
    } catch (error) {
      console.error('Error al cargar número de hábitos:', error);
    }
    return DEFAULT_HABIT_COUNT;
  }

  setHabitCount(count: number): void {
    if (count < MIN_HABIT_COUNT || count > MAX_HABIT_COUNT) {
      throw new Error(`El número de hábitos debe estar entre ${MIN_HABIT_COUNT} y ${MAX_HABIT_COUNT}`);
    }
    try {
      localStorage.setItem(STORAGE_KEY, count.toString());
    } catch (error) {
      console.error('Error al guardar número de hábitos:', error);
      throw error;
    }
  }
}
