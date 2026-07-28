import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClientNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  ticketId?: number;
  ticketNumber?: string;
  jobOrderId?: number;
  jobOrderNumber?: string;
  targetUserId?: number;
  targetDeptId?: number;
  targetBranchId?: number;
  creatorUserId?: number;
  creatorDeptId?: number;
  creatorBranchId?: number;
  timestamp: Date;
  read: boolean;
  notificationType?: 'incoming' | 'status_update' | 'requisition';
}

@Injectable({ providedIn: 'root' })
export class ClientNotificationService {
  private notificationsSubject = new BehaviorSubject<ClientNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private ticketNotifications: ClientNotification[] = [];
  private isBrowser: boolean;
  private toastContainer: HTMLElement | null = null;
  private currentUserId: number | null = null;
  private currentUserDeptId: number | null = null;
  private currentUserBranchId: number | null = null;
  private serverPolling: any;
  private shownToastIds: Set<string> = new Set();
  private previousUserId: number | null = null;
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.injectToastStyles();
      this.createToastContainer();
      this.loadCurrentUser();
      this.loadNotificationsFromStorage();
      setTimeout(() => {
        this.loadNotificationsFromServer();
        this.serverPolling = setInterval(() => {
          // ✅ Check for user change before polling
          this.loadCurrentUser();
          this.loadNotificationsFromServer();
        }, 30000);
      }, 2000);
    }
}

  // ── CURRENT USER ──
private loadCurrentUser(): void {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const newUserId = user.id || null;
      
      // ✅ Detect user change and clear data
      if (newUserId !== this.previousUserId && this.previousUserId !== null) {
        console.log('🔄 ClientNotificationService - User changed! Clearing notifications...');
        this.clearAllNotificationData();
      }
      
      this.previousUserId = newUserId;
      this.currentUserId = newUserId;
      this.currentUserDeptId = user.department_id || user.dept_id || null;
      this.currentUserBranchId = user.branch_id || null;
    } catch {
      this.currentUserId = null;
      this.currentUserDeptId = null;
      this.currentUserBranchId = null;
    }
}
/**
 * ✅ Clear all notification data when user changes
 */
private clearAllNotificationData(): void {
    // Clear all notifications
    this.notificationsSubject.next([]);
    this.ticketNotifications = [];
    this.shownToastIds.clear();
    
    // Clear all notification-related localStorage
    try {
        // Get all keys and clear notification-related ones
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('client_notifications_') ||
                key.startsWith('client_ticket_notifications_')
            )) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        // Ignore storage errors
    }
}
/**
 * ✅ Public method to call when user logs out
 */
