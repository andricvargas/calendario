import { useState } from 'react';
import { HabitProgress } from './RadialChart/RadialChart.types';
import { useHabitNames } from '../hooks/useHabitNames';
import './HabitEditor.css';

interface HabitEditorProps {
  day: HabitProgress | null;
  onToggleHabit: (habitId: number) => Promise<void>;
  isLoading?: boolean;
}

export function HabitEditor({ day, onToggleHabit, isLoading = false }: HabitEditorProps) {
  const [saving, setSaving] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const { habitNames, updateHabitName } = useHabitNames();

  if (!day) {
    return (
      <div className="habit-editor">
        <p className="no-day-selected">Selecciona un día para editar</p>
      </div>
    );
  }

  const handleToggle = async (habitId: number) => {
    // Permitir editar si el día es editable o si no hay restricción
    if (day.isEditable === false) return;
    
    setSaving(habitId);
    try {
      await onToggleHabit(habitId);
    } catch (error) {
      console.error('Error al guardar hábito:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleStartEdit = (habitId: number, currentName: string) => {
    setEditingHabitId(habitId);
    setEditingValue(currentName);
  };

  const handleSaveEdit = (habitId: number) => {
    if (editingValue.trim()) {
      updateHabitName(habitId, editingValue.trim());
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
      handleSaveEdit(habitId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getHabitValue = (habitId: number): number => {
    return day[`habito_${habitId}` as keyof HabitProgress] as number;
  };

  const completionCount = [
    day.habito_1,
    day.habito_2,
    day.habito_3,
    day.habito_4,
    day.habito_5,
    day.habito_6,
    day.habito_7,
    day.habito_8,
  ].filter((h) => h === 1).length;

  return (
    <div className="habit-editor">
      <div className="habit-editor-header">
        <h3 className="editor-title">
          {new Date(day.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
        <div className="completion-stats">
          {completionCount} / 8 hábitos completados
        </div>
      </div>

      {!day.isEditable && (
        <p className="read-only-notice">Este día no es editable (solo se pueden editar días actuales o pasados)</p>
      )}

      <div className="habits-list">
        {habitNames.map((name, index) => {
          const habitId = index + 1;
          const completed = getHabitValue(habitId) === 1;
          const isSaving = saving === habitId;
          const isEditing = editingHabitId === habitId;

          return (
            <div
              key={habitId}
              className={`habit-item ${completed ? 'completed' : ''} ${
                day.isEditable ? 'editable' : 'read-only'
              }`}
            >
              <div 
                className="habit-checkbox"
                onClick={() => day.isEditable && !isEditing && handleToggle(habitId)}
              >
                {isSaving ? (
                  <div className="spinner"></div>
                ) : (
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => {}}
                    disabled={!day.isEditable || isLoading || isEditing}
                    readOnly
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => handleSaveEdit(habitId)}
                  onKeyDown={(e) => handleKeyDown(e, habitId)}
                  className="habit-name-input"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="habit-name"
                  onDoubleClick={() => handleStartEdit(habitId, name)}
                  title="Doble clic para editar"
                >
                  {name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

