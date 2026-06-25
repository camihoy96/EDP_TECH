import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Ticket } from './ticket.service';
import { environment } from '../../environments/environment';

export interface ClientNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  ticketId?: number;
  ticketNumber?: string;
  targetUserId?: number;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClientNotificationService {
  private notificationsSubject = new BehaviorSubject<ClientNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private ticketNotifications: ClientNotification[] = [];
  private readonly TICKET_NOTIF_KEY = 'client_ticket_notifications';
  private isBrowser: boolean;
  private toastContainer: HTMLElement | null = null;
  private currentUserId: number | null = null;
  private serverPolling: any;
  private shownToastIds: Set<string> = new Set();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.injectToastStyles();
      this.createToastContainer();
      this.loadCurrentUser();
      this.loadNotificationsFromStorage();
      this.loadNotificationsFromServer();
      this.serverPolling = setInterval(() => this.loadNotificationsFromServer(), 5000);
    }
  }

  // ── STORAGE ──────────────────────────────────────
  private getStorageKey(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = user.id || 'anonymous';
      return `client_notifications_${userId}`;
    } catch {
      return 'client_notifications_anonymous';
    }
  }

  private loadNotificationsFromStorage(): void {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: ClientNotification[] = JSON.parse(stored);
        parsed.forEach(n => {
          n.timestamp = new Date(n.timestamp);
          if (n.id.startsWith('srv_')) this.shownToastIds.add(n.id);
        });
        this.notificationsSubject.next(parsed);
      }
    } catch {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  private saveNotifications(notifications: ClientNotification[]): void {
    if (!this.isBrowser) return;
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(notifications));
    } catch {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(notifications.slice(0, 50)));
    }
  }
/**
 * Called when a new ticket is created - notifies all EDP/IT staff in the branch
 */
handleNewTicketForBranch(ticket: any, branchId: number): void {
  const key = `new-ticket-branch-${ticket.id}`;
  if (this.shownToastIds.has(key)) return;
  this.shownToastIds.add(key);

  // Save to server for ALL EDP/IT users in the branch
  this.saveBranchNotificationToServer(ticket, branchId);
  
  // ✅ Only add local notification and toast if the CURRENT user is EDP/IT staff
  if (this.isCurrentUserEDPIT()) {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title: '🆕 New Support Ticket',
      message: `New ticket #${ticket.ticket_number}: "${ticket.title}" from ${ticket.created_by_name}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      targetUserId: undefined,
      timestamp: new Date(),
      read: false,
    });

    this.showToastPopup(
      '🆕 New Support Ticket',
      `#${ticket.ticket_number}: "${ticket.title}" from ${ticket.created_by_name}`,
      ticket.id
    );
  }
}

// ✅ Add this helper method
private isCurrentUserEDPIT(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const dept = (user.department || user.department_name || '').toLowerCase();
    return dept === 'edp' || dept === 'it' || dept === 'edp/it' || 
           dept === 'it/edp' || dept.includes('edp') || dept.includes('it');
  } catch {
    return false;
  }
}

// Add this method
private saveBranchNotificationToServer(ticket: any, branchId: number): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;

  fetch(`${environment.apiUrl}/api/client-notifications/branch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch_id: branchId,
      type: 'info',
      title: '🆕 New Support Ticket',
      message: `New ticket #${ticket.ticket_number}: "${ticket.title}" from ${ticket.created_by_name}`,
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
    }),
  }).catch(err => console.log('⚠️ Failed to save branch notification:', err));
}

/**
 * Called when admin assigns ticket to EDP/IT agent(s)
 */
