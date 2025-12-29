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

      const response = await fetch(`/api/progress?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar el progreso');
      }

      const data = await response.json();
      setProgress(data.progress || []);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleHabit = useCallback(async (fecha: string, habitId: number) => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ fecha, habitId }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el hábito');
      }

      const data = await response.json();
      
      // Recargar el progreso del mes actual
      await loadProgress(currentYear, currentMonth);
      
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

