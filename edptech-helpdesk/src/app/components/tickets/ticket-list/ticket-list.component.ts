import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService, Ticket } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification.service';
import { ClientNotificationService } from '../../../services/client-notification.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-list-retro">
      
     <!-- Classic Windows-style header -->
<div class="retro-header">
  <h2>🎫 Ticket Management</h2>
  <button class="retro-btn primary" (click)="newTicket()">
    <span>📄</span> New Ticket
  </button>
</div>

<!-- Status Tabs -->
<div class="status-tabs-bar">
  <button class="status-tab" 
          [class.active]="activeTab === 'all'" 
          (click)="setActiveTab('all')">
    📋 All
    <span class="tab-count">{{ tickets.length }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'new'" 
          (click)="setActiveTab('new')">
    🆕 New
    <span class="tab-count new-count">{{ getStatusCount('new') }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'assigned'" 
          (click)="setActiveTab('assigned')">
    📌 Assigned
    <span class="tab-count">{{ getStatusCount('assigned') }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'in_progress'" 
          (click)="setActiveTab('in_progress')">
    ⚙️ In Progress
    <span class="tab-count progress-count">{{ getStatusCount('in_progress') }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'pending'" 
          (click)="setActiveTab('pending')">
    ⏳ Pending
    <span class="tab-count">{{ getStatusCount('pending') }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'resolved'" 
          (click)="setActiveTab('resolved')">
    ✅ Resolved
    <span class="tab-count resolved-count">{{ getStatusCount('resolved') }}</span>
  </button>
  <button class="status-tab" 
          [class.active]="activeTab === 'closed'" 
          (click)="setActiveTab('closed')">
    🔒 Closed
    <span class="tab-count">{{ getStatusCount('closed') }}</span>
  </button>
</div>

<!-- Filter bar (simplified) -->
<div class="retro-filter-bar">
  <div class="filter-group">
    <label>Priority:</label>
    <select class="retro-select" [(ngModel)]="filters.priority" (change)="applyFilters()">
      <option value="">All Priority</option>
      <option value="critical">Critical</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  </div>
  
  <div class="filter-group search-group">
    <label>Search:</label>
    <input type="text" class="retro-input" placeholder="Ticket #, title..." 
           [(ngModel)]="searchTerm" (input)="applyFilters()">
  </div>
  
  <button class="retro-btn" (click)="clearFilters()">
    <span>🔄</span> Clear
  </button>
</div>

<!-- Status bar info -->
<div class="retro-status-bar">
  <span>Showing: {{ paginatedTickets.length }} of {{ filteredTickets.length }} tickets</span>
  <span>|</span>
  <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
</div>

<!-- View Toggle -->
<div class="view-toggle" style="display:flex; gap:4px; align-items:center; margin-bottom:4px;">
  <span style="font-size:10px;color:#666;">View:</span>
  <button class="view-btn" [class.active]="viewMode === 'list'" (click)="setView('list')" title="List View">📋</button>
  <button class="view-btn" [class.active]="viewMode === 'grid'" (click)="setView('grid')" title="Grid View">🔲</button>
  <button class="view-btn" [class.active]="viewMode === 'kanban'" (click)="setView('kanban')" title="Kanban View">📊</button>
</div>

<!-- LIST VIEW -->
<div class="retro-table-container" *ngIf="viewMode === 'list'">
  <table class="retro-table">
 <thead>
  <tr>
    <th>Ticket Code</th>
    <th>Origin Branch</th>
    <th>Origin Department</th>
    <th>Title</th>
    <th>Priority</th>
    <th>Status</th>
    <th>Created</th>
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  <tr *ngFor="let ticket of paginatedTickets" class="clickable-row" (click)="viewTicket(ticket.id)">
    <td class="ticket-cell">
      <div class="ticket-code">{{ ticket.ticket_number }}</div>
      <div class="ticket-creator">from: {{ ticket.created_by_name || 'Unknown' }}</div>
    </td>
    <!-- Origin Branch -->
    <td class="origin-cell">
      <div class="origin-info">
        <span class="origin-branch" *ngIf="$any(ticket).creator_branch_name">
          🏢 {{ $any(ticket).creator_branch_name }}
          <span *ngIf="$any(ticket).creator_company_name">({{ $any(ticket).creator_company_name }})</span>
        </span>
        <span class="origin-branch" *ngIf="!$any(ticket).creator_branch_name" style="color:#999;">—</span>
      </div>
    </td>
    <!-- Origin Department -->
    <td class="date-cell">{{ ticket.creator_department || '—' }}</td>
    <!-- Title -->
    <td class="ticket-title">{{ ticket.title }}</td>
    <!-- Priority -->
    <td>
      <span class="priority-badge" [class]="'priority-' + ticket.priority">
        {{ ticket.priority | uppercase }}
      </span>
    </td>
    <!-- Status -->
    <td>
      <span class="status-badge" [class]="'status-' + ticket.status">
        {{ ticket.status | titlecase }}
      </span>
      <div class="ticket-meta" *ngIf="ticket.assigned_to">
        <ng-container [ngSwitch]="ticket.status">
          <span *ngSwitchCase="'assigned'">to: {{ getAssignedNames(ticket) }}</span>
          <span *ngSwitchCase="'in_progress'">by: {{ getAssignedNames(ticket) }}</span>
          <span *ngSwitchCase="'pending'">by: {{ getAssignedNames(ticket) }}</span>
          <span *ngSwitchCase="'resolved'">by: {{ getAssignedNames(ticket) }}</span>
          <span *ngSwitchDefault>{{ getAssignedNames(ticket) }}</span>
        </ng-container>
      </div>
    </td>
    <!-- Created -->
    <td class="date-cell">{{ ticket.created_at | date:'MMM d, h:mm a' }}</td>
    <!-- Actions -->
    <td class="action-cell" (click)="$event.stopPropagation()">
      <button class="action-btn" (click)="viewTicket(ticket.id)" title="View">📋</button>
      <button *ngIf="canEditTicket(ticket)" class="action-btn" (click)="editTicket(ticket.id)" title="Edit">✏️</button>
      <button *ngIf="canAssignTicket(ticket)" class="action-btn assign-btn" (click)="assignTicket(ticket)" [title]="ticket.assigned_to ? 'Reassign' : 'Assign'">{{ ticket.assigned_to ? '🔄' : '👤' }}</button>
      <button *ngIf="canResolveTicket(ticket)" class="action-btn resolve-btn" (click)="resolveTicket(ticket)" title="Mark as Resolved">✅</button>
      <button *ngIf="canDeleteFromList(ticket)" class="action-btn delete-list-btn" (click)="deleteTicketFromList(ticket)" title="Delete">🗑️</button>
    </td>
  </tr>
  <tr *ngIf="filteredTickets.length === 0">
    <td colspan="8" class="empty-row">
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No tickets found</p>
        <button class="retro-btn" (click)="newTicket()">Create your first ticket</button>
      </div>
    </td>
  </tr>
</tbody>
  </table>
  <!-- Pagination -->
  <div class="pagination-bar" *ngIf="totalPages > 1">
    <button class="page-btn" (click)="prevPage()" [disabled]="currentPage === 1">◀ Prev</button>
    <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
    <button class="page-btn" (click)="nextPage()" [disabled]="currentPage === totalPages">Next ▶</button>
  </div>
</div>

<!-- GRID VIEW -->
<div class="grid-view" *ngIf="viewMode === 'grid'">
  <div class="ticket-grid">
    <div class="ticket-card" *ngFor="let ticket of paginatedTickets" (click)="viewTicket(ticket.id)">
      <div class="card-header">
        <span class="ticket-num">{{ ticket.ticket_number }}</span>
        <span class="priority-badge" [class]="'priority-' + ticket.priority">{{ ticket.priority | uppercase }}</span>
      </div>
      <h4 class="card-title">{{ ticket.title }}</h4>
      <div class="card-meta">
        <span class="status-badge" [class]="'status-' + ticket.status">{{ ticket.status | titlecase }}</span>
        <span>{{ ticket.department_name || '—' }}</span>
      </div>
      <div class="card-footer">
        <span>{{ ticket.created_by_name || 'Unknown' }}</span>
        <span>{{ ticket.created_at | date:'MMM d' }}</span>
      </div>
    </div>
    <div class="empty-state" *ngIf="filteredTickets.length === 0">
      <span class="empty-icon">📭</span>
      <p>No tickets found</p>
      <button class="retro-btn" (click)="newTicket()">Create your first ticket</button>
    </div>
  </div>
  <!-- Pagination for Grid -->
  <div class="pagination-bar" *ngIf="totalPages > 1">
    <button class="page-btn" (click)="prevPage()" [disabled]="currentPage === 1">◀ Prev</button>
    <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
    <button class="page-btn" (click)="nextPage()" [disabled]="currentPage === totalPages">Next ▶</button>
  </div>
</div>

<!-- KANBAN VIEW -->
<div class="kanban-view" *ngIf="viewMode === 'kanban'">
  <div class="kanban-board">
    <div class="kanban-column" *ngFor="let status of kanbanStatuses">
      <div class="kanban-header" [class]="'kb-' + status.key">
        {{ status.icon }} {{ status.label }}
        <span class="kanban-count">{{ getStatusCount(status.key) }}</span>
      </div>
      <div class="kanban-cards">
        <div class="kanban-card" *ngFor="let ticket of getTicketsByStatus(status.key)" (click)="viewTicket(ticket.id)">
          <div class="kb-card-title">{{ ticket.title }}</div>
          <div class="kb-card-id">{{ ticket.ticket_number }}</div>
          <div class="kb-card-meta">
            <span class="priority-badge" [class]="'priority-' + ticket.priority">{{ ticket.priority | uppercase }}</span>
            <span>{{ ticket.created_by_name || 'Unknown' }}</span>
          </div>
        </div>
        <div class="kanban-empty" *ngIf="getTicketsByStatus(status.key).length === 0">—</div>
      </div>
    </div>
  </div>
</div>

<!-- Assign Ticket Modal -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar">
      <span>{{ assignTicketData?.assigned_to ? '🔄 Reassign' : '👤 Assign' }} Ticket: {{ assignTicketData?.ticket_number }}</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      
      <div class="current-assign" *ngIf="assignTicketData?.assigned_to && assignTicketData?.agent_name">
        <span class="current-label">Currently assigned to:</span>
        <span class="current-agent">👤 {{ getAssignedNames(assignTicketData) }}</span>
      </div>

      <p class="assign-info">
        Select one or more agents to handle this ticket:
        <span class="selected-count" *ngIf="selectedAgentIds.length > 0">
          ({{ selectedAgentIds.length }} selected)
        </span>
      </p>
      
      <div class="agent-list">
        <div 
          class="agent-item self-assign" 
          [class.selected]="isAgentSelected(currentUser)"
          (click)="toggleAgent(currentUser)">
          <span class="agent-avatar" [style.background]="currentUser?.avatar_color || '#0a3a8c'">
            <img *ngIf="currentUser?.photo_url" [src]="apiUrl + currentUser.photo_url" alt="Photo" class="agent-photo">
            <span *ngIf="!currentUser?.photo_url">{{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '👤' }}</span>
          </span>
          <div class="agent-info">
            <span class="agent-name">Assign to Me</span>
            <span class="agent-role">{{ currentUser?.fullname }} ({{ currentUser?.role | titlecase }})</span>
            <span class="agent-status" [class]="getAgentStatus(currentUser)?.class">
              {{ getAgentStatus(currentUser)?.label }}
            </span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(currentUser)">
            {{ isAgentSelected(currentUser) ? '☑' : '☐' }}
          </span>
        </div>
        
        <div 
          class="agent-item" 
          *ngFor="let agent of availableAgents" 
          [class.selected]="isAgentSelected(agent)"
          [class.agent-unavailable]="isAgentUnavailable(agent)"
          (click)="toggleAgent(agent)">
          <span class="agent-avatar" [style.background]="agent.avatar_color || '#3b82f6'">
            <img *ngIf="agent.photo_url" [src]="apiUrl + agent.photo_url" alt="Photo" class="agent-photo">
            <span *ngIf="!agent.photo_url">{{ agent.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
          </span>
          <div class="agent-info">
            <span class="agent-name">{{ agent.fullname }}</span>
            <span class="agent-role">{{ agent.role | titlecase }}</span>
            <span class="agent-status" [class]="getAgentStatus(agent)?.class">
              {{ getAgentStatus(agent)?.label }}
            </span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(agent)">
            {{ isAgentSelected(agent) ? '☑' : '☐' }}
          </span>
          <span class="agent-warning" *ngIf="isAgentUnavailable(agent)" title="Agent is currently unavailable">⚠️</span>
        </div>
      </div>
      
      <div class="empty-agents" *ngIf="availableAgents.length === 0">
        <p>No other agents available.</p>
      </div>

      <div class="selected-summary" *ngIf="selectedAgentIds.length > 0">
        <span class="summary-label">Selected agents:</span>
        <span class="summary-count">{{ selectedAgentIds.length }} agent(s)</span>
      </div>

      <div class="modal-actions">
        <button class="retro-btn" (click)="closeAssignModal()">Cancel</button>
        <button class="retro-btn primary" (click)="confirmAssign()" [disabled]="selectedAgentIds.length === 0">
          ✅ {{ assignTicketData?.assigned_to ? 'Reassign Ticket' : 'Assign Ticket' }}
        </button>
      </div>
      
      <div class="assign-warning" *ngIf="hasUnavailableSelected()">
        ⚠️ Some selected agents are currently unavailable. They may not respond immediately.
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
<p *ngIf="successAssignedNames.length > 0" class="assigned-to-info">
  Assigned to: <strong>👥 {{ successAssignedNames }}</strong>
</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn primary" (click)="closeAssignSuccess()">OK</button>
      </div>
    </div>
  </div>
</div>

<!-- Resolve Ticket Modal -->
<div class="modal-overlay" *ngIf="showResolveModal" (click)="closeResolveModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar resolve">
      <span>✅ Resolve Ticket</span>
      <button type="button" (click)="closeResolveModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">✅</span>
        <div class="warning-message">
          <h3>Mark ticket as resolved?</h3>
          <p>Ticket: <strong>#{{ resolveTicketData?.ticket_number }}</strong></p>
          <p class="resolve-title">"{{ resolveTicketData?.title }}"</p>
          <p class="warning-hint success">This will close the ticket and mark it as resolved. The user will be notified.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeResolveModal()">Cancel</button>
        <button class="retro-btn primary" (click)="confirmResolve()">
          ✅ Yes, Mark as Resolved
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Delete Ticket From List Modal -->
<div class="modal-overlay" *ngIf="showDeleteListModal" (click)="closeDeleteListModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar danger">
      <span>🗑️ Delete Ticket</span>
      <button type="button" (click)="closeDeleteListModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Delete this ticket permanently?</h3>
          <p>Ticket: <strong>#{{ deleteListData?.ticket_number }}</strong></p>
          <p class="resolve-title">"{{ deleteListData?.title }}"</p>
          <p class="warning-hint danger-text">This action cannot be undone. All data including comments and attachments will be permanently removed.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeDeleteListModal()">Cancel</button>
        <button class="retro-btn danger" (click)="confirmDeleteFromList()">🗑️ Yes, Delete</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .ticket-list-retro { padding: 6px; background: #d4d0c8; min-height: 100%; }
    .retro-table { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
    .retro-table td, .retro-table th { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
    .retro-input, .retro-select, .retro-btn, .action-btn, input, select, button, textarea { user-select: auto; -webkit-user-select: auto; -moz-user-select: auto; -ms-user-select: auto; }
    :host { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
    .retro-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 4px 8px; background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%); color: #fff; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .retro-header h2 { margin: 0; font-size: 12px; font-weight: bold; letter-spacing: 0.3px; }
    .retro-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px; padding: 2px 10px; cursor: pointer; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; color: #000; }
    .retro-btn:hover { background: #e8f0ff; }
    .retro-btn:active { border-color: #808080 #fff #fff #808080; }
    .retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .retro-btn.primary:hover { background: #1c5fb5; }
    .retro-filter-bar { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 4px 8px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 4px; }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 10px; font-weight: bold; color: #000; }
    .retro-select, .retro-input { padding: 2px 6px; border: 1px solid #808080; background: #fff; font-size: 10px; border-radius: 1px; outline: none; }
    .retro-select:focus, .retro-input:focus { border-color: #0a3a8c; }
    .search-group .retro-input { width: 140px; }
    .retro-status-bar { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-top: none; padding: 2px 8px; font-size: 10px; color: #333; display: flex; gap: 8px; margin-bottom: 6px; }
    .retro-table-container { border: 2px solid; border-color: #fff #808080 #808080 #fff; background: #f0f0f0; overflow-x: auto; }
    .retro-table { width: 100%; border-collapse: collapse; font-size: 10px; background: #fff; }
    .retro-table th { background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: #fff; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 10px; border-bottom: 1px solid #808080; border-right: 1px solid #ccc; }
    .retro-table th:last-child { border-right: none; }
    .retro-table td { padding: 6px 8px; text-align: center; border-bottom: 1px solid #ddd; vertical-align: middle; color: #000; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #e8f0ff; }
    /* Ticket Code & Creator */
    .ticket-cell { text-align: center; }
    .ticket-code { font-family: monospace; color: #0a3a8c; font-weight: bold; font-size: 12px; }
    .ticket-creator { font-size: 9px; color: #555; margin-top: 2px; align-items: center;  gap: 2px;}
    .ticket-title { font-weight: bold; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .ticket-meta { font-size: 9px; color: #666; margin-top: 1px; }
    .date-cell { font-family: monospace; font-size: 12px; white-space: nowrap; color: #666; }
    .priority-badge { display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .priority-critical { background: #cc0000; color: white; }
    .priority-high { background: #ff6600; color: white; }
    .priority-medium { background: #ffcc00; color: #333; }
    .priority-low { background: #008800; color: white; }
    .status-badge { display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 9px; text-transform: uppercase; }
    .status-new { background: #cde8f5; color: #0066cc; }
    .status-assigned { background: #e0e0e0; color: #666; }
    .status-in_progress { background: #fff0cc; color: #cc6600; }
    .status-pending { background: #ffe0cc; color: #cc6600; }
    .status-resolved { background: #ccffcc; color: #008800; }
    .status-closed { background: #f0f0f0; color: #666; }
    .action-cell { text-align: center; white-space: nowrap; display: flex; justify-content: center; align-items: center; gap: 3px; }
    .action-btn { text-align: center; background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 11px; padding: 1px 6px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0ff; }
    .action-btn:active { border-color: #808080 #fff #fff #808080; }
    .empty-row td { text-align: center; padding: 30px; background: #f9f9f9; }
    .empty-state { text-align: center; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
    .empty-state p { margin-bottom: 12px; color: #666; font-size: 10px; }
    .assign-btn { color: #006600; }
    .assign-btn:hover { background: #eeffee; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); min-width: 400px; max-width: 500px; }
    .modal-titlebar { background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%); color: white; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    .modal-body { padding: 16px; }
    .assign-info { font-size: 11px; margin-bottom: 12px; color: #333; }
    .agent-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .agent-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: white; border: 1px solid #ccc; cursor: pointer; }
    .modal-titlebar.resolve { background: linear-gradient(180deg, #008800 0%, #006600 100%); }
    .warning-hint.success { color: #006600; background: #eeffee; border: 1px solid #88cc88; }
    .resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; }
    .agent-item:hover { background: #e8f0ff; }
    .agent-item.selected { background: #cde8f5; border-color: #0a3a8c; }
    .agent-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3); }
    .agent-info { flex: 1; }
    .agent-name { font-size: 11px; font-weight: bold; display: block; color: rgb(0, 0, 0);}
    .agent-role { font-size: 9px; color: #444242; }
    .self-assign { background: #f0f8ff; border-color: #0a3a8c; }
    .self-assign:hover { background: #dde8f5; }
    .agent-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .agent-status { font-size: 8px; padding: 1px 5px; border-radius: 2px; font-weight: bold; display: inline-block; margin-top: 2px; }
    .current-assign { background: #e8f0ff; border: 1px solid #0a3a8c; padding: 6px 10px; margin-bottom: 10px; border-radius: 3px; font-size: 10px; }
    .current-label { color: #666; margin-right: 4px; }
    .current-agent { font-weight: bold; color: #0a3a8c; }
    .resolve-btn { color: #008800; }
    .resolve-btn:hover { background: #eeffee; }
    .delete-list-btn { color: #cc0000; }
    .delete-list-btn:hover { background: #ffecec; color: #aa0000; }
    .warning-content { display: flex; gap: 16px; align-items: flex-start; }
    .warning-icon { font-size: 40px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 8px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-message strong { color: #0a3a8c; font-family: monospace; font-size: 12px; }
    .resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; padding: 4px 8px; background: #f5f5f5; border-radius: 2px; border-left: 3px solid #ccc; word-break: break-word; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; line-height: 1.4; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .status-available { background: #ccffcc; color: #008800; }
    .status-dayoff { background: #ffe0e0; color: #cc0000; }
    .status-onleave { background: #ffe0cc; color: #cc6600; }
    .status-lunch { background: #fffae8; color: #886600; }
    .agent-unavailable { opacity: 0.6; }
    .agent-warning { color: #cc6600; font-size: 14px; flex-shrink: 0; }
    .status-tabs-bar { display: flex; gap: 2px; padding: 4px 6px; background: #e8e8e8; border: 2px solid; border-color: #808080 #fff #fff #808080; margin-bottom: 4px; flex-wrap: wrap; }
    .status-tab { background: #d4d0c8; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px 2px 0 0; padding: 4px 12px; cursor: pointer; font-size: 10px; color: #333; display: inline-flex; align-items: center; gap: 6px; position: relative; top: 1px; }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; border-bottom-color: #fff; font-weight: bold; color: #0a3a8c; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; min-width: 18px; text-align: center; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .tab-count.new-count { background: #0066cc; }
    .tab-count.progress-count { background: #cc6600; }
    .tab-count.resolved-count { background: #008800; }
    .assign-warning { background: #fffae8; border: 1px solid #e0c060; padding: 6px 10px; margin-top: 8px; font-size: 10px; color: #886600; border-radius: 3px; }
    .empty-agents { text-align: center; padding: 20px; color: #888; font-size: 11px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .modal-titlebar.success { background: linear-gradient(180deg, #008800 0%, #006600 100%); }
    .assigned-to-info { margin-top: 6px; font-size: 11px; color: #333; }
    .assigned-to-info strong { color: #0a3a8c; }
    .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 8px; background: #f0f0f0; border: 2px solid; border-color: #808080 #fff #fff #808080; margin-top: 4px; }
    .page-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 3px 12px; cursor: pointer; font-size: 10px; color: #000; }
    .page-btn:hover { background: #e8f0ff; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 10px; color: #333; font-weight: bold; }
    .view-btn { background: #f0f0f0; border: 1px solid #a0a0a0; padding: 2px 8px; cursor: pointer; font-size: 13px; border-radius: 2px; }
    .view-btn:hover { background: #e8f0ff; }
    .view-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .ticket-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; padding: 6px; }
    .ticket-card { background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 14px; cursor: pointer; transition: border-color 0.2s; }
    .agent-checkbox { font-size: 20px; color: #aaa; flex-shrink: 0; margin-left: 8px; }
    .agent-checkbox.checked { color: #0a3a8c; }
    .selected-count { font-weight: bold; color: #0a3a8c; }
    .selected-summary { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #e8f0ff; border: 1px solid #0a3a8c; border-radius: 3px; margin-bottom: 12px; font-size: 10px; }
    .summary-label { color: #666; }
    .summary-count { font-weight: bold; color: #0a3a8c; }
    .ticket-card:hover { border-color: #0a3a8c; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .card-title { font-size: 13px; font-weight: 600; color: #111; margin: 0 0 10px 0; }
    .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 10px; color: #292727; }
    .card-footer { display: flex; justify-content: space-between; font-size: 10px; color: #3a3838; border-top: 1px solid #eee; padding-top: 8px; }
    .kanban-board { display: flex; gap: 8px; padding: 6px; overflow-x: auto; min-height: 400px; }
    .kanban-column { flex: 1; min-width: 200px; background: #f0f0f0; border: 1px solid #c0c0c0; border-radius: 6px; display: flex; flex-direction: column; }
    .kanban-header { padding: 8px 10px; font-weight: bold; font-size: 10px; color: white; border-radius: 6px 6px 0 0; display: flex; align-items: center; gap: 4px; }
    .kb-new { background: #0066cc; }
    .kb-assigned { background: #555; }
    .kb-in_progress { background: #cc6600; }
    .kb-pending { background: #886600; }
    .kb-resolved { background: #008800; }
    .kanban-count { margin-left: auto; background: rgba(255,255,255,0.3); padding: 1px 6px; border-radius: 10px; font-size: 9px; }
    .kanban-cards { padding: 6px; flex: 1; overflow-y: auto; }
    .kanban-card { background: white; border: 1px solid #d0d0d0; border-radius: 4px; padding: 8px; margin-bottom: 5px; cursor: pointer; }
    .kanban-card:hover { border-color: #0a3a8c; }
    .kb-card-title { font-size: 11px; font-weight: 500; color: #111; margin-bottom: 3px; }
    .kb-card-id { font-family: monospace; font-size: 10px; color: #0a3a8c; margin-bottom: 4px; }
    .kb-card-meta { display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #888; }
    .kanban-empty { text-align: center; padding: 15px; color: #999; font-style: italic; font-size: 10px; }
    ::-webkit-scrollbar { width: 12px; height: 12px; }
    ::-webkit-scrollbar-track { background: #d4d0c8; }
    ::-webkit-scrollbar-thumb { background: #a0a0a0; border: 2px solid #d4d0c8; border-radius: 6px; }
    ::-webkit-scrollbar-thumb:hover { background: #808080; }
    /* Origin Column */
    .origin-cell { max-width: 130px; }
    .origin-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }
    .origin-dept {
      font-size: 9px;
      color: #555;
      background: #f5f5f5;
      padding: 1px 4px;
      border-radius: 2px;
    }
    .origin-branch {
      font-size: 8px;
      color: #0a3a8c;
      background: #f0f4ff;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #b8c8e8;
      white-space: nowrap;
    }
  `]
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 15;
  totalPages = 0;
  paginatedTickets: Ticket[] = [];
  currentUser: any;
  apiUrl = environment.apiUrl;
  activeTab = 'all';
  filters = { priority: '' };
  viewMode: string = 'list';
  successTicketNumber: string = '';
  successTicketTitle: string = '';
  successAssignedNames: string = '';
  showAssignModal = false;
  assignTicketData: any = null;
  availableAgents: any[] = [];
  selectedAgentIds: number[] = [];
  showAssignSuccess = false;
  selectedAgentNames: string[] = [];
  showResolveModal = false;
  resolveTicketData: Ticket | null = null;
  showDeleteListModal = false;
  deleteListData: Ticket | null = null;
private updateTimeout: any;
  constructor(
    private ticketService: TicketService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    private notificationService: NotificationService,  
    private clientNotificationService: ClientNotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => { this.currentUser = user; });
    this.route.queryParams.subscribe(params => {
      if (params['search']) this.searchTerm = params['search'];
      if (params['view']) this.viewMode = params['view'];
    });
    const savedView = localStorage.getItem('viewMode');
    if (savedView) this.viewMode = savedView;
    this.loadTickets();
    this.ticketService.tickets$.subscribe(tickets => {
      this.tickets = tickets;
      this.applyFilters();
    });
    this.ticketService.fetchTickets();
  }

  loadTickets() { this.ticketService.fetchTickets(); }
  setActiveTab(tab: string) { this.activeTab = tab; this.applyFilters(); }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.retro-table')) { event.preventDefault(); return false; }
    return true;
  }

  applyFilters() {
  // ✅ Debounce filter updates to prevent flickering
  if (this.updateTimeout) {
    clearTimeout(this.updateTimeout);
  }
  
  this.updateTimeout = setTimeout(() => {
    let filtered = [...this.tickets];
    if (this.activeTab !== 'all') filtered = filtered.filter(t => t.status === this.activeTab);
    if (this.filters.priority) filtered = filtered.filter(t => t.priority === this.filters.priority);
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.ticket_number?.toLowerCase().includes(term) ||
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.location?.toLowerCase().includes(term) ||
        t.priority?.toLowerCase().includes(term)
      );
    }
    this.filteredTickets = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedTickets();
  }, 100);
}
  applySearch() { this.currentPage = 1; this.applyFilters(); }

  kanbanStatuses = [
    { key: 'new', label: 'New', icon: '🆕' },
    { key: 'assigned', label: 'Assigned', icon: '📌' },
    { key: 'in_progress', label: 'In Progress', icon: '⚙️' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'resolved', label: 'Resolved', icon: '✅' }
  ];

  setView(mode: string) { this.viewMode = mode; localStorage.setItem('viewMode', mode); }
  
  private agentNameCache: Map<number, string> = new Map();
  
  getAssignedNames(ticket: Ticket): string {
  if (!ticket) return '—';
  
  const assignedUsers = (ticket as any).assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
    const names = assignedUsers.map((user: any) => {
      if (typeof user === 'object' && user.fullname) {
        if (user.id === this.currentUser?.id) return 'You';
        return user.fullname;
      }
      if (typeof user === 'number') {
        if (user === this.currentUser?.id) return 'You';
        if (this.agentNameCache.has(user)) {
          return this.agentNameCache.get(user);
        }
        // Check if this user is in availableAgents
        const agent = this.availableAgents?.find(a => a.id === user);
        if (agent?.fullname) {
          this.agentNameCache.set(user, agent.fullname);
          return agent.fullname;
        }
        // Only fetch if user is not in availableAgents (should be rare)
        if (!this.availableAgents?.some(a => a.id === user)) {
          this.fetchAgentName(user);
        }
        return `Agent #${user}`;
      }
      return 'Unknown';
    });
    return names.join(', ');
  }
  
  if (ticket.assigned_to) {
    if (ticket.assigned_to === this.currentUser?.id) return 'You';
    // Check if this user is in availableAgents
    const agent = this.availableAgents?.find(a => a.id === ticket.assigned_to);
    if (agent?.fullname) return agent.fullname;
    return ticket.agent_name || `Agent #${ticket.assigned_to}`;
  }
  
  return '—';
}
  private fetchAgentName(userId: number) {
    if (this.agentNameCache.has(userId)) return;
    const headers = this.getHeaders();
    this.http.get<any>(`${environment.apiUrl}/api/users/${userId}`, { headers }).subscribe({
      next: (user) => {
        if (user?.fullname) {
          this.agentNameCache.set(userId, user.fullname);
        }
      },
      error: () => {
        this.http.get<any>(`${environment.apiUrl}/api/new-users/${userId}`, { headers }).subscribe({
          next: (user) => {
            if (user?.fullname) {
              this.agentNameCache.set(userId, user.fullname);
            }
          },
          error: () => {
            this.agentNameCache.set(userId, `Agent #${userId}`);
          }
        });
      }
    });
  }

  getTicketsByStatus(status: string): Ticket[] { 
    return this.filteredTickets.filter(t => t.status === status); 
  }
  
  updatePaginatedTickets() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTickets = this.filteredTickets.slice(start, end);
  }

  goToPage(page: number) { 
    if (page < 1 || page > this.totalPages) return; 
    this.currentPage = page; 
    this.updatePaginatedTickets(); 
  }
  
  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }

  clearFilters() {
    this.activeTab = 'all'; 
    this.filters = { priority: '' }; 
    this.searchTerm = '';
    this.applyFilters(); 
    this.router.navigate(['/tickets']);
  }

  isEDPUser(): boolean { 
    return this.currentUser?.user_table === 'users'; 
  }
  
  isAdmin(): boolean { 
    return this.currentUser?.role === 'admin'; 
  }
  
  // ✅ Head/Manager has same privileges as Admin
  isHeadManager(): boolean { 
    return this.currentUser?.role === 'Head/Manager'; 
  }
  
  // ✅ Combined check: Admin OR Head/Manager
  isAdminOrHeadManager(): boolean {
    return this.isAdmin() || this.isHeadManager();
  }

  canEditTicket(ticket: Ticket): boolean {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    if (!this.isEDPUser()) return false;
    // ✅ Admin OR Head/Manager can edit any ticket
    if (this.isAdminOrHeadManager()) return true;
    return ticket.created_by === this.currentUser?.id;
  }

  canAssignTicket(ticket: Ticket): boolean {
    // ❌ Cannot assign/reassign resolved, closed, in_progress, or pending tickets
    if (['resolved', 'closed', 'in_progress', 'pending'].includes(ticket.status)) {
      return false;
    }
    
    // ✅ Admin OR Head/Manager can reassign if status is 'new' or 'assigned'
    if (ticket.assigned_to) {
      return this.isAdminOrHeadManager() && ['new', 'assigned'].includes(ticket.status);
    }
    
    // ✅ Any EDP user can assign if unassigned
    return this.isEDPUser();
  }

  canResolveTicket(ticket: Ticket): boolean {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    if (ticket.status === 'new') return false;
    // ✅ Admin OR Head/Manager can resolve any ticket
    if (this.isAdminOrHeadManager()) return true;
    return ticket.assigned_to === this.currentUser?.id && ['assigned', 'in_progress', 'pending'].includes(ticket.status);
  }

  canDeleteFromList(ticket: Ticket): boolean {
    // ✅ Admin OR Head/Manager can delete any ticket regardless of status
    if (this.isAdminOrHeadManager()) return true;
    
    // Non-admin: Only creator can delete if ticket is new and unassigned
    return ticket.created_by === this.currentUser?.id && 
           ticket.status === 'new' && 
           !ticket.assigned_to;
  }

  assignTicket(ticket: Ticket) {
    this.assignTicketData = ticket;
    
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

  toggleAgent(agent: any) {
    if (!agent || !agent.id) return;
    const index = this.selectedAgentIds.indexOf(agent.id);
    if (index === -1) this.selectedAgentIds.push(agent.id);
    else this.selectedAgentIds.splice(index, 1);
  }

  isAgentSelected(agent: any): boolean { 
    return agent && agent.id ? this.selectedAgentIds.includes(agent.id) : false; 
  }

  private getHeaders(): any {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

 // Add this helper method at the top of your methods section
private isEDPITDepartment(department: string): boolean {
  if (!department) return false;
  const dept = department.toLowerCase().trim();
  return dept === 'edp' || dept === 'it' || 
         dept === 'edp/it' || dept === 'it/edp' ||
         dept.includes('edp') || dept.includes('it');
}

loadAvailableAgents() {
  const currentUserId = this.authService.getCurrentUser()?.id;
  const currentUserBranch = this.currentUser?.branch_id;
  const headers = this.getHeaders();
  
  console.log('🔍 Loading available agents (EDP/IT only from same branch)...');
  console.log('📍 Current user branch:', currentUserBranch);
  
  this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
    next: (users) => {
      // ✅ Filter: Only users from EDP/IT department AND same branch
      const edpITUsers = users.filter(u => {
        const isEDPIT = this.isEDPITDepartment(u.department);
        const isSameBranch = currentUserBranch ? u.branch_id === currentUserBranch : true;
        return isEDPIT && isSameBranch && u.id !== currentUserId;
      });
      
      console.log(`📋 Found ${edpITUsers.length} EDP/IT agents from same branch`);
      
      // Also check new_user table
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
        next: (newUsers) => {
          const edpITNewUsers = newUsers.filter(u => {
            const isEDPIT = this.isEDPITDepartment(u.department);
            const isSameBranch = currentUserBranch ? u.branch_id === currentUserBranch : true;
            return isEDPIT && isSameBranch && u.id !== currentUserId;
          });
          
          this.availableAgents = [...edpITUsers, ...edpITNewUsers];
          console.log(`✅ Total EDP/IT agents (same branch): ${this.availableAgents.length}`);
        },
        error: () => {
          this.availableAgents = edpITUsers;
          console.log(`✅ EDP/IT agents (without new_users): ${this.availableAgents.length}`);
        }
      });
    },
    error: (err) => {
      console.error('❌ Error loading agents:', err);
      this.loadAgentsFromTickets();
    }
  });
}

// Fallback method: load agents from tickets
private loadAgentsFromTickets() {
  const assignedUserIds = new Set<number>();
  this.tickets.forEach(t => {
    if (t.assigned_to) {
      assignedUserIds.add(t.assigned_to);
    }
    const assignedUsers = (t as any).assigned_users;
    if (assignedUsers && Array.isArray(assignedUsers)) {
      assignedUsers.forEach((u: any) => {
        if (u.id) assignedUserIds.add(u.id);
      });
    }
  });
  
  // Try to fetch user details for these IDs
  const headers = this.getHeaders();
  const userIds = Array.from(assignedUserIds);
  
  if (userIds.length === 0) {
    this.availableAgents = [];
    return;
  }
  
  // Fetch each user individually or in batch
  // For simplicity, we'll just set availableAgents to empty
  this.availableAgents = [];
  console.warn('⚠️ Could not load agents, using empty list');
}

  confirmAssign() {
  if (this.selectedAgentIds.length === 0 || !this.assignTicketData) return;
  
  this.selectedAgentNames = [];
  
  const assignedUsersData = this.selectedAgentIds.map(id => {
      if (id === this.currentUser?.id) {
          this.selectedAgentNames.push(this.currentUser?.fullname);
          return { id: id, fullname: this.currentUser?.fullname };
      }
      const agent = this.availableAgents.find(a => a.id === id);
      const name = agent?.fullname || `Agent #${id}`;
      this.selectedAgentNames.push(name);
      return { id: id, fullname: name };
  });
  
  const updateData: any = {
      assigned_to: this.selectedAgentIds[0],
      assigned_users: assignedUsersData,
      status: this.assignTicketData.status === 'new' ? 'assigned' : this.assignTicketData.status
  };
  
  const allAssignedNames = [...this.selectedAgentNames];
  const adminName = this.currentUser?.fullname;
  
  if (!adminName) {
      alert('User session expired. Please refresh.');
      return;
  }
  
  // ✅ Disable polling temporarily to prevent race condition
  this.ticketService.pausePolling();
  
  this.ticketService.updateTicket(this.assignTicketData.id, updateData).subscribe({
      next: (updatedTicket) => {
          // ✅ Update the ticket in the local array immediately
          const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
          if (index !== -1) { 
              // ✅ Preserve the assigned_users data from the update
              updatedTicket = {
                  ...updatedTicket,
                  assigned_users: assignedUsersData,
                  assigned_to: this.selectedAgentIds[0]
              };
              this.tickets[index] = updatedTicket; 
              this.applyFilters(); 
          }
          
          // ✅ Send notifications
          this.notificationService.handleTicketAssigned(
              updatedTicket,
              adminName,
              allAssignedNames.join(', '),
              this.selectedAgentIds[0]
          );
          const assignedNames = assignedUsersData.map((u: any) => u.fullname).join(', ');
          this.clientNotificationService.handleTicketAssigned(
              updatedTicket,
              adminName,
              updatedTicket.created_by, 
              assignedNames
          );
          
          // ✅ Resume polling after a delay
          setTimeout(() => {
              this.ticketService.resumePolling();
          }, 1000);
          
          this.closeAssignModal(); 
          this.successTicketNumber = updatedTicket.ticket_number;
          this.successTicketTitle = updatedTicket.title;
          this.successAssignedNames = this.selectedAgentNames.join(', ');
          this.showAssignSuccess = true;
      },
      error: (err) => { 
          console.error('Assign error:', err);
          // ✅ Resume polling even on error
          this.ticketService.resumePolling();
          alert('Error assigning ticket: ' + (err.error?.message || err.message)); 
      }
  });
}
  closeAssignSuccess() { 
    this.showAssignSuccess = false;
    this.assignTicketData = null;
    this.selectedAgentIds = []; 
    this.selectedAgentNames = [];
  }

  closeAssignModal() { 
    this.showAssignModal = false; 
    this.assignTicketData = null; 
    this.selectedAgentIds = []; 
  }

  getAgentStatus(agent: any): { label: string; class: string } | null {
    if (!agent) return null;
    if (this.isOnLeave(agent)) return { label: 'On Leave', class: 'status-onleave' };
    if (this.isDayOff(agent)) return { label: 'Day Off', class: 'status-dayoff' };
    if (this.isLunchBreak(agent)) return { label: 'Lunch Break', class: 'status-lunch' };
    return { label: 'Available', class: 'status-available' };
  }

  resolveTicket(ticket: Ticket) { 
    this.resolveTicketData = ticket; 
    this.showResolveModal = true; 
  }

  confirmResolve() {
    if (!this.resolveTicketData) return;
    
    const adminName = this.currentUser?.fullname;
    if (!adminName) {
        alert('User session expired. Please refresh.');
        return;
    }
    
    this.ticketService.updateTicket(this.resolveTicketData.id, { 
        status: 'resolved', 
        resolved_at: new Date().toISOString() 
    }).subscribe({
        next: (updatedTicket) => {
            const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
            if (index !== -1) { 
                this.tickets[index] = updatedTicket; 
                this.applyFilters(); 
            }
            
            this.notificationService.handleStatusChange(
                updatedTicket,
                'resolved',
                adminName
            );
            
            this.clientNotificationService.handleStatusChange(
                updatedTicket,
                'resolved',
                adminName,
                updatedTicket.created_by
            );
            
            this.closeResolveModal();
        },
        error: (err) => { 
            this.closeResolveModal(); 
            alert('Error: ' + (err.error?.message || err.message)); 
        }
    });
  }

  closeResolveModal() { 
    this.showResolveModal = false; 
    this.resolveTicketData = null; 
  }

  isOnLeave(agent: any): boolean {
    if (!agent?.leaveEntries) return false;
    try {
      const leaves = typeof agent.leaveEntries === 'string' ? JSON.parse(agent.leaveEntries) : agent.leaveEntries;
      const today = new Date(); 
      today.setHours(0,0,0,0);
      return leaves.some((l: any) => { 
        const s = new Date(l.startDate), e = new Date(l.endDate); 
        return today >= s && today <= e; 
      });
    } catch { return false; }
  }

  isDayOff(agent: any): boolean {
    if (!agent?.dayOff) return false;
    try {
      const dayOffArr = typeof agent.dayOff === 'string' ? JSON.parse(agent.dayOff) : agent.dayOff;
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      return dayOffArr.includes(dayNames[new Date().getDay()]);
    } catch { return false; }
  }

  isLunchBreak(agent: any): boolean {
    if (!agent?.lunchStart || !agent?.lunchEnd) return false;
    const now = new Date(), ct = now.getHours()*60+now.getMinutes();
    const [sh, sm] = agent.lunchStart.split(':').map(Number), [eh, em] = agent.lunchEnd.split(':').map(Number);
    return ct >= sh*60+sm && ct <= eh*60+em;
  }

  isAgentUnavailable(agent: any): boolean { 
    return this.isOnLeave(agent) || this.isDayOff(agent) || this.isLunchBreak(agent); 
  }

  hasUnavailableSelected(): boolean {
    return this.selectedAgentIds.some(id => {
      if (id === this.currentUser?.id) return this.isAgentUnavailable(this.currentUser);
      const agent = this.availableAgents.find(a => a.id === id);
      return agent ? this.isAgentUnavailable(agent) : false;
    });
  }

  deleteTicketFromList(ticket: Ticket) { 
    this.deleteListData = ticket; 
    this.showDeleteListModal = true; 
  }

  confirmDeleteFromList() {
    if (!this.deleteListData) return;
    
    const ticketId = this.deleteListData.id;
    console.log('🗑️ Attempting to delete ticket:', ticketId, this.deleteListData.ticket_number);
    
    this.ticketService.deleteTicket(ticketId).subscribe({
        next: (response) => { 
            console.log('✅ Delete response:', response);
            this.tickets = this.tickets.filter(t => t.id !== ticketId); 
            this.applyFilters(); 
            this.closeDeleteListModal(); 
        },
        error: (err) => { 
            console.error('❌ Delete error:', err);
            this.closeDeleteListModal(); 
            alert('Error deleting ticket: ' + (err.error?.error || err.message)); 
        }
    });
  }

  closeDeleteListModal() { 
    this.showDeleteListModal = false; 
    this.deleteListData = null; 
  }

  getStatusCount(status: string): number { 
    return this.tickets.filter(t => t.status === status).length; 
  }

  viewTicket(id: number) { 
    this.router.navigate(['/tickets', id]); 
  }

  editTicket(id: number) { 
    this.router.navigate(['/tickets', id, 'edit']); 
  }

  newTicket() { 
    this.router.navigate(['/tickets/new']); 
  }
}