handleTicketAssignedToAgent(ticket: any, assignedByName: string, assignedAgentIds: number[]): void {
  assignedAgentIds.forEach(agentId => {
    const key = `assigned-agent-${ticket.id}-${agentId}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    const notif: ClientNotification = {
      id: this.generateId(),
      type: 'info',
      title: '📌 Ticket Assigned to You',
      message: `${assignedByName} assigned ticket #${ticket.ticket_number}: "${ticket.title}" to you`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      targetUserId: agentId,
      timestamp: new Date(),
      read: false,
    };

    // ✅ Save to SERVER for the target agent (so they get it via polling)
    this.saveToServer(notif);

    // ✅ Also add as a ticket notification (shared across all EDP/IT users in the branch)
    this.addTicketNotification({
      type: 'info',
      title: '📌 Ticket Assigned to You',
      message: `${assignedByName} assigned ticket #${ticket.ticket_number}: "${ticket.title}" to you`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      targetUserId: agentId
    });

    // ✅ Only add local notification/toast if current user IS the target agent
    if (this.currentUserId === agentId) {
      this.addLocalNotification(notif);
      this.showToastPopup(
        '📌 Ticket Assigned to You',
        `#${ticket.ticket_number}: "${ticket.title}"`,
        ticket.id
      );
    }
  });
}
/**
 * Add notification locally without saving to server (for when server save is handled separately)
 */
private addLocalNotification(notif: ClientNotification): void {
  const current = this.notificationsSubject.value;
  const isDuplicate = current.find(
    n => n.id === notif.id || 
    (n.title === notif.title && n.message === notif.message && n.ticketId === notif.ticketId)
  );
  if (isDuplicate) return;

  const updated = [notif, ...current].slice(0, 100);
  this.notificationsSubject.next(updated);
  this.saveNotifications(updated);
}
/**
 * Handle status change - notify creator but NOT the agent who changed it
 */
handleStatusChangeForCreator(ticket: any, newStatus: string, changedByName: string, changedByUserId: number): void {
  const creatorUserId = ticket.created_by;
  
  // Don't notify if the creator is the one who changed it
  if (creatorUserId === changedByUserId) return;

  const key = `${newStatus}-${ticket.id}-creator`;
  if (this.shownToastIds.has(key)) return;
  this.shownToastIds.add(key);

  const statusLabel = newStatus.replace('_', ' ');
  
  const statusConfig: Record<string, { emoji: string; verb: string }> = {
    in_progress: { emoji: '⚙️', verb: 'started working on' },
    pending: { emoji: '⏳', verb: 'set as pending' },
    resolved: { emoji: '✅', verb: 'resolved' },
  };
  const config = statusConfig[newStatus] || { emoji: '📢', verb: 'updated' };

  const notif: ClientNotification = {
    id: this.generateId(),
    type: newStatus === 'resolved' ? 'success' : 'info',
    title: `${config.emoji} Ticket ${statusLabel}`,
    message: `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}: "${ticket.title}"`,
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    targetUserId: creatorUserId,
    timestamp: new Date(),
    read: false,
  };

  // ✅ Save to SERVER for the creator
  this.saveToServer(notif);

  // ✅ Only add local notification/toast if current user IS the creator
  if (this.currentUserId === creatorUserId) {
    this.addLocalNotification(notif);
    this.showToastPopup(
      `${config.emoji} Ticket ${statusLabel}`,
      `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}`,
      ticket.id
    );
  }
}
  // ── CURRENT USER ────────────────────────────────
  private loadCurrentUser(): void {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.currentUserId = user.id || null;
    } catch {
      this.currentUserId = null;
    }
  }

  updateCurrentUser(userId: number): void {
    this.currentUserId = userId;
  }
addTicketNotification(notification: Omit<ClientNotification, 'id' | 'timestamp' | 'read'>): void {
  const newNotif: ClientNotification = {
    id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date(),
    read: false,
    ...notification
  };
  
  this.ticketNotifications.unshift(newNotif);
  this.saveTicketNotifications();
  this.emitAllNotifications();
}

private saveTicketNotifications(): void {
  try {
    localStorage.setItem(this.TICKET_NOTIF_KEY, JSON.stringify(this.ticketNotifications));
  } catch (e) {}
}

private loadTicketNotifications(): void {
  try {
    const stored = localStorage.getItem(this.TICKET_NOTIF_KEY);
    if (stored) {
      this.ticketNotifications = JSON.parse(stored);
    }
  } catch (e) {
    this.ticketNotifications = [];
  }
}

// Override the emit to include ticket notifications
private emitAllNotifications(): void {
  // ✅ Use the current value from the subject
  const current = this.notificationsSubject.value;
  const allNotifs = [...this.ticketNotifications, ...current];
  this.notificationsSubject.next(allNotifs);
}

