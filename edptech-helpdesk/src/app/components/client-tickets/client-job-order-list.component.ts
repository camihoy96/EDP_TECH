import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-job-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
   <div class="jo-list-container">
  <div class="view-header">
    <h2>📋 {{ viewMode === 'our' ? 'Our Job Orders' : 'J.O. Request Management' }}</h2>
    <div class="header-actions">
      <button class="classic-btn" [class.active]="viewMode === 'our'" (click)="setViewMode('our')">
        📤 Our Job Orders
      </button>
      <button class="classic-btn" [class.active]="viewMode === 'incoming'" (click)="setViewMode('incoming')">
        📥 J.O. Request Management
      </button>
      <button class="classic-btn primary" routerLink="/client/job-orders/new">
        <span>➕</span> New Job Order
      </button>
    </div>
  </div>

<div class="status-tabs-bar" *ngIf="jobOrders.length > 0">
    <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
      📋 All <span class="tab-count">{{ getFilteredStatusCount('all') }}</span>
    </button>
    <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
      ⏳ Pending <span class="tab-count pending-count">{{ getFilteredStatusCount('pending') }}</span>
    </button>
    <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
      📥 Received <span class="tab-count approved-count">{{ getFilteredStatusCount('approved') }}</span>
    </button>
    <!-- ✅ Add Assigned tab -->
    <button class="status-tab" [class.active]="activeTab === 'assigned'" (click)="setActiveTab('assigned')">
      👤 Assigned <span class="tab-count assigned-count">{{ getFilteredStatusCount('assigned') }}</span>
    </button>
    <!-- ✅ Add Forwarded tab -->
    <button class="status-tab" [class.active]="activeTab === 'forwarded'" (click)="setActiveTab('forwarded')">
      📤 Forwarded <span class="tab-count forwarded-count">{{ getFilteredStatusCount('forwarded') }}</span>
    </button>
    <button class="status-tab" [class.active]="activeTab === 'done'" (click)="setActiveTab('done')">
      ✅ Done <span class="tab-count done-count">{{ getFilteredStatusCount('done') }}</span>
    </button>
    <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">
      ❌ Rejected <span class="tab-count rejected-count">{{ getFilteredStatusCount('rejected') }}</span>
    </button>
  </div>

  <!-- Filter Bar -->
  <div class="filter-bar">
    <div class="filter-group">
      <label>Branch:</label>
      <select class="classic-select" [(ngModel)]="filters.branchId" (change)="onFilterBranchChange()">
        <option value="">All Branches</option>
        <option *ngFor="let branch of filteredBranches" [value]="branch.id">
          🏢 {{ branch.name }} <small>({{ branch.company_name || '' }})</small>
        </option>
      </select>
    </div>
    <div class="filter-group">
      <label>Dept:</label>
      <select class="classic-select" [(ngModel)]="filters.departmentId" (change)="applyFilters()">
        <option value="">All Departments</option>
        <option *ngFor="let dept of filteredFilterDepartments" [value]="dept.id">
          {{ dept.displayName || dept.name }}
        </option>
      </select>
    </div>
    <div class="filter-group search-group">
      <label>Search:</label>
      <input type="text" class="classic-input" placeholder="JO #, name..." 
             [(ngModel)]="searchTerm" (input)="applyFilters()">
    </div>
    <button class="classic-btn" (click)="clearFilters()">
      <span>🔄</span> Clear
    </button>
  </div>

  <div class="classic-status-bar">
    <span>View: <strong>{{ viewMode === 'our' ? '📤 Our Job Orders' : '📥 J.O. Management' }}</strong></span>
    <span class="status-sep">|</span>
    <span>Showing: <strong>{{ filteredOrders.length }}</strong> job orders</span>
    <span class="status-sep">|</span>
    <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
    <span class="status-sep">|</span>
    <span>Branch: <strong>{{ currentUser?.branch_name || 'All' }}</strong></span>
    <span class="status-sep">|</span>
    <span>Dept: <strong>{{ currentUser?.department || currentUser?.department_name || 'All' }}</strong></span>
</div>

  <!-- Table -->
  <div class="classic-table-container">
    <table class="classic-table" *ngIf="filteredOrders.length > 0">
      <thead>
        <tr>
          <th>JO Code</th>
          <th>ATTN</th>
          <th>Date</th>
          <th>{{ viewMode === 'our' ? 'Recipient' : 'Request From' }}</th>
          <th>{{ viewMode === 'our' ? 'Forwarded To' : 'Forwarded From' }}</th>
          <th>Description</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let jo of filteredOrders" (click)="openViewModal(jo)" class="clickable-row">
          <td class="jo-num">
            <code>{{ jo.job_order_number || 'N/A' }}</code>
            <div class="creator-info" *ngIf="jo.requested_name">
              <span class="creator-label">by: {{ jo.requested_name }}</span>
            </div>
          </td>
          <td class="attn-cell">
  <div class="attn-info">
    <span>{{ jo.job_order_for || '—' }}</span>
    <span class="role-tag-tiny" *ngIf="jo.job_order_for">
      {{ getAttnRole(jo.job_order_for) }}
    </span>
  </div>
</td>
          <td class="date-cell">
  {{ formatDate(jo.date) }}
  <div class="time-small" *ngIf="jo.time">{{ formatTime(jo.time) }}</div>
</td>
          <td>
            <ng-container *ngIf="viewMode === 'our'">
              <span class="dept-name-small">{{ getDepartmentName(jo.department_id) || jo.department || '—' }}</span>
              <span class="branch-tag-tiny" *ngIf="getBranchName(jo.branch_id)">🏢 {{ getBranchName(jo.branch_id) }}</span>
              <span class="company-tag-tiny" *ngIf="jo.branch_id">{{ getBranchCompany(jo.branch_id) }}</span>
            </ng-container>
            <ng-container *ngIf="viewMode === 'incoming'">
              <span class="dept-name-small">{{ jo.request_dept || jo.department || '—' }}</span>
              <span class="branch-tag-tiny" *ngIf="getBranchName(jo.branch_id)">🏢 {{ getBranchName(jo.branch_id) }}</span>
              <span class="company-tag-tiny" *ngIf="jo.branch_id">{{ getBranchCompany(jo.branch_id) }}</span>
            </ng-container>
          </td>
        <td>
  <!-- Show forwarded info if forwarded -->
  <ng-container *ngIf="jo.is_forwarded">
    <ng-container *ngIf="viewMode === 'our'">
      <span class="forward-label">📤 {{ getBranchName(jo.forwarded_to_branch_id) || '—' }}</span>
      <span class="forward-dept">{{ getDepartmentName(jo.forwarded_to_department_id) || '—' }}</span>
      <span class="forward-company">{{ getBranchCompany(jo.forwarded_to_branch_id) }}</span>
    </ng-container>
    <ng-container *ngIf="viewMode === 'incoming'">
      <span class="forward-label">📥 {{ getBranchName(jo.branch_id) || '—' }}</span>
      <span class="forward-dept">{{ getDepartmentName(jo.department_id) || jo.department || '—' }}</span>
      <span class="forward-company">{{ getBranchCompany(jo.branch_id) }}</span>
      <span class="forward-by" *ngIf="jo.forwarded_by_name">by: {{ jo.forwarded_by_name }}</span>
    </ng-container>
  </ng-container>
  <!-- Not forwarded -->
  <span *ngIf="!jo.is_forwarded" style="color: #ccc;">—</span>
