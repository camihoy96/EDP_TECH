import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-requisitions-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h2>📩 Requisition Management</h2>
        <span class="header-sub">Manage and process all requisition requests</span>
      </div>

      <div class="stats-bar">
        <div class="stat-item"><span class="stat-label">Total</span><span class="stat-value">{{ allReqs.length }}</span></div>
        <div class="stat-item pending"><span class="stat-label">Pending</span><span class="stat-value">{{ getStatusCount('pending') }}</span></div>
        <div class="stat-item approved"><span class="stat-label">Received</span><span class="stat-value">{{ getStatusCount('approved') }}</span></div>
        <!-- ✅ NEW: Released stat -->
        <div class="stat-item released"><span class="stat-label">Released</span><span class="stat-value">{{ getStatusCount('released') }}</span></div>
        <div class="stat-item rejected"><span class="stat-label">Rejected</span><span class="stat-value">{{ getStatusCount('rejected') }}</span></div>
      </div>

      <div class="status-tabs">
        <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">⏳ Pending <span class="tab-count">{{ getStatusCount('pending') }}</span></button>
        <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">📥 Received <span class="tab-count">{{ getStatusCount('approved') }}</span></button>
        <!-- ✅ NEW: Released tab -->
        <button class="status-tab" [class.active]="activeTab === 'released'" (click)="setActiveTab('released')">📦 Released <span class="tab-count">{{ getStatusCount('released') }}</span></button>
        <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">❌ Rejected <span class="tab-count">{{ getStatusCount('rejected') }}</span></button>
      </div>

      <div class="filter-bar">
        <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" class="filter-input" placeholder="REQ #, name...">
        <button class="btn" (click)="loadAll()">🔄 Refresh</button>
        <span class="count-badge">{{ filteredReqs.length }} requisition(s)</span>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>REQ #</th><th>Date</th><th>Request From</th><th>ATTN</th><th>Prepared By</th><th>Items</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of filteredReqs" class="clickable-row">
              <td><code>{{ req.requisition_number || 'N/A' }}</code></td>
              <td>{{ formatDate(req.date) }}</td>
              <td>{{ req.request_from || '—' }}</td>
              <td>{{ req.attn || '—' }}</td>
              <td>{{ req.prepared_name || '—' }}</td>
              <td>{{ req.items?.length || 0 }} item(s)</td>
              <td>
                <span class="status-badge" [class]="'status-' + (req.status || 'pending')">
                  {{ getStatusLabel(req.status) }}
                </span>
                <!-- ✅ Show who prepared/released items -->
                <div class="received-by" *ngIf="req.status === 'approved' && req.items_prepared_name">by: {{ req.items_prepared_name }}</div>
                <div class="received-by" *ngIf="req.status === 'released' && req.released_name">by: {{ req.released_name }}</div>
              </td>
              <td (click)="$event.stopPropagation()">
                <button class="action-btn view" (click)="viewDetail(req)" title="View">👁️</button>
                <button class="action-btn print" (click)="printReq(req)" title="Print">🖨️</button>
                <button class="action-btn approve" *ngIf="req.status === 'pending'" (click)="receiveReq(req)" title="Receive">📥</button>
                <!-- ✅ NEW: Release button -->
                <button class="action-btn release" *ngIf="req.status === 'approved'" (click)="releaseReq(req)" title="Release Items">📦</button>
                <button class="action-btn reject" *ngIf="req.status === 'pending'" (click)="updateStatus(req, 'rejected')" title="Reject">❌</button>
                <button class="action-btn delete" *ngIf="(req.status === 'pending' || req.status === 'rejected') && currentUser?.role === 'admin'" (click)="deleteReq(req)" title="Delete">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="filteredReqs.length === 0"><td colspan="8" class="empty-row">No requisitions found</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="selectedReq" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
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
              <span class="detail-label">ATTN:</span>
              <span class="detail-value">{{ selectedReq.attn || '—' }}</span>
            </div>
            <!-- ✅ Show release info if released -->
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
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-modal-header" [class]="'confirm-' + confirmModalType">
          <span class="confirm-icon">
            {{ confirmModalType === 'receive' ? '📥' : confirmModalType === 'reject' ? '❌' : confirmModalType === 'release' ? '📦' : '🗑️' }}
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
            {{ confirmModalType === 'receive' ? '📥 Receive' : confirmModalType === 'reject' ? '❌ Reject' : confirmModalType === 'release' ? '📦 Release' : '🗑️ Delete' }}
          </button>
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
    .data-table th { background: #f0f4f8; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #131212; cursor: pointer; }
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
    .btn-confirm.btn-release { background: #0066cc; }
    .btn-confirm.btn-release:hover { background: #0044aa; }
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
      border-radius: 10px;
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
      border-radius: 10px 10px 0 0;
    }
    .modal-header h3 { margin: 0; color: #0a246a; font-size: 16px; }
    .modal-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #888;
      padding: 4px 8px;
      border-radius: 4px;
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
      border-radius: 0 0 10px 10px;
    }
    .btn-close { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-close:hover { background: #0a3a8c; }
    
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
  border-radius: 12px;
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
  border-radius: 8px;
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
.btn-confirm.btn-receive { background: #008800; }
.btn-confirm.btn-receive:hover { background: #006600; }
.btn-confirm.btn-reject { background: #cc0000; }
.btn-confirm.btn-reject:hover { background: #aa0000; }
.btn-confirm.btn-delete { background: #cc4400; }
.btn-confirm.btn-delete:hover { background: #aa3300; }
    .sig-image-container img { max-width: 100%; max-height: 45px; object-fit: contain; }
    .sig-info strong { display: block; font-size: 10px; color: #333; }
    .sig-info span { font-size: 9px; color: #888; }
  `]
})
export class RequisitionsManagementComponent implements OnInit {
  allReqs: any[] = [];
  filteredReqs: any[] = [];
  searchTerm = '';
  activeTab = 'pending';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  currentUser: any;
  selectedReq: any = null;
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalType: 'receive' | 'reject' | 'release' | 'delete' = 'receive';  // ✅ Added 'release'
  confirmTargetReq: any = null;

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
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loadAll();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

  loadAll() {
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/requisitions`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => { this.allReqs = Array.isArray(data) ? data : []; this.applyFilters(); },
      error: () => this.showToastMsg('Failed to load requisitions', 'error')
    });
  }

  applyFilters() {
    let filtered = this.allReqs.filter(r => (r.status || 'pending') === this.activeTab);
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

  setActiveTab(tab: string) { this.activeTab = tab; this.applyFilters(); }
  getStatusCount(status: string): number { return this.allReqs.filter(r => (r.status || 'pending') === status).length; }

  // ✅ NEW: Status label helper
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Received',
      'released': 'Released',
      'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
  }

  getTotal(items: any[]): number { return items?.reduce((s: number, i: any) => s + ((i.qty || 0) * (i.unit_price || 0)), 0) || 0; }

  viewDetail(req: any) { this.selectedReq = req; }
  closeModal() { this.selectedReq = null; }

  receiveReq(req: any) {
    this.router.navigate(['/admin/requisitions/approve'], { queryParams: { id: req.id } });
  }

  // ✅ NEW: Release requisition
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

  confirmAction() {
    if (!this.confirmTargetReq) return;
    const req = this.confirmTargetReq;
    switch (this.confirmModalType) {
      case 'receive': this.processReceive(req); break;
      case 'reject': this.processReject(req); break;
      case 'release': this.processRelease(req); break;  // ✅ NEW
      case 'delete': this.processDelete(req); break;
    }
    this.closeConfirmModal();
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
        this.notificationService.handleRequisitionReceived(
          { id: req.id, requisition_number: req.requisition_number },
          payload.approved_name,
          req.submitted_by
        );
      },
      error: () => { req.status = 'approved'; this.applyFilters(); this.showToastMsg('⚠️ Updated locally', 'error'); }
    });
  }

  // ✅ NEW: Process release
  processRelease(req: any) {
    const payload = {
      status: 'released',
      released_name: this.authService.getCurrentUser()?.fullname || 'Admin',
      released_date: new Date().toISOString().split('T')[0]
    };
    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${req.id}/status`, payload, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        req.status = 'released';
        req.released_name = payload.released_name;
        req.released_date = payload.released_date;
        this.applyFilters();
        this.showToastMsg('📦 Requisition released!', 'success');
      },
      error: () => { req.status = 'released'; this.applyFilters(); this.showToastMsg('⚠️ Updated locally', 'error'); }
    });
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

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}