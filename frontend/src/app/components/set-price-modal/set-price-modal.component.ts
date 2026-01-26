import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import type { InventoryItem } from '../../models';

@Component({
  selector: 'app-set-price-modal',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './set-price-modal.component.html',
})
export class SetPriceModalComponent {
  @Input({ required: true }) item!: InventoryItem;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  customPrice = 0;
  loading = signal(false);
  error = signal('');

  constructor(private inventory: InventoryService) {}

  ngOnInit() {
    this.customPrice = this.item.resalePrice;
  }

  getCost() {
    // Simplified - in reality would be based on condition/category
    return Math.round(this.item.originalPrice * 0.5);
  }

  getMargin() {
    const cost = this.getCost();
    if (this.customPrice <= 0) return 0;
    return Math.round(((this.customPrice - cost) / this.customPrice) * 100);
  }

  submit() {
    this.loading.set(true);
    this.error.set('');

    this.inventory.setPrice(this.item.id, this.customPrice).subscribe({
      next: () => {
        this.saved.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to set price');
      },
    });
  }
}
