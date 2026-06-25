import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();
  private pendingOperations: any[] = [];

  constructor() {
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
    this.loadPendingOperations();
  }

  private updateOnlineStatus(status: boolean): void {
    this.isOnlineSubject.next(status);
    if (status) {
      this.syncPendingOperations();
    }
  }

  private loadPendingOperations(): void {
    const stored = localStorage.getItem('pending_operations');
    if (stored) {
      this.pendingOperations = JSON.parse(stored);
    }
  }

  private savePendingOperations(): void {
    localStorage.setItem('pending_operations', JSON.stringify(this.pendingOperations));
  }

  addPendingOperation(operation: any): void {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    this.savePendingOperations();
  }

  private syncPendingOperations(): void {
    if (this.pendingOperations.length > 0) {
      console.log(`Syncing ${this.pendingOperations.length} pending operations...`);
      // Process each pending operation
      this.pendingOperations = [];
      this.savePendingOperations();
    }
  }

  getPendingCount(): number {
    return this.pendingOperations.length;
  }
}