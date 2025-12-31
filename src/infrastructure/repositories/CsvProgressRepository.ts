import { ProgressRepository, ProgressData } from '@domain/repositories/ProgressRepository';
import { Day } from '@domain/entities/Day';
import { Habit } from '@domain/entities/Habit';
import { DateService } from '@domain/services/DateService';
import { HabitConfigService } from '@domain/services/HabitConfigService';
import { CsvAdapter } from '../csv/CsvAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CsvProgressRepository implements ProgressRepository {
  private csvPath: string;
  private csvAdapter: CsvAdapter;
  private dateService: DateService;
  private habitConfigService: HabitConfigService;

  constructor(
    csvPath: string,
    csvAdapter: CsvAdapter,
    dateService: DateService,
    habitConfigService: HabitConfigService
  ) {
    this.csvPath = csvPath;
    this.csvAdapter = csvAdapter;
    this.dateService = dateService;
    this.habitConfigService = habitConfigService;
  }

  async getProgressByMonth(year: number, month: number): Promise<Day[]> {
    const allData = await this.getAllProgress();
    const days: Day[] = [];
    const daysInMonth = this.dateService.getDaysInMonth(year, month);
    const habitCount = this.habitConfigService.getHabitCount();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = this.dateService.formatDate(date);
      const dayData = allData.find((d) => d.fecha === dateString);

      // Crear hábitos dinámicamente
      const habits: Habit[] = [];
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}` as keyof ProgressData;
        const completed = dayData?.[habitKey] === 1 || dayData?.[habitKey] === '1';
        habits.push(new Habit(i, completed));
      }

      const isToday = this.dateService.isToday(date);
      days.push(new Day(date, habits, isToday));
    }

    return days;
  }

  async saveDay(day: Day): Promise<void> {
    const dateString = day.getDateString();
    console.log(`[CsvProgressRepository] saveDay iniciado para fecha: ${dateString}`);
    
    const allData = await this.getAllProgress();
    console.log(`[CsvProgressRepository] Datos existentes cargados: ${allData.length} días`);
    
    const existingIndex = allData.findIndex((d) => d.fecha === dateString);
    const habitCount = this.habitConfigService.getHabitCount();
    console.log(`[CsvProgressRepository] Número de hábitos: ${habitCount}, Día existe: ${existingIndex >= 0}`);

    const dayData: ProgressData = {
      fecha: dateString,
    };

    // Guardar todos los hábitos dinámicamente
    const habitValues: number[] = [];
    for (let i = 1; i <= habitCount; i++) {
      const habitKey = `habito_${i}`;
      try {
        const habit = day.getHabit(i);
        const value = habit.completed ? 1 : 0;
        dayData[habitKey] = value;
        habitValues.push(value);
      } catch (error: any) {
        // Si el hábito no existe, marcarlo como incompleto
        console.log(`[CsvProgressRepository] Hábito ${i} no encontrado, marcando como 0`);
        dayData[habitKey] = 0;
        habitValues.push(0);
      }
    }

    console.log(`[CsvProgressRepository] Valores de hábitos: [${habitValues.join(', ')}]`);

    if (existingIndex >= 0) {
      console.log(`[CsvProgressRepository] Actualizando día existente en índice ${existingIndex}`);
      allData[existingIndex] = dayData;
    } else {
      console.log(`[CsvProgressRepository] Agregando nuevo día`);
      allData.push(dayData);
    }

    // Ordenar por fecha
    allData.sort((a, b) => a.fecha.localeCompare(b.fecha));
    console.log(`[CsvProgressRepository] Total de días después de guardar: ${allData.length}`);

    const csvContent = this.csvAdapter.stringify(allData, habitCount);
    console.log(`[CsvProgressRepository] CSV generado, longitud: ${csvContent.length} caracteres`);
    
    await fs.writeFile(this.csvPath, csvContent, 'utf-8');
    console.log(`[CsvProgressRepository] Archivo guardado exitosamente en: ${this.csvPath}`);
  }

  async getAllProgress(): Promise<ProgressData[]> {
    try {
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      if (!csvContent.trim()) {
        return [];
      }
      const habitCount = this.habitConfigService.getHabitCount();
      return this.csvAdapter.parse(csvContent, habitCount);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Archivo no existe, retornar array vacío
        return [];
      }
      throw error;
    }
  }
}

