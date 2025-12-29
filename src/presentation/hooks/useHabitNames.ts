import { useState, useEffect } from 'react';

const DEFAULT_HABIT_NAMES = [
  'Hábito 1',
  'Hábito 2',
  'Hábito 3',
  'Hábito 4',
  'Hábito 5',
  'Hábito 6',
  'Hábito 7',
  'Hábito 8',
];

const STORAGE_KEY = 'habit_names';

export function useHabitNames() {
  const [habitNames, setHabitNames] = useState<string[]>(DEFAULT_HABIT_NAMES);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar nombres desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 8) {
          setHabitNames(parsed);
        }
      }
    } catch (error) {
      console.error('Error al cargar nombres de hábitos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar nombres en localStorage
  const updateHabitName = (habitId: number, newName: string) => {
    const updated = [...habitNames];
    updated[habitId - 1] = newName;
    setHabitNames(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error al guardar nombres de hábitos:', error);
    }
  };

  // Resetear a valores por defecto
  const resetHabitNames = () => {
    setHabitNames(DEFAULT_HABIT_NAMES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HABIT_NAMES));
    } catch (error) {
      console.error('Error al resetear nombres de hábitos:', error);
    }
  };

  return {
    habitNames,
    isLoading,
    updateHabitName,
    resetHabitNames,
  };
}

