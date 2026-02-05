export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface InventoryItem {
  id: string;
  merchantId: string;
  sku: string;
  title: string;
  brand: string | null;
  category: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  originalPrice: number;
  resalePrice: number;
  currency: string;
  quantity: number;
  status: 'DRAFT' | 'PRICED' | 'LISTED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  merchant_id: string;
  sku: string;
  title: string;
  brand?: string;
  category: string;
  condition: string;
  original_price: number;
  currency: string;
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface BulkUploadError {
  rowNumber: number;
  errors: string[];
}

export interface BulkUploadResult {
  success: boolean;
  error?: string;
  summary?: {
    total: number;
    inserted: number;
    invalid: number;
    duplicatesInFile: number;
    duplicatesInDb: number;
  };
  errors?: {
    invalid: BulkUploadError[];
    duplicatesInFile: BulkUploadError[];
    duplicatesInDb: BulkUploadError[];
  };
}

export interface BulkOperationResult {
  processed: number;
  items: InventoryItem[];
}

export const CATEGORIES = [
  'Tops', 'Bottoms', 'Outerwear', 'Jackets', 'Dresses',
  'Knitwear', 'Shoes', 'Accessories', 'Activewear'
] as const;

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
] as const;

export const CURRENCIES = ['ZAR', 'USD', 'EUR', 'GBP', 'KES', 'NGN'] as const;

export interface Product {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  resalePrice: number;
  currency: string;
  quantity: number;
  status: 'LISTED';  
  createdAt: string;
}

export interface ProductDetail extends Product {
  originalPrice: number;
  updatedAt: string;
}

// =====================
// ORDER INTERFACES
// =====================

export type OrderStatus = 
  | 'PENDING'
  | 'INVENTORY_RESERVED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'CONFIRMED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productBrand: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  paymentAuthId: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  items: Array<{ productId: string; quantity: number }>;
  discountCode?: string;
}
