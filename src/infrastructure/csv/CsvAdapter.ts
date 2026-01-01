import Papa from 'papaparse';
import { ProgressData } from '@domain/repositories/ProgressRepository';

export class CsvAdapter {
  parse(csvContent: string, habitCount: number = 8): ProgressData[] {
    const result = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      throw new Error(`Error al parsear CSV: ${result.errors[0].message}`);
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
  }

  stringify(data: ProgressData[], habitCount: number = 8, habitNames?: string[]): string {
    if (data.length === 0) {
      return 'fecha\n';
    }

    // Construir columnas dinámicamente
    // Si hay nombres personalizados, usarlos; sino usar habito_1, habito_2, etc.
    const columns = ['fecha'];
    for (let i = 1; i <= habitCount; i++) {
      if (habitNames && habitNames.length >= i && habitNames[i - 1]) {
        // Usar el nombre personalizado, sanitizándolo para que sea válido como header CSV
        const customName = habitNames[i - 1].trim();
        // Reemplazar espacios y caracteres especiales con guiones bajos, pero mantener el nombre legible
        const sanitizedName = customName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
        columns.push(sanitizedName || `habito_${i}`);
      } else {
        columns.push(`habito_${i}`);
      }
    }

    const csv = Papa.unparse(data, {
      header: true,
      columns,
    });
    return csv;
  }
}

