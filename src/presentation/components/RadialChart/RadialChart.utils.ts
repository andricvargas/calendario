import * as d3 from 'd3';
import { HabitProgress, SegmentData } from './RadialChart.types';

export function calculateSegments(
  progress: HabitProgress[],
  currentDate: Date,
  daysInMonth: number,
  viewDate: Date, // Fecha del mes que se está visualizando
  habitCount: number = 8 // Número de hábitos
): SegmentData[] {
  const segments: SegmentData[] = [];
  
  // Log para verificar viewDate recibido
  console.log(`[calculateSegments] viewDate recibido - año: ${viewDate.getFullYear()}, mes: ${viewDate.getMonth() + 1}, día: ${viewDate.getDate()}`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);
  
  console.log(`[calculateSegments] Fecha actual - año: ${today.getFullYear()}, mes: ${today.getMonth() + 1}, día: ${today.getDate()}`);
  
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
    // Crear la fecha usando el año y mes de viewDate, y el día del bucle
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // Verificar que la fecha creada corresponde al día correcto
    // Si el mes tiene menos días, JavaScript puede ajustar la fecha
    if (date.getDate() !== day || date.getMonth() !== viewDate.getMonth() || date.getFullYear() !== viewDate.getFullYear()) {
      console.warn(`[calculateSegments] ADVERTENCIA: Fecha incorrecta - día esperado: ${day}, fecha creada: ${date.toISOString()}, viewDate: ${viewDate.getFullYear()}-${viewDate.getMonth() + 1}`);
    }
    
    // Usar formato local en lugar de ISO para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const fecha = `${year}-${month}-${dayStr}`;
    
    // Log para verificar que la fecha corresponde al día correcto
    console.log(`[calculateSegments] Día del mes: ${day}, fecha generada: ${fecha}, viewDate: ${viewDate.getFullYear()}-${viewDate.getMonth() + 1}`);
    const dayData = progress.find((p) => p.fecha === fecha);

    const isToday = date.getTime() === today.getTime();
    // Permitir editar el día actual y días pasados (usar comparación de timestamps)
    const dateTimestamp = date.getTime();
    const todayTimestamp = today.getTime();
    const canEdit = dateTimestamp <= todayTimestamp;

    // Crear array de hábitos dinámicamente
    const habits: number[] = [];
    for (let i = 1; i <= habitCount; i++) {
      const habitKey = `habito_${i}` as keyof HabitProgress;
      const value = dayData?.[habitKey];
      habits.push(value === 1 || value === '1' ? 1 : 0);
    }

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