public resetForNewUser(): void {
    this.clearAllNotificationData();
    this.previousUserId = null;
    this.currentUserId = null;
    this.currentUserDeptId = null;
    this.currentUserBranchId = null;
}
  updateCurrentUser(userId: number): void {
    this.currentUserId = userId;
  }

  // ── TICKET NOTIFICATIONS (EXISTING METHODS) ──

  /**
   * Called when a new ticket is created - notifies all EDP/IT staff in the branch
   */
  handleNewTicketForBranch(ticket: any, branchId: number): void {
    const key = `new-ticket-branch-${ticket.id}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveBranchNotificationToServer(ticket, branchId);

    if (this.isCurrentUserEDPIT() && this.currentUserId !== ticket.created_by) {
      this.showToastPopup(
        '🆕 New Support Ticket',
        `#${ticket.ticket_number}: "${ticket.title}" from ${ticket.created_by_name}`,
        ticket.id
      );
    }
  }

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
        exclude_user_id: ticket.created_by,
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
      this.saveToServer(notif);
      this.addTicketNotification({
        type: 'info',
        title: '📌 Ticket Assigned to You',
        message: `${assignedByName} assigned ticket #${ticket.ticket_number}: "${ticket.title}" to you`,
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        targetUserId: agentId
      });
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
   * Handle status change - notify creator but NOT the agent who changed it
   */
  handleStatusChangeForCreator(ticket: any, newStatus: string, changedByName: string, changedByUserId: number): void {
    const creatorUserId = ticket.created_by;
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
    this.saveToServer(notif);
    if (this.currentUserId === creatorUserId) {
      this.addLocalNotification(notif);
      this.showToastPopup(
        `${config.emoji} Ticket ${statusLabel}`,
        `${changedByName} ${config.verb} your ticket #${ticket.ticket_number}`,
        ticket.id
      );
    }
  }

  /**
   * Called when admin assigns ticket to this client (for client side)
   */
  handleTicketAssigned(ticket: any, assignedByName: string, targetUserId?: number, assignedAgentNames?: string): void {
    const clientUserId = targetUserId || ticket.created_by;
    if (!clientUserId) return;

    const key = `assigned-creator-${ticket.id}-${clientUserId}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

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

    this.saveToServer(notif);
    if (this.currentUserId === clientUserId) {
      this.addLocalNotification(notif);
      this.showToastPopup('📌 Ticket Assigned', `#${ticket.ticket_number}: "${ticket.title}"`, ticket.id);
    }
  }

  /**
   * Called when admin changes status of client's ticket
   */
  handleStatusChange(ticket: any, newStatus: string, changedByName: string, targetUserId?: number): void {
    const clientUserId = targetUserId || ticket.created_by;
    if (this.currentUserId === clientUserId) return;

    const key = `${newStatus}-${ticket.id}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    const statusLabel = newStatus.replace('_', ' ');

    this.addTicketNotification({
      type: 'info',
      title: 'Status Updated',
      message: `Ticket #${ticket.ticket_number} status changed to ${statusLabel} by ${changedByName}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      targetUserId: clientUserId
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

  /**
   * Called when a new ticket is created (for client side)
   */
  handleNewTicket(ticket: any): void {
    if (this.currentUserId === ticket.created_by) return;

    this.addTicketNotification({
      type: 'info',
      title: 'New Ticket',
      message: `New ticket #${ticket.ticket_number}: ${ticket.title}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number
    });
  }

  // ── JOB ORDER NOTIFICATIONS ──

  /**
   * Called when a new Job Order is submitted
   * Notifies: EDP/IT staff in the TARGET department (recipient)
   */
  handleNewJobOrder(jo: any, submittedByName: string, targetBranchId: number, targetDeptId: number): void {
    const key = `jo-new-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, targetBranchId, targetDeptId, {
      type: 'info',
      title: '📋 New Job Order',
      message: `${submittedByName} submitted Job Order #${jo.job_order_number}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'incoming'
    });
  }

  /**
   * Called when a Job Order is forwarded
   */
  handleJobOrderForwarded(jo: any, forwardedByName: string, toBranchId: number, toDeptId: number, fromBranchName: string, fromDeptName: string): void {
    const key = `jo-forwarded-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, toBranchId, toDeptId, {
      type: 'info',
      title: '📤 Job Order Forwarded',
      message: `${forwardedByName} forwarded Job Order #${jo.job_order_number} to your department from ${fromBranchName} - ${fromDeptName}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'incoming'
    });

    if (jo.submitted_by && jo.submitted_by !== this.currentUserId) {
      this.saveJobOrderNotificationToServer(jo, jo.branch_id, jo.department_id, {
        type: 'info',
        title: '📤 Job Order Forwarded',
        message: `Your Job Order #${jo.job_order_number} was forwarded to ${fromBranchName} - ${fromDeptName}`,
        excludeUserId: null,
        notificationType: 'status_update',
        targetUserId: jo.submitted_by
      });
    }
  }

  /**
   * Called when a Job Order is received/approved
   */
  handleJobOrderReceived(jo: any, receivedByName: string, creatorBranchId: number, creatorDeptId: number): void {
    const key = `jo-received-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, creatorBranchId, creatorDeptId, {
      type: 'success',
      title: '📥 Job Order Received',
      message: `${receivedByName} received Job Order #${jo.job_order_number}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  /**
   * Called when a Job Order is assigned
   */
  handleJobOrderAssigned(jo: any, assignedByName: string, assignedToNames: string, creatorBranchId: number, creatorDeptId: number): void {
    const key = `jo-assigned-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, creatorBranchId, creatorDeptId, {
      type: 'info',
      title: '👤 Job Order Assigned',
      message: `${assignedByName} assigned Job Order #${jo.job_order_number} to ${assignedToNames}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  /**
   * Called when a Job Order is reassigned
   */
  handleJobOrderReassigned(jo: any, reassignedByName: string, assignedToNames: string, creatorBranchId: number, creatorDeptId: number): void {
    const key = `jo-reassigned-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, creatorBranchId, creatorDeptId, {
      type: 'info',
      title: '🔄 Job Order Reassigned',
      message: `${reassignedByName} reassigned Job Order #${jo.job_order_number} to ${assignedToNames}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  /**
   * Called when a Job Order is marked as Done
   */
  handleJobOrderDone(jo: any, doneByName: string, creatorBranchId: number, creatorDeptId: number): void {
    const key = `jo-done-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, creatorBranchId, creatorDeptId, {
      type: 'success',
      title: '✅ Job Order Completed',
      message: `${doneByName} marked Job Order #${jo.job_order_number} as Done`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  /**
   * Called when a forwarded Job Order is assigned
   */
  handleForwardedJobOrderAssigned(jo: any, assignedByName: string, assignedToNames: string, forwardingBranchId: number, forwardingDeptId: number): void {
    const key = `jo-fwd-assigned-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, forwardingBranchId, forwardingDeptId, {
      type: 'info',
      title: '👤 Forwarded Job Order Assigned',
      message: `${assignedByName} assigned forwarded Job Order #${jo.job_order_number} to ${assignedToNames}`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  /**
   * Called when a forwarded Job Order is marked as Done
   */
  handleForwardedJobOrderDone(jo: any, doneByName: string, forwardingBranchId: number, forwardingDeptId: number): void {
    const key = `jo-fwd-done-${jo.id || jo.job_order_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveJobOrderNotificationToServer(jo, forwardingBranchId, forwardingDeptId, {
      type: 'success',
      title: '✅ Forwarded Job Order Completed',
      message: `${doneByName} marked forwarded Job Order #${jo.job_order_number} as Done`,
      excludeUserId: jo.submitted_by,
      notificationType: 'status_update'
    });
  }

  // ── REQUISITION NOTIFICATIONS ──

  handleNewRequisition(req: any, submittedByName: string, targetBranchId: number, targetDeptId: number): void {
    const key = `requisition-new-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveRequisitionNotificationToServer(req, targetBranchId, targetDeptId, {
      type: 'info',
      title: '📩 New Requisition',
      message: `${submittedByName} submitted requisition #${req.requisition_number}`,
      excludeUserId: req.submitted_by,
      notificationType: 'requisition'
    });
  }

  handleRequisitionReceived(req: any, receivedByName: string, targetBranchId: number, targetDeptId: number): void {
    const key = `requisition-received-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'success',
        title: '📥 Requisition Received',
        message: `${receivedByName} received your requisition #${req.requisition_number}`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
        this.showToastPopup('📥 Requisition Received', `${receivedByName} received your requisition #${req.requisition_number}`, undefined);
      }
    }

    this.saveRequisitionNotificationToServer(req, targetBranchId, targetDeptId, {
      type: 'success',
      title: '📥 Requisition Received',
      message: `${receivedByName} received requisition #${req.requisition_number}`,
      excludeUserId: req.submitted_by,
      notificationType: 'requisition'
    });
  }

  handleRequisitionProcessed(req: any, processedByName: string, targetBranchId: number, targetDeptId: number): void {
    const key = `requisition-processed-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'info',
        title: '⚙️ Requisition Processing',
        message: `Your requisition #${req.requisition_number} is being processed by ${processedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
        this.showToastPopup('⚙️ Requisition Processing', `Your requisition #${req.requisition_number} is being processed`, undefined);
      }
    }
  }

  handleRequisitionReleased(req: any, releasedByName: string): void {
    const key = `requisition-released-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'success',
        title: '📦 Requisition Released',
        message: `Your requisition #${req.requisition_number} has been released by ${releasedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
        this.showToastPopup('📦 Requisition Released', `Your requisition #${req.requisition_number} has been released`, undefined);
      }
    }
  }

  handleRequisitionRejected(req: any, rejectedByName: string): void {
    const key = `requisition-rejected-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'warning',
        title: '❌ Requisition Rejected',
        message: `Your requisition #${req.requisition_number} was rejected by ${rejectedByName}`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
        this.showToastPopup('❌ Requisition Rejected', `Your requisition #${req.requisition_number} was rejected`, undefined);
      }
    }
  }

  handleRequisitionForwarded(req: any, forwardedByName: string, toBranchId: number, toDeptId: number, toBranchName: string, toDeptName: string): void {
    const key = `requisition-forwarded-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'info',
        title: '📤 Requisition Forwarded',
        message: `Your requisition #${req.requisition_number} was forwarded to ${toBranchName} - ${toDeptName}`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
      }
    }

    this.saveRequisitionNotificationToServer(req, toBranchId, toDeptId, {
      type: 'info',
      title: '📤 New Forwarded Requisition',
      message: `${forwardedByName} forwarded requisition #${req.requisition_number} to your department`,
      excludeUserId: req.submitted_by,
      notificationType: 'requisition'
    });
  }

  handleRequisitionForwardedProcessed(req: any, processedByName: string, forwardingBranchId: number, forwardingDeptId: number): void {
    const key = `requisition-fwd-processed-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveRequisitionNotificationToServer(req, forwardingBranchId, forwardingDeptId, {
      type: 'info',
      title: '⚙️ Forwarded Req Processing',
      message: `${processedByName} is processing forwarded requisition #${req.requisition_number}`,
      excludeUserId: req.submitted_by,
      notificationType: 'requisition'
    });
  }

  handleRequisitionForwardedReleased(req: any, releasedByName: string, forwardingBranchId: number, forwardingDeptId: number): void {
    const key = `requisition-fwd-released-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    this.saveRequisitionNotificationToServer(req, forwardingBranchId, forwardingDeptId, {
      type: 'warning',
      title: '📦 Forwarded Req Released - Action Needed',
      message: `${releasedByName} released forwarded requisition #${req.requisition_number}. Final release needed.`,
      excludeUserId: req.submitted_by,
      notificationType: 'requisition'
    });
  }

  handleRequisitionFinalReleased(req: any, releasedByName: string): void {
    const key = `requisition-final-released-${req.id || req.requisition_number}`;
    if (this.shownToastIds.has(key)) return;
    this.shownToastIds.add(key);

    if (req.submitted_by && req.submitted_by !== this.currentUserId) {
      const notif: ClientNotification = {
        id: this.generateId(),
        type: 'success',
        title: '✅ Requisition Fully Released',
        message: `Your requisition #${req.requisition_number} has been fully released`,
        ticketNumber: req.requisition_number,
        targetUserId: req.submitted_by,
        timestamp: new Date(),
        read: false,
        notificationType: 'requisition'
      };
      this.saveToServer(notif);
      if (this.currentUserId === req.submitted_by) {
        this.addLocalNotification(notif);
        this.showToastPopup('✅ Requisition Fully Released', `Your requisition #${req.requisition_number} has been fully released`, undefined);
      }
    }
  }

  // ── HELPER METHODS ──

  private saveRequisitionNotificationToServer(
    req: any,
    branchId: number,
    deptId: number,
    notificationData: {
      type: string;
      title: string;
      message: string;
      excludeUserId?: number | null;
      notificationType?: string;
    }
  ): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const payload: any = {
      branch_id: branchId,
      department_id: deptId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      ticket_number: req.requisition_number,
      exclude_user_id: notificationData.excludeUserId || null,
      notification_type: notificationData.notificationType || 'requisition',
    };

    fetch(`${environment.apiUrl}/api/client-notifications/requisition`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => console.log('⚠️ Failed to save requisition notification:', err));
  }

  private saveJobOrderNotificationToServer(
    jo: any,
    branchId: number,
    deptId: number,
    notificationData: {
      type: string;
      title: string;
      message: string;
      excludeUserId?: number | null;
      notificationType?: 'incoming' | 'status_update' | 'requisition';
      targetUserId?: number | null;
    }
  ): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const payload: any = {
      branch_id: branchId,
      department_id: deptId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      job_order_id: jo.id,
      job_order_number: jo.job_order_number,
      exclude_user_id: notificationData.excludeUserId || null,
      notification_type: notificationData.notificationType || 'incoming',
    };

    if (notificationData.targetUserId) {
      payload.user_id = notificationData.targetUserId;
    }

    fetch(`${environment.apiUrl}/api/client-notifications/job-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => console.log('⚠️ Failed to save job order notification:', err));
  }

  // ── STORAGE METHODS ──

  private getStorageKey(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = user.id || 'anonymous';
      return `client_notifications_${userId}`;
    } catch {
      return 'client_notifications_anonymous';
    }
  }

  private getTicketNotifKey(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = user.id || 'anonymous';
      return `client_ticket_notifications_${userId}`;
    } catch {
      return 'client_ticket_notifications_anonymous';
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
          this.shownToastIds.add(`toast-${n.id}`);
          if (n.id.startsWith('srv_')) {
            this.shownToastIds.add(n.id);
          }
        });
        const unique = this.removeDuplicates(parsed);
        this.notificationsSubject.next(unique);
      }
    } catch {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  private removeDuplicates(notifications: ClientNotification[]): ClientNotification[] {
    const seen = new Map<string, ClientNotification>();
    notifications.forEach(n => {
      const key = n.id.startsWith('srv_') ? n.id : `${n.title}|${n.message}|${n.ticketId}`;
      if (!seen.has(key) || n.timestamp > seen.get(key)!.timestamp) {
        seen.set(key, n);
      }
    });
    return Array.from(seen.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  private saveTicketNotifications(): void {
    try {
      localStorage.setItem(this.getTicketNotifKey(), JSON.stringify(this.ticketNotifications));
    } catch (e) {}
  }

  private loadTicketNotifications(): void {
    try {
      const stored = localStorage.getItem(this.getTicketNotifKey());
      if (stored) {
        this.ticketNotifications = JSON.parse(stored);
      }
    } catch (e) {
      this.ticketNotifications = [];
    }
  }

  // ── SERVER POLLING ──

  private loadNotificationsFromServer(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || !this.currentUserId) return;

    fetch(`${environment.apiUrl}/api/client-notifications/${this.currentUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then((data: any[]) => {
      if (!Array.isArray(data)) return;

      const current = this.notificationsSubject.value;
      const currentMap = new Map(current.map(n => [n.id, n]));
      const localNotifications = current.filter(n => !n.id.startsWith('srv_'));
      const serverNotifications: ClientNotification[] = [];

      data.forEach(n => {
        const srvId = 'srv_' + n.id;
        const existing = currentMap.get(srvId);
        if (existing) {
          existing.read = existing.read || (n.is_read === 1);
          serverNotifications.push(existing);
        } else {
          const localDuplicate = localNotifications.find(
            ln => ln.title === n.title && ln.message === n.message && ln.ticketId === n.ticket_id
          );
          if (localDuplicate) {
            localDuplicate.read = localDuplicate.read || (n.is_read === 1);
            serverNotifications.push(localDuplicate);
          } else {
            const alreadyExists = serverNotifications.find(sn => sn.id === srvId);
            if (!alreadyExists) {
              const newNotif: ClientNotification = {
                id: srvId,
                type: n.type || 'info',
                title: n.title,
                message: n.message,
                ticketId: n.ticket_id,
                ticketNumber: n.ticket_number,
                jobOrderId: n.job_order_id,
                jobOrderNumber: n.job_order_number,
                targetUserId: n.user_id,
                targetDeptId: n.department_id,
                targetBranchId: n.branch_id,
                creatorUserId: n.creator_user_id,
                creatorDeptId: n.creator_dept_id,
                creatorBranchId: n.creator_branch_id,
                timestamp: new Date(n.created_at),
                read: n.is_read === 1,
                notificationType: n.notification_type || 'incoming'
              };
              serverNotifications.push(newNotif);

              const toastKey = `toast-${srvId}`;
              if (!this.shownToastIds.has(toastKey) && n.is_read === 0) {
                this.shownToastIds.add(toastKey);
                this.showToastPopup(
                  newNotif.title,
                  newNotif.message,
                  newNotif.ticketId || newNotif.jobOrderId
                );
              }
            }
          }
        }
      });

      const merged = [...serverNotifications, ...localNotifications];
      const deduped = this.removeDuplicates(merged);
      this.notificationsSubject.next(deduped);
      this.saveNotifications(deduped);
    })
    .catch((err) => {
      console.log('⚠️ Client notifications fetch failed:', err.message);
    });
  }

  // ── NOTIFICATION CRUD ──

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
    this.saveToServer(notif);
  }

  addTicketNotification(notification: Omit<ClientNotification, 'id' | 'timestamp' | 'read'>): void {
    if (notification.targetUserId && notification.targetUserId !== this.currentUserId) {
      return;
    }

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

  private emitAllNotifications(): void {
    const current = this.notificationsSubject.value;
    const relevantTicketNotifs = this.ticketNotifications.filter(n => 
      !n.targetUserId || n.targetUserId === this.currentUserId
    );
    const allNotifs = [...relevantTicketNotifs, ...current];
    this.notificationsSubject.next(allNotifs);
  }

  private saveToServer(notif: ClientNotification): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || !notif.targetUserId) return;

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
        job_order_id: notif.jobOrderId || null,
        job_order_number: notif.jobOrderNumber || null,
        notification_type: notif.notificationType || 'incoming',
        department_id: notif.targetDeptId || null,
        branch_id: notif.targetBranchId || null,
      }),
    })
    .then(res => res.json())
    .catch(err => console.log('⚠️ Failed to save notification to server:', err));
  }

  markAsRead(id: string): void {
    const current = this.notificationsSubject.value;
    const idx = current.findIndex(n => n.id === id);
    if (idx === -1) return;

    const updated = [...current];
    updated[idx] = { ...updated[idx], read: true };
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);

    if (id.startsWith('srv_')) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const numericId = id.replace('srv_', '');
        fetch(`${environment.apiUrl}/api/client-notifications/${numericId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {});
      }
    }
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
    this.ticketNotifications = [];
    localStorage.removeItem(this.getTicketNotifKey());
    this.shownToastIds.clear();
    this.notificationsSubject.next([]);
    localStorage.removeItem(this.getStorageKey());
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  // ── TOAST POPUP ──

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

  // ── HELPERS ──

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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

  // ── TOAST STYLES ──

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