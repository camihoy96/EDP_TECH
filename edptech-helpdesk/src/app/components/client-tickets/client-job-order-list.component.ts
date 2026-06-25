import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-client-job-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
   <div class="jo-list-container">
  <div class="page-header">
    <h2>✍️ My Job Orders</h2>
    <button class="btn-new" routerLink="/client/job-orders/new">➕ New Job Order</button>
  </div>

  <!-- Empty State -->
  <div class="empty-state" *ngIf="jobOrders.length === 0">
    <div class="empty-icon">📋</div>
    <h3>No Job Orders Found</h3>
    <p>Create your first job order request.</p>
    <button class="btn-new" routerLink="/client/job-orders/new">➕ Create Job Order</button>
  </div>

<!-- Status Tabs - ADD done tab -->
<div class="status-tabs" *ngIf="jobOrders.length > 0">
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

 <!-- Job Orders Table -->
<div class="table-container" *ngIf="jobOrders.length > 0">
  <table class="jo-table" *ngIf="filteredOrders.length > 0">
    <thead>
      <tr>
        <th>JO #</th>
        <th>Date</th>
        <th>Company</th>
        <th>Dept</th>
        <th>Job Request</th>
        <th>Description</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let jo of filteredOrders" (click)="viewJobOrder(jo)" class="clickable-row">
        <td><code>{{ jo.job_order_number || 'N/A' }}</code></td>
        <td>{{ formatDate(jo.date) }}</td>
        <td>{{ jo.company || '—' }}</td>
        <td>
  {{ jo.department || '—' }}
  <div class="approved-by" *ngIf="jo.approved_name">
    approved by: {{ jo.approved_name }}
  </div>
</td>
        <td>{{ jo.request_dept || '—' }}</td>
        <td class="particulars-cell">{{ jo.particulars?.substring(0, 50) }}{{ jo.particulars?.length > 50 ? '...' : '' }}</td>
       <td>
  <span class="status-badge" [class]="'status-' + (jo.status || 'pending')">
    {{ getStatusLabel(jo.status) }}
  </span>
  <div class="received-by" *ngIf="jo.status === 'approved' && jo.received_name">
    by: {{ jo.received_name }}
  </div>
  <!-- ✅ Show done info -->
  <div class="received-by" *ngIf="jo.status === 'done' && jo.done_name">
    done by: {{ jo.done_name }}
  </div>
</td>
        <td (click)="$event.stopPropagation()">
          <button class="action-btn" *ngIf="canModify(jo)" (click)="editJobOrder(jo)" title="Edit">✏️</button>
          <button class="action-btn" (click)="printJobOrder(jo)" title="Print">🖨️</button>
          <button class="action-btn delete" *ngIf="canModify(jo)" (click)="deleteJobOrder(jo)" title="Delete">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
  
  <!-- Empty Tab Message -->
  <div class="empty-tab" *ngIf="filteredOrders.length === 0">
  <div class="empty-tab-icon">
    {{ activeTab === 'pending' ? '⏳' : activeTab === 'approved' ? '📥' : '❌' }}
  </div>
  <h4>No {{ activeTab === 'approved' ? 'received' : activeTab }} job orders</h4>
  <p *ngIf="activeTab === 'pending'">You don't have any pending job orders.</p>
  <p *ngIf="activeTab === 'approved'">No received job orders yet.</p>
  <p *ngIf="activeTab === 'rejected'">No rejected job orders.</p>
  <button class="btn-new" *ngIf="activeTab === 'pending'" routerLink="/client/job-orders/new">➕ Create Job Order</button>
</div>
</div>
</div>
<!-- Delete Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
  <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
    <div class="modal-header header-delete">
      <h3>🗑️ Delete Job Order</h3>
      <button class="modal-close" (click)="cancelDelete()">✕</button>
    </div>
    <div class="modal-body">
      <div class="confirm-content">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-message">
          <p>Are you sure you want to <strong>DELETE</strong> this job order?</p>
          
          <div class="confirm-detail" *ngIf="deleteTarget">
            <div><strong>JO #:</strong> {{ deleteTarget.job_order_number }}</div>
            <div><strong>Company:</strong> {{ deleteTarget.company || '—' }}</div>
            <div><strong>Request:</strong> {{ deleteTarget.request_dept || '—' }}</div>
          </div>
          
          <p class="confirm-warning">⚠️ This action cannot be undone.</p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" (click)="cancelDelete()">✕ Cancel</button>
      <button class="btn btn-delete" (click)="confirmDelete()">🗑️ Yes, Delete</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
  <span>{{ toastMessage }}</span>
