import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-notification-bell',
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

        <!-- Panel Header -->
        <div class="panel-header">
          <div class="header-left">
            <span class="panel-title">Notifications</span>
            <span class="unread-pill" *ngIf="unreadCount > 0">{{ unreadCount }} new</span>
          </div>
          <div class="header-actions">
            <button class="hdr-btn" (click)="markAllRead()" *ngIf="unreadCount > 0" title="Mark all as read">
              ✓ All read
            </button>
            <button class="hdr-btn danger" (click)="clearAll()" *ngIf="notifications.length > 0" title="Clear all">
              🗑
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs" *ngIf="notifications.length > 0">
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'all'"
            (click)="activeFilter = 'all'"
          >All</button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'unread'"
            (click)="activeFilter = 'unread'"
          >Unread <span *ngIf="unreadCount > 0" class="tab-count">{{ unreadCount }}</span></button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'error'"
            (click)="activeFilter = 'error'"
          >🔴 Critical</button>
        </div>

        <!-- Notifications List -->
        <div class="notif-list">

          <ng-container *ngFor="let notif of filteredNotifications; trackBy: trackById">
            <div
              class="notif-item"
              [class.unread]="!notif.read"
              [class.type-error]="notif.type === 'error'"
              [class.type-warning]="notif.type === 'warning'"
              [class.type-success]="notif.type === 'success'"
              (click)="onNotificationClick(notif)"
            >
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
  <span class="notif-ticket" *ngIf="notif.ticketNumber">
    {{ notif.ticketNumber }}
  </span>
  <span class="notif-ticket job-order-ticket" *ngIf="notif.jobOrderNumber" style="background: #e8f0ff; color: #0a3a8c;">
    JO: {{ notif.jobOrderNumber }}
  </span>
</div>
              </div>
              <button
                class="dismiss-btn"
                (click)="dismissNotification($event, notif.id)"
                title="Dismiss"
              >✕</button>
            </div>
          </ng-container>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="filteredNotifications.length === 0">
            <span class="empty-icon">{{ activeFilter === 'unread' ? '✅' : '📭' }}</span>
            <p class="empty-title">
              {{ activeFilter === 'unread' ? 'All caught up!' : 'No notifications' }}
            </p>
            <p class="empty-sub">
              {{ activeFilter === 'unread' ? 'No unread notifications.' : 'New alerts will appear here.' }}
            </p>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="panel-footer" *ngIf="notifications.length > visibleLimit">
          <button class="footer-btn" (click)="showMore()">
            Show {{ notifications.length - visibleLimit }} more
          </button>
        </div>
<!-- Clear Confirmation Modal (inside the dropdown) -->
<div class="clear-confirm-overlay" *ngIf="showClearConfirm" (click)="$event.stopPropagation()">
  <div class="clear-confirm-box">
    <span class="clear-confirm-icon">🗑️</span>
    <p class="clear-confirm-text">Clear all notifications?</p>
    <p class="clear-confirm-sub">This action cannot be undone.</p>
    <div class="clear-confirm-actions">
      <button class="confirm-btn cancel" (click)="cancelClearAll()">Cancel</button>
      <button class="confirm-btn delete" (click)="confirmClearAll()">Clear All</button>
    </div>
  </div>
