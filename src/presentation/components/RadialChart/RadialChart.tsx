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

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;

    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate();

    const segments = calculateSegments(progress, currentDate, daysInMonth, viewDate, habitCount);

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
    
    // Encontrar el día actual para posicionarlo en las 00:00 (arriba)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    const anglePerDay = totalAngle / todayDay; // Ángulo por día (ajustado al número de días)
    
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
    
    // Grupo para las etiquetas de días (fuera del gráfico)
    const dayLabelGroup = svg.append('g').attr('class', 'day-labels');
    
    // Almacenar las posiciones de las etiquetas para detectar superposiciones
    const labelPositions: Array<{ day: number; x: number; y: number; angle: number }> = [];

    // Para cada día (sección radial)
    dayGroups.each(function (segment: SegmentData, index: number) {
      const dayGroup = d3.select(this);
      // Usar el índice del callback en lugar de findIndex para mayor precisión
      const dayIndex = index;
      
      // Calcular el ángulo de esta sección de día
      // El día actual está en las 00:00 (arriba), y los días anteriores van hacia la derecha
      // El orden es inverso: día actual, día anterior, día anterior al anterior, etc.
      const dayNumber = segment.day;
      
      // Calcular cuántos días antes del día actual está este día
      // Si todayDay = 28, dayNumber = 28 → daysBeforeToday = 0 (día actual en 00:00)
      // Si todayDay = 28, dayNumber = 27 → daysBeforeToday = 1 (primer día a la derecha)
      // Si todayDay = 28, dayNumber = 26 → daysBeforeToday = 2 (segundo día a la derecha)
      const daysBeforeToday = todayDay - dayNumber;
      
      // Calcular los ángulos de inicio y fin del segmento
      // Para ir hacia la DERECHA (sentido horario), necesitamos RESTAR ángulos, no sumarlos
      // Día actual (daysBeforeToday = 0): COMIENZA en todayStartAngle (-π/2, 00:00)
      // Día anterior (daysBeforeToday = 1): COMIENZA en todayStartAngle - anglePerDay (más a la derecha)
      // etc.
      const dayOffset = daysBeforeToday * anglePerDay;
      const dayStartAngle = todayStartAngle - dayOffset;
      const dayEndAngle = todayStartAngle - dayOffset - anglePerDay;
      
      // Calcular el ángulo central del día (para las etiquetas)
      // IMPORTANTE: Las etiquetas usan el cálculo ANTERIOR (sumando) para mantener su posición
      // mientras los segmentos usan el nuevo cálculo (restando)
      const dayCenterAngle = todayStartAngle + dayOffset + (anglePerDay / 2);
      
      // Almacenar los ángulos para este segmento
      segmentAngles.set(segment.fecha, { startAngle: dayStartAngle, endAngle: dayEndAngle, centerAngle: dayCenterAngle });
      
      // Para cada hábito (anillo concéntrico)
      for (let habitIndex = 0; habitIndex < numHabits; habitIndex++) {
        const innerRadius = startRadius + (habitIndex * habitSpacing);
        const outerRadius = startRadius + ((habitIndex + 1) * habitSpacing);
        const habitValue = segment.habits[habitIndex];
        const color = getHabitColor(habitValue, false);
        
        // Crear celda (arco) para este hábito y día
        const cellPath = createArc(
          innerRadius,
          outerRadius,
          dayStartAngle,
          dayEndAngle
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
        
        // Agregar doble click y click simple para marcar/desmarcar el hábito
        // Verificar si el día es editable basándose en la fecha del segmento
        const segmentDate = new Date(segment.fecha);
        segmentDate.setHours(0, 0, 0, 0);
        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);
        const isEditable = segmentDate.getTime() <= todayCheck.getTime();
        
        if (onHabitToggle && isEditable) {
          const handleHabitToggle = async function(event: any) {
            event.stopPropagation(); // Evitar que se propague al click del día
            const fecha = segment.fecha;
            const habitId = habitIndex + 1;
            const currentValue = habitValue;
            const newValue = currentValue === 1 ? 0 : 1;
            const newColor = getHabitColor(newValue, false);
            
            // Actualizar color inmediatamente (optimistic update)
            d3.select(this).attr('fill', newColor);
            
            // Llamar a la función para actualizar en el servidor
            try {
              await onHabitToggle(fecha, habitId);
            } catch (error) {
              // Si hay error, revertir el color
              d3.select(this).attr('fill', color);
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
      
      // Crear la etiqueta del día inmediatamente después de renderizar el segmento
      // Usar el ángulo central calculado directamente (dayCenterAngle) en lugar de centroid()
      // Esto garantiza que la etiqueta esté perfectamente alineada con el centro del segmento
      // El centroid() de D3 puede no coincidir exactamente con el centro visual cuando startAngle > endAngle
      const centroidAngle = dayCenterAngle;
      
      // Calcular la posición base de la etiqueta
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
      
      // Crear un círculo de fondo para el número
      const labelBg = dayLabelGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 12)
        .attr('fill', isToday ? '#e3f2fd' : 'transparent')
        .attr('stroke', isToday ? '#2196f3' : 'transparent')
        .attr('stroke-width', 1);
      
      dayLabelGroup
        .append('text')
        .attr('class', 'day-label')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
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


  }, [progress, currentDate, viewDate, onHabitToggle, habitNames, habitCount]);

  return (
    <div ref={containerRef} className="radial-chart-container">
      <svg ref={svgRef} width={800} height={800} className="radial-chart-svg">
        {/* El contenido se genera dinámicamente con D3 */}
      </svg>
    </div>
  );
}

