export class Habit {
  constructor(
    public readonly id: number,
    public completed: boolean
  ) {
    if (id < 1 || id > 8) {
      throw new Error('El ID del hábito debe estar entre 1 y 8');
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