</div>
      </div>
    </div>
    
  `,
  styles: [`
    .notif-container {
      position: relative;
      display: inline-block;
    }

    /* ── Bell Button ─────────────────────────── */
    .bell-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      border-radius: 3px;
      cursor: pointer;
      padding: 4px 9px;
      position: relative;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s;
    }
    .bell-btn:hover    { background: #dde8f5; border-color: #7a9fbf; }
    .bell-btn.open     { background: #dde8f5; border-color: #0a246a; }
    .bell-btn.has-unread {
      background: #e8f0ff;
      border-color: #4f8ef7;
    }

    .bell-icon { font-size: 14px; display: block; }
    .bell-icon.wiggle {
      animation: wiggle 0.5s ease-in-out;
    }
    @keyframes wiggle {
      0%,100% { transform: rotate(0); }
      20%      { transform: rotate(-20deg); }
      40%      { transform: rotate(20deg); }
      60%      { transform: rotate(-12deg); }
      80%      { transform: rotate(8deg); }
    }

    .badge {
      position: absolute;
      top: -4px; right: -4px;
      background: #cc0000;
      color: white;
      font-size: 9px;
      font-weight: bold;
      padding: 1px 4px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
      line-height: 1.4;
      border: 1px solid white;
    }

    /* ── Panel ───────────────────────────────── */
    .notif-panel {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 340px;
      background: white;
      border: 1px solid #b0b0b0;
      box-shadow: 3px 4px 12px rgba(0,0,0,0.2);
      z-index: 600;
      display: flex;
      flex-direction: column;
      max-height: 520px;
    }

    /* ── Panel Header ────────────────────────── */
    .panel-header {
      padding: 10px 12px 8px;
      background: #0a246a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .header-left  { display: flex; align-items: center; gap: 8px; }
    .panel-title  { font-weight: bold; font-size: 12px; color: white; }
    .unread-pill  {
      background: #cc0000; color: white;
      font-size: 9px; padding: 1px 6px;
      border-radius: 10px; font-weight: bold;
    }
    .header-actions { display: flex; gap: 6px; }
    .hdr-btn {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white; font-size: 10px;
      padding: 3px 8px; cursor: pointer;
      border-radius: 2px;
    }
    .hdr-btn:hover { background: rgba(255,255,255,0.25); }
    .hdr-btn.danger:hover { background: rgba(204,0,0,0.5); border-color: #ff8888; }

    /* ── Filter Tabs ─────────────────────────── */
    .filter-tabs {
      display: flex;
      border-bottom: 1px solid #d8d8d8;
      background: #f5f5f5;
      flex-shrink: 0;
    }
    .filter-tab {
      flex: 1; padding: 7px 4px;
      background: none; border: none;
      cursor: pointer; font-size: 11px;
      color: #555; border-bottom: 2px solid transparent;
      display: flex; align-items: center; justify-content: center; gap: 4px;
    }
    .filter-tab:hover   { background: #eaeaea; }
    .filter-tab.active  { color: #0a246a; font-weight: bold; border-bottom-color: #0a246a; background: white; }
    .tab-count {
      background: #cc0000; color: white;
      font-size: 9px; padding: 0 4px; border-radius: 8px;
    }

    /* ── Notifications List ──────────────────── */
    .notif-list {
      overflow-y: auto;
      flex: 1;
      max-height: 380px;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 0;
      padding: 10px 12px 10px 0;
      border-bottom: 1px solid #ebebeb;
      cursor: pointer;
      position: relative;
      transition: background 0.1s;
      background: white;
    }
    .notif-item:hover { background: #f5f8ff; }
    .notif-item.unread { background: #f0f4ff; }
    .notif-item:last-child { border-bottom: none; }

    /* colored left bar */
    .notif-type-bar {
      width: 3px; min-width: 3px;
      align-self: stretch;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .bar-info    { background: #4f8ef7; }
    .bar-success { background: #008800; }
    .bar-warning { background: #cc7700; }
    .bar-error   { background: #cc0000; }

    /* Type-specific item backgrounds */
    .notif-item.type-error.unread   { background: #fff5f5; }
    .notif-item.type-warning.unread { background: #fffbf0; }
    .notif-item.type-success.unread { background: #f0fff0; }

    .notif-icon-wrap {
      position: relative;
      margin-right: 10px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .notif-icon { font-size: 15px; display: block; }
    .unread-dot {
      position: absolute;
      top: -2px; right: -3px;
      width: 7px; height: 7px;
      background: #cc0000;
      border-radius: 50%;
      border: 1px solid white;
    }

    .notif-body { flex: 1; min-width: 0; }
    .notif-title {
      font-size: 11px; font-weight: bold;
      color: #111; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-item.unread .notif-title { color: #0a246a; }
    .notif-message {
      font-size: 11px; color: #444;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .notif-meta {
      margin-top: 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .notif-time   { font-size: 10px; color: #888; }
    .notif-ticket {
      font-size: 9px;
      background: #e8eef8; color: #0a246a;
      padding: 1px 5px; border-radius: 3px; font-weight: bold;
    }

    .dismiss-btn {
      background: none; border: none;
      cursor: pointer; color: #aaa;
      font-size: 11px; padding: 2px 6px;
      flex-shrink: 0; opacity: 0;
      margin-top: 1px;
    }
    .notif-item:hover .dismiss-btn { opacity: 1; }
    .dismiss-btn:hover { color: #cc0000; background: #ffecec; }

    /* ── Empty State ─────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 36px 20px;
      color: #888;
    }
    .empty-icon  { font-size: 36px; display: block; margin-bottom: 10px; }
    .empty-title { font-size: 12px; font-weight: bold; color: #555; margin: 0 0 4px 0; }
    .empty-sub   { font-size: 11px; color: #999; margin: 0; }

    /* ── Panel Footer ────────────────────────── */
    .panel-footer {
      border-top: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      flex-shrink: 0;
      background: #fafafa;
    }
    .footer-btn {
      background: none; border: none;
      cursor: pointer; font-size: 11px; color: #0a246a;
      padding: 4px 12px; width: 100%;
    }
    .footer-btn:hover { background: #eef3ff; }
    /* ── Clear Confirmation ──────────────────── */
.clear-confirm-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 0;
}
.clear-confirm-box {
  text-align: center;
  padding: 24px;
}
.clear-confirm-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}
.clear-confirm-text {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  margin: 0 0 6px;
}
.clear-confirm-sub {
  font-size: 11px;
  color: #888;
  margin: 0 0 20px;
}
.clear-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.confirm-btn {
  padding: 6px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid #a0a0a0;
}
.confirm-btn.cancel {
  background: #f0f0f0;
  color: #333;
}
.confirm-btn.cancel:hover {
  background: #e0e0e0;
}
.confirm-btn.delete {
  background: #cc0000;
  color: white;
  border-color: #cc0000;
}
.confirm-btn.delete:hover {
  background: #aa0000;
}
    /* Scrollbar */
    .notif-list::-webkit-scrollbar       { width: 6px; }
    .notif-list::-webkit-scrollbar-track { background: #f5f5f5; }
    .notif-list::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  showDropdown = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  activeFilter: 'all' | 'unread' | 'error' = 'all';
  visibleLimit = 20;
  wiggling = false;
  showClearConfirm = false;
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private isBrowser: boolean;
  private previousUnreadCount = 0;

 constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
) {
    this.isBrowser = isPlatformBrowser(this.platformId);
}

ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
        const userId = this.currentUserId;
        const userTable = this.getCurrentUserTable();
        const compositeId = userId ? `${userTable}_${userId}` : null;
        const isAdmin = userTable === 'users';
        
        console.log('🔔 Bell - User:', { userId, userTable, compositeId, isAdmin });
        
        const relevant = notifications.filter(n => {
            if (n.countInBadge === false) return false;
            if (n.read) return false; // Only count unread
            
            // ✅ Broadcast notifications (targetUserId = null) → ONLY for admin users
            if (n.targetUserId == null) {
                return isAdmin;
            }
            
            // ✅ String composite ID → check for exclude_ prefix
            if (typeof n.targetUserId === 'string') {
                // ✅ Exclude notifications meant for others
                if (n.targetUserId.startsWith('exclude_')) {
                    const excludeId = n.targetUserId.replace('exclude_', '');
                    return excludeId !== String(userId);  // Show if NOT the excluded user
                }
                return n.targetUserId === compositeId;
            }
            
            // ✅ Numeric ID → match with current user ID (only for admin table)
            if (typeof n.targetUserId === 'number') {
                return isAdmin && n.targetUserId === userId;
            }
            
            return false;
        });
        
        const newUnread = relevant.length;
        console.log('🔔 Bell - Unread count:', newUnread, 'of', notifications.length);
        
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
            if (!target.closest('.notif-container')) {
                this.showDropdown = false;
            }
        };
        document.addEventListener('click', this.clickOutsideHandler);
    }
}

get filteredNotifications(): Notification[] {
    const userId = this.currentUserId;
    const userTable = this.getCurrentUserTable();
    const compositeId = userId ? `${userTable}_${userId}` : null;
    const isAdmin = userTable === 'users';
    
    let list = this.notifications.filter(n => {
        // Skip notifications that shouldn't appear in the bell
        if (n.countInBadge === false) return false;
        
        // ✅ Broadcast notifications → ONLY for admin users
        if (n.targetUserId == null) {
            return isAdmin;
        }
        
        // ✅ String composite ID → exact match
        if (typeof n.targetUserId === 'string') {
    // ✅ Exclude notifications meant for others
    if (n.targetUserId.startsWith('exclude_')) {
        const excludeId = n.targetUserId.replace('exclude_', '');
        return excludeId !== String(userId);  // Show if NOT the excluded user
    }
    return n.targetUserId === compositeId;
}
        
        // ✅ Numeric ID → match with current user (only for admin table)
        if (typeof n.targetUserId === 'number') {
            return isAdmin && n.targetUserId === userId;
        }
        
        return false;
    });
    
    if (this.activeFilter === 'unread') list = list.filter(n => !n.read);
    if (this.activeFilter === 'error') list = list.filter(n => n.type === 'error' || n.type === 'warning');
    
    return list.slice(0, this.visibleLimit);
}
private get currentUserId(): number | undefined {
    return this.authService.getCurrentUser()?.id;
}

private getCurrentUserTable(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      // ✅ Check multiple possible fields for user table
      return user.user_table || user.userTable || user.table || 'new_user';
    } catch { return 'new_user'; }
}
  ngOnDestroy() {
    if (this.isBrowser && this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  }
@Output() viewAll = new EventEmitter<void>();
  @HostListener('document:keydown.escape')
  onEscape() { this.showDropdown = false; }

  trackById(_: number, n: Notification) { return n.id; }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.unreadCount > 0) {
      this.activeFilter = 'unread';
    }
  }

  triggerWiggle() {
    this.wiggling = false;
    setTimeout(() => { this.wiggling = true; }, 10);
    setTimeout(() => { this.wiggling = false; }, 600);
  }

  markAllRead() {
    this.notificationService.markAllAsRead();
    this.activeFilter = 'all';
  }

 clearAll() {
  this.showClearConfirm = true;
}

confirmClearAll() {
  this.notificationService.clearAll();
  this.showClearConfirm = false;
  this.showDropdown = false;
}

cancelClearAll() {
  this.showClearConfirm = false;
}

  dismissNotification(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.notificationService.dismissNotification(id);
  }

onNotificationClick(notification: Notification) {
    // ✅ Just mark as read, no navigation
    this.notificationService.markAsRead(notification.id);
    this.showDropdown = false;
}
  showMore() {
    this.visibleLimit += 20;
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      info:    'ℹ️',
      success: '✅',
      warning: '⚠️',
      error:   '🚨'
    };
    return icons[type] ?? '📢';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs    = now.getTime() - new Date(date).getTime();
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);

    if (diffMins  <  1)  return 'Just now';
    if (diffMins  < 60)  return `${diffMins}m ago`;
    if (diffHours < 24)  return `${diffHours}h ago`;
    if (diffDays  <  7)  return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }
}