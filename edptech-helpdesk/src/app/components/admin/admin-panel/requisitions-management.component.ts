import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-requisitions-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="req-list-container">
      <!-- Header -->
      <div class="view-header">
  <h2>📩 {{ viewMode === 'our' ? 'Our Requisitions' : 'Request Management' }}</h2>
 <div class="header-actions">
    <button class="classic-btn" [class.active]="viewMode === 'our'" (click)="setViewMode('our')">
      📤 Our Requests
      <span class="notif-badge our" *ngIf="ourNotificationCount > 0">{{ ourNotificationCount }}</span>
    </button>
    <button class="classic-btn" [class.active]="viewMode === 'incoming'" (click)="setViewMode('incoming')">
      📥 Request Management
      <span class="notif-badge incoming" *ngIf="incomingNotificationCount > 0">{{ incomingNotificationCount }}</span>
    </button>
    <button class="classic-btn primary" (click)="newRequisition()">
  <span>➕</span> New Requisition
</button>
  </div>
</div>

      <div class="status-tabs">
  <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">📋 All <span class="tab-count">{{ getFilteredStatusCount('all') }}</span></button>
  <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">⏳ Pending <span class="tab-count">{{ getFilteredStatusCount('pending') }}</span></button>
  <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">📥 Accepted <span class="tab-count">{{ getFilteredStatusCount('approved') }}</span></button>
  <button class="status-tab" [class.active]="activeTab === 'forwarded'" (click)="setActiveTab('forwarded')">
  📤 Forwarded <span class="tab-count forwarded-count">{{ getFilteredStatusCount('forwarded') }}</span>
</button>
  <button class="status-tab" [class.active]="activeTab === 'processing'" (click)="setActiveTab('processing')">⚙️ Processing <span class="tab-count">{{ getFilteredStatusCount('processing') }}</span></button>
  <button class="status-tab" [class.active]="activeTab === 'released'" (click)="setActiveTab('released')">📦 Released <span class="tab-count">{{ getFilteredStatusCount('released') }}</span></button>
  <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">❌ Rejected <span class="tab-count">{{ getFilteredStatusCount('rejected') }}</span></button>
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
    <input type="text" class="classic-input" placeholder="REQ #, ATTN, name..." 
           [(ngModel)]="searchTerm" (input)="applyFilters()">
  </div>
  
  <button class="classic-btn" (click)="clearFilters()">
    <span>🔄</span> Clear
  </button>
</div>
<div class="classic-status-bar">
  <span>View: <strong>{{ viewMode === 'our' ? '📤 Our Requests' : '📥 Request Management' }}</strong></span>
  <span class="status-sep">|</span>
  <span>Showing: <strong>{{ filteredReqs.length }}</strong> requisitions</span>
  <span class="status-sep">|</span>
  <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
  <!-- Bulk Actions -->
  <ng-container *ngIf="viewMode === 'incoming' && (activeTab === 'approved' || activeTab === 'forwarded' || activeTab === 'processing' || activeTab === 'released' || activeTab === 'rejected')">
    <span class="status-sep">|</span>
    <label class="select-all-label">
      <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()"> Select All
    </label>
    <button class="btn btn-process" *ngIf="(activeTab === 'approved' || activeTab === 'forwarded') && selectedReqIds.length > 0" (click)="bulkProcess()">
      ⚙️ Process ({{ selectedReqIds.length }})
    </button>
    <button class="btn btn-release" *ngIf="activeTab === 'processing' && selectedReqIds.length > 0" (click)="bulkRelease()">
      📦 Release ({{ selectedReqIds.length }})
    </button>
    <button class="btn btn-delete" *ngIf="(activeTab === 'forwarded' || activeTab === 'released' || activeTab === 'rejected') && selectedReqIds.length > 0" (click)="bulkDelete()" style="background: #cc0000; color: white; border-color: #cc0000;">
      🗑️ Delete ({{ selectedReqIds.length }})
    </button>
</ng-container>
</div>

      <div class="table-container">
        <table class="data-table">
      <thead>
  <tr>
    <th *ngIf="viewMode === 'incoming' && (activeTab === 'approved' || activeTab === 'forwarded' || activeTab === 'processing' || activeTab === 'released' || activeTab === 'rejected' || activeTab === 'all')" style="width:30px;">
  <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()">
</th>
    <th>REQ Code</th>
    <th>Date</th>
    <th>{{ viewMode === 'our' ? 'Forwarded To' : 'Forwarded From' }}</th>
    <th *ngIf="viewMode === 'incoming'">Request From</th>
    <th *ngIf="viewMode === 'our'">Recipient</th>
    <th>ATTN</th>
    <th>Items</th>
    <th>Total</th>
    <th>Status</th>
    <th>Actions</th>
  </tr>
</thead>

<tbody>
  <tr *ngFor="let req of filteredReqs" class="clickable-row" (click)="viewDetail(req)">
  <td *ngIf="viewMode === 'incoming' && (activeTab === 'approved' || activeTab === 'forwarded' || activeTab === 'processing' || activeTab === 'released' || activeTab === 'rejected' || activeTab === 'all')" 
    (click)="$event.stopPropagation()" style="width:30px; text-align:center;">
  <input type="checkbox" [checked]="isSelected(req)" (change)="toggleSelect(req)">
</td>
    <td>
      <code>{{ req.requisition_number || 'N/A' }}</code>
      <div class="creator-info" *ngIf="req.prepared_name">
        <span class="creator-label">by: {{ req.prepared_name }}</span>
      </div>
    </td>
    <td>{{ formatDate(req.date) }}</td>
 <td class="forward-cell">
  <div class="forward-info" *ngIf="req.is_forwarded">
    <!-- "Our Requests" - shows where WE forwarded it TO -->
    <ng-container *ngIf="viewMode === 'our'">
      <span class="forward-label">📤 To: {{ getBranchName(req.forwarded_to_branch_id) || '—' }}</span>
      <span class="forward-dept">{{ getDepartmentName(req.forwarded_to_department_id) || '—' }}</span>
      <span class="forward-company">{{ getBranchCompany(req.forwarded_to_branch_id) }}</span>
    </ng-container>
    <!-- "Request Management" - shows who forwarded it FROM (to us) -->
    <ng-container *ngIf="viewMode === 'incoming'">
      <span class="forward-label">{{ getBranchName(req.branch_id) || '—' }}</span>
      <span class="forward-dept">{{ getDepartmentName(req.department_id) || '—' }}</span>
      <span class="forward-company">{{ getBranchCompany(req.branch_id) }}</span>
      <span class="forward-by">By: {{ req.forwarded_by_name || '—' }}</span>
    </ng-container>
  </div>
  <span class="not-forwarded" *ngIf="!req.is_forwarded">—</span>
</td>
   <td *ngIf="viewMode === 'incoming'">
  <span class="dept-name-small">{{ req.request_from || '—' }}</span>
  <span class="branch-tag-tiny" *ngIf="req.branch_id">🏢 {{ getBranchName(req.branch_id) }}</span>
  <span class="company-tag-tiny" *ngIf="req.branch_id">{{ getBranchCompany(req.branch_id) }}</span>
</td>
    <td *ngIf="viewMode === 'our'">
      <span class="dept-name-small">{{ getDepartmentName(req.department_id) || '—' }}</span>
      <span class="branch-tag-tiny" *ngIf="req.branch_id">🏢 {{ getBranchName(req.branch_id) }}</span>
      <span class="direction-tag outgoing" *ngIf="req.submitted_by === currentUser?.id">📤 Sent by you</span>
<span class="direction-tag outgoing" *ngIf="req.submitted_by !== currentUser?.id">📤 by: {{ req.prepared_name }}</span>
    </td>
    <td class="attn-cell">
  <div class="attn-info">
    <span>{{ req.attn || '—' }}</span>
    <span class="role-tag-tiny" *ngIf="req.attn">
      {{ getAttnRole(req.attn) }}
    </span>
  </div>
</td>
    <td>{{ req.items?.length || 0 }} item(s)</td>
    <td class="total-cell">{{ getTotal(req.items) | number:'1.2-2' }}</td>
<td>
  <span class="status-badge" [class]="'status-' + (req.status || 'pending')">
    {{ getStatusLabel(req.status) }}
  </span>
  <!-- Show sub-status for forwarded requests -->
  <div class="status-forwarded-sub" *ngIf="req.is_forwarded && req.forwarded_status && req.forwarded_status !== 'forwarded'">
    ↳ {{ getStatusLabel(req.forwarded_status) }}
  </div>
  <div class="received-by" *ngIf="req.status === 'approved' && req.items_prepared_name">by: {{ req.items_prepared_name }}</div>
  <div class="received-by" *ngIf="req.status === 'released' && req.released_name">by: {{ req.released_name }}</div>