</div>
  `,
  styles: [`
    .jo-list-container {
      padding: 16px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .page-header h2 {
      margin: 0;
      color: #0a246a;
      font-size: 16px;
    }
      .received-by {
  font-size: 10px;
  color: #242323;
  margin-top: 2px;
  font-style: italic;
}
    .btn-new {
      background: #0a3a8c;
      color: white;
      border: 2px solid;
      border-color: #1c5fb5 #042070 #042070 #1c5fb5;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 10px;
      border-radius: 3px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-new:hover { background: #1c5fb5; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #c0c0c0;
    }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .empty-state h3 { margin: 0 0 8px 0; color: #333; }
    .empty-state p { color: #666; margin-bottom: 16px; }

    .table-container {
      background: white;
      border: 1px solid #c0c0c0;
      overflow-x: auto;
    }
    .jo-table {
      width: 100%;
      border-collapse: collapse;
    }
    .jo-table th {
      background: #f0f4f8;
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #555;
      border-bottom: 2px solid #d0d0d0;
      white-space: nowrap;
    }
    .jo-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #eee;
      font-size: 11px;
      color: #333;
    }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #f8faff; }
    code {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .particulars-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-badge {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-transform: capitalize;
    }
      /* Status Tabs */
.status-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}
.status-tab {
  flex: 1;
  padding: 8px 14px;
  background: white;
  border: 1px solid #c0c0c0;
  cursor: pointer;
  font-size: 11px;
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
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  background: #e0e0e0;
  color: #555;
}
  .empty-tab {
  text-align: center;
  padding: 40px 20px;
}
.empty-tab-icon {
  font-size: 40px;
  margin-bottom: 10px;
}
.empty-tab h4 {
  margin: 0 0 6px 0;
  color: #555;
  font-size: 13px;
}
.empty-tab p {
  color: #888;
  font-size: 11px;
  margin-bottom: 14px;
}
.status-tab.active .tab-count {
  background: rgba(255,255,255,0.3);
  color: white;
}
  .approved-by {
  font-size: 9px;
  color: #666;
  margin-top: 2px;
  font-style: italic;
}
  .status-done { background: #e8f0ff; color: #0066cc; }
.tab-count.done { background: #e8f0ff; color: #0066cc; }
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; border-radius: 8px; width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; color: white; border-radius: 8px 8px 0 0; }
.header-delete { background: #cc0000; }
.modal-close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px 10px; border-radius: 4px; }
.modal-body { padding: 18px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; background: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; color: #000000; }
.confirm-content { text-align: center; color: #020202; }
.confirm-icon { font-size: 48px; margin-bottom: 12px; }
.confirm-message p { font-size: 13px; color: #0c0c0c; margin-bottom: 12px; }
.confirm-detail { text-align: left; background: #f9f9f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #0a0909; }
.confirm-detail div { margin-bottom: 4px; color: #0a0909; }
.confirm-warning { color: #cc0000 !important; font-size: 10px !important; font-weight: 600; background: #fff0f0; padding: 8px; border-radius: 4px; }
.btn { padding: 6px 14px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; }
.btn:hover { background: #f0f0f0; }
.btn-delete { background: #cc0000; color: white; border-color: #aa0000; }
.btn-delete:hover { background: #aa0000; }

.toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; font-size: 12px; }
.toast-notification.show { transform: translateY(0); opacity: 1; }
.toast-notification.success { background: #008800; }
.toast-notification.error { background: #cc6600; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .action-btn {
      background: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-btn.delete:hover { background: #ffecec; border-color: #cc0000; }
  `]
})
export class ClientJobOrderListComponent implements OnInit {
  jobOrders: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadJobOrders();
  }
activeTab = 'pending';

get filteredOrders(): any[] {
  if (this.activeTab === 'all') return this.jobOrders;
  return this.jobOrders.filter(o => (o.status || 'pending') === this.activeTab);
}

setActiveTab(tab: string) {
  this.activeTab = tab;
}

getStatusCount(status: string): number {
  return this.jobOrders.filter(o => (o.status || 'pending') === status).length;
}
 loadJobOrders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
      next: (data) => {
        console.log('📋 Job orders from API:', data);
        this.jobOrders = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.log('⚠️ API failed, loading from localStorage');
        const saved = JSON.parse(localStorage.getItem('job_orders') || '[]');
        console.log('📋 Job orders from localStorage:', saved);
        this.jobOrders = saved;
      }
    });
  }
canModify(jo: any): boolean {
    return jo.status === 'pending' || !jo.status;
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
  editJobOrder(jo: any) {
  // Navigate to the form with the job order data
  this.router.navigate(['/client/job-orders/edit'], { 
    queryParams: { id: jo.id || jo.job_order_number } 
  });
}
  viewJobOrder(jo: any) {
    // Navigate to view detail (or print)
    this.printJobOrder(jo);
  }

 printJobOrder(jo: any) {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    // Pre-format dates to avoid ISO string issues
   const fmtDate = (val: any) => {
  if (!val) return '—';
  const str = typeof val === 'string' ? val : val.toString();
  if (str.includes('T')) {
    // Parse and format to local date to avoid timezone offset
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
          <div class="info-row"><span class="info-label">CRTL #:</span><span class="info-value">${jo.crtk_no || '—'}</span></div>
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
          <div class="description">${jo.particulars || 'No details provided.'}</div>

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
      return String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    }
    // Use LOCAL time methods (same as print fmtDate)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(dateStr);
  }
}
showDeleteModal = false;
deleteTarget: any = null;
showToast = false;
toastMessage = '';
toastType: 'success' | 'error' = 'success';
private toastTimer: any;

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
      this.showDeleteModal = false;
      this.deleteTarget = null;
      this.showToastMsg('✅ Job Order deleted!', 'success');
    },
    error: (err) => {
      console.error('Delete error:', err);
      this.jobOrders = this.jobOrders.filter(j => j !== jo);
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