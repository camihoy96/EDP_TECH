import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ClientNotificationService } from '../../services/client-notification.service';
import type { ClientNotification } from '../../services/client-notification.service'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-container">
      <!-- Bell Button -->
      <button
        class="bell-btn"
        (click)="toggleDropdown($event); viewAll.emit()"
        [class.has-unread]="unreadCount > 0"
        [class.open]="showDropdown"
        title="Notifications ({{ unreadCount }} unread)"
      >
        <span class="bell-icon" [class.wiggle]="wiggling">🔔</span>
        <span class="badge" *ngIf="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div class="notif-panel" *ngIf="showDropdown" (click)="$event.stopPropagation()">

        <div class="panel-header">
          <div class="header-left">
            <span class="panel-title">My Notifications</span>
            <span class="unread-pill" *ngIf="unreadCount > 0">{{ unreadCount }} new</span>
          </div>
          <div class="header-actions">
            <button class="hdr-btn" (click)="markAllRead()" *ngIf="unreadCount > 0" title="Mark all as read">✓ All read</button>
            <button class="hdr-btn danger" (click)="clearAll()" *ngIf="notifications.length > 0" title="Clear all">🗑</button>
          </div>
        </div>

        <div class="filter-tabs" *ngIf="notifications.length > 0">
          <button class="filter-tab" [class.active]="activeFilter === 'all'" (click)="activeFilter = 'all'">All</button>
          <button class="filter-tab" [class.active]="activeFilter === 'unread'" (click)="activeFilter = 'unread'">
            Unread <span *ngIf="unreadCount > 0" class="tab-count">{{ unreadCount }}</span>
          </button>
        </div>

        <div class="notif-list">
          <ng-container *ngFor="let notif of filteredNotifications; trackBy: trackById">
            <div class="notif-item" [class.unread]="!notif.read"
                 [class.type-error]="notif.type === 'error'"
                 [class.type-warning]="notif.type === 'warning'"
                 [class.type-success]="notif.type === 'success'"
                 (click)="onNotificationClick(notif)">
              <div class="notif-type-bar" [class]="'bar-' + notif.type"></div>
              <div class="notif-icon-wrap">
                <span class="notif-icon">{{ getIcon(notif.type) }}</span>
                <span class="unread-dot" *ngIf="!notif.read"></span>
              </div>
              <div class="notif-body">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-message">{{ notif.message }}</div>
                <div class="notif-meta">
                  <span class="notif-time">{{ getTimeAgo(notif.timestamp) }}</span>
                  <span class="notif-ticket" *ngIf="notif.ticketNumber">{{ notif.ticketNumber }}</span>
                </div>
              </div>
              <button class="dismiss-btn" (click)="dismissNotification($event, notif.id)" title="Dismiss">✕</button>
            </div>
          </ng-container>

          <div class="empty-state" *ngIf="filteredNotifications.length === 0">
            <span class="empty-icon">{{ activeFilter === 'unread' ? '✅' : '📭' }}</span>
            <p class="empty-title">{{ activeFilter === 'unread' ? 'All caught up!' : 'No notifications' }}</p>
            <p class="empty-sub">{{ activeFilter === 'unread' ? 'No unread notifications.' : 'New alerts will appear here.' }}</p>
          </div>
        </div>

        <div class="panel-footer" *ngIf="notifications.length > visibleLimit">
          <button class="footer-btn" (click)="showMore()">Show {{ notifications.length - visibleLimit }} more</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-container { position: relative; display: inline-block; }
    .bell-btn {
      background: transparent; border: 1px solid #cbd5e1; border-radius: 8px;
      cursor: pointer; padding: 5px 9px; position: relative;
      display: flex; align-items: center; gap: 4px; transition: all 0.15s;
      color: #475569;
    }
    .bell-btn:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
    .bell-btn.open { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; }
    .bell-btn.has-unread { background: #eef2ff; border-color: #4f46e5; }
    .bell-icon { font-size: 15px; display: block; }
    .bell-icon.wiggle { animation: wiggle 0.5s ease-in-out; }
    @keyframes wiggle {
      0%,100% { transform: rotate(0); }
      20% { transform: rotate(-20deg); }
      40% { transform: rotate(20deg); }
      60% { transform: rotate(-12deg); }
      80% { transform: rotate(8deg); }
    }
    .badge {
      position: absolute; top: -5px; right: -5px;
      background: #ef4444; color: white;
      font-size: 9px; font-weight: 700; padding: 1px 5px;
      border-radius: 10px; min-width: 18px; text-align: center;
      line-height: 1.5; border: 2px solid white;
    }
    .notif-panel {
      position: absolute; top: calc(100% + 8px); right: 0; width: 340px;
      background: white; border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12); z-index: 600;
      display: flex; flex-direction: column; max-height: 480px;
      border-radius: 12px; overflow: hidden;
    }
    .panel-header {
      padding: 12px 14px 10px; background: #0f172a;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .panel-title { font-weight: 700; font-size: 12px; color: white; }
    .unread-pill { background: #ef4444; color: white; font-size: 9px; padding: 1px 6px; border-radius: 10px; font-weight: 700; }
    .header-actions { display: flex; gap: 6px; }
    .hdr-btn {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
      color: white; font-size: 9px; padding: 3px 8px; cursor: pointer; border-radius: 4px;
    }
    .hdr-btn:hover { background: rgba(255,255,255,0.2); }
    .hdr-btn.danger:hover { background: rgba(239,68,68,0.5); }
    .filter-tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
    .filter-tab {
      flex: 1; padding: 8px 4px; background: none; border: none;
      cursor: pointer; font-size: 11px; color: #64748b;
      display: flex; align-items: center; justify-content: center; gap: 4px;
      border-bottom: 2px solid transparent; transition: all 0.15s;
    }
    .filter-tab:hover { background: #f1f5f9; }
    .filter-tab.active { color: #4f46e5; font-weight: 600; border-bottom-color: #4f46e5; }
    .tab-count { background: #ef4444; color: white; font-size: 9px; padding: 0 5px; border-radius: 8px; }
    .notif-list { overflow-y: auto; flex: 1; max-height: 360px; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 0;
      padding: 10px 12px 10px 0; border-bottom: 1px solid #f1f5f9;
      cursor: pointer; position: relative; transition: background 0.1s; background: white;
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: #eef2ff; }
    .notif-item:last-child { border-bottom: none; }
    .notif-type-bar { width: 3px; min-width: 3px; align-self: stretch; margin-right: 10px; flex-shrink: 0; }
    .bar-info { background: #3b82f6; }
    .bar-success { background: #22c55e; }
    .bar-warning { background: #f59e0b; }
    .bar-error { background: #ef4444; }
    .notif-item.type-error.unread { background: #fef2f2; }
    .notif-item.type-warning.unread { background: #fffbeb; }
    .notif-item.type-success.unread { background: #f0fdf4; }
    .notif-icon-wrap { position: relative; margin-right: 10px; flex-shrink: 0; margin-top: 1px; }
    .notif-icon { font-size: 15px; display: block; }
    .unread-dot { position: absolute; top: -2px; right: -3px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1px solid white; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 11px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
    .notif-item.unread .notif-title { color: #4f46e5; }
    .notif-message { font-size: 11px; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-meta { margin-top: 4px; display: flex; align-items: center; gap: 8px; }
    .notif-time { font-size: 10px; color: #94a3b8; }
    .notif-ticket { font-size: 9px; background: #eef2ff; color: #4f46e5; padding: 1px 5px; border-radius: 4px; font-weight: 700; }
    .dismiss-btn { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 11px; padding: 2px 6px; flex-shrink: 0; opacity: 0; margin-top: 1px; }
    .notif-item:hover .dismiss-btn { opacity: 1; }
    .dismiss-btn:hover { color: #ef4444; background: #fef2f2; border-radius: 4px; }
    .empty-state { text-align: center; padding: 36px 20px; color: #94a3b8; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 10px; }
    .empty-title { font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 4px 0; }
    .empty-sub { font-size: 11px; color: #94a3b8; margin: 0; }
    .panel-footer { border-top: 1px solid #e2e8f0; padding: 8px; text-align: center; flex-shrink: 0; background: #fafafa; }
    .footer-btn { background: none; border: none; cursor: pointer; font-size: 11px; color: #4f46e5; padding: 4px 12px; width: 100%; }
    .footer-btn:hover { background: #eef2ff; }
    .notif-list::-webkit-scrollbar { width: 5px; }
    .notif-list::-webkit-scrollbar-track { background: #f1f5f9; }
    .notif-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ClientNotificationBellComponent implements OnInit, OnDestroy {
  showDropdown = false;
  notifications: ClientNotification[] = [];
  unreadCount = 0;
  activeFilter: 'all' | 'unread' | 'error' = 'all';
  visibleLimit = 20;
  wiggling = false;
  
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private isBrowser: boolean;
  private previousUnreadCount = 0;

  constructor(
     private clientNotificationService: ClientNotificationService, 
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

ngOnInit() {
  this.clientNotificationService.notifications$.subscribe(notifications => {
    const unread = notifications.filter(n => !n.read);
    const newUnread = unread.length;
    
    if (newUnread > this.previousUnreadCount && this.previousUnreadCount >= 0) {
      this.triggerWiggle();
    }
    this.previousUnreadCount = newUnread;
    this.notifications = notifications;
    this.unreadCount = newUnread;
  });
    if (this.isBrowser) {
      this.clickOutsideHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.notif-container')) { this.showDropdown = false; }
      };
      document.addEventListener('click', this.clickOutsideHandler);
    }
  }

get filteredNotifications(): ClientNotification[] {
  let list = this.notifications;
  if (this.activeFilter === 'unread') list = list.filter(n => !n.read);
  if (this.activeFilter === 'error') list = list.filter(n => n.type === 'error' || n.type === 'warning');
  return list.slice(0, this.visibleLimit);
}

  ngOnDestroy() {
    if (this.isBrowser && this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  }

  @Output() viewAll = new EventEmitter<void>();
  
  @HostListener('document:keydown.escape')
  onEscape() { this.showDropdown = false; }

  trackById(_: number, n: ClientNotification) { return n.id; }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.unreadCount > 0) { this.activeFilter = 'unread'; }
  }

  triggerWiggle() {
    this.wiggling = false;
    setTimeout(() => { this.wiggling = true; }, 10);
    setTimeout(() => { this.wiggling = false; }, 600);
  }

markAllRead() { this.clientNotificationService.markAllAsRead(); }

 clearAll() {
  if (confirm('Clear all notifications?')) {
    this.clientNotificationService.clearAll();
    // Also clear ticket notifications from localStorage
    localStorage.removeItem('client_ticket_notifications');
    this.showDropdown = false;
  }
}

  dismissNotification(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.clientNotificationService.dismissNotification(id);
  }

 onNotificationClick(notification: ClientNotification) {
    this.clientNotificationService.markAsRead(notification.id);
    if (notification.ticketId) {
      this.router.navigate(['/client/tickets', notification.ticketId]);
    } else if (notification.ticketNumber && notification.title?.includes('Requisition')) {
      // Navigate to requisitions page for requisition notifications
      this.router.navigate(['/client/request']);
    }
    this.showDropdown = false;
}
  showMore() { this.visibleLimit += 20; }

  getIcon(type: string): string {
    const icons: Record<string, string> = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '🚨' };
    return icons[type] ?? '📢';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }
}