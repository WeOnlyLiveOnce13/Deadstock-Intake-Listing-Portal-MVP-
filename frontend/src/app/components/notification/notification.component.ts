import { Component } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  templateUrl: './notification.component.html',
})
export class NotificationComponent {
  constructor(public notificationService: NotificationService) {}

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info',
    };
    return icons[type] || 'fa-circle-info';
  }

  getBgClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };
    return classes[type] || 'bg-gray-500';
  }

  getBorderClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'border-green-600',
      error: 'border-red-600',
      warning: 'border-yellow-600',
      info: 'border-blue-600',
    };
    return classes[type] || 'border-gray-600';
  }
}