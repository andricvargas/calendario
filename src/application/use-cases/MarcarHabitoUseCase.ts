import { Day } from '@domain/entities/Day';
import { ProgressRepository } from '@domain/repositories/ProgressRepository';
import { DateService } from '@domain/services/DateService';

export class MarcarHabitoUseCase {
  constructor(
    private progressRepository: ProgressRepository,
    // @ts-ignore - dateService reservado para uso futuro
    private _dateService: DateService
  ) {}

  async execute(day: Day, habitId: number): Promise<void> {
    const fecha = day.getDateString();
    console.log(`[MarcarHabitoUseCase] Inicio - fecha: ${fecha}, habitId: ${habitId}`);
    
    if (!day.canEdit()) {
      console.log(`[MarcarHabitoUseCase] Error: Día no editable - ${fecha}`);
      throw new Error('No se pueden editar días futuros');
    }

    if (habitId < 1) {
      console.log(`[MarcarHabitoUseCase] Error: ID de hábito inválido - ${habitId}`);
      throw new Error('El ID del hábito debe ser mayor a 0');
    }

    const habitBefore = day.getHabit(habitId);
    console.log(`[MarcarHabitoUseCase] Estado antes del toggle - completado: ${habitBefore.completed}`);
    
    day.toggleHabit(habitId);
    
    const habitAfter = day.getHabit(habitId);
    console.log(`[MarcarHabitoUseCase] Estado después del toggle - completado: ${habitAfter.completed}`);
    
    console.log(`[MarcarHabitoUseCase] Guardando día en repositorio...`);
    await this.progressRepository.saveDay(day);
    console.log(`[MarcarHabitoUseCase] Día guardado exitosamente`);
  }
}
