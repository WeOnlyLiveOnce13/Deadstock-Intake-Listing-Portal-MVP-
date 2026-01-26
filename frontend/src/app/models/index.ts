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
