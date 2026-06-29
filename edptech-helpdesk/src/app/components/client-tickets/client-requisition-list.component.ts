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
  selector: 'app-client-requisition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="req-list-container">
      <!-- Header -->
      <div class="view-header">
  <h2>📩 {{ viewMode === 'our' ? 'Our Requisitions' : 'Request Management' }}</h2>
  <div class="header-actions">
    <button class="classic-btn" [class.active]="viewMode === 'our'" (click)="setViewMode('our')">
      📤 Our Requests
    </button>
    <button class="classic-btn" [class.active]="viewMode === 'incoming'" (click)="setViewMode('incoming')">
      📥 Request Management
    </button>
    <button class="classic-btn primary" routerLink="/client/request/new">
      <span>➕</span> New Requisition
    </button>
  </div>
</div>

    <div class="status-tabs-bar">
  <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
    📋 All <span class="tab-count">{{ requisitions.length }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
    ⏳ Pending <span class="tab-count pending-count">{{ getStatusCount('pending') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
    📥 Accepted <span class="tab-count approved-count">{{ getStatusCount('approved') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'processing'" (click)="setActiveTab('processing')">
    ⚙️ On Process <span class="tab-count processing-count">{{ getStatusCount('processing') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'released'" (click)="setActiveTab('released')">
    📦 Released <span class="tab-count released-count">{{ getStatusCount('released') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">
    ❌ Rejected <span class="tab-count rejected-count">{{ getStatusCount('rejected') }}</span>
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
     <!-- Status Bar -->
<div class="classic-status-bar">
  <span>View: <strong>{{ viewMode === 'our' ? '📤 Our Requests' : '📥 Request Management' }}</strong></span>
  <span class="status-sep">|</span>
  <span>Showing: <strong>{{ filteredRequisitions.length }}</strong> requisitions</span>
  <span class="status-sep">|</span>
  <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
  <span class="status-sep">|</span>
  <span>Branch: <strong>{{ userBranch?.name || 'All' }}</strong></span>
  <span class="status-sep">|</span>
  <span>Dept: <strong>{{ currentUser?.department || currentUser?.department_name || 'All' }}</strong></span>
  <!-- Bulk Action Buttons -->
  <ng-container *ngIf="activeTab === 'approved' || activeTab === 'processing'">
    <span class="status-sep">|</span>
    <label class="select-all-label">
      <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()"> Select All
    </label>
    <button class="classic-btn primary" *ngIf="activeTab === 'approved' && selectedReqIds.length > 0" 
            (click)="bulkProcess()" style="background: #cc6600; border-color: #cc6600; font-size: 10px; padding: 3px 10px;">
      ⚙️ Process ({{ selectedReqIds.length }})
    </button>
    <button class="classic-btn primary" *ngIf="activeTab === 'processing' && selectedReqIds.length > 0" 
            (click)="bulkRelease()" style="background: #0066cc; border-color: #0066cc; font-size: 10px; padding: 3px 10px;">
      📦 Release ({{ selectedReqIds.length }})
    </button>
  </ng-container>
</div>

      <!-- Requisitions Table -->
      <div class="classic-table-container">
        <table class="classic-table">
       <thead>
  <tr>
    <th *ngIf="viewMode === 'incoming' && (activeTab === 'approved' || activeTab === 'processing')" style="width:30px;">
      <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()">
    </th>  <!-- ✅ This was missing -->
    <th>REQ Code</th>
    <th>Date</th>
    <th *ngIf="viewMode === 'incoming'">Request From</th>
    <th *ngIf="viewMode === 'our'">{{ isEDPUser() ? 'Department' : 'Recipient' }}</th>
    <th>ATTN</th>
    <th>Items</th>
    <th>Total</th>
    <th>Status</th>
    <th>Actions</th>
  </tr>
</thead>
        <tbody>
  <tr *ngFor="let req of filteredRequisitions; trackBy: trackByReqId" 
      class="clickable-row" (click)="openViewModal(req)">
    
    <!-- Checkbox cell for Accepted/Processing tabs -->
    <td *ngIf="viewMode === 'incoming' && (activeTab === 'approved' || activeTab === 'processing')" 
    (click)="$event.stopPropagation()" style="width:30px; text-align:center;">
      <input type="checkbox" [checked]="isSelected(req)" (change)="toggleSelect(req)">
    </td>
    <td class="req-num">
      <code>{{ req.requisition_number || 'N/A' }}</code>
      <div class="creator-info" *ngIf="isEDPUser() && req.prepared_name">
        <span class="creator-label">by: {{ req.prepared_name }}</span>
      </div>
    </td>
    <td class="date-cell">{{ formatDate(req.date) }}</td>
    <!-- ✅ Request From - visible for incoming view -->
<td *ngIf="viewMode === 'incoming'">
  <span class="dept-name-small" [class]="'type-' + (req.request_from || '').toLowerCase()">
    {{ req.request_from || '—' }} 
  </span>
  <span class="branch-tag-tiny" *ngIf="getBranchName(req.branch_id)">
    🏢 {{ getBranchName(req.branch_id) }}
  </span>
</td>

<!-- ✅ Recipient/Department - visible for our requests -->
<td class="dept-cell" *ngIf="viewMode === 'our'">
  <div class="dept-info-small">
    <span class="dept-name-small">{{ getDepartmentName(req.department_id) }}</span>
    <span class="branch-tag-tiny" *ngIf="getBranchName(req.branch_id)">
      🏢 {{ getBranchName(req.branch_id) }}
    </span>
    <span class="direction-tag outgoing">📤 Sent by you</span>
  </div>
</td>
    <td class="attn-cell">
      <div class="attn-info">
        <span>{{ req.attn || '—' }}</span>
        <span class="role-tag-tiny" *ngIf="req.attn">
          {{ getAttnRole(req.attn) }}
        </span>
      </div>
    </td>
    <td class="items-cell">{{ req.items?.length || 0 }} item(s)</td>
    <td class="total-cell">{{ getTotal(req.items) | number:'1.2-2' }}</td>
    <td class="status-cell">
      <span class="status-badge" [class]="'status-' + (req.status || 'pending')">
        {{ getStatusLabel(req.status) }}
      </span>
      <div class="status-worker" *ngIf="req.status === 'approved' && req.items_prepared_name">
        <span class="worker-label">Accepted by: {{ req.items_prepared_name }}</span>
      </div>
      <div class="status-worker" *ngIf="req.status === 'released' && req.released_name">
        <span class="worker-label">Released by: {{ req.released_name }}</span>
      </div>
      <div class="status-worker" *ngIf="req.approved_name && req.status === 'approved'">
        <span class="worker-label">Approved by: {{ req.approved_name }}</span>
      </div>
    </td>
    <td class="action-cell" (click)="$event.stopPropagation()">
      <!-- Creator can edit their own pending -->
      <button class="action-btn edit-btn" *ngIf="canModify(req)" (click)="editRequisition(req)" title="Edit">✏️</button>
      <!-- Recipient can Accept/Reject pending -->
      <button class="action-btn accept-btn" *ngIf="canAcceptReject(req)" (click)="acceptRequisition(req)" title="Accept">✅</button>
      <button class="action-btn reject-btn" *ngIf="canAcceptReject(req)" (click)="rejectRequisition(req)" title="Reject">❌</button>
      <!-- Recipient can Process accepted -->
      <button class="action-btn process-btn" *ngIf="canProcess(req)" (click)="processRequisition(req)" title="Process">⚙️</button>
      <!-- Recipient can Release on-process -->
      <button class="action-btn release-btn" *ngIf="canRelease(req)" (click)="releaseRequisition(req)" title="Release">📦</button>
      <button class="action-btn print-btn" (click)="printRequisition(req)" title="Print">🖨️</button>
      <button class="action-btn view-btn" (click)="openViewModal(req)" title="View Details">📋</button>
      <!-- Delete always visible for recipient/admin, only pending for creator -->
      <button class="action-btn delete-btn" *ngIf="canDelete(req)" (click)="deleteRequisition(req)" title="Delete">🗑️</button>
    </td>
  </tr>
  
<tr *ngIf="filteredRequisitions.length === 0">
  <td [attr.colspan]="getEmptyColspan()" class="empty-row">
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No requisitions found</p>
        <button class="classic-btn primary" routerLink="/client/request/new">Create your first requisition</button>
      </div>
    </td>
  </tr>
</tbody>
        </table>
      </div>
    </div>

    <!-- View Requisition Details Modal -->
    <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
      <div class="modal-window view-modal" (click)="$event.stopPropagation()">
        <div class="modal-titlebar">
          <span>📋 Requisition Details</span>
          <button type="button" (click)="closeViewModal()" class="modal-close">✕</button>
        </div>
        <div class="modal-body view-body">
          <div class="view-details" *ngIf="viewReq">
            <!-- Header Info -->
            <div class="view-header-info">
              <div class="view-req-number">
                <span class="view-label">REQ #:</span>
                <code>{{ viewReq.requisition_number }}</code>
              </div>
              <span class="status-badge" [class]="'status-' + (viewReq.status || 'pending')">
                {{ getStatusLabel(viewReq.status) }}
              </span>
            </div>

            <!-- Main Details Grid -->
            <div class="view-grid">
              <div class="view-field">
                <label>Request From:</label>
                <span class="request-type-badge" [class]="'type-' + (viewReq.request_from || '').toLowerCase()">
                  {{ viewReq.request_from || '—' }}
                </span>
              </div>
              <div class="view-field">
                <label>Date:</label>
                <span>{{ formatDate(viewReq.date) }}</span>
              </div>
              <div class="view-field">
                <label>Department:</label>
                <span>{{ getDepartmentName(viewReq.department_id) }}</span>
              </div>
              <div class="view-field">
                <label>Branch:</label>
                <span>🏢 {{ getBranchName(viewReq.branch_id) || '—' }}</span>
              </div>
              <div class="view-field full-width">
                <label>ATTN:</label>
                <span>{{ viewReq.attn || '—' }}</span>
              </div>
            </div>

            <!-- Remarks -->
            <div class="view-section">
              <h4>📝 Remarks / Reason</h4>
              <div class="view-remarks">{{ viewReq.remarks || 'No remarks provided.' }}</div>
            </div>

            <!-- Items Table -->
            <div class="view-section">
              <h4>📦 Items ({{ viewReq.items?.length || 0 }})</h4>
              <table class="view-items-table" *ngIf="viewReq.items?.length > 0; else noItems">
                <thead>
                  <tr><th>Qty</th><th>Item Description</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of viewReq.items">
                    <td class="center">{{ item.qty || 0 }}</td>
                    <td>{{ item.item || '—' }}</td>
                    <td class="right">{{ (item.unit_price || 0) | number:'1.2-2' }}</td>
                    <td class="right">{{ ((item.qty || 0) * (item.unit_price || 0)) | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="view-total-row">
                    <td colspan="3" class="right"><strong>Grand Total:</strong></td>
                    <td class="right"><strong>{{ getTotal(viewReq.items) | number:'1.2-2' }}</strong></td>
                  </tr>
                </tfoot>
              </table>
              <ng-template #noItems>
                <p class="no-items-text">No items listed</p>
              </ng-template>
            </div>

            <!-- Signatures -->
            <div class="view-section">
              <h4>✍️ Signatures</h4>
              <div class="view-signatures">
                <div class="view-sig-block">
                  <h5>Form Prepared By</h5>
                  <div class="view-sig-image" *ngIf="viewReq.prepared_signature">
                    <img [src]="viewReq.prepared_signature" alt="Prepared Signature">
                  </div>
                  <div class="view-sig-name">{{ viewReq.prepared_name || '—' }}</div>
                  <div class="view-sig-date">{{ formatDate(viewReq.prepared_date) }}</div>
                </div>
                <div class="view-sig-block">
                  <h5>Form Approved By</h5>
                  <div class="view-sig-image" *ngIf="viewReq.approved_signature">
                    <img [src]="viewReq.approved_signature" alt="Approved Signature">
                  </div>
                  <div class="view-sig-name">{{ viewReq.approved_name || '—' }}</div>
                  <div class="view-sig-date">{{ formatDate(viewReq.approved_date) }}</div>
                </div>
                <div class="view-sig-block">
                  <h5>Items Prepared By</h5>
                  <div class="view-sig-image" *ngIf="viewReq.items_prepared_signature">
                    <img [src]="viewReq.items_prepared_signature" alt="Items Prepared Signature">
                  </div>
                  <div class="view-sig-name">{{ viewReq.items_prepared_name || '—' }}</div>
                  <div class="view-sig-date">{{ formatDate(viewReq.items_prepared_date) }}</div>
                </div>
              </div>
            </div>

            <!-- Borrow Return Info -->
            <div class="view-section" *ngIf="viewReq.request_from === 'BORROW'">
              <h4>🔄 Return Information</h4>
              <div class="view-grid">
                <div class="view-field">
                  <label>Returned By:</label>
                  <span>{{ viewReq.returned_name || '—' }}</span>
                </div>
                <div class="view-field">
                  <label>Return Date:</label>
                  <span>{{ formatDate(viewReq.returned_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
  <button class="classic-btn" (click)="printRequisition(viewReq)" *ngIf="viewReq">
    🖨️ Print
  </button>
  <button class="classic-btn" (click)="closeViewModal()">Close</button>
 <!-- In view modal footer -->
<button class="classic-btn primary" 
        *ngIf="viewReq && canModify(viewReq)" 
        (click)="editFromModal()">
  ✏️ {{ isSentToMyDepartment(viewReq) ? 'Process' : 'Edit' }}
</button>
</div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
      <div class="modal-window" (click)="$event.stopPropagation()">
        <div class="modal-titlebar danger">
          <span>🗑️ Delete Requisition</span>
          <button type="button" (click)="cancelDelete()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Permanently delete this requisition?</h3>
              <p>Requisition: <strong>#{{ reqToDelete?.requisition_number }}</strong></p>
              <p class="resolve-title">"{{ reqToDelete?.prepared_name || 'Unknown' }} - {{ reqToDelete?.request_from || 'N/A' }}"</p>
              <p class="warning-hint danger-text">This action cannot be undone. All items and signatures will be permanently removed.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="classic-btn" (click)="cancelDelete()">Cancel</button>
            <button class="classic-btn danger" (click)="confirmDelete()">🗑️ Yes, Delete</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Toast Notification -->
<div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'" [class.warning]="toastType === 'warning'">
  <span>{{ toastMessage }}</span>
</div>
<!-- Process Confirmation Modal -->
<div class="modal-overlay" *ngIf="showProcessConfirmModal" (click)="cancelProcess()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" style="background: #cc6600;">
      <span>⚙️ Process Requisition</span>
      <button type="button" (click)="cancelProcess()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Start processing this requisition?</h3>
          <p>Requisition: <strong>#{{ processTargetReq?.requisition_number }}</strong></p>
          <p class="resolve-title">"{{ processTargetReq?.prepared_name || 'Unknown' }} - {{ processTargetReq?.request_from || 'N/A' }}"</p>
          <p class="warning-hint" style="color: #cc6600; background: #fff8e8; border: 1px solid #e6d88a;">
            This will change the status to <strong>On Process</strong>. The requester will be notified that their request is being processed.
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelProcess()">Cancel</button>
        <button class="classic-btn primary" style="background: #cc6600; border-color: #cc6600;" (click)="confirmProcess()">⚙️ Start Processing</button>
      </div>
    </div>
  </div>
</div>
<!-- Release Confirmation Modal -->
<div class="modal-overlay" *ngIf="showReleaseConfirm" (click)="cancelRelease()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" style="background: #0066cc;">
      <span>📦 Release Requisition</span>
      <button type="button" (click)="cancelRelease()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">📦</span>
        <div class="warning-message">
          <h3>Release this requisition?</h3>
          <p>Requisition: <strong>#{{ releaseTargetReq?.requisition_number }}</strong></p>
          <p class="resolve-title">"{{ releaseTargetReq?.prepared_name || 'Unknown' }} - {{ releaseTargetReq?.request_from || 'N/A' }}"</p>
          <p class="warning-hint" style="color: #0066cc; background: #e8f0ff; border: 1px solid #b8d0e8;">
            This will mark the items as <strong>Released</strong>. The requester will be notified that their items have been released.
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelRelease()">Cancel</button>
        <button class="classic-btn primary" style="background: #0066cc; border-color: #0066cc;" (click)="confirmRelease()">📦 Release Items</button>
      </div>
    </div>
  </div>
</div>
<!-- Bulk Process Confirmation Modal -->
<div class="modal-overlay" *ngIf="showBulkProcessConfirm" (click)="cancelBulkProcess()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" style="background: #cc6600;">
      <span>⚙️ Bulk Process</span>
      <button type="button" (click)="cancelBulkProcess()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Process {{ bulkProcessCount }} selected requisition(s)?</h3>
          <p class="warning-hint" style="color: #cc6600; background: #fff8e8; border: 1px solid #e6d88a;">
            This will change the status to <strong>On Process</strong> for all selected requisitions.
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelBulkProcess()">Cancel</button>
        <button class="classic-btn primary" style="background: #cc6600; border-color: #cc6600;" (click)="confirmBulkProcess()">⚙️ Process All</button>
      </div>
    </div>
  </div>
</div>

<!-- Bulk Release Confirmation Modal -->
<div class="modal-overlay" *ngIf="showBulkReleaseConfirm" (click)="cancelBulkRelease()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" style="background: #0066cc;">
      <span>📦 Bulk Release</span>
      <button type="button" (click)="cancelBulkRelease()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">📦</span>
        <div class="warning-message">
          <h3>Release {{ bulkProcessCount }} selected requisition(s)?</h3>
          <p class="warning-hint" style="color: #0066cc; background: #e8f0ff; border: 1px solid #b8d0e8;">
            This will mark all selected items as <strong>Released</strong>.
          </p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="classic-btn" (click)="cancelBulkRelease()">Cancel</button>
        <button class="classic-btn primary" style="background: #0066cc; border-color: #0066cc;" (click)="confirmBulkRelease()">📦 Release All</button>
      </div>
    </div>
  </div>
</div>
  `,
 styles: [`
    .req-list-container { padding: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #0a246a; }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }
    .classic-btn { background: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 3px; padding: 5px 14px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; color: #000; }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.primary:hover { background: #1a3a8a; }
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
    .tab-count.released-count { background: #0066cc; }
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
    .req-num { font-family: monospace; color: #0a3a8c; font-weight: bold; font-size: 11px; }
    .date-cell { font-family: monospace; font-size: 10px; white-space: nowrap; color: #555; }
    .items-cell { font-weight: 500; }
    .total-cell { font-weight: bold; color: #0a3a8c; font-family: monospace; }
    .request-type-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .type-purchase { background: #cde8f5; color: #0066cc; }
    .type-borrow { background: #fff0cc; color: #cc6600; }
    .type-repair { background: #f0ccf0; color: #880088; }
    .dept-cell { max-width: 130px; }
    .dept-info-small { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; }
    .branch-tag-tiny { font-size: 8px; background: #f0f4ff; color: #0a3a8c; padding: 1px 5px; border-radius: 3px; border: 1px solid #b8c8e8; white-space: nowrap; }
    .status-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; text-transform: uppercase; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-released { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .status-worker { margin-top: 2px; }
    .worker-label { font-size: 9px; color: #666; display: block; font-style: italic; }
    .creator-info { font-size: 9px; color: #666; margin-top: 2px; border-top: 1px dotted #ddd; padding-top: 2px; }
    .creator-label { color: #555; }
    .action-cell { white-space: nowrap; display: flex; gap: 2px; justify-content: center; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 5px; border-radius: 2px; }
    .action-btn:hover { background: #e8f0fe; border-color: #a0a0a0; }
    .edit-btn:hover { color: #0066cc; }
    .print-btn:hover { color: #008800; }
    .view-btn:hover { color: #0a3a8c; }
    .delete-btn:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }
    .empty-row td { text-align: center; padding: 30px; }
    .empty-state { text-align: center; }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
    .empty-state p { margin-bottom: 12px; color: #666; font-size: 11px; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 100%; max-width: 450px; max-height: 80vh; overflow-y: auto; border-radius: 2px; }
    .view-modal { max-width: 750px !important; max-height: 95vh; width: 95%; }
    .modal-titlebar { background: #0a246a; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; position: sticky; top: 0; z-index: 1; }
    .modal-titlebar.danger { background: #cc0000; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 3px 8px; font-size: 14px; border-radius: 2px; }
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    .modal-body { padding: 16px; }
    .view-body { max-height: 55vh; overflow-y: auto; padding: 16px 20px; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-message strong { color: #0a3a8c; font-family: monospace; }
    .resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; padding: 4px 8px; background: #f5f5f5; border-radius: 2px; border-left: 3px solid #ccc; word-break: break-word; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; line-height: 1.4; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #ccc; background: #e0e0e0; position: sticky; bottom: 0; }
    .view-details { font-size: 11px; }
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
    .view-items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .view-items-table th { background: #0a246a; color: white; padding: 6px 10px; font-weight: bold; border: 1px solid #0a246a; text-align: left; font-size: 9px; text-transform: uppercase; }
    .view-items-table td { padding: 5px 10px; border: 1px solid #ddd; }
    .view-items-table tbody tr:hover { background: #f8faff; }
    .view-items-table .center { text-align: center; }
    .view-items-table .right { text-align: right; font-family: monospace; }
    .view-total-row { background: #f0f4f8; font-weight: bold; }
    .view-total-row td { border: 2px solid #0a246a; padding: 8px 10px; }
    .no-items-text { color: #888; font-style: italic; text-align: center; padding: 15px; font-size: 11px; }
    .view-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .view-sig-block { text-align: center; padding: 10px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; }
    .view-sig-block h5 { margin: 0 0 8px 0; font-size: 9px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; letter-spacing: 0.5px; }
    .view-sig-image { min-height: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; background: white; border: 1px solid #eee; border-radius: 2px; padding: 4px; }
    .view-sig-image img { max-width: 120px; max-height: 45px; object-fit: contain; }
    .view-sig-name { font-size: 11px; font-weight: bold; color: #000; margin-bottom: 2px; }
    .view-sig-date { font-size: 9px; color: #888; }
    .direction-tag {
  font-size: 7px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-top: 1px;
  font-style: italic;
}
  .select-all-label {
  font-size: 10px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.select-all-label input[type="checkbox"] {
  cursor: pointer;
}
  .process-btn { color: #cc6600; }
.process-btn:hover { background: #fff8e8; border-color: #cc6600; color: #cc6600; }
.release-btn { color: #0066cc; }
.release-btn:hover { background: #e8f0ff; border-color: #0066cc; color: #0066cc; }
.tab-count.processing-count { background: #cc6600; }
.status-processing { background: #fff8e8; color: #cc6600; }
.direction-tag.outgoing {
  background: #e8f0ff;
  color: #0066cc;
}
.direction-tag.incoming {
  background: #fff8e8;
  color: #886600;
}
  .attn-cell { 
  max-width: 120px; 
}
.attn-info { 
  display: flex; 
  flex-direction: column; 
  gap: 1px; 
  align-items: center; 
}
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
  .toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #333;
  color: white;
  padding: 10px 18px;
  border-radius: 6px;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 3000;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.toast-notification.show {
  transform: translateY(0);
  opacity: 1;
}
  .classic-select option small {
  font-size: 8px;
  color: #888;
}
  .header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.classic-btn.active {
  background: #0a246a;
  color: white;
  border-color: #0a246a;
}
.toast-notification.success { background: #008800; }
.toast-notification.error { background: #cc0000; }
.toast-notification.warning { background: #cc6600; }
  .accept-btn { color: #008800; }
.accept-btn:hover { background: #eeffee; border-color: #008800; color: #008800; }
.reject-btn { color: #cc0000; }
.reject-btn:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }
    @media (max-width: 768px) { .view-modal { max-width: 95% !important; width: 95%; } .view-signatures { grid-template-columns: 1fr; } .view-grid { grid-template-columns: 1fr; } }
  `]
})
export class ClientRequisitionListComponent implements OnInit, OnDestroy {
  requisitions: any[] = [];
  filteredRequisitions: any[] = [];
  activeTab = 'all';
  searchTerm = '';
  filters = {
    requestFrom: '',
    requestFromDept: '',
    departmentId: '',
    branchId: ''
  };
  showBulkProcessConfirm = false;
showBulkReleaseConfirm = false;
bulkProcessCount = 0;
  viewMode: string = 'our';
  selectedReqIds: number[] = [];
  showToast = false;
toastMessage = '';
toastType: 'success' | 'error' | 'warning' = 'success';
private toastTimer: any;
  currentUser: any;
  userBranch: any = null;
  branches: any[] = [];
filteredBranches: any[] = []; 
  departments: any[] = [];
  filteredFilterDepartments: any[] = [];
 showProcessConfirmModal = false; 
processTargetReq: any = null;
  loading = false;
  showDeleteConfirm = false;
  showViewModal = false;
  viewReq: any = null;
  reqToDelete: any = null;
  showReleaseConfirm = false;
releaseTargetReq: any = null;
  private pollingInterval: any;
  private routerSub: Subscription | null = null;
  
  mainBranchIds = [1, 5];

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
    this.loadRequisitions();
    
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/request') || this.router.url.includes('/requisitions')) {
        this.loadRequisitions();
      }
    });

    this.pollingInterval = setInterval(() => {
      this.loadRequisitions();
    }, 30000);
  }

  ngOnDestroy() {
     if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  trackByReqId(index: number, req: any): number {
    return req.id;
  }
// Cache for ATTN user roles
private attnRoleCache: Map<string, string> = new Map();
// Add to component properties
private userRolesMap: Map<string, string> = new Map();

// Add this to ngOnInit after loadBranchesAndDepartments()
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
// Check if current user can Accept/Reject this requisition
canAcceptReject(req: any): boolean {
  if (!this.currentUser) return false;
  
  // Must be pending status
  if ((req.status || 'pending') !== 'pending') return false;
  
  // Must be sent to my department (recipient)
  if (!this.isSentToMyDepartment(req)) return false;
  
  // Must be the ATTN person (Head/Manager or Supervisor of the department)
  const attnName = req.attn || '';
  const currentUserName = this.currentUser.fullname || this.currentUser.username || '';
  
  // Check if current user is the ATTN person
  if (attnName !== currentUserName) return false;
  
  // Must be Head/Manager or Supervisor
  return this.isHeadOrSupervisor();
}
setViewMode(mode: string) {
  this.viewMode = mode;
  this.activeTab = 'all'; 
  this.selectedReqIds = [];
  this.applyFilters();
}
// Accept requisition
acceptRequisition(req: any) {
  if (!req.id) return;
  // Navigate to the approval form (same form, approval mode)
  // This works for both client and admin users
  this.router.navigate(['/client/request/edit'], { 
    queryParams: { id: req.id, mode: 'approve' } 
  });
}

// Reject requisition
rejectRequisition(req: any) {
  const reason = prompt(`Reject requisition #${req.requisition_number}. Enter reason:`);
  if (reason === null) return; // Cancelled
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    status: 'rejected',
    remarks: req.remarks ? `${req.remarks}\n\nRejected: ${reason}` : `Rejected: ${reason}`,
    approved_name: this.currentUser.fullname || this.currentUser.username,
    approved_date: new Date().toISOString().split('T')[0]
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg('❌ Requisition rejected!', 'warning');
      this.loadRequisitions();
    },
    error: (err) => {
      console.error('Failed to reject requisition:', err);
      // Optimistic update
      req.status = 'rejected';
      req.remarks = payload.remarks;
      this.applyFilters();
      this.showToastMsg('⚠️ Failed to reject, updated locally', 'warning');
    }
  });
}
showToastMsg(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  this.toastMessage = msg;
  this.toastType = type;
  this.showToast = true;
  if (this.toastTimer) clearTimeout(this.toastTimer);
  this.toastTimer = setTimeout(() => this.showToast = false, 3000);
}
// Simplified getAttnRole method
getAttnRole(attnName: string): string {
  if (!attnName) return '';
  return this.userRolesMap.get(attnName) || '';
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
 loadBranchesAndDepartments() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      this.branches = (branches || []).map(b => ({
        ...b,
        company_name: b.company_name || b.name
      }));
      const user: any = this.authService.getCurrentUser();
      this.userBranch = this.branches.find(b => b.id == user?.branch_id);
      
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
      this.departments = (depts || []).map(d => {
        const branch = this.branches.find(b => b.id == d.branch_id);
        return { ...d, displayName: `${d.name} — ${branch?.name || 'Unknown'}`, branch_id: d.branch_id };
      });
      // ✅ Initialize as empty - departments show only when branch is selected
      this.filteredFilterDepartments = [];
    }
  });
}
isSelected(req: any): boolean {
  return this.selectedReqIds.includes(req.id);
}
toggleSelect(req: any) {
  const index = this.selectedReqIds.indexOf(req.id);
  if (index === -1) {
    this.selectedReqIds.push(req.id);
  } else {
    this.selectedReqIds.splice(index, 1);
  }
}
isAllSelected(): boolean {
  if (this.filteredRequisitions.length === 0) return false;
  return this.filteredRequisitions.every(r => this.selectedReqIds.includes(r.id));
}

// Toggle select all
toggleSelectAll() {
  if (this.isAllSelected()) {
    // Deselect all
    this.selectedReqIds = [];
  } else {
    // Select all filtered
    this.selectedReqIds = this.filteredRequisitions.map(r => r.id);
  }
}
// Bulk process selected requisitions
bulkProcess() {
  if (this.selectedReqIds.length === 0) return;
  this.bulkProcessCount = this.selectedReqIds.length;
  this.showBulkProcessConfirm = true;
}

confirmBulkProcess() {
  this.showBulkProcessConfirm = false;
  if (this.bulkProcessCount === 0) return;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  let completed = 0;
  const total = this.bulkProcessCount;
  const ids = [...this.selectedReqIds];
  
  ids.forEach(id => {
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${id}/status`, { status: 'processing' }, { headers }).subscribe({
      next: () => {
        completed++;
        if (completed === total) {
          this.showToastMsg(`⚙️ ${total} requisition(s) now processing!`, 'success');
          this.selectedReqIds = [];
          this.loadRequisitions();
        }
      },
      error: () => {
        completed++;
        const req = this.requisitions.find(r => r.id === id);
        if (req) req.status = 'processing';
        if (completed === total) {
          this.applyFilters();
          this.selectedReqIds = [];
          this.showToastMsg('⚠️ Some updates may have failed', 'warning');
        }
      }
    });
  });
}

cancelBulkProcess() {
  this.showBulkProcessConfirm = false;
  this.bulkProcessCount = 0;
}

// Bulk release selected requisitions
bulkRelease() {
  if (this.selectedReqIds.length === 0) return;
  this.bulkProcessCount = this.selectedReqIds.length;
  this.showBulkReleaseConfirm = true;
}

confirmBulkRelease() {
  this.showBulkReleaseConfirm = false;
  if (this.bulkProcessCount === 0) return;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    status: 'released',
    released_name: this.currentUser.fullname || this.currentUser.username,
    released_date: new Date().toISOString().split('T')[0]
  };
  
  let completed = 0;
  const total = this.bulkProcessCount;
  const ids = [...this.selectedReqIds];
  
  ids.forEach(id => {
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${id}/status`, payload, { headers }).subscribe({
      next: () => {
        completed++;
        if (completed === total) {
          this.showToastMsg(`📦 ${total} requisition(s) released!`, 'success');
          this.selectedReqIds = [];
          this.loadRequisitions();
        }
      },
      error: () => {
        completed++;
        const req = this.requisitions.find(r => r.id === id);
        if (req) {
          req.status = 'released';
          req.released_name = payload.released_name;
          req.released_date = payload.released_date;
        }
        if (completed === total) {
          this.applyFilters();
          this.selectedReqIds = [];
          this.showToastMsg('⚠️ Some updates may have failed', 'warning');
        }
      }
    });
  });
}

cancelBulkRelease() {
  this.showBulkReleaseConfirm = false;
  this.bulkProcessCount = 0;
}
//loadRequisitions method:
loadRequisitions() {
    this.loading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { this.loading = false; return; }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const user: any = this.authService.getCurrentUser();
    
    // ✅ Use the MY endpoint which now returns:
    // 1. User's own requisitions (submitted_by = user.id)
    // 2. Requisitions sent to user's branch AND department (incoming)
    const url = `${environment.apiUrl}/api/requisitions/my`;
    
    console.log('📋 Loading requisitions from /api/requisitions/my');
    console.log('📋 Current user:', {
      id: user?.id,
      branch_id: user?.branch_id,
      department_id: user?.department_id,
      deptName: user?.department
    });
    
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => { 
        console.log('📋 Requisitions loaded:', data?.length || 0);
        
        let allReqs = Array.isArray(data) ? data : [];
        
        // Log each requisition for debugging
        allReqs.forEach(r => {
          console.log(`  REQ: ${r.requisition_number} | branch_id:${r.branch_id} dept_id:${r.department_id} | submitted_by:${r.submitted_by} | status:${r.status} | isMine:${r.submitted_by === user.id}`);
        });
        
        this.requisitions = allReqs;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load requisitions:', err);
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        this.requisitions = saved;
        this.applyFilters();
        this.loading = false;
      }
    });
  }

  // Fallback method if admin endpoint fails (e.g., for non-admin users)
  loadMyRequisitionsFallback() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { this.loading = false; return; }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const user: any = this.authService.getCurrentUser();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
      next: (data) => { 
        console.log('📋 Fallback: Loaded my requisitions:', data?.length || 0);
        this.requisitions = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Fallback also failed:', err);
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        this.requisitions = saved;
        this.applyFilters();
        this.loading = false;
      }
    });
  }
setActiveTab(tab: string) { 
  this.activeTab = tab; 
  this.selectedReqIds = []; 
  this.applyFilters(); 
}
applyFilters() {
    let filtered = [...this.requisitions];
    if (this.viewMode === 'our') {
      // Show requests made by our department (creator)
      filtered = filtered.filter(r => r.submitted_by === this.currentUser?.id);
    } else if (this.viewMode === 'incoming') {
      // Show requests from other departments sent to us
      filtered = filtered.filter(r => this.isSentToMyDepartment(r));
    }
    // Filter by status tab
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => (r.status || 'pending') === this.activeTab);
    }
  
    // Filter by branch
    if (this.filters.branchId) {
      filtered = filtered.filter(r => r.branch_id == this.filters.branchId);
    }
    
    // Filter by department
    if (this.filters.requestFromDept) {
  filtered = filtered.filter(r => 
    (r.request_from || '').toLowerCase() === this.filters.requestFromDept.toLowerCase()
  );
}
    // Filter by request type
    if (this.filters.requestFrom) {
      filtered = filtered.filter(r => r.request_from === this.filters.requestFrom);
    }
    
    // Search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.requisition_number?.toLowerCase().includes(term) ||
        r.attn?.toLowerCase().includes(term) ||
        r.prepared_name?.toLowerCase().includes(term) ||
        r.approved_name?.toLowerCase().includes(term) ||
        r.items_prepared_name?.toLowerCase().includes(term) ||
        r.request_from?.toLowerCase().includes(term)
      );
    }
    
    this.filteredRequisitions = filtered;
  }
  clearFilters() { 
    this.activeTab = 'all'; 
    this.filters = { requestFrom: '',  requestFromDept: '', departmentId: '', branchId: '' }; 
    this.searchTerm = ''; 
    this.filteredFilterDepartments = [];  // ✅ Reset to empty
    this.applyFilters(); 
  }
  getStatusCount(status: string): number { 
    if (!this.requisitions) return 0;
    return this.requisitions.filter(r => (r.status || 'pending') === status).length; 
  }

getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'Pending', 
        'approved': 'Accepted',
        'processing': 'On Process',
        'released': 'Released', 
        'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
}
// Check if recipient can Process (status is accepted/approved)
canProcess(req: any): boolean {
  if (!this.currentUser) return false;
  if ((req.status || 'pending') !== 'approved') return false;
  if (!this.isSentToMyDepartment(req)) return false;
  return this.isHeadOrSupervisor();
}

// Check if recipient can Release (status is processing)
canRelease(req: any): boolean {
  if (!this.currentUser) return false;
  if ((req.status || 'pending') !== 'processing') return false;
  if (!this.isSentToMyDepartment(req)) return false;
  return this.isHeadOrSupervisor();
}

// Check if user can delete
canDelete(req: any): boolean {
  if (!this.currentUser) return false;
  
  // Recipient (Head/Manager/Supervisor) can always delete
  if (this.isSentToMyDepartment(req) && this.isHeadOrSupervisor()) return true;
  
  // Creator can only delete pending
  if (req.submitted_by === this.currentUser.id && (req.status || 'pending') === 'pending') return true;
  
  // EDP admin can always delete
  if (this.isEDPUser() && this.isHeadOrSupervisor()) return true;
  
  return false;
}

// Process requisition (move from accepted to processing)
openProcessConfirm(req: any) {
  this.processTargetReq = req;
  this.showProcessConfirmModal = true;
}

cancelProcess() {
  this.showProcessConfirmModal = false;
  this.processTargetReq = null;
}

// And update processRequisition to call the renamed method:
processRequisition(req: any) {
  this.openProcessConfirm(req);
}

confirmProcess() {
  if (!this.processTargetReq) return;
  const req = this.processTargetReq;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    status: 'processing'
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg('⚙️ Requisition is now processing!', 'success');
      this.cancelProcess();
      this.loadRequisitions();
    },
    error: (err) => {
      console.error('Failed to process:', err);
      req.status = 'processing';
      this.applyFilters();
      this.cancelProcess();
      this.showToastMsg('⚠️ Failed, updated locally', 'warning');
    }
  });
}
// Release requisition (move from processing to released)
releaseRequisition(req: any) {
  this.releaseTargetReq = req;
  this.showReleaseConfirm = true;
}

confirmRelease() {
  if (!this.releaseTargetReq) return;
  const req = this.releaseTargetReq;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const payload = {
    status: 'released',
    released_name: this.currentUser.fullname || this.currentUser.username,
    released_date: new Date().toISOString().split('T')[0]
  };
  
  this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, { headers }).subscribe({
    next: () => {
      this.showToastMsg('📦 Requisition released!', 'success');
      this.cancelRelease();
      this.loadRequisitions();
    },
    error: (err) => {
      console.error('Failed to release:', err);
      req.status = 'released';
      req.released_name = payload.released_name;
      req.released_date = payload.released_date;
      this.applyFilters();
      this.cancelRelease();
      this.showToastMsg('⚠️ Failed, updated locally', 'warning');
    }
  });
}
// Show Request From column (shows creator's department) - visible when there are incoming requisitions
showRequestFromColumn(): boolean {
  // Show if any requisition in the filtered list is sent to current user's department
  return this.filteredRequisitions.some(r => this.isSentToMyDepartment(r));
}

// Show Recipient/Department column - visible when there are outgoing (own) requisitions
showRecipientColumn(): boolean {
  // Show if any requisition in the filtered list was created by current user
  return this.filteredRequisitions.some(r => r.submitted_by === this.currentUser?.id);
}

// Calculate colspan for empty row
getEmptyColspan(): number {
  let cols = 8; // Base columns: REQ Code, Date, ATTN, Items, Total, Status, Actions + (Request From OR Recipient)
  if (this.viewMode === 'incoming' && (this.activeTab === 'approved' || this.activeTab === 'processing')) cols++; // Checkbox
  cols++; // For the conditional column (Request From or Recipient)
  return cols;
}
cancelRelease() {
  this.showReleaseConfirm = false;
  this.releaseTargetReq = null;
}
  getTotal(items: any[]): number { 
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, i) => sum + ((Number(i.qty)||0) * (Number(i.unit_price)||0)), 0);
  }

  getDepartmentName(deptId: number): string {
    if (!deptId) return '—';
    const dept = this.departments.find(d => d.id == deptId);
    return dept?.name || dept?.displayName || '—';
  }

  getBranchName(branchId: number): string {
    if (!branchId) return '';
    const branch = this.branches.find(b => b.id == branchId);
    return branch?.name || '';
  }

  isEDPUser(): boolean {
    if (!this.currentUser) return false;
    const dept = (this.currentUser.department || this.currentUser.department_name || '').toLowerCase();
    return dept === 'edp' || dept === 'it' || dept === 'edp/it' || dept.includes('edp') || dept.includes('it');
  }
canModify(req: any): boolean { 
    const isPending = (req.status || 'pending') === 'pending';
    
    // Is this my own requisition? (creator)
    const isMyRequisition = req.submitted_by === this.currentUser?.id;
    
    // Is this sent to my department? (recipient)
    const isSentToMyDept = this.isSentToMyDepartment(req);
    
    // ✅ Creator can modify their OWN pending requisitions
    if (isMyRequisition && isPending) return true;
    
    // ✅ Recipient can modify pending requisitions sent to their department
    if (isSentToMyDept && isPending) return true;
    
    // EDP users with head/manager or supervisor role can modify any pending
    if (this.isEDPUser() && this.isHeadOrSupervisor() && isPending) return true;
    
    return false;
  }

  // ✅ NEW METHOD: Check if requisition is sent to current user's department
  isSentToMyDepartment(req: any): boolean {
    if (!this.currentUser) return false;
    
    const userBranchId = this.currentUser.branch_id;
    const userDeptId = this.currentUser.department_id;
    
    // Must match both branch AND department
    const matchBranch = userBranchId ? req.branch_id == userBranchId : false;
    const matchDept = userDeptId ? req.department_id == userDeptId : false;
    
    // Not my own requisition
    const notMyRequisition = req.submitted_by !== this.currentUser.id;
    
    return matchBranch && matchDept && notMyRequisition;
  }

  // ✅ NEW METHOD: Check if current user is the recipient
  isRecipient(req: any): boolean {
    return this.isSentToMyDepartment(req);
  }

  isHeadOrSupervisor(): boolean {
    if (!this.currentUser) return false;
    const role = (this.currentUser.role || '').toLowerCase();
    return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
  }

  // ─── VIEW MODAL ───────────────────────────
  openViewModal(req: any) {
    this.viewReq = req;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewReq = null;
  }

  // ─── EDIT ───────────────────────────
  editRequisition(req: any) {
    const id = req.id;
    if (!id) return;
    this.router.navigate(['/client/request/edit'], { queryParams: { id: id } });
  }

  // ─── PRINT ───────────────────────────
  printRequisition(req: any) {
    if (!req) return;
    
    const fmtDate = (val: any) => {
      if (!val) return '—';
      try { const d = new Date(val); if (isNaN(d.getTime())) return String(val);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
      catch { return String(val); }
    };

    const getTotal = (items: any[]) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((s, i) => s + ((Number(i.qty)||0)*(Number(i.unit_price)||0)), 0);
    };
    
    const companyName = this.userBranch?.company_name || this.userBranch?.name || 'Lee Super Plaza';
    const statusLabel = this.getStatusLabel(req.status);

    const printContent = `<!DOCTYPE html><html><head><title>Requisition - ${req.requisition_number}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:8mm}
        body{font-family:'Courier New',monospace;font-size:9px;color:#000;padding:10px}
        .req-print{background:white;border:2px solid #000;padding:16px 20px;max-width:750px;margin:0 auto}
        .req-header{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
        .req-header .company{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#0a246a}
        .req-header .title{font-size:11px;font-weight:bold;letter-spacing:3px;margin-top:4px}
        .req-header .ctrl-no{font-size:8px;color:#c00;font-weight:bold;margin-top:2px}
        .req-header .ref{font-size:8px;margin-top:4px;color:#555}
        .status-badge{display:inline-block;padding:1px 8px;border-radius:3px;font-size:8px;font-weight:bold;text-transform:uppercase}
        .status-pending{background:#fffae8;color:#886600;border:1px solid #e6d88a}
        .status-approved{background:#efe;color:#080;border:1px solid #8c8}
        .status-rejected{background:#ffecec;color:#c00;border:1px solid #eaa}
        .status-released{background:#e8f0ff;color:#06c}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:10px}
        .info-row{display:flex;font-size:9px;margin-bottom:4px}
        .info-label{font-weight:bold;white-space:nowrap;color:#333;width:80px;flex-shrink:0}
        .info-value{flex:1;color:#000}
        .remarks-section{margin:8px 0;padding:8px;border:1px solid #ccc;background:#fafafa;font-size:9px;min-height:30px;white-space:pre-wrap}
        .remarks-label{font-weight:bold;font-size:9px;margin-bottom:4px}
        .items-table{width:100%;border-collapse:collapse;margin:10px 0}
        .items-table th{background:#f0f4f8;padding:5px 8px;font-size:9px;font-weight:bold;border:1px solid #000;text-align:left}
        .items-table td{padding:4px 8px;font-size:9px;border:1px solid #ccc}
        .items-table td.right{text-align:right}
        .total-row{font-weight:bold;background:#f0f4f8}
        .total-row td{border:1px solid #000}
        .empty-row{text-align:center;color:#888;font-style:italic}
        .signatures{margin-top:16px;padding-top:10px;border-top:2px solid #000}
        .sig-row{display:flex;gap:12px}
        .sig-block{flex:1;text-align:center;padding:8px;border:1px solid #ccc;background:#fafafa}
        .sig-label{font-size:8px;font-weight:bold;text-transform:uppercase;color:#555;margin-bottom:6px;border-bottom:1px solid #ccc;padding-bottom:3px}
        .sig-image-area{border:1px solid #eee;min-height:45px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;background:white}
        .sig-image-area img{max-width:100px;max-height:40px;object-fit:contain}
        .sig-image-area .no-sig{font-size:7px;color:#ccc;font-style:italic}
        .sig-name{font-size:10px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:2px}
        .sig-date{font-size:8px;color:#333}
        .footer{margin-top:12px;padding-top:8px;border-top:1px solid #ccc;text-align:center;font-size:7px;color:#555}
        .footer p{margin:2px 0}
        @media print{body{padding:0;margin:0}.req-print{border:1px solid #000}}
      </style></head><body><div class="req-print">
      <div class="req-header"><div class="company">${companyName}</div><div class="title">REQUISITION FORM</div><div class="ctrl-no">CTRL NO.: EDR-30</div><div class="ref">REQ #: ${req.requisition_number||'N/A'} | Status: <span class="status-badge status-${req.status||'pending'}">${statusLabel}</span></div></div>
      <div class="info-grid"><div class="info-row"><span class="info-label">Request From:</span><span class="info-value">${req.request_from||'—'}</span></div><div class="info-row"><span class="info-label">ATTN:</span><span class="info-value">${req.attn||'—'}</span></div><div class="info-row"><span class="info-label">Date:</span><span class="info-value">${fmtDate(req.date)}</span></div><div class="info-row"><span class="info-label">Department:</span><span class="info-value">${this.getDepartmentName(req.department_id)}</span></div></div>
      <div class="remarks-section"><div class="remarks-label">Remarks / Reason:</div>${req.remarks||'No remarks provided.'}</div>
      <table class="items-table"><thead><tr><th>Qty</th><th>Item Description</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${(req.items&&req.items.length>0)?req.items.map((i:any)=>`<tr><td>${i.qty||0}</td><td>${i.item||'—'}</td><td class="right">${Number(i.unit_price||0).toFixed(2)}</td><td class="right">${(Number(i.qty||0)*Number(i.unit_price||0)).toFixed(2)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty-row">No items listed</td></tr>'}</tbody>${(req.items&&req.items.length>0)?`<tfoot><tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total:</td><td class="right">${getTotal(req.items).toFixed(2)}</td></tr></tfoot>`:''}</table>
      <div class="signatures"><div class="sig-row"><div class="sig-block"><div class="sig-label">Form Prepared By</div><div class="sig-image-area">${req.prepared_signature?`<img src="${req.prepared_signature}" alt="Signature">`:'<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.prepared_name||'_______________'}</div><div class="sig-date">${fmtDate(req.prepared_date)}</div></div><div class="sig-block"><div class="sig-label">Form Approved By</div><div class="sig-image-area">${req.approved_signature?`<img src="${req.approved_signature}" alt="Signature">`:'<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.approved_name||'_______________'}</div><div class="sig-date">${fmtDate(req.approved_date)}</div></div><div class="sig-block"><div class="sig-label">Items Prepared By</div><div class="sig-image-area">${req.items_prepared_signature?`<img src="${req.items_prepared_signature}" alt="Signature">`:'<span class="no-sig">No signature</span>'}</div><div class="sig-name">${req.items_prepared_name||'_______________'}</div><div class="sig-date">${fmtDate(req.items_prepared_date)}</div></div></div></div>
      <div class="footer"><p>📋 Leave R.F. to floor supervisor when BORROWING items, include expected date of return.</p><p>For Outside purchase: indicate if P.O. was made or paid by cash.</p><p>EDPtech Helpdesk v2.0 | Requisition #${req.requisition_number||'N/A'}</p></div></div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`;

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert('Please allow popups for this site to print requisitions.');
    }
  }

  // ─── DELETE ───────────────────────────
  deleteRequisition(req: any) {
    this.reqToDelete = req;
    this.showDeleteConfirm = true;
  }
// ─── EDIT FROM MODAL ───────────────────────────
editFromModal() {
  const req = this.viewReq;
  if (!req) return;
  this.closeViewModal();
  this.editRequisition(req);
}
  confirmDelete() {
    if (!this.reqToDelete) return;
    const req = this.reqToDelete;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { this.cancelDelete(); return; }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const deleteId = req.id || req.requisition_number;
    
    this.http.delete(`${environment.apiUrl}/api/requisitions/${deleteId}`, { headers }).subscribe({
      next: () => { 
        this.requisitions = this.requisitions.filter(r => r.id !== req.id);
        this.applyFilters();
        this.cancelDelete();
      },
      error: (err) => { 
        console.error('Delete failed:', err);
        this.requisitions = this.requisitions.filter(r => r.id !== req.id);
        this.applyFilters();
        this.cancelDelete();
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.reqToDelete = null;
  }

  formatDate(val: any): string {
    if (!val) return '—';
    try { 
      const d = new Date(val); 
      if (isNaN(d.getTime())) return String(val);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
    }
    catch { return String(val); }
  }
}