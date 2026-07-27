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
  jobOrderId?: number;
  jobOrderNumber?: string;
  targetUserId?: number | string | null;
  countInBadge?: boolean;
  read: boolean;
  timestamp: Date;
  notificationType?: 'incoming' | 'status_update' | 'requisition';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private recentlyCreatedIds: Set<string> = new Set();
  private permissionGranted = false;
  private isBrowser: boolean;
  private toastContainer: HTMLElement | null = null;
  private notifiedEvents: Set<string> = new Set();
  private newTicketsForPopup: Ticket[] = [];
  private popupInterval: Subscription | null = null;
  private currentUserId: number | null = null;
  private currentUserName: string | null = null;
  private serverPolling: any;
  private recentlyCreatedActions: Set<string> = new Set();
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
      setInterval(() => this.loadTicketNotificationsFromServer(), 5000);
    }
  }

  // ── JOB ORDER NOTIFICATIONS ──

  /**
   * Called when a new Job Order is submitted
   * Notifies: Admin users (broadcast)
   */
  handleNewJobOrder(jo: any, submittedByName: string): void {
    const key = `jo-new-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Broadcast for admin users
    this.addBellNotification({
      type: 'info',
      title: '📋 New Job Order',
      message: `${submittedByName} submitted Job Order #${jo.job_order_number}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    // Show toast popup for admin users
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('📋 New Job Order', `${submittedByName} submitted #${jo.job_order_number}`, undefined);
    }
  }

  /**
   * Called when a Job Order is forwarded
   * Notifies: Admin users (broadcast) + Creator (status update)
   */
  handleJobOrderForwarded(jo: any, forwardedByName: string, toBranchName: string, toDeptName: string, submittedById?: number): void {
    const key = `jo-forwarded-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the submitter (creator)
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '📤 Job Order Forwarded',
        message: `Your Job Order #${jo.job_order_number} was forwarded to ${toBranchName} - ${toDeptName} by ${forwardedByName}`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'info',
      title: '📤 Job Order Forwarded',
      message: `${forwardedByName} forwarded Job Order #${jo.job_order_number} to ${toBranchName} - ${toDeptName}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('📤 Job Order Forwarded', `${forwardedByName} forwarded #${jo.job_order_number} to ${toBranchName} - ${toDeptName}`, undefined);
    }
  }

  /**
   * Called when a Job Order is received/approved
   * Notifies: Admin users (broadcast) + Creator (status update)
   */
  handleJobOrderReceived(jo: any, receivedByName: string, submittedById?: number): void {
    const key = `jo-received-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the submitter (creator)
    if (submittedById) {
      this.addBellNotification({
        type: 'success',
        title: '📥 Job Order Received',
        message: `${receivedByName} received your Job Order #${jo.job_order_number}`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'success',
      title: '📥 Job Order Received',
      message: `${receivedByName} received Job Order #${jo.job_order_number}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('📥 Job Order Received', `${receivedByName} received #${jo.job_order_number}`, undefined);
    }
  }

  /**
   * Called when a Job Order is assigned
   * Notifies: Admin users (broadcast) + Creator (status update)
   */
  handleJobOrderAssigned(jo: any, assignedByName: string, assignedToNames: string, submittedById?: number): void {
    const key = `jo-assigned-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the submitter (creator)
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '👤 Job Order Assigned',
        message: `${assignedByName} assigned your Job Order #${jo.job_order_number} to ${assignedToNames}`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'info',
      title: '👤 Job Order Assigned',
      message: `${assignedByName} assigned Job Order #${jo.job_order_number} to ${assignedToNames}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('👤 Job Order Assigned', `${assignedByName} assigned #${jo.job_order_number} to ${assignedToNames}`, undefined);
    }
  }

  /**
   * Called when a Job Order is reassigned
   * Notifies: Admin users (broadcast) + Creator (status update)
   */
  handleJobOrderReassigned(jo: any, reassignedByName: string, assignedToNames: string, submittedById?: number): void {
    const key = `jo-reassigned-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the submitter (creator)
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '🔄 Job Order Reassigned',
        message: `${reassignedByName} reassigned your Job Order #${jo.job_order_number} to ${assignedToNames}`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'info',
      title: '🔄 Job Order Reassigned',
      message: `${reassignedByName} reassigned Job Order #${jo.job_order_number} to ${assignedToNames}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('🔄 Job Order Reassigned', `${reassignedByName} reassigned #${jo.job_order_number} to ${assignedToNames}`, undefined);
    }
  }

  /**
   * Called when a Job Order is marked as Done
   * Notifies: Admin users (broadcast) + Creator (status update)
   */
  handleJobOrderDone(jo: any, doneByName: string, submittedById?: number): void {
    const key = `jo-done-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the submitter (creator)
    if (submittedById) {
      this.addBellNotification({
        type: 'success',
        title: '✅ Job Order Completed',
        message: `${doneByName} marked your Job Order #${jo.job_order_number} as Done`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'success',
      title: '✅ Job Order Completed',
      message: `${doneByName} marked Job Order #${jo.job_order_number} as Done`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('✅ Job Order Completed', `${doneByName} marked #${jo.job_order_number} as Done`, undefined);
    }
  }

  /**
   * Called when a forwarded Job Order is assigned by the recipient
   * Notifies: Admin users (broadcast) + Forwarding department (status update)
   */
  handleForwardedJobOrderAssigned(jo: any, assignedByName: string, assignedToNames: string, forwardingSubmittedById?: number): void {
    const key = `jo-fwd-assigned-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the forwarding department (original creator)
    if (forwardingSubmittedById) {
      this.addBellNotification({
        type: 'info',
        title: '👤 Forwarded Job Order Assigned',
        message: `${assignedByName} assigned forwarded Job Order #${jo.job_order_number} to ${assignedToNames}`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: forwardingSubmittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'info',
      title: '👤 Forwarded Job Order Assigned',
      message: `${assignedByName} assigned forwarded Job Order #${jo.job_order_number} to ${assignedToNames}`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('👤 Forwarded Job Order Assigned', `${assignedByName} assigned forwarded #${jo.job_order_number} to ${assignedToNames}`, undefined);
    }
  }

  /**
   * Called when a forwarded Job Order is marked as Done by the recipient
   * Notifies: Admin users (broadcast) + Forwarding department (status update)
   */
  handleForwardedJobOrderDone(jo: any, doneByName: string, forwardingSubmittedById?: number): void {
    const key = `jo-fwd-done-${jo.id || jo.job_order_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);

    // Notify the forwarding department (original creator)
    if (forwardingSubmittedById) {
      this.addBellNotification({
        type: 'success',
        title: '✅ Forwarded Job Order Completed',
        message: `${doneByName} marked forwarded Job Order #${jo.job_order_number} as Done`,
        jobOrderId: jo.id,
        jobOrderNumber: jo.job_order_number,
        targetUserId: forwardingSubmittedById,
        countInBadge: true,
      });
    }

    // Broadcast for admin users
    this.addBellNotification({
      type: 'success',
      title: '✅ Forwarded Job Order Completed',
      message: `${doneByName} marked forwarded Job Order #${jo.job_order_number} as Done`,
      jobOrderId: jo.id,
      jobOrderNumber: jo.job_order_number,
      targetUserId: null,
      countInBadge: true,
    });

    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('✅ Forwarded Job Order Completed', `${doneByName} marked forwarded #${jo.job_order_number} as Done`, undefined);
    }
  }

  // ── EXISTING METHODS (unchanged) ──

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
    
    // ✅ Track if user has marked all as read
    const allReadTimestamp = localStorage.getItem('edp_notifications_all_read_timestamp');
    
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
                // ✅ Keep existing read state (don't overwrite with server)
                serverNotifications.push(existing);
            } else {
                // New notification from server
                // ✅ Check if it was created after "mark all read" timestamp
                let isRead = n.is_read === 1;
                if (allReadTimestamp) {
                    const createdAt = new Date(n.created_at).getTime();
                    const allReadTime = parseInt(allReadTimestamp);
                    // If notification was created before "mark all read", mark it as read
                    if (createdAt <= allReadTime) {
                        isRead = true;
                    }
                }
                
                serverNotifications.push({
                    id: srvId,
                    type: n.type || 'info',
                    title: n.title,
                    message: n.message,
                    ticketId: n.ticket_id,
                    ticketNumber: n.ticket_number,
                    jobOrderId: n.job_order_id,
                    jobOrderNumber: n.job_order_number,
                    targetUserId: n.user_table && n.user_id ? `${n.user_table}_${n.user_id}` : null,
                    countInBadge: true,
                    timestamp: new Date(n.created_at),
                    read: isRead,  // ✅ Respect the all-read timestamp
                });
            }
            
            if (n.type === 'message' && !existing?.read && !this.shownToastIds.has(srvId)) {
                this.shownToastIds.add(srvId);
                this.showToastPopup('💬 New Message', n.message.substring(0, 60), undefined);
            }
        });
        
        const merged = [...serverNotifications, ...localNotifications];
        console.log('🔔 Merged notifications:', { 
            server: serverNotifications.length, 
            local: localNotifications.length, 
            total: merged.length 
        });
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

  // ── EXISTING TICKET METHODS ──

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
    
    // ✅ Notify EACH assigned user (the confirmAssign sends only the first ID, 
    // but we should notify all users in assigned_users array)
    const assignedUsers = (ticket as any).assigned_users;
    if (assignedUsers && Array.isArray(assignedUsers)) {
        assignedUsers.forEach((user: any) => {
            const userId = typeof user === 'object' ? user.id : user;
            if (userId && userId !== this.currentUserId) {
                const userName = typeof user === 'object' ? user.fullname : `Agent #${userId}`;
                this.addBellNotification({
                    type: 'info', title: '📌 Ticket Assigned to You',
                    message: `Ticket #${ticket.ticket_number}: "${ticket.title}" was assigned to you by ${assignedByName}`,
                    ticketId: ticket.id, ticketNumber: ticket.ticket_number,
                    targetUserId: `users_${userId}`, countInBadge: true,
                });
            }
        });
    } else if (assignedToId && assignedToId !== this.currentUserId) {
        // Fallback to single assigned user
        this.addBellNotification({
            type: 'info', title: '📌 Ticket Assigned to You',
            message: `Ticket #${ticket.ticket_number}: "${ticket.title}" was assigned to you by ${assignedByName}`,
            ticketId: ticket.id, ticketNumber: ticket.ticket_number,
            targetUserId: `users_${assignedToId}`, countInBadge: true,
        });
    }
    
    // ✅ Broadcast to OTHER admins (exclude current user)
    this.addBellNotification({
        type: 'info', title: '📌 Ticket Assigned',
        message: `${assignedByName} assigned ticket #${ticket.ticket_number} to ${assignedToName}`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: `exclude_${this.currentUserId}`, countInBadge: true,
    });
    
    // ✅ Only show toast if the assigned user IS the current user
    if (assignedToId === this.currentUserId) {
        this.showToastPopup('📌 Ticket Assigned to You', `#${ticket.ticket_number}: "${ticket.title}" — assigned by ${assignedByName}`, ticket.id);
    }
}

