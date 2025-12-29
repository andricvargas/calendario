import { Habit } from './Habit';

export class Day {
  constructor(
    public readonly date: Date,
    public readonly habits: Habit[],
    private readonly isToday: boolean
  ) {
    if (habits.length !== 8) {
      throw new Error('Un día debe tener exactamente 8 hábitos');
    }
    this.validateDate(date);
  }

  private validateDate(date: Date): void {
    if (isNaN(date.getTime())) {
      throw new Error('La fecha proporcionada no es válida');
    }
  }

  isEditable(): boolean {
    // Permitir editar el día actual y días pasados
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(this.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate <= today;
  }

  canEdit(): boolean {
    return this.isEditable();
  }

  getHabit(habitId: number): Habit {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) {
      throw new Error(`Hábito con ID ${habitId} no encontrado`);
    }
    return habit;
  }

  toggleHabit(habitId: number): void {
    if (!this.canEdit()) {
      throw new Error('Solo se pueden editar días actuales o pasados');
    }
    const habit = this.getHabit(habitId);
    habit.toggle();
  }

  getCompletionCount(): number {
    return this.habits.filter((h) => h.completed).length;
  }

  isFullyCompleted(): boolean {
    return this.getCompletionCount() === 8;
  }

  getDateString(): string {
    return this.date.toISOString().split('T')[0];
  }
}

