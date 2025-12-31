import { useState, useMemo, useEffect } from 'react';
import { RadialChart } from '../components/RadialChart/RadialChart';
import { HabitEditor } from '../components/HabitEditor';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { useHabitNames } from '../hooks/useHabitNames';
import { HabitProgress } from '../components/RadialChart/RadialChart.types';
import './DashboardPage.css';

export function DashboardPage() {
  const currentDate = useMemo(() => new Date(), []);
  // Asegurar que viewDate nunca sea futuro
  const initialViewDate = useMemo(() => {
    const today = new Date();
    const view = new Date();
    // Si por alguna razón viewDate es futuro, usar el mes actual
    if (view > today) {
      return today;
    }
    return view;
  }, []);
  const [viewDate, setViewDate] = useState(initialViewDate);
  const { progress, isLoading, toggleHabit, loadProgress } = useProgress();
  const { logout } = useAuth();
  const { habitNames } = useHabitNames();
  const [selectedDay, setSelectedDay] = useState<HabitProgress | null>(null);

  const handleDayClick = (fecha: string) => {
    let day = progress.find((p) => p.fecha === fecha);
    
    // Si el día no existe, crear uno nuevo con valores por defecto
    if (!day) {
      day = {
        fecha,
        habito_1: 0,
        habito_2: 0,
        habito_3: 0,
        habito_4: 0,
        habito_5: 0,
        habito_6: 0,
        habito_7: 0,
        habito_8: 0,
        isEditable: true,
      };
    }
    
    setSelectedDay(day);
  };

  const handleToggleHabit = async (habitId: number) => {
    if (!selectedDay) return;
    const fecha = selectedDay.fecha;
    await toggleHabit(fecha, habitId);
  };

  const handleHabitToggleFromChart = async (fecha: string, habitId: number) => {
    await toggleHabit(fecha, habitId);
  };

  // Actualizar selectedDay cuando cambie el progreso
  useEffect(() => {
    if (selectedDay) {
      const updatedDay = progress.find((p) => p.fecha === selectedDay.fecha);
      if (updatedDay) {
        // Actualizar con los datos del servidor
        setSelectedDay(updatedDay);
      } else if (progress.length > 0) {
        // Si el día seleccionado no existe en el progreso, mantenerlo pero actualizar isEditable
        const today = currentDate.toISOString().split('T')[0];
        const targetDate = new Date(selectedDay.fecha);
        targetDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        setSelectedDay({
          ...selectedDay,
          isEditable: targetDate <= todayDate,
        });
      }
    }
  }, [progress, currentDate]);

  // Cargar progreso cuando cambie el mes visualizado
  useEffect(() => {
    loadProgress(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate, loadProgress]);

  // Seleccionar automáticamente el día actual cuando se carga el progreso del mes actual
  useEffect(() => {
    const isCurrentMonth = viewDate.getFullYear() === currentDate.getFullYear() && 
                          viewDate.getMonth() === currentDate.getMonth();
    
    if (progress.length > 0 && !selectedDay && isCurrentMonth) {
      const today = currentDate.toISOString().split('T')[0];
      const todayProgress = progress.find((p) => p.fecha === today);
      if (todayProgress) {
        setSelectedDay(todayProgress);
      } else {
        // Si no existe el día de hoy, crearlo y seleccionarlo
        const newDay: HabitProgress = {
          fecha: today,
          habito_1: 0,
          habito_2: 0,
          habito_3: 0,
          habito_4: 0,
          habito_5: 0,
          habito_6: 0,
          habito_7: 0,
          habito_8: 0,
          isEditable: true,
        };
        setSelectedDay(newDay);
      }
    }
  }, [progress, currentDate, viewDate, selectedDay]);

  // Seleccionar el día actual por defecto
  useEffect(() => {
    if (progress.length > 0 && !selectedDay) {
      const today = currentDate.toISOString().split('T')[0];
      const todayData = progress.find((p) => p.fecha === today);
      if (todayData) {
        setSelectedDay(todayData);
      } else {
        // Si no hay datos del día actual, seleccionar el primer día disponible
        const firstDay = progress[0];
        if (firstDay) {
          setSelectedDay(firstDay);
        }
      }
    }
  }, [progress, currentDate, selectedDay]);

  const handleNextMonth = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    nextMonthStart.setHours(0, 0, 0, 0);
    
    // No permitir navegar a meses futuros
    if (nextMonthStart <= today) {
      setViewDate(nextMonth);
      setSelectedDay(null);
    }
  };
  
  const handlePreviousMonth = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    setViewDate(prevMonth);
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setViewDate(new Date());
    setSelectedDay(null);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const isCurrentMonth = 
    viewDate.getFullYear() === currentDate.getFullYear() &&
    viewDate.getMonth() === currentDate.getMonth();

  if (isLoading) {
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
        <button onClick={logout} className="logout-button">
          Cerrar Sesión
        </button>
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
            onDayClick={handleDayClick}
            onHabitToggle={handleHabitToggleFromChart}
            currentDate={currentDate}
            viewDate={viewDate}
            habitNames={habitNames}
            selectedDay={selectedDay?.fecha}
          />
        </div>

        <div className="editor-section">
          <HabitEditor
            day={selectedDay}
            onToggleHabit={handleToggleHabit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