handleStatusChange(ticket: Ticket, newStatus: string, changedByName: string): void {
    const key = `${newStatus}-${ticket.id}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    // ✅ Track this action so polling doesn't bring it back
    const actionKey = `status-${ticket.id}-${newStatus}`;
    this.recentlyCreatedActions.add(actionKey);
    setTimeout(() => this.recentlyCreatedActions.delete(actionKey), 15000);
    const statusConfig: Record<string, { emoji: string; verb: string }> = {
        in_progress: { emoji: '⚙️', verb: 'started working on' },
        pending: { emoji: '⏳', verb: 'set as pending' },
        resolved: { emoji: '✅', verb: 'resolved' },
    };
    const config = statusConfig[newStatus] || { emoji: '📢', verb: 'updated' };
    // ✅ Notify the ticket CREATOR (client) about status change
    if (ticket.created_by) {
        this.addBellNotification({
            type: newStatus === 'resolved' ? 'success' : 'info',
            title: `${config.emoji}Ticket ${newStatus.replace('_', ' ')}`,
            message: `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}: "${ticket.title}"`,
            ticketId: ticket.id, ticketNumber: ticket.ticket_number,
            targetUserId: `new_user_${ticket.created_by}`, countInBadge: true,
        });
    }
    
    // ✅ Notify OTHER assigned users (if ticket has multiple assigned users)
    const assignedUsers = (ticket as any).assigned_users;
    if (assignedUsers && Array.isArray(assignedUsers)) {
        assignedUsers.forEach((user: any) => {
            const userId = typeof user === 'object' ? user.id : user;
            if (userId && userId !== this.currentUserId && userId !== ticket.created_by) {
                this.addBellNotification({
                    type: newStatus === 'resolved' ? 'success' : 'info',
                    title: `${config.emoji} Ticket ${newStatus.replace('_', ' ')}`,
                    message: `${changedByName} ${config.verb} ticket #${ticket.ticket_number}: "${ticket.title}"`,
                    ticketId: ticket.id, ticketNumber: ticket.ticket_number,
                    targetUserId: `users_${userId}`, countInBadge: true,
                });
            }
        });
    }
    
    // ✅ Broadcast to OTHER admins (exclude current user)
    this.addBellNotification({
        type: newStatus === 'resolved' ? 'success' : 'info',
        title: `${config.emoji} Ticket ${newStatus.replace('_', ' ')}`,
        message: `${changedByName} ${config.verb} ticket #${ticket.ticket_number}: "${ticket.title}"`,
        ticketId: ticket.id, ticketNumber: ticket.ticket_number,
        targetUserId: `exclude_${this.currentUserId}`, countInBadge: true,
    });
    
    // ✅ Show toast only if the current user is NOT the one making the change
    // (The toast is for the person being notified, not the actor)
    if (newStatus === 'resolved') {
        this.newTicketsForPopup = this.newTicketsForPopup.filter(t => t.id !== ticket.id);
    }
}

  // ── EXISTING REQUISITION METHODS ──

  handleRequisitionProcessed(req: any, processedByName: string, submittedById?: number): void {
    const key = `requisition-processed-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '⚙️ Requisition Processing',
        message: `Your requisition #${req.requisition_number} is now being processed by ${processedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'info',
      title: '⚙️ Requisition Processing',
      message: `${processedByName} started processing requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  handleRequisitionReleased(req: any, releasedByName: string, submittedById?: number): void {
    const key = `requisition-released-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'success',
        title: '📦 Requisition Released',
        message: `Your requisition #${req.requisition_number} has been released by ${releasedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'success',
      title: '📦 Requisition Released',
      message: `${releasedByName} released requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  handleRequisitionForwarded(req: any, forwardedByName: string, toBranchName: string, toDeptName: string, submittedById?: number): void {
    const key = `requisition-forwarded-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '📤 Requisition Forwarded',
        message: `Your requisition #${req.requisition_number} was forwarded to ${toBranchName} - ${toDeptName} by ${forwardedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'info',
      title: '📤 Requisition Forwarded',
      message: `${forwardedByName} forwarded requisition #${req.requisition_number} to ${toBranchName} - ${toDeptName}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
    
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('📤 Requisition Forwarded', 
        `${forwardedByName} forwarded #${req.requisition_number} to ${toBranchName} - ${toDeptName}`, 
        undefined);
    }
  }

  handleRequisitionForwardedProcessed(req: any, processedByName: string, submittedById?: number): void {
    const key = `requisition-fwd-processed-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'info',
        title: '⚙️ Forwarded Req Processing',
        message: `Forwarded requisition #${req.requisition_number} is being processed by ${processedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'info',
      title: '⚙️ Forwarded Req Processing',
      message: `${processedByName} is processing forwarded requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  handleRequisitionForwardedReleased(req: any, releasedByName: string, submittedById?: number): void {
    const key = `requisition-fwd-released-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'warning',
        title: '📦 Forwarded Req Released - Action Needed',
        message: `Forwarded requisition #${req.requisition_number} was released by ${releasedByName}. Final release needed.`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'warning',
      title: '📦 Forwarded Req Released',
      message: `${releasedByName} released forwarded requisition #${req.requisition_number}. Awaiting final release.`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  handleRequisitionFinalReleased(req: any, releasedByName: string, submittedById?: number): void {
    const key = `requisition-final-released-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'success',
        title: '✅ Requisition Fully Released',
        message: `Your requisition #${req.requisition_number} has been fully released by ${releasedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'success',
      title: '✅ Requisition Fully Released',
      message: `${releasedByName} completed final release for requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
    
    if (this.getCurrentUserTable() === 'users') {
      this.showToastPopup('✅ Requisition Fully Released', 
        `${releasedByName} completed final release for #${req.requisition_number}`, 
        undefined);
    }
  }

  handleRequisitionReceived(req: any, receivedByName: string, submittedById?: number): void {
    const key = `requisition-received-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'success',
        title: '📥 Requisition Received',
        message: `${receivedByName} received your requisition #${req.requisition_number}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'success',
      title: '📥 Requisition Received',
      message: `${receivedByName} received requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  handleRequisitionRejected(req: any, rejectedByName: string, submittedById?: number): void {
    const key = `requisition-rejected-${req.id || req.requisition_number}`;
    if (this.notifiedEvents.has(key)) return;
    this.notifiedEvents.add(key);
    
    if (submittedById) {
      this.addBellNotification({
        type: 'warning',
        title: '❌ Requisition Rejected',
        message: `Your requisition #${req.requisition_number} was rejected by ${rejectedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: submittedById,
        countInBadge: true,
      });
    }
    this.addBellNotification({
      type: 'warning',
      title: '❌ Requisition Rejected',
      message: `${rejectedByName} rejected requisition #${req.requisition_number}`,
      ticketNumber: req.requisition_number,
      targetUserId: null,
      countInBadge: true,
    });
  }

  // ── BELL NOTIFICATIONS ──
