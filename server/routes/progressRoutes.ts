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
    
    if (!fecha || habitId === undefined) {
      console.log(`[POST /api/progress] Error: fecha o habitId faltante`);
      return res.status(400).json({ error: 'fecha y habitId son requeridos' });
    }

    console.log(`[POST /api/progress] ========================================`);
    console.log(`[POST /api/progress] Inicio - fecha recibida del frontend: "${fecha}", habitId: ${habitId}`);
    
    const targetDate = dateService.parseDate(fecha);
    console.log(`[POST /api/progress] Fecha parseada - año: ${targetDate.getFullYear()}, mes: ${targetDate.getMonth() + 1}, día: ${targetDate.getDate()}`);
    
    const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][targetDate.getDay()];
    const dayNumber = targetDate.getDate();
    const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][targetDate.getMonth()];
    
    console.log(`[POST /api/progress] Día de registro: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${targetDate.getFullYear()}`);

    const currentDate = dateService.getCurrentDate();
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
    console.log(`[POST /api/progress] Búsqueda de día - fecha buscada: "${fecha}", días disponibles: ${days.map(d => d.getDateString()).join(', ')}`);

    // Si el día no existe, crearlo con todos los hábitos en 0
    // IMPORTANTE: Todos los hábitos se inicializan en false (0), y luego se actualizará solo el que se está modificando
    if (!day) {
      console.log(`[POST /api/progress] Día no encontrado, creando nuevo día: ${fecha}`);
      try {
        const habitCount = habitConfigService.getHabitCount();
        console.log(`[POST /api/progress] Número de hábitos: ${habitCount}`);
        
        if (habitCount < 1) {
          throw new Error(`Número de hábitos inválido: ${habitCount}`);
        }
        
        // Crear todos los hábitos con valor false (0) inicialmente
        // Esto es correcto porque es un día nuevo que no existe en el CSV
        const habits: any[] = [];
        for (let i = 1; i <= habitCount; i++) {
          const { Habit } = await import('../../src/domain/entities/Habit.js');
          habits.push(new Habit(i, false));
        }
        
        console.log(`[POST /api/progress] ${habits.length} hábitos creados (todos en false inicialmente para día nuevo)`);
        
        const { Day } = await import('../../src/domain/entities/Day.js');
        const isToday = dateService.isToday(targetDate);
        
        console.log(`[POST /api/progress] Creando Day con fecha: ${targetDate.toISOString()}, isToday: ${isToday}`);
        day = new Day(targetDate, habits, isToday);
        
        const createdDateString = day.getDateString();
        console.log(`[POST /api/progress] Día creado exitosamente con ${habits.length} hábitos, fecha del día: "${createdDateString}"`);
        console.log(`[POST /api/progress] Comparación de fechas - original: "${fecha}", creada: "${createdDateString}", coinciden: ${fecha === createdDateString}`);
      } catch (createError: any) {
        console.error(`[POST /api/progress] Error al crear día:`, createError);
        console.error(`[POST /api/progress] Stack trace:`, createError.stack);
        throw new Error(`Error al crear día: ${createError.message}`);
      }
    } else {
      console.log(`[POST /api/progress] Día encontrado: ${day.getDateString()}, hábitos: ${day.habits.length}`);
      // Log del estado actual de todos los hábitos ANTES del toggle
      const habitStatesBefore = day.habits.map(h => `${h.id}:${h.completed ? 1 : 0}`).join(', ');
      console.log(`[POST /api/progress] Estado ANTES del toggle de hábitos: [${habitStatesBefore}]`);
    }

    console.log(`[POST /api/progress] Ejecutando marcarHabitoUseCase para hábito ${habitId}`);
    try {
      await marcarHabitoUseCase.execute(day, habitId);
      console.log(`[POST /api/progress] Hábito ${habitId} actualizado exitosamente. Completado: ${day.getHabit(habitId).completed}`);
      console.log(`[POST /api/progress] Registro completado para: ${dayOfWeek}, ${dayNumber} de ${monthName} de ${targetDate.getFullYear()}`);
      console.log(`[POST /api/progress] ========================================`);
    } catch (executeError: any) {
      console.error(`[POST /api/progress] Error al ejecutar marcarHabitoUseCase:`, executeError);
      console.error(`[POST /api/progress] Stack trace:`, executeError.stack);
      throw executeError;
    }

    res.json({
      success: true,
      fecha: day.getDateString(),
      habitId,
      completed: day.getHabit(habitId).completed,
    });
  } catch (error: any) {
    console.error(`[POST /api/progress] Error general:`, error);
    console.error(`[POST /api/progress] Stack trace:`, error.stack);
    const errorMessage = error.message || 'Error desconocido';
    res.status(500).json({ error: errorMessage, details: error.stack });
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

