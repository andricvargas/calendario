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

    // Log para verificar viewDate
    console.log(`[RadialChart] viewDate recibido - año: ${viewDate.getFullYear()}, mes: ${viewDate.getMonth() + 1}, día: ${viewDate.getDate()}`);
    
    // Encontrar el día actual para posicionarlo en las 00:00 (arriba)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`[RadialChart] Fecha actual - año: ${today.getFullYear()}, mes: ${today.getMonth() + 1}, día: ${today.getDate()}`);

    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate();

    let segments = calculateSegments(progress, currentDate, daysInMonth, viewDate, habitCount);

    // INVERTIR el orden de los segmentos para que el día actual (último) se renderice primero
    // Esto asegura que el día actual quede "encima" visualmente y capture los eventos correctamente
    segments = [...segments].reverse();

    // Log para verificar los segmentos generados
    console.log(`[RadialChart] Segmentos generados: ${segments.length} días (orden invertido para renderizado)`);
    if (segments.length > 0) {
      console.log(`[RadialChart] Primer segmento (renderizado primero): día ${segments[0].day}, fecha ${segments[0].fecha}`);
      console.log(`[RadialChart] Último segmento (renderizado último): día ${segments[segments.length - 1].day}, fecha ${segments[segments.length - 1].fecha}`);
      const day31Segment = segments.find(s => s.day === 31);
      if (day31Segment) {
        console.log(`[RadialChart] Segmento día 31 encontrado: fecha ${day31Segment.fecha}, posición en array: ${segments.indexOf(day31Segment)}`);
      } else {
        console.warn(`[RadialChart] ADVERTENCIA: No se encontró segmento para el día 31`);
      }
    }

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
      // IMPORTANTE: El día actual debe INICIAR en las 00:00 (todayStartAngle = -π/2)
      // Para el día actual (daysBeforeToday = 0): comienza en todayStartAngle (-π/2, 00:00)
      // Para días anteriores: se desplazan hacia la derecha sumando el offset
      const dayOffset = daysBeforeToday * anglePerDay;
      
      let dayStartAngle: number;
      let dayEndAngle: number;
      
      if (daysBeforeToday === 0) {
        // Día actual: inicia en todayStartAngle (-π/2, 00:00)
        dayStartAngle = todayStartAngle;
        dayEndAngle = todayStartAngle + anglePerDay;
      } else {
        // Días anteriores: desplazados hacia la derecha
        dayStartAngle = todayStartAngle + dayOffset;
        dayEndAngle = todayStartAngle + dayOffset + anglePerDay;
      }
      
      // Calcular el ángulo central del día (para las etiquetas)
      // IMPORTANTE: El día actual debe INICIAR en las 00:00 (todayStartAngle)
      // Para el día actual: la etiqueta debe estar al inicio del segmento (todayStartAngle)
      // Para días anteriores: se desplazan hacia la derecha (centro del segmento)
      
      // Validar que los ángulos sean números válidos
      if (!isFinite(dayStartAngle) || !isFinite(dayEndAngle) || isNaN(dayStartAngle) || isNaN(dayEndAngle)) {
        console.error(`[RadialChart] ERROR: Ángulos inválidos para día ${dayNumber}: dayStartAngle=${dayStartAngle}, dayEndAngle=${dayEndAngle}`);
        return; // Saltar este día si hay error
      }
      const dayCenterAngle = daysBeforeToday === 0 
        ? todayStartAngle  // Día actual: inicia en las 00:00
        : todayStartAngle + dayOffset + (anglePerDay / 2);  // Días anteriores: desplazados (centro)
      
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
      
      // Log para verificar los ángulos calculados (solo para el día 31 y el día 1)
      if (segment.day === 31 || segment.day === 1 || daysBeforeToday === 0) {
        console.log(`[RadialChart] Ángulos calculados para día ${segment.day}:`);
        console.log(`[RadialChart]   todayDay: ${todayDay}, segment.day: ${segment.day}`);
        console.log(`[RadialChart]   daysBeforeToday: ${daysBeforeToday}`);
        console.log(`[RadialChart]   dayOffset: ${dayOffset} (${(dayOffset * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   dayStartAngle: ${dayStartAngle} (${(dayStartAngle * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   dayEndAngle: ${dayEndAngle} (${(dayEndAngle * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`[RadialChart]   dayCenterAngle: ${dayCenterAngle} (${(dayCenterAngle * 180 / Math.PI).toFixed(1)}°)`);
      }
      
      // Almacenar los ángulos para este segmento
      segmentAngles.set(segment.fecha, { startAngle: dayStartAngle, endAngle: dayEndAngle, centerAngle: dayCenterAngle });
      
      // Para cada hábito (anillo concéntrico)
      for (let habitIndex = 0; habitIndex < numHabits; habitIndex++) {
        const innerRadius = startRadius + (habitIndex * habitSpacing);
        const outerRadius = startRadius + ((habitIndex + 1) * habitSpacing);
        const habitValue = segment.habits[habitIndex];
        const color = getHabitColor(habitValue, false);
        
        // Crear celda (arco) para este hábito y día
        // Usar los ángulos directamente - D3 maneja correctamente los ángulos negativos
        const cellPath = createArc(
          innerRadius,
          outerRadius,
          finalStartAngle,
          finalEndAngle
        );
        
        const habitPath = dayGroup
          .append('path')
          .attr('d', cellPath)
          .attr('fill', color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .attr('class', `habit-${habitIndex + 1} day-${segment.day}`)
          .attr('data-fecha', segment.fecha)
          .attr('data-habit', habitIndex + 1)
          .attr('data-day', segment.day)
          .style('cursor', 'pointer')
          .style('pointer-events', 'all'); // Hacer el segmento clickeable
        
        // Verificar que los atributos se establecieron correctamente (solo para el día 31 para debugging)
        if (segment.day === 31) {
          console.log(`[RadialChart] Segmento día 31 renderizado - fecha: ${segment.fecha}, hábito: ${habitIndex + 1}, atributos establecidos: data-fecha="${segment.fecha}", data-day="${segment.day}"`);
        }
        
        // Agregar doble click y click simple para marcar/desmarcar el hábito
        // Verificar si el día es editable basándose en la fecha del segmento
        const segmentDate = new Date(segment.fecha);
        segmentDate.setHours(0, 0, 0, 0);
        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);
        const isEditable = segmentDate.getTime() <= todayCheck.getTime();
        
        if (onHabitToggle && isEditable) {
          // Capturar los valores del segmento actual en el closure para logging
          const currentSegmentDay = segment.day;
          const currentSegmentFecha = segment.fecha;
          const currentHabitIndex = habitIndex + 1;
          
          const handleHabitToggle = async function(event: any) {
            event.stopPropagation(); // Evitar que se propague al click del día
            event.preventDefault(); // Prevenir comportamiento por defecto
            
            // Usar directamente los datos del segmento que capturó el evento
            // Esto es más confiable que calcular basándose en coordenadas
            const fecha = currentSegmentFecha;
            const day = String(currentSegmentDay);
            const habitId = currentHabitIndex;
            
            // Encontrar el segmento correspondiente para obtener el valor actual del hábito
            const foundSegment = segments.find(s => s.day === currentSegmentDay);
            
            console.log(`[RadialChart] ========================================`);
            console.log(`[RadialChart] Clic detectado en segmento`);
            console.log(`[RadialChart] Día del segmento: ${currentSegmentDay}`);
            console.log(`[RadialChart] Fecha del segmento: ${fecha}`);
            console.log(`[RadialChart] Hábito: ${habitId}`);
            
            // Validar que la fecha sea válida
            if (!fecha || fecha.length !== 10) {
              console.error(`[RadialChart] ERROR: Fecha inválida: "${fecha}"`);
              return;
            }
            
            // Usar el elemento que capturó el evento directamente
            const pathElement = d3.select(this);
            
            // Obtener el valor actual del hábito desde el segmento encontrado
            const foundSegmentHabitValue = foundSegment?.habits[habitId - 1] || 0;
            const currentValue = foundSegmentHabitValue;
            const newValue = currentValue === 1 ? 0 : 1;
            const newColor = getHabitColor(newValue, false);
            
            // Obtener el color original del elemento
            const originalColor = pathElement.attr('fill') || color;
            
            // Actualizar color inmediatamente (optimistic update)
            pathElement.attr('fill', newColor);
            
            // Llamar a la función para actualizar en el servidor
            try {
              console.log(`[RadialChart] Enviando al servidor - fecha: ${fecha}, habitId: ${habitId}`);
              await onHabitToggle(fecha, habitId);
              console.log(`[RadialChart] Actualización exitosa`);
              // El color ya está actualizado, el re-renderizado del gráfico mantendrá el cambio
            } catch (error) {
              // Si hay error, revertir el color
              pathElement.attr('fill', originalColor);
              console.error('[RadialChart] Error al actualizar hábito:', error);
            }
          };
          
          // Agregar tanto doble click como click simple
          habitPath
            .on('dblclick', handleHabitToggle)
            .on('click', handleHabitToggle);
          
          // Efecto hover para indicar que es clickeable
          habitPath
            .on('mouseenter', function() {
              if (habitValue === 0) {
                d3.select(this).attr('fill', '#e3f2fd'); // Azul claro al hover si no está completado
              }
            })
            .on('mouseleave', function() {
              d3.select(this).attr('fill', color); // Restaurar color original
            });
        } else if (onHabitToggle) {
          // Si no es editable, mostrar cursor no permitido
          habitPath.style('cursor', 'not-allowed');
        }
      }
      
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
    
    for (let i = 0; i < numHabits; i++) {
      // Calcular la posición Y basada en el radio del anillo del hábito
      const habitRadius = startRadius + (i * habitSpacing) + (habitSpacing / 2);
      
      // Posición Y de la etiqueta (alineada con el centro de su anillo)
      const labelY = centerY + Math.sin(labelAngle) * habitRadius;
      
      const displayText = displayNames[i] || `Hábito ${i + 1}`;
      
      // Crear un grupo para cada hábito (texto + fondo para edición)
      const habitGroup = habitLabelsGroup
        .append('g')
        .attr('class', `habit-label-group habit-${i + 1}`)
        .style('cursor', 'pointer');
      
      // Fondo semi-transparente para hover
      const bg = habitGroup
        .append('rect')
        .attr('x', labelX)
        .attr('y', labelY - 10)
        .attr('width', 80)
        .attr('height', 20)
        .attr('fill', 'transparent')
        .attr('rx', 3);
      
      // Texto del hábito
      const textElement = habitGroup
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'start')
        .attr('dy', '0.35em')
        .attr('data-habit-index', i)
        .text(`${i + 1}. ${displayText}`)
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#333')
        .style('user-select', 'none');
      
      // Hacer la etiqueta editable al hacer doble clic
      habitGroup.on('dblclick', function() {
        const currentText = displayText;
        const textNode = d3.select(this).select('text');
        
        // Crear un input para editar
        const foreignObject = d3.select(this)
          .append('foreignObject')
          .attr('x', labelX)
          .attr('y', labelY - 10)
          .attr('width', 75)
          .attr('height', 20);
        
        const input = foreignObject
          .append('xhtml:input')
          .attr('type', 'text')
          .attr('value', currentText)
          .style('width', '70px')
          .style('height', '18px')
          .style('font-size', '11px')
          .style('border', '1px solid #2196f3')
          .style('border-radius', '3px')
          .style('padding', '0 3px')
          .style('outline', 'none');
        
        // Ocultar el texto mientras se edita
        textNode.style('display', 'none');
        
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
          textNode.text(`${i + 1}. ${newValue}`);
          textNode.style('display', null);
          foreignObject.remove();
        };
        
        input.on('blur', saveEdit);
        input.on('keypress', function(event: any) {
          if (event.key === 'Enter') {
            saveEdit();
          }
        });
        input.on('keydown', function(event: any) {
          if (event.key === 'Escape') {
            textNode.style('display', null);
            foreignObject.remove();
          }
        });
      });
      
      // Efecto hover
      habitGroup
        .on('mouseenter', function() {
          bg.attr('fill', '#f0f0f0');
        })
        .on('mouseleave', function() {
          bg.attr('fill', 'transparent');
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

