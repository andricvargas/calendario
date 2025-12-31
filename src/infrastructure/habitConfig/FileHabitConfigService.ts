import { HabitConfigService } from '@domain/services/HabitConfigService';
import * as fs from 'fs';

const DEFAULT_HABIT_COUNT = 8;
const MIN_HABIT_COUNT = 1;
const MAX_HABIT_COUNT = 20;

export class FileHabitConfigService implements HabitConfigService {
  private configPath: string;
  private cachedCount: number | null = null;

  constructor(configPath: string) {
    this.configPath = configPath;
  }

  getHabitCount(): number {
    // Usar caché si está disponible
    if (this.cachedCount !== null) {
      return this.cachedCount;
    }

    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const count = parseInt(content.trim(), 10);
        if (!isNaN(count) && count >= MIN_HABIT_COUNT && count <= MAX_HABIT_COUNT) {
          this.cachedCount = count;
          return count;
        }
      }
    } catch (error: any) {
      console.error('Error al leer configuración de hábitos:', error);
    }
    
    this.cachedCount = DEFAULT_HABIT_COUNT;
    return DEFAULT_HABIT_COUNT;
  }

  setHabitCount(count: number): void {
    if (count < MIN_HABIT_COUNT || count > MAX_HABIT_COUNT) {
      throw new Error(`El número de hábitos debe estar entre ${MIN_HABIT_COUNT} y ${MAX_HABIT_COUNT}`);
    }
    try {
      fs.writeFileSync(this.configPath, count.toString(), 'utf-8');
      this.cachedCount = count; // Actualizar caché
    } catch (error) {
      console.error('Error al guardar configuración de hábitos:', error);
      throw error;
    }
  }

  // Método para invalidar caché (útil para recargar desde archivo)
  invalidateCache(): void {
    this.cachedCount = null;
  }
}