</td>
    <td (click)="$event.stopPropagation()">
  <button class="action-btn view" (click)="viewDetail(req)" title="View">👁️</button>
  <button class="action-btn print" (click)="printReq(req)" title="Print">🖨️</button>
  
  <!-- "Our Requests" actions -->
  <ng-container *ngIf="viewMode === 'our'">
    <button class="action-btn edit-btn" 
    *ngIf="canEdit(req)" 
    (click)="editReq(req)" title="Edit">✏️</button>
    <button class="action-btn delete" *ngIf="canDelete(req)" (click)="deleteReq(req)" title="Delete">🗑️</button>
    
    <!-- Final Release for forwarded requests -->
    <button class="action-btn release" *ngIf="req.is_forwarded && canReleaseForwarded(req)" (click)="releaseForwardedRequisition(req)" title="Final Release">📦✓</button>
  </ng-container>
  
  <!-- "Request Management" actions -->
  <ng-container *ngIf="viewMode === 'incoming'">
    <button class="action-btn approve" *ngIf="req.status === 'pending'" (click)="receiveReq(req)" title="Accept">✅</button>
    <button class="action-btn forward-btn" *ngIf="req.status === 'approved' && viewMode === 'incoming' && isHeadOrSupervisor()" (click)="openForwardModal(req)" title="Forward">📤</button>
    
    <!-- Process for approved -->
    <button class="action-btn process" *ngIf="req.status === 'approved' && !req.is_forwarded" (click)="processReq(req)" title="Process">⚙️</button>
    
    <!-- Process for forwarded (only when not yet processed) -->
    <button class="action-btn process" *ngIf="req.is_forwarded && req.status === 'forwarded' && !req.forwarded_status && isHeadOrSupervisor() && req.forwarded_to_branch_id === currentUser?.branch_id && req.forwarded_to_department_id === currentUser?.department_id" (click)="processReq(req)" title="Process Forwarded">⚙️</button>
    
    <!-- Release for forwarded (after processing) -->
    <button class="action-btn release-btn" *ngIf="req.is_forwarded && req.forwarded_status === 'processing' && isHeadOrSupervisor() && req.forwarded_to_branch_id === currentUser?.branch_id && req.forwarded_to_department_id === currentUser?.department_id" (click)="releaseReq(req)" title="Release Forwarded">📦</button>
    
    <!-- Release for normal requests -->
    <button class="action-btn release-btn" *ngIf="!req.is_forwarded && req.status === 'processing'" (click)="releaseReq(req)" title="Release">📦</button>
    
    <button class="action-btn reject" *ngIf="req.status === 'pending'" (click)="updateStatus(req, 'rejected')" title="Reject">❌</button>
     <button class="action-btn delete" *ngIf="isHeadOrSupervisor()" (click)="deleteReq(req)" title="Delete">🗑️</button>
  </ng-container>
</td>
  </tr>
  <tr *ngIf="filteredReqs.length === 0">
    <td [attr.colspan]="getColspan()" class="empty-row">No requisitions found</td>
  </tr>
</tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="selectedReq" (click)="closeModal()">
  <div class="modal-content" 
       id="detailReqModal"
       (click)="$event.stopPropagation()"
       (mousedown)="startDrag($event, 'detailReqModal')">
    <div class="modal-header">
      <h3>📋 Requisition Details</h3>
      <button class="modal-close" (click)="closeModal()">✕</button>
    </div>
        <div class="modal-body" *ngIf="selectedReq">
         <div class="detail-section">
  <div class="detail-row">
    <span class="detail-label">REQ #:</span>
    <span class="detail-value"><code>{{ selectedReq.requisition_number || 'N/A' }}</code></span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Status:</span>
    <span class="status-badge" [class]="'status-' + (selectedReq.status || 'pending')">{{ getStatusLabel(selectedReq.status) }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Date:</span>
    <span class="detail-value">{{ formatDate(selectedReq.date) }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Request From:</span>
    <span class="detail-value">{{ selectedReq.request_from || '—' }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Branch:</span>
    <span class="detail-value">🏢 {{ getBranchName(selectedReq.branch_id) || '—' }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Company:</span>
    <span class="detail-value">{{ getBranchCompany(selectedReq.branch_id) || '—' }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Department:</span>
    <span class="detail-value">{{ getDepartmentName(selectedReq.department_id) || '—' }}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">ATTN:</span>
    <span class="detail-value">{{ selectedReq.attn || '—' }} <span class="role-tag-tiny" *ngIf="selectedReq.attn">{{ getAttnRole(selectedReq.attn) }}</span></span>
  </div>
  <!-- Show release info if released -->
  <div class="detail-row" *ngIf="selectedReq.status === 'released'">
    <span class="detail-label">Released By:</span>
    <span class="detail-value">{{ selectedReq.released_name || '—' }}</span>
  </div>
  <div class="detail-row" *ngIf="selectedReq.released_date">
    <span class="detail-label">Released Date:</span>
    <span class="detail-value">{{ formatDate(selectedReq.released_date) }}</span>
  </div>
</div>

          <div class="detail-section" *ngIf="selectedReq.remarks">
            <h4>Remarks / Reason</h4>
            <p class="remarks-text">{{ selectedReq.remarks }}</p>
          </div>

          <div class="detail-section">
            <h4>Items ({{ selectedReq.items?.length || 0 }})</h4>
            <table class="detail-table" *ngIf="selectedReq.items?.length > 0">
              <thead>
                <tr><th>Qty</th><th>Item</th><th>Unit Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedReq.items">
                  <td>{{ item.qty }}</td>
                  <td>{{ item.item }}</td>
                  <td>{{ item.unit_price | number:'1.2-2' }}</td>
                  <td>{{ (item.qty * item.unit_price) | number:'1.2-2' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>Grand Total</strong></td>
                  <td><strong>{{ getTotal(selectedReq.items) | number:'1.2-2' }}</strong></td>
                </tr>
              </tfoot>
            </table>
            <p class="empty-text" *ngIf="!selectedReq.items?.length">No items listed</p>
          </div>
<div class="detail-section signatures-section">
  <h4>Signatures</h4>
  <div class="sig-cards">
    <!-- Prepared By -->
    <div class="sig-card">
      <h5>Form Prepared By</h5>
      <div class="sig-image-container" *ngIf="selectedReq.prepared_signature">
        <img [src]="selectedReq.prepared_signature" alt="Prepared Signature">
      </div>
      <div class="sig-info">
        <strong>{{ selectedReq.prepared_name || '—' }}</strong>
        <span>{{ formatDate(selectedReq.prepared_date) }}</span>
      </div>
    </div>
    <!-- Approved By -->
    <div class="sig-card">
      <h5>Form Approved By</h5>
      <div class="sig-image-container" *ngIf="selectedReq.approved_signature">
        <img [src]="selectedReq.approved_signature" alt="Approved Signature">
      </div>
      <div class="sig-info">
        <strong>{{ selectedReq.approved_name || '—' }}</strong>
        <span>{{ formatDate(selectedReq.approved_date) }}</span>
      </div>
    </div>
    <!-- Items Prepared By -->
    <div class="sig-card">
      <h5>Items Prepared By</h5>
      <div class="sig-image-container" *ngIf="selectedReq.items_prepared_signature">
        <img [src]="selectedReq.items_prepared_signature" alt="Items Prepared Signature">
      </div>
      <div class="sig-info">
        <strong>{{ selectedReq.items_prepared_name || '—' }}</strong>
        <span>{{ formatDate(selectedReq.items_prepared_date) }}</span>
      </div>
    </div>
  </div>
</div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="printReq(selectedReq)">🖨️ Print</button>
          <button class="btn btn-close" (click)="closeModal()">Close</button>
        </div>
      </div>
    </div>

    <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
      <span>{{ toastMessage }}</span>
    </div>
       <!-- Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal" (click)="cancelConfirm()">
  <div class="confirm-modal" 
       id="confirmReqModal"
       (click)="$event.stopPropagation()"
       (mousedown)="startDrag($event, 'confirmReqModal')">
        <div class="confirm-modal-header" [class]="'confirm-' + confirmModalType">
         <span class="confirm-icon">
  {{ confirmModalType === 'receive' ? '📥' : confirmModalType === 'reject' ? '❌' : confirmModalType === 'release' ? '📦' : confirmModalType === 'bulkdelete' ? '🗑️' : '🗑️' }}
</span>
          <h3>{{ confirmModalTitle }}</h3>
        </div>
        <div class="confirm-modal-body">
          <p>{{ confirmModalMessage }}</p>
          <div class="confirm-modal-info" *ngIf="confirmTargetReq">
            <div class="confirm-info-row">
              <span class="confirm-label">REQ #:</span>
              <code>{{ confirmTargetReq.requisition_number }}</code>
            </div>
            <div class="confirm-info-row">
              <span class="confirm-label">Prepared By:</span>
              <span>{{ confirmTargetReq.prepared_name || '—' }}</span>
            </div>
            <div class="confirm-info-row">
              <span class="confirm-label">Items:</span>
              <span>{{ confirmTargetReq.items?.length || 0 }} item(s)</span>
            </div>
          </div>
        </div>
        <div class="confirm-modal-footer">
          <button class="btn btn-cancel" (click)="cancelConfirm()">Cancel</button>
          <button class="btn" [class]="'btn-confirm btn-' + confirmModalType" (click)="confirmAction()">
  {{ confirmModalType === 'receive' ? '📥 Receive' : confirmModalType === 'reject' ? '❌ Reject' : confirmModalType === 'release' ? '📦 Release' : confirmModalType === 'bulkdelete' ? '🗑️ Delete All' : '🗑️ Delete' }}
</button>
        </div>
      </div>
    </div>
      <!-- Bulk Process Modal -->
    <div class="modal-overlay" *ngIf="showBulkProcessConfirm" (click)="cancelBulkProcess()">
  <div class="modal-window" 
       id="bulkProcessReqModal"
       (click)="$event.stopPropagation()"
       (mousedown)="startDrag($event, 'bulkProcessReqModal')">
        <div class="modal-titlebar" style="background: #cc6600;">
          <span>⚙️ Bulk Process</span>
          <button type="button" (click)="cancelBulkProcess()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Process {{ bulkCount }} selected requisition(s)?</h3>
              <p class="warning-hint" style="color: #cc6600; background: #fff8e8; border: 1px solid #e6d88a;">
                This will change the status to <strong>On Process</strong> for all selected requisitions.
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn" (click)="cancelBulkProcess()">Cancel</button>
            <button class="btn btn-process" style="background: #cc6600; color: white;" (click)="confirmBulkProcess()">⚙️ Process All</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Release Modal -->
    <div class="modal-overlay" *ngIf="showBulkReleaseConfirm" (click)="cancelBulkRelease()">
  <div class="modal-window" 
       id="bulkReleaseReqModal"
       (click)="$event.stopPropagation()"
       (mousedown)="startDrag($event, 'bulkReleaseReqModal')">
        <div class="modal-titlebar" style="background: #0066cc;">
          <span>📦 Bulk Release</span>
          <button type="button" (click)="cancelBulkRelease()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">📦</span>
            <div class="warning-message">
              <h3>Release {{ bulkCount }} selected requisition(s)?</h3>
              <p class="warning-hint" style="color: #0066cc; background: #e8f0ff; border: 1px solid #b8d0e8;">
                This will mark all selected items as <strong>Released</strong>.
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn" (click)="cancelBulkRelease()">Cancel</button>
            <button class="btn" style="background: #0066cc; color: white;" (click)="confirmBulkRelease()">📦 Release All</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Forward Modal -->
<div class="modal-overlay" *ngIf="showForwardModal" (click)="cancelForward()">
  <div class="modal-window" 
       id="forwardReqModal"
       (click)="$event.stopPropagation()"
       (mousedown)="startDrag($event, 'forwardReqModal')">
    <div class="modal-titlebar" style="background: #0a3a8c;">
      <span>📤 Forward Requisition</span>
      <button type="button" (click)="cancelForward()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 11px; margin-bottom: 12px;">
        Forwarding: <strong>#{{ forwardTargetReq?.requisition_number }}</strong>
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
        <button class="btn" (click)="cancelForward()">Cancel</button>
        <button class="btn btn-process" style="background: #0a3a8c; color: white;" (click)="confirmForward()" [disabled]="!forwardBranchId || !forwardDepartmentId">
          📤 Forward
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .admin-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0; color: #0a246a; font-size: 18px; }
    .stats-bar { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-item { flex: 1; text-align: center; padding: 12px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; border-left: 4px solid #0a246a; }
    .stat-item.pending { border-left-color: #cc6600; }
    .stat-item.approved { border-left-color: #008800; }
    .stat-item.rejected { border-left-color: #cc0000; }
    .stat-label { display: block; font-size: 10px; text-transform: uppercase; color: #888; }
    .stat-value { font-size: 22px; font-weight: 700; color: #333; }
    .status-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .status-tab { flex: 1; padding: 10px 16px; background: white; border: 1px solid #c0c0c0; cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .status-tab.active { background: #0a246a; color: white; border-color: #0a246a; }
    .tab-count { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; background: #e0e0e0; color: #555; }
    .status-tab.active .tab-count { background: rgba(255,255,255,0.3); color: white; }
    .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 10px 14px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; }
    .filter-input { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; width: 200px; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; }
    .count-badge { margin-left: auto; color: #888; font-size: 11px; }
    .table-container { background: white; border: 1px solid #c0c0c0; border-radius: 6px; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: center; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #131212; cursor: pointer; text-align: center;}
    .clickable-row:hover td { background: #f8faff; }
    code { font-family: monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .status-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .received-by { font-size: 9px; color: #666; margin-top: 2px; font-style: italic; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px; }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-btn.approve:hover { background: #eeffee; border-color: #008800; }
    .action-btn.reject:hover { background: #ffecec; border-color: #cc0000; }
    .action-btn.delete:hover { background: #ffecec; border-color: #cc0000; }
    .empty-row { text-align: center; padding: 30px; color: #888; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
     .stat-item.released { border-left-color: #0066cc; }
    .status-released { background: #e8f0ff; color: #0066cc; }
    .action-btn.release { color: #0066cc; }
    .action-btn.release:hover { background: #e8f0ff; border-color: #0066cc; }
    .confirm-modal-header.confirm-release { background: linear-gradient(135deg, #0066cc, #3388ee); }
    .confirm-modal-header.confirm-bulkdelete { background: linear-gradient(135deg, #cc0000, #ee3333); }
    .btn-confirm.btn-release { background: #0066cc; }
    .btn-confirm.btn-release:hover { background: #0044aa; }
    .btn-confirm.btn-bulkdelete { background: #cc0000; }
.btn-confirm.btn-bulkdelete:hover { background: #aa0000; }
    .dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; }
.branch-tag-tiny { font-size: 8px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
.direction-tag { font-size: 7px; padding: 1px 4px; border-radius: 2px; margin-top: 1px; font-style: italic; }
.direction-tag.outgoing { background: #e8f0ff; color: #0066cc; }
.direction-tag.incoming { background: #fff8e8; color: #886600; }
.action-btn.release-btn { color: #0066cc; }
.action-btn.release-btn:hover { background: #e8f0ff; border-color: #0066cc; }
.action-btn.approve { color: #008800; }
.action-btn.approve:hover { background: #eeffee; border-color: #008800; }
.total-cell { font-weight: bold; color: #0a3a8c; font-family: monospace; text-align: right; }
.creator-info { font-size: 9px; color: #666; margin-top: 2px; border-top: 1px dotted #ddd; padding-top: 2px; }
.creator-info { 
  font-size: 9px; 
  color: #666; 
  margin-top: 3px; 
  border-top: 1px dotted #c0c0c0; 
  padding-top: 3px; 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
  .status-forwarded-sub { 
  font-size: 8px; 
  font-style: italic; 
  color: #666; 
  margin-top: 2px;
  border-top: 1px dotted #ccc;
  padding-top: 2px;
}
.creator-label { 
  color: #0a3a8c; 
  font-weight: 600;
  font-size: 9px;
  background: #f0f4ff;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #b8c8e8;
  white-space: nowrap;
}
.creator-label::before {
  font-size: 8px;
}
.modal-header, .modal-titlebar, .confirm-modal-header {
  cursor: grab;
  user-select: none;
}
.modal-header:active, .modal-titlebar:active, .confirm-modal-header:active {
  cursor: grabbing;
}
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }
    .modal-content {
      background: white;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }
    .modal-header h3 { margin: 0; color: #0a246a; font-size: 16px; }
    .modal-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #888;
      padding: 4px 8px;
    }
    .modal-close:hover { background: #e0e0e0; color: #333; }
    .modal-body { padding: 20px; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }
    .btn-close { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-close:hover { background: #0a3a8c; }
    /* Add these to your styles array */
.notif-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 5px;
  margin-left: 4px;
  line-height: 1;
}
.notif-badge.our {
  background: #008800;
  color: white;
}
.notif-badge.incoming {
  background: #cc6600;
  color: white;
}
    /* Detail Styles */
    .detail-section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }
    .detail-section:last-child { border-bottom: none; margin-bottom: 0; }
    .detail-section h4 { margin: 0 0 8px 0; font-size: 12px; color: #555; text-transform: uppercase; }
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .detail-label {
      width: 100px;
      font-weight: 600;
      font-size: 11px;
      color: #555;
      flex-shrink: 0;
    }
      .forward-company { 
  color: #888; 
  font-size: 7px; 
  white-space: nowrap; 
  font-style: italic; 
}
.forward-by { 
  font-size: 7px; 
  color: #0a3a8c; 
  font-style: italic; 
  font-weight: 600;
  margin-top: 1px;
}
.forward-btn { color: #0a3a8c; }
.forward-btn:hover { background: #e8f0ff; border-color: #0a3a8c; }
.forward-cell { max-width: 120px; font-size: 9px; }
.forward-info { display: flex; flex-direction: column; gap: 1px; align-items: center; }
.forward-label { font-weight: 600; color: #0a3a8c; font-size: 9px; }
.forward-dept { color: #666; font-size: 8px; }
.not-forwarded { color: #ccc; font-size: 11px; }
.tab-count.forwarded-count { background: #0a3a8c; }
.status-forwarded { background: #e8f0ff; color: #0a3a8c; }
.company-tag-tiny {
  font-size: 7px;
  background: #fff8e8;
  color: #886600;
  padding: 1px 4px;
  border-radius: 2px;
  border: 1px solid #e6d88a;
  white-space: nowrap;
  display: block;
  margin-top: 1px;
}
    .detail-value { font-size: 11px; color: #333; }
    .remarks-text { font-size: 11px; color: #333; background: #f9f9f9; padding: 10px; border-radius: 4px; white-space: pre-wrap; margin: 0; }
    
    .detail-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .detail-table th { background: #f0f4f8; padding: 6px 10px; font-size: 10px; text-align: left; border: 1px solid #ddd; color: #161515; }
    .detail-table td { padding: 6px 10px; font-size: 10px; border: 1px solid #eee; color: #131212; }
    .total-row td { background: #f0f4f8; }
    .empty-text { color: #080808; font-style: italic; font-size: 10px; }
    
    .signatures-section { border-bottom: none; }
    .sig-cards { display: flex; gap: 12px; }
    .sig-card {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      background: #fafafa;
    }
    .sig-card h5 { margin: 0 0 8px 0; font-size: 10px; color: #666; text-transform: uppercase; }
    .sig-image-container {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      border: 1px solid #eee;
      border-radius: 4px;
      background: white;
    }
      /* Confirm Modal Styles */
.confirm-modal {
  background: white;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: modalSlideIn 0.2s ease;
}
@keyframes modalSlideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.confirm-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  color: white;
}
.confirm-modal-header.confirm-receive { background: linear-gradient(135deg, #008800, #00aa00); }
.confirm-modal-header.confirm-reject { background: linear-gradient(135deg, #cc0000, #ee3333); }
.confirm-modal-header.confirm-delete { background: linear-gradient(135deg, #cc4400, #ee6633); }
.confirm-modal-header h3 { margin: 0; font-size: 16px; }
.confirm-icon { font-size: 28px; }
.confirm-modal-body { padding: 24px; }
.confirm-modal-body p { margin: 0 0 16px 0; font-size: 13px; color: #444; line-height: 1.5; }
.confirm-modal-info {
  background: #f8f9fa;
  padding: 12px 16px;
}
.confirm-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
  color: #333;
}
.confirm-info-row:last-child { margin-bottom: 0; }
.confirm-label {
  width: 80px;
  font-weight: 600;
  color: #1a1919;
  flex-shrink: 0;
}
.confirm-info-row code {
  font-family: monospace;
  font-size: 11px;
  background: #e8e8e8;
  padding: 2px 6px;
  border-radius: 3px;
}
.confirm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fafafa;
}
.btn-cancel {
  background: white;
  color: #555;
  border: 1px solid #ddd;
}
.btn-cancel:hover { background: #f0f0f0; }
.btn-confirm {
  color: white;
  border: none;
  font-weight: 600;
  padding: 8px 16px;
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
  .req-list-container { padding: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #0a246a; }
.view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }
.header-actions { display: flex; gap: 6px; align-items: center; }
.classic-btn { background: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 3px; padding: 5px 14px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; color: #000; }
.classic-btn:hover { background: #dde8f0; }
.classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
.classic-btn.primary:hover { background: #1a3a8a; }
.classic-btn.active { background: #0a246a; color: white; border-color: #0a246a; }
.classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 10px; background: white; }
.classic-select option small { font-size: 8px; color: #888; }
.classic-status-bar { background: #f0f0f0; border: 1px solid #a0a0a0; border-top: none; padding: 3px 10px; font-size: 10px; color: #333; display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.filter-group { display: flex; align-items: center; gap: 4px; }
.filter-group label { font-size: 10px; font-weight: bold; color: #000; }
.search-group .classic-input { width: 160px; }
.status-sep { color: #b0b0b0; }
.classic-table th { background: #0a246a; color: white; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 10px; border-right: 1px solid rgba(255,255,255,0.2); white-space: nowrap; }
.classic-table th:last-child { border-right: none; }
.classic-table td { padding: 7px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; color: #000; }
.btn-confirm.btn-receive { background: #008800; }
.btn-confirm.btn-receive:hover { background: #006600; }
.btn-confirm.btn-reject { background: #cc0000; }
.btn-confirm.btn-reject:hover { background: #aa0000; }
.btn-confirm.btn-delete { background: #cc4400; }
.btn-confirm.btn-delete:hover { background: #aa3300; }
    .sig-image-container img { max-width: 100%; max-height: 45px; object-fit: contain; }
    .sig-info strong { display: block; font-size: 10px; color: #333; }
    .sig-info span { font-size: 9px; color: #888; }
     /* Add these new styles */
    .view-mode-bar { display: flex; gap: 8px; margin-bottom: 16px; }
    .view-mode-btn { flex: 1; padding: 10px 16px; background: white; border: 1px solid #c0c0c0; cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .view-mode-btn.active { background: #0a246a; color: white; border-color: #0a246a; }
    
    .stat-item.processing { border-left-color: #cc6600; }
    .status-processing { background: #fff8e8; color: #cc6600; }
    .action-btn.process { color: #cc6600; }
    .action-btn.process:hover { background: #fff8e8; border-color: #cc6600; }
    
    .select-all-label { font-size: 10px; color: #333; display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap; }
    .status-sep { color: #b0b0b0; }
    .btn-process { background: #cc6600; color: white; border-color: #cc6600; }
    .btn-process:hover { background: #aa4400; }
    .btn-release { background: #0066cc; color: white; border-color: #0066cc; }
    .btn-release:hover { background: #0044aa; }
    
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 100%; max-width: 450px;  }
    .modal-titlebar { background: #0a246a; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; }
    .modal-close { 
  background: rgba(0,0,0,0.3); 
  border: 1px solid rgba(255,255,255,0.6); 
  color: white; 
  cursor: pointer; 
  padding: 4px 10px; 
  font-size: 14px; 
  font-weight: bold;
  border-radius: 0px;
}
.modal-close:hover { 
  background: rgba(255,0,0,0.7); 
  color: white;
}
  .toast-notification.warning { background: #cc6600; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; line-height: 1.4; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  `]
})
export class RequisitionsManagementComponent implements OnInit {
  allReqs: any[] = [];
  filteredReqs: any[] = [];
  searchTerm = '';
  activeTab = 'pending';
  viewMode: string = 'our';
  selectedReqIds: number[] = [];
  private isDragging = false;
private dragOffsetX = 0;
private dragOffsetY = 0;
private currentDragModal: HTMLElement | null = null;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  private toastTimer: any;
  currentUser: any;
  selectedReq: any = null;
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
 confirmModalType: 'receive' | 'reject' | 'release' | 'delete' | 'bulkdelete' = 'receive';
  confirmTargetReq: any = null;
  branches: any[] = [];
  showBulkProcessConfirm = false;
  showBulkReleaseConfirm = false;
  bulkCount = 0;
filters = {
  requestFrom: '',
  requestFromDept: '',
  departmentId: '',
  branchId: ''
};
// ✅ Persist seen IDs to localStorage so they survive page reloads
private get seenReqIds(): Set<number> {
  const stored = localStorage.getItem('reqMgmt_seenIds');
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch { return new Set(); }
  }
  return new Set();
}

private set seenReqIds(ids: Set<number>) {
  localStorage.setItem('reqMgmt_seenIds', JSON.stringify([...ids]));
}

// Add a method to add IDs to the set
private addSeenReqIds(ids: number[]): void {
  const current = this.seenReqIds;
  ids.forEach(id => current.add(id));
  this.seenReqIds = current;
}
showForwardModal = false;
forwardTargetReq: any = null;
forwardBranchId: number | null = null;
forwardDepartmentId: number | null = null;
forwardFilteredDepartments: any[] = [];
filteredBranches: any[] = [];
filteredFilterDepartments: any[] = [];
departments: any[] = [];
mainBranchIds = [1, 5];
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/requisitions')) {
        this.loadAll();
      }
    });
  }

 ngOnInit() {
   console.log('🔴🔴🔴 ADMIN FORM LOADED - URL:', this.router.url);
  this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  this.loadBranchesAndDepartments(); 
   this.loadUserRoles();
  this.loadAll();
   document.addEventListener('mousemove', this.onDragMove.bind(this));
  document.addEventListener('mouseup', this.onDragEnd.bind(this));
}
startDrag(event: MouseEvent, modalId: string) {
  const target = event.target as HTMLElement;
  if (!target.closest('.modal-titlebar') && !target.closest('.modal-header') && !target.closest('.confirm-modal-header')) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  this.isDragging = true;
  this.currentDragModal = modal;
  
  const rect = modal.getBoundingClientRect();
  this.dragOffsetX = event.clientX - rect.left;
  this.dragOffsetY = event.clientY - rect.top;
  
  modal.style.position = 'fixed';
  modal.style.cursor = 'grabbing';
  modal.style.transition = 'none';
  event.preventDefault();
}

onDragMove(event: MouseEvent) {
  if (!this.isDragging || !this.currentDragModal) return;
  
  const x = event.clientX - this.dragOffsetX;
  const y = event.clientY - this.dragOffsetY;
  
  this.currentDragModal.style.left = x + 'px';
  this.currentDragModal.style.top = y + 'px';
  this.currentDragModal.style.transform = 'none';
}

onDragEnd() {
  if (this.currentDragModal) {
    this.currentDragModal.style.cursor = '';
  }
  this.isDragging = false;
  this.currentDragModal = null;
}
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

 loadAll() {
    // ✅ Don't clear seenReqIds here - only clear when switching views
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/requisitions`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => { this.allReqs = Array.isArray(data) ? data : []; this.applyFilters(); },
      error: () => this.showToastMsg('Failed to load requisitions', 'error')
    });
}
// setViewMode method
setViewMode(mode: string) {
    this.viewMode = mode;
    this.activeTab = 'pending';
    this.selectedReqIds = [];
    
    // ✅ Mark all current notifications as "seen" for this view (persisted to localStorage)
    const idsToMark: number[] = [];
    
    if (mode === 'our') {
      this.allReqs.forEach(r => {
        const userBranchId = this.currentUser?.branch_id;
        const userDeptId = this.currentUser?.department_id;
        const userId = this.currentUser?.id;
        const isOurRequest = 
          r.submitted_by == userId ||
          (r.creator_branch_id == userBranchId && r.creator_dept_id == userDeptId) ||
          (r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId);
        if (isOurRequest) idsToMark.push(r.id);
      });
    } else if (mode === 'incoming') {
      this.allReqs.forEach(r => {
        const userBranchId = this.currentUser?.branch_id;
        const userDeptId = this.currentUser?.department_id;
        const userId = this.currentUser?.id;
        const creatorBranch = r.creator_branch_id;
        const creatorDept = r.creator_dept_id;
        const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
        const isIncoming = 
          (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) ||
          (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept);
        if (isIncoming) idsToMark.push(r.id);
      });
    }
    
    // ✅ Persist to localStorage via the helper
    this.addSeenReqIds(idsToMark);
    
    this.applyFilters();
}
applyFilters() {
    let filtered = [...this.allReqs];
    
    const userBranchId = this.currentUser?.branch_id;
    const userDeptId = this.currentUser?.department_id;
    const userId = this.currentUser?.id;
    
    if (this.viewMode === 'our') {
        filtered = filtered.filter(r => {
            // My own request
            if (r.submitted_by == userId) return true;
            
            // Colleague's request (same creator branch+dept)
            const creatorBranch = r.creator_branch_id;
            const creatorDept = r.creator_dept_id;
            if (creatorBranch != null && creatorDept != null) {
                if (creatorBranch == userBranchId && creatorDept == userDeptId) return true;
            }
            
            // Forwarded FROM our department
            if (r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId) return true;
            
            return false;
        });
    } else if (this.viewMode === 'incoming') {
        filtered = filtered.filter(r => {
            const creatorBranch = r.creator_branch_id;
            const creatorDept = r.creator_dept_id;
            const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
            
            // Forwarded TO us from another department
            if (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) return true;
            
            // If forwarded FROM our department, exclude from incoming
            if (r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId) return false;
            
            // Original destination is our department AND not from us
            if (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept) return true;
            
            return false;
        });
    }
    
    if (this.activeTab !== 'all') {
        filtered = filtered.filter(r => (r.status || 'pending') === this.activeTab);
    }
    
    if (this.filters.branchId) {
        filtered = filtered.filter(r => r.branch_id == this.filters.branchId);
    }
    
    if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(r =>
            r.requisition_number?.toLowerCase().includes(term) ||
            r.prepared_name?.toLowerCase().includes(term) ||
            r.request_from?.toLowerCase().includes(term)
        );
    }
    this.filteredReqs = filtered;
}
onFilterBranchChange() {
  if (this.filters.branchId) {
    this.filteredFilterDepartments = this.departments.filter(d => {
      const branch = this.branches.find(b => b.id == d.branch_id);
      return branch && branch.id == this.filters.branchId;
    });
  } else {
    this.filteredFilterDepartments = [];
  }
  this.filters.requestFromDept = '';
  this.applyFilters();
}

clearFilters() {
  this.activeTab = 'all';
  this.filters = { requestFrom: '', requestFromDept: '', departmentId: '', branchId: '' };
  this.searchTerm = '';
  this.filteredFilterDepartments = [];
  this.applyFilters();
}
  setActiveTab(tab: string) { this.activeTab = tab; this.selectedReqIds = []; this.applyFilters(); }
  getStatusCount(status: string): number { return this.allReqs.filter(r => (r.status || 'pending') === status).length; }
 getFilteredStatusCount(status: string): number {
  let filtered = [...this.allReqs];
  const userBranchId = this.currentUser?.branch_id;
  const userDeptId = this.currentUser?.department_id;
  const userId = this.currentUser?.id;
  
  if (this.viewMode === 'our') {
    filtered = filtered.filter(r => {
      if (r.submitted_by == userId) return true;
      const creatorBranch = r.creator_branch_id;
      const creatorDept = r.creator_dept_id;
      if (creatorBranch != null && creatorDept != null && creatorBranch == userBranchId && creatorDept == userDeptId) return true;
      if (r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId) return true;
      return false;
    });
  } else if (this.viewMode === 'incoming') {
    filtered = filtered.filter(r => {
      const creatorBranch = r.creator_branch_id;
      const creatorDept = r.creator_dept_id;
      const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
      if (r.is_forwarded) return r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept;
      return r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept;
    });
  }
  
  if (status === 'all') return filtered.length;
  return filtered.filter(r => (r.status || 'pending') === status).length;
}
// Check if current user can release a forwarded request (from the forwarding dept)
canReleaseForwarded(req: any): boolean {
  if (!this.currentUser) return false;
  if (this.viewMode !== 'our') return false;
  if ((req.status || 'pending') !== 'forwarded') return false;
  if (req.forwarded_status !== 'released') return false;
  if (req.branch_id !== this.currentUser.branch_id || req.department_id !== this.currentUser.department_id) return false;
  return this.isHeadOrSupervisor();
}

// Release a forwarded requisition (from the forwarding department's side)
releaseForwardedRequisition(req: any) {
  this.confirmTargetReq = req;
  this.confirmModalTitle = 'Final Release';
  this.confirmModalMessage = `Are you sure you want to do the final release for Requisition #${req.requisition_number}?`;
  this.confirmModalType = 'release';
  this.showConfirmModal = true;
}
getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending', 'approved': 'Accepted', 'forwarded': 'Forwarded',
      'processing': 'On Process', 'released': 'Released', 'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
}
private userRolesMap: Map<string, string> = new Map();
getBranchCompany(branchId: number): string {
  if (!branchId) return '';
  const branch = this.branches.find(b => b.id == branchId);
  return branch?.company_name || branch?.name || '';
}
loadUserRoles() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Load from users table
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
        next: (users) => {
            (users || []).forEach(u => {
                const name = u.fullname || u.username;
                if (name) {
                    this.userRolesMap.set(name, u.role || 'Staff');
                }
            });
            
            // ✅ Also load from new_user table
            this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
                next: (newUsers) => {
                    (newUsers || []).forEach(u => {
                        const name = u.fullname || u.username;
                        if (name) {
                            this.userRolesMap.set(name, u.role || 'Staff');
                        }
                    });
                    console.log('👥 Admin - User roles loaded:', this.userRolesMap.size);
                    
                    // Re-apply filters to refresh ATTN roles display
                    this.applyFilters();
                },
                error: () => {
                    console.log('⚠️ Could not load new_user roles, using users table only');
                    this.applyFilters();
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
    // Check cache first
    const cached = this.userRolesMap.get(attnName);
    if (cached) return cached;
    
    // If not found, try to match by partial name
    for (const [name, role] of this.userRolesMap.entries()) {
        if (name.includes(attnName) || attnName.includes(name)) {
            return role;
        }
    }
    
    return '';
}
  getTotal(items: any[]): number { return items?.reduce((s: number, i: any) => s + ((i.qty || 0) * (i.unit_price || 0)), 0) || 0; }
getDepartmentName(deptId: number): string {
  if (!deptId) return '—';
  const dept = this.departments.find(d => d.id == deptId);
  return dept?.name || dept?.displayName || 'Dept #' + deptId;
}
  // Selection methods
  isSelected(req: any): boolean { return this.selectedReqIds.includes(req.id); }
  toggleSelect(req: any) {
    const index = this.selectedReqIds.indexOf(req.id);
    if (index === -1) this.selectedReqIds.push(req.id);
    else this.selectedReqIds.splice(index, 1);
  }
  isAllSelected(): boolean {
    return this.filteredReqs.length > 0 && this.filteredReqs.every(r => this.selectedReqIds.includes(r.id));
  }
  toggleSelectAll() {
    if (this.isAllSelected()) this.selectedReqIds = [];
    else this.selectedReqIds = this.filteredReqs.map(r => r.id);
  }

  // Bulk actions
  bulkProcess() {
    if (this.selectedReqIds.length === 0) return;
    this.bulkCount = this.selectedReqIds.length;
    this.showBulkProcessConfirm = true;
  }
  confirmBulkProcess() {
    this.showBulkProcessConfirm = false;
    if (this.bulkCount === 0) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const ids = [...this.selectedReqIds];
    let completed = 0;
    ids.forEach(id => {
      this.http.put(`${environment.apiUrl}/api/admin/requisitions/${id}/status`, { status: 'processing' }, { headers }).subscribe({
        next: () => { completed++; if (completed === ids.length) { this.selectedReqIds = []; this.loadAll(); this.showToastMsg(`⚙️ ${ids.length} processed!`, 'success'); } },
        error: () => { completed++; const r = this.allReqs.find(x => x.id === id); if (r) r.status = 'processing'; if (completed === ids.length) { this.applyFilters(); this.selectedReqIds = []; } }
      });
    });
  }
  cancelBulkProcess() { this.showBulkProcessConfirm = false; this.bulkCount = 0; }

  bulkRelease() {
    if (this.selectedReqIds.length === 0) return;
    this.bulkCount = this.selectedReqIds.length;
    this.showBulkReleaseConfirm = true;
  }
  confirmBulkRelease() {
    this.showBulkReleaseConfirm = false;
    if (this.bulkCount === 0) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const payload = { status: 'released', released_name: this.currentUser?.fullname || 'Admin', released_date: new Date().toISOString().split('T')[0] };
    const ids = [...this.selectedReqIds];
    let completed = 0;
    ids.forEach(id => {
      this.http.put(`${environment.apiUrl}/api/admin/requisitions/${id}/status`, payload, { headers }).subscribe({
        next: () => { completed++; if (completed === ids.length) { this.selectedReqIds = []; this.loadAll(); this.showToastMsg(`📦 ${ids.length} released!`, 'success'); } },
        error: () => { completed++; const r = this.allReqs.find(x => x.id === id); if (r) { r.status = 'released'; r.released_name = payload.released_name; } if (completed === ids.length) { this.applyFilters(); this.selectedReqIds = []; } }
      });
    });
  }
  cancelBulkRelease() { this.showBulkReleaseConfirm = false; this.bulkCount = 0; }

canDelete(req: any): boolean {
    if (!this.currentUser) return false;
    
    // ✅ Admin can always delete
    const role = (this.currentUser?.role || '').toLowerCase();
    if (role === 'admin') return true;
    
    // ✅ ONLY creator can delete their OWN pending requests
    if (req.submitted_by === this.currentUser.id && (req.status || 'pending') === 'pending') return true;
    
    // ✅ Head/Manager recipient can delete any request sent to their department
    if (this.isHeadOrSupervisor()) return true;
    
    // ❌ Staff, Supervisor, Technician, and other colleagues CANNOT delete
    return false;
}

isHeadOrSupervisor(): boolean {
    if (!this.currentUser) return false;
    const role = (this.currentUser.role || '').toLowerCase();
    return role === 'head/manager' || role === 'branch manager';
}
get ourNotificationCount(): number {
  return this.allReqs.filter(r => {
    const userBranchId = this.currentUser?.branch_id;
    const userDeptId = this.currentUser?.department_id;
    const userId = this.currentUser?.id;
    
    // Skip if already seen
    if (this.seenReqIds.has(r.id)) return false;
    
    const isOurRequest = 
      r.submitted_by == userId ||
      (r.creator_branch_id == userBranchId && r.creator_dept_id == userDeptId) ||
      (r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId);
    
    if (!isOurRequest) return false;
    
    // ✅ Accepted by recipient
    if (r.status === 'approved') return true;
    
    // ✅ On process (normal)
    if (!r.is_forwarded && r.status === 'processing') return true;
    
    // ✅ Forwarded
    if (r.is_forwarded && r.status === 'forwarded' && !r.forwarded_status) return true;
    
    // ✅ Released
    if (!r.is_forwarded && r.status === 'released') return true;
    
    // ✅ Forwarded on process
    if (r.is_forwarded && r.forwarded_status === 'processing') return true;
    
    // ✅ Forwarded released by recipient
    if (r.is_forwarded && r.status === 'forwarded' && r.forwarded_status === 'released') return true;
    
    // ✅ Final released
    if (r.is_forwarded && r.status === 'released') return true;
    
    return false;
  }).length;
}

get incomingNotificationCount(): number {
  return this.allReqs.filter(r => {
    const userBranchId = this.currentUser?.branch_id;
    const userDeptId = this.currentUser?.department_id;
    const userId = this.currentUser?.id;
    
    // Skip if already seen
    if (this.seenReqIds.has(r.id)) return false;
    
    const creatorBranch = r.creator_branch_id;
    const creatorDept = r.creator_dept_id;
    const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
    
    const isIncoming = 
      (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) ||
      (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept);
    
    if (!isIncoming) return false;
    
    // ✅ 1. New pending requests
    if (r.status === 'pending') return true;
    
    // ✅ 2. Forwarded requests on process
    if (r.is_forwarded && r.forwarded_status === 'processing') return true;
    
    // ✅ 3. Forwarded requests released by recipient
    if (r.is_forwarded && r.forwarded_status === 'released') return true;
    
    return false;
  }).length;
}
processReq(req: any) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, { status: 'processing' }, { headers }).subscribe({
      next: () => { 
        if (req.is_forwarded) {
          req.forwarded_status = 'processing';
          // ✅ Notify about forwarded requisition being processed
          this.notificationService.handleRequisitionForwardedProcessed(
            req,
            this.currentUser?.fullname || 'Admin',
            req.submitted_by
          );
        } else {
          req.status = 'processing';
          // ✅ Notify about normal requisition being processed
          this.notificationService.handleRequisitionProcessed(
            req,
            this.currentUser?.fullname || 'Admin',
            req.submitted_by
          );
        }
        this.applyFilters(); 
        this.showToastMsg('⚙️ Processing!', 'success'); 
      },
      error: () => { 
        if (req.is_forwarded) {
          req.forwarded_status = 'processing';
        } else {
          req.status = 'processing';
        }
        this.applyFilters(); 
      }
    });
}
getColspan(): number {
  let cols = 10; // Base columns (added forwarded column)
  if (this.viewMode === 'incoming' && (this.activeTab === 'approved' || this.activeTab === 'forwarded' || this.activeTab === 'processing' || this.activeTab === 'released' || this.activeTab === 'rejected' || this.activeTab === 'all')) cols++;
  return cols;
}

  viewDetail(req: any) { this.selectedReq = req; }
  closeModal() { this.selectedReq = null; }

receiveReq(req: any) {
  this.router.navigate(['/admin/requisitions/approve'], { 
    queryParams: { id: req.id, mode: 'approve' } 
  });
}
newRequisition() {
  // ✅ Remove /admin prefix - use the path that works
  this.router.navigate(['/requisitions/new']);
}
  releaseReq(req: any) {
    this.confirmModalTitle = 'Release Items';
    this.confirmModalMessage = `Are you sure you want to mark Requisition #${req.requisition_number} as released? The items have been given to the requester.`;
    this.confirmModalType = 'release';
    this.confirmTargetReq = req;
    this.showConfirmModal = true;
  }

  updateStatus(req: any, status: string) {
    this.confirmModalTitle = 'Reject Requisition';
    this.confirmModalMessage = `Are you sure you want to reject Requisition #${req.requisition_number}? This action cannot be undone.`;
    this.confirmModalType = 'reject';
    this.confirmTargetReq = req;
    this.showConfirmModal = true;
  }

  deleteReq(req: any) {
    this.confirmModalTitle = 'Delete Requisition';
    this.confirmModalMessage = `Are you sure you want to delete Requisition #${req.requisition_number}? This action cannot be undone.`;
    this.confirmModalType = 'delete';
    this.confirmTargetReq = req;
    this.showConfirmModal = true;
  }
  canEdit(req: any): boolean {
    if (!this.currentUser) return false;
    
    // ✅ Only allow editing pending requests
    if ((req.status || 'pending') !== 'pending') return false;
    
    // ✅ Creator can always edit their own
    if (req.submitted_by == this.currentUser.id) return true;
    
    // ✅ Head/Manager/Supervisor/Branch Manager from same department can edit
    const role = (this.currentUser.role || '').toLowerCase();
    const isHeadOrSupervisor = role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
    const isSameDept = req.branch_id == this.currentUser.branch_id && 
                       req.department_id == this.currentUser.department_id;
    
    if (isHeadOrSupervisor && isSameDept) return true;
    
    // ✅ Head/Manager/Supervisor can also edit if they're in the same branch (expanded permission)
    const isSameBranch = req.branch_id == this.currentUser.branch_id;
    if (isHeadOrSupervisor && isSameBranch) return true;
    
    return false;
}
loadBranchesAndDepartments() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      this.branches = (branches || []).map(b => ({
        ...b,
        company_name: b.company_name || b.name
      }));
      const user: any = this.authService.getCurrentUser() || this.currentUser;
      
      // For non-main branch users, only show: their branch + main branches
      if (user && !this.mainBranchIds.includes(Number(user.branch_id))) {
        this.filteredBranches = this.branches.filter(b => 
          b.id == user.branch_id || this.mainBranchIds.includes(b.id)
        );
      } else {
        this.filteredBranches = [...this.branches];
      }
      
      // Load departments
      this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
        next: (depts) => {
          this.departments = (depts || []).map(d => {
            const branch = this.branches.find(b => b.id == d.branch_id);
            return { ...d, displayName: `${d.name} — ${branch?.name || 'Unknown'}`, branch_id: d.branch_id };
          });
          // Initialize as empty - departments show only when branch is selected
          this.filteredFilterDepartments = [];
        }
      });
    }
  });
}
canForward(req: any): boolean {
  if (!this.currentUser) return false;
  if ((req.status || 'pending') !== 'approved') return false;
  return this.isHeadOrSupervisor();
}

openForwardModal(req: any) {
  this.forwardTargetReq = req;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
  this.forwardFilteredDepartments = [];
  this.showForwardModal = true;
}

cancelForward() {
  this.showForwardModal = false;
  this.forwardTargetReq = null;
  this.forwardBranchId = null;
  this.forwardDepartmentId = null;
}

onForwardBranchChange() {
  if (this.forwardBranchId) {
    const originalBranchId = this.forwardTargetReq?.branch_id;
    const originalDeptId = this.forwardTargetReq?.department_id;
    this.forwardFilteredDepartments = this.departments.filter(d => {
      const matchesBranch = d.branch_id == this.forwardBranchId;
      if (this.forwardBranchId == originalBranchId && d.id == originalDeptId) return false;
      return matchesBranch;
    });
  } else {
    this.forwardFilteredDepartments = [];
  }
  this.forwardDepartmentId = null;
}
confirmForward() {
  if (!this.forwardTargetReq || !this.forwardBranchId || !this.forwardDepartmentId) return;
  const originalBranchId = this.forwardTargetReq.branch_id;
  const originalDeptId = this.forwardTargetReq.department_id;
  if (this.forwardBranchId == originalBranchId && this.forwardDepartmentId == originalDeptId) {
    this.showToastMsg('⚠️ Cannot forward to the original department!', 'warning');
    return;
  }
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    forwarded_to_branch_id: this.forwardBranchId,
    forwarded_to_department_id: this.forwardDepartmentId,
    forwarded_by_name: this.currentUser.fullname || this.currentUser.username
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/requisitions/${this.forwardTargetReq.id}/forward`, payload, { headers }).subscribe({
    next: () => {
      const toBranchName = this.getBranchName(this.forwardBranchId!) || 'Unknown';
      const toDeptName = this.getDepartmentName(this.forwardDepartmentId!) || 'Unknown';
      this.notificationService.handleRequisitionForwarded(
        this.forwardTargetReq,
        this.currentUser.fullname || this.currentUser.username,
        toBranchName,
        toDeptName,
        this.forwardTargetReq.submitted_by
      );
      this.showToastMsg('📤 Requisition forwarded!', 'success');
      this.cancelForward();
      this.loadAll();
    },
    error: (err) => {
      console.error('Forward failed:', err);
      this.cancelForward();
      this.showToastMsg('⚠️ Failed to forward', 'warning');
    }
  });
}

bulkDelete() {
  if (this.selectedReqIds.length === 0) return;
  this.bulkCount = this.selectedReqIds.length;
  // Reuse the delete confirmation modal or create a new one
  this.confirmModalTitle = 'Bulk Delete';
  this.confirmModalMessage = `Are you sure you want to delete ${this.selectedReqIds.length} requisition(s)? This cannot be undone.`;
  this.confirmModalType = 'bulkdelete';
  this.showConfirmModal = true;
}
 confirmAction() {
    if (!this.confirmTargetReq && this.confirmModalType !== 'bulkdelete') return;
    const req = this.confirmTargetReq;
    switch (this.confirmModalType) {
      case 'receive': this.processReceive(req); break;
      case 'reject': this.processReject(req); break;
      case 'release': this.processRelease(req); break;
      case 'delete': this.processDelete(req); break;
      case 'bulkdelete': this.processBulkDelete(); break;
    }
    this.closeConfirmModal();
}

processBulkDelete() {
  if (this.selectedReqIds.length === 0) return;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  let completed = 0;
  const total = this.selectedReqIds.length;
  const ids = [...this.selectedReqIds];
  
  ids.forEach(id => {
    this.http.delete(`${environment.apiUrl}/api/admin/requisitions/${id}`, { headers }).subscribe({
      next: () => {
        completed++;
        if (completed === total) {
          this.showToastMsg(`🗑️ ${total} deleted!`, 'success');
          this.selectedReqIds = [];
          this.loadAll();
        }
      },
      error: () => {
        completed++;
        this.allReqs = this.allReqs.filter(r => !ids.includes(r.id));
        if (completed === total) {
          this.applyFilters();
          this.selectedReqIds = [];
        }
      }
    });
  });
}

  cancelConfirm() { this.closeConfirmModal(); }
  closeConfirmModal() { this.showConfirmModal = false; this.confirmTargetReq = null; }

  processReceive(req: any) {
    const payload = {
      status: 'approved',
      approved_name: this.authService.getCurrentUser()?.fullname || 'Admin',
      approved_date: new Date().toISOString().split('T')[0]
    };
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        req.status = 'approved';
        req.approved_name = payload.approved_name;
        req.approved_date = payload.approved_date;
        this.applyFilters();
        this.showToastMsg('✅ Requisition received!', 'success');
        
        // Safely call notification
        if (this.notificationService.handleRequisitionReceived) {
          this.notificationService.handleRequisitionReceived(
            { id: req.id, requisition_number: req.requisition_number },
            payload.approved_name,
            req.submitted_by
          );
        }
      },
      error: () => { req.status = 'approved'; this.applyFilters(); this.showToastMsg('⚠️ Updated locally', 'error'); }
    });
}
editReq(req: any) {
  this.router.navigate(['/requisitions/edit'], { 
    queryParams: { id: req.id } 
  });
}
  // ✅ NEW: Process release
 processRelease(req: any) {
    const payload: any = {
      status: 'released',
      released_name: this.authService.getCurrentUser()?.fullname || 'Admin',
      released_date: new Date().toISOString().split('T')[0]
    };
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        if (req.is_forwarded) {
          // Check if this is the FINAL release (from forwarding dept) or recipient release
          const isFinalRelease = req.forwarded_status === 'released';
          
          if (isFinalRelease) {
            req.status = 'released';
            // ✅ Notify - final release completed
            this.notificationService.handleRequisitionFinalReleased(
              req,
              this.currentUser?.fullname || 'Admin',
              req.submitted_by
            );
          } else {
            req.forwarded_status = 'released';
            // ✅ Notify - forwarded request released by recipient
            this.notificationService.handleRequisitionForwardedReleased(
              req,
              this.currentUser?.fullname || 'Admin',
              req.submitted_by
            );
          }
        } else {
          req.status = 'released';
          // ✅ Notify - normal request released
          this.notificationService.handleRequisitionReleased(
            req,
            this.currentUser?.fullname || 'Admin',
            req.submitted_by
          );
        }
        req.released_name = payload.released_name;
        req.released_date = payload.released_date;
        this.applyFilters();
        this.showToastMsg('📦 Requisition released!', 'success');
      },
      error: () => { 
        if (req.is_forwarded) {
          req.forwarded_status = 'released';
        } else {
          req.status = 'released';
        }
        this.applyFilters(); 
        this.showToastMsg('⚠️ Updated locally', 'error'); 
      }
    });
}
isEDPUser(): boolean {
  if (!this.currentUser) return false;
  const dept = (this.currentUser.department || this.currentUser.department_name || '').toLowerCase();
  return dept === 'edp' || dept === 'it' || dept === 'edp/it' || dept.includes('edp') || dept.includes('it');
}

getBranchName(branchId: number): string {
  if (!branchId) return '';
  const branch = this.branches.find(b => b.id == branchId);
  return branch?.name || 'Branch #' + branchId;
}
  processReject(req: any) {
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, { status: 'rejected' }, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        req.status = 'rejected';
        this.applyFilters();
        this.showToastMsg('❌ Requisition rejected!', 'success');
        this.loadAll();
        this.notificationService.handleRequisitionRejected(
          { id: req.id, requisition_number: req.requisition_number },
          this.authService.getCurrentUser()?.fullname || 'Admin',
          req.submitted_by
        );
      },
      error: () => { req.status = 'rejected'; this.applyFilters(); this.showToastMsg('Updated locally', 'success'); }
    });
  }

  processDelete(req: any) {
    this.http.delete(`${environment.apiUrl}/api/admin/requisitions/${req.id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => { this.allReqs = this.allReqs.filter(r => r.id !== req.id); this.applyFilters(); this.showToastMsg('🗑️ Requisition deleted!', 'success'); this.loadAll(); },
      error: () => { this.allReqs = this.allReqs.filter(r => r.id !== req.id); this.applyFilters(); this.showToastMsg('Deleted locally', 'error'); }
    });
  }
 printReq(req: any) {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const fmtDate = (val: any) => {
      if (!val) return '—';
      try { 
        const d = new Date(val); 
        if (isNaN(d.getTime())) return String(val);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
      }
      catch { return String(val); }
    };
    
    const getTotal = (items: any[]) => items?.reduce((s: number, i: any) => s + ((Number(i.qty)||0)*(Number(i.unit_price)||0)), 0) || 0;
    const companyName = 'Lee Super Plaza';
    const statusLabel = req.status === 'approved' ? 'Received' : (req.status || 'Pending');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisition - ${req.requisition_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 8mm; }
          body { font-family: 'Courier New', monospace; font-size: 9px; color: #000; padding: 10px; }
          .req-print { background: white; border: 2px solid #000; padding: 16px 20px; max-width: 750px; margin: 0 auto; }
          .req-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .req-header .company { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #0a246a; }
          .req-header .title { font-size: 11px; font-weight: bold; letter-spacing: 3px; margin-top: 4px; }
          .req-header .ctrl-no { font-size: 8px; color: #cc0000; font-weight: bold; margin-top: 2px; }
          .req-header .ref { font-size: 8px; margin-top: 4px; color: #555; }
          .status-badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
          .status-pending { background: #fffae8; color: #886600; border: 1px solid #e6d88a; }
          .status-approved { background: #eeffee; color: #008800; border: 1px solid #88cc88; }
          .status-rejected { background: #ffecec; color: #cc0000; border: 1px solid #eeaaaa; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 10px; }
          .info-row { display: flex; font-size: 9px; }
          .info-label { font-weight: bold; white-space: nowrap; color: #333; width: 80px; flex-shrink: 0; }
          .info-value { flex: 1; color: #000; }
          .remarks-section { margin: 8px 0; padding: 8px; border: 1px solid #ccc; background: #fafafa; font-size: 9px; min-height: 30px; white-space: pre-wrap; }
          .remarks-label { font-weight: bold; font-size: 9px; margin-bottom: 4px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th { background: #f0f4f8; padding: 5px 8px; font-size: 9px; font-weight: bold; border: 1px solid #000; text-align: left; }
          .items-table td { padding: 4px 8px; font-size: 9px; border: 1px solid #ccc; }
          .items-table td.right { text-align: right; }
          .total-row { font-weight: bold; background: #f0f4f8; }
          .total-row td { border: 1px solid #000; }
          .empty-row { text-align: center; color: #888; font-style: italic; }
          .signatures { margin-top: 16px; padding-top: 10px; border-top: 2px solid #000; }
          .sig-row { display: flex; gap: 12px; }
          .sig-block { flex: 1; text-align: center; padding: 8px; border: 1px solid #ccc; background: #fafafa; }
          .sig-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
          .sig-image-area { border: 1px solid #eee; min-height: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; background: white; }
          .sig-image-area img { max-width: 100px; max-height: 40px; object-fit: contain; }
          .sig-image-area .no-sig { font-size: 7px; color: #ccc; font-style: italic; }
          .sig-name { font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; }
          .sig-date { font-size: 8px; color: #333; }
          .footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #ccc; text-align: center; font-size: 7px; color: #555; }
          .footer p { margin: 2px 0; }
          @media print { body { padding: 0; margin: 0; } .req-print { border: 1px solid #000; } }
        </style>
      </head>
      <body>
        <div class="req-print">
          <div class="req-header">
            <div class="company">${companyName}</div>
            <div class="title">REQUISITION FORM</div>
            <div class="ctrl-no">CTRL NO.: EDR-30</div>
            <div class="ref">REQ #: ${req.requisition_number || 'N/A'} | Status: <span class="status-badge status-${req.status || 'pending'}">${statusLabel}</span></div>
          </div>
          <div class="info-grid">
            <div class="info-row"><span class="info-label">Request From:</span><span class="info-value">${req.request_from || '—'}</span></div>
            <div class="info-row"><span class="info-label">ATTN:</span><span class="info-value">${req.attn || '—'}</span></div>
            <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${fmtDate(req.date)}</span></div>
            <div class="info-row"><span class="info-label">Submitted By:</span><span class="info-value">${req.prepared_name || '—'}</span></div>
          </div>
          <div class="remarks-section">
            <div class="remarks-label">Remarks / Reason:</div>
            ${req.remarks || 'No remarks provided.'}
          </div>
          <table class="items-table">
            <thead><tr><th>Qty</th><th>Item Description</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              ${(req.items && req.items.length > 0) ? req.items.map((i: any) => `
                <tr><td>${i.qty || 0}</td><td>${i.item || '—'}</td><td class="right">${Number(i.unit_price || 0).toFixed(2)}</td><td class="right">${(Number(i.qty || 0) * Number(i.unit_price || 0)).toFixed(2)}</td></tr>
              `).join('') : '<tr><td colspan="4" class="empty-row">No items listed</td></tr>'}
            </tbody>
            ${(req.items && req.items.length > 0) ? `<tfoot><tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total:</td><td class="right">${getTotal(req.items).toFixed(2)}</td></tr></tfoot>` : ''}
          </table>
          <div class="signatures">
            <div class="sig-row">
              <div class="sig-block"><div class="sig-label">Form Prepared By</div><div class="sig-image-area">${req.prepared_signature ? `<img src="${req.prepared_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.prepared_name || '_______________'}</div><div class="sig-date">${fmtDate(req.prepared_date)}</div></div>
              <div class="sig-block"><div class="sig-label">Form Approved By</div><div class="sig-image-area">${req.approved_signature ? `<img src="${req.approved_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.approved_name || '_______________'}</div><div class="sig-date">${fmtDate(req.approved_date)}</div></div>
              <div class="sig-block"><div class="sig-label">Items Prepared By</div><div class="sig-image-area">${req.items_prepared_signature ? `<img src="${req.items_prepared_signature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.items_prepared_name || '_______________'}</div><div class="sig-date">${fmtDate(req.items_prepared_date)}</div></div>
            </div>
          </div>
          <div class="footer">
            <p>📋 Leave R.F. to floor supervisor when BORROWING items, include expected date of return.</p>
            <p>For Outside purchase: indicate if P.O. was made or paid by cash.</p>
            <p>EDPtech Helpdesk v2.0 | Requisition #${req.requisition_number || 'N/A'}</p>
          </div>
        </div>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  }

  formatDate(val: any): string {
  if (!val) return '—';
  try { 
    const d = new Date(val); 
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
  }
  catch { return String(val); }
}

showToastMsg(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
}
}