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

    return result.data.map((row) => {
      const progressData: ProgressData = {
        fecha: row.fecha?.trim() || '',
      };

      // Parsear todos los hábitos dinámicamente
      for (let i = 1; i <= habitCount; i++) {
        const habitKey = `habito_${i}`;
        progressData[habitKey] = parseInt(row[habitKey]?.toString() || '0', 10);
      }

      return progressData;
    });
  }

  stringify(data: ProgressData[], habitCount: number = 8): string {
    if (data.length === 0) {
      return 'fecha\n';
    }

    // Construir columnas dinámicamente
    const columns = ['fecha'];
    for (let i = 1; i <= habitCount; i++) {
      columns.push(`habito_${i}`);
    }

    const csv = Papa.unparse(data, {
      header: true,
      columns,
    });
    return csv;
  }
}

