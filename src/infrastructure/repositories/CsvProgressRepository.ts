import { ProgressRepository, ProgressData } from '@domain/repositories/ProgressRepository';
import { Day } from '@domain/entities/Day';
import { Habit } from '@domain/entities/Habit';
import { DateService } from '@domain/services/DateService';
import { HabitConfigService } from '@domain/services/HabitConfigService';
import { CsvAdapter } from '../csv/CsvAdapter';
import * as fs from 'fs/promises';

export class CsvProgressRepository implements ProgressRepository {
  private csvPath: string;
  private csvAdapter: CsvAdapter;
  private dateService: DateService;
  private habitConfigService: HabitConfigService;
  private saveLocks: Map<string, Promise<void>> = new Map();

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
    // Usar formatDate del dateService para asegurar consistencia con el formato del CSV
    const dateString = this.dateService.formatDate(day.date);
    const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day.date.getDay()];
    const dayNumber = day.date.getDate();
    const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][day.date.getMonth()];
    console.log(`[CsvProgressRepository] ========================================`);
    console.log(`[CsvProgressRepository] saveDay iniciado para fecha: ${dateString}`);
    console.log(`[CsvProgressRepository] Día de registro: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${day.date.getFullYear()}`);
    console.log(`[CsvProgressRepository] Fecha del objeto Day.getDateString(): ${day.getDateString()}`);
    console.log(`[CsvProgressRepository] Fecha usando formatDate: ${dateString}`);
    
    // Implementar bloqueo por fecha para evitar condiciones de carrera
    // Si ya hay un guardado en progreso para esta fecha, esperar a que termine
    const existingLock = this.saveLocks.get(dateString);
    if (existingLock) {
      console.log(`[CsvProgressRepository] Esperando a que termine el guardado anterior para ${dateString}`);
      await existingLock;
    }
    
    // Crear una nueva promesa de bloqueo para esta fecha
    const savePromise = this.performSave(day, dateString);
    this.saveLocks.set(dateString, savePromise);
    
    try {
      await savePromise;
    } finally {
      // Limpiar el bloqueo cuando termine
      if (this.saveLocks.get(dateString) === savePromise) {
        this.saveLocks.delete(dateString);
      }
    }
  }

  private async performSave(day: Day, dateString: string): Promise<void> {
    // Obtener información del día para los logs
    const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day.date.getDay()];
    const dayNumber = day.date.getDate();
    const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][day.date.getMonth()];
    
    // IMPORTANTE: Cargar el estado más reciente del CSV justo antes de guardar
    // para evitar condiciones de carrera cuando hay múltiples clics rápidos
    const allData = await this.getAllProgress();
    console.log(`[CsvProgressRepository] Datos existentes cargados: ${allData.length} días`);
    
    const existingIndex = allData.findIndex((d) => d.fecha === dateString);
    const habitCount = this.habitConfigService.getHabitCount();
    console.log(`[CsvProgressRepository] Número de hábitos: ${habitCount}, Día existe: ${existingIndex >= 0}`);

    // Obtener los valores del objeto Day (que tiene el toggle aplicado)
    const dayHabitValues: number[] = [];
    console.log(`[CsvProgressRepository] Objeto Day tiene ${day.habits.length} hábitos`);
    for (let i = 1; i <= habitCount; i++) {
      try {
        const habit = day.getHabit(i);
        const value = habit.completed ? 1 : 0;
        dayHabitValues.push(value);
        console.log(`[CsvProgressRepository] Hábito ${i} del objeto Day: ${value} (completed: ${habit.completed})`);
      } catch (error: any) {
        dayHabitValues.push(0);
      }
    }
    console.log(`[CsvProgressRepository] Valores del objeto Day: [${dayHabitValues.join(', ')}]`);

    if (existingIndex >= 0) {
      console.log(`[CsvProgressRepository] Actualizando día existente en índice ${existingIndex}`);
      // IMPORTANTE: Cargar el estado actual del CSV para preservar cambios concurrentes
      const existingDayData = allData[existingIndex];
      const existingValues: number[] = [];
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        const value = existingDayData[habitKey];
        existingValues.push(value === 1 || value === '1' ? 1 : 0);
      }
      console.log(`[CsvProgressRepository] Valores existentes en CSV: [${existingValues.join(', ')}]`);
      
      // IMPORTANTE: Usar directamente los valores del objeto Day que tiene el toggle aplicado
      // El objeto Day ya tiene el estado correcto después del toggle, así que debemos usar esos valores
      // No hacer merge con OR lógico porque eso impide desmarcar (poner en 0)
      const mergedDayData: ProgressData = {
        fecha: dateString,
      };
      const mergedValues: number[] = [];
      
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        // Usar directamente el valor del objeto Day (que tiene el toggle aplicado)
        const dayValue = dayHabitValues[i - 1] || 0;
        mergedDayData[habitKey] = dayValue;
        mergedValues.push(dayValue);
      }
      
      console.log(`[CsvProgressRepository] Valores del objeto Day (con toggle aplicado): [${mergedValues.join(', ')}]`);
      allData[existingIndex] = mergedDayData;
      console.log(`[CsvProgressRepository] Día actualizado con merge de valores`);
      console.log(`[CsvProgressRepository] Registro completado para: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${day.date.getFullYear()}`);
    } else {
      console.log(`[CsvProgressRepository] Agregando nuevo día`);
      const dayData: ProgressData = {
        fecha: dateString,
      };
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        dayData[habitKey] = dayHabitValues[i - 1] || 0;
      }
      allData.push(dayData);
      console.log(`[CsvProgressRepository] Nuevo día agregado para: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${day.date.getFullYear()}`);
    }

    // Ordenar por fecha (usando comparación de fechas ISO para orden correcto)
    allData.sort((a, b) => {
      // Comparar fechas como strings ISO (YYYY-MM-DD) que se ordenan correctamente
      const dateA = a.fecha.trim();
      const dateB = b.fecha.trim();
      return dateA.localeCompare(dateB);
    });
    console.log(`[CsvProgressRepository] Total de días después de guardar: ${allData.length}`);
    console.log(`[CsvProgressRepository] Fechas ordenadas: ${allData.map(d => d.fecha).join(', ')}`);
    
    // Verificar que el orden es correcto
    const dates = allData.map(d => d.fecha);
    const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
    const isSorted = JSON.stringify(dates) === JSON.stringify(sortedDates);
    console.log(`[CsvProgressRepository] Orden correcto: ${isSorted}`);
    if (!isSorted) {
      console.warn(`[CsvProgressRepository] ADVERTENCIA: El orden no es correcto. Reordenando...`);
      allData.sort((a, b) => a.fecha.trim().localeCompare(b.fecha.trim()));
    }

    // Leer los nombres de los hábitos desde el CSV actual para preservarlos
    let habitNames: string[] | undefined;
    try {
      const currentCsvContent = await fs.readFile(this.csvPath, 'utf-8');
      if (currentCsvContent && currentCsvContent.trim()) {
        habitNames = this.csvAdapter.extractHabitNames(currentCsvContent, habitCount);
        console.log(`[CsvProgressRepository] Nombres de hábitos extraídos del CSV: ${habitNames.join(', ')}`);
      } else {
        console.log(`[CsvProgressRepository] CSV vacío, usando nombres por defecto`);
      }
    } catch (error: any) {
      // Si el archivo no existe o hay otro error, usar nombres por defecto
      if (error.code === 'ENOENT') {
        console.log(`[CsvProgressRepository] Archivo CSV no existe aún, usando nombres por defecto`);
      } else {
        console.warn(`[CsvProgressRepository] No se pudieron leer los nombres de hábitos del CSV, usando valores por defecto:`, error.message);
      }
    }

    const csvContent = this.csvAdapter.stringify(allData, habitCount, habitNames);
    console.log(`[CsvProgressRepository] CSV generado, longitud: ${csvContent.length} caracteres`);
    console.log(`[CsvProgressRepository] Total de datos a guardar: ${allData.length}`);
    console.log(`[CsvProgressRepository] Primeras líneas del CSV:\n${csvContent.split('\n').slice(0, 5).join('\n')}`);
    console.log(`[CsvProgressRepository] Ruta absoluta del archivo: ${this.csvPath}`);
    
    try {
      await fs.writeFile(this.csvPath, csvContent, 'utf-8');
      console.log(`[CsvProgressRepository] Archivo guardado exitosamente en: ${this.csvPath}`);
      
      // Verificar que el archivo existe y tiene contenido
      const stats = await fs.stat(this.csvPath);
      console.log(`[CsvProgressRepository] Archivo existe, tamaño: ${stats.size} bytes`);
      
      // Verificar que el archivo se escribió correctamente
      const verifyContent = await fs.readFile(this.csvPath, 'utf-8');
      console.log(`[CsvProgressRepository] Verificación: archivo leído, longitud: ${verifyContent.length} caracteres`);
      const verifyData = this.csvAdapter.parse(verifyContent, habitCount);
      console.log(`[CsvProgressRepository] Verificación: ${verifyData.length} días en el archivo`);
      const dayExists = verifyData.find((d) => d.fecha === dateString);
      const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day.date.getDay()];
      const dayNumber = day.date.getDate();
      const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][day.date.getMonth()];
      console.log(`[CsvProgressRepository] Verificación: día ${dateString} existe en archivo: ${!!dayExists}`);
      console.log(`[CsvProgressRepository] Día de registro: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${day.date.getFullYear()}`);
      if (dayExists) {
        const savedHabits = [];
        for (let i = 1; i <= habitCount; i++) {
          savedHabits.push(dayExists[`habito_${i}`] || 0);
        }
        console.log(`[CsvProgressRepository] Verificación: valores guardados en CSV: [${savedHabits.join(', ')}]`);
      }
      console.log(`[CsvProgressRepository] ========================================`);
    } catch (error: any) {
      console.error(`[CsvProgressRepository] Error al escribir archivo:`, error);
      throw error;
    }
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

  // Método para actualizar los headers del CSV con los nombres personalizados de los hábitos
  async updateHabitNames(habitNames: string[]): Promise<void> {
    try {
      // Cargar todos los datos existentes
      const allData = await this.getAllProgress();
      const habitCount = this.habitConfigService.getHabitCount();
      
      // Validar que el número de nombres coincida con el número de hábitos
      if (habitNames.length !== habitCount) {
        throw new Error(`El número de nombres (${habitNames.length}) no coincide con el número de hábitos (${habitCount})`);
      }
      
      // Reescribir el CSV con los nuevos headers
      const csvContent = this.csvAdapter.stringify(allData, habitCount, habitNames);
      await fs.writeFile(this.csvPath, csvContent, 'utf-8');
      
      console.log(`[CsvProgressRepository] Headers del CSV actualizados con nombres personalizados`);
    } catch (error: any) {
      console.error(`[CsvProgressRepository] Error al actualizar nombres de hábitos:`, error);
      throw error;
    }
  }
}

