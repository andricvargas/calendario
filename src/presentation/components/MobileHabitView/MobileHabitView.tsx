import { useEffect, useRef, useState } from 'react';
import { MobileHabitViewProps } from './MobileHabitView.types';
import { calculateSegments } from '../RadialChart/RadialChart.utils';
import './MobileHabitView.css';

export function MobileHabitView({ 
  progress, 
  onHabitToggle, 
  currentDate, 
  viewDate, 
  habitNames = [], 
  habitCount = 8, 
  onUpdateHabitName,
  selectedDay,
  onNextDay,
  onPreviousDay
}: MobileHabitViewProps) {
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  // Calcular segmentos
  let segments = calculateSegments(progress, currentDate, daysInMonth, viewDate, habitCount);

  // Determinar qué día mostrar
  const isCurrentMonth = 
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  let displayDay: number;
  let displaySegment: typeof segments[0] | undefined;

  // Si hay un día seleccionado, usarlo; si no, usar la lógica por defecto
  if (selectedDay !== null && selectedDay !== undefined) {
    displayDay = selectedDay;
    displaySegment = segments.find(s => s.day === displayDay);
  } else if (isCurrentMonth && segments.length > 0) {
    // Mes actual: mostrar el día actual
    displayDay = today.getDate();
    displaySegment = segments.find(s => s.day === displayDay);
  } else if (segments.length > 0) {
    // Mes pasado: mostrar el último día
    displayDay = segments[segments.length - 1].day;
    displaySegment = segments[segments.length - 1];
  } else {
    // Si no hay segmentos, usar el día actual o el día 1
    displayDay = isCurrentMonth ? today.getDate() : 1;
  }

  // Si no hay segmento, crear uno vacío para el día seleccionado
  if (!displaySegment) {
    const fecha = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
    const fechaDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), displayDay);
    fechaDate.setHours(0, 0, 0, 0);
    const isEditableDay = fechaDate <= today; // Permitir editar días pasados y el día actual
    
    displaySegment = {
      day: displayDay,
      fecha,
      habits: Array(habitCount).fill(0),
      isToday: isCurrentMonth && displayDay === today.getDate(),
      isEditable: isEditableDay,
      angle: 0,
      startAngle: 0,
      endAngle: 0,
    };
  }

  const handleStartEdit = (habitId: number, currentName: string) => {
    setEditingHabitId(habitId);
    setEditingValue(currentName);
  };

  const handleSaveEdit = async (habitId: number) => {
    if (editingValue.trim() && onUpdateHabitName) {
      await onUpdateHabitName(habitId, editingValue.trim());
    }
    setEditingHabitId(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingHabitId(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, habitId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(habitId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSegmentClick = async (habitId: number) => {
    if (displaySegment && displaySegment.isEditable && onHabitToggle) {
      await onHabitToggle(displaySegment.fecha, habitId);
    }
  };

  if (!displaySegment) {
    return (
      <div className="mobile-habit-view">
        <div className="mobile-habit-empty">
          <p>No hay días disponibles para este mes</p>
        </div>
      </div>
    );
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Calcular si se puede navegar a días anteriores/posteriores
  const canGoPrevious = displayDay > 1;
  const nextDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), displayDay + 1);
  nextDayDate.setHours(0, 0, 0, 0);
  const canGoNext = displayDay < daysInMonth && nextDayDate <= today;
  const isToday = isCurrentMonth && displayDay === today.getDate();

  return (
    <div className="mobile-habit-view">
      <div className="mobile-habit-header">
        <h2 className="mobile-habit-month">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h2>
        <div className="mobile-habit-day-navigation">
          <button
            onClick={onPreviousDay}
            disabled={!canGoPrevious || !onPreviousDay}
            className="mobile-day-nav-button"
            aria-label="Día anterior"
          >
            ←
          </button>
          <div className="mobile-habit-day">
            Día {displayDay}
            {isToday && <span className="mobile-day-today-badge">Hoy</span>}
          </div>
          <button
            onClick={onNextDay}
            disabled={!canGoNext || !onNextDay}
            className="mobile-day-nav-button"
            aria-label="Día siguiente"
          >
            →
          </button>
        </div>
      </div>

      <div className="mobile-habit-list">
        {Array.from({ length: habitCount }, (_, i) => {
          const habitId = i + 1;
          const habitValue = displaySegment.habits[i] || 0;
          const habitName = habitNames[i] || `Hábito ${habitId}`;
          const isCompleted = habitValue === 1;
          const isEditing = editingHabitId === habitId;

          return (
            <div key={habitId} className="mobile-habit-item">
              <div className="mobile-habit-name-section">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => handleSaveEdit(habitId)}
                    onKeyDown={(e) => handleKeyDown(e, habitId)}
                    className="mobile-habit-name-input"
                    autoFocus
                  />
                ) : (
                  <span
                    className="mobile-habit-name"
                    onDoubleClick={() => handleStartEdit(habitId, habitName)}
                  >
                    {habitId}. {habitName}
                  </span>
                )}
              </div>

              <div 
                className={`mobile-habit-segment ${isCompleted ? 'completed' : 'incomplete'}`}
                onClick={() => handleSegmentClick(habitId)}
              >
                <div className="mobile-habit-segment-indicator">
                  {isCompleted ? '✓' : '○'}
                </div>
                <div className="mobile-habit-segment-label">
                  {isCompleted ? 'Completado' : 'Pendiente'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

