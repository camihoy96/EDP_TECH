import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs/internal/Subscription';
import { ClientNotificationService } from '../../services/client-notification.service';
import { NotificationService } from '../../services/notification.service';
@Component({
  selector: 'app-job-orders-management',
  standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-container">
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
          <button class="classic-btn primary" routerLink="/client/job-orders/new">
            <span>➕</span> New Job Order
          </button>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs-bar" *ngIf="allOrders.length > 0">
        <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
          📋 All <span class="tab-count">{{ getFilteredStatusCount('all') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
          ⏳ Pending <span class="tab-count pending-count">{{ getFilteredStatusCount('pending') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
          📥 Received <span class="tab-count approved-count">{{ getFilteredStatusCount('approved') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'assigned'" (click)="setActiveTab('assigned')">
          👤 Assigned <span class="tab-count assigned-count">{{ getFilteredStatusCount('assigned') }}</span>
        </button>
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
    <ng-container *ngFor="let branch of filteredBranches; let i = index">
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
                <div class="creator-info" *ngIf="jo.requested_name">
                  <span class="creator-label">by: {{ jo.requested_name }}</span>
                </div>
              </td>
              <td class="attn-cell">
                <div class="attn-info">
                  <span>{{ jo.job_order_for || '—' }}</span>
                </div>
              </td>
              <td class="date-cell">
  {{ formatDate(jo.date) }}
  <div class="time-under-date" *ngIf="jo.time">{{ formatTime(jo.time) }}</div>
</td>
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
      <!-- ✅ FIXED: Show forwarder's info -->
      <span class="forward-label">📥 From: {{ jo.forwarded_by_name || '—' }}</span>
      <span class="forward-dept">{{ jo.department_name || jo.department || '—' }}</span>
      <span class="branch-tag-tiny">{{ jo.forwarder_branch_name || jo.branch_name || '—' }}</span>
      <span class="forward-company" *ngIf="jo.forwarder_company_name || jo.company_name">{{ jo.forwarder_company_name || jo.company_name }}</span>
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
<!-- ✅ Edit button - for pending orders in both views -->
<button class="action-btn edit-btn" 
        *ngIf="jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending')" 
        (click)="editOrder(jo)" title="Edit">✏️</button>
  <button class="action-btn view-btn" (click)="viewDetail(jo)" title="View">👁️</button>
  <button class="action-btn print-btn" (click)="printOrder(jo)" title="Print">🖨️</button>
  
  <!-- ✅ Receive button - ONLY in J.O. Request Management -->
  <button class="action-btn accept-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending'))" 
          (click)="receiveOrder(jo)" title="Receive">📥</button>
<!-- ✅ Forward button - ONLY when status is approved (received) -->
<button class="action-btn forward-btn" 
        *ngIf="viewMode === 'incoming' && jo.status === 'approved'" 
        (click)="forwardOrder(jo)" title="Forward">➡️</button>

  <!-- ✅ Assign / Reassign button - FIXED -->
<!-- ✅ Reassign button - for supervisor/head/manager only when already assigned -->
<button class="action-btn assign-btn" 
        *ngIf="canReassign() && viewMode === 'incoming' && (
          jo.status === 'assigned' || 
          (jo.is_forwarded && jo.forwarded_status === 'assigned')
        )" 
        (click)="assignOrder(jo)" 
        title="Reassign">🔄</button>
  
  <!-- ✅ Done button - ONLY in J.O. Request Management -->
  <button class="action-btn done-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'assigned' || (jo.is_forwarded && jo.forwarded_status === 'assigned'))" 
          (click)="markAsDone(jo)" title="Mark as Done">✅</button>
  
  <!-- ✅ Reject button - ONLY in J.O. Request Management -->
  <button class="action-btn reject-btn" 
          *ngIf="viewMode === 'incoming' && (jo.status === 'pending' || (jo.is_forwarded && jo.forwarded_status === 'pending'))" 
          (click)="updateStatus(jo, 'rejected')" title="Reject">❌</button>
  
  <!-- ✅ Delete button -->
  <button class="action-btn delete-btn" *ngIf="canDelete(jo)" (click)="deleteOrder(jo)" title="Delete">🗑️</button>
</td>
            </tr>
            <tr *ngIf="filteredOrders.length === 0">
              <td [attr.colspan]="8" class="empty-row">No job orders found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
<div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetailModal()">
  <div class="modal-window view-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab;">
      <span>📋 Job Order Details</span>
      <button type="button" (click)="closeDetailModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body view-body" *ngIf="selectedOrder">
      <div class="view-header-info">
        <div class="view-req-number">
          <span class="view-label">JO #:</span>
          <code>{{ selectedOrder.job_order_number }}</code>
        </div>
        <span class="status-badge" [class]="'status-' + (selectedOrder.status || 'pending')">
          {{ getStatusLabel(selectedOrder.status) }}
        </span>
      </div>
      
      <div class="view-grid">
  <div class="view-field">
    <label>Date:</label>
    <span>{{ formatDate(selectedOrder.date) }}</span>
  </div>
  <div class="view-field">
    <label>Time:</label>
    <span>{{ formatTime(selectedOrder.time) || '—' }}</span>
  </div>
  <div class="view-field">
    <label>Job For:</label>
    <span>{{ selectedOrder.job_order_for || '—' }}</span>
  </div>
  <div class="view-field full-width">
    <label>Requested By:</label>
    <span>{{ selectedOrder.requested_name || '—' }}</span>
  </div>
</div>

     <!-- ✅ Our Job Orders: Show Recipient Info -->
<div class="view-section" *ngIf="viewMode === 'our'">
  <h4>📥 Recipient</h4>
  <div class="detail-info-row">
    <div class="detail-info-item">
      <label>Department:</label>
      <span>{{ getDepartmentName(selectedOrder.department_id) || selectedOrder.department_name || selectedOrder.department || '—' }}</span>
    </div>
    <div class="detail-info-item">
      <label>Branch:</label>
      <span>{{ getBranchName(selectedOrder.branch_id) || selectedOrder.branch_name || '—' }}</span>
    </div>
    <div class="detail-info-item">
      <label>Company:</label>
      <span>{{ getBranchCompany(selectedOrder.branch_id) || selectedOrder.company_name || selectedOrder.company || '—' }}</span>
    </div>
  </div>
</div>

<!-- ✅ J.O. Request Management: Show Request From Info -->
<div class="view-section" *ngIf="viewMode === 'incoming'">
  <h4>📤 Request From</h4>
  <div class="detail-info-row">
    <div class="detail-info-item">
      <label>Department: </label>
      <span>{{ selectedOrder.request_dept || getDepartmentName(selectedOrder.department_id) || selectedOrder.department_name || '—' }}</span>
    </div>
    <div class="detail-info-item">
      <label>Branch:</label>
      <span>{{ getBranchName(selectedOrder.branch_id) || selectedOrder.branch_name || '—' }}</span>
    </div>
    <div class="detail-info-item">
      <label>Company:</label>
      <span>{{ getBranchCompany(selectedOrder.branch_id) || selectedOrder.company_name || selectedOrder.company || '—' }}</span>
    </div>
    <div class="detail-info-item" *ngIf="selectedOrder.submitted_by_name">
      <label>Submitted By:</label>
      <span>👤 {{ selectedOrder.submitted_by_name }}</span>
    </div>
  </div>
</div>
          
      <!-- Forwarded Information -->
      <div class="view-section" *ngIf="selectedOrder.is_forwarded">
        <h4>📤 Forward Information</h4>
        <div class="detail-info-row">
          <ng-container *ngIf="viewMode === 'our'">
            <div class="detail-info-item">
              <label>Forwarded To Branch:</label>
              <span>{{ selectedOrder.forwarded_to_branch_name || '—' }}</span>
            </div>
            <div class="detail-info-item">
              <label>Forwarded To Dept:</label>
              <span>{{ selectedOrder.forwarded_to_department_name || '—' }}</span>
            </div>
          </ng-container>
          <ng-container *ngIf="viewMode === 'incoming'">
            <div class="detail-info-item">
              <label>Forwarded From Branch:</label>
              <span>{{ selectedOrder.branch_name || '—' }}</span>
            </div>
            <div class="detail-info-item">
              <label>Forwarded From Dept:</label>
              <span>{{ selectedOrder.department_name || selectedOrder.department || '—' }}</span>
            </div>
          </ng-container>
          <div class="detail-info-item">
            <label>Forwarded By:</label>
            <span>{{ selectedOrder.forwarded_by_name || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Forwarded Date:</label>
            <span>{{ formatDate(selectedOrder.forwarded_date) }}</span>
          </div>
        </div>
      </div>

      <!-- Assigned Users -->
      <div class="view-section" *ngIf="selectedOrder.assigned_names">
        <h4>👤 Assigned To</h4>
        <div class="assigned-info">
          <span class="assigned-names">{{ selectedOrder.assigned_names || '—' }}</span>
        </div>
      </div>
          
      <div class="view-section">
        <h4>📝 Description</h4>
        <div class="view-remarks">{{ selectedOrder.particulars || selectedOrder.remarks || 'No description provided.' }}</div>
      </div>

      <div class="view-section">
        <h4>✍️ Signatures</h4>
        <div class="view-signatures">
          <div class="view-sig-block" *ngIf="selectedOrder.requested_signature || selectedOrder.requested_name">
            <h5>Requested By</h5>
            <div class="view-sig-image" *ngIf="selectedOrder.requested_signature">
              <img [src]="selectedOrder.requested_signature" alt="Signature">
            </div>
            <div class="view-sig-name">{{ selectedOrder.requested_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(selectedOrder.requested_date) }}</div>
          </div>
          <div class="view-sig-block" *ngIf="selectedOrder.approved_signature || selectedOrder.approved_name">
            <h5>Approved By</h5>
            <div class="view-sig-image" *ngIf="selectedOrder.approved_signature">
              <img [src]="selectedOrder.approved_signature" alt="Signature">
            </div>
            <div class="view-sig-name">{{ selectedOrder.approved_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(selectedOrder.approved_date) }}</div>
          </div>
          <div class="view-sig-block" *ngIf="selectedOrder.received_signature || selectedOrder.received_name">
            <h5>Received By</h5>
            <div class="view-sig-image" *ngIf="selectedOrder.received_signature">
              <img [src]="selectedOrder.received_signature" alt="Signature">
            </div>
            <div class="view-sig-name">{{ selectedOrder.received_name || '—' }}</div>
            <div class="view-sig-date">{{ formatDate(selectedOrder.received_date) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Done Info -->
      <div class="view-section" *ngIf="selectedOrder.status === 'done' && selectedOrder.done_name">
        <h4>✅ Completed</h4>
        <div class="detail-info-row">
          <div class="detail-info-item">
            <label>Done By:</label>
            <span>{{ selectedOrder.done_name || '—' }}</span>
          </div>
          <div class="detail-info-item">
            <label>Done Date:</label>
            <span>{{ formatDate(selectedOrder.done_date) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="printOrder(selectedOrder)">🖨️ Print</button>
      <button class="classic-btn" (click)="closeDetailModal()">Close</button>
    </div>
  </div>
</div>
    <!-- Confirm Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal" (click)="cancelConfirm()">
      <div class="modal-window" (click)="$event.stopPropagation()">
        <div class="modal-titlebar danger" (mousedown)="startDrag($event)" style="cursor: grab;">
          <span>{{ confirmAction === 'done' ? '✅ Mark as Done' : confirmAction === 'reject' ? '❌ Reject' : '🗑️ Delete' }}</span>
          <button type="button" (click)="cancelConfirm()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">{{ confirmAction === 'done' ? '✅' : confirmAction === 'reject' ? '❌' : '⚠️' }}</span>
            <div class="warning-message">
              <h3 *ngIf="confirmAction === 'done'">Mark this job order as done?</h3>
              <h3 *ngIf="confirmAction === 'reject'">Reject this job order?</h3>
              <h3 *ngIf="confirmAction === 'delete'">Delete this job order?</h3>
              <p>Job Order: <strong>#{{ confirmTarget?.job_order_number }}</strong></p>
              <p class="warning-hint danger-text" *ngIf="confirmAction === 'delete'">This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="classic-btn" (click)="cancelConfirm()">Cancel</button>
            <button class="classic-btn danger" (click)="confirmStatusUpdate()">
              {{ confirmAction === 'done' ? '✅ Mark Done' : confirmAction === 'reject' ? '❌ Reject' : '🗑️ Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
 <!-- Assign Modal -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window assign-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab;">
      <span>👤 Assign Users</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
     <div class="assign-info" *ngIf="assignTarget">
    <p>Job Order: <strong>#{{ assignTarget.job_order_number }}</strong></p>
    <p>Department: <strong>{{ currentUser?.department_name || currentUser?.department || assignTarget.department_name || assignTarget.department || '—' }}</strong></p>
</div>
      
      <!-- Select All / Deselect All -->
      <div class="assign-select-all" *ngIf="filteredAssignUsers.length > 0">
        <label class="checkbox-label">
          <input type="checkbox" 
                 [checked]="selectedAssignUsers.length === filteredAssignUsers.length"
                 (change)="toggleSelectAll($event)">
          <span>Select All ({{ filteredAssignUsers.length }} users)</span>
        </label>
      </div>
      
      <div class="assign-search">
        <input type="text" class="classic-input" placeholder="Search users..." 
               [(ngModel)]="assignSearchTerm" (input)="filterAssignUsers()">
      </div>
      
      <div class="assign-user-list">
        <div class="assign-user-item" *ngFor="let user of filteredAssignUsers" 
             [class.selected]="isUserSelected(user.id)">
          <label class="checkbox-label user-label" (click)="$event.stopPropagation()">
            <input type="checkbox" 
                   [checked]="isUserSelected(user.id)"
                   (change)="toggleUserSelection(user)">
          </label>
          <span class="assign-user-name">{{ user.fullname || user.username }}</span>
          <span class="assign-user-role">{{ user.role }}</span>
        </div>
        <div class="assign-empty" *ngIf="filteredAssignUsers.length === 0">
          No users found in this department
        </div>
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
<!-- Forward Modal -->
<div class="modal-overlay" *ngIf="showForwardModal" (click)="closeForwardModal()">
  <div class="modal-window forward-modal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event)" style="cursor: grab;">
      <span>➡️ Forward Job Order</span>
      <button type="button" (click)="closeForwardModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="assign-info" *ngIf="forwardTarget">
        <p>Job Order: <strong>#{{ forwardTarget.job_order_number }}</strong></p>
      </div>
      
      <div class="filter-group" style="margin-bottom: 10px;">
        <label>Branch:</label>
        <select class="classic-select" [(ngModel)]="forwardData.branchId" (change)="onForwardBranchChange()" style="width: 100%;">
          <option value="">— Select Branch —</option>
          <option *ngFor="let branch of forwardBranches" [value]="branch.id">
            🏢 {{ branch.name }} <small>({{ branch.company_name || '' }})</small>
          </option>
        </select>
      </div>
      
      <div class="filter-group" style="margin-bottom: 10px;">
        <label>Department:</label>
        <select class="classic-select" [(ngModel)]="forwardData.departmentId" style="width: 100%;">
          <option value="">— Select Department —</option>
          <option *ngFor="let dept of forwardDepartments" [value]="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="classic-btn" (click)="closeForwardModal()">Cancel</button>
      <button class="classic-btn primary" (click)="confirmForward()" [disabled]="!forwardData.branchId || !forwardData.departmentId">
        ➡️ Forward
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
    .status-tabs-bar { display: flex; gap: 2px; padding: 4px 6px; background: #e8e8e8; border: 1px solid #a0a0a0; margin-bottom: 6px; flex-wrap: wrap; }
    .status-tab { background: #d4d0c8; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px 2px 0 0; padding: 5px 12px; cursor: pointer; font-size: 12px; color: #333; display: inline-flex; align-items: center; gap: 6px; }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 12px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .tab-count.pending-count { background: #cc6600; }
    .tab-count.approved-count { background: #008800; }
    .tab-count.assigned-count { background: #0a3a8c; }
    .tab-count.forwarded-count { background: #0a3a8c; }
    .tab-count.done-count { background: #0066cc; }
    .tab-count.rejected-count { background: #cc0000; }
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
    .date-cell { font-family: monospace; font-size: 12px; white-space: nowrap; color: #555; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dept-name-small { font-weight: 600; font-size: 12px; color: #0a3a8c; display: block; }
    .branch-tag-tiny { font-size: 12px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
    .forward-label { font-weight: 600; color: #0a3a8c; font-size: 12px; display: block; }
    .forward-dept { color: #666; font-size: 1px; display: block; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-assigned { background: #f0f4ff; color: #0a3a8c; }
    .status-forwarded { background: #e8f0ff; color: #0a3a8c; }
    .status-done { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .status-forwarded-sub { font-size: 1px; font-style: italic; color: #666; margin-top: 2px; border-top: 1px dotted #ccc; padding-top: 2px; }
    .assigned-under-status { margin-top: 3px; font-size: 12px; color: #0a3a8c; font-style: italic; border-top: 1px dotted #c0c0c0; padding-top: 3px; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0fe; border-color: #a0a0a0; }
    .view-btn:hover { color: #0a3a8c; }
    .print-btn:hover { color: #008800; }
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
    
    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 100%; max-width: 420px; }
    .view-modal { max-width: 650px !important; }
    .modal-titlebar { background: #0a246a; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; cursor: grab; user-select: none; }
    .modal-titlebar:active { cursor: grabbing; }
    .modal-titlebar.danger { background: #cc0000; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 3px 8px; font-size: 14px; }
    .modal-body { padding: 16px; }
    .view-body { max-height: 55vh; overflow-y: auto; padding: 16px 20px; }
    .view-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #0a246a; }
    .view-req-number { display: flex; align-items: center; gap: 10px; }
    .view-label { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; }
    .view-req-number code { font-size: 14px; background: #f0f4ff; padding: 4px 10px; border-radius: 3px; color: #0a3a8c; border: 1px solid #b8c8e8; font-weight: bold; }
    .view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; }
    .view-field { display: flex; flex-direction: column; gap: 3px; }
    .view-field.full-width { grid-column: 1 / -1; }
    .view-field label { font-size: 12px; font-weight: bold; color: #555; text-transform: uppercase; }
    .view-field span { font-size: 12px; color: #000; }
    .view-section { margin-bottom: 14px; padding: 12px; background: white; border: 1px solid #d0d0d0; border-radius: 4px; }
    .view-section h4 { margin: 0 0 10px 0; font-size: 12px; color: #0a246a; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; font-weight: bold; }
    .view-remarks { font-size: 11px; color: #333; white-space: pre-wrap; line-height: 1.5; }
    .view-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .view-sig-block { text-align: center; padding: 10px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; }
    .view-sig-block h5 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .view-sig-image { min-height: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; background: white; border: 1px solid #eee; padding: 4px; }
    .view-sig-image img { max-width: 120px; max-height: 45px; object-fit: contain; }
    .view-sig-name { font-size: 11px; font-weight: bold; color: #000; margin-bottom: 2px; }
    .view-sig-date { font-size: 12px; color: #888; }
    .assigned-info { padding: 8px 12px; background: #f0f4ff; border: 1px solid #b8c8e8; border-radius: 4px; }
    .assigned-names { font-size: 12px; font-weight: 600; color: #0a3a8c; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #ccc; background: #e0e0e0; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; font-size: 12px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; font-size: 12px; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc6600; }
    .forward-company {
  font-size: 1px;
  color: #888;
  display: block;
  font-style: italic;
}
  .time-under-date {
  font-size: 1px;
  color: #888;
  margin-top: 1px;
}
  .forward-modal { max-width: 500px !important; }
.forward-by {
  margin-top: 2px;
  font-size: 1px;
  color: #0a3a8c;
  border-top: 1px dotted #c0c0c0;
  padding-top: 2px;
}
.forward-by-label {
  font-weight: 500;
}
.company-tag {
  font-size: 1px;
  background: #f5f5f5;
  color: #555;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #ddd;
  white-space: nowrap;
  display: inline-block;
}
.received-by {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  font-style: italic;
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
  font-size: 1px;
  color: #888;
}
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
  .forward-btn { color: #0a3a8c; }
.forward-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
  .assign-btn { color: #0a3a8c; }
.assign-btn:hover { background: #e8f0fe; border-color: #0a3a8c; }
/* Assign Modal */
.assign-modal { max-width: 500px !important; }
.assign-info { margin-bottom: 12px; padding: 8px 12px; background: #f0f4ff; border: 1px solid #b8c8e8; border-radius: 4px; }
.assign-info p { margin: 2px 0; font-size: 11px; color: #333; }
.assign-select-all { margin-bottom: 8px; padding: 6px 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; }
.assign-search { margin-bottom: 10px; }
.assign-search .classic-input { width: 100%; padding: 6px 10px; }
.assign-user-list { max-height: 250px; overflow-y: auto; border: 1px solid #ddd; background: white; }
.assign-user-item { display: flex; align-items: center; padding: 6px 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.15s; }
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
export class ClientJobOrderListComponent implements OnInit, OnDestroy {
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  activeTab = 'pending';
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
  showAssignModal = false;
  assignTarget: any = null;
  assignSearchTerm = '';
  assignUsers: any[] = [];
  filteredAssignUsers: any[] = [];
  selectedAssignUsers: any[] = [];
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private currentDragModal: HTMLElement | null = null;
private pollingInterval: any;
private routerSub: Subscription | null = null;
// Filter properties
filters = {
  branchId: '',
  requestFromDept: ''
};
allBranches: any[] = [];
allDepartments: any[] = [];
// Forward modal properties
showForwardModal = false;
forwardTarget: any = null;
forwardBranches: any[] = [];
forwardDepartments: any[] = [];
forwardData = {
  branchId: '',
  departmentId: ''
};
// ✅ New properties for notifications
  ourOrdersUnreadCount: number = 0;
  incomingOrdersUnreadCount: number = 0;
  
  // ✅ Track which orders have been viewed/read
  readOrderIds: Set<number> = new Set<number>();
  notificationMap: Map<number, { type: 'incoming' | 'status_update', status: string }> = new Map();
filteredBranches: any[] = [];
filteredFilterDepartments: any[] = [];
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
constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private router: Router,
    private clientNotificationService: ClientNotificationService,  // ✅ ADD
    private notificationService: NotificationService                // ✅ ADD
) {}

ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // ✅ Subscribe to user changes to clear data when user switches
    this.authService.currentUser$.subscribe((user: any) => {
      if (user?.id !== this.currentUser?.id) {
        console.log('🔄 JO - User changed! Clearing all caches...');
        this.clearAllUserData();
        this.currentUser = user;
        this.loadReadOrdersFromStorage();
        this.loadNotificationMapFromStorage();
        this.loadAllOrders();
        this.loadFilterBranches();
      }
    });
    
    this.loadReadOrdersFromStorage();
    this.loadNotificationMapFromStorage();
    this.loadAllOrders();
    this.loadFilterBranches();
    this.viewMode = 'our';
    this.activeTab = 'all';
    
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // ✅ Smart polling - only fetch when cache is stale
    this.pollingInterval = setInterval(() => {
      if (this.isCacheStale() && !this.isFetching) {
        this.loadAllOrders(false);
      }
    }, this.POLLING_INTERVAL);
  }
   // ✅ Generate request signature for deduplication
  private getRequestSignature(): string {
    return `client_jo_${this.currentUser?.id}_${this.currentUser?.branch_id}_${this.currentUser?.department_id}_${this.viewMode}_${this.activeTab}`;
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
      sessionStorage.setItem('client_jo_cache', JSON.stringify({
        data: data.slice(0, 100),
        timestamp: Date.now(),
        userId: this.currentUser?.id
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }

   private loadFromSessionStorage(): any[] | null {
    try {
      const cached = sessionStorage.getItem('client_jo_cache');
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const cacheAge = Date.now() - parsed.timestamp;
      
      if (cacheAge < 300000 && parsed.userId === this.currentUser?.id) {
        console.log('📦 Using client JO sessionStorage cache, age:', Math.round(cacheAge / 1000), 's');
        return parsed.data;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }
private clearCache(): void {
    this.ordersCache = null;
    this.allOrders = [];
    this.filteredOrders = [];
    try {
        sessionStorage.removeItem('client_jo_cache');
    } catch (e) {
        // Ignore
    }
}
  /**
 * ✅ Clear ALL user-specific data when user changes
 */
private clearAllUserData(): void {
    // Clear component state
    this.allOrders = [];
    this.filteredOrders = [];
    this.ordersCache = null;
    this.readOrderIds = new Set();
    this.notificationMap = new Map();
    this.ourOrdersUnreadCount = 0;
    this.incomingOrdersUnreadCount = 0;
    
    // Clear all user-specific localStorage
    try {
        localStorage.removeItem('readJobOrders');
        localStorage.removeItem('jobOrderNotifications');
        localStorage.removeItem('clientReadJobOrders');
        localStorage.removeItem('clientJobOrderNotifications');
        sessionStorage.removeItem('client_jo_cache');
    } catch (e) {
        // Ignore storage errors
    }
}
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
  saveReadOrdersToStorage() {
    localStorage.setItem('readJobOrders', JSON.stringify(Array.from(this.readOrderIds)));
  }
  // ✅ Load notification map from localStorage
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
 // ✅ Save notification map to localStorage
  saveNotificationMapToStorage() {
    localStorage.setItem('jobOrderNotifications', JSON.stringify(Array.from(this.notificationMap.entries())));
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
   // ✅ Get all orders for "Our Job Orders" view (without filters)
  getAllOurOrders(): any[] {
    const userBranchId = Number(this.currentUser?.branch_id);
    const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const userId = Number(this.currentUser?.id);
    
    return this.allOrders.filter(jo => {
      const submittedById = Number(jo.submitted_by);
      const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
      const forwardedToDeptId = Number(jo.forwarded_to_department_id);
      const orderBranchId = Number(jo.branch_id);
      const orderDeptId = Number(jo.department_id || jo.dept_id);
      
      // ❌ EXCLUDE: Forwarded TO us FROM another department (this is incoming)
      if (jo.is_forwarded && 
          forwardedToBranchId === userBranchId && 
          forwardedToDeptId === userDeptId &&
          !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
        return false;
      }
      
      // ❌ EXCLUDE: Non-forwarded order destined for our department but NOT created by us
      if (!jo.is_forwarded && 
          orderBranchId === userBranchId && 
          orderDeptId === userDeptId && 
          submittedById !== userId) {
        return false;
      }
      
      // ✅ INCLUDE: Everything else (my orders, dept orders, forwarded FROM us)
      return true;
    });
  }
  // ✅ Get all orders for "Incoming" view (without filters)
  getAllIncomingOrders(): any[] {
    const userBranchId = Number(this.currentUser?.branch_id);
    const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const userId = Number(this.currentUser?.id);
    
    return this.allOrders.filter(jo => {
      const submittedById = Number(jo.submitted_by);
      const orderBranchId = Number(jo.branch_id);
      const orderDeptId = Number(jo.department_id || jo.dept_id);
      const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
      const forwardedToDeptId = Number(jo.forwarded_to_department_id);
      
      // ✅ Forwarded TO us from another department
      if (jo.is_forwarded && 
          forwardedToBranchId === userBranchId && 
          forwardedToDeptId === userDeptId &&
          !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
        return true;
      }
      
      // ✅ Non-forwarded order destined for our department but NOT created by us
      if (!jo.is_forwarded && 
          orderBranchId === userBranchId && 
          orderDeptId === userDeptId && 
          submittedById !== userId) {
        return true;
      }
      
      return false;
    });
  }


private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('📤 Sending token:', token ? 'Token exists' : 'No token');
    return { 'Authorization': `Bearer ${token}` };
}
  // ✅ Override setViewMode to mark all as read when switching views
   setViewMode(mode: string) {
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
  loadAllOrders(useCacheIfAvailable: boolean = false): void {
    // Check if we can use cache
    if (useCacheIfAvailable && this.isCacheValid()) {
      console.log('📦 Client JO: Using valid cache, age:', 
        Math.round((Date.now() - this.ordersCache!.timestamp) / 1000), 's');
      this.allOrders = this.ordersCache!.data;
      this.checkForNewOrders();
      this.updateNotificationCounts();
      this.applyFilters();
      return;
    }
    
    // Stale cache: return cached data immediately, refresh in background
    if (!useCacheIfAvailable && this.ordersCache && this.ordersCache.data.length > 0 && !this.isCacheExpired()) {
      console.log('📦 Client JO: Using stale cache (background refresh)');
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
        console.log('📦 Client JO: Using sessionStorage cache while fetching');
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
    
    // Deduplication: skip if already fetching
    if (this.isFetching) {
      console.log('⏭️ Client JO: Already fetching, skipping');
      return;
    }
    
    // Skip duplicate requests within 2 seconds
    if (currentSignature === this.lastRequestSignature && 
        this.ordersCache && 
        (Date.now() - this.ordersCache.timestamp) < 2000) {
      console.log('⏭️ Client JO: Duplicate request skipped (within 2s)');
      return;
    }
    
    this.lastRequestSignature = currentSignature;
    this.isFetching = true;
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
      next: (data) => {
        let allOrders = Array.isArray(data) ? data : [];
        
        // Update cache
        this.updateCache(allOrders);
        
        this.allOrders = allOrders;
        this.checkForNewOrders();
        this.updateNotificationCounts();
        this.applyFilters();
        this.isFetching = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        
        // Use cache on error
        if (this.ordersCache && this.ordersCache.data.length > 0) {
          console.log('⚠️ Client JO: Using cached data after error');
          this.allOrders = this.ordersCache.data;
          this.applyFilters();
        }
        
        this.isFetching = false;
        this.showToastMsg('Failed to load job orders', 'error');
      }
    });
  }
    private fetchOrdersInBackground(): void {
    if (this.isFetching) return;
    
    this.isFetching = true;
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
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

   // ✅ Check for new or forwarded orders
  checkForNewOrders() {
    const userBranchId = Number(this.currentUser?.branch_id);
    const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const userId = Number(this.currentUser?.id);
    
    this.allOrders.forEach(o => {
      // Skip if already has a notification or is already read
      if (this.notificationMap.has(o.id) || this.readOrderIds.has(o.id)) return;
      
      const submittedById = Number(o.submitted_by);
      const orderBranchId = Number(o.branch_id);
      const orderDeptId = Number(o.department_id || o.dept_id);
      const forwardedToBranchId = Number(o.forwarded_to_branch_id);
      const forwardedToDeptId = Number(o.forwarded_to_department_id);
      
      const isForUs = (orderBranchId === userBranchId && orderDeptId === userDeptId);
      const isForwardedToUs = o.is_forwarded && 
                             (forwardedToBranchId === userBranchId && forwardedToDeptId === userDeptId);
      const isFromOthers = submittedById !== userId;
      
      // ✅ Check for incoming notifications (new or forwarded orders)
      if ((isForUs || isForwardedToUs) && isFromOthers) {
        this.notificationMap.set(o.id, { type: 'incoming', status: '' });
        this.saveNotificationMapToStorage();
      }
      
      // ✅ Check for status updates (for Our Job Orders)
      const isStatusUpdate = o.status && ['approved', 'assigned', 'forwarded', 'done'].includes(o.status);
      if (isStatusUpdate && (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname)) {
        if (!this.notificationMap.has(o.id)) {
          this.notificationMap.set(o.id, { type: 'status_update', status: o.status });
          this.saveNotificationMapToStorage();
        }
      }
    });
  }
 
getFilteredStatusCount(status: string): number {
    let filtered = [...this.allOrders];
    
    const userBranchId = Number(this.currentUser?.branch_id);
    const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const userId = Number(this.currentUser?.id);
    
    if (this.viewMode === 'our') {
      filtered = filtered.filter(o => {
        const submittedById = Number(o.submitted_by);
        const forwardedToBranchId = Number(o.forwarded_to_branch_id);
        const forwardedToDeptId = Number(o.forwarded_to_department_id);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id || o.dept_id);
        
        // Exclude forwarded TO us
        if (o.is_forwarded && 
            forwardedToBranchId === userBranchId && 
            forwardedToDeptId === userDeptId &&
            !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
          return false;
        }
        // ✅ Exclude non-forwarded incoming orders
        if (!o.is_forwarded && 
            orderBranchId === userBranchId && 
            orderDeptId === userDeptId && 
            submittedById !== userId) {
          return false;
        }
        return true;
      });
    } else if (this.viewMode === 'incoming') {
      filtered = filtered.filter(o => {
        const submittedById = Number(o.submitted_by);
        const orderBranchId = Number(o.branch_id);
        const orderDeptId = Number(o.department_id || o.dept_id);
        const forwardedToBranchId = Number(o.forwarded_to_branch_id);
        const forwardedToDeptId = Number(o.forwarded_to_department_id);
        
        // Forwarded TO us
        if (o.is_forwarded && 
            forwardedToBranchId === userBranchId && 
            forwardedToDeptId === userDeptId &&
            !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
          return true;
        }
        // ✅ Non-forwarded incoming orders
        if (!o.is_forwarded && 
            orderBranchId === userBranchId && 
            orderDeptId === userDeptId && 
            submittedById !== userId) {
          return true;
        }
        return false;
      });
    }
    
    if (status === 'all') return filtered.length;
    return filtered.filter(o => (o.status || 'pending') === status).length;
}
applyFilters() {
    let filtered = [...this.allOrders];
    
    const userBranchId = Number(this.currentUser?.branch_id);
    const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
    const userId = Number(this.currentUser?.id);
    
    console.log('🔍 Applying filters - ViewMode:', this.viewMode);
    console.log('🔍 All orders:', this.allOrders.length);
    
    // ✅ Branch filter
    if (this.filters.branchId) {
      filtered = filtered.filter(o => 
        Number(o.branch_id) === Number(this.filters.branchId)
      );
    }
    
    // ✅ Department filter
    if (this.filters.requestFromDept) {
      filtered = filtered.filter(o => 
        o.request_dept === this.filters.requestFromDept ||
        o.department === this.filters.requestFromDept ||
        o.department_name === this.filters.requestFromDept
      );
    }
    
    if (this.viewMode === 'our') {
      // ✅ OUR JOB ORDERS: Show orders that belong to us
      filtered = filtered.filter(jo => {
        const submittedById = Number(jo.submitted_by);
        const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
        const forwardedToDeptId = Number(jo.forwarded_to_department_id);
        const orderBranchId = Number(jo.branch_id);
        const orderDeptId = Number(jo.department_id || jo.dept_id);
        
        console.log('🔍 Checking order:', jo.job_order_number, {
          submittedById,
          forwardedToBranchId,
          forwardedToDeptId,
          orderBranchId,
          orderDeptId,
          userBranchId,
          userDeptId,
          userId
        });
        
        // ✅ INCLUDE: Orders created by the current user
        if (submittedById === userId) {
          console.log('✅ INCLUDED: Created by user');
          return true;
        }
        
        // ✅ INCLUDE: Orders from the user's department (not forwarded)
        if (!jo.is_forwarded && 
            orderBranchId === userBranchId && 
            orderDeptId === userDeptId) {
          console.log('✅ INCLUDED: From my department');
          return true;
        }
        
        // ✅ INCLUDE: Orders forwarded FROM our department (we sent it)
        if (jo.is_forwarded && 
            orderBranchId === userBranchId && 
            orderDeptId === userDeptId) {
          console.log('✅ INCLUDED: Forwarded from my department');
          return true;
        }
        
        // ✅ INCLUDE: Orders forwarded by the current user
        if (jo.is_forwarded && jo.forwarded_by_name === this.currentUser?.fullname) {
          console.log('✅ INCLUDED: Forwarded by me');
          return true;
        }
        
        // ❌ EXCLUDE: Orders forwarded TO us (these are incoming)
        if (jo.is_forwarded && 
            forwardedToBranchId === userBranchId && 
            forwardedToDeptId === userDeptId &&
            !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
          console.log('❌ EXCLUDED: Forwarded to my department (incoming)');
          return false;
        }
        
        // ❌ EXCLUDE: Non-forwarded orders from other departments
        if (!jo.is_forwarded && 
            orderBranchId !== userBranchId) {
          console.log('❌ EXCLUDED: From other branch');
          return false;
        }
        
        console.log('❌ EXCLUDED: Default exclusion');
        return false;
      });
    } else if (this.viewMode === 'incoming') {
      // ✅ J.O. REQUEST MANAGEMENT: Show orders FOR our department FROM other departments
      filtered = filtered.filter(jo => {
        const submittedById = Number(jo.submitted_by);
        const orderBranchId = Number(jo.branch_id);
        const orderDeptId = Number(jo.department_id || jo.dept_id);
        const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
        const forwardedToDeptId = Number(jo.forwarded_to_department_id);
        
        // ✅ Forwarded TO us from another department
        if (jo.is_forwarded && 
            forwardedToBranchId === userBranchId && 
            forwardedToDeptId === userDeptId &&
            !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
          console.log('✅ INCOMING: Forwarded to my department');
          return true;
        }
        
        // ✅ Non-forwarded order destined for our department but NOT created by us
        if (!jo.is_forwarded && 
            orderBranchId === userBranchId && 
            orderDeptId === userDeptId && 
            submittedById !== userId) {
          console.log('✅ INCOMING: For my department from others');
          return true;
        }
        
        return false;
      });
    }
    
    // ✅ Filter by status
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(o => {
        if (o.is_forwarded) {
          return (o.status || 'pending') === this.activeTab || 
                 (o.forwarded_status || '') === this.activeTab;
        }
        return (o.status || 'pending') === this.activeTab;
      });
    }
    
    // ✅ Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.job_order_number?.toLowerCase().includes(term) ||
        o.requested_name?.toLowerCase().includes(term) ||
        o.department?.toLowerCase().includes(term) ||
        o.department_name?.toLowerCase().includes(term) ||
        o.job_order_for?.toLowerCase().includes(term) ||
        o.submitted_by_name?.toLowerCase().includes(term) ||
        o.branch_name?.toLowerCase().includes(term)
      );
    }
    
    console.log('🔍 Filtered orders:', filtered.length);
    this.filteredOrders = filtered;
}
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending', 'approved': 'Received', 'assigned': 'Assigned',
      'forwarded': 'Forwarded', 'done': 'Done', 'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
  }

  receiveOrder(jo: any) {
  this.router.navigate(['/client/job-orders/approve'], { 
    queryParams: { 
      id: jo.id || jo.job_order_number,
      mode: 'approve'  // ✅ Add this to enable approval mode
    } 
  });
}

  markAsDone(jo: any) {
    this.confirmTarget = jo;
    this.confirmAction = 'done';
    this.showConfirmModal = true;
  }

 canDelete(jo: any): boolean {
  const role = (this.currentUser?.role || '').toLowerCase();
  const allowedRoles = ['admin', 'head/manager', 'supervisor', 'branch manager'];
  return allowedRoles.includes(role);
}
loadFilterBranches() {
  // ✅ Load branches
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      this.allBranches = branches || [];  // ✅ Store all branches
      
      const allBranches = branches || [];
      const currentUserBranchId = Number(this.currentUser?.branch_id);
      const mainBranchIds = [1, 5]; // LSP Main branch IDs
      
      console.log('All branches:', allBranches, 'User branch ID:', currentUserBranchId);
      
      // ✅ If user is from main branch, show ALL branches
      if (mainBranchIds.includes(currentUserBranchId)) {
        this.filteredBranches = allBranches;
      } else {
        // ✅ For non-main branch users: ONLY show their branch + main branches
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
      
      console.log('Filtered branches:', this.filteredBranches);
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
  
  // ✅ ALSO LOAD DEPARTMENTS - INSERT HERE
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (depts) => {
      this.allDepartments = depts || [];
      console.log('📋 Loaded departments:', this.allDepartments.length);
    },
    error: (err) => {
      console.error('Failed to load departments:', err);
      this.allDepartments = [];
    }
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

getDepartmentName(deptId: number): string {
    if (!deptId) return '—';
    const dept = this.allDepartments.find(d => d.id == deptId);
    return dept?.name || '—';
}
// When branch filter changes, load departments for that branch
onFilterBranchChange() {
  if (!this.filters.branchId) {
    this.filteredFilterDepartments = [];
    this.filters.requestFromDept = '';
    this.applyFilters();
    return;
  }
  
  // ✅ Match the form - no auth headers for public endpoint
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
    const userName = this.currentUser?.fullname || this.currentUser?.username || 'User';
    
    if (this.confirmAction === 'delete') {
      this.confirmDelete();
      return;
    }
    
    let status: string;
    let extraPayload: any = {};
    const endpoint = `${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`;
    
    if (this.confirmAction === 'reject') {
      status = 'rejected';
    } else if (this.confirmAction === 'done') {
      status = 'done';
      extraPayload = {
        done_name: userName,
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
    
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const payload: any = { ...extraPayload };
    if (jo.is_forwarded) {
      payload.forwarded_status = status;
    } else {
      payload.status = status;
    }
    
    this.http.put(endpoint, payload, { headers }).subscribe({
      next: () => {
        this.addStatusUpdateNotification(jo.id, status);
        this.showConfirmModal = false;
        this.confirmTarget = null;
        this.confirmAction = null;
        
        if (status === 'done') {
            this.showToastMsg('✅ Job Order marked as Done!', 'success');
            
            // ✅ CLIENT SIDE notifications
            if (jo.is_forwarded) {
                this.clientNotificationService.handleForwardedJobOrderDone(
                    jo,
                    userName,
                    jo.branch_id,
                    jo.department_id
                );
            } else {
                this.clientNotificationService.handleJobOrderDone(
                    jo,
                    userName,
                    jo.branch_id,
                    jo.department_id
                );
            }
            
            // ✅ ADMIN SIDE notifications
            if (jo.is_forwarded) {
                this.notificationService.handleForwardedJobOrderDone(
                    jo,
                    userName,
                    jo.submitted_by
                );
            } else {
                this.notificationService.handleJobOrderDone(
                    jo,
                    userName,
                    jo.submitted_by
                );
            }
        } else {
            this.showToastMsg('❌ Job Order rejected!', 'error');
        }
        
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

addStatusUpdateNotification(orderId: number, status: string) {
    if (!orderId) return;
    this.notificationMap.set(orderId, { type: 'status_update', status });
    this.saveNotificationMapToStorage();
    this.updateNotificationCounts();
  }

  addIncomingNotification(orderId: number) {
    if (!orderId) return;
    if (!this.notificationMap.has(orderId)) {
      this.notificationMap.set(orderId, { type: 'incoming', status: '' });
      this.saveNotificationMapToStorage();
      this.updateNotificationCounts();
    }
  }

canReassign(): boolean {
    const role = (this.currentUser?.role || '').toLowerCase();
    return role === 'supervisor' || role === 'head/manager' || role === 'admin' || role === 'branch manager';
}
 // ✅ Open assign modal
assignOrder(jo: any) {
    this.assignTarget = jo;
    this.selectedAssignUsers = [];
    this.assignSearchTerm = '';
    this.showAssignModal = true;
    
    // ✅ For forwarded orders, use forwarded_to_department_id (recipient's dept)
    // For normal orders, use department_id
    let deptToLoad;
    if (jo.is_forwarded && jo.forwarded_to_department_id) {
        deptToLoad = jo.forwarded_to_department_id;  // Recipient's department
    } else {
        deptToLoad = jo.department_id;  // Order's department
    }
    
    console.log('🔍 Loading users for department:', deptToLoad);
    this.loadAssignUsers(deptToLoad);
}
  // ✅ Load users from the same department
loadAssignUsers(departmentId: number) {
    const headers = this.getAuthHeaders();
    
    console.log('📡 Fetching users for department ID:', departmentId);
    
    this.http.get<any[]>(`${environment.apiUrl}/api/client/users/by-dept/${departmentId}`, { headers }).subscribe({
      next: (users) => {
        console.log('👥 Users received from API:', users);
        if (users && users.length > 0) {
          this.assignUsers = users;
        } else {
          console.log('⚠️ No users from by-dept, trying fallback...');
          this.loadAllUsersForDepartment(departmentId);
          return;
        }
        this.selectedAssignUsers = [...this.assignUsers];
        this.filterAssignUsers();
      },
      error: (err) => {
        console.error('❌ Failed to load users by dept:', err);
        this.loadAllUsersForDepartment(departmentId);
      }
    });
}
// Fallback method
loadAllUsersForDepartment(departmentId: number) {
    const headers = this.getAuthHeaders();
    console.log('🔄 Fallback: Loading ALL client users, filtering for dept:', departmentId);
    
    this.http.get<any[]>(`${environment.apiUrl}/api/client/users`, { headers }).subscribe({
      next: (allUsers) => {
        console.log('👥 All client users from API:', allUsers);
        
        this.assignUsers = (allUsers || []).filter(u => {
          const matchesDept = Number(u.department_id) === Number(departmentId) || 
                              Number(u.dept_id) === Number(departmentId) ||
                              Number(u.departmentId) === Number(departmentId);
          console.log(`  User ${u.fullname || u.username}: dept_id=${u.department_id}, deptId=${u.departmentId}, matches=${matchesDept}`);
          return matchesDept;
        });
        
        console.log('👥 Filtered assign users:', this.assignUsers);
        
        // ❌ REMOVED: No longer fall back to only showing current user
        // If no users found, show empty list with message
        
        this.selectedAssignUsers = [...this.assignUsers];
        this.filterAssignUsers();
      },
      error: (err) => {
        console.error('Fallback also failed:', err);
        this.assignUsers = [];
        this.selectedAssignUsers = [];
        this.filteredAssignUsers = [];
      }
    });
}
 // ✅ Filter assign users by search term
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
  
  // ✅ Check if user is selected
  isUserSelected(userId: number): boolean {
    return this.selectedAssignUsers.some(u => u.id === userId);
  }
  
  // ✅ Toggle user selection
  toggleUserSelection(user: any) {
    if (this.isUserSelected(user.id)) {
      this.selectedAssignUsers = this.selectedAssignUsers.filter(u => u.id !== user.id);
    } else {
      this.selectedAssignUsers.push(user);
    }
  }
  
  // ✅ Confirm assign
 confirmAssign() {
    if (!this.assignTarget || this.selectedAssignUsers.length === 0) return;
    
    const jo = this.assignTarget;
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const userName = this.currentUser?.fullname || this.currentUser?.username || 'User';
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
        this.showToastMsg('✅ Users assigned successfully!', 'success');
        
        // ✅ CLIENT SIDE notifications
        if (jo.is_forwarded) {
            // Notify the forwarding department about assignment
            this.clientNotificationService.handleForwardedJobOrderAssigned(
                jo,
                userName,
                assignedNames,
                jo.branch_id,
                jo.department_id
            );
        } else {
            // Notify the creator about assignment
            this.clientNotificationService.handleJobOrderAssigned(
                jo,
                userName,
                assignedNames,
                jo.branch_id,
                jo.department_id
            );
        }
        
        // ✅ ADMIN SIDE notifications
        if (jo.is_forwarded) {
            this.notificationService.handleForwardedJobOrderAssigned(
                jo,
                userName,
                assignedNames,
                jo.submitted_by
            );
        } else {
            this.notificationService.handleJobOrderAssigned(
                jo,
                userName,
                assignedNames,
                jo.submitted_by
            );
        }
        
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: (err) => {
        console.error('Failed to assign users:', err);
        // Revert
        if (jo.is_forwarded) {
          this.updateLocalOrder(jo.id, { forwarded_status: null, assigned_names: null });
        } else {
          this.updateLocalOrder(jo.id, { status: 'approved', assigned_names: null });
        }
        this.showToastMsg('⚠️ Failed to assign users', 'error');
      }
    });
}
  forwardOrder(jo: any) {
  this.forwardTarget = jo;
  this.forwardData = { branchId: '', departmentId: '' };
  this.forwardDepartments = [];
  this.showForwardModal = true;
  this.loadForwardBranches();
}
// Load branches for forward modal
loadForwardBranches() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      const allBranches = branches || [];
      const currentUserBranchId = Number(this.currentUser?.branch_id);
      const mainBranchIds = [1, 5]; // LSP Main branch IDs
      
      // ✅ If user is from main branch, show ONLY main branches
      if (mainBranchIds.includes(currentUserBranchId)) {
        this.forwardBranches = allBranches.filter(b => mainBranchIds.includes(b.id));
      } else {
        // ✅ For non-main branch users: ONLY show their branch + main branches
        this.forwardBranches = allBranches.filter(b => 
          b.id === currentUserBranchId || mainBranchIds.includes(b.id)
        );
        
        // Sort: User's branch first, then main branches
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
// When forward branch changes, load departments
onForwardBranchChange() {
  if (!this.forwardData.branchId) {
    this.forwardDepartments = [];
    this.forwardData.departmentId = '';
    return;
  }
  
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (depts) => {
      this.forwardDepartments = (depts || []).filter(d => 
        d.branch_id == this.forwardData.branchId
      );
      this.forwardData.departmentId = '';
    },
    error: (err) => console.error('Failed to load departments:', err)
  });
}

// Confirm forward
 confirmForward() {
    if (!this.forwardTarget || !this.forwardData.branchId || !this.forwardData.departmentId) return;
    
    const jo = this.forwardTarget;
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userName = currentUser?.fullname || 'User';
    
    // Get branch and department names for notifications
    const toBranchName = this.getBranchName(Number(this.forwardData.branchId));
    const toDeptName = this.getDepartmentName(Number(this.forwardData.departmentId));
    const fromBranchName = this.getBranchName(Number(jo.branch_id));
    const fromDeptName = jo.department_name || jo.department || this.getDepartmentName(Number(jo.department_id));
    
    const payload = {
      forwarded_to_branch_id: this.forwardData.branchId,
      forwarded_to_department_id: this.forwardData.departmentId,
      forwarded_by_name: userName
    };
    
    // Optimistic update
    this.updateLocalOrder(jo.id, {
      is_forwarded: 1,
      status: 'forwarded',
      ...payload
    });
    
    this.addIncomingNotification(jo.id);
    this.closeForwardModal();
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/forward`, payload, { headers }).subscribe({
      next: () => {
        this.showToastMsg('✅ Job Order forwarded successfully!', 'success');
        
        // ✅ CLIENT SIDE: Forward notification
        this.clientNotificationService.handleJobOrderForwarded(
            jo,
            userName,
            Number(this.forwardData.branchId),
            Number(this.forwardData.departmentId),
            fromBranchName,
            fromDeptName
        );
        
        // ✅ ADMIN SIDE: Forward notification
        this.notificationService.handleJobOrderForwarded(
            jo,
            userName,
            toBranchName,
            toDeptName,
            jo.submitted_by
        );
        
        setTimeout(() => this.fetchOrdersInBackground(), 1000);
      },
      error: (err) => {
        console.error('Failed to forward:', err);
        // Revert
        this.updateLocalOrder(jo.id, { status: 'approved', is_forwarded: 0 });
        this.showToastMsg('⚠️ Failed to forward', 'error');
      }
    });
}

// Close forward modal
closeForwardModal() {
  this.showForwardModal = false;
  this.forwardTarget = null;
  this.forwardData = { branchId: '', departmentId: '' };
  this.forwardDepartments = [];
}
  // ✅ Close assign modal
  closeAssignModal() {
    this.showAssignModal = false;
    this.assignTarget = null;
    this.selectedAssignUsers = [];
    this.assignSearchTerm = '';
  }
  // ✅ Reject
updateStatus(jo: any, status: string) {
  this.confirmTarget = jo;
  if (status === 'rejected') {
    this.confirmAction = 'reject';
  } else {
    this.confirmAction = 'done';
  }
  this.showConfirmModal = true;
}

// ✅ Delete - this sets confirmAction to 'delete'
deleteOrder(jo: any) {
  this.confirmTarget = jo;
  this.confirmAction = 'delete';  // ← This should stay as 'delete'
  this.showConfirmModal = true;
}

  confirmDelete() {
    if (!this.confirmTarget) return;
    const jo = this.confirmTarget;
    const orderId = jo.id;
    
    // Optimistic delete
    this.allOrders = this.allOrders.filter(o => o.id !== orderId);
    if (this.ordersCache) {
      this.ordersCache.data = this.ordersCache.data.filter(o => o.id !== orderId);
    }
    this.applyFilters();
    this.showConfirmModal = false;
    this.confirmTarget = null;
    this.confirmAction = null;
    
    const headers = this.getAuthHeaders();
    
    this.http.delete(`${environment.apiUrl}/api/admin/job-orders/${orderId}`, { headers }).subscribe({
      next: () => {
        this.showToastMsg('✅ Job Order deleted!', 'success');
      },
      error: () => {
        // Restore on error
        this.loadAllOrders(true);
        this.showToastMsg('⚠️ Delete failed, restored', 'error');
      }
    });
  }

// ✅ Toggle select all
toggleSelectAll(event: any) {
  if (event.target.checked) {
    this.selectedAssignUsers = [...this.filteredAssignUsers];
  } else {
    this.selectedAssignUsers = [];
  }
}
  cancelConfirm() {
    this.showConfirmModal = false;
    this.confirmTarget = null;
    this.confirmAction = null;
  }

 viewDetail(jo: any) {
    this.selectedOrder = jo;
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
editOrder(jo: any) {
  this.router.navigate(['/client/job-orders/edit'], { 
    queryParams: { id: jo.id || jo.job_order_number } 
  });
}
  // Draggable modal methods
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
    if (this.currentDragModal) this.currentDragModal.style.cursor = '';
    this.isDragging = false;
    this.currentDragModal = null;
  }

 formatDate(val: any): string {
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
      // If it's already in HH:MM format
      if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) {
        const [hours, minutes] = val.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
      }
      // If it's a full datetime string
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch { return ''; }
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
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Job Order - ${jo.job_order_number}</title><style>@page{size:A5 portrait;margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:9px;color:#000}.receipt{border:1px solid #000;padding:10px 14px;max-width:420px;margin:0 auto}h2{text-align:center;font-size:14px;text-transform:uppercase}.row{display:flex;margin:3px 0;font-size:8px}.lbl{font-weight:bold;width:65px;color:#555}.val{flex:1;font-weight:bold}.desc{border:1px solid #eee;padding:6px;min-height:40px;background:#fafafa;margin:6px 0}.sigs{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #000}.sig{flex:1;text-align:center}.sig img{max-width:80px;max-height:30px}.signame{font-size:9px;font-weight:bold;border-bottom:1px solid #000}@media print{body{padding:0}}</style></head><body><div class="receipt"><h2>JOB ORDER</h2><p style="text-align:center;font-size:7px;color:#666">Ref: ${jo.job_order_number||'N/A'}</p><div class="row"><span class="lbl">Date:</span><span class="val">${fmtDate(jo.date)}</span></div><div class="row"><span class="lbl">Company:</span><span class="val">${jo.company||'—'}</span></div><div class="row"><span class="lbl">Dept:</span><span class="val">${jo.department||'—'}</span></div><div class="row"><span class="lbl">Request:</span><span class="val">${jo.request_dept||'—'}</span></div><p style="font-weight:bold;font-size:8px;margin-top:6px">Particulars:</p><div class="desc">${jo.particulars||'No details'}</div><div class="sigs"><div class="sig">${jo.requested_signature?`<img src="${jo.requested_signature}">`:''}<div class="signame">${jo.requested_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.requested_date)}</div></div><div class="sig">${jo.approved_signature?`<img src="${jo.approved_signature}">`:''}<div class="signame">${jo.approved_name||'—'}</div></div><div class="sig">${jo.received_signature?`<img src="${jo.received_signature}">`:''}<div class="signame">${jo.received_name||'—'}</div><div style="font-size:7px">${fmtDate(jo.received_date)}</div></div></div></div><script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`);
    printWindow.document.close();
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
  ngOnDestroy() {
    // ✅ Clear user-specific data on destroy
    this.clearAllUserData();
    
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.routerSub) this.routerSub.unsubscribe();
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
}
}