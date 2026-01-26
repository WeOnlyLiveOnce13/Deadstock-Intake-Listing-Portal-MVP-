// Pricing multipliers from data/sample_dataset_rules_and_pricing.md
// Formula: resale_price = original_price × condition_multiplier × category_multiplier

export const CONDITION_MULTIPLIERS: Record<string, number> = {
  new: 0.7,
  like_new: 0.6,
  good: 0.5,
  fair: 0.35,
};

export const CATEGORY_MULTIPLIERS: Record<string, number> = {
  Outerwear: 1.1,
  Jackets: 1.05,
  Dresses: 1.0,
  Shoes: 0.95,
  Knitwear: 0.9,
  Bottoms: 0.85,
  Tops: 0.8,
  Activewear: 0.8,
  Accessories: 0.75,
};

export const VALID_CONDITIONS = ['new', 'like_new', 'good', 'fair'] as const;
export const VALID_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Jackets',
  'Dresses',
  'Knitwear',
  'Shoes',
  'Accessories',
  'Activewear',
] as const;

export function calculateResalePrice(
  originalPrice: number,
  condition: string,
  category: string,
): number {
  const conditionMult = CONDITION_MULTIPLIERS[condition] ?? 0.5;
  const categoryMult = CATEGORY_MULTIPLIERS[category] ?? 0.85;
  return Math.round(originalPrice * conditionMult * categoryMult);
}
