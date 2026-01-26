import { z } from 'zod';
import {
  VALID_CONDITIONS,
  VALID_CATEGORIES,
} from '../../common/constants/pricing.constants.js';

const LIMITS = {
  MERCHANT_ID_MAX: 10,
  SKU_MAX: 10,
  TITLE_MAX: 30,
  BRAND_MAX: 20,
  PRICE_MAX: 5_000,
  QUANTITY_MAX: 200,
} as const;

// Form input schema (for single item creation)
export const inventoryCreateSchema = z.object({
  merchant_id: z.string().trim().min(1).max(LIMITS.MERCHANT_ID_MAX),
  sku: z.string().trim().min(1).max(LIMITS.SKU_MAX),
  title: z.string().trim().min(1).max(LIMITS.TITLE_MAX),
  brand: z.string().trim().max(LIMITS.BRAND_MAX).nullable().optional(),
  category: z.enum(VALID_CATEGORIES),
  condition: z.enum(VALID_CONDITIONS),
  original_price: z.number().positive().max(LIMITS.PRICE_MAX),
  currency: z.string().trim().length(3).toUpperCase(),
  quantity: z.number().int().min(1).max(LIMITS.QUANTITY_MAX),
});

export type InventoryCreateInput = z.infer<typeof inventoryCreateSchema>;

// Partial update schema
export const inventoryUpdateSchema = inventoryCreateSchema.partial().extend({
  resale_price: z
    .number()
    .positive()
    .max(LIMITS.PRICE_MAX)
    .nullable()
    .optional(),
});

export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;

// CSV row schema (all inputs are strings)
export const inventoryRowSchema = z.object({
  merchant_id: z
    .string()
    .trim()
    .min(1, 'merchant_id required')
    .max(LIMITS.MERCHANT_ID_MAX),
  sku: z.string().trim().min(1, 'sku required').max(LIMITS.SKU_MAX),
  title: z.string().trim().min(1, 'title required').max(LIMITS.TITLE_MAX),
  brand: z
    .string()
    .trim()
    .max(LIMITS.BRAND_MAX)
    .nullable()
    .optional()
    .transform((v) => v || null),
  category: z
    .string()
    .trim()
    .refine((v) => (VALID_CATEGORIES as readonly string[]).includes(v), {
      message: `Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    }),
  condition: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/[\s-]/g, '_'))
    .refine((v) => (VALID_CONDITIONS as readonly string[]).includes(v), {
      message: `Must be one of: ${VALID_CONDITIONS.join(', ')}`,
    }),
  original_price: z
    .string()
    .trim()
    .transform((v) => parseFloat(v.replace(/[,$\s]/g, '')))
    .refine((v) => !isNaN(v) && v > 0 && v <= LIMITS.PRICE_MAX, {
      message: `Must be a number between 0.01 and ${LIMITS.PRICE_MAX}`,
    }),
  currency: z.string().trim().toUpperCase().length(3, 'Must be 3-letter code'),
  quantity: z
    .string()
    .trim()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !isNaN(v) && v >= 1 && v <= LIMITS.QUANTITY_MAX, {
      message: `Must be integer between 1 and ${LIMITS.QUANTITY_MAX}`,
    }),
});

export type InventoryRowInput = z.input<typeof inventoryRowSchema>;
export type InventoryRowParsed = z.output<typeof inventoryRowSchema>;

// Bulk price/list schema
export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required'),
});

export type BulkIdsInput = z.infer<typeof bulkIdsSchema>;

// Set price schema
export const setPriceSchema = z.object({
  resale_price: z.number().positive().max(LIMITS.PRICE_MAX),
});

export type SetPriceInput = z.infer<typeof setPriceSchema>;
