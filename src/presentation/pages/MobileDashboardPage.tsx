import { useState, useMemo, useEffect } from 'react';
import { MobileHabitView } from '../components/MobileHabitView/MobileHabitView';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { useHabitNames } from '../hooks/useHabitNames';
import { useHabitCount } from '../hooks/useHabitCount';
import './MobileDashboardPage.css';

export function MobileDashboardPage() {
  const currentDate = useMemo(() => new Date(), []);
  const initialViewDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const [viewDate, setViewDate] = useState(initialViewDate);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const { progress, isLoading, toggleHabit, loadProgress } = useProgress();
  const { logout } = useAuth();
  const { habitCount, isLoading: isLoadingHabitCount } = useHabitCount();
  const { habitNames, updateHabitName } = useHabitNames(habitCount);


  const handleHabitToggleFromView = async (fecha: string, habitId: number) => {
    await toggleHabit(fecha, habitId);
  };

  // Cargar progreso cuando cambie el mes visualizado
  useEffect(() => {
    loadProgress(viewDate.getFullYear(), viewDate.getMonth());
    // Resetear el día seleccionado cuando cambia el mes
    setSelectedDay(null);
  }, [viewDate, loadProgress]);

  const handleNextMonth = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    nextMonthStart.setHours(0, 0, 0, 0);
    
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
    setSelectedDay(null);
  };

  const handleNextDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = 
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth();
    
    const currentDay = selectedDay ?? (isCurrentMonth ? today.getDate() : 1);
    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate();
    
    const nextDay = currentDay + 1;
    const nextDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), nextDay);
    nextDayDate.setHours(0, 0, 0, 0);
    
    // Solo permitir navegar si el siguiente día no es futuro
    if (nextDay <= daysInMonth && nextDayDate <= today) {
      setSelectedDay(nextDay);
    }
  };

  const handlePreviousDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = 
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth();
    
    const currentDay = selectedDay ?? (isCurrentMonth ? today.getDate() : 1);
    
    if (currentDay > 1) {
      setSelectedDay(currentDay - 1);
    }
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
      <div className="mobile-dashboard-loading">
        <div className="mobile-spinner"></div>
        <p>Cargando progreso...</p>
      </div>
    );
  }

  return (
    <div className="mobile-dashboard">
      <header className="mobile-dashboard-header">
        <div className="mobile-header-top">
          <h1>Hábitos</h1>
          <button onClick={logout} className="mobile-logout-button">
            Salir
          </button>
        </div>
      </header>

      <div className="mobile-month-navigation">
        <button 
          onClick={handlePreviousMonth} 
          className="mobile-month-nav-button"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <div className="mobile-month-display">
          <h2>
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          {!isCurrentMonth && (
            <button onClick={handleCurrentMonth} className="mobile-current-month-button">
              Hoy
            </button>
          )}
        </div>
        <button 
          onClick={handleNextMonth} 
          className="mobile-month-nav-button"
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="mobile-dashboard-content">
        <MobileHabitView
          progress={progress}
          onHabitToggle={handleHabitToggleFromView}
          currentDate={currentDate}
          viewDate={viewDate}
          habitNames={habitNames}
          onUpdateHabitName={updateHabitName}
          habitCount={habitCount}
          selectedDay={selectedDay}
          onNextDay={handleNextDay}
          onPreviousDay={handlePreviousDay}
        />
      </div>
    </div>
  );
}

