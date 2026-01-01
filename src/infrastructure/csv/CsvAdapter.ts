import Papa from 'papaparse';
import { ProgressData } from '@domain/repositories/ProgressRepository';

export class CsvAdapter {
  // Método para extraer los nombres de los hábitos desde los headers del CSV
  extractHabitNames(csvContent: string, habitCount: number = 8): string[] {
    try {
      // Si el contenido está vacío o solo tiene espacios, retornar nombres por defecto
      if (!csvContent || !csvContent.trim()) {
        return Array.from({ length: habitCount }, (_, i) => `Hábito ${i + 1}`);
      }

      // Leer solo la primera línea para obtener los headers
      const firstLine = csvContent.split('\n')[0].trim();
      if (!firstLine) {
        return Array.from({ length: habitCount }, (_, i) => `Hábito ${i + 1}`);
      }

      // Parsear solo los headers
      const result = Papa.parse<Record<string, string>>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        preview: 0, // Solo leer headers, no datos
      });

      const headers = result.meta.fields?.filter(h => h !== 'fecha') || [];
      const habitNames: string[] = [];

      for (let i = 0; i < habitCount; i++) {
        if (i < headers.length) {
          const header = headers[i];
          // Si el header es habito_X, usar el nombre por defecto
          if (header.match(/^habito_\d+$/)) {
            habitNames.push(`Hábito ${i + 1}`);
          } else {
            // Usar el header personalizado tal cual está (puede tener guiones bajos de sanitización)
            // Reemplazar guiones bajos múltiples con espacios para hacerlo más legible
            const desanitizedName = header.replace(/_+/g, ' ').trim();
            habitNames.push(desanitizedName || `Hábito ${i + 1}`);
          }
        } else {
          habitNames.push(`Hábito ${i + 1}`);
        }
      }

      return habitNames;
    } catch (error) {
      // Si hay error al parsear, retornar nombres por defecto
      console.warn('[CsvAdapter] Error al extraer nombres de hábitos, usando valores por defecto:', error);
      return Array.from({ length: habitCount }, (_, i) => `Hábito ${i + 1}`);
    }
  }

  parse(csvContent: string, habitCount: number = 8): ProgressData[] {
    // Si el contenido está vacío o solo tiene espacios, retornar array vacío
    if (!csvContent || !csvContent.trim()) {
      return [];
    }

    // Si solo tiene headers sin datos, retornar array vacío
    const lines = csvContent.trim().split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      return [];
    }

    try {
      const result = Papa.parse<Record<string, string>>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        delimiter: ',', // Especificar explícitamente el delimitador
      });

      // Si no hay datos (solo headers), retornar array vacío
      if (!result.data || result.data.length === 0) {
        return [];
      }

      if (result.errors.length > 0) {
        // Filtrar solo errores críticos (no advertencias)
        const criticalErrors = result.errors.filter(e => 
          e.type === 'Quotes' || 
          e.type === 'Delimiter' ||
          (e.type === 'FieldMismatch' && e.row !== undefined)
        );
        if (criticalErrors.length > 0 && result.data.length === 0) {
          // Solo lanzar error si no hay datos y hay errores críticos
          throw new Error(`Error al parsear CSV: ${criticalErrors[0].message}`);
        }
        // Si hay datos pero también advertencias, continuar
      }

    // Obtener todos los headers excepto 'fecha'
    const headers = result.meta.fields?.filter(h => h !== 'fecha') || [];
    
    return result.data.map((row) => {
      const progressData: ProgressData = {
        fecha: row.fecha?.trim() || '',
      };

      // Parsear todos los hábitos dinámicamente
      // Si hay headers personalizados, mapearlos a habito_1, habito_2, etc.
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        // Intentar primero con habito_i (formato estándar)
        if (row[habitKey] !== undefined) {
          progressData[habitKey] = parseInt(row[habitKey]?.toString() || '0', 10);
        } else {
          // Si no existe habito_i, buscar en los headers disponibles (puede tener nombre personalizado)
          // El índice i-1 corresponde al hábito i (el primer header después de 'fecha' es hábito 1)
          const headerIndex = i - 1;
          if (headerIndex < headers.length) {
            const customHeader = headers[headerIndex];
            const value = parseInt(row[customHeader]?.toString() || '0', 10);
            progressData[habitKey] = value;
          } else {
            progressData[habitKey] = 0;
          }
        }
      }

      return progressData;
    });
    } catch (error: any) {
      // Si hay un error al parsear, verificar si es por contenido vacío
      if (!csvContent || !csvContent.trim() || csvContent.trim().split('\n').length <= 1) {
        return [];
      }
      // Si es otro tipo de error, lanzarlo
      throw new Error(`Error al parsear CSV: ${error.message || 'Error desconocido'}`);
    }
  }

  stringify(data: ProgressData[], habitCount: number = 8, habitNames?: string[]): string {
    // Construir columnas dinámicamente
    // Si hay nombres personalizados, usarlos; sino usar habito_1, habito_2, etc.
    const columns = ['fecha'];
    const columnMapping: { [key: string]: string } = { fecha: 'fecha' };
    
    for (let i = 1; i <= habitCount; i++) {
      const habitKey = `habito_${i}`;
      let columnName: string;
      
      if (habitNames && habitNames.length >= i && habitNames[i - 1]) {
        // Usar el nombre personalizado, sanitizándolo para que sea válido como header CSV
        const customName = habitNames[i - 1].trim();
        // Reemplazar espacios y caracteres especiales con guiones bajos, pero mantener el nombre legible
        const sanitizedName = customName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
        columnName = sanitizedName || `habito_${i}`;
      } else {
        columnName = `habito_${i}`;
      }
      
      columns.push(columnName);
      columnMapping[habitKey] = columnName;
    }

    // Si no hay datos, crear un CSV solo con los headers
    if (data.length === 0) {
      return columns.join(',') + '\n';
    }

    // Transformar los datos para que las propiedades coincidan con los nombres de las columnas
    const transformedData = data.map(row => {
      const transformedRow: any = { fecha: row.fecha };
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}` as keyof ProgressData;
        const columnName = columnMapping[habitKey];
        const value = row[habitKey];
        // Asegurar que el valor sea un número (0 o 1)
        transformedRow[columnName] = value === 1 || value === '1' ? 1 : 0;
      }
      return transformedRow;
    });

    console.log(`[CsvAdapter] Datos transformados: ${transformedData.length} filas`);
    if (transformedData.length > 0) {
      console.log(`[CsvAdapter] Primera fila transformada:`, JSON.stringify(transformedData[0]));
    }
    console.log(`[CsvAdapter] Columnas:`, columns);

    // Usar Papa.unparse sin columns para que use todas las propiedades del objeto
    // Las columnas ya están en el orden correcto en transformedData
    const csv = Papa.unparse(transformedData, {
      header: true,
    });
    
    // Verificar que el CSV tiene el formato correcto
    const lines = csv.split('\n');
    const headerLine = lines[0];
    console.log(`[CsvAdapter] Header del CSV: ${headerLine}`);
    console.log(`[CsvAdapter] Total de líneas: ${lines.length}`);
    if (lines.length > 1) {
      console.log(`[CsvAdapter] Primera fila de datos: ${lines[1]}`);
    }
    console.log(`[CsvAdapter] CSV generado (primeras 200 caracteres):`, csv.substring(0, 200));
    return csv;
  }
}

