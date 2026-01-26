import {
  validateRow,
  validateRows,
  validateHeaders,
  isEmptyRow,
} from './csv-validation';

describe('CSV Validation', () => {
  describe('validateHeaders', () => {
    it('should accept valid headers', () => {
      const headers = [
        'merchant_id',
        'sku',
        'title',
        'brand',
        'category',
        'condition',
        'original_price',
        'currency',
        'quantity',
      ];
      const result = validateHeaders(headers);
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing required headers', () => {
      const headers = ['merchant_id', 'sku', 'title'];
      const result = validateHeaders(headers);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('category');
      expect(result.missing).toContain('condition');
      expect(result.missing).toContain('original_price');
    });

    it('should handle case-insensitive headers', () => {
      const headers = [
        'MERCHANT_ID',
        'SKU',
        'TITLE',
        'BRAND',
        'CATEGORY',
        'CONDITION',
        'ORIGINAL_PRICE',
        'CURRENCY',
        'QUANTITY',
      ];
      const result = validateHeaders(headers);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRow', () => {
    const validRow = {
      merchant_id: 'm_001',
      sku: 'DSK-001',
      title: 'Blue Denim Jacket',
      brand: 'Levis',
      category: 'Jackets',
      condition: 'good',
      original_price: '899.00',
      currency: 'ZAR',
      quantity: '1',
    };

    it('should validate a correct row', () => {
      const result = validateRow(validRow, 2);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.merchant_id).toBe('m_001');
      expect(result.data!.original_price).toBe(899);
      expect(result.data!.quantity).toBe(1);
    });

    it('should reject invalid category', () => {
      const row = { ...validRow, category: 'InvalidCategory' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('category'))).toBe(true);
    });

    it('should reject invalid condition', () => {
      const row = { ...validRow, condition: 'broken' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors!.some((e) => e.includes('condition'))).toBe(true);
    });

    it('should reject negative price', () => {
      const row = { ...validRow, original_price: '-100' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(false);
    });

    it('should reject price exceeding maximum', () => {
      const row = { ...validRow, original_price: '10000' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(false);
    });

    it('should handle optional brand field', () => {
      const row = { ...validRow, brand: '' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.brand).toBeNull();
    });

    it('should normalize condition with spaces/dashes', () => {
      const row = { ...validRow, condition: 'like-new' };
      const result = validateRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.condition).toBe('like_new');
    });
  });

  describe('validateRows', () => {
    it('should validate multiple rows and detect duplicates', () => {
      const rows = [
        {
          merchant_id: 'm_001',
          sku: 'DSK-001',
          title: 'Item 1',
          brand: '',
          category: 'Tops',
          condition: 'good',
          original_price: '100',
          currency: 'ZAR',
          quantity: '1',
        },
        {
          merchant_id: 'm_001',
          sku: 'DSK-002',
          title: 'Item 2',
          brand: '',
          category: 'Tops',
          condition: 'good',
          original_price: '200',
          currency: 'ZAR',
          quantity: '1',
        },
        {
          merchant_id: 'm_001',
          sku: 'DSK-001', // Duplicate
          title: 'Item 3',
          brand: '',
          category: 'Tops',
          condition: 'good',
          original_price: '300',
          currency: 'ZAR',
          quantity: '1',
        },
      ];

      const result = validateRows(rows);
      expect(result.validRows).toHaveLength(2);
      expect(result.duplicateRows).toHaveLength(1);
      expect(result.duplicateRows[0].rowNumber).toBe(4); // Row 4 (index 2 + 2)
      expect(result.summary.valid).toBe(2);
      expect(result.summary.duplicates).toBe(1);
    });

    it('should separate valid and invalid rows', () => {
      const rows = [
        {
          merchant_id: 'm_001',
          sku: 'DSK-001',
          title: 'Valid Item',
          brand: '',
          category: 'Tops',
          condition: 'good',
          original_price: '100',
          currency: 'ZAR',
          quantity: '1',
        },
        {
          merchant_id: '',
          sku: '',
          title: '',
          brand: '',
          category: 'Invalid',
          condition: 'broken',
          original_price: 'abc',
          currency: 'ZZZZ',
          quantity: '-1',
        },
      ];

      const result = validateRows(rows);
      expect(result.validRows).toHaveLength(1);
      expect(result.invalidRows).toHaveLength(1);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
    });
  });

  describe('isEmptyRow', () => {
    it('should detect empty rows', () => {
      const emptyRow = {
        merchant_id: '',
        sku: '',
        title: '',
        brand: '',
        category: '',
        condition: '',
        original_price: '',
        currency: '',
        quantity: '',
      };
      expect(isEmptyRow(emptyRow)).toBe(true);
    });

    it('should detect non-empty rows', () => {
      const row = {
        merchant_id: 'm_001',
        sku: '',
        title: '',
        brand: '',
        category: '',
        condition: '',
        original_price: '',
        currency: '',
        quantity: '',
      };
      expect(isEmptyRow(row)).toBe(false);
    });

    it('should handle whitespace-only values as empty', () => {
      const row = {
        merchant_id: '   ',
        sku: '  ',
        title: '',
        brand: '',
        category: '',
        condition: '',
        original_price: '',
        currency: '',
        quantity: '',
      };
      expect(isEmptyRow(row)).toBe(true);
    });
  });
});
