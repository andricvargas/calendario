import * as d3 from 'd3';
import { HabitProgress, SegmentData } from './RadialChart.types';

export function calculateSegments(
  progress: HabitProgress[],
  currentDate: Date,
  daysInMonth: number,
  viewDate: Date // Fecha del mes que se está visualizando
): SegmentData[] {
  const segments: SegmentData[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Verificar si el mes visualizado es futuro
  const viewMonthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  viewMonthStart.setHours(0, 0, 0, 0);
  const isFutureMonth = viewMonthStart > today;
  
  // Determinar hasta qué día mostrar
  const isCurrentMonth = 
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();
  
  // Si es un mes futuro, no mostrar nada
  if (isFutureMonth) {
    return [];
  }
  
  // Determinar el último día a mostrar
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;
  
  // Los días deben estar en orden cronológico normal (1, 2, 3... hasta maxDay)
  // El día 1 comienza en la parte superior (ángulo -π/2)
  const totalDays = maxDay;
  const anglePerDay = (2 * Math.PI) / totalDays;

  // Crear segmentos en orden cronológico
  for (let day = 1; day <= maxDay; day++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    const fecha = date.toISOString().split('T')[0];
    const dayData = progress.find((p) => p.fecha === fecha);

    const isToday = date.getTime() === today.getTime();
    const canEdit = date <= today;

    const habits = dayData
      ? [
          dayData.habito_1,
          dayData.habito_2,
          dayData.habito_3,
          dayData.habito_4,
          dayData.habito_5,
          dayData.habito_6,
          dayData.habito_7,
          dayData.habito_8,
        ]
      : [0, 0, 0, 0, 0, 0, 0, 0];

    // Calcular ángulos: el día 1 comienza en -π/2 (arriba) y va en sentido horario
    // Cada día tiene un ángulo central específico para su línea radial
    const centerAngle = (day - 1) * anglePerDay + anglePerDay / 2 - Math.PI / 2;
    
    // Normalizar el ángulo al rango [0, 2π]
    let normalizedAngle = centerAngle;
    while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;

    segments.push({
      day,
      fecha,
      habits,
      isToday,
      isEditable: canEdit,
      angle: normalizedAngle,
      startAngle: centerAngle - anglePerDay / 2, // Para compatibilidad
      endAngle: centerAngle + anglePerDay / 2,  // Para compatibilidad
    });
  }

  return segments;
}

export function getHabitColor(habitValue: number, isFuture: boolean): string {
  if (isFuture) {
    return '#ffffff'; // Blanco para futuro (no se debería mostrar)
  }
  // Azul para completado, Rojo para incompleto
  return habitValue === 1 ? '#2196f3' : '#f44336';
}

export function createArc(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle);
    // Sin padAngle para que los bordes estén exactamente en los ángulos especificados

  return arc() || '';
}

