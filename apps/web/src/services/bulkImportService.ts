import { BulkImportRowData, bulkImportRowSchema } from '@infinityhub/validation';
import { mockStore } from '../data/mockStore';

export interface ImportError {
  row: number;
  field: string;
  error: string;
}

export const bulkImportService = {
  parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const results: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = currentLine[index] || '';
      });
      results.push(row);
    }

    return results;
  },

  parseCsv(csvText: string): { rows: BulkImportRowData[]; errors: ImportError[] } {
    const rawRows = this.parseCSV(csvText);
    const { valid, errors } = this.validateRows(rawRows);
    return { rows: valid, errors };
  },

  validateRows(rows: Record<string, string>[]): {
    valid: BulkImportRowData[];
    errors: ImportError[];
  } {
    const valid: BulkImportRowData[] = [];
    const errors: ImportError[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // account for 1-based index and header row
      const result = bulkImportRowSchema.safeParse(row);
      if (result.success) {
        valid.push(result.data);
      } else {
        result.error.errors.forEach(err => {
          errors.push({
            row: rowNum,
            field: err.path.join('.'),
            error: err.message
          });
        });
      }
    });

    return { valid, errors };
  },

  async commitImport(tenantId: string, rows: BulkImportRowData[]): Promise<{ importedCount: number }> {
    return mockStore.bulkImportProducts(tenantId, rows);
  },

  async executeImport(tenantId: string, rows: BulkImportRowData[], _user?: any): Promise<{ importedCount: number; errors: ImportError[] }> {
    const result = await this.commitImport(tenantId, rows);
    return { importedCount: result.importedCount, errors: [] };
  }
};
