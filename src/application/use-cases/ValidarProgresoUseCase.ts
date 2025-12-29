import { Day } from '@domain/entities/Day';
import { DateService } from '@domain/services/DateService';

export class ValidarProgresoUseCase {
  constructor(private dateService: DateService) {}

  execute(day: Day): {
    isValid: boolean;
    canEdit: boolean;
    completionCount: number;
    isFullyCompleted: boolean;
  } {
    const canEdit = day.canEdit();
    const completionCount = day.getCompletionCount();
    const isFullyCompleted = day.isFullyCompleted();

    return {
      isValid: true,
      canEdit,
      completionCount,
      isFullyCompleted,
    };
  }
}

