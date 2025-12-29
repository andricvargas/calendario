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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Fecha inválida: ${dateString}`);
    }
    return date;
  }
}

