import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RadialChartProps, SegmentData } from './RadialChart.types';
import { calculateSegments, getHabitColor, createArc } from './RadialChart.utils';
import './RadialChart.css';

export function RadialChart({ progress, onHabitToggle, currentDate, viewDate, habitNames = [], habitCount = 8 }: RadialChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;

    // Encontrar el día actual para posicionarlo en las 00:00 (arriba)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate();

    let segments = calculateSegments(progress, currentDate, daysInMonth, viewDate, habitCount);

    // INVERTIR el orden de los segmentos para que el día actual (último) se renderice primero
    // Esto asegura que el día actual quede "encima" visualmente y capture los eventos correctamente
    segments = [...segments].reverse();


    // Si no hay segmentos (mes futuro), mostrar mensaje
    if (segments.length === 0) {
      svg
        .append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('fill', '#999')
        .text('No hay días disponibles para este mes');
      return;
    }

    const numHabits = habitCount;
    const numDays = segments.length;
    
    // Configuración: Días como secciones radiales (rebanadas), Hábitos como anillos concéntricos
    const startRadius = maxRadius / 2; // Los hábitos empiezan desde la mitad del radio
    const habitRadius = maxRadius - startRadius; // Radio disponible para los hábitos
    const habitSpacing = habitRadius / numHabits; // Espaciado entre anillos (hábitos)
    
    // Verificar si estamos viendo el mes actual
    const isCurrentMonth = 
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth();
    
    // Determinar el día actual: si es el mes actual, usar el día de hoy; si no, usar el último día disponible
    let todayDay: number;
    if (isCurrentMonth) {
      // Si es el mes actual, el día actual es el día de hoy
      todayDay = today.getDate();
      // Verificar que el día actual esté en los segmentos (debería estar siempre)
      const todaySegment = segments.find(s => s.day === todayDay);
      if (!todaySegment && segments.length > 0) {
        // Si por alguna razón el día actual no está, usar el último día disponible
        todayDay = segments[segments.length - 1].day;
      }
    } else {
      // Si es un mes pasado, el "día actual" es el último día disponible en los segmentos
      todayDay = segments.length > 0 ? segments[segments.length - 1].day : daysInMonth;
    }
    
    // Validar que todayDay sea válido
    if (!todayDay || todayDay <= 0 || todayDay > 31) {
      console.error(`[RadialChart] ERROR: todayDay inválido: ${todayDay}`);
      return;
    }
    
    // Verificar que el día actual esté en los segmentos
    const todaySegment = segments.find(s => s.day === todayDay);
    
    const daysBeforeToday = todayDay - 1; // Días anteriores al día actual
    const daysAfterToday = numDays - todayDay; // Días futuros después del día actual
    
    // Solo mostrar desde las 12 (00:00) hasta las 9 PM (21:00) = 270 grados (3/4 del círculo)
    // El día ACTUAL está en las 00:00 (arriba, -π/2), y los días anteriores van hacia la derecha (sentido horario)
    const totalAngle = (3 * Math.PI) / 2; // 270 grados (desde las 12 hasta las 9 PM)
    
    // Para que el día actual esté en las 00:00 (arriba) y vaya hacia la derecha (sentido horario),
    // necesitamos empezar en -π/2 y restar ángulos (no sumarlos)
    const todayStartAngle = -Math.PI / 2; // Día actual en las 12 (arriba, exactamente -90 grados)
    
    // Calcular el ángulo por día basado en el número real de días a mostrar
    // Distribuir el espacio disponible entre todos los días que se mostrarán
    // IMPORTANTE: Validar que todayDay no sea 0 para evitar división por cero
    if (todayDay <= 0) {
      console.error(`[RadialChart] ERROR: todayDay debe ser mayor que 0, valor actual: ${todayDay}`);
      return;
    }
    const anglePerDay = totalAngle / todayDay; // Ángulo por día (ajustado al número de días)
    
    // Validar que anglePerDay sea un número válido
    if (!isFinite(anglePerDay) || isNaN(anglePerDay)) {
      console.error(`[RadialChart] ERROR: anglePerDay inválido: ${anglePerDay}, todayDay: ${todayDay}, totalAngle: ${totalAngle}`);
      return;
    }
    
    // Crear grupos para cada día (secciones radiales)
    const dayGroups = svg
      .selectAll('g.day-section')
      .data(segments)
      .enter()
      .append('g')
      .attr('class', 'day-section')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Almacenar los ángulos calculados para cada segmento para reutilizarlos en las etiquetas
    const segmentAngles = new Map<string, { startAngle: number; endAngle: number; centerAngle: number }>();
    
    // Almacenar las posiciones de las etiquetas para detectar superposiciones (coordenadas absolutas)
    const labelPositions: Array<{ day: number; x: number; y: number; angle: number }> = [];

    // Para cada día (sección radial)
    dayGroups.each(function (segment: SegmentData, index: number) {
      const dayGroup = d3.select(this);
      // Usar el índice del callback en lugar de findIndex para mayor precisión
      const dayIndex = index;
      
      // Calcular el ángulo de esta sección de día
      // IMPORTANTE: Los segmentos están invertidos, así que el día 31 (último) está primero en el array
      // El día actual (todayDay) debe estar en las 00:00 (arriba, -π/2)
      // Los días anteriores van hacia la derecha (sentido horario, restando ángulos)
      const dayNumber = segment.day;
      
      // Calcular cuántos días antes del día actual está este día
      // Si todayDay = 31, dayNumber = 31 → daysBeforeToday = 0 (día actual en 00:00)
      // Si todayDay = 31, dayNumber = 30 → daysBeforeToday = 1 (primer día a la derecha)
      // Si todayDay = 31, dayNumber = 1 → daysBeforeToday = 30 (último día a la derecha)
      const daysBeforeToday = todayDay - dayNumber;
      
      // Calcular los ángulos de inicio y fin del segmento
      // IMPORTANTE: El día actual debe INICIAR en las 00:00 (todayStartAngle = -π/2, arriba)
      // Para el día actual (daysBeforeToday = 0): inicia en todayStartAngle (-π/2, 00:00)
      // Para días anteriores: se desplazan hacia la derecha (sentido horario) sumando el offset
      const dayOffset = daysBeforeToday * anglePerDay;
      
      let dayStartAngle: number;
      let dayEndAngle: number;
      
      if (daysBeforeToday === 0) {
        // Día actual: inicia en todayStartAngle (-π/2, 00:00, arriba)
        dayStartAngle = todayStartAngle;
        dayEndAngle = todayStartAngle + anglePerDay;
      } else {
        // Días anteriores: desplazados hacia la derecha (sentido horario)
        dayStartAngle = todayStartAngle + dayOffset;
        dayEndAngle = todayStartAngle + dayOffset + anglePerDay;
      }
      
      // Calcular el ángulo central del día (para las etiquetas)
      // IMPORTANTE: El día actual INICIA en las 00:00 (todayStartAngle)
      // Para el día actual: la etiqueta debe estar al inicio del segmento (todayStartAngle)
      // Para días anteriores: en el centro del segmento
      
      // Validar que los ángulos sean números válidos
      if (!isFinite(dayStartAngle) || !isFinite(dayEndAngle) || isNaN(dayStartAngle) || isNaN(dayEndAngle)) {
        console.error(`[RadialChart] ERROR: Ángulos inválidos para día ${dayNumber}: dayStartAngle=${dayStartAngle}, dayEndAngle=${dayEndAngle}`);
        return; // Saltar este día si hay error
      }
      const dayCenterAngle = daysBeforeToday === 0 
        ? todayStartAngle  // Día actual: inicia en las 00:00
        : todayStartAngle + dayOffset + (anglePerDay / 2);  // Días anteriores: centro del segmento
      
      // Validar que dayCenterAngle sea válido
      if (!isFinite(dayCenterAngle) || isNaN(dayCenterAngle)) {
        console.error(`[RadialChart] ERROR: dayCenterAngle inválido para día ${dayNumber}: ${dayCenterAngle}`);
        return; // Saltar este día si hay error
      }
      
      // Usar los ángulos directamente - D3 maneja correctamente los ángulos negativos
      // El problema es que cuando el día 1 tiene un ángulo de -351°, está casi en la misma posición que el día 31 (-90°)
      // Para evitar esto, necesitamos asegurarnos de que el orden de renderizado sea correcto
      // (día 31 primero, luego día 30, ..., día 1 último) para que el día 31 esté "encima" y capture los eventos
      const finalStartAngle = dayStartAngle;
      const finalEndAngle = dayEndAngle;
      
      // Log de posiciones (ángulos y coordenadas)
      if (segment.day === 31 || segment.day === 1 || daysBeforeToday === 0) {
        const labelRadius = maxRadius + 30;
        const labelX = centerX + Math.cos(dayCenterAngle) * labelRadius;
        const labelY = centerY + Math.sin(dayCenterAngle) * labelRadius;
        console.log(`[RadialChart] Posiciones día ${segment.day}:`);
        console.log(`[RadialChart]   Ángulo inicio: ${dayStartAngle.toFixed(4)} (${(dayStartAngle * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   Ángulo fin: ${dayEndAngle.toFixed(4)} (${(dayEndAngle * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   Ángulo centro: ${dayCenterAngle.toFixed(4)} (${(dayCenterAngle * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   Coordenadas etiqueta: (${labelX.toFixed(1)}, ${labelY.toFixed(1)})`);
        console.log(`[RadialChart]   Radio interno: ${startRadius.toFixed(1)}, Radio externo: ${maxRadius.toFixed(1)}`);
      }
      
      // Almacenar los ángulos para este segmento
      segmentAngles.set(segment.fecha, { startAngle: dayStartAngle, endAngle: dayEndAngle, centerAngle: dayCenterAngle });
      
      // Los segmentos se generarán después de crear las etiquetas, justo debajo de ellas
      
      // Crear la etiqueta del día asociada al mismo segmento
      // IMPORTANTE: Usar el mismo dayCenterAngle calculado para asegurar alineación perfecta
      // El dayCenterAngle ya está calculado correctamente para el día actual (centrado en 00:00)
      // y para los días anteriores (desplazados hacia la derecha)
      const centroidAngle = dayCenterAngle;
      
      // Calcular la posición base de la etiqueta (coordenadas absolutas en el SVG)
      // Usar el mismo radio que el segmento más un offset para estar fuera
      let labelRadius = maxRadius + 30; // Fuera del gráfico
      let x = centerX + Math.cos(centroidAngle) * labelRadius;
      let y = centerY + Math.sin(centroidAngle) * labelRadius;
      
      // Verificar si hay superposición con etiquetas anteriores
      const minDistance = 25; // Distancia mínima entre etiquetas
      for (const existingLabel of labelPositions) {
        const distance = Math.sqrt(Math.pow(x - existingLabel.x, 2) + Math.pow(y - existingLabel.y, 2));
        if (distance < minDistance) {
          // Si hay superposición, ajustar el radio para separar las etiquetas
          // Aumentar el radio proporcionalmente a la distancia que falta
          const neededRadius = labelRadius + (minDistance - distance);
          x = centerX + Math.cos(centroidAngle) * neededRadius;
          y = centerY + Math.sin(centroidAngle) * neededRadius;
          labelRadius = neededRadius;
        }
      }
      
      // Guardar la posición de esta etiqueta
      labelPositions.push({ day: dayNumber, x, y, angle: centroidAngle });
      
      // Crear una línea de referencia desde el label hasta el centro para visualizar la alineación
      const referenceLine = svg
        .append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', centerX)
        .attr('y2', centerY)
        .attr('stroke', daysBeforeToday === 0 ? '#2196f3' : '#cccccc') // Azul para el día actual, gris para los demás
        .attr('stroke-width', daysBeforeToday === 0 ? 2 : 1)
        .attr('stroke-dasharray', daysBeforeToday === 0 ? '5,5' : '3,3')
        .attr('opacity', 0.5)
        .attr('class', `label-reference-line day-${dayNumber}`)
        .attr('data-day', dayNumber);
      
      const isToday = segment.isToday;
      
      // Crear un grupo de etiqueta asociado al day-section mediante atributos
      // Las etiquetas se crean en el SVG principal con coordenadas absolutas
      const labelGroup = svg
        .append('g')
        .attr('class', 'day-label-group')
        .attr('data-day', segment.day)
        .attr('data-fecha', segment.fecha);
      
      // Crear un círculo de fondo para el número
      const labelBg = labelGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 12)
        .attr('fill', isToday ? '#e3f2fd' : 'transparent')
        .attr('stroke', isToday ? '#2196f3' : 'transparent')
        .attr('stroke-width', 1);
      
      labelGroup
        .append('text')
        .attr('class', 'day-label')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('data-day', segment.day)
        .attr('data-fecha', segment.fecha)
        .text(segment.day)
        .style('font-size', '11px')
        .style('font-weight', isToday ? 'bold' : 'normal')
        .style('fill', isToday ? '#2196f3' : '#333')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .style('cursor', 'pointer');
      
      // Los segmentos se generarán después de crear las etiquetas de los hábitos, alineados horizontalmente
    });

    // Lista de hábitos a la izquierda del punto de inicio (00:00), cada uno alineado con su anillo
    const habitLabelsGroup = svg.append('g').attr('class', 'habit-labels');
    
    // Usar nombres de hábitos si están disponibles, sino usar números
    const displayNames = habitNames.length === 8 ? habitNames : Array.from({ length: numHabits }, (_, i) => `Hábito ${i + 1}`);
    
    // Ángulo donde empiezan los segmentos (inicio de los hábitos)
    const labelAngle = todayStartAngle;
    
    // Separación del 40% del radio máximo del gráfico
    const separationPx = maxRadius * 0.40;
    
    // Calcular la posición X base donde empiezan los segmentos (en startRadius)
    const segmentStartX = centerX + Math.cos(labelAngle) * startRadius;
    
    // Posición X de las etiquetas: 40% del radio hacia la izquierda desde donde empiezan los segmentos
    const labelX = segmentStartX - separationPx;
    
    // Calcular todas las posiciones Y de las etiquetas primero
    const habitLabelPositions: Array<{ y: number; habitId: number; displayText: string }> = [];
    for (let i = 0; i < numHabits; i++) {
      // Calcular la posición Y basada en el radio del anillo del hábito
      const habitRadius = startRadius + (i * habitSpacing) + (habitSpacing / 2);
      
      // Posición Y de la etiqueta (alineada con el centro de su anillo)
      const labelY = centerY + Math.sin(labelAngle) * habitRadius;
      
      const displayText = displayNames[i] || `Hábito ${i + 1}`;
      habitLabelPositions.push({
        y: labelY,
        habitId: i + 1,
        displayText
      });
    }
    
    // Calcular la altura total de la tabla (desde la primera hasta la última etiqueta)
    const minY = Math.min(...habitLabelPositions.map(p => p.y));
    const maxY = Math.max(...habitLabelPositions.map(p => p.y));
    const tableHeight = maxY - minY + 20; // Altura con padding
    const tableTopY = minY - 10; // Posición superior de la tabla
    
    // Crear una tabla HTML para contener las etiquetas de los hábitos
    const tableWidth = 80;
    const tableForeignObject = habitLabelsGroup
      .append('foreignObject')
      .attr('x', labelX)
      .attr('y', tableTopY)
      .attr('width', tableWidth)
      .attr('height', tableHeight)
      .style('overflow', 'visible');
    
    const table = tableForeignObject
      .append('xhtml:table')
      .style('width', '100%')
      .style('height', '100%')
      .style('border-collapse', 'collapse')
      .style('border-spacing', '0')
      .style('margin', '0')
      .style('padding', '0')
      .style('border', '1px solid #ccc')
      .style('background-color', '#ffffff');
    
    // Almacenar las alturas de las celdas para usarlas en los segmentos
    // Todas las celdas tendrán la misma altura
    const uniformCellHeight = tableHeight / numHabits;
    const cellHeights: number[] = [];
    
    // Crear una fila por cada hábito
    for (let i = 0; i < numHabits; i++) {
      const position = habitLabelPositions[i];
      
      // Todas las filas tienen la misma altura
      const rowHeight = uniformCellHeight;
      
      // Guardar la altura de la celda
      cellHeights[i] = rowHeight;
      
      const row = table
        .append('xhtml:tr')
        .style('height', `${rowHeight}px`)
        .attr('data-habit-index', String(i))
        .attr('data-habit-id', String(position.habitId))
        .attr('id', `habit-row-${position.habitId}`);
      
      const cell = row
        .append('xhtml:td')
        .style('padding', '4px 8px')
        .style('vertical-align', 'middle')
        .style('cursor', 'pointer')
        .style('border', '1px solid #ddd')
        .style('background-color', '#ffffff')
        .style('position', 'relative');
      
      // Calcular la posición del div para alinear el centro del contenido con position.y (línea circular)
      // El centro del contenido debe estar en position.y
      const cellTopY = tableTopY + (i * rowHeight);
      const cellCenterY = cellTopY + (rowHeight / 2);
      const offsetFromCellCenter = position.y - cellCenterY;
      
      // Ajustar la posición del contenido de la celda para alinear su centro con la línea circular
      const cellContent = cell
        .append('xhtml:div')
        .style('position', 'absolute')
        .style('top', `${rowHeight / 2 + offsetFromCellCenter}px`)
        .style('left', '8px')
        .style('right', '8px')
        .style('transform', 'translateY(-50%)');
      
      // Texto del hábito dentro del div de contenido
      const textElement = cellContent
        .append('xhtml:span')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('color', '#333')
        .style('user-select', 'none')
        .style('display', 'block')
        .text(`${position.habitId}. ${position.displayText}`);
      
      // Hacer la etiqueta editable al hacer doble clic
      cell.on('dblclick', function() {
        const currentText = position.displayText;
        const spanElement = d3.select(this).select('div').select('span');
        
        // Crear un input para editar
        const cellDiv = d3.select(this).select('div');
        const input = cellDiv
          .append('xhtml:input')
          .attr('type', 'text')
          .attr('value', currentText)
          .style('width', '70px')
          .style('height', '18px')
          .style('font-size', '11px')
          .style('border', '1px solid #2196f3')
          .style('border-radius', '3px')
          .style('padding', '0 3px')
          .style('outline', 'none')
          .style('position', 'absolute')
          .style('top', '0')
          .style('left', '0');
        
        // Ocultar el texto mientras se edita
        spanElement.style('display', 'none');
        
        // Enfocar el input
        input.node()?.focus();
        input.node()?.select();
        
        // Guardar al presionar Enter o perder el foco
        const saveEdit = () => {
          const newValue = (input.node() as HTMLInputElement)?.value || currentText;
          
          // Actualizar el nombre del hábito
          if (habitNames && habitNames.length === 8) {
            habitNames[i] = newValue;
            // Guardar en localStorage
            localStorage.setItem('habitNames', JSON.stringify(habitNames));
          }
          
          // Actualizar el texto
          spanElement.text(`${position.habitId}. ${newValue}`);
          spanElement.style('display', null);
          input.remove();
        };
        
        input.on('blur', saveEdit);
        input.on('keypress', function(event: any) {
          if (event.key === 'Enter') {
            saveEdit();
          }
        });
        input.on('keydown', function(event: any) {
          if (event.key === 'Escape') {
            spanElement.style('display', null);
            input.remove();
          }
        });
      });
      
      // Efecto hover
      cell
        .on('mouseenter', function() {
          d3.select(this).style('background-color', '#f0f0f0');
        })
        .on('mouseleave', function() {
          d3.select(this).style('background-color', 'transparent');
        });
      
      // Generar segmentos radiales para este hábito, alineados horizontalmente con la celda
      // Un segmento por cada día, siguiendo el ángulo radial de cada etiqueta de día
      // El ancho del segmento debe ser igual a la altura de la celda del hábito
      const segmentWidth = cellHeights[i]; // Ancho del segmento = altura de la celda
      
      // Crear un grupo para los segmentos de este hábito
      const habitSegmentsGroup = svg
        .append('g')
        .attr('class', `habit-segments habit-${i + 1}`)
        .attr('data-habit-index', i);
      
      // Para cada día, crear un segmento radial
      segments.forEach((daySegment) => {
        const daySegmentDate = new Date(daySegment.fecha);
        daySegmentDate.setHours(0, 0, 0, 0);
        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);
        const isEditable = daySegmentDate.getTime() <= todayCheck.getTime();
        
        // Obtener el valor del hábito para este día
        const habitValue = daySegment.habits[i] || 0;
        const color = getHabitColor(habitValue, false);
        
        // Obtener el ángulo del día
        const dayCenterAngle = segmentAngles.get(daySegment.fecha)?.centerAngle;
        if (!dayCenterAngle) return; // Si no hay ángulo, saltar este día
        
        // Calcular el radio de inicio del segmento basado en la posición original de la etiqueta
        // Esto mantiene la forma radial original sin distorsión
        const labelY = habitLabelPositions[i].y;
        const segmentStartRadius = Math.sqrt(Math.pow(labelX - centerX, 2) + Math.pow(labelY - centerY, 2)) + 10;
        
        // Calcular la posición donde termina el segmento (cerca de la etiqueta del día)
        const dayLabelRadius = maxRadius + 30;
        const segmentEndRadius = dayLabelRadius - 20; // Un poco antes de la etiqueta del día
        
        // Calcular el ángulo perpendicular para el ancho del segmento
        const perpendicularAngle = dayCenterAngle + Math.PI / 2;
        
        // Calcular los puntos del segmento (rectángulo radial) usando el radio original
        // Esto preserva la forma radial original
        const startX = centerX + Math.cos(dayCenterAngle) * segmentStartRadius;
        const startY = centerY + Math.sin(dayCenterAngle) * segmentStartRadius;
        
        const endX = centerX + Math.cos(dayCenterAngle) * segmentEndRadius;
        const endY = centerY + Math.sin(dayCenterAngle) * segmentEndRadius;
        
        // Calcular el offset perpendicular para el ancho del segmento
        const offsetX = Math.cos(perpendicularAngle) * (segmentWidth / 2);
        const offsetY = Math.sin(perpendicularAngle) * (segmentWidth / 2);
        
        // Crear el segmento radial como un rectángulo que sigue el ángulo
        // Asociación clara: hábito i+1 (índice i) con el segmento correspondiente
        const habitId = i + 1; // El hábito 1 corresponde al índice 0, hábito 2 al índice 1, etc.
        
        const segmentPath = habitSegmentsGroup
          .append('path')
          .attr('d', `M ${startX - offsetX} ${startY - offsetY} 
                     L ${endX - offsetX} ${endY - offsetY} 
                     L ${endX + offsetX} ${endY + offsetY} 
                     L ${startX + offsetX} ${startY + offsetY} Z`)
          .attr('fill', color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .attr('class', `habit-${habitId} day-${daySegment.day} habit-segment`)
          .attr('data-fecha', daySegment.fecha)
          .attr('data-habit', String(habitId))
          .attr('data-habit-index', String(i)) // Índice del hábito (0-based)
          .attr('data-day', daySegment.day)
          .attr('id', `segment-habit-${habitId}-day-${daySegment.day}`) // ID único para asociación clara
          .style('cursor', isEditable ? 'pointer' : 'not-allowed')
          .style('pointer-events', 'all');
        
        if (onHabitToggle && isEditable) {
          const currentSegmentDay = daySegment.day;
          const currentSegmentFecha = daySegment.fecha;
          const currentHabitIndex = i + 1;
          
          const handleHabitToggle = async function(event: any) {
            event.stopPropagation();
            event.preventDefault();
            
            const fecha = currentSegmentFecha;
            const habitId: number = currentHabitIndex;
            const foundSegment = segments.find(s => s.day === currentSegmentDay);
            
            const pathElement = d3.select(this);
            const foundSegmentHabitValue = foundSegment?.habits[habitId - 1] || 0;
            const currentValue = foundSegmentHabitValue;
            const newValue = currentValue === 1 ? 0 : 1;
            const newColor = getHabitColor(newValue, false);
            const originalColor = pathElement.attr('fill') || color;
            
            pathElement.attr('fill', newColor);
            
            try {
              await onHabitToggle(fecha, habitId);
            } catch (error) {
              pathElement.attr('fill', originalColor);
              console.error('[RadialChart] Error al actualizar hábito:', error);
            }
          };
          
          segmentPath
            .on('dblclick', handleHabitToggle)
            .on('click', handleHabitToggle)
            .on('mouseenter', function() {
              if (habitValue === 0) {
                d3.select(this).attr('fill', '#e3f2fd');
              }
            })
            .on('mouseleave', function() {
              d3.select(this).attr('fill', color);
            });
        }
      });
    }
    
    // ELIMINADO: Borde resaltado para el día seleccionado
    /*if (selectedDay) {
      // Normalizar la fecha seleccionada para comparación
      const normalizedSelectedDay = selectedDay.trim();
      
      // Buscar el segmento y su índice de forma más precisa
      // Usar el mismo método que en el renderizado para asegurar consistencia
      let selectedDayIndex = -1;
      let selectedSegment: SegmentData | null = null;
      
      for (let i = 0; i < segments.length; i++) {
        const segmentFecha = segments[i].fecha.trim();
        if (segmentFecha === normalizedSelectedDay) {
          selectedDayIndex = i;
          selectedSegment = segments[i];
          break;
        }
      }
      
      // Verificar que encontramos el segmento y que el índice coincide con el día
      if (selectedDayIndex >= 0 && selectedDayIndex < segments.length && selectedSegment) {
        // Calcular el ángulo igual que en el renderizado
        // El día actual está en las 00:00, y los días anteriores van hacia la derecha (restando ángulos)
        const selectedDayNumber = selectedSegment.day;
        const daysBeforeToday = todayDay - selectedDayNumber;
        const dayOffset = daysBeforeToday * anglePerDay;
        
        // Calcular los ángulos de inicio y fin del arco
        selectedStartAngle = todayStartAngle - dayOffset;
        selectedEndAngle = todayStartAngle - dayOffset - anglePerDay;
        
        // Crear un grupo para el borde resaltado
        const highlightGroup = svg
          .append('g')
          .attr('class', 'selected-day-highlight-group')
          .attr('transform', `translate(${centerX}, ${centerY})`);
        
        // Borde alrededor de toda la sección radial del día seleccionado
        const highlightPath = createArc(
          startRadius - 3,
          maxRadius + 3,
          selectedStartAngle,
          selectedEndAngle
        );
        
        highlightGroup
          .append('path')
          .attr('d', highlightPath)
          .attr('fill', 'none')
          .attr('stroke', '#2196f3')
          .attr('stroke-width', 3)
          .attr('class', 'selected-day-highlight')
          .attr('data-selected-day', selectedSegment.day)
          .attr('data-selected-fecha', selectedSegment.fecha)
          .style('pointer-events', 'none')
          .style('opacity', 0.8);
      }
    }*/

    } catch (error) {
      console.error('[RadialChart] Error al renderizar el gráfico:', error);
      svg.append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('fill', '#f44336')
        .text('Error al renderizar el gráfico');
    }
  }, [progress, currentDate, viewDate, onHabitToggle, habitNames, habitCount]);

  return (
    <div ref={containerRef} className="radial-chart-container">
      <svg ref={svgRef} width={800} height={800} className="radial-chart-svg">
        {/* El contenido se genera dinámicamente con D3 */}
      </svg>
    </div>
  );
}

