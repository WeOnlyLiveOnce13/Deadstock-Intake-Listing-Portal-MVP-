import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { CATEGORIES, CONDITIONS, CURRENCIES } from '../../models';

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-item-modal.component.html',
})
export class AddItemModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  categories = CATEGORIES;
  conditions = CONDITIONS;
  currencies = CURRENCIES;

  loading = signal(false);
  error = signal('');

  form = {
    merchant_id: '',
    sku: '',
    title: '',
    brand: '',
    category: '',
    condition: '',
    original_price: 0,
    currency: 'ZAR',
    quantity: 1,
  };

  constructor(private inventory: InventoryService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');

    this.inventory.create(this.form).subscribe({
      next: () => {
        this.saved.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.error?.errors?.join(', ') || 'Failed to add item');
      },
    });
  }
}
