import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import type { Product } from '../../models';


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    DecimalPipe,  
    //DatePipe,     
  ],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
 
  selectedCategory = '';
  
  // Track which product is being purchased (for loading state)
  purchasingProductId = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    public productService: ProductService,
    private orderService: OrderService,
    private router: Router
  ) {}

 
  ngOnInit() {
    this.loadProducts();
    this.productService.loadCategories().subscribe();
  }

  
  loadProducts() {
    const category = this.selectedCategory || undefined;
    this.productService.loadProducts(category).subscribe();
  }


  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.loadProducts();
  }


  clearFilter() {
    this.selectedCategory = '';
    this.loadProducts();
  }


  viewProduct(product: Product) {
    console.log('View product:', product);
  }

  /**
   * Initiates a purchase for the selected product.
   * This triggers the full 7-step transaction lifecycle on the backend:
   * 1. Order creation
   * 2. Inventory validation
   * 3. Price & discount validation
   * 4. Payment authorization
   * 5. Order confirmation
   * 6. Inventory deduction
   * 7. Fulfillment trigger
   */
  buyProduct(product: Product) {
    // Prevent double-clicks
    if (this.purchasingProductId() !== null) {
      return;
    }

    // Confirm purchase
    const confirmed = confirm(
      `Confirm Purchase\n\n` +
      `Product: ${product.title}\n` +
      `Brand: ${product.brand}\n` +
      `Price: R${product.resalePrice.toFixed(2)}\n\n` +
      `Proceed with purchase?`
    );

    if (!confirmed) {
      return;
    }

    // Set loading state
    this.purchasingProductId.set(product.id);

    // Create the order via the OrderService
    this.orderService.createOrder({
      items: [
        { productId: product.id, quantity: 1 }
      ]
      // Optional: discountCode: 'WELCOME10' for 10% off
    }).subscribe({
      next: (order) => {
        console.log('Order created successfully:', order);
        // Reload products to reflect updated inventory
        this.loadProducts();
      },
      error: (err) => {
        console.error('Order failed:', err);
        // NotificationService already shows the error toast
      },
      complete: () => {
        // Clear loading state
        this.purchasingProductId.set(null);
      }
    });
  }

  /**
   * Check if a specific product is currently being purchased
   */
  isPurchasing(productId: string): boolean {
    return this.purchasingProductId() === productId;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }

  getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      'NEW': 'New',
      'LIKE_NEW': 'Like New',
      'GOOD': 'Good',
      'FAIR': 'Fair'
    };
    return labels[condition] || condition;
  }


  getConditionClass(condition: string): string {
    const classes: Record<string, string> = {
      'NEW': 'bg-green-100 text-green-800',
      'LIKE_NEW': 'bg-blue-100 text-blue-800',
      'GOOD': 'bg-yellow-100 text-yellow-800',
      'FAIR': 'bg-orange-100 text-orange-800'
    };
    return classes[condition] || 'bg-gray-100 text-gray-800';
  }
}