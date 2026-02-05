import { Component, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import type { Order } from '../../models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {

  constructor(
    public auth: AuthService,
    public orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.loadOrders().subscribe();
  }

  viewOrder(order: Order) {
    // Navigate to order detail page (optional future enhancement)
    console.log('View order:', order);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  /**
   * Returns a human-readable status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pending',
      'INVENTORY_RESERVED': 'Reserved',
      'PAYMENT_PENDING': 'Payment Pending',
      'PAYMENT_AUTHORIZED': 'Payment Authorized',
      'CONFIRMED': 'Confirmed',
      'FULFILLED': 'Fulfilled',
      'CANCELLED': 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'INVENTORY_RESERVED': 'bg-blue-100 text-blue-800',
      'PAYMENT_PENDING': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_AUTHORIZED': 'bg-purple-100 text-purple-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'FULFILLED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'INVENTORY_RESERVED': 'fa-box',
      'PAYMENT_PENDING': 'fa-credit-card',
      'PAYMENT_AUTHORIZED': 'fa-check-circle',
      'CONFIRMED': 'fa-thumbs-up',
      'FULFILLED': 'fa-truck',
      'CANCELLED': 'fa-times-circle'
    };
    return icons[status] || 'fa-question-circle';
  }
}