</td>
          <td class="desc-cell">{{ jo.particulars || jo.remarks || '—' }}</td>
        <td>
  <span class="status-badge" [class]="'status-' + (jo.status || 'pending')">
    {{ getStatusLabel(jo.status) }}
  </span>
  <!-- ✅ Show forwarded sub-status -->
  <div class="status-forwarded-sub" *ngIf="jo.is_forwarded && jo.forwarded_status">
    ↳ {{ getStatusLabel(jo.forwarded_status) }}
  </div>
  <!-- Show assigned names under status -->
  <div class="assigned-under-status" *ngIf="jo.assigned_names">
    <span class="assigned-to-label">to: {{ jo.assigned_names }}</span>
  </div>
  <!-- Show received by -->
  <div class="received-by" *ngIf="jo.status === 'approved' && jo.received_name">
    by: {{ jo.received_name }}
  </div>
  <!-- Show done by -->
  <div class="received-by" *ngIf="jo.status === 'done' && jo.done_name">
    done by: {{ jo.done_name }}
  </div>
</td>
          <td (click)="$event.stopPropagation()">
  <!-- Our Job Orders actions -->
  <ng-container *ngIf="viewMode === 'our'">
    <button class="action-btn edit-btn" *ngIf="canModify(jo)" (click)="editJobOrder(jo)" title="Edit">✏️</button>
    <button class="action-btn done-btn" *ngIf="jo.status === 'assigned' && isHeadOrSupervisor()" (click)="markAsDone(jo)" title="Mark as Done">✅</button>
    <button class="action-btn view-btn" (click)="openViewModal(jo)" title="View">👁️</button>
    <button class="action-btn print-btn" (click)="printJobOrder(jo)" title="Print">🖨️</button>
    <button class="action-btn delete-btn" *ngIf="canModify(jo)" (click)="deleteJobOrder(jo)" title="Delete">🗑️</button>
  </ng-container>

 <!-- J.O. Management actions -->
<ng-container *ngIf="viewMode === 'incoming'">
    <button class="action-btn edit-btn" *ngIf="jo.status === 'pending' && isHeadOrSupervisor()" (click)="editJobOrder(jo)" title="Edit">✏️</button>
    <button class="action-btn accept-btn" *ngIf="jo.status === 'pending'" (click)="receiveJobOrder(jo)" title="Receive">📥</button>
    <button class="action-btn forward-btn" *ngIf="jo.status === 'approved' && isHeadOrSupervisor()" (click)="forwardJobOrder(jo)" title="Forward">📤</button>
    
    <!-- ✅ Assign for forwarded (when forwarded_status is empty/approved) -->
    <button class="action-btn assign-btn" *ngIf="jo.is_forwarded && jo.status === 'forwarded' && !jo.forwarded_status && isHeadOrSupervisor()" (click)="openAssignModal(jo)" title="Assign">👤</button>
    
    <!-- ✅ Assign for normal approved -->
    <button class="action-btn assign-btn" *ngIf="!jo.is_forwarded && jo.status === 'approved' && isHeadOrSupervisor()" (click)="openAssignModal(jo)" title="Assign">👤</button>
    
    <!-- ✅ Done for forwarded assigned -->
    <button class="action-btn done-btn" *ngIf="jo.is_forwarded && jo.forwarded_status === 'assigned' && isHeadOrSupervisor()" (click)="markAsDone(jo)" title="Mark as Done">✅</button>
    
    <!-- ✅ Done for normal assigned -->
    <button class="action-btn done-btn" *ngIf="!jo.is_forwarded && jo.status === 'assigned' && isHeadOrSupervisor()" (click)="markAsDone(jo)" title="Mark as Done">✅</button>
    
    <button class="action-btn view-btn" (click)="openViewModal(jo)" title="View">👁️</button>
    <button class="action-btn print-btn" (click)="printJobOrder(jo)" title="Print">🖨️</button>
    <button class="action-btn delete-btn" *ngIf="isHeadOrSupervisor()" (click)="deleteJobOrder(jo)" title="Delete">🗑️</button>
</ng-container>
</td>
        </tr>
      </tbody>
    </table>
    <div class="empty-state" *ngIf="filteredOrders.length === 0">
      <span class="empty-icon">📭</span>
      <p>No job orders found</p>
    </div>
  </div>
</div>

<!-- Delete Modal -->
<div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar danger" (mousedown)="startDrag($event)" style="cursor: grab;">
      <span>🗑️ Delete Job Order</span>
      <button type="button" (click)="cancelDelete()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Delete this job order?</h3>
          <p>Job Order: <strong>#{{ deleteTarget?.job_order_number }}</strong></p>
          <p class="warning-hint danger-text">This action cannot be undone.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelDelete()">Cancel</button>
        <button class="classic-btn danger" (click)="confirmDelete()">🗑️ Delete</button>
      </div>
    </div>
  </div>
