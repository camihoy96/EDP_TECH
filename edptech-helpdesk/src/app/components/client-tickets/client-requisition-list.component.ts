import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-client-requisition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="req-list-container">
  <div class="page-header">
    <h2>📩 My Requisitions</h2>
    <button class="btn-new" routerLink="/client/request/new">➕ New Requisition</button>
  </div>

  <!-- Show when NO requisitions at all (new user) -->
  <div class="empty-state" *ngIf="requisitions.length === 0 && !loading">
    <div class="empty-icon">📩</div>
    <h3>No Requisitions Found</h3>
    <p>Submit your first requisition request.</p>
    <button class="btn-new" routerLink="/client/request/new">➕ Create Requisition</button>
  </div>

  <!-- Loading state -->
  <div class="empty-state" *ngIf="loading">
    <div class="empty-icon">⏳</div>
    <h3>Loading...</h3>
    <p>Fetching your requisitions</p>
  </div>

 <!-- Status Tabs -->
<div class="status-tabs" *ngIf="requisitions.length > 0">
  <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
    ⏳ Pending <span class="tab-count">{{ getStatusCount('pending') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
    📥 Received <span class="tab-count">{{ getStatusCount('approved') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'released'" (click)="setActiveTab('released')">
    📦 Released <span class="tab-count">{{ getStatusCount('released') }}</span>
  </button>
  <button class="status-tab" [class.active]="activeTab === 'rejected'" (click)="setActiveTab('rejected')">
    ❌ Rejected <span class="tab-count">{{ getStatusCount('rejected') }}</span>
  </button>
</div>

  <!-- Table - only show when there are filtered results -->
  <div class="table-container" *ngIf="requisitions.length > 0 && filteredRequisitions.length > 0">
    <table class="req-table">
      <thead>
        <tr>
          <th>REQ #</th>
          <th>Date</th>
          <th>Request From</th>
          <th>ATTN</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let req of filteredRequisitions" class="clickable-row" (click)="viewRequisition(req)">
          <td><code>{{ req.requisition_number || 'N/A' }}</code></td>
          <td>{{ formatDate(req.date) }}</td>
          <td>
            {{ req.request_from || '—' }}
            <div class="approved-by" *ngIf="req.approved_name">
              approved by: {{ req.approved_name }}
            </div>
          </td>
          <td>{{ req.attn || '—' }}</td>
          <td>{{ req.items?.length || 0 }} item(s)</td>
          <td>{{ getTotal(req.items) | number:'1.2-2' }}</td>
          <td>
            <span class="status-badge" [class]="'status-' + (req.status || 'pending')">
              {{ getStatusLabel(req.status) }}
            </span>
            <div class="received-by" *ngIf="req.status === 'approved' && req.items_prepared_name">
              by: {{ req.items_prepared_name }}
            </div>
            <div class="received-by" *ngIf="req.status === 'released' && req.released_name">
              released by: {{ req.released_name }}
            </div>
          </td>
          <td (click)="$event.stopPropagation()">
            <button class="action-btn" *ngIf="canModify(req)" (click)="editRequisition(req)" title="Edit">✏️</button>
            <button class="action-btn" (click)="printRequisition(req)" title="Print">🖨️</button>
            <button class="action-btn delete" *ngIf="canModify(req)" (click)="deleteRequisition(req)" title="Delete">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Empty states for each tab (show instead of table) -->
  <div class="empty-state" *ngIf="requisitions.length > 0 && activeTab === 'pending' && getStatusCount('pending') === 0">
    <div class="empty-icon">✅</div>
    <h3>No Pending Requisitions</h3>
    <p>All your requisitions have been processed. Create a new one!</p>
    <button class="btn-new" routerLink="/client/request/new">➕ Create Requisition</button>
  </div>

  <div class="empty-state" *ngIf="requisitions.length > 0 && activeTab === 'approved' && getStatusCount('approved') === 0">
    <div class="empty-icon">📥</div>
    <h3>No Received Requisitions</h3>
    <p>Your requisitions haven't been received yet.</p>
  </div>

  <div class="empty-state" *ngIf="requisitions.length > 0 && activeTab === 'released' && getStatusCount('released') === 0">
    <div class="empty-icon">📦</div>
    <h3>No Released Requisitions</h3>
    <p>No requisitions have been released yet.</p>
  </div>

  <div class="empty-state" *ngIf="requisitions.length > 0 && activeTab === 'rejected' && getStatusCount('rejected') === 0">
    <div class="empty-icon">❌</div>
    <h3>No Rejected Requisitions</h3>
    <p>No requisitions have been rejected.</p>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
  <div class="confirm-modal" (click)="$event.stopPropagation()">
    <div class="confirm-modal-header confirm-delete">
      <span class="confirm-icon">🗑️</span>
      <h3>Delete Requisition</h3>
    </div>
    <div class="confirm-modal-body">
      <p>Are you sure you want to delete this requisition? This action cannot be undone.</p>
      <div class="confirm-modal-info" *ngIf="deleteTargetReq">
        <div class="confirm-info-row">
          <span class="confirm-label">REQ #:</span>
          <code>{{ deleteTargetReq.requisition_number }}</code>
        </div>
        <div class="confirm-info-row">
          <span class="confirm-label">Prepared By:</span>
          <span>{{ deleteTargetReq.prepared_name || '—' }}</span>
        </div>
        <div class="confirm-info-row">
          <span class="confirm-label">Items:</span>
          <span>{{ deleteTargetReq.items?.length || 0 }} item(s)</span>
        </div>
      </div>
    </div>
    <div class="confirm-modal-footer">
      <button class="btn btn-cancel" (click)="cancelDelete()">Cancel</button>
      <button class="btn btn-confirm btn-delete" (click)="confirmDelete()">🗑️ Delete</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .req-list-container { padding: 16px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; color: #0a246a; font-size: 16px; }
    .btn-new { background: #0a3a8c; color: white; border: 2px solid; border-color: #1c5fb5 #042070 #042070 #1c5fb5; padding: 6px 14px; cursor: pointer; font-size: 10px; border-radius: 3px; text-decoration: none; display: inline-block; }
    .empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 8px; border: 2px dashed #c0c0c0; color: #0f0e0e; }
    .empty-icon { font-size: 48px; }
    .status-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .status-tab { flex: 1; padding: 8px 14px; background: white; border: 1px solid #c0c0c0; cursor: pointer; font-size: 11px; font-weight: 600; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .status-tab.active { background: #0a246a; color: white; border-color: #0a246a; }
    .tab-count { padding: 1px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; background: #e0e0e0; color: #555; }
    .status-tab.active .tab-count { background: rgba(255,255,255,0.3); color: white; }
    .table-container { background: white; border: 1px solid #c0c0c0; overflow-x: auto; border-radius: 4px; }
    .req-table { width: 100%; border-collapse: collapse; }
    .req-table th { background: #f0f4f8; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; }
    .req-table td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; color: #131212; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #f8faff; }
    code { font-family: monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .status-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-rejected { background: #ffecec; color: #cc0000; }
    .status-released { background: #e8f0ff; color: #0066cc; }
    .received-by { font-size: 9px; color: #666; margin-top: 2px; font-style: italic; }
    .approved-by { font-size: 9px; color: #666; margin-top: 2px; font-style: italic; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px; }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-btn.delete:hover { background: #ffecec; border-color: #cc0000; }
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
    .confirm-modal-header.confirm-delete { 
      background: linear-gradient(135deg, #cc4400, #ee6633); 
    }
    .confirm-modal-header h3 { 
      margin: 0; 
      font-size: 16px; 
    }
    .confirm-icon { 
      font-size: 28px; 
    }
    .confirm-modal-body { 
      padding: 24px; 
    }
    .confirm-modal-body p { 
      margin: 0 0 16px 0; 
      font-size: 13px; 
      color: #444; 
      line-height: 1.5; 
    }
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
    .confirm-info-row:last-child { 
      margin-bottom: 0; 
    }
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
    .btn {
      padding: 6px 12px;
      border: 1px solid #c0c0c0;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 10px;
    }
    .btn-cancel {
      background: white;
      color: #555;
      border: 1px solid #ddd;
    }
    .btn-cancel:hover { 
      background: #f0f0f0; 
    }
    .btn-confirm {
      color: white;
      border: none;
      font-weight: 600;
      padding: 8px 16px;
    }
    .btn-confirm.btn-delete { 
      background: #cc4400; 
    }
    .btn-confirm.btn-delete:hover { 
      background: #aa3300; 
    }
  `]
})
export class ClientRequisitionListComponent implements OnInit {
  requisitions: any[] = [];
  activeTab = 'pending';
  loading = false;
  
  // Confirmation modal
  showDeleteModal = false;
  deleteTargetReq: any = null;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private authService: AuthService
  ) {}

  ngOnInit() { 
    this.loadRequisitions();
    
    // Reload when navigating back to this component
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/request') || this.router.url.includes('/requisitions')) {
        this.loadRequisitions();
      }
    });
  }

  loadRequisitions() {
    this.loading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      this.loading = false;
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
      next: (data) => { 
        console.log('📋 Loaded requisitions:', data);
        this.requisitions = Array.isArray(data) ? data : []; 
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load requisitions:', err);
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        this.requisitions = saved;
        this.loading = false;
      }
    });
  }

  get filteredRequisitions(): any[] {
    if (!this.requisitions || this.requisitions.length === 0) return [];
    return this.requisitions.filter(r => (r.status || 'pending') === this.activeTab);
  }

  setActiveTab(tab: string) { 
    this.activeTab = tab; 
  }
  
  getStatusCount(status: string): number { 
    if (!this.requisitions || this.requisitions.length === 0) return 0;
    return this.requisitions.filter(r => (r.status || 'pending') === status).length; 
  }
  
  canModify(req: any): boolean { 
    // Can only modify pending requisitions
    return (req.status || 'pending') === 'pending'; 
  }
  
  getTotal(items: any[]): number { 
    if (!items || items.length === 0) return 0;
    return items.reduce((sum: number, i: any) => {
      const qty = Number(i.qty) || 0;
      const unitPrice = Number(i.unit_price) || 0;
      return sum + (qty * unitPrice);
    }, 0);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Received',
      'released': 'Released',
      'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
  }

  viewRequisition(req: any) {
    // Navigate to view/edit based on ID
    if (req.id) {
      this.router.navigate(['/client/request/edit'], { 
        queryParams: { id: req.id } 
      });
    }
  }

  editRequisition(req: any) {
    console.log('🔧 Editing requisition:', req);
    // Always use the database ID, not the requisition_number
    const id = req.id;
    if (!id) {
      console.error('No ID found for requisition:', req);
      return;
    }
    console.log('🔧 Navigating with ID:', id);
    this.router.navigate(['/client/request/edit'], { 
      queryParams: { id: id } 
    });
  }

  printRequisition(req: any) {
    // Helper to format date for printing
    const fmtDate = (val: any) => {
      if (!val) return '—';
      try { 
        const d = new Date(val); 
        if (isNaN(d.getTime())) return String(val);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
      }
      catch { return String(val); }
    };

    const getTotal = (items: any[]) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((s: number, i: any) => s + ((Number(i.qty)||0)*(Number(i.unit_price)||0)), 0);
    };
    
    const companyName = 'Lee Super Plaza';
    const statusLabel = this.getStatusLabel(req.status);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisition - ${req.requisition_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 8mm; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 9px;
            color: #000;
            padding: 10px;
          }
          .req-print {
            background: white;
            border: 2px solid #000;
            padding: 16px 20px;
            max-width: 750px;
            margin: 0 auto;
          }
          .req-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .req-header .company {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #0a246a;
          }
          .req-header .title {
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 3px;
            margin-top: 4px;
          }
          .req-header .ctrl-no {
            font-size: 8px;
            color: #cc0000;
            font-weight: bold;
            margin-top: 2px;
          }
          .req-header .ref {
            font-size: 8px;
            margin-top: 4px;
            color: #555;
          }
          .status-badge {
            display: inline-block;
            padding: 1px 8px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-pending { background: #fffae8; color: #886600; border: 1px solid #e6d88a; }
          .status-approved { background: #eeffee; color: #008800; border: 1px solid #88cc88; }
          .status-rejected { background: #ffecec; color: #cc0000; border: 1px solid #eeaaaa; }
          .status-released { background: #e8f0ff; color: #0066cc; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 10px; }
          .info-row { display: flex; font-size: 9px; margin-bottom: 4px; }
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
          
          @media print {
            body { padding: 0; margin: 0; }
            .req-print { border: 1px solid #000; }
          }
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
            <div class="info-row"><span class="info-label">Prepared By:</span><span class="info-value">${req.prepared_name || '—'}</span></div>
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

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert('Please allow popups for this site to print requisitions.');
    }
  }

  deleteRequisition(req: any) {
    this.deleteTargetReq = req;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.deleteTargetReq) return;
    
    const req = this.deleteTargetReq;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      this.closeDeleteModal();
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const deleteId = req.id || req.requisition_number;
    
    this.http.delete(`${environment.apiUrl}/api/requisitions/${deleteId}`, { headers }).subscribe({
      next: () => { 
        this.requisitions = this.requisitions.filter(r => r !== req); 
        this.closeDeleteModal();
        this.loadRequisitions(); // Reload to ensure sync
      },
      error: (err) => { 
        console.error('Delete failed:', err);
        // Remove locally even if API fails
        this.requisitions = this.requisitions.filter(r => r !== req); 
        this.closeDeleteModal();
        this.loadRequisitions();
      }
    });
  }

  cancelDelete() {
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteTargetReq = null;
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