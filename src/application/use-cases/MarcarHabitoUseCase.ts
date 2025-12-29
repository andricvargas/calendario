import { Day } from '@domain/entities/Day';
import { ProgressRepository } from '@domain/repositories/ProgressRepository';
import { DateService } from '@domain/services/DateService';

export class MarcarHabitoUseCase {
  constructor(
    private progressRepository: ProgressRepository,
    private dateService: DateService
  ) {}

  async execute(day: Day, habitId: number): Promise<void> {
    if (!day.canEdit()) {
      throw new Error('Solo se puede editar el día actual');
    }

    if (habitId < 1 || habitId > 8) {
      throw new Error('El ID del hábito debe estar entre 1 y 8');
    }

    day.toggleHabit(habitId);
    await this.progressRepository.saveDay(day);
  }
}

