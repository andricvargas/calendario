export interface DateService {
  getCurrentDate(): Date;
  isToday(date: Date): boolean;
  getDaysInMonth(year: number, month: number): number;
  formatDate(date: Date): string;
  parseDate(dateString: string): Date;
}

