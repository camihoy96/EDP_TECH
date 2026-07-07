import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-job-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-container">
      <!-- View Header -->
      <div class="view-header">
        <h2>📋 {{ viewMode === 'our' ? 'Our Job Orders' : 'J.O. Request Management' }}</h2>
        <div class="header-actions">
          <button class="classic-btn" [class.active]="viewMode === 'our'" (click)="setViewMode('our')">
            📤 Our Job Orders
          </button>
          <button class="classic-btn" [class.active]="viewMode === 'incoming'" (click)="setViewMode('incoming')">
            📥 J.O. Request Management
          </button>
         <button class="classic-btn primary" (click)="newJobOrder()">
  <span>➕</span> New Job Order
</button>
        </div>
      </div>
      <!-- Status Tabs -->
      <div class="status-tabs">
        <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
          📋 All <span class="tab-count">{{ getFilteredStatusCount('all') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
          ⏳ Pending <span class="tab-count pending">{{ getFilteredStatusCount('pending') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
          📥 Received <span class="tab-count approved">{{ getFilteredStatusCount('approved') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'assigned'" (click)="setActiveTab('assigned')">
          👤 Assigned <span class="tab-count assigned">{{ getFilteredStatusCount('assigned') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'forwarded'" (click)="setActiveTab('forwarded')">
          📤 Forwarded <span class="tab-count forwarded">{{ getFilteredStatusCount('forwarded') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'done'" (click)="setActiveTab('done')">
          ✅ Done <span class="tab-count done">{{ getFilteredStatusCount('done') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">
          ❌ Rejected <span class="tab-count rejected">{{ getFilteredStatusCount('rejected') }}</span>
        </button>
      </div>

     <!-- Filter Bar -->
<div class="filter-bar">
  <div class="filter-group">
    <label>Branch:</label>
    <select class="classic-select" [(ngModel)]="filters.branchId" (change)="onFilterBranchChange()">
      <option value="">All Branches</option>
      <ng-container *ngFor="let branch of filteredBranches">
        <option [value]="branch.id">
          🏢 {{ branch.name }} <small>({{ branch.company_name || '' }})</small>
          <ng-container *ngIf="branch.id === currentUser?.branch_id"> — Your Branch</ng-container>
        </option>
      </ng-container>
    </select>
  </div>
  
  <div class="filter-group">
    <label>Request From:</label>
    <select class="classic-select" [(ngModel)]="filters.requestFromDept" (change)="applyFilters()">
      <option value="">All Departments</option>
      <option *ngFor="let dept of filteredFilterDepartments" [value]="dept.name">
        {{ dept.name }}
      </option>
    </select>
  </div>

  <div class="filter-group search-group">
    <label>Search:</label>
    <input type="text" class="classic-input" placeholder="JO #, name..." 
           [(ngModel)]="searchTerm" (input)="applyFilters()">
  </div>
  
  <button class="classic-btn" (click)="loadAllOrders()">
    <span>🔄</span> Refresh
  </button>
</div>

      <!-- Status Bar -->
      <div class="classic-status-bar">
        <span>View: <strong>{{ viewMode === 'our' ? '📤 Our Job Orders' : '📥 J.O. Management' }}</strong></span>
        <span class="status-sep">|</span>
        <span>Showing: <strong>{{ filteredOrders.length }}</strong> job orders</span>
        <span class="status-sep">|</span>
        <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
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
            <tr *ngFor="let jo of filteredOrders" (click)="viewDetail(jo)" class="clickable-row">
              <td class="jo-num">
                <code>{{ jo.job_order_number || 'N/A' }}</code>
                <div class="creator-info" *ngIf="jo.requested_name || jo.submitted_by_name">
                  <span class="creator-label">by: {{ jo.requested_name || jo.submitted_by_name || '—' }}</span>
                </div>
              </td>
              <td class="attn-cell">
                <div class="attn-info">
                  <span>{{ jo.job_order_for || jo.attn || '—' }}</span>
                </div>
              </td>
              <td class="date-cell">{{ formatDateMonth(jo.date) }}</td>
              <td>
                <ng-container *ngIf="viewMode === 'our'">
                  <span class="dept-name-small">{{ jo.department_name || jo.department || '—' }}</span>
                  <span class="branch-tag-tiny" *ngIf="jo.branch_name">{{ jo.branch_name }}</span>
                  <span class="company-tag" *ngIf="jo.company_name">{{ jo.company_name }}</span>
                </ng-container>
                <ng-container *ngIf="viewMode === 'incoming'">
                  <span class="dept-name-small">{{ jo.request_dept || jo.department_name || '—' }}</span>
                  <span class="branch-tag-tiny" *ngIf="jo.branch_name">{{ jo.branch_name }}</span>
                  <span class="company-tag" *ngIf="jo.company_name">{{ jo.company_name }}</span>
                  <div class="creator-info" *ngIf="jo.submitted_by_name">
                    <span class="creator-label-sm">👤 {{ jo.submitted_by_name }}</span>
                  </div>
                </ng-container>
              </td>
             <td>
  <ng-container *ngIf="jo.is_forwarded">
    <ng-container *ngIf="viewMode === 'our'">
      <span class="forward-label">📤 To: {{ jo.forwarded_to_branch_name || '—' }}</span>
      <span class="forward-dept">{{ jo.forwarded_to_department_name || '—' }}</span>
      <span class="forward-company" *ngIf="jo.forwarded_to_company_name">{{ jo.forwarded_to_company_name }}</span>
      <div class="forward-by" *ngIf="jo.forwarded_by_name">
        <span class="forward-by-label">by: {{ jo.forwarded_by_name }}</span>
      </div>
    </ng-container>
    <ng-container *ngIf="viewMode === 'incoming'">
      <span class="forward-label">📥 From: {{ jo.forwarded_by_name || jo.branch_name || '—' }}</span>
      <span class="forward-dept">{{ jo.department_name || jo.department || '—' }}</span>
      <span class="forward-company" *ngIf="jo.company_name">{{ jo.company_name }}</span>
    </ng-container>
  </ng-container>
  <span *ngIf="!jo.is_forwarded" style="color: #ccc;">—</span>
</td>
              <td class="desc-cell">{{ jo.particulars || jo.remarks || '—' }}</td>
              <td>
                <span class="status-badge" [class]="'status-' + (jo.status || 'pending')">
                  {{ getStatusLabel(jo.status) }}
                </span>
                <div class="status-forwarded-sub" *ngIf="jo.is_forwarded && jo.forwarded_status">
                  ↳ {{ getStatusLabel(jo.forwarded_status) }}
                </div>
                <div class="assigned-under-status" *ngIf="jo.assigned_names">
                  <span class="assigned-to-label">to: {{ jo.assigned_names }}</span>
                </div>
                <div class="received-by" *ngIf="jo.status === 'approved' && jo.received_name">
                  by: {{ jo.received_name }}
                </div>
              </td>
              <td (click)="$event.stopPropagation()">
  <button class="action-btn view-btn" (click)="viewDetail(jo)" title="View">👁️</button>
  <button class="action-btn print-btn" (click)="printOrder(jo)" title="Print">🖨️</button>
  <button class="action-btn edit-btn" *ngIf="jo.status === 'pending'" (click)="editOrder(jo)" title="Edit">✏️</button>
  
  <!-- ✅ Receive button - for pending orders -->
  <button class="action-btn accept-btn" 
        *ngIf="viewMode === 'incoming' && (jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending'))" 
        (click)="receiveOrder(jo)" title="Receive">📥</button>
   <!-- ✅ NEW: Forward button - appears after receiving (status = approved/received) -->
  <button class="action-btn forward-btn" 
          *ngIf="viewMode === 'incoming' && jo.status === 'approved'" 
          (click)="openForwardModal(jo)" title="Forward">➡️</button>
  <!-- ✅ Assign / Reassign button -->
  <button class="action-btn assign-btn" 
          *ngIf="jo.status === 'approved' || jo.status === 'assigned' || (jo.is_forwarded && (jo.forwarded_status === 'approved' || jo.forwarded_status === 'assigned'))" 
          (click)="assignOrder(jo)" 
          [title]="jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned') ? 'Reassign' : 'Assign'">
    {{ jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned') ? '🔄' : '👤' }}
  </button>
  
  <!-- ✅ Done button - ONLY in J.O. Request Management -->
  <button class="action-btn done-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned'))" 
          (click)="markAsDone(jo)" title="Mark as Done">✅</button>
  
  <!-- ✅ Reject button - ONLY in J.O. Request Management -->
  <button class="action-btn reject-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending'))" 
          (click)="updateStatus(jo, 'rejected')" title="Reject">❌</button>
  
  <!-- ✅ Delete button -->
  <button class="action-btn delete-btn" (click)="deleteOrder(jo)" title="Delete">🗑️</button>
</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Detail Modal -->
<div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetailModal()">
  <div class="modal-content" 
       [ngStyle]="{'transform': 'translate(' + detailModalPos.x + 'px, ' + detailModalPos.y + 'px)'}"
       (click)="$event.stopPropagation()">
    <div class="modal-header" 
         (mousedown)="startDrag($event, 'detail')"
         style="cursor: move;">
      <h3>📋 Job Order Detail</h3>
      <button class="modal-close" (click)="closeDetailModal()">✕</button>
    </div>
    <div class="modal-body" *ngIf="selectedOrder">
      <div class="detail-grid">
        <div class="detail-item"><label>JO Code:</label><span>{{ selectedOrder.job_order_number }}</span></div>
        <div class="detail-item"><label>Date:</label><span>{{ formatDateMonth(selectedOrder.date) }}</span></div>
        <div class="detail-item"><label>Time:</label><span>{{ selectedOrder.time || '—' }}</span></div>
        <div class="detail-item"><label>CTRL #:</label><span>{{ selectedOrder.ctrl_no || selectedOrder.crtk_no || '—' }}</span></div>
        <div class="detail-item"><label>ATTN:</label><span>{{ selectedOrder.job_order_for || selectedOrder.attn || '—' }}</span></div>
        <div class="detail-item"><label>Status:</label>
          <span class="status-badge" [class]="'status-' + (selectedOrder.status || 'pending')">{{ getStatusLabel(selectedOrder.status) }}</span>
        </div>
      </div>

      <!-- ✅ Conditional: Recipient (Our) vs Request From (Incoming) -->
      <div class="detail-section">
        <h4>{{ viewMode === 'our' ? '📥 Recipient' : '📤 Request From' }}</h4>
        <div class="detail-info-row">
          <div class="detail-info-item">
            <label>Branch:</label>
            <span>{{ selectedOrder.branch_name || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Company:</label>
            <span>{{ selectedOrder.company_name || selectedOrder.company || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Department:</label>
            <span>{{ selectedOrder.department_name || selectedOrder.department || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- ✅ Show Request From for incoming -->
      <div class="detail-section" *ngIf="viewMode === 'incoming' && selectedOrder.request_dept">
        <h4>📋 Request Department</h4>
        <div class="detail-info-row">
          <div class="detail-info-item">
            <label>Request:</label>
            <span>{{ selectedOrder.request_dept || '—' }}</span>
          </div>
          <div class="detail-info-item" *ngIf="selectedOrder.submitted_by_name">
            <label>Submitted By:</label>
            <span>👤 {{ selectedOrder.submitted_by_name }}</span>
          </div>
        </div>
      </div>

      <!-- ✅ Forwarded Info -->
      <div class="detail-section" *ngIf="selectedOrder.is_forwarded">
        <h4>📤 Forwarded Information</h4>
        <div class="detail-info-row">
          <div class="detail-info-item" *ngIf="viewMode === 'our'">
            <label>Forwarded To:</label>
            <span>{{ selectedOrder.forwarded_to_branch_name || '—' }}</span>
          </div>
          <div class="detail-info-item" *ngIf="viewMode === 'our'">
            <label>Department:</label>
            <span>{{ selectedOrder.forwarded_to_department_name || '—' }}</span>
          </div>
          <div class="detail-info-item" *ngIf="viewMode === 'incoming'">
            <label>Forwarded From:</label>
            <span>{{ selectedOrder.forwarded_by_name || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Forwarded Date:</label>
            <span>{{ formatDateMonth(selectedOrder.forwarded_date) }}</span>
          </div>
        </div>
      </div>
          
      <div class="detail-section">
        <h4>📝 Particulars / Description</h4>
        <div class="detail-desc">{{ selectedOrder.particulars || selectedOrder.remarks || 'No details' }}</div>
      </div>

      <!-- ✅ Signatures with proper dates -->
      <div class="detail-signatures">
        <div class="sig-box" *ngIf="selectedOrder.requested_signature || selectedOrder.requested_name">
          <h5>✍️ Requested By</h5>
          <div class="sig-name">{{ selectedOrder.requested_name || '—' }}</div>
          <img [src]="selectedOrder.requested_signature" alt="Signature" *ngIf="selectedOrder.requested_signature">
          <span class="sig-date">{{ formatDateMonth(selectedOrder.requested_date) }}</span>
        </div>
        <div class="sig-box" *ngIf="selectedOrder.approved_signature || selectedOrder.approved_name">
          <h5>✅ Approved By</h5>
          <div class="sig-name">{{ selectedOrder.approved_name || '—' }}</div>
          <img [src]="selectedOrder.approved_signature" alt="Signature" *ngIf="selectedOrder.approved_signature">
          <span class="sig-date">{{ formatDateMonth(selectedOrder.approved_date) }}</span>
        </div>
        <div class="sig-box" *ngIf="selectedOrder.received_signature || selectedOrder.received_name">
          <h5>📥 Received By</h5>
          <div class="sig-name">{{ selectedOrder.received_name || '—' }}</div>
          <img [src]="selectedOrder.received_signature" alt="Signature" *ngIf="selectedOrder.received_signature">
          <span class="sig-date">{{ formatDateMonth(selectedOrder.received_date) }}</span>
        </div>
      </div>

      <!-- ✅ Done Info -->
      <div class="detail-section" *ngIf="selectedOrder.status === 'done' && selectedOrder.done_name">
        <h4>✅ Completed</h4>
        <div class="detail-info-row">
          <div class="detail-info-item">
            <label>Done By:</label>
            <span>{{ selectedOrder.done_name || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Done Date:</label>
            <span>{{ formatDateMonth(selectedOrder.done_date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    <!-- Confirm Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal" (click)="cancelConfirm()">
      <div class="modal-content confirm-modal" 
           [ngStyle]="{'transform': 'translate(' + confirmModalPos.x + 'px, ' + confirmModalPos.y + 'px)'}"
           (click)="$event.stopPropagation()">
        <div class="modal-header" 
             [class]="'header-' + (confirmAction || 'approve')"
             (mousedown)="startDrag($event, 'confirm')"
             style="cursor: move;">
          <h3>{{ confirmAction === 'reject' ? '❌ Reject Job Order' : confirmAction === 'done' ? '✅ Mark as Done' : '🗑️ Delete Job Order' }}</h3>
          <button class="modal-close" (click)="cancelConfirm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <span class="confirm-icon">{{ confirmAction === 'reject' ? '❌' : confirmAction === 'done' ? '✅' : '🗑️' }}</span>
            <div class="confirm-message">
              <p>Job Order: <strong>#{{ confirmTarget?.job_order_number }}</strong></p>
              <p class="confirm-warning" *ngIf="confirmAction === 'delete'">⚠️ This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="cancelConfirm()">Cancel</button>
          <button class="btn" [class]="'btn-' + (confirmAction || 'approve')" (click)="confirmAction === 'delete' ? confirmDelete() : confirmStatusUpdate()">
            {{ confirmAction === 'reject' ? '❌ Reject' : confirmAction === 'done' ? '✅ Mark Done' : '🗑️ Delete' }}
          </button>
        </div>
      </div>
    </div>
  <!-- Assign Modal - FIXED -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window assign-modal" (click)="$event.stopPropagation()"
     [ngStyle]="{'transform': 'translate(' + assignModalPos.x + 'px, ' + assignModalPos.y + 'px)'}">
    <div class="modal-titlebar" style="cursor: grab;" (mousedown)="startDrag($event, 'assign')">
      <span>👤 Assign Users</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="assign-info" *ngIf="assignTarget">
        <p>Job Order: <strong>#{{ assignTarget.job_order_number }}</strong></p>
        <p>Department: <strong>{{ assignTarget.department_name || assignTarget.department || '—' }}</strong></p>
      </div>
      <div class="assign-select-all" *ngIf="filteredAssignUsers.length > 0">
        <label class="checkbox-label">
          <input type="checkbox" [checked]="selectedAssignUsers.length === filteredAssignUsers.length" (change)="toggleSelectAll($event)">
          <span>Select All ({{ filteredAssignUsers.length }} users)</span>
        </label>
      </div>
      <div class="assign-search">
        <input type="text" class="classic-input" placeholder="Search users..." [(ngModel)]="assignSearchTerm" (input)="filterAssignUsers()">
      </div>
      <div class="assign-user-list">
        <div class="assign-user-item" *ngFor="let user of filteredAssignUsers" [class.selected]="isUserSelected(user.id)">
          <label class="checkbox-label user-label" (click)="$event.stopPropagation()">
            <input type="checkbox" [checked]="isUserSelected(user.id)" (change)="toggleUserSelection(user)">
          </label>
          <span class="assign-user-name">{{ user.fullname || user.username }}</span>
          <span class="assign-user-role">{{ user.role }}</span>
        </div>
        <div class="assign-empty" *ngIf="filteredAssignUsers.length === 0">No users found</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="closeAssignModal()">Cancel</button>
      <button class="classic-btn primary" (click)="confirmAssign()" [disabled]="selectedAssignUsers.length === 0">
        👤 Assign ({{ selectedAssignUsers.length }})
      </button>
    </div>
  </div>
</div>

<!-- Forward Modal - FIXED -->
<div class="modal-overlay" *ngIf="showForwardModal" (click)="cancelForward()">
  <div class="modal-window" (click)="$event.stopPropagation()"
     [ngStyle]="{'transform': 'translate(' + forwardModalPos.x + 'px, ' + forwardModalPos.y + 'px)'}">
    <div class="modal-titlebar" style="background: #0a3a8c; cursor: grab;" (mousedown)="startDrag($event, 'forward')">
      <span>➡️ Forward Job Order</span>
      <button type="button" (click)="cancelForward()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="assign-info" *ngIf="forwardTargetReq">
        <p>Job Order: <strong>#{{ forwardTargetReq.job_order_number }}</strong></p>
      </div>
      
      <div class="filter-group" style="margin-bottom: 10px;">
        <label>Branch:</label>
        <select class="classic-select" [(ngModel)]="forwardBranchId" (change)="onForwardBranchChange()" style="width: 100%;">
          <option [ngValue]="null">— Select Branch —</option>
          <option *ngFor="let branch of forwardBranches" [value]="branch.id">
            🏢 {{ branch.name }} <small>({{ branch.company_name || '' }})</small>
          </option>
        </select>
      </div>
      
      <div class="filter-group" style="margin-bottom: 10px;">
        <label>Department:</label>
        <select class="classic-select" [(ngModel)]="forwardDepartmentId" style="width: 100%;">
          <option [ngValue]="null">— Select Department —</option>
          <option *ngFor="let dept of forwardFilteredDepartments" [value]="dept.id">
            {{ dept.displayName || dept.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="cancelForward()">Cancel</button>
      <button class="classic-btn primary" (click)="confirmForward()" [disabled]="!forwardBranchId || !forwardDepartmentId">
        ➡️ Forward
      </button>
    </div>
  </div>
</div>

<!-- Reassign Modal - FIXED -->
<div class="modal-overlay" *ngIf="showReassignModal" (click)="closeReassignModal()">
  <div class="modal-window assign-modal" (click)="$event.stopPropagation()"
     [ngStyle]="{'transform': 'translate(' + reassignModalPos.x + 'px, ' + reassignModalPos.y + 'px)'}">
    <div class="modal-titlebar" style="background: #0a246a; cursor: grab;" (mousedown)="startDrag($event, 'reassign')">
      <span>👤 Reassign Users</span>
      <button type="button" (click)="closeReassignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="assign-info" *ngIf="reassignTarget">
        <p>Job Order: <strong>#{{ reassignTarget.job_order_number }}</strong></p>
        <p>Department: <strong>{{ reassignTarget.department_name || reassignTarget.department || '—' }}</strong></p>
      </div>
      
      <div class="assign-select-all" *ngIf="filteredReassignUsers.length > 0">
        <label class="checkbox-label">
          <input type="checkbox" [checked]="selectedReassignUsers.length === filteredReassignUsers.length" (change)="toggleReassignSelectAll($event)">
          <span>Select All ({{ filteredReassignUsers.length }} users)</span>
        </label>
      </div>
      
      <div class="assign-search">
        <input type="text" class="classic-input" placeholder="Search users..." [(ngModel)]="reassignSearchTerm" (input)="filterReassignUsers()">
      </div>
      
      <div class="assign-user-list">
        <div class="assign-user-item" *ngFor="let user of filteredReassignUsers" [class.selected]="isReassignUserSelected(user.id)">
          <label class="checkbox-label user-label" (click)="$event.stopPropagation()">
            <input type="checkbox" [checked]="isReassignUserSelected(user.id)" (change)="toggleReassignUser(user)">
          </label>
          <span class="assign-user-name">{{ user.fullname || user.username }}</span>
          <span class="assign-user-role">{{ user.role }}</span>
        </div>
        <div class="assign-empty" *ngIf="filteredReassignUsers.length === 0">No users found</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="closeReassignModal()">Cancel</button>
      <button class="classic-btn primary" (click)="confirmReassign()" [disabled]="selectedReassignUsers.length === 0">
        👤 Reassign ({{ selectedReassignUsers.length }})
      </button>
    </div>
  </div>
</div>
    <!-- Toast -->
    <div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      <span>{{ toastMessage }}</span>
    </div>
  `,
  styles: [`
    .admin-container { padding: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #0a246a; }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }
    .header-actions { display: flex; gap: 6px; align-items: center; }
    .classic-btn { background: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 3px; padding: 5px 14px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; color: #000; }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.active { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.danger { background: #cc0000; color: white; border-color: #cc0000; }
    .status-tabs { display: flex; gap: 2px; padding: 4px 6px; background: #e8e8e8; border: 1px solid #a0a0a0; margin-bottom: 6px; flex-wrap: wrap; }
    .status-tab { background: #d4d0c8; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px 2px 0 0; padding: 5px 12px; cursor: pointer; font-size: 10px; color: #333; display: inline-flex; align-items: center; gap: 6px; }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .filter-bar { background: #f0f0f0; border: 1px solid #a0a0a0; padding: 6px 10px; display: flex; gap: 12px; align-items: center; margin-bottom: 4px; }
    .classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 10px; background: white; }
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
    .jo-num { text-align: center; }
    .creator-info { font-size: 9px; color: #666; margin-top: 3px; border-top: 1px dotted #c0c0c0; padding-top: 3px; display: flex; align-items: center; justify-content: center; gap: 3px; }
    .creator-label { color: #0a3a8c; font-weight: 600; font-size: 9px; background: #f0f4ff; padding: 1px 6px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
    .creator-label-sm { color: #0a3a8c; font-weight: 500; font-size: 8px; }
    .date-cell { font-family: monospace; font-size: 10px; white-space: nowrap; color: #555; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; display: block; }
    .branch-tag-tiny { font-size: 8px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; display: inline-block; margin: 1px 2px; }
    .company-tag { font-size: 8px; background: #f5f5f5; color: #555; padding: 1px 5px; border-radius: 3px; border: 1px solid #ddd; white-space: nowrap; display: inline-block; }
    .forward-label { font-weight: 600; color: #0a3a8c; font-size: 9px; display: block; }
    .forward-dept { color: #666; font-size: 10px; display: block; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-assigned { background: #f0f4ff; color: #0a3a8c; }
    .status-forwarded { background: #e8f0ff; color: #0a3a8c; }
    .status-done { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .status-forwarded-sub { font-size: 8px; font-style: italic; color: #666; margin-top: 2px; border-top: 1px dotted #ccc; padding-top: 2px; }
    .assigned-under-status { margin-top: 3px; font-size: 9px; color: #0a3a8c; font-style: italic; border-top: 1px dotted #c0c0c0; padding-top: 3px; }
    .received-by { font-size: 9px; color: #666; margin-top: 2px; font-style: italic; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0fe; border-color: #a0a0a0; }
    .view-btn:hover { color: #0a3a8c; }
    .print-btn:hover { color: #008800; }
    .edit-btn { color: #0a3a8c; }
    .edit-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
    .accept-btn { color: #008800; }
    .accept-btn:hover { background: #eeffee; border-color: #008800; }
    .done-btn { color: #008800; }
    .done-btn:hover { background: #eeffee; border-color: #008800; }
    .reject-btn { color: #cc0000; }
    .reject-btn:hover { background: #ffecec; border-color: #cc0000; }
    .delete-btn:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }
    .attn-cell { max-width: 120px; }
    .attn-info { display: flex; flex-direction: column; gap: 1px; align-items: center; }
    .empty-row { text-align: center; padding: 30px; color: #888; }
    .modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background: rgba(0,0,0,0.5); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 2000; 
}
.modal-window { 
  background: #f0f0f0; 
  border: 2px solid #808080; 
  box-shadow: 3px 3px 8px rgba(0,0,0,0.4); 
  width: 100%; 
  max-width: 450px;
  position: relative;
}.modal-titlebar { 
  background: #0a246a; 
  color: white; 
  padding: 8px 14px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  font-size: 13px; 
  font-weight: bold; 
  user-select: none;
  cursor: grab;
}
  .modal-titlebar:active {
  cursor: grabbing;
}

    .modal-content { background: white; width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; }
    .confirm-modal { max-width: 450px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0a246a; color: white; user-select: none; }
    .modal-header h3 { margin: 0; font-size: 14px; }
    .modal-close { 
  background: rgba(255,255,255,0.2); 
  border: 1px solid rgba(255,255,255,0.6); 
  color: white; 
  cursor: pointer; 
  padding: 2px 10px; 
  font-size: 16px; 
  font-weight: bold;
  border-radius: 0;
  line-height: 1.2;
}

.modal-close:hover { 
  background: rgba(255,0,0,0.7); 
  color: white;
}

.modal-body { 
  padding: 16px; 
  background: white;
}
.modal-footer { 
  display: flex; 
  justify-content: flex-end; 
  gap: 8px; 
  padding: 12px 16px; 
  background: #e0e0e0; 
  border-top: 1px solid #a0a0a0; 
}

.assign-modal { 
  max-width: 500px !important; 
}

.assign-info { 
  margin-bottom: 12px; 
  padding: 8px 12px; 
  background: #f0f4ff; 
  border: 1px solid #b8c8e8; 
  border-radius: 3px; 
}

.assign-info p { 
  margin: 2px 0; 
  font-size: 11px; 
  color: #333; 
}

.assign-select-all { 
  margin-bottom: 8px; 
  padding: 6px 10px; 
  background: #f5f5f5; 
  border: 1px solid #ddd; 
  border-radius: 3px; 
}

.assign-search { 
  margin-bottom: 10px; 
}

.assign-search .classic-input { 
  width: 100%; 
  padding: 6px 10px; 
  box-sizing: border-box;
}

.assign-user-list { 
  max-height: 250px; 
  overflow-y: auto; 
  border: 1px solid #ddd; 
  background: white; 
}

.assign-user-item { 
  display: flex; 
  align-items: center; 
  padding: 6px 12px; 
  border-bottom: 1px solid #eee; 
  cursor: pointer; 
}

.assign-user-item:hover { 
  background: #e8f0fe; 
}

.assign-user-item.selected { 
  background: #d4edda; 
}

.checkbox-label { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  cursor: pointer; 
  font-size: 11px; 
  margin: 0; 
}

.checkbox-label input[type="checkbox"] { 
  width: 16px; 
  height: 16px; 
  cursor: pointer; 
  accent-color: #0a3a8c; 
}

.user-label { 
  margin-right: 10px; 
}

.assign-user-name { 
  flex: 1; 
  font-size: 12px; 
  font-weight: 500; 
  color: #333; 
}

.assign-user-role { 
  font-size: 10px; 
  color: #888; 
  background: #f0f0f0; 
  padding: 2px 8px; 
  border-radius: 3px; 
}

.assign-empty { 
  padding: 20px; 
  text-align: center; 
  color: #888; 
  font-style: italic; 
}

.assign-btn { 
  color: #0a3a8c; 
}

.assign-btn:hover { 
  background: #e8f0fe; 
  border-color: #0a3a8c; 
}
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .detail-item { padding: 6px 8px; background: #f9f9f9; border-radius: 4px; }
    .detail-item label { display: block; font-size: 9px; font-weight: 600; color: #555; text-transform: uppercase; }
    .detail-item span { font-size: 12px; font-weight: 500; color: #333; }
    .detail-section { margin-bottom: 14px; }
    .detail-section h4 { font-size: 11px; color: #555; margin-bottom: 6px; }
    .detail-desc { padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #333; }
    .detail-signatures { display: flex; gap: 12px; margin-bottom: 14px; }
    .sig-box { flex: 1; text-align: center; padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; }
    .sig-box h5 { font-size: 9px; color: #333; margin: 0 0 6px 0; }
    .sig-box img { max-width: 120px; max-height: 50px; }
    .sig-box span { display: block; font-size: 9px; color: #666; margin-top: 4px; }
    .confirm-content { text-align: center; }
    .confirm-icon { font-size: 48px; margin-bottom: 12px; }
    .confirm-message p { font-size: 13px; color: #333; margin-bottom: 12px; }
    .confirm-warning { color: #cc0000 !important; font-size: 10px !important; font-weight: 600; background: #fff0f0; padding: 8px; border-radius: 4px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; background: #f8f9fa; border-top: 1px solid #e0e0e0; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; }
    .btn:hover { background: #f0f0f0; }
    .btn-approve { background: #008800; color: white; border-color: #006600; }
    .btn-reject { background: #cc0000; color: white; border-color: #aa0000; }
    .btn-delete { background: #cc0000; color: white; border-color: #aa0000; }
    .btn-done { background: #0066cc; color: white; border-color: #0044aa; }
    .header-approve { background: #008800; }
    .header-reject { background: #cc0000; }
    .header-delete { background: #cc0000; }
    .header-done { background: #0066cc; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .forward-company {
  font-size: 7px;
  color: #888;
  display: block;
  font-style: italic;
}
.forward-btn { color: #0a3a8c; }
.forward-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
.forward-by {
  margin-top: 2px;
  font-size: 7px;
  color: #0a3a8c;
  border-top: 1px dotted #c0c0c0;
  padding-top: 2px;
}

.forward-by-label {
  font-weight: 500;
}

.forward-from-branch {
  margin-top: 2px;
}
  .detail-info-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.detail-info-item {
  flex: 1;
  min-width: 150px;
}

.detail-info-item label {
  display: block;
  font-size: 8px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.detail-info-item span {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.sig-name {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  border-bottom: 1px solid #000;
  padding-bottom: 2px;
}

.sig-date {
  display: block;
  font-size: 9px;
  color: #666;
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 14px;
}

.detail-section h4 {
  font-size: 11px;
  color: #0a246a;
  margin-bottom: 6px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 4px;
}
  .filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-group label {
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  color: #333;
}
.classic-select {
  padding: 3px 6px;
  border: 1px solid #a0a0a0;
  font-size: 10px;
  background: white;
  min-width: 150px;
}
.filter-group small {
  font-size: 8px;
  color: #888;
}
  .assign-modal { max-width: 500px !important; }
.assign-info { margin-bottom: 12px; padding: 8px 12px; background: #f0f4ff; border: 1px solid #b8c8e8; border-radius: 4px; }
.assign-info p { margin: 2px 0; font-size: 11px; color: #333; }
.assign-select-all { margin-bottom: 8px; padding: 6px 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; }
.assign-search { margin-bottom: 10px; }
.assign-search .classic-input { width: 100%; padding: 6px 10px; }
.assign-user-list { max-height: 250px; overflow-y: auto; border: 1px solid #ddd; background: white; }
.assign-user-item { display: flex; align-items: center; padding: 6px 12px; border-bottom: 1px solid #eee; cursor: pointer; }
.assign-user-item:hover { background: #e8f0fe; }
.assign-user-item.selected { background: #d4edda; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; margin: 0; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #0a3a8c; }
.user-label { margin-right: 10px; }
.assign-user-name { flex: 1; font-size: 12px; font-weight: 500; color: #333; }
.assign-user-role { font-size: 10px; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 3px; }
.assign-empty { padding: 20px; text-align: center; color: #888; font-style: italic; }
   .assign-btn { color: #0a3a8c; }
    .assign-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
    .assign-modal { max-width: 500px !important; }
    .assign-info { margin-bottom: 12px; padding: 8px 12px; background: #f0f4ff; border: 1px solid #b8c8e8; border-radius: 4px; }
    .assign-info p { margin: 2px 0; font-size: 11px; color: #333; }
    .assign-select-all { margin-bottom: 8px; padding: 6px 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; }
    .assign-search { margin-bottom: 10px; }
    .assign-search .classic-input { width: 100%; padding: 6px 10px; }
    .assign-user-list { max-height: 250px; overflow-y: auto; border: 1px solid #ddd; background: white; }
    .assign-user-item { display: flex; align-items: center; padding: 6px 12px; border-bottom: 1px solid #eee; cursor: pointer; }
    .assign-user-item:hover { background: #e8f0fe; }
    .assign-user-item.selected { background: #d4edda; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; margin: 0; }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #0a3a8c; }
    .user-label { margin-right: 10px; }
    .assign-user-name { flex: 1; font-size: 12px; font-weight: 500; color: #333; }
    .assign-user-role { font-size: 10px; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 3px; }
    .assign-empty { padding: 20px; text-align: center; color: #888; font-style: italic; }
   
  `]
})
export class JobOrdersManagementComponent implements OnInit {
 allOrders: any[] = [];
  filteredOrders: any[] = [];
  activeTab = 'all';
  viewMode: string = 'our';
  searchTerm = '';
  showDetailModal = false;
  selectedOrder: any = null;
  showToast = false;
  currentUser: any;
  showConfirmModal = false;
  confirmAction: 'reject' | 'delete' | 'done' | null = null;
  confirmTarget: any = null;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
// Forward modal properties (for incoming)
showForwardModal = false;
forwardTargetReq: any = null;
forwardBranchId: number | null = null;
forwardDepartmentId: number | null = null;
forwardFilteredDepartments: any[] = [];
forwardBranches: any[] = [];
departments: any[] = [];
// Reassign modal properties
showReassignModal = false;
reassignTarget: any = null;
reassignUsers: any[] = [];
filteredReassignUsers: any[] = [];
selectedReassignUsers: any[] = [];
reassignSearchTerm = '';
forwardModalPos = { x: 0, y: 0 };
assignModalPos = { x: 0, y: 0 };
reassignModalPos = { x: 0, y: 0 };
  // Dragging properties
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  currentDragModal: string = '';
  detailModalPos = { x: 0, y: 0 };
  confirmModalPos = { x: 0, y: 0 };
// Filter properties
filters = {
  branchId: '',
  requestFromDept: ''
};
filteredBranches: any[] = [];
filteredFilterDepartments: any[] = [];
  // Assign modal properties
  showAssignModal = false;
  assignTarget: any = null;
  assignSearchTerm = '';
  assignUsers: any[] = [];
  filteredAssignUsers: any[] = [];
  selectedAssignUsers: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

 ngOnInit() {
  this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  this.loadAllOrders();
  this.loadFilterBranches();
  this.loadDepartments(); // ✅ Add this
  document.addEventListener('mousemove', this.onMouseMove.bind(this));
  document.addEventListener('mouseup', this.onMouseUp.bind(this));
}

  startDrag(event: MouseEvent, modal: string) {
    this.isDragging = true;
    this.currentDragModal = modal;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    event.preventDefault();
  }

onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    if (this.currentDragModal === 'detail') {
      this.detailModalPos = { x: this.detailModalPos.x + deltaX, y: this.detailModalPos.y + deltaY };
    } else if (this.currentDragModal === 'confirm') {
      this.confirmModalPos = { x: this.confirmModalPos.x + deltaX, y: this.confirmModalPos.y + deltaY };
    } else if (this.currentDragModal === 'forward') {
      this.forwardModalPos = { x: this.forwardModalPos.x + deltaX, y: this.forwardModalPos.y + deltaY };
    } else if (this.currentDragModal === 'assign') {
      this.assignModalPos = { x: this.assignModalPos.x + deltaX, y: this.assignModalPos.y + deltaY };
    } else if (this.currentDragModal === 'reassign') {
      this.reassignModalPos = { x: this.reassignModalPos.x + deltaX, y: this.reassignModalPos.y + deltaY };
    }
}
  onMouseUp() { this.isDragging = false; this.currentDragModal = ''; }

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

  setViewMode(mode: string) { this.viewMode = mode; this.activeTab = 'all'; this.applyFilters(); }
  setActiveTab(tab: string) { this.activeTab = tab; this.applyFilters(); }

  loadAllOrders() {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).subscribe({
      next: (data) => { this.allOrders = Array.isArray(data) ? data : []; this.applyFilters(); },
      error: () => this.showToastMsg('Failed to load job orders', 'error')
    });
  }

  receiveOrder(jo: any) {
    this.router.navigate(['/admin/job-orders/approve'], { 
      queryParams: { id: jo.id || jo.job_order_number, mode: 'approve' } 
    });
  }

  // ✅ New: Edit order
editOrder(jo: any) {
  this.router.navigate(['/job-orders/edit'], { 
    queryParams: { id: jo.id || jo.job_order_number } 
  });
}
 getFilteredStatusCount(status: string): number {
    let filtered = [...this.allOrders];
    
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    if (this.viewMode === 'our') {
      filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const submittedById = Number(o.submitted_by);
        return submittedById === currentUserId ||
               (submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId);
      });
    } else if (this.viewMode === 'incoming') {
      filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id);
        const isForUs = orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId;
        const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId);
        return isForUs && isFromOthers;
      });
    }
    
    if (status === 'all') return filtered.length;
    return filtered.filter(o => (o.status || 'pending') === status).length;
}
 applyFilters() {
    let filtered = [...this.allOrders];
    
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    if (this.viewMode === 'our') {
      // "Our Job Orders" - ONLY orders WE created/submitted
      filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const submittedById = Number(o.submitted_by);
        
        return submittedById === currentUserId ||
               (submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId);
      });
      
      // ✅ For "Our" view: Branch filter filters by RECIPIENT branch (the branch we sent TO)
      if (this.filters.branchId) {
        filtered = filtered.filter(o => 
          Number(o.branch_id) === Number(this.filters.branchId)
        );
      }
      
      // ✅ For "Our" view: Department filter filters by RECIPIENT department
      if (this.filters.requestFromDept) {
        filtered = filtered.filter(o => 
          o.department === this.filters.requestFromDept ||
          o.department_name === this.filters.requestFromDept
        );
      }
    } else if (this.viewMode === 'incoming') {
      // "J.O. Request Management" - orders INTENDED FOR our branch/department
      filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id);
        const forwardedBranchId = Number(o.forwarded_to_branch_id);
        const forwardedDeptId = Number(o.forwarded_to_department_id);
        
        const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
        const isForwardedToUs = o.is_forwarded && 
                               (forwardedBranchId === currentUserBranchId && forwardedDeptId === currentUserDeptId);
        const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId);
        
        return (isForUs || isForwardedToUs) && isFromOthers;
      });
      
      // ✅ For "Incoming" view: Branch filter filters by REQUEST FROM branch (the submitter's branch)
      if (this.filters.branchId) {
        filtered = filtered.filter(o => 
          Number(o.submitter_branch_id || o.submitted_by_branch_id) === Number(this.filters.branchId)
        );
      }
      
      // ✅ For "Incoming" view: Department filter filters by REQUEST FROM department
      if (this.filters.requestFromDept) {
        filtered = filtered.filter(o => 
          o.request_dept === this.filters.requestFromDept
        );
      }
    }
    
    // Apply status tab filter
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(o => (o.status || 'pending') === this.activeTab);
    }
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.job_order_number?.toLowerCase().includes(term) ||
        o.requested_name?.toLowerCase().includes(term) ||
        o.department?.toLowerCase().includes(term) ||
        o.job_order_for?.toLowerCase().includes(term) ||
        o.submitted_by_name?.toLowerCase().includes(term) ||
        o.branch_name?.toLowerCase().includes(term) ||
        o.department_name?.toLowerCase().includes(term)
      );
    }
    
    this.filteredOrders = filtered;
}
  newJobOrder() { this.router.navigate(['/job-orders/new']); }
// Load branches for forward modal (same logic as job orders)
loadForwardBranches() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      const allBranches = branches || [];
      const currentUserBranchId = Number(this.currentUser?.branch_id);
      const mainBranchIds = [1, 5]; // LSP Main branch IDs
      
      if (mainBranchIds.includes(currentUserBranchId)) {
        this.forwardBranches = allBranches.filter(b => mainBranchIds.includes(b.id));
      } else {
        this.forwardBranches = allBranches.filter(b => 
          b.id === currentUserBranchId || mainBranchIds.includes(b.id)
        );
        this.forwardBranches.sort((a, b) => {
          if (a.id === currentUserBranchId) return -1;
          if (b.id === currentUserBranchId) return 1;
          return 0;
        });
      }
    },
    error: (err) => console.error('Failed to load branches:', err)
  });
}

// Open forward modal
openForwardModal(req: any) {
  this.forwardTargetReq = req;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
  this.forwardFilteredDepartments = [];
  this.showForwardModal = true;
  this.loadForwardBranches();
  this.forwardModalPos = { x: 0, y: 0 };
}

// Cancel forward
cancelForward() {
  this.showForwardModal = false;
  this.forwardTargetReq = null;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
}

// When forward branch changes
onForwardBranchChange() {
  if (!this.forwardBranchId) {
    this.forwardFilteredDepartments = [];
    this.forwardDepartmentId = null;
      this.forwardModalPos = { x: 0, y: 0 };
    return;
    
  }
  
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (depts) => {
      this.forwardFilteredDepartments = (depts || []).filter(d => 
        d.branch_id == this.forwardBranchId
      );
      this.forwardDepartmentId = null;
    },
    error: (err) => console.error('Failed to load departments:', err)
  });
}

// ✅ FIXED: Uses job-orders API endpoint
confirmForward() {
  if (!this.forwardTargetReq || !this.forwardBranchId || !this.forwardDepartmentId) return;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    forwarded_to_branch_id: this.forwardBranchId,
    forwarded_to_department_id: this.forwardDepartmentId,
    forwarded_by_name: this.currentUser?.fullname || 'Admin'
  };
  
  // ✅ FIXED: Use job-orders endpoint instead of requisitions
  this.http.put(`${environment.apiUrl}/api/admin/job-orders/${this.forwardTargetReq.id}/forward`, payload, { headers }).subscribe({
    next: () => {
      this.forwardTargetReq.is_forwarded = 1;
      this.forwardTargetReq.forwarded_to_branch_id = this.forwardBranchId;
      this.forwardTargetReq.forwarded_to_department_id = this.forwardDepartmentId;
      this.forwardTargetReq.forwarded_by_name = this.currentUser?.fullname;
      this.forwardTargetReq.status = 'forwarded';
      this.applyFilters();
      this.cancelForward();
      this.showToastMsg('📤 Job Order forwarded successfully!', 'success');
    },
    error: (err) => {
      console.error('Forward failed:', err);
      this.showToastMsg('⚠️ Failed to forward', 'error');
    }
  });
}
// Reassign methods
openReassignModal(req: any) {
  this.reassignTarget = req;
  this.selectedReassignUsers = [];
  this.reassignSearchTerm = '';
  this.showReassignModal = true;
  this.loadReassignUsers(req.department_id);
  this.reassignModalPos = { x: 0, y: 0 };
}

loadReassignUsers(departmentId: number) {
  const headers = this.getAuthHeaders();
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/users/by-dept/${departmentId}`, { headers }).subscribe({
    next: (users) => {
      this.reassignUsers = users || [];
      this.selectedReassignUsers = [...this.reassignUsers];
      this.filterReassignUsers();
    },
    error: () => {
      this.reassignUsers = [{
        id: this.currentUser?.id,
        fullname: this.currentUser?.fullname || 'Current User',
        username: this.currentUser?.username,
        role: this.currentUser?.role || 'staff'
      }];
      this.selectedReassignUsers = [...this.reassignUsers];
      this.filteredReassignUsers = [...this.reassignUsers];
    }
  });
}

filterReassignUsers() {
  if (!this.reassignSearchTerm.trim()) {
    this.filteredReassignUsers = this.reassignUsers;
  } else {
    const term = this.reassignSearchTerm.toLowerCase().trim();
    this.filteredReassignUsers = this.reassignUsers.filter(u =>
      (u.fullname || u.username || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  }
}

isReassignUserSelected(userId: number): boolean {
  return this.selectedReassignUsers.some(u => u.id === userId);
}

toggleReassignUser(user: any) {
  if (this.isReassignUserSelected(user.id)) {
    this.selectedReassignUsers = this.selectedReassignUsers.filter(u => u.id !== user.id);
  } else {
    this.selectedReassignUsers.push(user);
  }
}

toggleReassignSelectAll(event: any) {
  if (event.target.checked) {
    this.selectedReassignUsers = [...this.filteredReassignUsers];
  } else {
    this.selectedReassignUsers = [];
  }
}

// ✅ FIXED: Uses job-orders API endpoint
confirmReassign() {
  if (!this.reassignTarget || this.selectedReassignUsers.length === 0) return;
  
  const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
  const assignedNames = this.selectedReassignUsers.map(u => u.fullname || u.username).join(', ');
  const payload = {
    status: 'assigned',
    assigned_to: this.selectedReassignUsers[0].id,
    assigned_users: this.selectedReassignUsers.map(u => u.id),
    assigned_names: assignedNames
  };
  
  // ✅ FIXED: Use job-orders endpoint instead of requisitions
  this.http.put(`${environment.apiUrl}/api/admin/job-orders/${this.reassignTarget.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.reassignTarget.status = 'assigned';
      this.reassignTarget.assigned_names = assignedNames;
      this.applyFilters();
      this.closeReassignModal();
      this.showToastMsg('✅ Users assigned successfully!', 'success');
    },
    error: () => this.showToastMsg('⚠️ Failed to assign users', 'error')
  });
} 

closeReassignModal() {
  this.showReassignModal = false;
  this.reassignTarget = null;
  this.selectedReassignUsers = [];
  this.reassignSearchTerm = '';
   this.reassignModalPos = { x: 0, y: 0 };
}
getDepartmentName(deptId: number): string {
  if (!deptId) return '—';
  const dept = this.departments?.find(d => d.id == deptId);
  return dept?.name || dept?.displayName || 'Dept #' + deptId;
}
loadDepartments() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (depts) => {
      this.departments = depts || [];
    },
    error: (err) => console.error('Failed to load departments:', err)
  });
}
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending', 'approved': 'Received', 'assigned': 'Assigned',
      'forwarded': 'Forwarded', 'done': 'Done', 'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
  }

  viewDetail(jo: any) { this.selectedOrder = jo; this.detailModalPos = { x: 0, y: 0 }; this.showDetailModal = true; }
  closeDetailModal() { this.showDetailModal = false; this.selectedOrder = null; }

  markAsDone(jo: any) { this.confirmTarget = jo; this.confirmAction = 'done'; this.confirmModalPos = { x: 0, y: 0 }; this.showConfirmModal = true; }
  updateStatus(jo: any, status: string) { this.confirmTarget = jo; this.confirmAction = status === 'rejected' ? 'reject' : 'done'; this.confirmModalPos = { x: 0, y: 0 }; this.showConfirmModal = true; }
canDelete(jo: any): boolean {
  // Allow delete for all users (not just admin)
  return true;
}
// Load branches for filter dropdown
loadFilterBranches() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      const allBranches = branches || [];
      const currentUserBranchId = Number(this.currentUser?.branch_id);
      const mainBranchIds = [1, 5]; // LSP Main branch IDs
      
      // If user is from main branch, show ALL branches
      if (mainBranchIds.includes(currentUserBranchId)) {
        this.filteredBranches = allBranches;
      } else {
        // For non-main branch users: ONLY show their branch + main branches
        this.filteredBranches = allBranches.filter(b => 
          b.id === currentUserBranchId || mainBranchIds.includes(b.id)
        );
        // Sort: User's branch first, then main branches
        this.filteredBranches.sort((a, b) => {
          if (a.id === currentUserBranchId) return -1;
          if (b.id === currentUserBranchId) return 1;
          return 0;
        });
      }
    },
    error: (err) => {
      console.error('Failed to load branches:', err);
      this.filteredBranches = [{
        id: this.currentUser?.branch_id,
        name: 'Your Branch',
        company_name: ''
      }];
    }
  });
}

// When branch filter changes, load departments for that branch
onFilterBranchChange() {
  if (!this.filters.branchId) {
    this.filteredFilterDepartments = [];
    this.filters.requestFromDept = '';
    this.applyFilters();
    return;
  }
  
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (depts) => {
      this.filteredFilterDepartments = (depts || []).filter(d => 
        d.branch_id == this.filters.branchId
      );
      this.filters.requestFromDept = '';
      this.applyFilters();
    },
    error: (err) => console.error('Failed to load departments:', err)
  });
}
  confirmStatusUpdate() {
    if (!this.confirmTarget) return;
    const jo = this.confirmTarget;
    let status: string;
    let extraPayload: any = {};
    if (this.confirmAction === 'reject') { status = 'rejected'; }
    else if (this.confirmAction === 'done') { status = 'done'; extraPayload = { done_name: this.currentUser?.fullname || 'Admin', done_date: new Date().toISOString().split('T')[0] }; }
    else { return; }
    
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, { status, ...extraPayload }, { headers }).subscribe({
      next: () => {
        jo.status = status;
        if (status === 'done') { jo.done_name = extraPayload.done_name; jo.done_date = extraPayload.done_date; }
        this.applyFilters();
        this.showConfirmModal = false; this.confirmTarget = null; this.confirmAction = null;
        this.showToastMsg(`✅ Job Order ${status === 'done' ? 'marked as Done' : 'rejected'}!`, 'success');
      },
      error: () => {
        jo.status = status;
        this.applyFilters();
        this.showConfirmModal = false; this.confirmTarget = null; this.confirmAction = null;
        this.showToastMsg('⚠️ Updated locally', 'error');
      }
    });
  }

  deleteOrder(jo: any) { this.confirmTarget = jo; this.confirmAction = 'delete'; this.confirmModalPos = { x: 0, y: 0 }; this.showConfirmModal = true; }

  confirmDelete() {
    if (!this.confirmTarget) return;
    const jo = this.confirmTarget;
    this.http.delete(`${environment.apiUrl}/api/admin/job-orders/${jo.id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.allOrders = this.allOrders.filter(o => o.id !== jo.id);
        this.applyFilters();
        this.showConfirmModal = false; this.confirmTarget = null; this.confirmAction = null;
        this.showToastMsg('✅ Job Order deleted!', 'success');
      },
      error: () => {
        this.allOrders = this.allOrders.filter(o => o.id !== jo.id);
        this.applyFilters();
        this.showConfirmModal = false; this.confirmTarget = null; this.confirmAction = null;
        this.showToastMsg('⚠️ Removed locally', 'error');
      }
    });
  }

  cancelConfirm() { this.showConfirmModal = false; this.confirmTarget = null; this.confirmAction = null; }

  // ✅ New: Format date with month name
  formatDateMonth(val: any): string {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch { return String(val); }
  }

  formatDate(val: any): string {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).split('T')[0];
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } catch { return String(val); }
  }

  printOrder(jo: any) {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;
    const fmtDate = (val: any) => { if (!val) return '—'; const d = new Date(val); if (isNaN(d.getTime())) return val; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Job Order - ${jo.job_order_number}</title><style>@page{size:A5 portrait;margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:9px;color:#000}.receipt{border:1px solid #000;padding:10px 14px;max-width:420px;margin:0 auto}h2{text-align:center;font-size:14px;text-transform:uppercase}.row{display:flex;margin:3px 0;font-size:8px}.lbl{font-weight:bold;width:65px;color:#555}.val{flex:1;font-weight:bold}.desc{border:1px solid #eee;padding:6px;min-height:40px;background:#fafafa;margin:6px 0}.sigs{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #000}.sig{flex:1;text-align:center}.sig img{max-width:80px;max-height:30px}.signame{font-size:9px;font-weight:bold;border-bottom:1px solid #000}@media print{body{padding:0}}</style></head><body><div class="receipt"><h2>JOB ORDER</h2><p style="text-align:center;font-size:7px">Ref: ${jo.job_order_number||'N/A'}</p><div class="row"><span class="lbl">Date:</span><span class="val">${fmtDate(jo.date)}</span></div><div class="row"><span class="lbl">Company:</span><span class="val">${jo.company||'—'}</span></div><div class="row"><span class="lbl">Dept:</span><span class="val">${jo.department||'—'}</span></div><div class="row"><span class="lbl">Request:</span><span class="val">${jo.request_dept||'—'}</span></div><p style="font-weight:bold;font-size:8px;margin-top:6px">Particulars:</p><div class="desc">${jo.particulars||'No details'}</div><div class="sigs"><div class="sig">${jo.requested_signature?`<img src="${jo.requested_signature}">`:''}<div class="signame">${jo.requested_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.requested_date)}</div></div><div class="sig">${jo.approved_signature?`<img src="${jo.approved_signature}">`:''}<div class="signame">${jo.approved_name||'—'}</div></div><div class="sig">${jo.received_signature?`<img src="${jo.received_signature}">`:''}<div class="signame">${jo.received_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.received_date)}</div></div></div></div><script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`);
    printWindow.document.close();
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  // ✅ Assign modal methods
  assignOrder(jo: any) {
    this.assignTarget = jo;
    this.selectedAssignUsers = [];
    this.assignSearchTerm = '';
    this.showAssignModal = true;
    this.loadAssignUsers(jo.department_id);
     this.assignModalPos = { x: 0, y: 0 };
  }

  loadAssignUsers(departmentId: number) {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users/by-dept/${departmentId}`, { headers }).subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          this.assignUsers = users;
        } else {
          this.loadAllUsersForDepartment(departmentId);
          return;
        }
        this.selectedAssignUsers = [...this.assignUsers];
        this.filterAssignUsers();
      },
      error: () => this.loadAllUsersForDepartment(departmentId)
    });
  }

  loadAllUsersForDepartment(departmentId: number) {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (allUsers) => {
        this.assignUsers = (allUsers || []).filter(u => 
          Number(u.department_id) === Number(departmentId) || Number(u.dept_id) === Number(departmentId)
        );
        if (this.assignUsers.length === 0) {
          this.assignUsers = [{ id: this.currentUser?.id, fullname: this.currentUser?.fullname || 'Current User', username: this.currentUser?.username, role: this.currentUser?.role || 'staff' }];
        }
        this.selectedAssignUsers = [...this.assignUsers];
        this.filterAssignUsers();
      },
      error: () => {
        this.assignUsers = [{ id: this.currentUser?.id, fullname: this.currentUser?.fullname || 'Current User', username: this.currentUser?.username, role: this.currentUser?.role || 'staff' }];
        this.selectedAssignUsers = [...this.assignUsers];
        this.filteredAssignUsers = [...this.assignUsers];
      }
    });
  }

  filterAssignUsers() {
    if (!this.assignSearchTerm.trim()) {
      this.filteredAssignUsers = this.assignUsers;
    } else {
      const term = this.assignSearchTerm.toLowerCase().trim();
      this.filteredAssignUsers = this.assignUsers.filter(u =>
        (u.fullname || u.username || '').toLowerCase().includes(term) || (u.role || '').toLowerCase().includes(term)
      );
    }
  }

  isUserSelected(userId: number): boolean { return this.selectedAssignUsers.some(u => u.id === userId); }

  toggleUserSelection(user: any) {
    if (this.isUserSelected(user.id)) {
      this.selectedAssignUsers = this.selectedAssignUsers.filter(u => u.id !== user.id);
    } else {
      this.selectedAssignUsers.push(user);
    }
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) { this.selectedAssignUsers = [...this.filteredAssignUsers]; }
    else { this.selectedAssignUsers = []; }
  }

  confirmAssign() {
    if (!this.assignTarget || this.selectedAssignUsers.length === 0) return;
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const assignedNames = this.selectedAssignUsers.map(u => u.fullname || u.username).join(', ');
    const payload = { status: 'assigned', assigned_to: this.selectedAssignUsers[0].id, assigned_users: this.selectedAssignUsers.map(u => u.id), assigned_names: assignedNames };
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${this.assignTarget.id}/status`, payload, { headers }).subscribe({
      next: () => {
        this.assignTarget.status = 'assigned';
        this.assignTarget.assigned_names = assignedNames;
        this.applyFilters();
        this.closeAssignModal();
        this.showToastMsg('✅ Users assigned successfully!', 'success');
      },
      error: () => this.showToastMsg('⚠️ Failed to assign users', 'error')
    });
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.assignTarget = null;
    this.selectedAssignUsers = [];
    this.assignSearchTerm = '';
    this.assignModalPos = { x: 0, y: 0 };
  }
}