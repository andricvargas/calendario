import { useState, useEffect } from 'react';

const STORAGE_KEY = 'habit_names';

function getDefaultHabitNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Hábito ${i + 1}`);
}

export function useHabitNames(habitCount: number = 8) {
  const [habitNames, setHabitNames] = useState<string[]>(getDefaultHabitNames(habitCount));
  const [isLoading, setIsLoading] = useState(true);

  // Cargar nombres desde localStorage al iniciar o cuando cambie el número de hábitos
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Ajustar el array al número actual de hábitos
          if (parsed.length === habitCount) {
            setHabitNames(parsed);
          } else if (parsed.length > habitCount) {
            // Si hay más nombres, tomar solo los necesarios
            setHabitNames(parsed.slice(0, habitCount));
          } else {
            // Si hay menos nombres, completar con valores por defecto
            const defaultNames = getDefaultHabitNames(habitCount);
            const updated = [...parsed];
            for (let i = parsed.length; i < habitCount; i++) {
              updated.push(defaultNames[i]);
            }
            setHabitNames(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
        }
      } else {
        // Si no hay nombres guardados, usar valores por defecto
        const defaultNames = getDefaultHabitNames(habitCount);
        setHabitNames(defaultNames);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNames));
      }
    } catch (error) {
      console.error('Error al cargar nombres de hábitos:', error);
      setHabitNames(getDefaultHabitNames(habitCount));
    } finally {
      setIsLoading(false);
    }
  }, [habitCount]);

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
    const defaultNames = getDefaultHabitNames(habitCount);
    setHabitNames(defaultNames);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNames));
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

