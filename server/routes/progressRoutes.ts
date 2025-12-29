import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { CargarProgresoMensualUseCase } from '../../src/application/use-cases/CargarProgresoMensualUseCase';
import { MarcarHabitoUseCase } from '../../src/application/use-cases/MarcarHabitoUseCase';
import { CsvProgressRepository } from '../../src/infrastructure/repositories/CsvProgressRepository';
import { CsvAdapter } from '../../src/infrastructure/csv/CsvAdapter';
import { SystemDateAdapter } from '../../src/infrastructure/time/SystemDateAdapter';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const csvPath = path.join(__dirname, '../progress.csv');
const csvAdapter = new CsvAdapter();
const dateService = new SystemDateAdapter();
const progressRepository = new CsvProgressRepository(
  csvPath,
  csvAdapter,
  dateService
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

    const progressData = days.map((day) => ({
      fecha: day.getDateString(),
      habito_1: day.getHabit(1).completed ? 1 : 0,
      habito_2: day.getHabit(2).completed ? 1 : 0,
      habito_3: day.getHabit(3).completed ? 1 : 0,
      habito_4: day.getHabit(4).completed ? 1 : 0,
      habito_5: day.getHabit(5).completed ? 1 : 0,
      habito_6: day.getHabit(6).completed ? 1 : 0,
      habito_7: day.getHabit(7).completed ? 1 : 0,
      habito_8: day.getHabit(8).completed ? 1 : 0,
      isEditable: day.canEdit(),
    }));

    res.json({ progress: progressData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, habitId } = req.body;

    if (!fecha || habitId === undefined) {
      return res.status(400).json({ error: 'fecha y habitId son requeridos' });
    }

    const currentDate = dateService.getCurrentDate();
    const targetDate = dateService.parseDate(fecha);
    targetDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    // Permitir editar días actuales o pasados, no futuros
    if (targetDate > currentDate) {
      return res.status(400).json({ error: 'No se pueden editar días futuros' });
    }

    // Cargar el mes correspondiente a la fecha objetivo
    const days = await cargarProgresoUseCase.execute(
      targetDate.getFullYear(),
      targetDate.getMonth()
    );
    const day = days.find((d) => d.getDateString() === fecha);

    if (!day) {
      return res.status(404).json({ error: 'Día no encontrado' });
    }

    await marcarHabitoUseCase.execute(day, habitId);

    res.json({
      success: true,
      fecha: day.getDateString(),
      habitId,
      completed: day.getHabit(habitId).completed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allData = await progressRepository.getAllProgress();
    const csvContent = csvAdapter.stringify(allData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=progress.csv');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

