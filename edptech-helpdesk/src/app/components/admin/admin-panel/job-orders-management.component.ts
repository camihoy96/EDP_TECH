import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-job-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h2>📋 Job Order Management</h2>
        <span class="header-sub">Manage and process all job order requests</span>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ allOrders.length }}</span>
        </div>
        <div class="stat-item pending">
          <span class="stat-label">Pending</span>
          <span class="stat-value">{{ getStatusCount('pending') }}</span>
        </div>
        <div class="stat-item approved">
  <span class="stat-label">Received</span>
  <span class="stat-value">{{ getStatusCount('approved') }}</span>
</div>
        <div class="stat-item done">
          <span class="stat-label">Done</span>
          <span class="stat-value">{{ getStatusCount('done') }}</span>
        </div>
        <div class="stat-item rejected">
          <span class="stat-label">Rejected</span>
          <span class="stat-value">{{ getStatusCount('rejected') }}</span>
        </div>
      </div>

<!-- Status Tabs-->
<div class="status-tabs">
  <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
    ⏳ Pending <span class="tab-count pending">{{ getStatusCount('pending') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
    📥 Received <span class="tab-count approved">{{ getStatusCount('approved') }}</span>
  </button>
  <!-- ✅ NEW: Done tab -->
  <button class="status-tab" [class.active]="activeTab === 'done'" (click)="setActiveTab('done')">
    ✅ Done <span class="tab-count done">{{ getStatusCount('done') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">
    ❌ Rejected <span class="tab-count rejected">{{ getStatusCount('rejected') }}</span>
  </button>
</div>

<!-- Filter Bar -->
<div class="filter-bar">
  <div class="filter-group">
    <label>Search:</label>
    <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
           class="filter-input" placeholder="JO #, company, name...">
  </div>
  <button class="btn" (click)="loadAllOrders()">🔄 Refresh</button>
  <span class="count-badge">{{ filteredOrders.length }} order(s)</span>
</div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>JO #</th>
              <th>Date</th>
              <th>Company</th>
              <th>Dept</th>
              <th>Request By</th>
              <th>Particulars</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let jo of filteredOrders" (click)="viewDetail(jo)" class="clickable-row">
              <td><code>{{ jo.job_order_number || 'N/A' }}</code></td>
              <td>{{ formatDate(jo.date) }}</td>
              <td>{{ jo.company || '—' }}</td>
              <td>{{ jo.department || '—' }}</td>
              <td>{{ jo.requested_name || '—' }}</td>
              <td class="particulars-cell">{{ jo.particulars?.substring(0, 60) }}{{ jo.particulars?.length > 60 ? '...' : '' }}</td>
             <td>
  <span class="status-badge" [class]="'status-' + (jo.status || 'pending')">
    {{ getStatusLabel(jo.status) }}
  </span>
  <div class="received-by" *ngIf="jo.status === 'approved' && jo.received_name">
    by: {{ jo.received_name }}
  </div>
  <!-- ✅ Show done info -->
  <div class="received-by" *ngIf="jo.status === 'done' && jo.done_name">
    by: {{ jo.done_name }}
  </div>
</td>
              <td (click)="$event.stopPropagation()">
  <button class="action-btn view" (click)="viewDetail(jo)" title="View">👁️</button>
  <button class="action-btn print" (click)="printOrder(jo)" title="Print">🖨️</button>
  <button class="action-btn approve" *ngIf="jo.status === 'pending'" 
          (click)="openApprovalForm(jo)" title="Receive">📥</button>
          <button class="action-btn done" *ngIf="jo.status === 'approved'" 
        (click)="markAsDone(jo)" title="Mark as Done">✅</button>
  <button class="action-btn reject" *ngIf="jo.status === 'pending'" 
          (click)="updateStatus(jo, 'rejected')" title="Reject">❌</button>
  
  <!-- DELETE - Admin Only -->
  <button class="action-btn delete" *ngIf="jo.status === 'pending' && currentUser?.role === 'admin'" 
          (click)="deleteOrder(jo)" title="Delete">🗑️</button>
</td>
            </tr>
            <tr *ngIf="filteredOrders.length === 0">
              <td colspan="8" class="empty-row">No job orders found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetailModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Job Order Detail</h3>
          <button class="modal-close" (click)="closeDetailModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedOrder">
          <div class="detail-grid">
            <div class="detail-item"><label>JO Code:</label><span>{{ selectedOrder.job_order_number }}</span></div>
            <div class="detail-item"><label>Date:</label><span>{{ formatDate(selectedOrder.date) }}</span></div>
            <div class="detail-item"><label>Company:</label><span>{{ selectedOrder.company || '—' }}</span></div>
            <div class="detail-item"><label>CRTL #:</label><span>{{ selectedOrder.crtk_no || '—' }}</span></div>
            <div class="detail-item"><label>Date Needed:</label><span>{{ formatDate(selectedOrder.date_needed) }}</span></div>
            <div class="detail-item"><label>Department:</label><span>{{ selectedOrder.department || '—' }}</span></div>
            <div class="detail-item"><label>Request:</label><span>{{ selectedOrder.request_dept || '—' }}</span></div>
            <div class="detail-item"><label>Job For:</label><span>{{ selectedOrder.job_order_for || '—' }}</span></div>
            <div class="detail-item"><label>Status:</label>
              <span class="status-badge" [class]="'status-' + (selectedOrder.status || 'pending')">{{ selectedOrder.status === 'approved' ? 'received' : (selectedOrder.status || 'pending') }}</span>
            </div>
            <div class="detail-item"><label>Charge:</label><span>{{ selectedOrder.is_charge ? 'Yes' : 'No' }}</span></div>
            <div class="detail-item"><label>Expense:</label><span>{{ selectedOrder.is_expense ? 'Yes' : 'No' }}</span></div>
          </div>
          
          <div class="detail-section">
            <h4>Particulars / Description</h4>
            <div class="detail-desc">{{ selectedOrder.particulars || 'No details' }}</div>
          </div>

         <div class="detail-signatures">
  <div class="sig-box" *ngIf="selectedOrder.requested_signature || selectedOrder.requested_name">
    <h5>Requested By: {{ selectedOrder.requested_name || '—' }}</h5>
    <img [src]="selectedOrder.requested_signature" alt="Signature" *ngIf="selectedOrder.requested_signature">
    <span *ngIf="!selectedOrder.requested_signature" class="no-sig-text">No signature</span>
    <span>{{ formatDate(selectedOrder.requested_date) }}</span>
  </div>
  <div class="sig-box" *ngIf="selectedOrder.status === 'approved' || selectedOrder.approved_signature || selectedOrder.approved_name">
    <h5>Approved By: {{ selectedOrder.approved_name || '—' }}</h5>
    <img [src]="selectedOrder.approved_signature" alt="Signature" *ngIf="selectedOrder.approved_signature">
    <span *ngIf="!selectedOrder.approved_signature" class="no-sig-text">No signature</span>
  </div>
  <div class="sig-box" *ngIf="selectedOrder.status === 'approved' || selectedOrder.received_signature || selectedOrder.received_name">
    <h5>Received By: {{ selectedOrder.received_name || '—' }}</h5>
    <img [src]="selectedOrder.received_signature" alt="Signature" *ngIf="selectedOrder.received_signature">
    <span *ngIf="!selectedOrder.received_signature" class="no-sig-text">No signature</span>
    <span>{{ formatDate(selectedOrder.received_date) }}</span>
  </div>
</div>

          <div class="modal-actions" *ngIf="selectedOrder.status === 'pending'">
  <button class="btn btn-approve" (click)="openApprovalForm(selectedOrder); closeDetailModal()">📥 Receive</button>
  <button class="btn btn-reject" (click)="updateStatus(selectedOrder, 'rejected'); closeDetailModal()">❌ Reject</button>
</div>
        </div>
      </div>
    </div>
   <!-- Confirm Modal -->
<div class="modal-overlay" *ngIf="showConfirmModal" (click)="cancelConfirm()">
  <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
    <div class="modal-header" [class]="'header-' + (confirmAction || 'approve')">
      <h3>
        {{ confirmAction === 'approve' ? '📥 Receive Job Order' : 
           confirmAction === 'reject' ? '❌ Reject Job Order' : 
           confirmAction === 'done' ? '✅ Mark as Done' : 
           '🗑️ Delete Job Order' }}
      </h3>
      <button class="modal-close" (click)="cancelConfirm()">✕</button>
    </div>
    <div class="modal-body">
      <div class="confirm-content">
        <span class="confirm-icon">
          {{ confirmAction === 'approve' ? '📥' : 
             confirmAction === 'reject' ? '❌' : 
             confirmAction === 'done' ? '✅' : '🗑️' }}
        </span>
        <div class="confirm-message">
          <p *ngIf="confirmAction === 'approve'">
            Are you sure you want to <strong>receive</strong> Job Order 
            <strong>#{{ confirmTarget?.job_order_number }}</strong>?
          </p>
          <p *ngIf="confirmAction === 'reject'">
            Are you sure you want to <strong>reject</strong> Job Order 
            <strong>#{{ confirmTarget?.job_order_number }}</strong>?
          </p>
          <p *ngIf="confirmAction === 'done'">
            Are you sure you want to mark Job Order 
            <strong>#{{ confirmTarget?.job_order_number }}</strong> as <strong>Done</strong>?
          </p>
          <p *ngIf="confirmAction === 'delete'">
            Are you sure you want to <strong>delete</strong> Job Order 
            <strong>#{{ confirmTarget?.job_order_number }}</strong>?
          </p>
          <div class="confirm-detail" *ngIf="confirmTarget">
            <div><strong>Company:</strong> {{ confirmTarget.company || '—' }}</div>
            <div><strong>Requested By:</strong> {{ confirmTarget.requested_name || '—' }}</div>
            <div><strong>Department:</strong> {{ confirmTarget.department || '—' }}</div>
          </div>
          <p class="confirm-warning" *ngIf="confirmAction === 'delete'">
            ⚠️ This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" (click)="cancelConfirm()">Cancel</button>
      <button class="btn" 
              [class]="'btn-' + (confirmAction || 'approve')" 
              (click)="confirmAction === 'delete' ? confirmDelete() : confirmStatusUpdate()">
        {{ confirmAction === 'approve' ? '📥 Receive' : 
           confirmAction === 'reject' ? '❌ Reject' : 
           confirmAction === 'done' ? '✅ Mark Done' : 
           '🗑️ Delete' }}
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
    .admin-container { padding: 20px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0 0 4px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }

    .stats-bar { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-item { flex: 1; text-align: center; padding: 12px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; border-left: 4px solid #0a246a; }
    .stat-item.pending { border-left-color: #cc6600; }
    .stat-item.approved { border-left-color: #008800; }
    .stat-item.rejected { border-left-color: #cc0000; }
    .stat-label { display: block; font-size: 10px; text-transform: uppercase; color: #888; }
    .stat-value { font-size: 22px; font-weight: 700; color: #333; }

    .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 10px 14px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; flex-wrap: wrap; }
    .filter-group { display: flex; align-items: center; gap: 6px; }
    .filter-group label { font-weight: 600; font-size: 10px; color: #555; }
    .filter-select, .filter-input { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; }
    .filter-input { width: 200px; }
    .count-badge { margin-left: auto; color: #888; font-size: 11px; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; }
    .btn:hover { background: #f0f0f0; }

    .table-container { background: white; border: 1px solid #c0c0c0; border-radius: 6px; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; white-space: nowrap; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #f8faff; }
    code { font-family: 'Courier New', monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .particulars-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .status-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-rejected { background: #ffecec; color: #cc0000; }

    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px; }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-btn.approve:hover { background: #eeffee; border-color: #008800; }
    .action-btn.reject:hover { background: #ffecec; border-color: #cc0000; }
    .action-btn.delete:hover { background: #ffecec; border-color: #cc0000; }
    .empty-row { text-align: center; padding: 30px; color: #888; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0a246a; color: white; border-radius: 8px 8px 0 0; }
    .modal-header h3 { margin: 0; font-size: 14px; }
    .modal-close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px 10px; border-radius: 4px; }
    .modal-body { padding: 18px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .detail-item { padding: 6px 8px; background: #f9f9f9; border-radius: 4px; }
    .detail-item label { display: block; font-size: 9px; font-weight: 600; color: #0b5a00; text-transform: uppercase; }
    .detail-item span { font-size: 12px; font-weight: 500; color: #131212; }
    .detail-section { margin-bottom: 14px; }
    .detail-section h4 { font-size: 11px; color: #555; margin-bottom: 6px; }
    .detail-desc { padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #0a0909; }
    .detail-signatures { display: flex; gap: 12px; margin-bottom: 14px; }
    .sig-box { flex: 1; text-align: center; padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; }
    .sig-box h5 { font-size: 9px; color: #131212; margin: 0 0 6px 0; }
    .sig-box img { max-width: 120px; max-height: 50px; }
    .sig-box span { display: block; font-size: 9px; color: #161616; margin-top: 4px; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-approve { background: #008800; color: white; border-color: #006600; }
    .btn-approve:hover { background: #006600; }
    .btn-reject { background: #cc0000; color: white; border-color: #aa0000; }
    .btn-reject:hover { background: #aa0000; }
    .confirm-modal { max-width: 450px; }
    .stat-item.done { border-left-color: #0066cc; }
.status-done { background: #e8f0ff; color: #0066cc; }
.action-btn.done { color: #0066cc; }
.action-btn.done:hover { background: #e8f0ff; border-color: #0066cc; }
.tab-count.done { background: #e8f0ff; color: #0066cc; }
.header-approve { background: #008800; }
.header-reject { background: #cc0000; }
.header-delete { background: #cc0000; }
.confirm-content { text-align: center; }
.confirm-icon { font-size: 48px; margin-bottom: 12px; }
.confirm-message p { font-size: 13px; color: #333; margin-bottom: 12px; }
.confirm-message strong { color: #0a246a; }
.confirm-detail { 
  text-align: left; 
  background: #f9f9f9; 
  color: #0a0909;
  padding: 10px 14px; 
  border-radius: 6px; 
  margin-bottom: 12px; 
  font-size: 11px; 
}
.confirm-detail div { margin-bottom: 4px; }
.confirm-warning { 
  color: #020202 !important; 
  font-size: 10px !important; 
  font-weight: 600; 
  background: #fff0f0; 
  padding: 8px; 
  border-radius: 4px; 
}
.modal-footer { 
  display: flex; 
  justify-content: flex-end; 
  gap: 8px; 
  padding: 14px 18px; 
  background: #f8f9fa; 
  border-top: 1px solid #e0e0e0; 
  border-radius: 0 0 8px 8px; 
}
  /* Status Tabs */
.status-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}
.status-tab {
  flex: 1;
  padding: 10px 16px;
  background: white;
  border: 1px solid #c0c0c0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.status-tab:hover {
  background: #f8f8f8;
}
.status-tab.active {
  background: #0a246a;
  color: white;
  border-color: #0a246a;
}
.tab-count {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  background: #e0e0e0;
  color: #555;
}
.status-tab.active .tab-count {
  background: rgba(255,255,255,0.3);
  color: white;
}
  .received-by {
  font-size: 10px;
  color: #202020;
  margin-top: 2px;
  font-style: italic;
}
.status-tab.active .tab-count.pending { background: rgba(255,255,255,0.3); }
.status-tab.active .tab-count.approved { background: rgba(255,255,255,0.3); }
.status-tab.active .tab-count.rejected { background: rgba(255,255,255,0.3); }
.btn-approve { background: #008800; color: white; border-color: #006600; }
.btn-approve:hover { background: #006600; }
.btn-reject { background: #cc0000; color: white; border-color: #aa0000; }
.btn-reject:hover { background: #aa0000; }
.btn-delete { background: #cc0000; color: white; border-color: #aa0000; }
.btn-delete:hover { background: #aa0000; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .stat-item.done { border-left-color: #0066cc; }
.status-done { background: #e8f0ff; color: #0066cc; }
.header-done { background: #0066cc; }
.btn-done { background: #0066cc; color: white; border-color: #0044aa; }
.btn-done:hover { background: #0044aa; }

  `]
})
export class JobOrdersManagementComponent implements OnInit {
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  filterStatus = 'all';
  searchTerm = '';
  showDetailModal = false;
  selectedOrder: any = null;
  showToast = false;
  currentUser: any;
  showConfirmModal = false;
confirmAction: 'approve' | 'reject' | 'delete' | 'done' | null = null;
confirmTarget: any = null;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit() {
     this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loadAllOrders();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }
  activeTab = 'pending';

setActiveTab(tab: string) {
  this.activeTab = tab;
  this.filterStatus = tab;
  this.applyFilters();
}
  loadAllOrders() {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).subscribe({
      next: (data) => {
        this.allOrders = Array.isArray(data) ? data : [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.showToastMsg('Failed to load job orders', 'error');
      }
    });
  }
 openApprovalForm(jo: any) {
  // Navigate to the job order form in approval mode
  this.router.navigate(['/admin/job-orders/approve'], { 
    queryParams: { id: jo.id || jo.job_order_number } 
  });
}
  applyFilters() {
    let filtered = [...this.allOrders];
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === this.filterStatus);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.job_order_number?.toLowerCase().includes(term) ||
        o.company?.toLowerCase().includes(term) ||
        o.requested_name?.toLowerCase().includes(term) ||
        o.department?.toLowerCase().includes(term)
      );
    }
    this.filteredOrders = filtered;
  }
// Add this property
sigDrawing = false;

  getStatusCount(status: string): number {
    return this.allOrders.filter(o => o.status === status).length;
  }

  viewDetail(jo: any) {
    this.selectedOrder = jo;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  updateStatus(jo: any, status: string) {
  this.confirmTarget = jo;
  this.confirmAction = status === 'approved' ? 'approve' : 'reject';
  this.showConfirmModal = true;
}
getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'Pending',
        'approved': 'Received',
        'done': 'Done',
        'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
}

// ✅ Mark as Done
markAsDone(jo: any) {
    this.confirmTarget = jo;
    this.confirmAction = 'done';
    this.showConfirmModal = true;
}

confirmStatusUpdate() {
    if (!this.confirmTarget || !this.confirmAction) return;
    
    const jo = this.confirmTarget;
    let status: string;
    let extraPayload: any = {};
    
    switch (this.confirmAction) {
        case 'approve':
            status = 'approved';
            break;
        case 'reject':
            status = 'rejected';
            break;
        case 'done':
            status = 'done';
            extraPayload = {
                done_name: this.currentUser?.fullname || 'Admin',
                done_date: new Date().toISOString().split('T')[0]
            };
            break;
        default:
            return;
    }
    
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
    const payload = { status, ...extraPayload };
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${jo.id}/status`, payload, { headers }).subscribe({
        next: () => {
            jo.status = status;
            if (status === 'done') {
                jo.done_name = extraPayload.done_name;
                jo.done_date = extraPayload.done_date;
            }
            this.applyFilters();
            this.showConfirmModal = false;
            this.confirmTarget = null;
            this.confirmAction = null;
            this.showToastMsg(`✅ Job Order marked as ${this.getStatusLabel(status)}!`, 'success');
        },
        error: (err) => {
            // Fallback: update locally
            jo.status = status;
            if (status === 'done') {
                jo.done_name = extraPayload.done_name;
                jo.done_date = extraPayload.done_date;
            }
            this.applyFilters();
            this.showConfirmModal = false;
            this.confirmTarget = null;
            this.confirmAction = null;
            this.showToastMsg('⚠️ Updated locally', 'error');
        }
    });
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

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Job Order - ${jo.job_order_number}</title>
      <style>
        @page{size:A5 portrait;margin:6mm}*{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;font-size:9px;color:#000}
        .receipt{border:1px solid #000;padding:10px 14px;max-width:420px;margin:0 auto}
        h2{text-align:center;font-size:14px;text-transform:uppercase}
        .row{display:flex;margin:3px 0;font-size:8px}
        .lbl{font-weight:bold;width:65px;color:#555}.val{flex:1;font-weight:bold}
        .desc{border:1px solid #eee;padding:6px;min-height:40px;background:#fafafa;margin:6px 0}
        .sigs{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #000}
        .sig{flex:1;text-align:center}.sig img{max-width:80px;max-height:30px}
        .signame{font-size:9px;font-weight:bold;border-bottom:1px solid #000}
        @media print{body{padding:0}}
      </style></head><body>
      <div class="receipt">
        <h2>JOB ORDER</h2>
        <p style="text-align:center;font-size:7px;color:#666">Ref: ${jo.job_order_number||'N/A'}</p>
        <p style="text-align:center;font-size:8px;font-weight:bold;color:${jo.status==='approved'?'#008800':jo.status==='rejected'?'#cc0000':'#886600'}">${(jo.status||'pending').toUpperCase()}</p>
        <div class="row"><span class="lbl">Date:</span><span class="val">${fmtDate(jo.date)}</span></div>
        <div class="row"><span class="lbl">Company:</span><span class="val">${jo.company||'—'}</span></div>
        <div class="row"><span class="lbl">CRTL #:</span><span class="val">${jo.crtk_no||'—'}</span></div>
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
      </body></html>
    `);
    printWindow.document.close();
  }

 deleteOrder(jo: any) {
  this.confirmTarget = jo;
  this.confirmAction = 'delete';
  this.showConfirmModal = true;
}

confirmDelete() {
  if (!this.confirmTarget) return;
  
  const jo = this.confirmTarget;
  const headers = this.getAuthHeaders();
  
  this.http.delete(`${environment.apiUrl}/api/admin/job-orders/${jo.id}`, { headers }).subscribe({
    next: () => {
      this.allOrders = this.allOrders.filter(o => o.id !== jo.id);
      this.applyFilters();
      this.showConfirmModal = false;
      this.confirmTarget = null;
      this.confirmAction = null;
      this.showToastMsg('✅ Job Order deleted successfully!', 'success');
    },
    error: (err) => {
      console.error('Delete error:', err);
      
      if (err.status === 401) {
        this.showConfirmModal = false;
        this.showToastMsg('Session expired. Please login again.', 'error');
      } else if (err.status === 403) {
        this.showConfirmModal = false;
        this.showToastMsg('Access denied. Admin only.', 'error');
      } else if (err.status === 404) {
        this.showConfirmModal = false;
        this.showToastMsg('Job order not found on server.', 'error');
      } else if (err.status === 0) {
        // Cannot reach server - still remove locally for better UX
        this.allOrders = this.allOrders.filter(o => o.id !== jo.id);
        this.applyFilters();
        this.showConfirmModal = false;
        this.confirmTarget = null;
        this.confirmAction = null;
        this.showToastMsg('⚠️ Server unreachable. Removed locally only.', 'error');
      } else {
        this.showConfirmModal = false;
        this.showToastMsg('Failed to delete. Please try again.', 'error');
      }
    }
  });
}
cancelConfirm() {
  this.showConfirmModal = false;
  this.confirmTarget = null;
  this.confirmAction = null;
}

  formatDate(val: any): string {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).split('T')[0];
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } catch { return String(val); }
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}