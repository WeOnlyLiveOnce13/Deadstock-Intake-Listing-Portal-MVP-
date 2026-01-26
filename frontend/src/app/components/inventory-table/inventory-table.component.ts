import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import type { InventoryItem } from '../../models';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [DecimalPipe, ConfirmModalComponent],
  templateUrl: './inventory-table.component.html',
})
export class InventoryTableComponent {
  @Output() onSetPrice = new EventEmitter<InventoryItem>();
  @Output() onRefresh = new EventEmitter<void>();

  deleteTarget = signal<InventoryItem | null>(null);
  deleteBulkCount = signal<number>(0);

  constructor(public inventory: InventoryService) {}

  allSelected = computed(() => {
    const items = this.inventory.items();
    const selected = this.inventory.selectedIds();
    return items.length > 0 && items.every(i => selected.has(i.id));
  });

  toggleAll() {
    if (this.allSelected()) {
      this.inventory.clearSelection();
    } else {
      this.inventory.selectAll();
    }
  }

  getStatusClass(status: string) {
    const base = 'badge';
    switch (status) {
      case 'DRAFT': return `${base} badge-draft`;
      case 'PRICED': return `${base} badge-priced`;
      case 'LISTED': return `${base} badge-listed`;
      default: return base;
    }
  }

  formatCondition(condition: string) {
    return condition.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  autoPrice(item: InventoryItem) {
    this.inventory.autoPrice(item.id).subscribe();
  }

  listItem(item: InventoryItem) {
    this.inventory.listItem(item.id).subscribe();
  }

  confirmDeleteItem(item: InventoryItem) {
    this.deleteTarget.set(item);
  }

  deleteItem() {
    const item = this.deleteTarget();
    if (item) {
      this.inventory.delete(item.id).subscribe();
      this.deleteTarget.set(null);
    }
  }

  cancelDelete() {
    this.deleteTarget.set(null);
    this.deleteBulkCount.set(0);
  }

  priceSelected() {
    const ids = Array.from(this.inventory.selectedIds());
    if (ids.length === 0) return;
    this.inventory.autoPriceBulk(ids).subscribe(() => {
      this.inventory.clearSelection();
      this.onRefresh.emit();
    });
  }

  listSelected() {
    const ids = Array.from(this.inventory.selectedIds());
    if (ids.length === 0) return;
    this.inventory.listBulk(ids).subscribe(() => {
      this.inventory.clearSelection();
      this.onRefresh.emit();
    });
  }

  confirmDeleteSelected() {
    const count = this.inventory.selectedIds().size;
    if (count > 0) {
      this.deleteBulkCount.set(count);
    }
  }

  deleteSelected() {
    const ids = Array.from(this.inventory.selectedIds());
    ids.forEach(id => this.inventory.delete(id).subscribe());
    this.deleteBulkCount.set(0);
    this.inventory.clearSelection();
  }

  getDeleteMessage(): string {
    const item = this.deleteTarget();
    if (!item) return '';
    return `Are you sure you want to delete "${item.title}"? This action cannot be undone.`;
  }

  getBulkDeleteMessage(): string {
    return `Are you sure you want to delete ${this.deleteBulkCount()} items? This action cannot be undone.`;
  }
}
