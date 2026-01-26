import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { InventoryItem, CreateItemRequest, ApiResponse, BulkUploadResult, BulkOperationResult } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly API = `${environment.apiUrl}/inventory`;

  private _items = signal<InventoryItem[]>([]);
  private _loading = signal(false);
  private _selectedIds = signal<Set<string>>(new Set());

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();
  selectedIds = this._selectedIds.asReadonly();

  stats = computed(() => {
    const items = this._items();
    return {
      draft: items.filter(i => i.status === 'DRAFT').length,
      priced: items.filter(i => i.status === 'PRICED').length,
      listed: items.filter(i => i.status === 'LISTED').length,
      totalValue: items.reduce((sum, i) => sum + (i.resalePrice * i.quantity), 0),
    };
  });

  selectedItems = computed(() => {
    const ids = this._selectedIds();
    return this._items().filter(i => ids.has(i.id));
  });

  constructor(private http: HttpClient) {}

  loadItems(statuses?: string[]) {
    this._loading.set(true);
    const url = statuses?.length ? `${this.API}?status=${statuses.join(',')}` : this.API;
    return this.http.get<ApiResponse<InventoryItem[]>>(url).pipe(
      tap(res => {
        this._items.set(res.data);
        this._loading.set(false);
      })
    );
  }

  create(data: CreateItemRequest) {
    return this.http.post<ApiResponse<InventoryItem>>(this.API, data).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => [res.data, ...items]);
        }
      })
    );
  }

  update(id: string, data: Partial<CreateItemRequest>) {
    return this.http.put<ApiResponse<InventoryItem>>(`${this.API}/${id}`, data).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => items.map(i => i.id === id ? res.data : i));
        }
      })
    );
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => items.filter(i => i.id !== id));
          this._selectedIds.update(ids => { ids.delete(id); return new Set(ids); });
        }
      })
    );
  }

  bulkUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResult>(`${this.API}/bulk-upload`, formData);
  }

  autoPrice(id: string) {
    return this.http.post<ApiResponse<InventoryItem>>(`${this.API}/${id}/auto-price`, {}).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => items.map(i => i.id === id ? res.data : i));
        }
      })
    );
  }

  autoPriceBulk(ids: string[]) {
    return this.http.post<ApiResponse<BulkOperationResult>>(`${this.API}/auto-price-bulk`, { ids }).pipe(
      tap(res => {
        if (res.success) {
          const updated = new Map(res.data.items.map(i => [i.id, i]));
          this._items.update(items => items.map(i => updated.get(i.id) ?? i));
        }
      })
    );
  }

  setPrice(id: string, resalePrice: number) {
    return this.http.post<ApiResponse<InventoryItem>>(`${this.API}/${id}/set-price`, { resale_price: resalePrice }).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => items.map(i => i.id === id ? res.data : i));
        }
      })
    );
  }

  listItem(id: string) {
    return this.http.post<ApiResponse<InventoryItem>>(`${this.API}/${id}/list`, {}).pipe(
      tap(res => {
        if (res.success) {
          this._items.update(items => items.map(i => i.id === id ? res.data : i));
        }
      })
    );
  }

  listBulk(ids: string[]) {
    return this.http.post<ApiResponse<BulkOperationResult>>(`${this.API}/list-bulk`, { ids }).pipe(
      tap(res => {
        if (res.success) {
          const updated = new Map(res.data.items.map(i => [i.id, i]));
          this._items.update(items => items.map(i => updated.get(i.id) ?? i));
        }
      })
    );
  }

  toggleSelection(id: string) {
    this._selectedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return newIds;
    });
  }

  selectAll() {
    this._selectedIds.set(new Set(this._items().map(i => i.id)));
  }

  clearSelection() {
    this._selectedIds.set(new Set());
  }
}
