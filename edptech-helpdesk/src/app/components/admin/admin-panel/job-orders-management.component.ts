import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification.service';
import { ClientNotificationService } from '../../../services/client-notification.service';
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
      <span class="notification-badge" *ngIf="ourOrdersUnreadCount > 0">
        {{ ourOrdersUnreadCount }}
      </span>
    </button>
    <button class="classic-btn" [class.active]="viewMode === 'incoming'" (click)="setViewMode('incoming')">
      📥 J.O. Request Management
      <span class="notification-badge" *ngIf="incomingOrdersUnreadCount > 0">
        {{ incomingOrdersUnreadCount }}
      </span>
    </button>
    <button class="classic-btn primary" (click)="newJobOrder()">
      <span>➕</span> New Job Order
    </button>
  </div>
</div>

<!-- ✅ Optional: Mark all as read button -->
<div class="mark-read-bar" *ngIf="(viewMode === 'our' && ourOrdersUnreadCount > 0) || (viewMode === 'incoming' && incomingOrdersUnreadCount > 0)">
  <button class="classic-btn" (click)="markAllAsRead()">
    ✅ Mark all as read
  </button>
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
       <span class="role-tag-tiny" *ngIf="jo.job_order_for || jo.attn">
        {{ getAttnRole(jo.job_order_for || jo.attn) }}
       </span>
      </div>
       </td>
              <td class="date-cell">
  {{ formatDateMonth(jo.date) }}
  <div class="time-under-date" *ngIf="jo.time">{{ formatTime(jo.time) }}</div>
