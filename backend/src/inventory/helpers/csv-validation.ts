import {
  inventoryRowSchema,
  type InventoryRowParsed,
} from '../dto/inventory.schema.js';

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  data?: InventoryRowParsed;
  errors?: string[];
}

export function validateRow(
  row: Record<string, string>,
  rowNumber: number,
): RowValidationResult {
  const result = inventoryRowSchema.safeParse(row);
  if (result.success) {
    return { rowNumber, isValid: true, data: result.data };
  }
  return {
    rowNumber,
    isValid: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}

export interface BulkValidationResult {
  validRows: { rowNumber: number; data: InventoryRowParsed }[];
  invalidRows: { rowNumber: number; errors: string[] }[];
  duplicateRows: { rowNumber: number; errors: string[] }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

export function validateRows(
  rows: Record<string, string>[],
): BulkValidationResult {
  const validRows: BulkValidationResult['validRows'] = [];
  const invalidRows: BulkValidationResult['invalidRows'] = [];
  const duplicateRows: BulkValidationResult['duplicateRows'] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const result = validateRow(row, rowNumber);

    if (!result.isValid) {
      invalidRows.push({ rowNumber, errors: result.errors! });
      return;
    }

    const key = `${result.data!.merchant_id}:${result.data!.sku}`;
    if (seen.has(key)) {
      duplicateRows.push({ rowNumber, errors: [`Duplicate: ${key}`] });
      return;
    }

    seen.add(key);
    validRows.push({ rowNumber, data: result.data! });
  });

  return {
    validRows,
    invalidRows,
    duplicateRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      duplicates: duplicateRows.length,
    },
  };
}

export const REQUIRED_HEADERS = [
  'merchant_id',
  'sku',
  'title',
  'brand',
  'category',
  'condition',
  'original_price',
  'currency',
  'quantity',
] as const;

export function validateHeaders(headers: string[]): {
  isValid: boolean;
  missing: string[];
} {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !normalized.includes(h));
  return { isValid: missing.length === 0, missing };
}

export function isEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => !v?.trim());
}
