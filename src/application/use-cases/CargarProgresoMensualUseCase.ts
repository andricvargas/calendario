import { Day } from '@domain/entities/Day';
import { ProgressRepository } from '@domain/repositories/ProgressRepository';
import { DateService } from '@domain/services/DateService';

export class CargarProgresoMensualUseCase {
  constructor(
    private progressRepository: ProgressRepository,
    private dateService: DateService
  ) {}

  async execute(year?: number, month?: number): Promise<Day[]> {
    const currentDate = this.dateService.getCurrentDate();
    const targetYear = year ?? currentDate.getFullYear();
    const targetMonth = month ?? currentDate.getMonth();

    if (targetMonth < 0 || targetMonth > 11) {
      throw new Error('El mes debe estar entre 0 y 11');
    }

    return this.progressRepository.getProgressByMonth(targetYear, targetMonth);
  }
}

