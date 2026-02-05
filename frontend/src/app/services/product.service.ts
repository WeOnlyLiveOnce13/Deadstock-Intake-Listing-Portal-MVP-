import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';
import type { ApiResponse, Product, ProductDetail } from '../models';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly API = `${environment.apiUrl}/products`;

  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _categories = signal<string[]>([]);
  private _selectedProduct = signal<ProductDetail | null>(null);

  products = this._products.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  categories = this._categories.asReadonly();
  selectedProduct = this._selectedProduct.asReadonly();

  productCount = computed(() => this._products().length);
  
  hasProducts = computed(() => this._products().length > 0);

  constructor(private http: HttpClient) {}
  loadProducts(category?: string) {
    this._loading.set(true);
    this._error.set(null);

    const url = category ? `${this.API}?category=${encodeURIComponent(category)}` : this.API;

    return this.http.get<ApiResponse<Product[]>>(url).pipe(
      tap(response => {
        if (response.success) {
          this._products.set(response.data);
        }
        this._loading.set(false);
      }),
     
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.error?.message || 'Failed to load products');
        return throwError(() => error);
      })
    );
  }

  loadProduct(id: string) {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ApiResponse<ProductDetail>>(`${this.API}/${id}`).pipe(
      tap(response => {
        if (response.success) {
          this._selectedProduct.set(response.data);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.error?.message || 'Failed to load product');
        return throwError(() => error);
      })
    );
  }

  loadCategories() {
    return this.http.get<ApiResponse<string[]>>(`${this.API}/categories`).pipe(
      tap(response => {
        if (response.success) {
          this._categories.set(response.data);
        }
      }),
      catchError(error => {
        console.error('Failed to load categories:', error);
        return throwError(() => error);
      })
    );
  }


  clearSelectedProduct() {
    this._selectedProduct.set(null);
  }

  clearProducts() {
    this._products.set([]);
    this._error.set(null);
  }
}