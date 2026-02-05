export interface Discount {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number; // Percentage (0-100) or fixed amount
  minOrderAmount?: number; // Minimum order total to apply
  maxDiscount?: number; // Cap for percentage discounts
  expiresAt?: Date;
  isActive: boolean;
}

export const DISCOUNTS: Record<string, Discount> = {
  WELCOME10: {
    code: 'WELCOME10',
    description: '10% off your first order',
    type: 'percentage',
    value: 10,
    isActive: true,
  },
  SAVE50: {
    code: 'SAVE50',
    description: 'R50 off orders over R500',
    type: 'fixed',
    value: 50,
    minOrderAmount: 500,
    isActive: true,
  },
  VIP20: {
    code: 'VIP20',
    description: '20% off (max R200)',
    type: 'percentage',
    value: 20,
    maxDiscount: 200,
    isActive: true,
  },
  EXPIRED: {
    code: 'EXPIRED',
    description: 'Expired discount',
    type: 'percentage',
    value: 15,
    expiresAt: new Date('2025-12-31'), // Already expired
    isActive: true,
  },
  INACTIVE: {
    code: 'INACTIVE',
    description: 'Inactive discount',
    type: 'percentage',
    value: 25,
    isActive: false, // Disabled
  },
};

export interface DiscountValidationResult {
  valid: boolean;
  discount?: Discount;
  discountAmount?: number;
  error?: string;
}

export function validateDiscount(
  code: string,
  orderSubtotal: number,
): DiscountValidationResult {
  // Normalize code (uppercase, trim)
  const normalizedCode = code.trim().toUpperCase();

  // Find discount
  const discount = DISCOUNTS[normalizedCode];

  // Check if discount exists
  if (!discount) {
    return {
      valid: false,
      error: `Invalid discount code: ${code}`,
    };
  }

  // Check if discount is active
  if (!discount.isActive) {
    return {
      valid: false,
      error: `Discount code "${code}" is no longer active`,
    };
  }

  // Check if discount is expired
  if (discount.expiresAt && new Date() > discount.expiresAt) {
    return {
      valid: false,
      error: `Discount code "${code}" has expired`,
    };
  }

  // Check minimum order amount
  if (discount.minOrderAmount && orderSubtotal < discount.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of R${discount.minOrderAmount} required for code "${code}"`,
    };
  }

  // Calculate discount amount
  let discountAmount: number;

  if (discount.type === 'percentage') {
    discountAmount = (orderSubtotal * discount.value) / 100;

    // Apply max discount cap if specified
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount;
    }
  } else {
    // Fixed discount
    discountAmount = discount.value;
  }

  // Ensure discount doesn't exceed order total
  if (discountAmount > orderSubtotal) {
    discountAmount = orderSubtotal;
  }

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    discount,
    discountAmount,
  };
}

export function applyDiscount(
  subtotal: number,
  discountCode?: string,
): {
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  discountDescription?: string;
} {
  if (!discountCode) {
    return {
      subtotal,
      discountCode: null,
      discountAmount: 0,
      total: subtotal,
    };
  }

  const validation = validateDiscount(discountCode, subtotal);

  if (!validation.valid) {
    // If invalid, apply no discount but don't throw error
    return {
      subtotal,
      discountCode: null,
      discountAmount: 0,
      total: subtotal,
    };
  }

  const discountAmount = validation.discountAmount!;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;

  return {
    subtotal,
    discountCode: validation.discount!.code,
    discountAmount,
    total,
    discountDescription: validation.discount!.description,
  };
}
