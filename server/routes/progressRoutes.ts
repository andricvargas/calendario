import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { CargarProgresoMensualUseCase } from '../../src/application/use-cases/CargarProgresoMensualUseCase';
import { MarcarHabitoUseCase } from '../../src/application/use-cases/MarcarHabitoUseCase';
import { CsvProgressRepository } from '../../src/infrastructure/repositories/CsvProgressRepository';
import { CsvAdapter } from '../../src/infrastructure/csv/CsvAdapter';
import { SystemDateAdapter } from '../../src/infrastructure/time/SystemDateAdapter';
import { FileHabitConfigService } from '../../src/infrastructure/habitConfig/FileHabitConfigService';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const csvPath = path.join(__dirname, '../progress.csv');
const configPath = path.join(__dirname, '../habit-config.txt');
const csvAdapter = new CsvAdapter();
const dateService = new SystemDateAdapter();
const habitConfigService = new FileHabitConfigService(configPath);
const progressRepository = new CsvProgressRepository(
  csvPath,
  csvAdapter,
  dateService,
  habitConfigService
);

const cargarProgresoUseCase = new CargarProgresoMensualUseCase(
  progressRepository,
  dateService
);
const marcarHabitoUseCase = new MarcarHabitoUseCase(
  progressRepository,
  dateService
);

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : undefined;
    const monthNum = month ? parseInt(month as string, 10) : undefined;

    const days = await cargarProgresoUseCase.execute(yearNum, monthNum);

    const habitCount = habitConfigService.getHabitCount();
    const progressData = days.map((day) => {
      const dayData: any = {
        fecha: day.getDateString(),
        isEditable: day.canEdit(),
      };

      // Agregar todos los hábitos dinámicamente
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        try {
          dayData[habitKey] = day.getHabit(i).completed ? 1 : 0;
        } catch {
          dayData[habitKey] = 0;
        }
      }

      return dayData;
    });

    res.json({ progress: progressData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, habitId } = req.body;
    console.log(`[POST /api/progress] Inicio - fecha: ${fecha}, habitId: ${habitId}`);

    if (!fecha || habitId === undefined) {
      console.log(`[POST /api/progress] Error: fecha o habitId faltante`);
      return res.status(400).json({ error: 'fecha y habitId son requeridos' });
    }

    const currentDate = dateService.getCurrentDate();
    const targetDate = dateService.parseDate(fecha);
    targetDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    console.log(`[POST /api/progress] Fechas - targetDate: ${targetDate.toISOString()}, currentDate: ${currentDate.toISOString()}`);

    // Permitir editar días actuales o pasados, no futuros
    if (targetDate > currentDate) {
      console.log(`[POST /api/progress] Error: Intento de editar día futuro`);
      return res.status(400).json({ error: 'No se pueden editar días futuros' });
    }

    // Cargar el mes correspondiente a la fecha objetivo
    console.log(`[POST /api/progress] Cargando días del mes ${targetDate.getFullYear()}-${targetDate.getMonth()}`);
    const days = await cargarProgresoUseCase.execute(
      targetDate.getFullYear(),
      targetDate.getMonth()
    );
    console.log(`[POST /api/progress] Días cargados: ${days.length}`);
    
    let day = days.find((d) => d.getDateString() === fecha);

    // Si el día no existe, crearlo con todos los hábitos en 0
    if (!day) {
      console.log(`[POST /api/progress] Día no encontrado, creando nuevo día: ${fecha}`);
      const habitCount = habitConfigService.getHabitCount();
      console.log(`[POST /api/progress] Número de hábitos: ${habitCount}`);
      const habits: any[] = [];
      for (let i = 1; i <= habitCount; i++) {
        const { Habit } = await import('../../src/domain/entities/Habit.js');
        habits.push(new Habit(i, false));
      }
      const { Day } = await import('../../src/domain/entities/Day.js');
      const isToday = dateService.isToday(targetDate);
      day = new Day(targetDate, habits, isToday);
      console.log(`[POST /api/progress] Día creado exitosamente con ${habits.length} hábitos`);
    } else {
      console.log(`[POST /api/progress] Día encontrado: ${day.getDateString()}, hábitos: ${day.habits.length}`);
    }

    console.log(`[POST /api/progress] Ejecutando marcarHabitoUseCase para hábito ${habitId}`);
    await marcarHabitoUseCase.execute(day, habitId);
    console.log(`[POST /api/progress] Hábito ${habitId} actualizado exitosamente. Completado: ${day.getHabit(habitId).completed}`);

    res.json({
      success: true,
      fecha: day.getDateString(),
      habitId,
      completed: day.getHabit(habitId).completed,
    });
  } catch (error: any) {
    console.error(`[POST /api/progress] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allData = await progressRepository.getAllProgress();
    const habitCount = habitConfigService.getHabitCount();
    const csvContent = csvAdapter.stringify(allData, habitCount);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=progress.csv');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener el número de hábitos
router.get('/habit-count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = habitConfigService.getHabitCount();
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para actualizar el número de hábitos
router.post('/habit-count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { count } = req.body;
    
    if (typeof count !== 'number' || count < 1 || count > 20) {
      return res.status(400).json({ error: 'El número de hábitos debe estar entre 1 y 20' });
    }

    habitConfigService.setHabitCount(count);
    habitConfigService.invalidateCache(); // Invalidar caché para recargar
    
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

