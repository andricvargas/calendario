import { DateService } from '@domain/services/DateService';

export class SystemDateAdapter implements DateService {
  getCurrentDate(): Date {
    return new Date();
  }

  isToday(date: Date): boolean {
    const today = this.getCurrentDate();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseDate(dateString: string): Date {
    // Parsear manualmente la fecha en formato YYYY-MM-DD para evitar problemas de zona horaria
    // new Date("2025-12-31") puede interpretarse como UTC y luego convertirse a hora local,
    // lo que puede cambiar el día
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      throw new Error(`Formato de fecha inválido: ${dateString}. Se espera YYYY-MM-DD`);
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JavaScript son 0-indexed
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Fecha inválida: ${dateString}`);
    }
    
    // Crear la fecha usando los componentes locales (no UTC)
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    // Verificar que la fecha creada corresponde a los valores esperados
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      throw new Error(`Fecha inválida: ${dateString}. La fecha resultante no coincide con los valores esperados`);
    }
    
    return date;
  }
}

