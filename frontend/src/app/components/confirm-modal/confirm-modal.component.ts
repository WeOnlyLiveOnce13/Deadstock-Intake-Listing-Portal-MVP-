import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Delete';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconClass(): string {
    switch (this.type) {
      case 'danger': return 'fa-solid fa-trash text-red-600';
      case 'warning': return 'fa-solid fa-triangle-exclamation text-yellow-600';
      case 'info': return 'fa-solid fa-circle-info text-blue-600';
    }
  }

  get bgClass(): string {
    switch (this.type) {
      case 'danger': return 'bg-red-100';
      case 'warning': return 'bg-yellow-100';
      case 'info': return 'bg-blue-100';
    }
  }

  get confirmBtnClass(): string {
    switch (this.type) {
      case 'danger': return 'btn btn-danger';
      case 'warning': return 'btn btn-warning';
      case 'info': return 'btn btn-primary';
    }
  }
}
