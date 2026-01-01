import { useState, useMemo, useEffect } from 'react';
import { RadialChart } from '../components/RadialChart/RadialChart';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { useHabitNames } from '../hooks/useHabitNames';
import { useHabitCount } from '../hooks/useHabitCount';
import './DashboardPage.css';

export function DashboardPage() {
  const currentDate = useMemo(() => new Date(), []);
  // Asegurar que viewDate nunca sea futuro y siempre sea el mes actual
  const initialViewDate = useMemo(() => {
    const today = new Date();
    // Normalizar a medianoche para evitar problemas de comparación
    today.setHours(0, 0, 0, 0);
    console.log(`[DashboardPage] Inicializando viewDate - hoy: ${today.toISOString()}, año: ${today.getFullYear()}, mes: ${today.getMonth() + 1}, día: ${today.getDate()}`);
    return today;
  }, []);
  const [viewDate, setViewDate] = useState(initialViewDate);
  
  // Log cuando viewDate cambie
  useEffect(() => {
    console.log(`[DashboardPage] viewDate actualizado - año: ${viewDate.getFullYear()}, mes: ${viewDate.getMonth() + 1}, día: ${viewDate.getDate()}`);
  }, [viewDate]);
  const { progress, isLoading, toggleHabit, loadProgress } = useProgress();
  const { logout } = useAuth();
  const { habitCount, addHabit, removeHabit, canAdd, canRemove, isLoading: isLoadingHabitCount } = useHabitCount();
  const { habitNames, updateHabitName } = useHabitNames(habitCount);

  const handleAddHabit = async () => {
    try {
      await addHabit();
      // Recargar progreso después de agregar hábito
      await loadProgress(viewDate.getFullYear(), viewDate.getMonth());
    } catch (error) {
      console.error('Error al agregar hábito:', error);
    }
  };

  const handleRemoveHabit = async () => {
    try {
      await removeHabit();
      // Recargar progreso después de quitar hábito
      await loadProgress(viewDate.getFullYear(), viewDate.getMonth());
    } catch (error) {
      console.error('Error al quitar hábito:', error);
    }
  };

  const handleHabitToggleFromChart = async (fecha: string, habitId: number) => {
    await toggleHabit(fecha, habitId);
  };

  // Cargar progreso cuando cambie el mes visualizado
  useEffect(() => {
    loadProgress(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate, loadProgress]);

  const handleNextMonth = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    nextMonthStart.setHours(0, 0, 0, 0);
    
    // No permitir navegar a meses futuros
    if (nextMonthStart <= today) {
      setViewDate(nextMonth);
    }
  };
  
  const handlePreviousMonth = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    setViewDate(prevMonth);
  };

  const handleCurrentMonth = () => {
    setViewDate(new Date());
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const isCurrentMonth = 
    viewDate.getFullYear() === currentDate.getFullYear() &&
    viewDate.getMonth() === currentDate.getMonth();

  if (isLoading || isLoadingHabitCount) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Cargando progreso...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Radial Habit Tracker</h1>
        <div className="header-actions">
          <div className="habit-count-controls">
            <button 
              onClick={handleRemoveHabit} 
              className="habit-count-button"
              disabled={!canRemove}
              title="Quitar hábito"
            >
              −
            </button>
            <span className="habit-count-display">{habitCount} hábitos</span>
            <button 
              onClick={handleAddHabit} 
              className="habit-count-button"
              disabled={!canAdd}
              title="Agregar hábito"
            >
              +
            </button>
          </div>
          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="month-navigation">
        <button 
          onClick={handlePreviousMonth} 
          className="month-nav-button"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <div className="month-display">
          <h2>
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          {!isCurrentMonth && (
            <button onClick={handleCurrentMonth} className="current-month-button">
              Ir a mes actual
            </button>
          )}
        </div>
        <button 
          onClick={handleNextMonth} 
          className="month-nav-button"
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <RadialChart
            progress={progress}
            onHabitToggle={handleHabitToggleFromChart}
            currentDate={currentDate}
            viewDate={viewDate}
            habitNames={habitNames}
            onUpdateHabitName={updateHabitName}
            habitCount={habitCount}
          />
        </div>
      </div>
    </div>
  );
}
