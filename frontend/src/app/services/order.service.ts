import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';
import type { ApiResponse } from '../models';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemInput[];
  discountCode?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productBrand: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product?: {
    id: string;
    title: string;
    brand: string | null;
    category: string;
    condition: string;
  };
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'INVENTORY_RESERVED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'CONFIRMED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  items: OrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  currency: string;
  paymentAuthId: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API = `${environment.apiUrl}/orders`;

  // State signals
  private _orders = signal<Order[]>([]);
  private _selectedOrder = signal<Order | null>(null);
  private _loading = signal(false);
  private _creating = signal(false);  // Separate loading state for order creation
  private _error = signal<string | null>(null);

  // Public read-only signals
  orders = this._orders.asReadonly();
  selectedOrder = this._selectedOrder.asReadonly();
  loading = this._loading.asReadonly();
  creating = this._creating.asReadonly();
  error = this._error.asReadonly();

  // Computed signals
  orderCount = computed(() => this._orders().length);
  hasOrders = computed(() => this._orders().length > 0);
  
  fulfilledOrders = computed(() =>
    this._orders().filter(o => o.status === 'FULFILLED')
  );

  cancelledOrders = computed(() =>
    this._orders().filter(o => o.status === 'CANCELLED')
  );

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
  ) {}

  createOrder(request: CreateOrderRequest) {
    this._creating.set(true);

    return this.http.post<ApiResponse<Order>>(this.API, request).pipe(
      tap(response => {
        if (response.success) {
          // Add to orders list
          this._orders.update(orders => [response.data, ...orders]);
          
          // Show success notification
          this.notify.success(
            'Order Placed!',
            `Order ${response.data.orderNumber} confirmed. Total: R${response.data.total.toFixed(2)}`
          );
        }
        this._creating.set(false);
      }),
      catchError(error => {
        this._creating.set(false);
        
        // Extract error message
        const message = error.error?.message 
          || error.error?.error 
          || 'Failed to place order. Please try again.';
        
        // Show error notification
        this.notify.error('Order Failed', message);
        
        return throwError(() => error);
      })
    );
  }

  loadOrders() {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ApiResponse<Order[]>>(this.API).pipe(
      tap(response => {
        if (response.success) {
          this._orders.set(response.data);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        const message = error.error?.message || 'Failed to load orders';
        this._error.set(message);
        this.notify.error('Error', message);
        return throwError(() => error);
      })
    );
  }

  loadOrder(orderId: string) {
    this._loading.set(true);

    return this.http.get<ApiResponse<Order>>(`${this.API}/${orderId}`).pipe(
      tap(response => {
        if (response.success) {
          this._selectedOrder.set(response.data);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        this.notify.error('Error', 'Failed to load order details');
        return throwError(() => error);
      })
    );
  }

  clearSelectedOrder() {
    this._selectedOrder.set(null);
  }

  getStatusInfo(status: OrderStatus): { label: string; color: string; icon: string } {
    const statusMap: Record<OrderStatus, { label: string; color: string; icon: string }> = {
      PENDING: {
        label: 'Pending',
        color: 'bg-gray-100 text-gray-800',
        icon: 'fa-clock',
      },
      INVENTORY_RESERVED: {
        label: 'Reserved',
        color: 'bg-blue-100 text-blue-800',
        icon: 'fa-box',
      },
      PAYMENT_PENDING: {
        label: 'Payment Pending',
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'fa-credit-card',
      },
      PAYMENT_AUTHORIZED: {
        label: 'Payment Authorized',
        color: 'bg-purple-100 text-purple-800',
        icon: 'fa-check',
      },
      CONFIRMED: {
        label: 'Confirmed',
        color: 'bg-green-100 text-green-800',
        icon: 'fa-circle-check',
      },
      FULFILLED: {
        label: 'Fulfilled',
        color: 'bg-green-100 text-green-800',
        icon: 'fa-truck',
      },
      CANCELLED: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800',
        icon: 'fa-circle-xmark',
      },
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100', icon: 'fa-question' };
  }
}