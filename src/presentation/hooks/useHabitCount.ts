import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'habit_count';
const DEFAULT_HABIT_COUNT = 8;
const MIN_HABIT_COUNT = 1;
const MAX_HABIT_COUNT = 20;

export function useHabitCount() {
  const [habitCount, setHabitCountState] = useState<number>(DEFAULT_HABIT_COUNT);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar desde el servidor
  const loadHabitCount = useCallback(async () => {
    try {
      const response = await fetch('/api/progress/habit-count', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHabitCountState(data.count);
      }
    } catch (error) {
      console.error('Error al cargar número de hábitos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al iniciar
  useEffect(() => {
    loadHabitCount();
  }, [loadHabitCount]);

  // Actualizar número de hábitos
  const setHabitCount = useCallback(async (count: number) => {
    if (count < MIN_HABIT_COUNT || count > MAX_HABIT_COUNT) {
      throw new Error(`El número de hábitos debe estar entre ${MIN_HABIT_COUNT} y ${MAX_HABIT_COUNT}`);
    }

    try {
      const response = await fetch('/api/progress/habit-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ count }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar número de hábitos');
      }

      setHabitCountState(count);
    } catch (error) {
      console.error('Error al actualizar número de hábitos:', error);
      throw error;
    }
  }, []);

  const addHabit = useCallback(async () => {
    if (habitCount < MAX_HABIT_COUNT) {
      await setHabitCount(habitCount + 1);
    }
  }, [habitCount, setHabitCount]);

  const removeHabit = useCallback(async () => {
    if (habitCount > MIN_HABIT_COUNT) {
      await setHabitCount(habitCount - 1);
    }
  }, [habitCount, setHabitCount]);

  return {
    habitCount,
    isLoading,
    setHabitCount,
    addHabit,
    removeHabit,
    canAdd: habitCount < MAX_HABIT_COUNT,
    canRemove: habitCount > MIN_HABIT_COUNT,
  };
}
