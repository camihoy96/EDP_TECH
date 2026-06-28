import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientTicketService, Ticket } from '../../services/client-ticket.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { ClientNotificationService } from '../../services/client-notification.service';
@Component({
  selector: 'app-client-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-list-view">
      <!-- Header -->
      <div class="view-header">
        <h2>My Support Tickets</h2>
        <button class="classic-btn primary" (click)="newTicket()">
          <span>📄</span> New Ticket
        </button>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs-bar">
        <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
          📋 All <span class="tab-count">{{ myTickets.length }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'new'" (click)="setActiveTab('new')">
          🆕 New <span class="tab-count new-count">{{ getStatusCount('new') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'assigned'" (click)="setActiveTab('assigned')">
          📌 Assigned <span class="tab-count">{{ getStatusCount('assigned') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'in_progress'" (click)="setActiveTab('in_progress')">
          ⚙️ In Progress <span class="tab-count progress-count">{{ getStatusCount('in_progress') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
          ⏳ Pending <span class="tab-count">{{ getStatusCount('pending') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'resolved'" (click)="setActiveTab('resolved')">
          ✅ Resolved <span class="tab-count resolved-count">{{ getStatusCount('resolved') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'closed'" (click)="setActiveTab('closed')">
          🔒 Closed <span class="tab-count">{{ getStatusCount('closed') }}</span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Priority:</label>
          <select class="classic-select" [(ngModel)]="filters.priority" (change)="applyFilters()">
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div class="filter-group search-group">
          <label>Search:</label>
          <input type="text" class="classic-input" placeholder="Ticket #, title..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        
        <button class="classic-btn" (click)="clearFilters()">
          <span>🔄</span> Clear
        </button>
      </div>

      <!-- Status Bar -->
      <div class="classic-status-bar">
        <span>Showing: <strong>{{ filteredTickets.length }}</strong> tickets</span>
        <span class="status-sep">|</span>
        <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
      </div>

      <!-- Tickets Table -->
      <div class="classic-table-container">
        <table class="classic-table">
          <thead>
            <tr>
              <th>Ticket Code</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
       <tbody>
  <tr *ngFor="let ticket of filteredTickets; trackBy: trackByTicketId" class="clickable-row" (click)="viewTicket(ticket.id)">
    <td class="ticket-num">{{ ticket.ticket_number }} 
          <!-- Creator info for EDP/IT users -->
      <div class="creator-info" *ngIf="isEDPUser() && ticket.created_by_name">
        <span class="creator-label">by: {{ ticket.created_by_name }}</span>
        <span class="creator-dept" *ngIf="$any(ticket).creator_department">
          ({{ $any(ticket).creator_department }})
        </span>
      </div>
</td>
    <td class="ticket-title">{{ ticket.title }}</td>
    <td>
      <span class="priority-badge" [class]="'priority-' + ticket.priority">
        {{ ticket.priority | uppercase }}
      </span>
    </td>
    <td class="sendto-cell">
      <div class="sendto-info-small">
        <span class="dept-name-small">{{ ticket.department_name || '—' }}</span>
        <span class="branch-tag-tiny" *ngIf="ticket.branch_name">
          🏢 {{ ticket.branch_name }}
        </span>
      </div>
    </td>
    <td class="status-cell">
      <span class="status-badge" [class]="'status-' + ticket.status">
        {{ ticket.status | titlecase }}
      </span>
      <!-- Show worker info -->
      <div class="status-worker" *ngIf="ticket.assigned_to">
        <ng-container [ngSwitch]="ticket.status">
          <span *ngSwitchCase="'assigned'" class="worker-label">Assigned to: {{ getAssignedNamesDisplay(ticket) }}</span>
          <span *ngSwitchCase="'in_progress'" class="worker-label">In progress by: {{ getAssignedNamesDisplay(ticket) }}</span>
          <span *ngSwitchCase="'pending'" class="worker-label">Pending by: {{ getAssignedNamesDisplay(ticket) }}</span>
          <span *ngSwitchCase="'resolved'" class="worker-label">Resolved by: {{ getAssignedNamesDisplay(ticket) }}</span>
          <span *ngSwitchDefault class="worker-label">Assigned: {{ getAssignedNamesDisplay(ticket) }}</span>
        </ng-container>
      </div>
    </td>
    <!-- ✅ ONLY ONE assigned-cell td -->
    <td class="assigned-cell">
      <span *ngIf="ticket.assigned_to" class="agent-name-display">
        👤 {{ getAssignedNamesDisplay(ticket) }}
      </span>
      <span *ngIf="!ticket.assigned_to" class="unassigned">—</span>
          </td>
    <td class="date-cell">{{ ticket.created_at | date:'MMM d, h:mm a' }}</td>
    <td class="action-cell" (click)="$event.stopPropagation()">
      <button class="action-btn view-btn" (click)="viewTicket(ticket.id)" title="View">📋</button>
      <button *ngIf="canEditTicket(ticket)" class="action-btn edit-btn" (click)="editTicket(ticket.id)" title="Edit">✏️</button>
      <button *ngIf="canAssignTicket(ticket)" class="action-btn assign-btn" (click)="assignTicket(ticket)" 
              [title]="ticket.assigned_to ? 'Reassign' : 'Assign Agent'">
        {{ ticket.assigned_to ? '🔄' : '👤' }}
      </button>
      <button *ngIf="canDeleteTicket(ticket)" class="action-btn delete-btn" (click)="deleteTicket(ticket)" title="Delete">🗑️</button>
    </td>
  </tr>
  <tr *ngIf="filteredTickets.length === 0">
    <td colspan="8" class="empty-row">
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No tickets found</p>
        <button class="classic-btn" (click)="newTicket()">Create your first ticket</button>
      </div>
    </td>
  </tr>
</tbody>
        </table>
      </div>
    </div>
  <!-- Assign Ticket Modal -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window assign-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar">
      <span>{{ assignTicketData?.assigned_to ? '🔄 Reassign' : '👤 Assign' }} Ticket: {{ assignTicketData?.ticket_number }}</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p class="assign-info">
        Select agent(s) to handle this ticket:
        <span class="selected-count" *ngIf="selectedAgentIds.length > 0">
          ({{ selectedAgentIds.length }} selected)
        </span>
      </p>
      
      <div class="agent-list">
        <!-- Self-assign option -->
        <div class="agent-item self-assign" 
             [class.selected]="isAgentSelected(currentUser)"
             (click)="toggleAgent(currentUser)">
          <span class="agent-avatar" [style.background]="currentUser?.avatar_color || '#0a3a8c'">
            {{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '👤' }}
          </span>
          <div class="agent-info">
            <span class="agent-name">Assign to Me</span>
            <span class="agent-role">{{ currentUser?.fullname }} ({{ currentUser?.role || 'Staff' }})</span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(currentUser)">
            {{ isAgentSelected(currentUser) ? '☑' : '☐' }}
          </span>
        </div>
        
        <!-- Other agents -->
        <div class="agent-item" 
             *ngFor="let agent of availableAgents" 
             [class.selected]="isAgentSelected(agent)"
             (click)="toggleAgent(agent)">
          <span class="agent-avatar" [style.background]="agent.avatar_color || '#3b82f6'">
            {{ agent.fullname?.charAt(0)?.toUpperCase() || '?' }}
          </span>
          <div class="agent-info">
            <span class="agent-name">{{ agent.fullname }}</span>
            <span class="agent-role">{{ agent.role || 'Staff' }}</span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(agent)">
            {{ isAgentSelected(agent) ? '☑' : '☐' }}
          </span>
        </div>
        
        <div class="empty-agents" *ngIf="availableAgents.length === 0">
          <p>No other agents available in your branch.</p>
        </div>
      </div>

      <div class="modal-actions">
        <button class="classic-btn" (click)="closeAssignModal()">Cancel</button>
        <button class="classic-btn primary" (click)="confirmAssign()" [disabled]="selectedAgentIds.length === 0">
          ✅ {{ assignTicketData?.assigned_to ? 'Reassign Ticket' : 'Assign Ticket' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Assign Success Modal -->
<div class="modal-overlay" *ngIf="showAssignSuccess" (click)="closeAssignSuccess()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar success">
      <span>✅ Ticket Assigned</span>
      <button type="button" (click)="closeAssignSuccess()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">✅</span>
        <div class="warning-message">
          <h3>Ticket assigned successfully!</h3>
          <p>Ticket: <strong>#{{ successTicketNumber }}</strong></p>
          <p class="resolve-title">"{{ successTicketTitle }}"</p>
          <p *ngIf="successAssignedNames" class="assigned-to-info">
            Assigned to: <strong>👥 {{ successAssignedNames }}</strong>
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn primary" (click)="closeAssignSuccess()">OK</button>
      </div>
    </div>
  </div>
</div>
    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
      <div class="modal-window" (click)="$event.stopPropagation()">
        <div class="modal-titlebar danger">
          <span>🗑️ Delete Ticket</span>
          <button type="button" (click)="cancelDelete()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Permanently delete this ticket?</h3>
              <p>Ticket: <strong>#{{ ticketToDelete?.ticket_number }}</strong></p>
              <p class="resolve-title">"{{ ticketToDelete?.title }}"</p>
              <p class="warning-hint danger-text">This action cannot be undone. All data including comments and attachments will be permanently removed.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="classic-btn" (click)="cancelDelete()">Cancel</button>
            <button class="classic-btn danger" (click)="confirmDelete()">🗑️ Yes, Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-list-view {
      padding: 10px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
    }

    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0a246a;
    }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }

    .classic-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      border-radius: 3px;
      padding: 5px 14px;
      cursor: pointer;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #000;
    }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.primary:hover { background: #1a3a8a; }
    .classic-btn.danger { background: #cc0000; color: white; border-color: #cc0000; }
    .classic-btn.danger:hover { background: #aa0000; }

    .status-tabs-bar {
      display: flex; gap: 2px; padding: 4px 6px;
      background: #e8e8e8; border: 1px solid #a0a0a0; margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .status-tab {
      background: #d4d0c8; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px 2px 0 0; padding: 5px 12px;
      cursor: pointer; font-size: 10px; color: #333;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .tab-count.new-count { background: #0066cc; }
    .tab-count.progress-count { background: #cc6600; }
    .tab-count.resolved-count { background: #008800; }

    .filter-bar {
      background: #f0f0f0; border: 1px solid #a0a0a0; padding: 6px 10px;
      display: flex; gap: 12px; align-items: center; margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 10px; font-weight: bold; color: #000; }
    .classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 10px; background: white; }
    .search-group .classic-input { width: 160px; }

    .classic-status-bar {
      background: #f0f0f0; border: 1px solid #a0a0a0; border-top: none;
      padding: 3px 10px; font-size: 10px; color: #333;
      display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
    }
    .status-sep { color: #b0b0b0; }

    .classic-table-container { border: 1px solid #a0a0a0; background: white; overflow-x: auto; }
    .classic-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .classic-table th {
      background: #0a246a; color: white; padding: 6px 8px; text-align: center;
      font-weight: bold; font-size: 10px; border-right: 1px solid rgba(255,255,255,0.2);
      white-space: nowrap;
    }
    .classic-table th:last-child { border-right: none; }
    .classic-table td { padding: 7px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; color: #000; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #e8f0fe; }

    .ticket-num { font-family: monospace; color: #0a3a8c; font-weight: bold; font-size: 11px; }
    .ticket-title { font-weight: 500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-cell { font-family: monospace; font-size: 10px; white-space: nowrap; color: #555; }

    .priority-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .priority-critical { background: #cc0000; color: white; }
    .priority-high { background: #ff6600; color: white; }
    .priority-medium { background: #ffcc00; color: #000; }
    .priority-low { background: #008800; color: white; }

    .status-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; text-transform: uppercase; }
    .status-new { background: #cde8f5; color: #0066cc; }
    .status-assigned { background: #e0e0e0; color: #666; }
    .status-in_progress { background: #fff0cc; color: #cc6600; }
    .status-pending { background: #ffe0cc; color: #cc6600; }
    .status-resolved { background: #ccffcc; color: #008800; }
    .status-closed { background: #f0f0f0; color: #666; }

    /* Send To Column */
    .sendto-cell { max-width: 130px; }
    .sendto-info-small { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; }
    .branch-tag-tiny {
      font-size: 8px;
      background: #f0f4ff;
      color: #0a3a8c;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #b8c8e8;
      white-space: nowrap;
    }
/* Status worker info */
.status-cell { text-align: center; }
.worker-label { 
  font-size: 9px; 
  color: #666; 
  display: block; 
  margin-top: 2px;
  font-style: italic;
}

/* Creator info for EDP/IT users */
.assigned-cell { text-align: center; }
.assigned-info { margin-bottom: 2px; }
.unassigned { color: #999; }
.agent-name-display { 
  color: #333; 
  font-weight: 500; 
  font-size: 10px; 
}
.creator-info {
  font-size: 9px;
  color: #666;
  margin-top: 2px;
  border-top: 1px dotted #ddd;
  padding-top: 2px;
}
.creator-label { color: #555; }
.creator-dept { 
  color: #0a3a8c; 
  font-weight: 500;
  background: #f0f4ff;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 8px;
}
    .action-cell { white-space: nowrap; display: flex; gap: 2px; justify-content: center; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0fe; border-color: #a0a0a0; }
    .edit-btn:hover { color: #0066cc; }
    .delete-btn:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }

    .empty-row td { text-align: center; padding: 30px; }
    .empty-state { text-align: center; }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
    .empty-state p { margin-bottom: 12px; color: #666; font-size: 11px; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); min-width: 420px; max-width: 500px; }
    .modal-titlebar { background: #0a246a; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; }
    .modal-titlebar.danger { background: #cc0000; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    .modal-body { padding: 16px; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-message strong { color: #0a3a8c; font-family: monospace; }
    .resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; padding: 4px 8px; background: #f5f5f5; border-radius: 2px; border-left: 3px solid #ccc; word-break: break-word; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; line-height: 1.4; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    /* Add these to your styles array */
.assign-btn { color: #006600; }
.assign-btn:hover { background: #eeffee; border-color: #008800; color: #008800; }

.assign-modal .modal-window { max-width: 480px; }

.assign-info { font-size: 11px; margin-bottom: 12px; color: #333; }
.selected-count { font-weight: bold; color: #0a3a8c; }

.agent-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.agent-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: white; border: 1px solid #ccc; cursor: pointer; border-radius: 3px; }
.agent-item:hover { background: #e8f0ff; }
.agent-item.selected { background: #cde8f5; border-color: #0a3a8c; }

.agent-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0; }
.agent-info { flex: 1; }
.agent-name { font-size: 11px; font-weight: bold; display: block; color: #000; }
.agent-role { font-size: 9px; color: #666; }

.self-assign { background: #f0f8ff; border-color: #0a3a8c; }
.self-assign:hover { background: #dde8f5; }

.agent-checkbox { font-size: 20px; color: #aaa; flex-shrink: 0; margin-left: 8px; }
.agent-checkbox.checked { color: #0a3a8c; }

.empty-agents { text-align: center; padding: 20px; color: #888; font-size: 11px; }

.modal-titlebar.success { background: #008800; }

.assigned-to-info { margin-top: 6px; font-size: 11px; color: #333; }
.assigned-to-info strong { color: #0a3a8c; }
  `]
})
export class ClientTicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  filters = { priority: '' };
  searchTerm = '';
  currentUser: any;
  activeTab = 'all';
  myTickets: any[] = [];
  private pollingInterval: any;
  showDeleteConfirm = false;
  ticketToDelete: any = null;
  apiUrl = environment.apiUrl;
  private newTicketSub: Subscription | null = null;
  private agentNameCache: Map<number, string> = new Map();
showAssignModal = false;
assignTicketData: any = null;
availableAgents: any[] = [];
selectedAgentIds: number[] = [];
showAssignSuccess = false;
successTicketNumber: string = '';
successTicketTitle: string = '';
successAssignedNames: string = '';

  constructor(
    private ticketService: ClientTicketService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private clientNotificationService: ClientNotificationService
  ) {}

ngOnInit() {
  this.authService.currentUser$.subscribe((user: any) => {
    this.currentUser = user;
    console.log('👤 Current user set:', user?.fullname, '| dept:', user?.department, '| branch:', user?.branch_id);
    
    // DIRECT FETCH - bypass the service
    if (user) {
      this.fetchTicketsDirectly(user);
    }
  });

  this.ticketService.ticketUpdate$.subscribe((updatedTicket: Ticket) => {
    if (updatedTicket) {
      const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }
      this.applyFilters();
    }
  });

  this.newTicketSub = this.ticketService.newTicket$.subscribe((newTicket: Ticket) => {
    if (newTicket) {
      console.log('🆕 New client ticket received, refreshing list...');
      this.fetchTicketsDirectly(this.currentUser);
    }
  });

  // Poll every 30 seconds
  this.pollingInterval = setInterval(() => {
    if (this.currentUser) {
      this.fetchTicketsDirectly(this.currentUser);
    }
  }, 30000);
}
fetchTicketsDirectly(user: any) {
  const params: any = {
    userId: user.id,
    userTable: user.user_table || 'new_user',
    includeAssignedUsers: 'true'  // Remove userFullname - not needed by backend
  };
  
  if (user.branch_id) {
    params.branchId = user.branch_id;
  }
  
  if (user.department_id) {
    params.departmentId = user.department_id;
  }
  
  console.log('🔥 DIRECT FETCH URL:', `${this.apiUrl}/api/client/tickets?` + new URLSearchParams(params).toString());
  
  this.http.get<any[]>(`${this.apiUrl}/api/client/tickets`, { params })
    .subscribe({
      next: (tickets) => {
        console.log('🔥 DIRECT FETCH RESULT:', tickets.length, 'tickets');
        
        // 🔍 DEBUG: Log the first ticket's assigned_users
        if (tickets.length > 0) {
          const firstAssigned = tickets.find(t => t.assigned_to);
          if (firstAssigned) {
            console.log('🔍 First assigned ticket:', firstAssigned.ticket_number);
            console.log('🔍 assigned_users:', JSON.stringify(firstAssigned.assigned_users));
            console.log('🔍 agent_name:', firstAssigned.agent_name);
            console.log('🔍 assigned_to:', firstAssigned.assigned_to);
          }
        }
        
        this.tickets = tickets || [];
        this.myTickets = [...this.tickets];
        this.applyFilters();
      },
      error: (err) => {
        console.error('🔥 DIRECT FETCH ERROR:', err);
      }
    });
}

ngOnDestroy() {
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval);
  }
  if (this.newTicketSub) {
    this.newTicketSub.unsubscribe();
  }
}
/**
 * Check if tickets array has actually changed to avoid unnecessary re-renders
 */
private hasTicketsChanged(newTickets: Ticket[]): boolean {
  if (this.tickets.length !== newTickets.length) return true;
  
  // Include more fields in the fingerprint to catch all changes
  const oldFingerprint = this.tickets.map(t => 
    `${t.id}:${t.status}:${t.assigned_to}:${t.priority}:${t.updated_at}`
  ).sort().join(',');
  
  const newFingerprint = newTickets.map(t => 
    `${t.id}:${t.status}:${t.assigned_to}:${t.priority}:${t.updated_at}`
  ).sort().join(',');
  
  return oldFingerprint !== newFingerprint;
}
trackByTicketId(index: number, ticket: Ticket): number {
  return ticket.id;
}
/**
 * Check if current user is in EDP/IT department
 */
isEDPUser(): boolean {
  if (!this.currentUser) return false;
  const dept = (this.currentUser.department || this.currentUser.department_name || '').toLowerCase();
  const isEDP = dept === 'edp' || dept === 'it' || dept === 'edp/it' || dept === 'it/edp' ||
                dept.includes('edp') || dept.includes('it');
  return isEDP;
}
/**
 * Check if current user is Head/Manager or Supervisor (full control)
 */
isHeadOrSupervisor(): boolean {
  if (!this.currentUser) return false;
  const role = (this.currentUser.role || '').toLowerCase();
  return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
}

/**
 * Check if current user is Staff or IT Technician (limited control)
 */
isStaffOrTechnician(): boolean {
  if (!this.currentUser) return false;
  const role = (this.currentUser.role || '').toLowerCase();
  return role === 'staff' || role === 'it technician';
}
/**
 * Check if the ticket belongs to the current user
 */
isTicketCreator(ticket: Ticket): boolean {
  return ticket.created_by === this.currentUser?.id;
}

// ─── PERMISSION METHODS ───────────────────────────

canEditTicket(ticket: Ticket): boolean {
  // Only NEW tickets can be edited
  if (ticket.status !== 'new') return false;
  
  // Head/Manager or Supervisor can edit any NEW ticket
  if (this.isHeadOrSupervisor()) return true;
  
  // Staff/Technician can only edit their OWN new tickets
  if (this.isStaffOrTechnician() && this.isTicketCreator(ticket)) return true;
  
  // Regular user (creator) can edit their own NEW tickets
  if (this.isTicketCreator(ticket)) return true;
  
  return false;
}

canDeleteTicket(ticket: Ticket): boolean {
  // Head/Manager or Supervisor in EDP/IT department can delete ANY ticket
  if (this.isEDPUser() && this.isHeadOrSupervisor()) return true;
  
  // Staff/Technician can only delete their OWN new tickets
  if (this.isStaffOrTechnician() && this.isTicketCreator(ticket) && ticket.status === 'new') return true;
  
  // Regular user (creator) can delete their own NEW tickets only
  if (this.isTicketCreator(ticket) && ticket.status === 'new') return true;
  
  return false;
}
canAssignTicket(ticket: Ticket): boolean {
  // Cannot assign resolved or closed tickets
  if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
  
  // Must be EDP user
  if (!this.isEDPUser()) return false;
  
  // Head/Manager or Supervisor can always assign/reassign
  if (this.isHeadOrSupervisor()) return true;
  
  // Staff/Technician can ONLY assign new unassigned tickets
  if (this.isStaffOrTechnician()) {
    return ticket.status === 'new' && !ticket.assigned_to;
  }
  
  return false;
}

// ─── ASSIGN METHODS ───────────────────────────

assignTicket(ticket: Ticket) {
  this.assignTicketData = ticket;
  
  // Pre-select currently assigned users
  const assignedUsers = (ticket as any).assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
    this.selectedAgentIds = assignedUsers.map((u: any) => {
      return typeof u === 'object' ? u.id : u;
    });
  } else if (ticket.assigned_to) {
    this.selectedAgentIds = [ticket.assigned_to];
  } else {
    this.selectedAgentIds = [];
  }
  
  this.showAssignModal = true;
  this.loadAvailableAgents();
}
loadAvailableAgents() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Load both users and new_users tables
  this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
    next: (users) => {
      // Filter to only EDP/IT users from the same branch
      const edpUsers = users.filter(u => {
        const dept = (u.department || u.department_name || '').toLowerCase();
        const isEDP = dept.includes('edp') || dept.includes('it');
        return isEDP && u.branch_id === this.currentUser?.branch_id;
      });
      
      // Also check new_user table for EDP/IT staff
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
        next: (newUsers) => {
          const edpNewUsers = newUsers.filter(u => {
            const dept = (u.department || '').toLowerCase();
            const isEDP = dept.includes('edp') || dept.includes('it');
            return isEDP && u.branch_id === this.currentUser?.branch_id;
          });
          this.availableAgents = [...edpUsers, ...edpNewUsers].filter(u => u.id !== this.currentUser?.id);
        },
        error: () => {
          this.availableAgents = edpUsers.filter(u => u.id !== this.currentUser?.id);
        }
      });
    },
    error: () => { this.availableAgents = []; }
  });
}

toggleAgent(agent: any) {
  if (!agent || !agent.id) return;
  const index = this.selectedAgentIds.indexOf(agent.id);
  if (index === -1) {
    this.selectedAgentIds.push(agent.id);
  } else {
    this.selectedAgentIds.splice(index, 1);
  }
}

isAgentSelected(agent: any): boolean {
  return agent && agent.id ? this.selectedAgentIds.includes(agent.id) : false;
}

confirmAssign() {
  if (this.selectedAgentIds.length === 0 || !this.assignTicketData) return;
  
  const assignedNames: string[] = [];
  const assignedUsersData = this.selectedAgentIds.map(id => {
    if (id === this.currentUser?.id) {
      assignedNames.push(this.currentUser?.fullname);
      return { id: id, fullname: this.currentUser?.fullname };
    }
    const agent = this.availableAgents.find(a => a.id === id);
    const name = agent?.fullname || `${id}`;
    assignedNames.push(name);
    return { id: id, fullname: name };
  });
  
  const updateData: any = {
    assigned_to: this.selectedAgentIds[0],
    assigned_users: assignedUsersData,
    status: this.assignTicketData.status === 'new' ? 'assigned' : this.assignTicketData.status,
    version: (this.assignTicketData as any).version
  };
  
  // ✅ Optimistic update - update the ticket in the local array immediately
  const ticketId = this.assignTicketData.id;
  const idx = this.tickets.findIndex(t => t.id === ticketId);
  if (idx !== -1) {
    this.tickets[idx] = {
      ...this.tickets[idx],
      assigned_to: this.selectedAgentIds[0],
      assigned_users: assignedUsersData,
      status: updateData.status,
      agent_name: assignedNames.join(', ')
    };
    this.myTickets = [...this.tickets];
    this.applyFilters();
  }
  
  const adminName = this.currentUser?.fullname || 'Administrator';
  
  this.ticketService.updateTicket(this.assignTicketData.id, updateData).subscribe({
    next: (updatedTicket) => {
      // Parse the response
      if (typeof updatedTicket.assigned_users === 'string') {
        try {
          updatedTicket.assigned_users = JSON.parse(updatedTicket.assigned_users);
        } catch (e) {
          updatedTicket.assigned_users = [];
        }
      }
      
      this.closeAssignModal();
      this.successTicketNumber = updatedTicket.ticket_number || this.assignTicketData.ticket_number;
      this.successTicketTitle = updatedTicket.title || this.assignTicketData.title;
      this.successAssignedNames = assignedNames.join(', ');
      this.showAssignSuccess = true;
       this.clientNotificationService.handleTicketAssigned(
        updatedTicket,
        adminName,
        updatedTicket.created_by,
        assignedNames.join(', ')
      );
      // ✅ Notify the ASSIGNED AGENTS
      this.clientNotificationService.handleTicketAssignedToAgent(
        updatedTicket,
        adminName,
        this.selectedAgentIds
      );
      // Refresh in background
      if (this.currentUser) {
        this.fetchTicketsDirectly(this.currentUser);
      }
    },
    error: (err) => { 
      console.error('Assign error:', err);
      // Revert optimistic update on error
      if (this.currentUser) {
        this.fetchTicketsDirectly(this.currentUser);
      }
      if (err.status === 409) {
        alert('⚠️ This ticket was modified by another user. Refreshing...');
        this.closeAssignModal();
      } else {
        alert('Error assigning ticket: ' + (err.error?.message || err.message));
      }
    }
  });
}
closeAssignModal() {
  this.showAssignModal = false;
  this.assignTicketData = null;
  this.selectedAgentIds = [];
}

closeAssignSuccess() {
  this.showAssignSuccess = false;
  this.assignTicketData = null;
  this.selectedAgentIds = [];
}
 filterMyTicketsFromAll(allTickets: Ticket[]) {
  this.tickets = allTickets || [];
  this.myTickets = [...this.tickets];
  this.applyFilters();
}
filterMyTickets() {
  const currentTickets = this.ticketService['ticketsSubject']?.getValue() || [];
  this.tickets = currentTickets || [];
  this.myTickets = [...this.tickets];
  this.applyFilters();
}

  setActiveTab(tab: string) { this.activeTab = tab; this.applyFilters(); }

  applyFilters() {
    let filtered = [...this.tickets];
    if (this.activeTab !== 'all') filtered = filtered.filter(t => t.status === this.activeTab);
    if (this.filters.priority) filtered = filtered.filter(t => t.priority === this.filters.priority);
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticket_number?.toLowerCase().includes(term) ||
        t.title?.toLowerCase().includes(term)
      );
    }
    this.filteredTickets = filtered;
  }

  clearFilters() { this.activeTab = 'all'; this.filters = { priority: '' }; this.searchTerm = ''; this.applyFilters(); }
  getStatusCount(status: string): number { return this.tickets.filter(t => t.status === status).length; }

  getAssignedNames(ticket: Ticket): string {
    if (!ticket) return '—';
    const assignedUsers = (ticket as any).assigned_users;
    if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const names = assignedUsers.map((u: any) => {
        if (typeof u === 'object' && u.fullname) return u.id === this.currentUser?.id ? 'You' : u.fullname;
        if (typeof u === 'number') {
          if (u === this.currentUser?.id) return 'You';
          if (this.agentNameCache.has(u)) return this.agentNameCache.get(u);
          this.fetchAgentName(u);
          return `${u}`;
        }
        return 'Unknown';
      });
      return names.join(', ');
    }
    if (ticket.assigned_to) {
      if (ticket.assigned_to === this.currentUser?.id) return 'You';
      return ticket.agent_name || `${ticket.assigned_to}`;
    }
    return '—';
  }

  /**
 * Get assigned names for display, replacing current user's name with "You"
 */
getAssignedNamesDisplay(ticket: Ticket): string {
  if (!ticket) return '—';
  
  // ✅ FIRST: Check assigned_users array (supports multiple users)
  const assignedUsers = (ticket as any).assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
    const names = assignedUsers.map((u: any) => {
      if (typeof u === 'object' && u.fullname && u.fullname !== 'null') {
        return u.id === this.currentUser?.id ? 'You' : u.fullname;
      }
      if (typeof u === 'number' || (typeof u === 'object' && u.id)) {
        const uid = typeof u === 'number' ? u : u.id;
        if (uid === this.currentUser?.id) return 'You';
        const cachedName = this.agentNameCache.get(uid);
        if (cachedName) return cachedName;
        this.fetchAgentName(uid);
        return 'User #' + uid;
      }
      return 'Unknown';
    });
    return names.join(', ');
  }
  
  // ✅ SECOND: Fallback to agent_name (single user from JOIN)
  if (ticket.agent_name && ticket.agent_name !== 'null' && ticket.agent_name !== 'undefined') {
    return ticket.assigned_to === this.currentUser?.id ? 'You' : ticket.agent_name;
  }
  
  // ✅ THIRD: Fallback to assigned_to
  if (ticket.assigned_to) {
    if (ticket.assigned_to === this.currentUser?.id) return 'You';
    const cachedName = this.agentNameCache.get(ticket.assigned_to);
    if (cachedName) return cachedName;
    this.fetchAgentName(ticket.assigned_to);
    return 'User #' + ticket.assigned_to;
  }
  
  return '—';
}
private fetchAgentName(userId: number) {
  if (!userId) return;
  if (this.agentNameCache.has(userId)) return;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Try both API endpoints
  this.http.get<any>(`${environment.apiUrl}/api/users/${userId}`, { headers }).subscribe({
    next: (user) => { 
      if (user?.fullname) {
        this.agentNameCache.set(userId, user.fullname);
        // Trigger change detection by updating the tickets reference
        this.myTickets = [...this.tickets];
        this.applyFilters();
      } else {
        // Try new_user table
        this.http.get<any>(`${environment.apiUrl}/api/new-users/${userId}`, { headers }).subscribe({
          next: (newUser) => {
            if (newUser?.fullname) {
              this.agentNameCache.set(userId, newUser.fullname);
            } else {
              this.agentNameCache.set(userId, `User #${userId}`);
            }
            // Trigger UI update
            this.myTickets = [...this.tickets];
            this.applyFilters();
          },
          error: () => {
            this.agentNameCache.set(userId, `User #${userId}`);
          }
        });
      }
    },
    error: () => {
      // Try new_user table as fallback
      this.http.get<any>(`${environment.apiUrl}/api/new-users/${userId}`, { headers }).subscribe({
        next: (newUser) => {
          if (newUser?.fullname) {
            this.agentNameCache.set(userId, newUser.fullname);
          } else {
            this.agentNameCache.set(userId, `User #${userId}`);
          }
          this.myTickets = [...this.tickets];
          this.applyFilters();
        },
        error: () => {
          this.agentNameCache.set(userId, `User #${userId}`);
        }
      });
    }
  });
}

  viewTicket(id: number) { this.router.navigate(['/client/tickets', id]); }
  editTicket(id: number) { this.router.navigate(['/client/tickets', id, 'edit']); }
  newTicket() { this.router.navigate(['/client/tickets/new']); }

  deleteTicket(ticket: any) { this.ticketToDelete = ticket; this.showDeleteConfirm = true; }

confirmDelete() {
  if (this.ticketToDelete) {
    this.ticketService.deleteTicket(this.ticketToDelete.id).subscribe({
      next: () => {
        this.tickets = this.tickets.filter(t => t.id !== this.ticketToDelete!.id);
        this.myTickets = [...this.tickets];
        this.applyFilters();
        this.showDeleteConfirm = false;
        this.ticketToDelete = null;
        this.ticketService.fetchTickets();
      },
      error: (error) => { 
        console.error('Delete error:', error); 
        this.showDeleteConfirm = false; 
        alert('Error deleting ticket.');
      }
    });
  }
}

  cancelDelete() { this.showDeleteConfirm = false; this.ticketToDelete = null; }
}