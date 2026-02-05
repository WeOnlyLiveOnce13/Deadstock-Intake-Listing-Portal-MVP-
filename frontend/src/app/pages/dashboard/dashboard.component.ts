import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { InventoryService } from '../../services/inventory.service';
import { InventoryTableComponent } from '../../components/inventory-table/inventory-table.component';
import { AddItemModalComponent } from '../../components/add-item-modal/add-item-modal.component';
import { UploadModalComponent } from '../../components/upload-modal/upload-modal.component';
import { SetPriceModalComponent } from '../../components/set-price-modal/set-price-modal.component';
import type { InventoryItem } from '../../models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    InventoryTableComponent,
    AddItemModalComponent,
    UploadModalComponent,
    SetPriceModalComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  showAddModal = false;
  showUploadModal = false;
  priceItem: InventoryItem | null = null;
  filterStatuses: string[] = [];

  constructor(
    public auth: AuthService,
    public inventory: InventoryService,
  private router: Router
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.inventory.loadItems(this.filterStatuses.length ? this.filterStatuses : undefined).subscribe();
  }

  toggleFilter(status: string) {
    const index = this.filterStatuses.indexOf(status);
    if (index === -1) {
      this.filterStatuses = [...this.filterStatuses, status];
    } else {
      this.filterStatuses = this.filterStatuses.filter(s => s !== status);
    }
    this.loadItems();
  }

  clearFilters() {
    this.filterStatuses = [];
    this.loadItems();
  }

  isFilterActive(status: string): boolean {
    return this.filterStatuses.includes(status);
  }

  openSetPrice(item: InventoryItem) {
    this.priceItem = item;
  }

  priceAllDraft() {
    const draftIds = this.inventory.items()
      .filter(i => i.status === 'DRAFT')
      .map(i => i.id);
    if (draftIds.length) {
      this.inventory.autoPriceBulk(draftIds).subscribe(() => {
        // Reload to update stats and handle filtered views
        this.loadItems();
      });
    }
  }

  listAllPriced() {
    const pricedIds = this.inventory.items()
      .filter(i => i.status === 'PRICED')
      .map(i => i.id);
    if (pricedIds.length) {
      this.inventory.listBulk(pricedIds).subscribe(() => {
        // Reload to update stats and handle filtered views
        this.loadItems();
      });
    }
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }
}