public addBellNotification(notif: Partial<Notification>): void {
    const newNotif: Notification = {
      id: notif.id || this.generateId(), type: notif.type || 'info',
      title: notif.title || '', message: notif.message || '',
      ticketId: notif.ticketId, ticketNumber: notif.ticketNumber,
      jobOrderId: notif.jobOrderId,
      jobOrderNumber: notif.jobOrderNumber,
      targetUserId: notif.targetUserId ?? null,
      countInBadge: notif.countInBadge !== false,
      timestamp: notif.timestamp || new Date(),
      read: notif.read !== undefined ? notif.read : false,
    };
    this.recentlyCreatedIds.add(newNotif.id);
    // Clean up after 10 seconds
    setTimeout(() => this.recentlyCreatedIds.delete(newNotif.id), 10000);
    const current = this.notificationsSubject.value;
    const isDuplicate = current.find(n => n.id === newNotif.id || (n.title === newNotif.title && n.message === newNotif.message && n.ticketId === newNotif.ticketId));
    if (isDuplicate) { console.log('⚠️ Duplicate notification skipped:', newNotif.title); return; }
    console.log('🔔 ADDING BELL NOTIFICATION:', { id: newNotif.id, title: newNotif.title, targetUserId: newNotif.targetUserId });
    const updated = [newNotif, ...current].slice(0, 100);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    
    // ✅ Save to server for ALL notifications EXCEPT exclude_ ones
    // null (broadcast), string (targeted), and number (targeted) should all be saved
    const targetId = newNotif.targetUserId;
    if (!targetId || !String(targetId).startsWith('exclude_')) {
        this.saveNotificationToServer(newNotif);
    }
}

 dismissNotification(id: string): void {
    const updated = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && id.startsWith('srv_')) {
        // ✅ Only delete this specific notification
        fetch(`${environment.apiUrl}/api/notifications/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
        }).catch(() => {});
    }
    
    // ✅ Also handle ticket notifications (ticket_ prefix)
    if (token && id.startsWith('ticket_')) {
        const ticketNotifId = id.replace('ticket_', '');
        // Mark as cleared for current user
        fetch(`${environment.apiUrl}/api/ticket-notifications/${ticketNotifId}/read`, { 
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cleared: true })
        }).catch(() => {});
    }
}
 clearAll(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
     localStorage.removeItem('edp_notifications_all_read_timestamp');
    if (token) {
        // Mark all ticket notifications as cleared for THIS user
        fetch(`${environment.apiUrl}/api/ticket-notifications/clear-all`, { 
            method: 'PUT', 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(() => {
            console.log('✅ Clear-all request sent to server');
        }).catch(err => {
            console.error('❌ Clear-all failed:', err);
        });
    }
    
    // Clear localStorage for this user
    localStorage.removeItem(this.getStorageKey());
    
    // Clear the BehaviorSubject immediately
    this.notificationsSubject.next([]);
    
    // Clear all tracked sets
    this.notifiedEvents.clear();
    this.recentlyCreatedActions.clear();
    this.shownToastIds.clear();
}

// Helper method to check if a notification belongs to the current user
private notificationBelongsToCurrentUser(n: Notification): boolean {
    if (!n.targetUserId) {
        // Broadcast notification - only for admin users
        return this.getCurrentUserTable() === 'users';
    }
    
    if (typeof n.targetUserId === 'string') {
        if (n.targetUserId.startsWith('exclude_')) {
            return false; // Don't delete exclude_ notifications
        }
        const parts = n.targetUserId.split('_');
        return parseInt(parts[1]) === this.currentUserId && parts[0] === this.getCurrentUserTable();
    }
    
    if (typeof n.targetUserId === 'number') {
        return n.targetUserId === this.currentUserId;
    }
    
    return false;
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

  // ── PERSISTENCE ──

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
// ✅ KEEP THIS - saves to localStorage
private saveNotifications(notifications: Notification[]): void {
    if (!this.isBrowser) return;
    
    try { 
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(notifications)); 
        console.log('💾 Saved', notifications.length, 'notifications to', key);
    }
    catch (e) { 
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(notifications.slice(0, 50))); 
        console.warn('⚠️ Storage full, saved only 50 notifications');
    }
}
  // In notification.service.ts, update the save method
private saveNotificationToServer(notif: Notification): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    let userId: number | null = null;
    let userTable: string | null = null;
    
    if (typeof notif.targetUserId === 'string' && notif.targetUserId.includes('_')) {
        const parts = notif.targetUserId.split('_');
        // ✅ Only save to server for 'new_user' (clients) and 'null' (broadcast)
        // Skip 'users_*' and 'exclude_*' - these are handled locally
        if (parts[0] === 'exclude') return;
        if (parts[0] === 'users') return;  // ✅ Don't save admin-to-admin notifications
        userTable = parts[0];
        userId = parseInt(parts[1]) || null;
    }
    
    fetch(`${environment.apiUrl}/api/ticket-notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: notif.type,
            title: notif.title,
            message: notif.message,
            ticket_id: notif.ticketId,
            ticket_number: notif.ticketNumber,
            user_id: userId,
            user_table: userTable
        })
    }).catch(err => console.log('Failed to save ticket notification:', err));
}
private loadTicketNotificationsFromServer(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    // ✅ Track if user has marked all as read
    const allReadTimestamp = localStorage.getItem('edp_notifications_all_read_timestamp');
    
    fetch(`${environment.apiUrl}/api/ticket-notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        
        console.log('📥 Server ticket notifications received:', data.length);
        
        const newNotifications: Notification[] = [];
        
        data.forEach(n => {
            if (n.cleared_at) {
                console.log('⏭️ Skipping cleared notification:', n.id);
                return;
            }
            
            const tId = 'ticket_' + n.id;
            
            if (this.recentlyCreatedActions.has(`status-${n.ticket_id}-${n.type || 'info'}`)) {
                return;
            }
            if (this.recentlyCreatedIds.has(tId)) return;
            
            // ✅ Check if it was created after "mark all read" timestamp
            let isRead = n.is_read === 1;
            if (allReadTimestamp && !isRead) {
                const createdAt = new Date(n.created_at).getTime();
                const allReadTime = parseInt(allReadTimestamp);
                if (createdAt <= allReadTime) {
                    isRead = true;
                }
            }
            
            newNotifications.push({
                id: tId,
                type: n.type || 'info',
                title: n.title,
                message: n.message,
                ticketId: n.ticket_id,
                ticketNumber: n.ticket_number,
                targetUserId: n.user_table && n.user_id ? `${n.user_table}_${n.user_id}` : (n.user_id === null && n.user_table === null ? null : undefined),
                countInBadge: true,
                timestamp: new Date(n.created_at),
                read: isRead,  // ✅ Respect the all-read timestamp
            });
        });
        
        const current = this.notificationsSubject.value;
        const localOnly = current.filter(n => 
            !n.id.startsWith('ticket_') && !n.id.startsWith('srv_')
        );
        
        const updated = [...newNotifications, ...localOnly].slice(0, 100);
        this.notificationsSubject.next(updated);
        this.saveNotifications(updated);
    })
    .catch(err => console.log('Failed to load ticket notifications:', err));
}
  // In your notification service
getComputerMonitoringNotifications(): number {
  const notifications = JSON.parse(localStorage.getItem('computer_notifications') || '[]');
  return notifications.length;
}
  // ── PUBLIC MUTATIONS ──

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
    // Store timestamp of when "mark all read" was clicked
    if (this.isBrowser) {
        localStorage.setItem('edp_notifications_all_read_timestamp', Date.now().toString());
    }
    
    const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true })); 
    this.notificationsSubject.next(updated); 
    this.saveNotifications(updated); 
    
    // ✅ Also mark all as read on the server
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    fetch(`${environment.apiUrl}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).catch(err => console.log('Failed to mark server notifications as read:', err));
    
    fetch(`${environment.apiUrl}/api/ticket-notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).catch(err => console.log('Failed to mark ticket notifications as read:', err));
}
  getUnreadCount(): number { 
    return this.notificationsSubject.value.filter(n => !n.read && n.countInBadge !== false).length; 
  }
}