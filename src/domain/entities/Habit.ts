export class Habit {
  constructor(
    public readonly id: number,
    public completed: boolean
  ) {
    if (id < 1) {
      throw new Error('El ID del hábito debe ser mayor a 0');
    }
  }

  markAsCompleted(): void {
    this.completed = true;
  }

  markAsIncomplete(): void {
    this.completed = false;
  }

  toggle(): void {
    this.completed = !this.completed;
  }
}

