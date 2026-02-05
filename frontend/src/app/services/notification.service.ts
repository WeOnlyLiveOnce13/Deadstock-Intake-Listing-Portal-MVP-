import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration: number; // ms, 0 = persistent
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  
  private readonly DEFAULT_DURATION = 5000;
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();

  success(title: string, message: string, duration = this.DEFAULT_DURATION): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 7000): void {
    this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message: string, duration = this.DEFAULT_DURATION): void {
    this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message: string, duration = this.DEFAULT_DURATION): void {
    this.show({ type: 'warning', title, message, duration });
  }

  dismiss(id: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  dismissAll(): void {
    this._notifications.set([]);
  }

  private show(options: {
    type: NotificationType;
    title: string;
    message: string;
    duration: number;
  }): void {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration,
      createdAt: new Date(),
    };

    // Add to notifications array
    this._notifications.update(notifications => [...notifications, notification]);

    // Auto-dismiss after duration (if duration > 0)
    if (options.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, options.duration);
    }
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}