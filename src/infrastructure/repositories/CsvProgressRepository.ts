import { ProgressRepository, ProgressData } from '@domain/repositories/ProgressRepository';
import { Day } from '@domain/entities/Day';
import { Habit } from '@domain/entities/Habit';
import { DateService } from '@domain/services/DateService';
import { CsvAdapter } from '../csv/CsvAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CsvProgressRepository implements ProgressRepository {
  private csvPath: string;
  private csvAdapter: CsvAdapter;
  private dateService: DateService;

  constructor(
    csvPath: string,
    csvAdapter: CsvAdapter,
    dateService: DateService
  ) {
    this.csvPath = csvPath;
    this.csvAdapter = csvAdapter;
    this.dateService = dateService;
  }

  async getProgressByMonth(year: number, month: number): Promise<Day[]> {
    const allData = await this.getAllProgress();
    const days: Day[] = [];
    const daysInMonth = this.dateService.getDaysInMonth(year, month);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = this.dateService.formatDate(date);
      const dayData = allData.find((d) => d.fecha === dateString);

      const habits = [
        new Habit(1, dayData?.habito_1 === 1),
        new Habit(2, dayData?.habito_2 === 1),
        new Habit(3, dayData?.habito_3 === 1),
        new Habit(4, dayData?.habito_4 === 1),
        new Habit(5, dayData?.habito_5 === 1),
        new Habit(6, dayData?.habito_6 === 1),
        new Habit(7, dayData?.habito_7 === 1),
        new Habit(8, dayData?.habito_8 === 1),
      ];

      const isToday = this.dateService.isToday(date);
      days.push(new Day(date, habits, isToday));
    }

    return days;
  }

  async saveDay(day: Day): Promise<void> {
    const allData = await this.getAllProgress();
    const dateString = day.getDateString();
    const existingIndex = allData.findIndex((d) => d.fecha === dateString);

    const dayData: ProgressData = {
      fecha: dateString,
      habito_1: day.getHabit(1).completed ? 1 : 0,
      habito_2: day.getHabit(2).completed ? 1 : 0,
      habito_3: day.getHabit(3).completed ? 1 : 0,
      habito_4: day.getHabit(4).completed ? 1 : 0,
      habito_5: day.getHabit(5).completed ? 1 : 0,
      habito_6: day.getHabit(6).completed ? 1 : 0,
      habito_7: day.getHabit(7).completed ? 1 : 0,
      habito_8: day.getHabit(8).completed ? 1 : 0,
    };

    if (existingIndex >= 0) {
      allData[existingIndex] = dayData;
    } else {
      allData.push(dayData);
    }

    // Ordenar por fecha
    allData.sort((a, b) => a.fecha.localeCompare(b.fecha));

    const csvContent = this.csvAdapter.stringify(allData);
    await fs.writeFile(this.csvPath, csvContent, 'utf-8');
  }

  async getAllProgress(): Promise<ProgressData[]> {
    try {
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      if (!csvContent.trim()) {
        return [];
      }
      return this.csvAdapter.parse(csvContent);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Archivo no existe, retornar array vacío
        return [];
      }
      throw error;
    }
  }
}

