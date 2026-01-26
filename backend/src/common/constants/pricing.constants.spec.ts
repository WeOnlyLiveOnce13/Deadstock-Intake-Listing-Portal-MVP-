import {
  calculateResalePrice,
  CONDITION_MULTIPLIERS,
  CATEGORY_MULTIPLIERS,
} from './pricing.constants';

describe('Pricing Logic', () => {
  describe('calculateResalePrice', () => {
    it('should calculate price for new Outerwear correctly', () => {
      // new (0.7) × Outerwear (1.1) = 0.77
      const result = calculateResalePrice(1000, 'new', 'Outerwear');
      expect(result).toBe(770); // 1000 × 0.7 × 1.1 = 770
    });

    it('should calculate price for like_new Tops correctly', () => {
      // like_new (0.6) × Tops (0.8) = 0.48
      const result = calculateResalePrice(500, 'like_new', 'Tops');
      expect(result).toBe(240); // 500 × 0.6 × 0.8 = 240
    });

    it('should calculate price for good Jackets correctly', () => {
      // good (0.5) × Jackets (1.05) = 0.525
      const result = calculateResalePrice(899, 'good', 'Jackets');
      expect(result).toBe(472); // 899 × 0.5 × 1.05 = 471.975, rounded to 472
    });

    it('should calculate price for fair Accessories correctly', () => {
      // fair (0.35) × Accessories (0.75) = 0.2625
      const result = calculateResalePrice(400, 'fair', 'Accessories');
      expect(result).toBe(105); // 400 × 0.35 × 0.75 = 105
    });

    it('should use default multipliers for unknown condition', () => {
      // unknown condition defaults to 0.5, Shoes (0.95)
      const result = calculateResalePrice(1000, 'unknown', 'Shoes');
      expect(result).toBe(475); // 1000 × 0.5 × 0.95 = 475
    });

    it('should use default multipliers for unknown category', () => {
      // good (0.5), unknown category defaults to 0.85
      const result = calculateResalePrice(1000, 'good', 'UnknownCategory');
      expect(result).toBe(425); // 1000 × 0.5 × 0.85 = 425
    });

    it('should round to nearest integer', () => {
      // like_new (0.6) × Knitwear (0.9) = 0.54
      const result = calculateResalePrice(333, 'like_new', 'Knitwear');
      expect(result).toBe(180); // 333 × 0.6 × 0.9 = 179.82, rounded to 180
    });

    it('should handle zero price', () => {
      const result = calculateResalePrice(0, 'new', 'Tops');
      expect(result).toBe(0);
    });

    it('should handle very large prices', () => {
      const result = calculateResalePrice(5000, 'new', 'Outerwear');
      expect(result).toBe(3850); // 5000 × 0.7 × 1.1 = 3850
    });
  });

  describe('CONDITION_MULTIPLIERS', () => {
    it('should have correct multipliers for all conditions', () => {
      expect(CONDITION_MULTIPLIERS['new']).toBe(0.7);
      expect(CONDITION_MULTIPLIERS['like_new']).toBe(0.6);
      expect(CONDITION_MULTIPLIERS['good']).toBe(0.5);
      expect(CONDITION_MULTIPLIERS['fair']).toBe(0.35);
    });

    it('should have 4 condition levels', () => {
      expect(Object.keys(CONDITION_MULTIPLIERS)).toHaveLength(4);
    });
  });

  describe('CATEGORY_MULTIPLIERS', () => {
    it('should have correct multipliers for premium categories', () => {
      expect(CATEGORY_MULTIPLIERS['Outerwear']).toBe(1.1);
      expect(CATEGORY_MULTIPLIERS['Jackets']).toBe(1.05);
      expect(CATEGORY_MULTIPLIERS['Dresses']).toBe(1.0);
    });

    it('should have correct multipliers for standard categories', () => {
      expect(CATEGORY_MULTIPLIERS['Shoes']).toBe(0.95);
      expect(CATEGORY_MULTIPLIERS['Knitwear']).toBe(0.9);
      expect(CATEGORY_MULTIPLIERS['Bottoms']).toBe(0.85);
    });

    it('should have correct multipliers for value categories', () => {
      expect(CATEGORY_MULTIPLIERS['Tops']).toBe(0.8);
      expect(CATEGORY_MULTIPLIERS['Activewear']).toBe(0.8);
      expect(CATEGORY_MULTIPLIERS['Accessories']).toBe(0.75);
    });

    it('should have 9 category levels', () => {
      expect(Object.keys(CATEGORY_MULTIPLIERS)).toHaveLength(9);
    });
  });

  describe('Pricing scenarios from sample data', () => {
    // Test cases from sample_deadstock_inventory_valid.csv
    it('should price Blue Denim Jacket correctly', () => {
      // Jackets, good, 899 ZAR
      const result = calculateResalePrice(899, 'good', 'Jackets');
      expect(result).toBe(472); // 899 × 0.5 × 1.05
    });

    it('should price Classic White Shirt correctly', () => {
      // Tops, like_new, 349 ZAR
      // 349 × 0.6 × 0.8 = 167.52 → rounds to 168
      const result = calculateResalePrice(349, 'like_new', 'Tops');
      expect(result).toBe(168);
    });

    it('should price Leather Ankle Boots correctly', () => {
      // Shoes, fair, 1299 ZAR
      const result = calculateResalePrice(1299, 'fair', 'Shoes');
      expect(result).toBe(432); // 1299 × 0.35 × 0.95
    });

    it('should price Trench Coat correctly', () => {
      // Outerwear, like_new, 2499 ZAR
      const result = calculateResalePrice(2499, 'like_new', 'Outerwear');
      expect(result).toBe(1649); // 2499 × 0.6 × 1.1
    });
  });
});
