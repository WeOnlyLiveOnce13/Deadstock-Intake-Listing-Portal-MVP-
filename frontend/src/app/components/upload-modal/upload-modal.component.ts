import { Component, EventEmitter, Output, signal } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import type { BulkUploadResult, BulkUploadError } from '../../models';

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [],
  templateUrl: './upload-modal.component.html',
})
export class UploadModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<void>();

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal('');
  result = signal<BulkUploadResult | null>(null);
  isDragging = false;

  constructor(private inventory: InventoryService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile.set(file);
      this.error.set('');
    } else {
      this.error.set('Please select a CSV file');
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.error.set('');
    }
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.error.set('');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  upload() {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.error.set('');

    this.inventory.bulkUpload(file).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success) {
          // Handle header errors or empty file
          this.error.set(res.error || 'Upload failed');
        } else {
          // Show result modal
          this.result.set(res);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.error?.error || 'Upload failed');
      },
    });
  }

  onDone() {
    this.uploaded.emit();
    this.close.emit();
  }

  getTotalErrors(): number {
    const res = this.result();
    if (!res?.errors) return 0;
    return (
      res.errors.invalid.length +
      res.errors.duplicatesInFile.length +
      res.errors.duplicatesInDb.length
    );
  }

  getAllErrors(): BulkUploadError[] {
    const res = this.result();
    if (!res?.errors) return [];
    return [
      ...res.errors.invalid,
      ...res.errors.duplicatesInFile,
      ...res.errors.duplicatesInDb,
    ].sort((a, b) => a.rowNumber - b.rowNumber);
  }
}
