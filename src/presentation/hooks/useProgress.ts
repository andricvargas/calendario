import { useState, useEffect, useCallback } from 'react';
import { HabitProgress } from '../components/RadialChart/RadialChart.types';

export function useProgress() {
  const [progress, setProgress] = useState<HabitProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | undefined>();
  const [currentMonth, setCurrentMonth] = useState<number | undefined>();

  const loadProgress = useCallback(async (year?: number, month?: number) => {
    setIsLoading(true);
    setError(null);
    
    // Guardar los parámetros actuales
    if (year !== undefined) setCurrentYear(year);
    if (month !== undefined) setCurrentMonth(month);

    try {
      const params = new URLSearchParams();
      if (year !== undefined) params.append('year', year.toString());
      if (month !== undefined) params.append('month', month.toString());

      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(`/api/progress?${params.toString()}`, {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Error al cargar el progreso');
      }

      const data = await response.json();
      setProgress(data.progress || []);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Timeout al cargar el progreso. Verifica tu conexión.');
      } else {
        setError(err.message || 'Error desconocido');
      }
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleHabit = useCallback(async (fecha: string, habitId: number) => {
    try {
      // Verificar autenticación antes de hacer la petición
      const authController = new AbortController();
      const authTimeoutId = setTimeout(() => authController.abort(), 5000); // 5 segundos timeout
      
      const authCheck = await fetch('/api/auth/status', {
        credentials: 'include',
        signal: authController.signal,
      });
      
      clearTimeout(authTimeoutId);
      
      if (!authCheck.ok) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }
      
      const authData = await authCheck.json();
      if (!authData.authenticated) {
        throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
      }

      // Crear un AbortController para timeout en la petición principal
      const progressController = new AbortController();
      const progressTimeoutId = setTimeout(() => progressController.abort(), 10000); // 10 segundos timeout

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ fecha, habitId }),
        signal: progressController.signal,
      });

      clearTimeout(progressTimeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al guardar el hábito');
      }

      const data = await response.json();
      
      // Actualizar el estado local inmediatamente con los datos del servidor
      // IMPORTANTE: Preservar todos los hábitos existentes, solo actualizar el que se modificó
      setProgress((prevProgress) => {
        const updatedProgress = [...prevProgress];
        const dayIndex = updatedProgress.findIndex((p) => p.fecha === fecha);
        
        if (dayIndex >= 0) {
          // Actualizar el día existente, preservando TODOS los hábitos existentes
          const existingDay = updatedProgress[dayIndex];
          // Crear una copia completa del día con todos sus hábitos
          const updatedDay: HabitProgress = { ...existingDay };
          // Solo actualizar el hábito que se modificó
          updatedDay[`habito_${habitId}`] = data.completed ? 1 : 0;
          updatedProgress[dayIndex] = updatedDay;
          
          console.log(`[useProgress] Día actualizado - hábito ${habitId}: ${data.completed ? 1 : 0}`);
        } else {
          // Crear nuevo día si no existe
          // Obtener el número de hábitos del primer día existente o usar un valor por defecto
          const firstDay = updatedProgress[0];
          let habitCount = 5; // Valor por defecto
          if (firstDay) {
            const habitKeys = Object.keys(firstDay).filter(k => k.startsWith('habito_'));
            habitCount = habitKeys.length;
          }
          
          const newDay: HabitProgress = {
            fecha,
          } as HabitProgress;
          
          // Inicializar todos los hábitos con valor 0, excepto el que se acaba de modificar
          for (let i = 1; i <= habitCount; i++) {
            newDay[`habito_${i}`] = i === habitId ? (data.completed ? 1 : 0) : 0;
          }
          
          updatedProgress.push(newDay);
          // Ordenar por fecha
          updatedProgress.sort((a, b) => a.fecha.localeCompare(b.fecha));
          
          console.log(`[useProgress] Nuevo día creado - hábito ${habitId}: ${data.completed ? 1 : 0}`);
        }
        
        return updatedProgress;
      });
      
      // No recargar inmediatamente - la actualización optimista ya está aplicada
      // El servidor ya procesó el cambio, así que los datos están sincronizados
      // Solo recargar si hay un error o si el usuario navega a otro mes
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
      throw err;
    }
  }, [loadProgress, currentYear, currentMonth]);

  // No cargar automáticamente - se cargará desde DashboardPage cuando cambie el mes

  return {
    progress,
    isLoading,
    error,
    loadProgress,
    toggleHabit,
  };
}

