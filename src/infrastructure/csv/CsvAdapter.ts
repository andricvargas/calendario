import Papa from 'papaparse';
import { ProgressData } from '@domain/repositories/ProgressRepository';

export class CsvAdapter {
  parse(csvContent: string): ProgressData[] {
    const result = Papa.parse<ProgressData>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      throw new Error(`Error al parsear CSV: ${result.errors[0].message}`);
    }

    return result.data.map((row) => ({
      fecha: row.fecha.trim(),
      habito_1: parseInt(row.habito_1?.toString() || '0', 10),
      habito_2: parseInt(row.habito_2?.toString() || '0', 10),
      habito_3: parseInt(row.habito_3?.toString() || '0', 10),
      habito_4: parseInt(row.habito_4?.toString() || '0', 10),
      habito_5: parseInt(row.habito_5?.toString() || '0', 10),
      habito_6: parseInt(row.habito_6?.toString() || '0', 10),
      habito_7: parseInt(row.habito_7?.toString() || '0', 10),
      habito_8: parseInt(row.habito_8?.toString() || '0', 10),
    }));
  }

  stringify(data: ProgressData[]): string {
    const csv = Papa.unparse(data, {
      header: true,
      columns: [
        'fecha',
        'habito_1',
        'habito_2',
        'habito_3',
        'habito_4',
        'habito_5',
        'habito_6',
        'habito_7',
        'habito_8',
      ],
    });
    return csv;
  }
}

