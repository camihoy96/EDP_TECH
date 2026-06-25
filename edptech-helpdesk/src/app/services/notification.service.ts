import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { Ticket } from './ticket.service';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  ticketId?: number;
  ticketNumber?: string;
  targetUserId?: number | string | null; 
  countInBadge?: boolean;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private permissionGranted = false;
  private isBrowser: boolean;
  private toastContainer: HTMLElement | null = null;
  private notifiedEvents: Set<string> = new Set();
  private newTicketsForPopup: Ticket[] = [];
  private popupInterval: Subscription | null = null;
  private currentUserId: number | null = null;
  private currentUserName: string | null = null;
  private serverPolling: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.injectToastStyles();
      this.createToastContainer();
      this.loadCurrentUser();
      this.startPopupInterval();
      this.loadNotifications();
      this.loadNotificationsFromServer();
      this.serverPolling = setInterval(() => this.loadNotificationsFromServer(), 5000);
    }
  }

  // ✅ NEW: Per-user storage key
  private getStorageKey(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = user.id || 'anonymous';
      return `edp_notifications_${userId}`;
    } catch {
      return 'edp_notifications_anonymous';
    }
  }

  private clearStaleNotifications(): void {
    const current = this.notificationsSubject.value;
    const serverOnes = current.filter(n => n.id.startsWith('srv_'));
    this.notificationsSubject.next(serverOnes);
    this.saveNotifications(serverOnes);
  }

  private shownToastIds: Set<string> = new Set();

  private loadNotificationsFromServer(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    fetch(`${environment.apiUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
    .then((data: any[]) => {
      if (!Array.isArray(data)) { console.log('📭 Server returned no notifications array'); return; }
      console.log('📥 Server notifications received:', data.length);
      
      const current = this.notificationsSubject.value;
      const currentMap = new Map(current.map(n => [n.id, n]));
      const localNotifications = current.filter(n => !n.id.startsWith('srv_'));
      const serverNotifications: Notification[] = [];
      
      data.forEach(n => {
        const srvId = 'srv_' + n.id;
        const existing = currentMap.get(srvId);
        if (existing) {
          existing.read = n.is_read === 1;
          serverNotifications.push(existing);
        } else {
          const localDuplicate = localNotifications.find(ln => ln.title === n.title && ln.message === n.message);
          if (localDuplicate) {
            console.log('⚠️ Skipping server notification - local duplicate exists:', n.title);
            localDuplicate.read = n.is_read === 1;
            serverNotifications.push(localDuplicate);
          } else {
            serverNotifications.push({
              id: srvId, type: n.type || 'info', title: n.title, message: n.message,
              ticketId: n.ticket_id, ticketNumber: n.ticket_number,
              targetUserId: n.user_table && n.user_id ? `${n.user_table}_${n.user_id}` : null,
              countInBadge: true, timestamp: new Date(n.created_at), read: n.is_read === 1,
            });
          }
          if (n.type === 'message' && n.is_read === 0 && !this.shownToastIds.has(srvId)) {
            this.shownToastIds.add(srvId);
            this.showToastPopup('💬 New Message', n.message.substring(0, 60), undefined);
          }
        }
      });
      
      const merged = [...serverNotifications, ...localNotifications];
      console.log('🔔 Merged notifications:', { server: serverNotifications.length, local: localNotifications.length, total: merged.length });
      this.notificationsSubject.next(merged);
      this.saveNotifications(merged);
    })
    .catch((err) => { console.log('⚠️ Failed to load server notifications:', err.message); });
  }

  private loadCurrentUser(): void {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.currentUserId = user.id || null;
      this.currentUserName = user.fullname || null;
    } catch (e) {}
  }

  private getCurrentUserTable(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.user_table || 'users';
    } catch { return 'users'; }
  }

  updateCurrentUser(userId: number, userName: string): void {
    this.currentUserId = userId;
    this.currentUserName = userName;
  }

  private startPopupInterval(): void {
    if (this.popupInterval) this.popupInterval.unsubscribe();
    this.popupInterval = interval(10000).subscribe(() => { this.showNewTicketPopups(); });
  }

  private showNewTicketPopups(): void {
    if (this.getCurrentUserTable() !== 'users') return;
    this.newTicketsForPopup.forEach(ticket => {
      if (this.isBrowser && ticket.status === 'new' && !ticket.assigned_to) {
        this.showToastPopup('🆕 New Ticket Requires Attention', `#${ticket.ticket_number}: ${ticket.title}`, ticket.id);
      }
    });
  }

  // ── PUBLIC METHODS ──
  handleNewTicket(ticket: Ticket): void {
    if (!this.newTicketsForPopup.find(t => t.id === ticket.id)) {
      this.newTicketsForPopup.push(ticket);
    }
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('🆕 New Ticket Created', `#${ticket.ticket_number}: ${ticket.title}`, ticket.id);
    }
    const key = `new-${ticket.id}`;
    if (!this.notifiedEvents.has(key)) {
      this.notifiedEvents.add(key);
      this.addBellNotification({
        type: 'info', title: '🆕 New Ticket', message: `#${ticket.ticket_number} – ${ticket.title}`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: null, countInBadge: true,
      });
    }
  }

  handleTicketAssigned(ticket: Ticket, assignedByName: string, assignedToName: string, assignedToId?: number): void {
    const key = `assigned-${ticket.id}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    this.newTicketsForPopup = this.newTicketsForPopup.filter(t => t.id !== ticket.id);
    
    // ✅ "Assigned to You" — only if assigning to someone ELSE (not self)
    if (assignedToId && assignedToId !== this.currentUserId) {
      this.addBellNotification({
        type: 'info', title: '📌 Ticket Assigned to You',
        message: `Ticket #${ticket.ticket_number} was assigned to you by ${assignedByName}`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: `users_${assignedToId}`, countInBadge: true,
      });
    }
    
    // ✅ Toast for self-assign (visual confirmation only, no bell)
    if (assignedToId === this.currentUserId) {
      this.showToastPopup('📌 Ticket Assigned to You', `#${ticket.ticket_number}: "${ticket.title}" — assigned by ${assignedByName}`, ticket.id);
    }
    
    // ✅ Broadcast notification — ONLY if assigning to someone ELSE
    // (When admin assigns to self, no need to broadcast)
    if (!assignedToId || assignedToId !== this.currentUserId) {
      this.addBellNotification({
        type: 'info', title: '📌 Ticket Assigned',
        message: `${assignedByName} assigned ticket #${ticket.ticket_number} to ${assignedToName}`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: null, countInBadge: true,
      });
    }
    
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('📌 Ticket Assigned', `${assignedByName} assigned #${ticket.ticket_number} to ${assignedToName}`, ticket.id);
    }
}

  handleStatusChange(ticket: Ticket, newStatus: string, changedByName: string): void {
    const key = `${newStatus}-${ticket.id}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    const statusConfig: Record<string, { emoji: string; verb: string }> = {
      in_progress: { emoji: '⚙️', verb: 'started working on' },
      pending: { emoji: '⏳', verb: 'set as pending' },
      resolved: { emoji: '✅', verb: 'resolved' },
    };
    const config = statusConfig[newStatus] || { emoji: '📢', verb: 'updated' };
    
    // ✅ Broadcast — only if ticket is assigned to someone ELSE (not the current user)
    // If current user is the assigned agent, they don't need to see their own action
    if (ticket.assigned_to !== this.currentUserId) {
      this.addBellNotification({
        type: newStatus === 'resolved' ? 'success' : 'info',
        title: `${config.emoji} Ticket ${newStatus.replace('_', ' ')}`,
        message: `${changedByName} ${config.verb} ticket #${ticket.ticket_number}: "${ticket.title}"`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: null, countInBadge: true,
      });
    }
    
    // ✅ Client notification (always send to ticket creator)
    if (ticket.created_by) {
      this.addBellNotification({
        type: newStatus === 'resolved' ? 'success' : 'info',
        title: `${config.emoji} Your Ticket ${newStatus.replace('_', ' ')}`,
        message: `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: `new_user_${ticket.created_by}`, countInBadge: true,
      });
    }
    
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup(`${config.emoji} Ticket ${newStatus.replace('_', ' ')}`, `${changedByName} ${config.verb} ticket #${ticket.ticket_number}`, ticket.id);
    }
    
    if (newStatus === 'resolved') {
      this.newTicketsForPopup = this.newTicketsForPopup.filter(t => t.id !== ticket.id);
    }
}

  // ── BELL NOTIFICATIONS ──
  public addBellNotification(notif: Partial<Notification>): void {
    const newNotif: Notification = {
      id: notif.id || this.generateId(), type: notif.type || 'info',
      title: notif.title || '', message: notif.message || '',
      ticketId: notif.ticketId, ticketNumber: notif.ticketNumber,
      targetUserId: notif.targetUserId ?? null,
      countInBadge: notif.countInBadge !== false,
      timestamp: notif.timestamp || new Date(),
      read: notif.read !== undefined ? notif.read : false,
    };
    const current = this.notificationsSubject.value;
    const isDuplicate = current.find(n => n.id === newNotif.id || (n.title === newNotif.title && n.message === newNotif.message && n.ticketId === newNotif.ticketId));
    if (isDuplicate) { console.log('⚠️ Duplicate notification skipped:', newNotif.title); return; }
    console.log('🔔 ADDING BELL NOTIFICATION:', { id: newNotif.id, title: newNotif.title, targetUserId: newNotif.targetUserId });
    const updated = [newNotif, ...current].slice(0, 100);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
  }

  dismissNotification(id: string): void {
    const updated = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && id.startsWith('srv_')) {
      fetch(`${environment.apiUrl}/api/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
    }
  }

  clearAll(): void {
    const current = this.notificationsSubject.value;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      current.forEach(n => {
        if (n.id.startsWith('srv_')) {
          fetch(`${environment.apiUrl}/api/notifications/${n.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
        }
      });
    }
    this.notificationsSubject.next([]);
    localStorage.removeItem(this.getStorageKey()); // ✅ Per-user key
  }

  // ── TOAST POPUP ──
  private showToastPopup(title: string, message: string, ticketId?: number): void {
    if (!this.isBrowser) return;
    if (!this.toastContainer) this.createToastContainer();
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'notif-toast';
    toast.style.position = 'relative';
    toast.innerHTML = `<div class="toast-accent info"></div><span class="toast-icon">📢</span><div class="toast-body"><div class="toast-title">${this.escapeHtml(title)}</div><div class="toast-message">${this.escapeHtml(message)}</div><div class="toast-time">Just now</div></div><button class="toast-close" title="Dismiss">✕</button><div class="toast-progress"></div>`;
    this.toastContainer.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.removeToast(toast); });
    if (ticketId) {
      toast.addEventListener('click', () => { window.dispatchEvent(new CustomEvent('navigate-ticket', { detail: { ticketId } })); this.removeToast(toast); });
      toast.style.cursor = 'pointer';
    }
    const timer = setTimeout(() => this.removeToast(toast), 6000);
    toast.addEventListener('mouseenter', () => { clearTimeout(timer); (toast.querySelector('.toast-progress') as HTMLElement).style.animationPlayState = 'paused'; });
    toast.addEventListener('mouseleave', () => { (toast.querySelector('.toast-progress') as HTMLElement).style.animationPlayState = 'running'; setTimeout(() => this.removeToast(toast), 2000); });
  }

  private removeToast(toast: HTMLElement): void { toast.classList.add('toast-out'); toast.addEventListener('animationend', () => toast.remove(), { once: true }); }
  private generateId(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
  private escapeHtml(str: string): string { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  private injectToastStyles(): void {
    if (document.getElementById('notif-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'notif-toast-styles';
    style.textContent = `#notif-toast-container{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}.notif-toast{pointer-events:all;display:flex;align-items:flex-start;gap:10px;padding:0;width:340px;background:white;border:1px solid #b0b0b0;box-shadow:3px 4px 14px rgba(0,0,0,0.22);font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;cursor:pointer;overflow:hidden;animation:toast-in .25s ease forwards}.notif-toast.toast-out{animation:toast-out .2s ease forwards}@keyframes toast-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}@keyframes toast-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(24px)}}.toast-accent{width:4px;min-width:4px;align-self:stretch;flex-shrink:0}.toast-accent.info{background:#4f8ef7}.toast-accent.success{background:#008800}.toast-accent.warning{background:#cc7700}.toast-accent.error{background:#cc0000}.toast-body{flex:1;padding:10px 8px 10px 0;min-width:0}.toast-title{font-weight:bold;font-size:11px;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.toast-message{font-size:11px;color:#444;line-height:1.4}.toast-time{font-size:10px;color:#999;margin-top:4px}.toast-icon{font-size:16px;padding:10px 0 10px 12px;flex-shrink:0}.toast-close{background:none;border:none;cursor:pointer;color:#aaa;font-size:14px;padding:8px 10px;align-self:flex-start;line-height:1;flex-shrink:0}.toast-close:hover{color:#555}.toast-progress{position:absolute;bottom:0;left:0;height:2px;background:rgba(0,0,0,0.12);animation:toast-progress 5s linear forwards}@keyframes toast-progress{from{width:100%}to{width:0}}`;
    document.head.appendChild(style);
  }

  private createToastContainer(): void {
    if (document.getElementById('notif-toast-container')) { this.toastContainer = document.getElementById('notif-toast-container'); return; }
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'notif-toast-container';
    document.body.appendChild(this.toastContainer);
  }

  // ── PERSISTENCE (PER-USER) ──
  private loadNotifications(): void {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        parsed.forEach(n => { n.timestamp = new Date(n.timestamp); if (n.id.startsWith('srv_')) this.shownToastIds.add(n.id); });
        console.log('📂 Restored', parsed.length, 'notifications for key:', key);
        this.notificationsSubject.next(parsed);
      }
    } catch { localStorage.removeItem(this.getStorageKey()); }
  }

private saveNotifications(notifications: Notification[]): void {
    if (!this.isBrowser) return;
    
    // ✅ Only save notifications relevant to the CURRENT user
    const userId = this.currentUserId;
    const userTable = this.getCurrentUserTable();
    const compositeId = userId ? `${userTable}_${userId}` : null;
    const isAdmin = userTable === 'users';
    
    const relevantNotifications = notifications.filter(n => {
        // Skip notifications that shouldn't be saved
        if (n.countInBadge === false) return false;
        
        // Broadcast notifications → only save for admin users
        if (n.targetUserId == null) {
            return isAdmin;
        }
        
        // String composite ID → match with current user
        if (typeof n.targetUserId === 'string') {
            return n.targetUserId === compositeId;
        }
        
        // Numeric ID → only for admin users matching the ID
        if (typeof n.targetUserId === 'number') {
            return isAdmin && n.targetUserId === userId;
        }
        
        return false;
    });
    
    try { 
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(relevantNotifications)); 
        console.log('💾 Saved', relevantNotifications.length, 'relevant notifications (filtered from', notifications.length, ')');
    }
    catch { 
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(relevantNotifications.slice(0, 50))); 
    }
}
  // ── REQUISITION NOTIFICATIONS ──
  handleNewRequisition(req: any, submittedByName: string, submittedById?: number): void {
    const key = `requisition-new-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    this.addBellNotification({ type: 'info', title: '📩 New Requisition', message: `${submittedByName} submitted requisition #${req.requisition_number}`, ticketNumber: req.requisition_number, targetUserId: null, countInBadge: true });
    if (this.getCurrentUserTable() === 'users') this.showToastPopup('📩 New Requisition', `${submittedByName} submitted requisition #${req.requisition_number}`, undefined);
  }

  handleRequisitionReceived(req: any, receivedByName: string, submittedById?: number): void {
    const key = `requisition-received-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    if (submittedById) this.addBellNotification({ type: 'success', title: '📥 Requisition Received', message: `${receivedByName} received your requisition #${req.requisition_number}`, ticketNumber: req.requisition_number, targetUserId: submittedById, countInBadge: true });
    this.addBellNotification({ type: 'success', title: '📥 Requisition Received', message: `${receivedByName} received requisition #${req.requisition_number}`, ticketNumber: req.requisition_number, targetUserId: null, countInBadge: true });
  }

  handleNewMessage(fromUsername: string, toUsername: string, message: string, toUserId?: number, toUserTable?: string): void {
    const recipientCompositeId = toUserId && toUserTable ? `${toUserTable}_${toUserId}` : null;
    const currentCompositeId = this.getCurrentUserCompositeId();
    this.addBellNotification({ type: 'info', title: '💬 New Message', message: `New message from ${fromUsername}: "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`, targetUserId: recipientCompositeId, countInBadge: true });
    if (recipientCompositeId && recipientCompositeId === currentCompositeId) this.showToastPopup('💬 New Message', `${fromUsername}: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`, undefined);
  }

  private getCurrentUserCompositeId(): string | null {
    try { const user = JSON.parse(localStorage.getItem('currentUser') || '{}'); const table = user.user_table || 'users'; const id = user.id; return id ? `${table}_${id}` : null; }
    catch { return null; }
  }

  handleRequisitionRejected(req: any, rejectedByName: string, submittedById?: number): void {
    const key = `requisition-rejected-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    if (submittedById) this.addBellNotification({ type: 'warning', title: '❌ Requisition Rejected', message: `Your requisition #${req.requisition_number} was rejected`, ticketNumber: req.requisition_number, targetUserId: submittedById, countInBadge: true });
  }

  // ── PUBLIC MUTATIONS ──
  markAsRead(id: string): void { const current = this.notificationsSubject.value; const idx = current.findIndex(n => n.id === id); if (idx === -1) return; const updated = [...current]; updated[idx] = { ...updated[idx], read: true }; this.notificationsSubject.next(updated); this.saveNotifications(updated); }
  markAllAsRead(): void { const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true })); this.notificationsSubject.next(updated); this.saveNotifications(updated); }
  getUnreadCount(): number { return this.notificationsSubject.value.filter(n => !n.read && n.countInBadge !== false).length; }
}