/**
 * Called when a new ticket is created
 */
handleNewTicket(ticket: any): void {
  this.addTicketNotification({
    type: 'info',
    title: 'New Ticket',
    message: `New ticket #${ticket.ticket_number}: ${ticket.title}`,
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number
  });
}
 // ── SERVER POLLING ──────────────────────────────
private loadNotificationsFromServer(): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || !this.currentUserId) {
    console.log('⚠️ loadNotificationsFromServer skipped:', { 
      hasToken: !!token, 
      currentUserId: this.currentUserId 
    });
    return;
  }

  console.log('🔍 Polling notifications for user:', this.currentUserId);

  fetch(`${environment.apiUrl}/api/client-notifications/${this.currentUserId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  })
  .then((data: any[]) => {
    console.log(`📥 Received ${data.length} server notifications for user ${this.currentUserId}`);
    
    if (!Array.isArray(data)) return;
    
    const current = this.notificationsSubject.value;
    const currentMap = new Map(current.map(n => [n.id, n]));
    const localNotifications = current.filter(n => !n.id.startsWith('srv_'));
    const serverNotifications: ClientNotification[] = [];
    
    data.forEach(n => {
      const srvId = 'srv_' + n.id;
      const existing = currentMap.get(srvId);
      if (existing) {
        existing.read = n.is_read === 1;
        serverNotifications.push(existing);
      } else {
        const localDuplicate = localNotifications.find(
          ln => ln.title === n.title && ln.message === n.message && ln.ticketId === n.ticket_id
        );
        if (localDuplicate) {
          localDuplicate.read = n.is_read === 1;
          serverNotifications.push(localDuplicate);
        } else {
          const newNotif: ClientNotification = {
            id: srvId,
            type: n.type || 'info',
            title: n.title,
            message: n.message,
            ticketId: n.ticket_id,
            ticketNumber: n.ticket_number,
            targetUserId: n.user_id,
            timestamp: new Date(n.created_at),
            read: n.is_read === 1,
          };
          serverNotifications.push(newNotif);
          
          console.log('🆕 New server notification:', newNotif.title, '->', newNotif.message);
          
          // ✅ Show toast for brand new server notifications
          const toastKey = `toast-${srvId}`;
          if (!this.shownToastIds.has(toastKey) && n.is_read === 0) {
            this.shownToastIds.add(toastKey);
            this.showToastPopup(
              newNotif.title,
              newNotif.message,
              newNotif.ticketId
            );
          }
        }
      }
    });

    const merged = [...serverNotifications, ...localNotifications];
    this.notificationsSubject.next(merged);
    this.saveNotifications(merged);
  })
  .catch((err) => {
    console.log('⚠️ Client notifications fetch failed:', err.message);
  });
}
  /** Called when admin assigns ticket to this client */
handleTicketAssigned(ticket: any, assignedByName: string, targetUserId?: number, assignedAgentNames?: string): void {
  const clientUserId = targetUserId || ticket.created_by;
  
  if (!clientUserId) {
    console.warn('⚠️ Cannot create notification: no target user ID');
    return;
  }

  const key = `assigned-creator-${ticket.id}-${clientUserId}`;
  if (this.shownToastIds.has(key)) return;
  this.shownToastIds.add(key);

  // ✅ Build the message with actual agent names
  const agentNames = assignedAgentNames || 'an agent';
  const message = `${assignedByName} assigned your ticket #${ticket.ticket_number} to ${agentNames}`;

  const notif: ClientNotification = {
    id: this.generateId(),
    type: 'info',
    title: '📌 Ticket Assigned',
    message: message,
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    targetUserId: clientUserId,
    timestamp: new Date(),
    read: false,
  };

  // Only save to server for the target user
  this.saveToServer(notif);

  // ✅ Only add local notification/toast if current user IS the target
  if (this.currentUserId === clientUserId) {
    this.addLocalNotification(notif);
    this.showToastPopup('📌 Ticket Assigned', `#${ticket.ticket_number}: "${ticket.title}"`, ticket.id);
  }
}
/** Called when admin changes status of client's ticket */
handleStatusChange(ticket: any, newStatus: string, changedByName: string, targetUserId?: number): void {
  const key = `${newStatus}-${ticket.id}`;
  if (this.shownToastIds.has(key)) return;
  this.shownToastIds.add(key);

  const clientUserId = targetUserId || ticket.created_by;
  
  if (!clientUserId) {
    console.warn('⚠️ Cannot create notification: no target user ID');
    return;
  }

  const statusLabel = newStatus.replace('_', ' ');
  
  // Also add as a ticket notification for the bell dropdown
  this.addTicketNotification({
    type: 'info',
    title: 'Status Updated',
    message: `Ticket #${ticket.ticket_number} status changed to ${statusLabel} by ${changedByName}`,
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number
  });

  const statusConfig: Record<string, { emoji: string; verb: string }> = {
    in_progress: { emoji: '⚙️', verb: 'started working on' },
    pending: { emoji: '⏳', verb: 'set as pending' },
    resolved: { emoji: '✅', verb: 'resolved' },
  };
  const config = statusConfig[newStatus] || { emoji: '📢', verb: 'updated' };

  const notif: ClientNotification = {
    id: this.generateId(),
    type: newStatus === 'resolved' ? 'success' : 'info',
    title: `${config.emoji} Ticket ${statusLabel}`,
    message: `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}: "${ticket.title}"`,
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    targetUserId: clientUserId,
    timestamp: new Date(),
    read: false,
  };

  this.addNotification(notif);

  if (this.currentUserId === clientUserId) {
    this.showToastPopup(
      `${config.emoji} Ticket ${statusLabel}`,
      `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}`,
      ticket.id
    );
  }
}
   private saveToServer(notif: ClientNotification): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || !notif.targetUserId) {
    console.log('⚠️ saveToServer skipped:', { 
      hasToken: !!token, 
      targetUserId: notif.targetUserId 
    });
    return;
  }

  console.log('📤 Saving notification to server:', {
    user_id: notif.targetUserId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    ticket_id: notif.ticketId
  });

  fetch(`${environment.apiUrl}/api/client-notifications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: notif.targetUserId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      ticket_id: notif.ticketId || null,
      ticket_number: notif.ticketNumber || null,
    }),
  })
  .then(res => res.json())
  .then(data => console.log('✅ Server notification saved:', data))
  .catch(err => console.log('⚠️ Failed to save notification to server:', err));
}
  // ── NOTIFICATION CRUD ───────────────────────────
 private addNotification(notif: ClientNotification): void {
  const current = this.notificationsSubject.value;
  const isDuplicate = current.find(
    n => n.id === notif.id || 
    (n.title === notif.title && n.message === notif.message && n.ticketId === notif.ticketId)
  );
  if (isDuplicate) return;

  const updated = [notif, ...current].slice(0, 100);
  this.notificationsSubject.next(updated);
  this.saveNotifications(updated);

  // ✅ Save to server with correct user_id
  this.saveToServer(notif);
}
  markAsRead(id: string): void {
    const current = this.notificationsSubject.value;
    const idx = current.findIndex(n => n.id === id);
    if (idx === -1) return;
    const updated = [...current];
    updated[idx] = { ...updated[idx], read: true };
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
  }

  markAllAsRead(): void {
    const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
  }

  dismissNotification(id: string): void {
    const updated = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && id.startsWith('srv_')) {
      const numericId = id.replace('srv_', '');
      fetch(`${environment.apiUrl}/api/client-notifications/${numericId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
  }
clearAll(): void {
  const current = this.notificationsSubject.value;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    current.forEach(n => {
      if (n.id.startsWith('srv_')) {
        const numericId = n.id.replace('srv_', '');
        fetch(`${environment.apiUrl}/api/client-notifications/${numericId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    });
  }
  // ✅ Also clear ticket notifications
  this.ticketNotifications = [];
  localStorage.removeItem(this.TICKET_NOTIF_KEY);
  
  this.notificationsSubject.next([]);
  localStorage.removeItem(this.getStorageKey());
}
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  // ── TOAST POPUP ─────────────────────────────────
  private showToastPopup(title: string, message: string, ticketId?: number): void {
    if (!this.isBrowser) return;
    if (!this.toastContainer) this.createToastContainer();
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'client-notif-toast';
    toast.style.position = 'relative';
    toast.innerHTML = `
      <div class="client-toast-accent info"></div>
      <span class="client-toast-icon">📢</span>
      <div class="client-toast-body">
        <div class="client-toast-title">${this.escapeHtml(title)}</div>
        <div class="client-toast-message">${this.escapeHtml(message)}</div>
        <div class="client-toast-time">Just now</div>
      </div>
      <button class="client-toast-close" title="Dismiss">✕</button>
      <div class="client-toast-progress"></div>
    `;

    this.toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.client-toast-close');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToast(toast);
    });

    if (ticketId) {
      toast.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('navigate-client-ticket', { detail: { ticketId } }));
        this.removeToast(toast);
      });
      toast.style.cursor = 'pointer';
    }

    const timer = setTimeout(() => this.removeToast(toast), 6000);
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      const progressBar = toast.querySelector('.client-toast-progress') as HTMLElement;
      if (progressBar) progressBar.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
      const progressBar = toast.querySelector('.client-toast-progress') as HTMLElement;
      if (progressBar) progressBar.style.animationPlayState = 'running';
      setTimeout(() => this.removeToast(toast), 2000);
    });
  }

  private removeToast(toast: HTMLElement): void {
    toast.classList.add('client-toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  // ── HELPERS ─────────────────────────────────────
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── TOAST STYLES ────────────────────────────────
  private injectToastStyles(): void {
    if (document.getElementById('client-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'client-toast-styles';
    style.textContent = `
      #client-toast-container {
        position: fixed; top: 16px; right: 16px;
        z-index: 9999; display: flex;
        flex-direction: column; gap: 8px;
        pointer-events: none;
      }
      .client-notif-toast {
        pointer-events: all;
        display: flex; align-items: flex-start; gap: 10px;
        padding: 0; width: 340px;
        background: white;
        border: 1px solid #b0b0b0;
        box-shadow: 3px 4px 14px rgba(0,0,0,0.22);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 11px; cursor: pointer;
        overflow: hidden;
        animation: client-toast-in .25s ease forwards;
      }
      .client-notif-toast.client-toast-out {
        animation: client-toast-out .2s ease forwards;
      }
      @keyframes client-toast-in {
        from { opacity: 0; transform: translateX(24px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes client-toast-out {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(24px); }
      }
      .client-toast-accent {
        width: 4px; min-width: 4px;
        align-self: stretch; flex-shrink: 0;
      }
      .client-toast-accent.info { background: #4f8ef7; }
      .client-toast-accent.success { background: #008800; }
      .client-toast-accent.warning { background: #cc7700; }
      .client-toast-accent.error { background: #cc0000; }
      .client-toast-body {
        flex: 1; padding: 10px 8px 10px 0; min-width: 0;
      }
      .client-toast-title {
        font-weight: bold; font-size: 11px; color: #111;
        margin-bottom: 3px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .client-toast-message {
        font-size: 11px; color: #444; line-height: 1.4;
      }
      .client-toast-time {
        font-size: 10px; color: #999; margin-top: 4px;
      }
      .client-toast-icon {
        font-size: 16px; padding: 10px 0 10px 12px; flex-shrink: 0;
      }
      .client-toast-close {
        background: none; border: none;
        cursor: pointer; color: #aaa;
        font-size: 14px; padding: 8px 10px;
        align-self: flex-start; line-height: 1; flex-shrink: 0;
      }
      .client-toast-close:hover { color: #555; }
      .client-toast-progress {
        position: absolute; bottom: 0; left: 0;
        height: 2px; background: rgba(0,0,0,0.12);
        animation: client-toast-progress 5s linear forwards;
      }
      @keyframes client-toast-progress {
        from { width: 100%; }
        to { width: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private createToastContainer(): void {
    if (document.getElementById('client-toast-container')) {
      this.toastContainer = document.getElementById('client-toast-container');
      return;
    }
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'client-toast-container';
    document.body.appendChild(this.toastContainer);
  }
}