</div>
<!-- View Job Order Modal -->
<div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
  <div class="modal-window view-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab;">
      <span>📋 Job Order Details</span>
      <button type="button" (click)="closeViewModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body view-body" *ngIf="viewJO">
      <div class="view-header-info">
        <div class="view-req-number">
          <span class="view-label">JO #:</span>
          <code>{{ viewJO.job_order_number }}</code>
        </div>
        <span class="status-badge" [class]="'status-' + (viewJO.status || 'pending')">
          {{ getStatusLabel(viewJO.status) }}
        </span>
      </div>
      
      <div class="view-grid">
        <div class="view-field"><label>Date:</label><span>{{ formatDate(viewJO.date) }}</span></div>
        <div class="view-field"><label>Time:</label><span>{{ formatTime(viewJO.time) }}</span></div>
        
        <!-- Creator Interface ("Our Job Orders") -->
        <ng-container *ngIf="viewMode === 'our'">
          <div class="view-field"><label>Recipient:</label><span>{{ getDepartmentName(viewJO.department_id) || viewJO.department || '—' }}</span></div>
          <div class="view-field"><label>Branch:</label><span>🏢 {{ getBranchName(viewJO.branch_id) || '—' }}</span></div>
          <div class="view-field full-width"><label>Company:</label><span>{{ getBranchCompany(viewJO.branch_id) || '—' }}</span></div>
        </ng-container>
        
        <!-- Recipient Interface ("J.O. Management") -->
        <ng-container *ngIf="viewMode === 'incoming'">
          <div class="view-field"><label>J.O. From:</label><span>{{ viewJO.request_dept || '—' }}</span></div>
          <div class="view-field"><label>Branch:</label><span>🏢 {{ getBranchName(viewJO.branch_id) || '—' }}</span></div>
          <div class="view-field full-width"><label>Company:</label><span>{{ getBranchCompany(viewJO.branch_id) || '—' }}</span></div>
        </ng-container>
        
        <div class="view-field"><label>Job For:</label><span>{{ viewJO.job_order_for || '—' }}</span></div>
        <div class="view-field full-width"><label>Requested By:</label><span>{{ viewJO.requested_name || '—' }}</span></div>
      </div>

      <!-- Forwarded Information -->
      <div class="view-section" *ngIf="viewJO.is_forwarded">
        <h4>📤 Forward Information</h4>
        <div class="view-grid">
          <ng-container *ngIf="viewMode === 'our'">
            <div class="view-field"><label>Forwarded To:</label><span>🏢 {{ getBranchName(viewJO.forwarded_to_branch_id) || '—' }}</span></div>
            <div class="view-field"><label>Department:</label><span>{{ getDepartmentName(viewJO.forwarded_to_department_id) || '—' }}</span></div>
            <div class="view-field"><label>Company:</label><span>{{ getBranchCompany(viewJO.forwarded_to_branch_id) || '—' }}</span></div>
          </ng-container>
          <ng-container *ngIf="viewMode === 'incoming'">
            <div class="view-field"><label>Forwarded From:</label><span>🏢 {{ getBranchName(viewJO.branch_id) || '—' }}</span></div>
            <div class="view-field"><label>Department:</label><span>{{ getDepartmentName(viewJO.department_id) || viewJO.department || '—' }}</span></div>
            <div class="view-field"><label>Company:</label><span>{{ getBranchCompany(viewJO.branch_id) || '—' }}</span></div>
          </ng-container>
          <div class="view-field"><label>Forwarded By:</label><span>{{ viewJO.forwarded_by_name || '—' }}</span></div>
          <div class="view-field"><label>Forwarded Date:</label><span>{{ formatDate(viewJO.forwarded_date) }}</span></div>
        </div>
      </div>

      <!-- Assigned Users -->
      <div class="view-section" *ngIf="viewJO.assigned_names || viewJO.assigned_users">
        <h4>👤 Assigned To</h4>
        <div class="assigned-info">
          <span class="assigned-names">{{ viewJO.assigned_names || '—' }}</span>
        </div>
      </div>
      
      <!-- Description -->
      <div class="view-section">
        <h4>📝 Description</h4>
        <div class="view-remarks">{{ viewJO.particulars || viewJO.remarks || 'No description provided.' }}</div>
      </div>

      <!-- Signatures -->
      <div class="view-section">
        <h4>✍️ Signatures</h4>
        <div class="view-signatures">
          <!-- Requested By -->
          <div class="view-sig-block">
            <h5>Requested By</h5>
            <div class="view-sig-image" *ngIf="viewJO.requested_signature">
              <img [src]="viewJO.requested_signature" alt="Requested Signature">
            </div>
            <div class="view-sig-image" *ngIf="!viewJO.requested_signature">
              <span class="no-sig-text">No signature</span>
            </div>
            <div class="view-sig-name">{{ viewJO.requested_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(viewJO.requested_date) }}</div>
          </div>
          
          <!-- Approved By -->
          <div class="view-sig-block">
            <h5>Approved By</h5>
            <div class="view-sig-image" *ngIf="viewJO.approved_signature">
              <img [src]="viewJO.approved_signature" alt="Approved Signature">
            </div>
            <div class="view-sig-image" *ngIf="!viewJO.approved_signature">
              <span class="no-sig-text">No signature</span>
            </div>
            <div class="view-sig-name">{{ viewJO.approved_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(viewJO.approved_date) || '—' }}</div>
          </div>
          
          <!-- Received By -->
          <div class="view-sig-block">
            <h5>Received By</h5>
            <div class="view-sig-image" *ngIf="viewJO.received_signature">
              <img [src]="viewJO.received_signature" alt="Received Signature">
            </div>
            <div class="view-sig-image" *ngIf="!viewJO.received_signature">
              <span class="no-sig-text">No signature</span>
            </div>
            <div class="view-sig-name">{{ viewJO.received_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(viewJO.received_date) || '—' }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="printJobOrder(viewJO)">🖨️ Print</button>
      <button class="classic-btn" (click)="closeViewModal()">Close</button>
    </div>
  </div>
</div>
<!-- Assign Job Order Modal -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window assign-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab; background: #0a3a8c;">
      <span>👤 Assign Job Order</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 11px; margin-bottom: 8px;">
        Assigning: <strong>#{{ assignTargetJO?.job_order_number }}</strong>
      </p>
      <p style="font-size: 10px; color: #666; margin-bottom: 12px;">
        Select users from your department to handle this job order:
      </p>
      
      <div class="recipient-list">
        <div class="recipient-item" *ngFor="let user of availableRecipients"
             [class.selected]="isRecipientSelected(user)"
             (click)="toggleRecipient(user)">
          <span class="recipient-avatar" [style.background]="user.avatar_color || '#3b82f6'">
            {{ user.fullname?.charAt(0)?.toUpperCase() || '?' }}
          </span>
          <div class="recipient-info">
            <span class="recipient-name">{{ user.fullname }}</span>
            <span class="recipient-role">{{ user.role | titlecase }}</span>
          </div>
          <span class="recipient-checkbox" [class.checked]="isRecipientSelected(user)">
            {{ isRecipientSelected(user) ? '☑' : '☐' }}
          </span>
        </div>
        <div class="empty-recipients" *ngIf="availableRecipients.length === 0">
          <p>No users found in this department.</p>
        </div>
      </div>
      
      <div class="selected-summary" *ngIf="selectedRecipientIds.length > 0">
        <span class="summary-label">Selected:</span>
        <span class="summary-count">{{ selectedRecipientIds.length }} user(s)</span>
      </div>
      
      <div class="modal-actions">
        <button class="classic-btn" (click)="closeAssignModal()">Cancel</button>
        <button class="classic-btn primary" (click)="confirmAssignJO()" [disabled]="selectedRecipientIds.length === 0">
          ✅ Assign ({{ selectedRecipientIds.length }})
        </button>
      </div>
    </div>
  </div>
</div>
<!-- Forward Job Order Modal -->
<div class="modal-overlay" *ngIf="showForwardModal" (click)="cancelForward()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab; background: #0a3a8c;">
      <span>📤 Forward Job Order</span>
      <button type="button" (click)="cancelForward()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 11px; margin-bottom: 12px;">
        Forwarding: <strong>#{{ forwardTargetJO?.job_order_number }}</strong>
      </p>
      <div style="margin-bottom: 12px;">
        <label style="font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">Forward To Branch:</label>
        <select [(ngModel)]="forwardBranchId" class="classic-select" style="width: 100%;" (change)="onForwardBranchChange()">
          <option value="">— Select Branch —</option>
          <option *ngFor="let branch of filteredBranches" [value]="branch.id">
            🏢 {{ branch.name }} <small>({{ branch.company_name || '' }})</small>
          </option>
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">Forward To Department:</label>
        <select [(ngModel)]="forwardDepartmentId" class="classic-select" style="width: 100%;" [disabled]="!forwardBranchId">
          <option value="">— Select Department —</option>
          <option *ngFor="let dept of forwardFilteredDepartments" [value]="dept.id">
            {{ dept.displayName || dept.name }}
          </option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelForward()">Cancel</button>
        <button class="classic-btn primary" (click)="confirmForward()" [disabled]="!forwardBranchId || !forwardDepartmentId">
          📤 Forward
        </button>
      </div>
    </div>
  </div>
</div>
<!-- Done Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDoneModal" (click)="cancelDone()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab; background: #008800;">
      <span>✅ Mark Job Order as Done</span>
      <button type="button" (click)="cancelDone()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">✅</span>
        <div class="warning-message">
          <h3>Mark this job order as done?</h3>
          <p>Job Order: <strong>#{{ doneTargetJO?.job_order_number }}</strong></p>
          <p class="resolve-title">"{{ doneTargetJO?.requested_name || 'Unknown' }} - {{ doneTargetJO?.request_dept || 'N/A' }}"</p>
          <p class="warning-hint" style="color: #008800; background: #eeffee; border: 1px solid #88cc88;">
            This will mark the job order as <strong>Done</strong>. The requester will be notified that the work has been completed.
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelDone()">Cancel</button>
        <button class="classic-btn primary" (click)="confirmDone()" style="background: #008800; border-color: #008800;">✅ Yes, Mark as Done</button>
      </div>
    </div>
  </div>
</div>
<!-- Toast -->
<div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
  <span>{{ toastMessage }}</span>
</div>
  `,
  styles: [`
    .jo-list-container { padding: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #0a246a; }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }
    .header-actions { display: flex; gap: 6px; align-items: center; }
    .classic-btn { background: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 3px; padding: 5px 14px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; color: #000; }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.primary:hover { background: #1a3a8a; }
    .classic-btn.active { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.danger { background: #cc0000; color: white; border-color: #cc0000; }
    .classic-btn.danger:hover { background: #aa0000; }
    .status-tabs-bar { display: flex; gap: 2px; padding: 4px 6px; background: #e8e8e8; border: 1px solid #a0a0a0; margin-bottom: 6px; flex-wrap: wrap; }
    .status-tab { background: #d4d0c8; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px 2px 0 0; padding: 5px 12px; cursor: pointer; font-size: 10px; color: #333; display: inline-flex; align-items: center; gap: 6px; }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .tab-count.pending-count { background: #cc6600; }
    .tab-count.approved-count { background: #008800; }
    .tab-count.done-count { background: #0066cc; }
    .tab-count.rejected-count { background: #cc0000; }
    .filter-bar { background: #f0f0f0; border: 1px solid #a0a0a0; padding: 6px 10px; display: flex; gap: 12px; align-items: center; margin-bottom: 4px; flex-wrap: wrap; }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 10px; font-weight: bold; color: #000; }
    .classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 10px; background: white; }
    .search-group .classic-input { width: 160px; }
    .classic-status-bar { background: #f0f0f0; border: 1px solid #a0a0a0; border-top: none; padding: 3px 10px; font-size: 10px; color: #333; display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .status-sep { color: #b0b0b0; }
    .classic-table-container { border: 1px solid #a0a0a0; background: white; overflow-x: auto; }
    .classic-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .classic-table th { background: #0a246a; color: white; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 10px; border-right: 1px solid rgba(255,255,255,0.2); white-space: nowrap; }
    .classic-table th:last-child { border-right: none; }
    .classic-table td { padding: 7px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; color: #000; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #e8f0fe; }
    code { font-family: 'Courier New', monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .branch-tag-tiny { font-size: 8px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
    .company-tag-tiny { font-size: 7px; background: #fff8e8; color: #886600; padding: 1px 4px; border-radius: 2px; border: 1px solid #e6d88a; white-space: nowrap; display: block; margin-top: 1px; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-done { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0fe; border-color: #a0a0a0; }
    .edit-btn:hover { color: #0066cc; }
    .print-btn:hover { color: #008800; }
    .delete-btn:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }
    .empty-state { text-align: center; padding: 40px; }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 100%; max-width: 420px; }
    .modal-titlebar { background: #0a246a; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; }
    .modal-titlebar.danger { background: #cc0000; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 3px 8px; font-size: 14px; }
    .modal-body { padding: 16px; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-message strong { color: #0a3a8c; font-family: monospace; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; font-size: 12px; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc6600; }
    .jo-num { text-align: center; }
.creator-info { font-size: 9px; color: #666; margin-top: 3px; border-top: 1px dotted #c0c0c0; padding-top: 3px; display: flex; align-items: center; justify-content: center; gap: 3px; }
.creator-label { color: #0a3a8c; font-weight: 600; font-size: 9px; background: #f0f4ff; padding: 1px 6px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
.date-cell { font-family: monospace; font-size: 10px; white-space: nowrap; color: #555; }
.desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; display: block; }
.accept-btn { color: #008800; }
.accept-btn:hover { background: #eeffee; border-color: #008800; color: #008800; }
.forward-btn { color: #0a3a8c; }
.forward-btn:hover { background: #e8f0ff; border-color: #0a3a8c; color: #0a3a8c; }
.view-btn { color: #0a3a8c; }
.view-btn:hover { background: #e8f0ff; border-color: #0a3a8c; }
.view-modal { max-width: 650px !important; }
.view-body { max-height: 55vh; overflow-y: auto; padding: 16px 20px; }
.view-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #0a246a; }
.view-req-number { display: flex; align-items: center; gap: 10px; }
.view-label { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; }
.view-req-number code { font-size: 14px; background: #f0f4ff; padding: 4px 10px; border-radius: 3px; color: #0a3a8c; border: 1px solid #b8c8e8; font-weight: bold; }
.view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; }
.view-field { display: flex; flex-direction: column; gap: 3px; }
.view-field.full-width { grid-column: 1 / -1; }
.view-field label { font-size: 9px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
.view-field span { font-size: 12px; color: #000; padding: 2px 0; }
.view-section { margin-bottom: 14px; padding: 12px; background: white; border: 1px solid #d0d0d0; border-radius: 4px; }
.view-section h4 { margin: 0 0 10px 0; font-size: 12px; color: #0a246a; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; font-weight: bold; }
.view-remarks { font-size: 11px; color: #333; white-space: pre-wrap; min-height: 30px; line-height: 1.5; padding: 4px 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #ccc; background: #e0e0e0; }
.modal-titlebar {cursor: grab; user-select: none; }
.modal-titlebar:active {cursor: grabbing;}
.time-small {font-size: 9px; color: #888; margin-top: 1px;}
.view-signatures {display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.view-sig-block {text-align: center; padding: 10px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px;}
.view-sig-block h5 { margin: 0 0 8px 0; font-size: 9px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; letter-spacing: 0.5px; }
.view-sig-image { min-height: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; background: white; border: 1px solid #eee; border-radius: 2px; padding: 4px; }
.view-sig-image img { max-width: 120px; max-height: 45px;object-fit: contain; }
.no-sig-text { font-size: 9px; color: #ccc; font-style: italic; }
.view-sig-name { font-size: 11px; font-weight: bold; color: #000; margin-bottom: 2px; }
.assign-btn { color: #0a3a8c; }
.assign-btn:hover { background: #e8f0ff; border-color: #0a3a8c; color: #0a3a8c; }

/* Assign Modal */
.assign-modal { max-width: 480px !important; }
.recipient-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.recipient-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: white; border: 1px solid #ccc; cursor: pointer; border-radius: 3px; }
.recipient-item:hover { background: #e8f0ff; }
.recipient-item.selected { background: #cde8f5; border-color: #0a3a8c; }
.recipient-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0; }
.recipient-info { flex: 1; }
.recipient-name { font-size: 11px; font-weight: bold; display: block; color: #000; }
.recipient-role { font-size: 9px; color: #666; }
.recipient-checkbox { font-size: 18px; color: #aaa; flex-shrink: 0; }
.recipient-checkbox.checked { color: #0a3a8c; }
.empty-recipients { text-align: center; padding: 20px; color: #888; font-size: 11px; }
.view-sig-date { font-size: 9px; color: #888;  }
.status-assigned { background: #f0f4ff; color: #0a3a8c; }
.forward-label { font-weight: 600; color: #0a3a8c; font-size: 9px; display: block; }
.forward-dept { color: #666; font-size: 8px; display: block; }
.forward-company { color: #888; font-size: 7px; font-style: italic; display: block; }.assigned-info {
  padding: 8px 12px;
  background: #f0f4ff;
  border: 1px solid #b8c8e8;
  border-radius: 4px;
}
  .done-btn { color: #008800; }
.done-btn:hover { background: #eeffee; border-color: #008800; color: #008800; }
.tab-count.assigned-count { background: #0a3a8c; }
.tab-count.forwarded-count { background: #0a3a8c; }
.status-forwarded { background: #e8f0ff; color: #0a3a8c; }
.assigned-names {
  font-size: 12px;
  font-weight: 600;
  color: #0a3a8c;
}
.forward-by {
  font-size: 8px;
  color: #0a3a8c;
  font-style: italic;
  font-weight: 600;
  margin-top: 1px;
}
  .assigned-under-status {
  margin-top: 3px;
  font-size: 9px;
  color: #0a3a8c;
  font-style: italic;
  border-top: 1px dotted #c0c0c0;
  padding-top: 3px;
}
.assigned-to-label {
  font-weight: 500;
}
.received-by {
  font-size: 9px;
  color: #666;
  margin-top: 2px;
  font-style: italic;
}
  .attn-cell { max-width: 120px; }
.attn-info { display: flex; flex-direction: column; gap: 1px; align-items: center; }
.role-tag-tiny {
  font-size: 7px;
  background: #f5f0ff;
  color: #6600cc;
  padding: 1px 4px;
  border-radius: 2px;
  border: 1px solid #d0c0e8;
  white-space: nowrap;
  font-style: italic;
}
  .status-forwarded-sub { 
  font-size: 8px; 
  font-style: italic; 
  color: #666; 
  margin-top: 2px;
  border-top: 1px dotted #ccc;
  padding-top: 2px;
}
  `]
})
export class ClientJobOrderListComponent implements OnInit, OnDestroy {
  jobOrders: any[] = [];
  filteredOrders: any[] = [];
  activeTab = 'all';
  viewMode: string = 'our';
  searchTerm = '';
  filters = { branchId: '', departmentId: '' };
  showDeleteModal = false;
  deleteTarget: any = null;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  currentUser: any;
  branches: any[] = [];
  filteredBranches: any[] = [];
  departments: any[] = [];
  allDepartments: any[] = [];
  filteredFilterDepartments: any[] = [];
  mainBranchIds = [1, 5];
  private pollingInterval: any;
  private routerSub: Subscription | null = null;
  showForwardModal = false;
  private userRolesMap: Map<string, string> = new Map();
forwardTargetJO: any = null;
forwardBranchId: number | null = null;
forwardDepartmentId: number | null = null;
forwardFilteredDepartments: any[] = [];
showViewModal = false;
showAssignModal = false;
assignTargetJO: any = null;
availableRecipients: any[] = [];
selectedRecipientIds: number[] = [];
viewJO: any = null;
showDoneModal = false;
doneTargetJO: any = null;
private isDragging = false;
private dragOffsetX = 0;
private dragOffsetY = 0;
private currentDragModal: HTMLElement | null = null;
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
    
    this.loadBranchesAndDepartments();
    this.loadUserRoles(); 
    this.loadJobOrders();
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/job-orders')) {
        this.loadJobOrders();
      }
    });
    
    this.pollingInterval = setInterval(() => {
      this.loadJobOrders();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  loadBranchesAndDepartments() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.branches = (branches || []).map(b => ({
          ...b,
          company_name: b.company_name || b.name
        }));
        const user: any = this.authService.getCurrentUser();
        
        if (user && !this.mainBranchIds.includes(Number(user.branch_id))) {
          this.filteredBranches = this.branches.filter(b => 
            b.id == user.branch_id || this.mainBranchIds.includes(b.id)
          );
        } else {
          this.filteredBranches = [...this.branches];
        }
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
      next: (depts) => {
        this.allDepartments = (depts || []).map(d => {
          const branch = this.branches.find(b => b.id == d.branch_id);
          return { ...d, displayName: `${d.name} — ${branch?.name || 'Unknown'}`, branch_id: d.branch_id };
        });
        this.filteredFilterDepartments = [];
      }
    });
  }
isHeadOrSupervisor(): boolean {
  if (!this.currentUser) return false;
  const role = (this.currentUser.role || '').toLowerCase();
  return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
}

openViewModal(jo: any) {
  this.viewJO = jo;
  this.showViewModal = true;
}

closeViewModal() {
  this.showViewModal = false;
  this.viewJO = null;
}

receiveJobOrder(jo: any) {
  if (!jo.id) return;
  this.router.navigate(['/client/job-orders/approve'], { 
    queryParams: { id: jo.id, mode: 'approve' } 
  });
}
forwardJobOrder(jo: any) {
  this.forwardTargetJO = jo;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
  this.forwardFilteredDepartments = [];
  this.showForwardModal = true;
}

cancelForward() {
  this.showForwardModal = false;
  this.forwardTargetJO = null;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
}

onForwardBranchChange() {
  if (this.forwardBranchId) {
    this.forwardFilteredDepartments = this.allDepartments.filter(d => 
      d.branch_id == this.forwardBranchId
    );
  } else {
    this.forwardFilteredDepartments = [];
  }
  this.forwardDepartmentId = null;
}

confirmForward() {
  if (!this.forwardTargetJO || !this.forwardBranchId || !this.forwardDepartmentId) return;
  
  const jo = this.forwardTargetJO;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    forwarded_to_branch_id: this.forwardBranchId,
    forwarded_to_department_id: this.forwardDepartmentId,
    forwarded_by_name: this.currentUser.fullname || this.currentUser.username
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/forward`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg('📤 Job Order forwarded!', 'success');
      this.cancelForward();
      this.loadJobOrders();
    },
    error: (err) => {
      console.error('Forward failed:', err);
      this.showToastMsg('⚠️ Failed to forward', 'error');
      this.cancelForward();
    }
  });
}
  onFilterBranchChange() {
    if (this.filters.branchId) {
      this.filteredFilterDepartments = this.allDepartments.filter(d => 
        d.branch_id == this.filters.branchId
      );
    } else {
      this.filteredFilterDepartments = [];
    }
    this.filters.departmentId = '';
    this.applyFilters();
  }

  clearFilters() {
    this.activeTab = 'all';
    this.filters = { branchId: '', departmentId: '' };
    this.searchTerm = '';
    this.filteredFilterDepartments = [];
    this.applyFilters();
  }

  getDepartmentName(deptId: number): string {
    if (!deptId) return '';
    const dept = this.allDepartments.find(d => d.id == deptId);
    return dept?.name || dept?.displayName || '';
  }

  getBranchName(branchId: number): string {
    if (!branchId) return '';
    const branch = this.branches.find(b => b.id == branchId);
    return branch?.name || '';
  }

  getBranchCompany(branchId: number): string {
    if (!branchId) return '';
    const branch = this.branches.find(b => b.id == branchId);
    return branch?.company_name || branch?.name || '';
  }

  setViewMode(mode: string) {
    this.viewMode = mode;
    this.activeTab = 'all';
    this.applyFilters();
  }
loadUserRoles() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
    next: (users) => {
      (users || []).forEach(u => {
        const name = u.fullname || u.username;
        if (name) {
          this.userRolesMap.set(name, u.role || 'Staff');
        }
      });
    }
  });
}

getAttnRole(attnName: string): string {
  if (!attnName) return '';
  return this.userRolesMap.get(attnName) || '';
}
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.applyFilters();
  }
startDrag(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.modal-titlebar')) return;
  
  const modal = target.closest('.modal-window') as HTMLElement;
  if (!modal) return;
  
  this.isDragging = true;
  this.currentDragModal = modal;
  
  const rect = modal.getBoundingClientRect();
  this.dragOffsetX = event.clientX - rect.left;
  this.dragOffsetY = event.clientY - rect.top;
  
  modal.style.position = 'fixed';
  modal.style.cursor = 'grabbing';
  modal.style.transition = 'none';
  modal.style.left = rect.left + 'px';
  modal.style.top = rect.top + 'px';
  modal.style.transform = 'none';
  event.preventDefault();
}

onDragMove(event: MouseEvent) {
  if (!this.isDragging || !this.currentDragModal) return;
  
  const x = event.clientX - this.dragOffsetX;
  const y = event.clientY - this.dragOffsetY;
  
  this.currentDragModal.style.left = x + 'px';
  this.currentDragModal.style.top = y + 'px';
}

onDragEnd() {
  if (this.currentDragModal) {
    this.currentDragModal.style.cursor = '';
  }
  this.isDragging = false;
  this.currentDragModal = null;
}
  getFilteredStatusCount(status: string): number {
    let filtered = [...this.jobOrders];
    
    const userBranchId = this.currentUser?.branch_id;
    const userDeptId = this.currentUser?.department_id;
    const userId = this.currentUser?.id;
    const userFullname = this.currentUser?.fullname;
    
    if (this.viewMode === 'our') {
    filtered = filtered.filter(jo => {
        if (jo.submitted_by == userId) return true;
        if (jo.is_forwarded && jo.branch_id == userBranchId && jo.department_id == userDeptId) return true;
        if (jo.is_forwarded && jo.forwarded_by_name && userFullname && 
            jo.forwarded_by_name.toLowerCase() === userFullname.toLowerCase()) return true;
        if (jo.received_name && userFullname && 
            jo.received_name.toLowerCase() === userFullname.toLowerCase()) return true;
        if (jo.assigned_names && userFullname && 
            jo.assigned_names.toLowerCase().includes(userFullname.toLowerCase())) return true;
        return false;
    });
} else if (this.viewMode === 'incoming') {
        filtered = filtered.filter(jo => {
            if (jo.is_forwarded && 
                jo.forwarded_to_branch_id == userBranchId && 
                jo.forwarded_to_department_id == userDeptId &&
                jo.submitted_by != userId) return true;
            if (!jo.is_forwarded && 
                jo.branch_id == userBranchId && 
                jo.department_id == userDeptId && 
                jo.submitted_by != userId) return true;
            return false;
        });
    }
    
    if (status === 'all') return filtered.length;
    return filtered.filter(jo => (jo.status || 'pending') === status).length;
}
 applyFilters() {
    let filtered = [...this.jobOrders];
    
    const userBranchId = this.currentUser?.branch_id;
    const userDeptId = this.currentUser?.department_id;
    const userId = this.currentUser?.id;
    const userFullname = this.currentUser?.fullname;
    
    if (this.viewMode === 'our') {
    filtered = filtered.filter(jo => {
        // My own request (I created it)
        if (jo.submitted_by == userId) return true;
        
        // ✅ If forwarded FROM our department (branch_id/department_id match ours)
        if (jo.is_forwarded && jo.branch_id == userBranchId && jo.department_id == userDeptId) return true;
        
        // ✅ If I am the one who forwarded it (check by name)
        if (jo.is_forwarded && jo.forwarded_by_name && userFullname && 
            jo.forwarded_by_name.toLowerCase() === userFullname.toLowerCase()) return true;
        
        // ✅ If I am the one who received it
        if (jo.received_name && userFullname && 
            jo.received_name.toLowerCase() === userFullname.toLowerCase()) return true;
        
        // ✅ Also include JOs where I'm the assigned user
        if (jo.assigned_names && userFullname && 
            jo.assigned_names.toLowerCase().includes(userFullname.toLowerCase())) return true;
        
        return false;
    });
} else if (this.viewMode === 'incoming') {
        filtered = filtered.filter(jo => {
            // ✅ Forwarded TO us from another department
            if (jo.is_forwarded && 
                jo.forwarded_to_branch_id == userBranchId && 
                jo.forwarded_to_department_id == userDeptId &&
                jo.submitted_by != userId) return true;
            
            // ✅ Original destination is our department (not forwarded, not mine)
            if (!jo.is_forwarded && 
                jo.branch_id == userBranchId && 
                jo.department_id == userDeptId && 
                jo.submitted_by != userId) return true;
            
            return false;
        });
    }
    
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(jo => (jo.status || 'pending') === this.activeTab);
    }
    
    if (this.filters.branchId) {
      filtered = filtered.filter(jo => jo.branch_id == this.filters.branchId);
    }
    
    if (this.filters.departmentId) {
      filtered = filtered.filter(jo => jo.department_id == this.filters.departmentId);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(jo => 
        jo.job_order_number?.toLowerCase().includes(term) ||
        jo.job_order_for?.toLowerCase().includes(term) ||
        jo.requested_name?.toLowerCase().includes(term)
      );
    }
    
    this.filteredOrders = filtered;
}

  loadJobOrders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
      next: (data) => {
        this.jobOrders = Array.isArray(data) ? data : [];
        this.applyFilters();
      },
      error: (err) => {
        console.log('⚠️ API failed, loading from localStorage');
        const saved = JSON.parse(localStorage.getItem('job_orders') || '[]');
        this.jobOrders = saved;
        this.applyFilters();
      }
    });
  }

  canModify(jo: any): boolean {
    return (jo.status === 'pending' || !jo.status) && jo.submitted_by === this.currentUser?.id;
  }

getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Received',
      'assigned': 'Assigned', 
      'forwarded': 'Forwarded',
      'done': 'Done',
      'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
}
  editJobOrder(jo: any) {
    this.router.navigate(['/client/job-orders/edit'], { 
      queryParams: { id: jo.id || jo.job_order_number } 
    });
  }

  viewJobOrder(jo: any) {
    this.printJobOrder(jo);
  }

  openAssignModal(jo: any) {
  this.assignTargetJO = jo;
  this.selectedRecipientIds = [];
  
  // Load users from the same department
  this.loadDepartmentUsers(jo.department_id);
  this.showAssignModal = true;
}

closeAssignModal() {
  this.showAssignModal = false;
  this.assignTargetJO = null;
  this.selectedRecipientIds = [];
}

loadDepartmentUsers(departmentId: number) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  const seenIds = new Set<number>();
  this.availableRecipients = [];
  
  // Get users from users table
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
    next: (users) => {
      (users || []).forEach(u => {
        if (u.department_id == departmentId && !seenIds.has(u.id)) {
          seenIds.add(u.id);
          this.availableRecipients.push(u);
        }
      });
      
      // Also check new_user table
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
        next: (newUsers) => {
          (newUsers || []).forEach(u => {
            if (u.department_id == departmentId && !seenIds.has(u.id)) {
              seenIds.add(u.id);
              this.availableRecipients.push(u);
            }
          });
        },
        error: () => {}
      });
    },
    error: () => {
      this.availableRecipients = [];
    }
  });
}

isRecipientSelected(user: any): boolean {
  return this.selectedRecipientIds.includes(user.id);
}

toggleRecipient(user: any) {
  const index = this.selectedRecipientIds.indexOf(user.id);
  if (index === -1) {
    this.selectedRecipientIds.push(user.id);
  } else {
    this.selectedRecipientIds.splice(index, 1);
  }
}

confirmAssignJO() {
  if (!this.assignTargetJO || this.selectedRecipientIds.length === 0) return;
  
  const jo = this.assignTargetJO;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const assignedNames = this.selectedRecipientIds.map(id => {
    const user = this.availableRecipients.find(u => u.id === id);
    return user?.fullname || `User #${id}`;
  });
  
  const payload = {
    assigned_to: this.selectedRecipientIds[0],
    assigned_users: this.selectedRecipientIds,
    assigned_names: assignedNames.join(', '),
    status: 'assigned'
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg(`✅ Job order assigned to ${assignedNames.join(', ')}!`, 'success');
      this.closeAssignModal();
      this.loadJobOrders();
    },
    error: (err) => {
      console.error('Assign error:', err);
      this.showToastMsg('⚠️ Failed to assign job order', 'error');
      this.closeAssignModal();
    }
  });
}
markAsDone(jo: any) {
  this.doneTargetJO = jo;
  this.showDoneModal = true;
}

cancelDone() {
  this.showDoneModal = false;
  this.doneTargetJO = null;
}

confirmDone() {
  if (!this.doneTargetJO) return;
  
  const jo = this.doneTargetJO;
  const currentUser = this.authService.getCurrentUser();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    status: 'done',
    done_name: currentUser?.fullname || 'User',
    done_date: new Date().toISOString().split('T')[0]
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg('✅ Job Order marked as Done!', 'success');
      this.cancelDone();
      this.loadJobOrders();
    },
    error: (err) => {
      console.error('Done error:', err);
      this.showToastMsg('⚠️ Failed to mark as done', 'error');
      this.cancelDone();
    }
  });
}
 printJobOrder(jo: any) {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    const fmtDate = (val: any) => {
      if (!val) return '—';
      const str = typeof val === 'string' ? val : val.toString();
      if (str.includes('T')) {
        const d = new Date(str);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return str;
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Order - ${jo.job_order_number || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A5 portrait; margin: 6mm; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 9px;
            color: #000;
          }
          .jo-receipt {
            background: white;
            border: 1px solid #000;
            padding: 10px 14px;
            max-width: 420px;
            margin: 0 auto;
          }
          .jo-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .jo-header .company {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .jo-header .title {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .jo-header .ref {
            font-size: 7px;
            color: #0f0e0e;
            margin-top: 2px;
          }
          .info-row {
            display: flex;
            margin-bottom: 3px;
            font-size: 8px;
          }
          .info-label { 
            font-weight: bold; 
            white-space: nowrap; 
            color: #555;
            width: 65px;
            flex-shrink: 0;
          }
          .info-value { flex: 1; font-weight: bold; color: #030303; }
          .check-row {
            display: flex;
            gap: 16px;
            margin: 6px 0;
            font-size: 8px;
          }
          .divider {
            border: none;
            border-top: 1px dashed #ccc;
            margin: 6px 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 3px;
          }
          .description {
            border: 1px solid #eee;
            padding: 6px 8px;
            min-height: 50px;
            font-size: 8px;
            line-height: 1.4;
            white-space: pre-wrap;
            background: #fafafa;
            margin-bottom: 8px;
          }
          .signatures {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #000;
          }
          .sig-row {
            display: flex;
            gap: 8px;
            justify-content: space-between;
          }
          .sig-block {
            flex: 1;
            text-align: center;
          }
          .sig-label {
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 3px;
          }
          .sig-image {
            border: 1px solid #eee;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 3px;
            background: #fafafa;
            height: 45px;
          }
          .sig-image img {
            max-width: 100px;
            max-height: 35px;
          }
          .sig-image .no-sig {
            font-size: 7px;
            color: #ccc;
            font-style: italic;
          }
          .sig-name {
            font-size: 9px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 1px;
          }
          .sig-date {
            font-size: 7px;
            color: #080808;
            font-weight: bold;
          }
          .jo-footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dashed #ccc;
            text-align: center;
            font-size: 7px;
            color: #272626;
          }
          @media print {
            body { padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="jo-receipt">
          <div class="jo-header">
            <div class="company">Lee Super Plaza</div>
            <div class="title">JOB ORDER</div>
            <div class="ref">Ref #: ${jo.job_order_number || 'N/A'}</div>
          </div>

          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${fmtDate(jo.date)}</span></div>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${jo.company || '—'}</span></div>
          <div class="info-row"><span class="info-label">CRTL #:</span><span class="info-value">${jo.ctrl_no || jo.crtk_no || '—'}</span></div>
          <div class="info-row"><span class="info-label">Date Needed:</span><span class="info-value">${fmtDate(jo.date_needed)}</span></div>
          <div class="info-row"><span class="info-label">Dept:</span><span class="info-value">${jo.department || '—'}</span></div>
          <div class="info-row"><span class="info-label">Request:</span><span class="info-value">${jo.request_dept || '—'}</span></div>
          <div class="info-row"><span class="info-label">Job For:</span><span class="info-value">${jo.job_order_for || '—'}</span></div>
          
          <div class="check-row">
            <span>${jo.is_charge ? '☑ Charge' : '☐ Charge'}</span>
            <span>${jo.is_expense ? '☑ Expense' : '☐ Expense'}</span>
          </div>

          <hr class="divider">

          <div class="section-title">Particulars / Description</div>
          <div class="description">${jo.particulars || jo.remarks || 'No details provided.'}</div>

          <div class="signatures">
            <div class="sig-row">
              <div class="sig-block">
                <div class="sig-label">Requested By</div>
                <div class="sig-image">
                  ${jo.requested_signature ? `<img src="${jo.requested_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${jo.requested_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(jo.requested_date)}</div>
              </div>
              <div class="sig-block">
                <div class="sig-label">Approved By</div>
                <div class="sig-image">
                  ${jo.approved_signature ? `<img src="${jo.approved_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${jo.approved_name || '_______________'}</div>
                <div class="sig-date"></div>
              </div>
              <div class="sig-block">
                <div class="sig-label">Received By</div>
                <div class="sig-image">
                  ${jo.received_signature ? `<img src="${jo.received_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${jo.received_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(jo.received_date)}</div>
              </div>
            </div>
          </div>

          <div class="jo-footer">
            Form filled out together with Floor/Dept Logbook &nbsp;|&nbsp; EDPtech Helpdesk v2.0
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
}
 formatDate(dateStr: any): string {
  if (!dateStr) return '—';
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return String(dateStr);
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return String(dateStr);
  }
}
formatTime(timeStr: any): string {
  if (!timeStr) return '—';
  
  try {
    // Handle HH:MM format
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    
    // Handle Date object or ISO string
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    
    return String(timeStr);
  } catch {
    return String(timeStr);
  }
}
  deleteJobOrder(jo: any) {
    this.deleteTarget = jo;
    this.showDeleteModal = true;
  }

  confirmDelete() {
  if (!this.deleteTarget) return;
  
  const jo = this.deleteTarget;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  this.http.delete(`${environment.apiUrl}/api/job-orders/${jo.id || jo.job_order_number}`, { headers }).subscribe({
    next: () => {
      this.jobOrders = this.jobOrders.filter(j => j !== jo);
      this.applyFilters();
      this.showDeleteModal = false;
      this.deleteTarget = null;
      this.showToastMsg('✅ Job Order deleted!', 'success');
    },
    error: (err) => {
      console.error('Delete error:', err);
      this.jobOrders = this.jobOrders.filter(j => j !== jo);
      this.applyFilters();
      const saved = JSON.parse(localStorage.getItem('job_orders') || '[]');
      const updated = saved.filter((j: any) => j.job_order_number !== jo.job_order_number);
      localStorage.setItem('job_orders', JSON.stringify(updated));
      this.showDeleteModal = false;
      this.deleteTarget = null;
      
      if (err.status === 0) {
        this.showToastMsg('⚠️ Server unreachable. Removed locally.', 'error');
      } else {
        this.showToastMsg('Deleted locally', 'success');
      }
    }
  });
}
  cancelDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}