</td>
              <td>
  <ng-container *ngIf="viewMode === 'our'">
    <span class="dept-name-small">{{ jo.department_name || jo.department || '—' }}</span>
    <span class="branch-tag-tiny">{{ getBranchName(jo.branch_id) || jo.branch_name || '—' }}</span>
    <span class="company-tag">{{ getBranchCompany(jo.branch_id) || jo.company_name || '' }}</span>
  </ng-container>
  <ng-container *ngIf="viewMode === 'incoming'">
    <span class="dept-name-small">{{ jo.request_dept || jo.department_name || '—' }}</span>
    <span class="branch-tag-tiny">{{ getBranchName(jo.branch_id) || jo.branch_name || '—' }}</span>
    <span class="company-tag">{{ getBranchCompany(jo.branch_id) || jo.company_name || '' }}</span>
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
              {{ getStatusLabel(jo.status, jo) }}
              </span>
             <div class="status-forwarded-sub" *ngIf="jo.is_forwarded && jo.forwarded_status">
             ↳ {{ getStatusLabel(jo.forwarded_status, jo) }}
             </div>
                <div class="assigned-under-status" *ngIf="jo.assigned_names">
    <span class="assigned-to-label">
        {{ (jo.is_forwarded && jo.forwarded_status === 'done') || jo.status === 'done' ? 'by: ' : 'to: ' }}
        {{ jo.assigned_names }}
    </span>
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
  
  <!-- ✅ Forward button - appears after receiving (status = approved/received) -->
  <button class="action-btn forward-btn" 
          *ngIf="viewMode === 'incoming' && jo.status === 'approved'" 
          (click)="openForwardModal(jo)" title="Forward">➡️</button>
  
  <!-- ✅ Assign button - ONLY in J.O. Request Management for approved orders -->
  <button class="action-btn assign-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'approved' || (jo.is_forwarded && jo.forwarded_status === 'approved'))" 
          (click)="assignOrder(jo)" 
          title="Assign">
    👤
  </button>
  
  <!-- ✅ Reassign button - ONLY in J.O. Request Management for assigned orders -->
  <button class="action-btn assign-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned'))" 
          (click)="assignOrder(jo)" 
          title="Reassign">
    🔄
  </button>
  
  <!-- ✅ Done button - ONLY in J.O. Request Management -->
  <button class="action-btn done-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned'))" 
          (click)="markAsDone(jo)" title="Mark as Done">✅</button>
  
  <!-- ✅ Reject button - ONLY in J.O. Request Management -->
  <button class="action-btn reject-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending'))" 
          (click)="updateStatus(jo, 'rejected')" title="Reject">❌</button>
  
  <!-- ✅ Delete button - Show in both views -->
  <button class="action-btn delete-btn" *ngIf="canDelete(jo)" (click)="deleteOrder(jo)" title="Delete">🗑️</button>
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
       <div class="detail-item"><label>Time:</label><span>{{ formatTime(selectedOrder.time) || '—' }}</span></div>
        <div class="detail-item"><label>CTRL #:</label><span>{{ selectedOrder.ctrl_no || selectedOrder.crtk_no || '—' }}</span></div>
        <div class="detail-item"><label>ATTN:</label><span>{{ selectedOrder.job_order_for || selectedOrder.attn || '—' }}</span></div>
        <div class="detail-item"><label>Status:</label>
        <span class="status-badge" [class]="'status-' + (selectedOrder.status || 'pending')">
          {{ getStatusLabel(selectedOrder.status, selectedOrder) }}
        </span>
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
<!-- ✅ Signatures -->
<div class="detail-section">
  <h4>✍️ Signatures</h4>
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
    .status-tab { background: #d4d0c8; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px 2px 0 0; padding: 5px 12px; cursor: pointer; font-size: 12px; color: #333; display: inline-flex; align-items: center; gap: 6px; }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 12px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .filter-bar { background: #f0f0f0; border: 1px solid #a0a0a0; padding: 6px 10px; display: flex; gap: 12px; align-items: center; margin-bottom: 4px; }
    .classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 12px; background: white; }
    .classic-status-bar { background: #f0f0f0; border: 1px solid #a0a0a0; border-top: none; padding: 3px 10px; font-size: 12px; color: #333; display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .status-sep { color: #b0b0b0; }
    .classic-table-container { border: 1px solid #a0a0a0; background: white; overflow-x: auto; }
    .classic-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .classic-table th { background: #0a246a; color: white; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 12px; border-right: 1px solid rgba(255,255,255,0.2); white-space: nowrap; }
    .classic-table th:last-child { border-right: none; }
    .classic-table td { padding: 7px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; color: #000; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #e8f0fe; }
    code { font-family: 'Courier New', monospace; font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .jo-num { text-align: center; }
    .creator-info { font-size: 12px; color: #666; margin-top: 3px; border-top: 1px dotted #c0c0c0; padding-top: 3px; display: flex; align-items: center; justify-content: center; gap: 3px; }
    .creator-label { color: #0a3a8c; font-weight: 600; font-size: 12px; background: #f0f4ff; padding: 1px 6px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
    .creator-label-sm { color: #0a3a8c; font-weight: 500; font-size: 12px; }
    .date-cell { font-family: monospace; font-size: 12px; white-space: nowrap; color: #555; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dept-name-small { font-weight: 600; font-size: 12px; color: #0a3a8c; display: block; }
    .branch-tag-tiny { font-size: 12px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; display: inline-block; margin: 1px 2px; }
    .company-tag { font-size: 12px; background: #f5f5f5; color: #555; padding: 1px 5px; border-radius: 3px; border: 1px solid #ddd; white-space: nowrap; display: inline-block; }
    .forward-label { font-weight: 600; color: #0a3a8c; font-size: 12px; display: block; }
    .forward-dept { color: #666; font-size: 12px; display: block; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-assigned { background: #f0f4ff; color: #0a3a8c; }
    .status-forwarded { background: #e8f0ff; color: #0a3a8c; }
    .status-done { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .status-forwarded-sub { font-size: 12px; font-style: italic; color: #666; margin-top: 2px; border-top: 1px dotted #ccc; padding-top: 2px; }
    .assigned-under-status { margin-top: 3px; font-size: 12px; color: #0a3a8c; font-style: italic; border-top: 1px dotted #c0c0c0; padding-top: 3px; }
    .received-by { font-size: 12px; color: #666; margin-top: 2px; font-style: italic; }
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
    .time-under-date { font-size: 12px; color: #888; margin-top: 1px; }
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
.role-tag-tiny {
  font-size: 11px;
  background: #f5f0ff;
  color: #6600cc;
  padding: 1px 4px;
  border-radius: 2px;
  border: 1px solid #d0c0e8;
  white-space: nowrap;
  font-style: italic;
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
  font-size: 12px; 
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
  /* Notification badge styles */
.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 4px;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Mark all as read bar */
.mark-read-bar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 10px;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-top: none;
  margin-bottom: 4px;
}

.mark-read-bar .classic-btn {
  font-size: 12px;
  padding: 3px 12px;
}
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .detail-item { padding: 6px 8px; background: #f9f9f9; border-radius: 4px; }
    .detail-item label { display: block; font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; }
    .detail-item span { font-size: 12px; font-weight: 500; color: #333; }
    .detail-section { margin-bottom: 14px; }
    .detail-section h4 { font-size: 11px; color: #555; margin-bottom: 6px; }
    .detail-desc { padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #333; }
    .detail-signatures { display: flex; gap: 12px; margin-bottom: 14px; }
    .sig-box { flex: 1; text-align: center; padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; }
    .sig-box h5 { font-size: 12px; color: #333; margin: 0 0 6px 0; }
    .sig-box img { max-width: 120px; max-height: 50px; }
    .sig-box span { display: block; font-size: 12px; color: #666; margin-top: 4px; }
    .confirm-content { text-align: center; }
    .confirm-icon { font-size: 48px; margin-bottom: 12px; }
    .confirm-message p { font-size: 13px; color: #333; margin-bottom: 12px; }
    .confirm-warning { color: #cc0000 !important; font-size: 12px !important; font-weight: 600; background: #fff0f0; padding: 8px; border-radius: 4px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; background: #f8f9fa; border-top: 1px solid #e0e0e0; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 12px; }
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
  font-size: 11px;
  color: #888;
  display: block;
  font-style: italic;
}
.forward-btn { color: #0a3a8c; }
.forward-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
.forward-by {
  margin-top: 2px;
  font-size: 11px;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  color: #333;
}
.classic-select {
  padding: 3px 6px;
  border: 1px solid #a0a0a0;
  font-size: 12px;
  background: white;
  min-width: 150px;
}
.filter-group small {
  font-size: 12px;
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
.assign-user-role { font-size: 12px; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 3px; }
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
    .assign-user-role { font-size: 12px; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 3px; }
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
  // ✅ New properties for notifications
   ourOrdersUnreadCount: number = 0;
  incomingOrdersUnreadCount: number = 0;
  
  // ✅ Track which orders have been viewed/read
  readOrderIds: Set<number> = new Set<number>();
  notificationMap: Map<number, { type: 'incoming' | 'status_update', status: string }> = new Map();
  // Forward modal properties
  showForwardModal = false;
  forwardTargetReq: any = null;
  forwardBranchId: number | null = null;
  forwardDepartmentId: number | null = null;
  forwardFilteredDepartments: any[] = [];
  forwardBranches: any[] = [];
  departments: any[] = [];
  allDepartments: any[] = [];
  
  // Reassign modal properties
  showReassignModal = false;
  reassignTarget: any = null;
  reassignUsers: any[] = [];
  filteredReassignUsers: any[] = [];
  selectedReassignUsers: any[] = [];
  reassignSearchTerm = '';
  private userRolesMap: Map<string, string> = new Map();
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
  allBranches: any[] = [];
  filteredBranches: any[] = [];
  filteredFilterDepartments: any[] = [];
  
  // Assign modal properties
  showAssignModal = false;
  assignTarget: any = null;
  assignSearchTerm = '';
  assignUsers: any[] = [];
  filteredAssignUsers: any[] = [];
  selectedAssignUsers: any[] = [];
  // ✅ CACHING PROPERTIES
  private ordersCache: {
    data: any[];
    timestamp: number;
    currentUserId: number;
    currentUserBranchId: number;
    currentUserDeptId: number;
  } | null = null;
  
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache
  private readonly STALE_DURATION_MS = 60000; // 1 minute before forcing refresh
  private readonly POLLING_INTERVAL = 30000; // Poll every 30 seconds
  private isFetching = false;
  private lastRequestSignature: string = '';
  private pollingInterval: any;
 constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private router: Router,
    private notificationService: NotificationService,  
    private clientNotificationService: ClientNotificationService  
) {}
   ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loadReadOrdersFromStorage();
    this.loadNotificationMapFromStorage();
    this.loadAllOrders();
    this.loadFilterBranches();
    this.loadDepartments();
    this.loadUserRoles();  
    
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    this.pollingInterval = setInterval(() => {
      if (this.isCacheStale() && !this.isFetching) {
        this.loadAllOrders(false);
      }
    }, this.POLLING_INTERVAL);
}
    // ✅ Generate request signature for deduplication
  private getRequestSignature(): string {
    return `admin_jo_${this.currentUser?.id}_${this.currentUser?.branch_id}_${this.currentUser?.department_id}_${this.viewMode}_${this.activeTab}`;
  }

  // ✅ Check if cache is still valid
  private isCacheValid(): boolean {
    if (!this.ordersCache) return false;
    if (!this.ordersCache.data || this.ordersCache.data.length === 0) return false;
    
    const now = Date.now();
    const cacheAge = now - this.ordersCache.timestamp;
    
    if (cacheAge < this.CACHE_DURATION_MS) {
      if (this.ordersCache.currentUserId === this.currentUser?.id) {
        return true;
      }
    }
    
    return false;
  }
   // ✅ Check if cache is stale
  private isCacheStale(): boolean {
    if (!this.ordersCache) return true;
    
    const now = Date.now();
    const cacheAge = now - this.ordersCache.timestamp;
    
    return cacheAge >= this.CACHE_DURATION_MS || 
           this.ordersCache.currentUserId !== this.currentUser?.id;
  }
  // ✅ Check if cache is expired
  private isCacheExpired(): boolean {
    if (!this.ordersCache) return true;
    
    const now = Date.now();
    const cacheAge = now - this.ordersCache.timestamp;
    
    return cacheAge >= this.STALE_DURATION_MS || 
           this.ordersCache.currentUserId !== this.currentUser?.id;
  }
 // ✅ Update cache with fresh data
  private updateCache(data: any[]): void {
    this.ordersCache = {
      data: data,
      timestamp: Date.now(),
      currentUserId: this.currentUser?.id,
      currentUserBranchId: this.currentUser?.branch_id,
      currentUserDeptId: this.currentUser?.department_id
    };
    
    try {
      sessionStorage.setItem('admin_jo_cache', JSON.stringify({
        data: data.slice(0, 100),
        timestamp: Date.now(),
        userId: this.currentUser?.id
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }
   // ✅ Load from sessionStorage as fallback
  private loadFromSessionStorage(): any[] | null {
    try {
      const cached = sessionStorage.getItem('admin_jo_cache');
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const cacheAge = Date.now() - parsed.timestamp;
      
      if (cacheAge < 300000 && parsed.userId === this.currentUser?.id) {
        console.log('📦 Using admin JO sessionStorage cache, age:', Math.round(cacheAge / 1000), 's');
        return parsed.data;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }
  // ✅ Clear all caches
  private clearCache(): void {
    this.ordersCache = null;
    try {
      sessionStorage.removeItem('admin_jo_cache');
    } catch (e) {
      // Ignore
    }
  }
  private updateLocalOrder(orderId: number, updates: Partial<any>): void {
    const index = this.allOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.allOrders[index] = { ...this.allOrders[index], ...updates };
    }
    
    if (this.ordersCache) {
      const cacheIndex = this.ordersCache.data.findIndex(o => o.id === orderId);
      if (cacheIndex !== -1) {
        this.ordersCache.data[cacheIndex] = { 
          ...this.ordersCache.data[cacheIndex], 
          ...updates 
        };
      }
    }
    
    this.applyFilters();
  }

 loadNotificationMapFromStorage() {
  const stored = localStorage.getItem('jobOrderNotifications');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      this.notificationMap = new Map(parsed);
    } catch (e) {
      this.notificationMap = new Map();
    }
  }
}
// ✅ Load read orders from localStorage
loadReadOrdersFromStorage() {
  const stored = localStorage.getItem('readJobOrders');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      this.readOrderIds = new Set(parsed);
    } catch (e) {
      this.readOrderIds = new Set();
    }
  }
}
  // ✅ Save read orders to localStorage
  saveReadOrdersToStorage() {
    localStorage.setItem('readJobOrders', JSON.stringify(Array.from(this.readOrderIds)));
  }

  // ✅ Mark order as read when viewed
  markOrderAsRead(orderId: number) {
    if (orderId && !this.readOrderIds.has(orderId)) {
      this.readOrderIds.add(orderId);
      this.saveReadOrdersToStorage();
      
      // ✅ Remove from notification map when read
      if (this.notificationMap.has(orderId)) {
        this.notificationMap.delete(orderId);
        this.saveNotificationMapToStorage();
      }
      
      this.updateNotificationCounts();
    }
  }

  // ✅ Mark all orders in current view as read
 markAllAsRead() {
    const currentOrders = this.filteredOrders || [];
    currentOrders.forEach(order => {
      if (order.id) {
        this.readOrderIds.add(order.id);
        if (this.notificationMap.has(order.id)) {
          this.notificationMap.delete(order.id);
        }
      }
    });
    this.saveReadOrdersToStorage();
    this.saveNotificationMapToStorage();
    this.updateNotificationCounts();
  }

   // ✅ Update notification counts
  updateNotificationCounts() {
    // 📤 Our Job Orders: Count orders with status updates (received, assigned, forwarded, etc.)
    const ourOrders = this.getAllOurOrders();
    this.ourOrdersUnreadCount = ourOrders.filter(o => {
      return this.notificationMap.has(o.id) && 
             this.notificationMap.get(o.id)?.type === 'status_update';
    }).length;
    
    // 📥 J.O. Request Management: Count new/forwarded orders
    const incomingOrders = this.getAllIncomingOrders();
    this.incomingOrdersUnreadCount = incomingOrders.filter(o => {
      return this.notificationMap.has(o.id) && 
             this.notificationMap.get(o.id)?.type === 'incoming';
    }).length;
  }
    // ✅ Check if order has a status update notification
  shouldShowStatusUpdate(order: any): boolean {
    if (!order || !order.id) return false;
    return this.notificationMap.has(order.id) && 
           this.notificationMap.get(order.id)?.type === 'status_update';
  }
 // ✅ Check if order has an incoming notification
  shouldShowIncomingNotification(order: any): boolean {
    if (!order || !order.id) return false;
    return this.notificationMap.has(order.id) && 
           this.notificationMap.get(order.id)?.type === 'incoming';
  }
  // ✅ Add notification for status update (called when status changes)
  addStatusUpdateNotification(orderId: number, status: string) {
    if (!orderId) return;
    this.notificationMap.set(orderId, { type: 'status_update', status });
    this.saveNotificationMapToStorage();
    this.updateNotificationCounts();
  }
   // ✅ Add notification for incoming order (called when new or forwarded)
  addIncomingNotification(orderId: number) {
    if (!orderId) return;
    if (!this.notificationMap.has(orderId)) {
      this.notificationMap.set(orderId, { type: 'incoming', status: '' });
      this.saveNotificationMapToStorage();
      this.updateNotificationCounts();
    }
  }
 
 // ✅ Get all orders for "Our Job Orders" view (without filters)
  getAllOurOrders(): any[] {
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    return this.allOrders.filter(o => {
      const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
      const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
      const submittedById = Number(o.submitted_by);
      const orderBranchId = Number(o.branch_id);
      const orderDeptId = Number(o.department_id);
      
      if (submittedById === currentUserId) return true;
      if (submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) return true;
      if (o.is_forwarded && orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId) return true;
      if (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname) return true;
      return false;
    });
  }

  // ✅ Get all orders for "Incoming" view (without filters)
  getAllIncomingOrders(): any[] {
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    return this.allOrders.filter(o => {
      const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
      const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
      const submittedById = Number(o.submitted_by);
      const orderBranchId = Number(o.branch_id);
      const orderDeptId = Number(o.department_id);
      const forwardedToBranchId = Number(o.forwarded_to_branch_id);
      const forwardedToDeptId = Number(o.forwarded_to_department_id);
      
      const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
      const isForwardedToUs = o.is_forwarded && 
                             (forwardedToBranchId === currentUserBranchId && forwardedToDeptId === currentUserDeptId);
      const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) && submittedById !== currentUserId;
      
      if (!o.is_forwarded) {
        return isForUs && isFromOthers;
      }
      
      const forwardedByCurrentUser = o.forwarded_by_name === this.currentUser?.fullname;
      return isForwardedToUs && isFromOthers && !forwardedByCurrentUser;
    });
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

  onMouseUp() { 
    this.isDragging = false; 
    this.currentDragModal = ''; 
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

  // ✅ Override setViewMode to mark all as read when switching views
   setViewMode(mode: string) { 
    // ✅ Mark all orders in the view as read when switching
    if (mode === 'our') {
      this.markAllOrdersInViewAsRead('our');
    } else if (mode === 'incoming') {
      this.markAllOrdersInViewAsRead('incoming');
    }
    
    this.viewMode = mode; 
    this.activeTab = 'all'; 
    this.applyFilters(); 
  }
  // ✅ Mark all orders in a specific view as read
    markAllOrdersInViewAsRead(view: string) {
    let orders: any[] = [];
    if (view === 'our') {
      orders = this.getAllOurOrders();
    } else if (view === 'incoming') {
      orders = this.getAllIncomingOrders();
    }
    
    orders.forEach(order => {
      if (order.id) {
        this.readOrderIds.add(order.id);
        if (this.notificationMap.has(order.id)) {
          this.notificationMap.delete(order.id);
        }
      }
    });
    this.saveReadOrdersToStorage();
    this.saveNotificationMapToStorage();
    this.updateNotificationCounts();
  }


  setActiveTab(tab: string) { 
    this.activeTab = tab; 
    this.applyFilters(); 
  }

  // ✅ Override loadAllOrders
   loadAllOrders(useCacheIfAvailable: boolean = false): void {
    // Check if we can use cache
    if (useCacheIfAvailable && this.isCacheValid()) {
      console.log('📦 Admin JO: Using valid cache, age:', 
        Math.round((Date.now() - this.ordersCache!.timestamp) / 1000), 's');
      this.allOrders = this.ordersCache!.data;
      this.checkForNewOrders();
      this.updateNotificationCounts();
      this.applyFilters();
      return;
    }
    
    // Stale cache: return cached data immediately, refresh in background
    if (!useCacheIfAvailable && this.ordersCache && this.ordersCache.data.length > 0 && !this.isCacheExpired()) {
      console.log('📦 Admin JO: Using stale cache (background refresh)');
      this.allOrders = this.ordersCache.data;
      this.checkForNewOrders();
      this.updateNotificationCounts();
      this.applyFilters();
      this.fetchOrdersInBackground();
      return;
    }
    
    // Try sessionStorage as last resort
    if (!useCacheIfAvailable && !this.isFetching) {
      const sessionData = this.loadFromSessionStorage();
      if (sessionData && sessionData.length > 0) {
        console.log('📦 Admin JO: Using sessionStorage cache while fetching');
        this.allOrders = sessionData;
        this.checkForNewOrders();
        this.updateNotificationCounts();
        this.applyFilters();
      }
    }
    
    // Fetch fresh data
    this.fetchOrdersFromServer();
  }
   // ✅ Fetch orders from server (deduplicated)
  private fetchOrdersFromServer(): void {
    const currentSignature = this.getRequestSignature();
    
    if (this.isFetching) {
      console.log('⏭️ Admin JO: Already fetching, skipping');
      return;
    }
    
    if (currentSignature === this.lastRequestSignature && 
        this.ordersCache && 
        (Date.now() - this.ordersCache.timestamp) < 2000) {
      console.log('⏭️ Admin JO: Duplicate request skipped (within 2s)');
      return;
    }
    
    this.lastRequestSignature = currentSignature;
    this.isFetching = true;
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).subscribe({
      next: (data) => { 
        let allOrders = Array.isArray(data) ? data : [];
        this.updateCache(allOrders);
        this.allOrders = allOrders;
        this.checkForNewOrders();
        this.updateNotificationCounts();
        this.applyFilters();
        this.isFetching = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        
        if (this.ordersCache && this.ordersCache.data.length > 0) {
          console.log('⚠️ Admin JO: Using cached data after error');
          this.allOrders = this.ordersCache.data;
          this.applyFilters();
        }
        
        this.isFetching = false;
        this.showToastMsg('Failed to load job orders', 'error');
      }
    });
  }
   // ✅ Fetch in background
  private fetchOrdersInBackground(): void {
    if (this.isFetching) return;
    
    this.isFetching = true;
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).subscribe({
      next: (data) => { 
        let allOrders = Array.isArray(data) ? data : [];
        this.updateCache(allOrders);
        this.allOrders = allOrders;
        this.checkForNewOrders();
        this.updateNotificationCounts();
        this.applyFilters();
        this.isFetching = false;
      },
      error: () => {
        this.isFetching = false;
      }
    });
  }

  // ✅ Check for new or forwarded orders
  checkForNewOrders() {
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    this.allOrders.forEach(o => {
      // ✅ Skip if already has a notification
      if (this.notificationMap.has(o.id)) return;
      
      const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
      const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
      const submittedById = Number(o.submitted_by);
      const orderBranchId = Number(o.branch_id);
      const orderDeptId = Number(o.department_id);
      const forwardedToBranchId = Number(o.forwarded_to_branch_id);
      const forwardedToDeptId = Number(o.forwarded_to_department_id);
      
      const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
      const isForwardedToUs = o.is_forwarded && 
                             (forwardedToBranchId === currentUserBranchId && forwardedToDeptId === currentUserDeptId);
      const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) && submittedById !== currentUserId;
      
      // ✅ Check if it's a status update for Our Job Orders
      const isStatusUpdate = o.status && ['approved', 'assigned', 'forwarded', 'done'].includes(o.status);
      
      if (isForUs && isFromOthers && (o.is_forwarded || isStatusUpdate)) {
        // ✅ Incoming notification (new or forwarded order)
        this.addIncomingNotification(o.id);
      } else if (isStatusUpdate && (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname)) {
        // ✅ Status update notification (for Our Job Orders)
        this.addStatusUpdateNotification(o.id, o.status);
      }
    });
  }

  receiveOrder(jo: any) {
    // Always use the numeric id, fallback to job_order_number only if id doesn't exist
    const orderId = jo.id || jo.job_order_number;
    this.router.navigate(['/admin/job-orders/approve'], { 
      queryParams: { id: orderId, mode: 'approve' } 
    });
  }

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
            const orderBranchId = Number(o.branch_id);
            const orderDeptId = Number(o.department_id);
            
            // 1. User created it
            if (submittedById === currentUserId) return true;
            
            // 2. Same department user created it
            if (submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) return true;
            
            // 3. Forwarded FROM our department
            if (o.is_forwarded && orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId) return true;
            
            // 4. Forwarded by current user
            if (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname) return true;
            
            return false;
        });
    } else if (this.viewMode === 'incoming') {
        filtered = filtered.filter(o => {
            const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
            const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
            const submittedById = Number(o.submitted_by);
            const orderBranchId = Number(o.branch_id);
            const orderDeptId = Number(o.department_id);
            const forwardedToBranchId = Number(o.forwarded_to_branch_id);
            const forwardedToDeptId = Number(o.forwarded_to_department_id);
            
            const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
            const isForwardedToUs = o.is_forwarded && 
                                   (forwardedToBranchId === currentUserBranchId && forwardedToDeptId === currentUserDeptId);
            const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) && submittedById !== currentUserId;
            
            return (isForUs || isForwardedToUs) && isFromOthers;
        });
    }
    
    if (status === 'all') return filtered.length;
    
    return filtered.filter(o => {
        if (o.is_forwarded) {
            return (o.status || 'pending') === status || (o.forwarded_status || '') === status;
        }
        return (o.status || 'pending') === status;
    }).length;
}
  applyFilters() {
    let filtered = [...this.allOrders];
    
    const currentUserBranchId = Number(this.currentUser?.branch_id);
    const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const currentUserId = Number(this.currentUser?.id);
    
    if (this.viewMode === 'our') {
      // ✅ OUR JOB ORDERS: Show orders we created OR we received and forwarded
      filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const submittedById = Number(o.submitted_by);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id);
        
        // 1. User created it
        if (submittedById === currentUserId) return true;
        
        // 2. Same department user created it
        if (submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) return true;
        
        // 3. Forwarded FROM our department (we sent it to someone else)
        if (o.is_forwarded && orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId) return true;
        
        // 4. Forwarded by current user
        if (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname) return true;
        
        return false;
      });
      
      // For "Our" view: Branch filter filters by RECIPIENT branch
      if (this.filters.branchId) {
        filtered = filtered.filter(o => 
          Number(o.branch_id) === Number(this.filters.branchId)
        );
      }
       this.updateNotificationCounts();
      if (this.filters.requestFromDept) {
        filtered = filtered.filter(o => 
          o.department === this.filters.requestFromDept ||
          o.department_name === this.filters.requestFromDept
        );
      }
    } else if (this.viewMode === 'incoming') {
    // ✅ J.O. REQUEST MANAGEMENT
    filtered = filtered.filter(o => {
        const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
        const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
        const submittedById = Number(o.submitted_by);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id);
        const forwardedToBranchId = Number(o.forwarded_to_branch_id);
        const forwardedToDeptId = Number(o.forwarded_to_department_id);
        // ✅ EXCLUDE: Unapproved orders (no approved_name and no approved_signature)
        if (o.status === 'pending' && !o.approved_name && !o.approved_signature) {
            return false;
        }
        const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
        const isForwardedToUs = o.is_forwarded && (forwardedToBranchId === currentUserBranchId && forwardedToDeptId === currentUserDeptId);
        const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) && submittedById !== currentUserId;
        if (!o.is_forwarded) {
            return isForUs && isFromOthers;
        }
        const forwardedByCurrentUser = o.forwarded_by_name === this.currentUser?.fullname;
        return isForwardedToUs && isFromOthers && !forwardedByCurrentUser;
    });
      // For "Incoming" view: Branch filter by submitter's branch
      if (this.filters.branchId) {
        filtered = filtered.filter(o => 
          Number(o.submitter_branch_id || o.submitted_by_branch_id) === Number(this.filters.branchId)
        );
      }
      if (this.filters.requestFromDept) {
        filtered = filtered.filter(o => 
          o.request_dept === this.filters.requestFromDept
        );
      }
    }
    // Apply status tab filter
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(o => {
        if (o.is_forwarded) {
          return (o.status || 'pending') === this.activeTab || 
                 (o.forwarded_status || '') === this.activeTab;
        }
        return (o.status || 'pending') === this.activeTab;
      });
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

  newJobOrder() { 
    this.router.navigate(['/job-orders/new']); 
  }

  // Load branches for forward modal
  loadForwardBranches() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        const allBranches = branches || [];
        const currentUserBranchId = Number(this.currentUser?.branch_id);
        const mainBranchIds = [1, 5];
        
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

  openForwardModal(req: any) {
    this.forwardTargetReq = req;
    this.forwardBranchId = null;
    this.forwardDepartmentId = null;
    this.forwardFilteredDepartments = [];
    this.showForwardModal = true;
    this.loadForwardBranches();
    this.forwardModalPos = { x: 0, y: 0 };
  }

  cancelForward() {
    this.showForwardModal = false;
    this.forwardTargetReq = null;
    this.forwardBranchId = null;
    this.forwardDepartmentId = null;
  }

  onForwardBranchChange() {
    if (!this.forwardBranchId) {
      this.forwardFilteredDepartments = [];
      this.forwardDepartmentId = null;
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
confirmForward() {
    if (!this.forwardTargetReq || !this.forwardBranchId || !this.forwardDepartmentId) return;
    
    const jo = this.forwardTargetReq;
    const userName = this.currentUser?.fullname || 'Admin';
    const payload = {
      forwarded_to_branch_id: this.forwardBranchId,
      forwarded_to_department_id: this.forwardDepartmentId,
      forwarded_by_name: userName
    };
    
    // Optimistic update
    this.updateLocalOrder(jo.id, {
      is_forwarded: 1,
      status: 'forwarded',
      forwarded_status: 'pending',
      ...payload
    });
    this.addIncomingNotification(jo.id);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/forward`, payload, { headers }).subscribe({
      next: () => {
         const toBranchName = this.getBranchName(this.forwardBranchId!);
        const toDeptName = this.getDepartmentName(this.forwardDepartmentId!);
        const fromBranchName = this.getBranchName(jo.branch_id);
        const fromDeptName = jo.department_name || jo.department || this.getDepartmentName(jo.department_id);
         // Admin side - notify creator
        this.notificationService.handleJobOrderForwarded(
            jo, userName, toBranchName, toDeptName, jo.submitted_by
        );
        
        // Client side - notify new recipient department
        this.clientNotificationService.handleJobOrderForwarded(
            jo, userName, this.forwardBranchId!, this.forwardDepartmentId!,
            fromBranchName, fromDeptName
        );
        
        this.cancelForward();
        this.showToastMsg('📤 Job Order forwarded successfully!', 'success');
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: (err) => {
        console.error('Forward failed:', err);
        // Revert
        this.updateLocalOrder(jo.id, { 
          status: 'approved', 
          is_forwarded: 0, 
          forwarded_status: null,
          forwarded_to_branch_id: null,
          forwarded_to_department_id: null,
          forwarded_by_name: null
        });
        this.cancelForward();
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

   confirmReassign() {
    if (!this.reassignTarget || this.selectedReassignUsers.length === 0) return;
    
    const jo = this.reassignTarget;
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const assignedNames = this.selectedReassignUsers.map(u => u.fullname || u.username).join(', ');
    
    const payload: any = {
      assigned_to: this.selectedReassignUsers[0].id,
      assigned_users: this.selectedReassignUsers.map(u => u.id),
      assigned_names: assignedNames
    };
    
    // Optimistic update
    this.updateLocalOrder(jo.id, { assigned_names: assignedNames });
    
    this.closeReassignModal();
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
      next: () => {
        this.showToastMsg('✅ Users reassigned successfully!', 'success');
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: () => {
        this.updateLocalOrder(jo.id, { assigned_names: jo.assigned_names });
        this.showToastMsg('⚠️ Failed to reassign users', 'error');
      }
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

 getStatusLabel(status: string, jo?: any): string {
    // ✅ Check if it's pending but has no approval
    if (status === 'pending' && jo && !jo.approved_name && !jo.approved_signature) {
        return 'For Approval';
    }
    
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

     // ✅ Override viewDetail to mark as read
  viewDetail(jo: any) { 
    this.selectedOrder = jo; 
    this.detailModalPos = { x: 0, y: 0 }; 
    this.showDetailModal = true;
    
    // ✅ Mark as read when viewed
    if (jo.id) {
      this.markOrderAsRead(jo.id);
    }
  }

  closeDetailModal() { 
    this.showDetailModal = false; 
    this.selectedOrder = null; 
  }

  markAsDone(jo: any) { 
    this.confirmTarget = jo; 
    this.confirmAction = 'done'; 
    this.confirmModalPos = { x: 0, y: 0 }; 
    this.showConfirmModal = true; 
  }

  updateStatus(jo: any, status: string) { 
    this.confirmTarget = jo; 
    this.confirmAction = status === 'rejected' ? 'reject' : 'done'; 
    this.confirmModalPos = { x: 0, y: 0 }; 
    this.showConfirmModal = true; 
  }

  canDelete(jo: any): boolean {
    if (!this.currentUser) return false;
    
    const role = (this.currentUser?.role || '').toLowerCase().trim();
    const isAdmin = role === 'admin';
    const isHeadOrSupervisor = role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
    
    // ✅ Admin can always delete
    if (isAdmin) return true;
    
    // ✅ Head/Manager/Supervisor can delete in BOTH views
    if (isHeadOrSupervisor) return true;
    
    // ❌ For "J.O. Request Management" (incoming) view:
    // Regular users (Staff, Technician, etc.) CANNOT delete ANYTHING
    if (this.viewMode === 'incoming') return false;
    
    // ✅ For "Our Job Orders" (our) view:
    // Regular users can ONLY delete their OWN pending orders
    if (this.viewMode === 'our') {
        const isOwner = jo.submitted_by === this.currentUser.id;
        const isPending = (jo.status || 'pending') === 'pending';
        return isOwner && isPending;
    }
    
    return false;
}

  loadFilterBranches() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.allBranches = branches || [];
        
        const allBranches = branches || [];
        const currentUserBranchId = Number(this.currentUser?.branch_id);
        const mainBranchIds = [1, 5];
        
        if (mainBranchIds.includes(currentUserBranchId)) {
          this.filteredBranches = allBranches;
        } else {
          this.filteredBranches = allBranches.filter(b => 
            b.id === currentUserBranchId || mainBranchIds.includes(b.id)
          );
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
    
    this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
      next: (depts) => { 
        this.allDepartments = depts || []; 
      },
      error: (err) => console.error('Failed to load departments:', err)
    });
  }

  getBranchName(branchId: number): string {
    if (!branchId) return '—';
    const branch = this.allBranches.find(b => b.id == branchId);
    return branch?.name || '—';
  }

  getBranchCompany(branchId: number): string {
    if (!branchId) return '—';
    const branch = this.allBranches.find(b => b.id == branchId);
    return branch?.company_name || '—';
  }

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
    
    if (this.confirmAction === 'delete') {
      this.confirmDelete();
      return;
    }
    
    let status: string;
    let extraPayload: any = {};
    if (this.confirmAction === 'reject') { 
      status = 'rejected'; 
    } else if (this.confirmAction === 'done') { 
      status = 'done'; 
      extraPayload = { 
        done_name: this.currentUser?.fullname || 'Admin', 
        done_date: new Date().toISOString().split('T')[0] 
      }; 
    } else { 
      return; 
    }
    
    // Optimistic update
    const updates: any = { ...extraPayload };
    if (jo.is_forwarded) {
      updates.forwarded_status = status;
    } else {
      updates.status = status;
    }
    this.updateLocalOrder(jo.id, updates);
    this.addStatusUpdateNotification(jo.id, status);
    
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const payload: any = { ...extraPayload };
    
    if (jo.is_forwarded) {
      payload.forwarded_status = status;
    } else {
      payload.status = status;
    }
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
      next: () => {
        const userName = this.currentUser?.fullname || 'Admin';
        
        if (status === 'done') {
            if (jo.is_forwarded) {
                this.notificationService.handleForwardedJobOrderDone(
                    jo, userName, jo.submitted_by
                );
                this.clientNotificationService.handleForwardedJobOrderDone(
                    jo, userName, jo.branch_id, jo.department_id
                );
            } else {
                this.notificationService.handleJobOrderDone(
                    jo, userName, jo.submitted_by
                );
                this.clientNotificationService.handleJobOrderDone(
                    jo, userName, jo.branch_id, jo.department_id
                );
            }
        }
        this.showConfirmModal = false; 
        this.confirmTarget = null; 
        this.confirmAction = null;
        this.showToastMsg(`✅ Job Order ${status === 'done' ? 'marked as Done' : 'rejected'}!`, 'success');
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: () => {
        // Revert on error
        if (jo.is_forwarded) {
          this.updateLocalOrder(jo.id, { forwarded_status: jo.forwarded_status });
        } else {
          this.updateLocalOrder(jo.id, { status: jo.status });
        }
        this.showConfirmModal = false; 
        this.confirmTarget = null; 
        this.confirmAction = null;
        this.showToastMsg('⚠️ Failed to update', 'error');
      }
    });
  }

  deleteOrder(jo: any) { 
    this.confirmTarget = jo; 
    this.confirmAction = 'delete'; 
    this.confirmModalPos = { x: 0, y: 0 }; 
    this.showConfirmModal = true; 
  }
saveNotificationMapToStorage() {
  localStorage.setItem('jobOrderNotifications', JSON.stringify(Array.from(this.notificationMap.entries())));
}
 confirmDelete() {
    if (!this.confirmTarget) return;
    const jo = this.confirmTarget;
    const orderId = jo.id;
    
    // ✅ CLEAR CACHE FIRST
    this.clearCache();
    
    // Optimistic delete
    this.allOrders = this.allOrders.filter(o => o.id !== orderId);
    
    // ✅ Force close modal and reset
    this.showConfirmModal = false; 
    this.confirmTarget = null; 
    this.confirmAction = null;
    
    // ✅ Apply filters to update counts and display
    this.applyFilters();
    this.updateNotificationCounts();
    
    this.http.delete(`${environment.apiUrl}/api/admin/job-orders/${orderId}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.showToastMsg('✅ Job Order deleted!', 'success');
        // ✅ Force fresh fetch from server
        this.clearCache();
        this.fetchOrdersFromServer();
      },
      error: () => {
        // Restore on error - clear cache and reload
        this.clearCache();
        this.loadAllOrders(false);
        this.showToastMsg('⚠️ Delete failed, restored', 'error');
      }
    });
}

  cancelConfirm() { 
    this.showConfirmModal = false; 
    this.confirmTarget = null; 
    this.confirmAction = null; 
  }

  formatDateMonth(val: any): string {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    } catch { return String(val); }
  }

  formatTime(val: any): string {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) {
        const [hours, minutes] = val.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch { return ''; }
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
    const fmtDate = (val: any) => { 
      if (!val) return '—'; 
      const d = new Date(val); 
      if (isNaN(d.getTime())) return val; 
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
    };
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Job Order - ${jo.job_order_number}</title><style>
      @page{size:A5 portrait;margin:6mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:9px;color:#000}
      .receipt{border:1px solid #000;padding:10px 14px;max-width:420px;margin:0 auto}
      h2{text-align:center;font-size:14px;text-transform:uppercase}
      .row{display:flex;margin:3px 0;font-size:8px}
      .lbl{font-weight:bold;width:65px;color:#555}
      .val{flex:1;font-weight:bold}
      .desc{border:1px solid #eee;padding:6px;min-height:40px;background:#fafafa;margin:6px 0}
      .sigs{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #000}
      .sig{flex:1;text-align:center}
      .sig img{max-width:80px;max-height:30px}
      .signame{font-size:9px;font-weight:bold;border-bottom:1px solid #000}
      @media print{body{padding:0}}
    </style></head><body>
      <div class="receipt">
        <h2>JOB ORDER</h2>
        <p style="text-align:center;font-size:7px">Ref: ${jo.job_order_number||'N/A'}</p>
        <div class="row"><span class="lbl">Date:</span><span class="val">${fmtDate(jo.date)}</span></div>
        <div class="row"><span class="lbl">Company:</span><span class="val">${jo.company||'—'}</span></div>
        <div class="row"><span class="lbl">Dept:</span><span class="val">${jo.department||'—'}</span></div>
        <div class="row"><span class="lbl">Request:</span><span class="val">${jo.request_dept||'—'}</span></div>
        <p style="font-weight:bold;font-size:8px;margin-top:6px">Particulars:</p>
        <div class="desc">${jo.particulars||'No details'}</div>
        <div class="sigs">
          <div class="sig">${jo.requested_signature?`<img src="${jo.requested_signature}">`:''}<div class="signame">${jo.requested_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.requested_date)}</div></div>
          <div class="sig">${jo.approved_signature?`<img src="${jo.approved_signature}">`:''}<div class="signame">${jo.approved_name||'—'}</div></div>
          <div class="sig">${jo.received_signature?`<img src="${jo.received_signature}">`:''}<div class="signame">${jo.received_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.received_date)}</div></div>
        </div>
      </div>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
    </body></html>`);
    printWindow.document.close();
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  // Assign modal methods
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
            
            this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
                next: (newUsers) => {
                    (newUsers || []).forEach(u => {
                        const name = u.fullname || u.username;
                        if (name) {
                            this.userRolesMap.set(name, u.role || 'Staff');
                        }
                    });
                    console.log('👥 Admin JO - User roles loaded:', this.userRolesMap.size);
                },
                error: () => {
                    console.log('⚠️ Could not load new_user roles');
                }
            });
        },
        error: (err) => {
            console.warn('Could not load user roles:', err);
        }
    });
}
getAttnRole(attnName: string): string {
    if (!attnName) return '';
    const cached = this.userRolesMap.get(attnName);
    if (cached) return cached;
    
    for (const [name, role] of this.userRolesMap.entries()) {
        if (name.includes(attnName) || attnName.includes(name)) {
            return role;
        }
    }
    return '';
}
  loadAllUsersForDepartment(departmentId: number) {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (allUsers) => {
        this.assignUsers = (allUsers || []).filter(u => 
          Number(u.department_id) === Number(departmentId) || Number(u.dept_id) === Number(departmentId)
        );
        if (this.assignUsers.length === 0) {
          this.assignUsers = [{ 
            id: this.currentUser?.id, 
            fullname: this.currentUser?.fullname || 'Current User', 
            username: this.currentUser?.username, 
            role: this.currentUser?.role || 'staff' 
          }];
        }
        this.selectedAssignUsers = [...this.assignUsers];
        this.filterAssignUsers();
      },
      error: () => {
        this.assignUsers = [{ 
          id: this.currentUser?.id, 
          fullname: this.currentUser?.fullname || 'Current User', 
          username: this.currentUser?.username, 
          role: this.currentUser?.role || 'staff' 
        }];
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
        (u.fullname || u.username || '').toLowerCase().includes(term) || 
        (u.role || '').toLowerCase().includes(term)
      );
    }
  }

  isUserSelected(userId: number): boolean { 
    return this.selectedAssignUsers.some(u => u.id === userId); 
  }

  toggleUserSelection(user: any) {
    if (this.isUserSelected(user.id)) {
      this.selectedAssignUsers = this.selectedAssignUsers.filter(u => u.id !== user.id);
    } else {
      this.selectedAssignUsers.push(user);
    }
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) { 
      this.selectedAssignUsers = [...this.filteredAssignUsers]; 
    } else { 
      this.selectedAssignUsers = []; 
    }
  }

  confirmAssign() {
    if (!this.assignTarget || this.selectedAssignUsers.length === 0) return;
    
    const jo = this.assignTarget;
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const assignedNames = this.selectedAssignUsers.map(u => u.fullname || u.username).join(', ');
    
    const payload: any = {
      assigned_to: this.selectedAssignUsers[0].id,
      assigned_users: this.selectedAssignUsers.map(u => u.id),
      assigned_names: assignedNames
    };
    
    // Optimistic update
    const updates: any = {
      assigned_names: assignedNames,
      assigned_users: JSON.stringify(this.selectedAssignUsers.map(u => u.id))
    };
    if (jo.is_forwarded) {
      updates.forwarded_status = 'assigned';
      payload.forwarded_status = 'assigned';
    } else {
      updates.status = 'assigned';
      payload.status = 'assigned';
    }
    this.updateLocalOrder(jo.id, updates);
    
    this.closeAssignModal();
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
      next: () => {
         const userName = this.currentUser?.fullname || 'Admin';
        
        if (jo.is_forwarded) {
            this.notificationService.handleForwardedJobOrderAssigned(
                jo, userName, assignedNames, jo.submitted_by
            );
            this.clientNotificationService.handleForwardedJobOrderAssigned(
                jo, userName, assignedNames, jo.branch_id, jo.department_id
            );
        } else {
            this.notificationService.handleJobOrderAssigned(
                jo, userName, assignedNames, jo.submitted_by
            );
            this.clientNotificationService.handleJobOrderAssigned(
                jo, userName, assignedNames, jo.branch_id, jo.department_id
            );
        }
        this.showToastMsg('✅ Users assigned successfully!', 'success');
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: () => {
        // Revert
        if (jo.is_forwarded) {
          this.updateLocalOrder(jo.id, { forwarded_status: 'approved', assigned_names: null });
        } else {
          this.updateLocalOrder(jo.id, { status: 'approved', assigned_names: null });
        }
        this.showToastMsg('⚠️ Failed to assign users', 'error');
      }
    });
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.assignTarget = null;
    this.selectedAssignUsers = [];
    this.assignSearchTerm = '';
    this.assignModalPos = { x: 0, y: 0 };
  }
  ngOnDestroy() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }
}
