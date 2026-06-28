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
        <h2>📩 My Requisitions</h2>
        <button class="classic-btn primary" routerLink="/client/request/new">
          <span>➕</span> New Requisition
        </button>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs-bar">
        <button class="status-tab" [class.active]="activeTab === 'all'" (click)="setActiveTab('all')">
          📋 All <span class="tab-count">{{ requisitions.length }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'pending'" (click)="setActiveTab('pending')">
          ⏳ Pending <span class="tab-count pending-count">{{ getStatusCount('pending') }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'approved'" (click)="setActiveTab('approved')">
          📥 Received <span class="tab-count approved-count">{{ getStatusCount('approved') }}</span>
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
          <label>Request From:</label>
          <select class="classic-select" [(ngModel)]="filters.requestFrom" (change)="applyFilters()">
            <option value="">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="BORROW">Borrow</option>
            <option value="REPAIR">Repair</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Department:</label>
          <select class="classic-select" [(ngModel)]="filters.departmentId" (change)="applyFilters()">
            <option value="">All Departments</option>
            <option *ngFor="let dept of departments" [value]="dept.id">
              {{ dept.displayName || dept.name }}
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
        <span>Showing: <strong>{{ filteredRequisitions.length }}</strong> requisitions</span>
        <span class="status-sep">|</span>
        <span>Status: <strong>{{ activeTab === 'all' ? 'All' : (activeTab | titlecase) }}</strong></span>
        <span class="status-sep">|</span>
        <span>Branch: <strong>{{ userBranch?.name || 'All' }}</strong></span>
      </div>

      <!-- Requisitions Table -->
      <div class="classic-table-container">
        <table class="classic-table">
          <thead>
            <tr>
              <th>REQ #</th>
              <th>Date</th>
              <th>Request From</th>
              <th>Department</th>
              <th>ATTN</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of filteredRequisitions; trackBy: trackByReqId" 
                class="clickable-row" (click)="viewRequisition(req)">
              <td class="req-num">
                <code>{{ req.requisition_number || 'N/A' }}</code>
                <div class="creator-info" *ngIf="isEDPUser() && req.prepared_name">
                  <span class="creator-label">by: {{ req.prepared_name }}</span>
                </div>
              </td>
              <td class="date-cell">{{ formatDate(req.date) }}</td>
              <td>
                <span class="request-type-badge" [class]="'type-' + (req.request_from || '').toLowerCase()">
                  {{ req.request_from || '—' }}
                </span>
              </td>
              <td class="dept-cell">
                <div class="dept-info-small">
                  <span class="dept-name-small">{{ getDepartmentName(req.department_id) }}</span>
                  <span class="branch-tag-tiny" *ngIf="getBranchName(req.branch_id)">
                    🏢 {{ getBranchName(req.branch_id) }}
                  </span>
                </div>
              </td>
              <td>{{ req.attn || '—' }}</td>
              <td class="items-cell">{{ req.items?.length || 0 }} item(s)</td>
              <td class="total-cell">{{ getTotal(req.items) | number:'1.2-2' }}</td>
              <td class="status-cell">
                <span class="status-badge" [class]="'status-' + (req.status || 'pending')">
                  {{ getStatusLabel(req.status) }}
                </span>
                <div class="status-worker" *ngIf="req.status === 'approved' && req.items_prepared_name">
                  <span class="worker-label">Received by: {{ req.items_prepared_name }}</span>
                </div>
                <div class="status-worker" *ngIf="req.status === 'released' && req.released_name">
                  <span class="worker-label">Released by: {{ req.released_name }}</span>
                </div>
                <div class="status-worker" *ngIf="req.approved_name && req.status === 'approved'">
                  <span class="worker-label">Approved by: {{ req.approved_name }}</span>
                </div>
              </td>
              <td class="action-cell" (click)="$event.stopPropagation()">
                <button class="action-btn edit-btn" *ngIf="canModify(req)" (click)="editRequisition(req)" title="Edit">✏️</button>
                <button class="action-btn print-btn" (click)="printRequisition(req)" title="Print">🖨️</button>
                <button class="action-btn view-btn" (click)="viewRequisition(req)" title="View">📋</button>
                <button class="action-btn delete-btn" *ngIf="canModify(req)" (click)="deleteRequisition(req)" title="Delete">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="filteredRequisitions.length === 0">
              <td colspan="9" class="empty-row">
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
  `,
  styles: [`
    .req-list-container {
      padding: 10px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
    }

    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0a246a;
    }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }

    .classic-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      border-radius: 3px;
      padding: 5px 14px;
      cursor: pointer;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #000;
    }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.primary:hover { background: #1a3a8a; }
    .classic-btn.danger { background: #cc0000; color: white; border-color: #cc0000; }
    .classic-btn.danger:hover { background: #aa0000; }

    .status-tabs-bar {
      display: flex; gap: 2px; padding: 4px 6px;
      background: #e8e8e8; border: 1px solid #a0a0a0; margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .status-tab {
      background: #d4d0c8; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px 2px 0 0; padding: 5px 12px;
      cursor: pointer; font-size: 10px; color: #333;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .status-tab.active .tab-count { background: #0a3a8c; }
    .tab-count.pending-count { background: #cc6600; }
    .tab-count.approved-count { background: #008800; }
    .tab-count.released-count { background: #0066cc; }
    .tab-count.rejected-count { background: #cc0000; }

    .filter-bar {
      background: #f0f0f0; border: 1px solid #a0a0a0; padding: 6px 10px;
      display: flex; gap: 12px; align-items: center; margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 10px; font-weight: bold; color: #000; }
    .classic-select, .classic-input { padding: 3px 6px; border: 1px solid #a0a0a0; font-size: 10px; background: white; }
    .search-group .classic-input { width: 160px; }

    .classic-status-bar {
      background: #f0f0f0; border: 1px solid #a0a0a0; border-top: none;
      padding: 3px 10px; font-size: 10px; color: #333;
      display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
    }
    .status-sep { color: #b0b0b0; }

    .classic-table-container { border: 1px solid #a0a0a0; background: white; overflow-x: auto; }
    .classic-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .classic-table th {
      background: #0a246a; color: white; padding: 6px 8px; text-align: center;
      font-weight: bold; font-size: 10px; border-right: 1px solid rgba(255,255,255,0.2);
      white-space: nowrap;
    }
    .classic-table th:last-child { border-right: none; }
    .classic-table td { padding: 7px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; color: #000; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #e8f0fe; }

    .req-num { font-family: monospace; color: #0a3a8c; font-weight: bold; font-size: 11px; }
    .date-cell { font-family: monospace; font-size: 10px; white-space: nowrap; color: #555; }
    .items-cell { font-weight: 500; }
    .total-cell { font-weight: bold; color: #0a3a8c; font-family: monospace; }

    .request-type-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .type-purchase { background: #cde8f5; color: #0066cc; }
    .type-borrow { background: #fff0cc; color: #cc6600; }
    .type-repair { background: #f0ccf0; color: #880088; }

    .dept-cell { max-width: 130px; }
    .dept-info-small { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .dept-name-small { font-weight: 600; font-size: 10px; color: #0a3a8c; }
    .branch-tag-tiny {
      font-size: 8px;
      background: #f0f4ff;
      color: #0a3a8c;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #b8c8e8;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 9px;
      text-transform: uppercase;
    }
    .status-pending { background: #fffae8; color: #886600; }
    .status-approved { background: #eeffee; color: #008800; }
    .status-released { background: #e8f0ff; color: #0066cc; }
    .status-rejected { background: #ffecec; color: #cc0000; }

    .status-worker { margin-top: 2px; }
    .worker-label { 
      font-size: 9px; 
      color: #666; 
      display: block; 
      font-style: italic;
    }

    .creator-info {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
      border-top: 1px dotted #ddd;
      padding-top: 2px;
    }
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

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); min-width: 420px; max-width: 500px; }
    .modal-titlebar { background: #0a246a; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; }
    .modal-titlebar.danger { background: #cc0000; }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    .modal-body { padding: 16px; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 36px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-message strong { color: #0a3a8c; font-family: monospace; }
    .resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; padding: 4px 8px; background: #f5f5f5; border-radius: 2px; border-left: 3px solid #ccc; word-break: break-word; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; line-height: 1.4; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  `]
})
export class ClientRequisitionListComponent implements OnInit, OnDestroy {
  requisitions: any[] = [];
  filteredRequisitions: any[] = [];
  activeTab = 'all';
  searchTerm = '';
  filters = {
    requestFrom: '',
    departmentId: ''
  };
  
  currentUser: any;
  userBranch: any = null;
  branches: any[] = [];
  departments: any[] = [];
  
  loading = false;
  showDeleteConfirm = false;
  reqToDelete: any = null;
  
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
      console.log('👤 Current user:', user?.fullname, '| branch:', user?.branch_id, '| dept:', user?.department);
    });
    
    this.loadBranchesAndDepartments();
    this.loadRequisitions();
    
    // Reload when navigating back to this component
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/request') || this.router.url.includes('/requisitions')) {
        this.loadRequisitions();
      }
    });

    // Poll every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.loadRequisitions();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  trackByReqId(index: number, req: any): number {
    return req.id;
  }

  loadBranchesAndDepartments() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.branches = branches || [];
        const user: any = this.authService.getCurrentUser();
        this.userBranch = this.branches.find(b => b.id == user?.branch_id);
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
      next: (depts) => {
        this.departments = (depts || []).map(d => {
          const branch = this.branches.find(b => b.id == d.branch_id);
          return {
            ...d,
            displayName: `${d.name} — ${branch?.name || 'Unknown'}`
          };
        });
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
    const user: any = this.authService.getCurrentUser();
    
    // Build query params based on user role and branch
    let url = `${environment.apiUrl}/api/requisitions/my`;
    
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => { 
        console.log('📋 Loaded requisitions:', data?.length || 0);
        this.requisitions = Array.isArray(data) ? data : [];
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

  setActiveTab(tab: string) { 
    this.activeTab = tab; 
    this.applyFilters(); 
  }

  applyFilters() {
    let filtered = [...this.requisitions];
    
    // Filter by status tab
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => (r.status || 'pending') === this.activeTab);
    }
    
    // Filter by request type
    if (this.filters.requestFrom) {
      filtered = filtered.filter(r => r.request_from === this.filters.requestFrom);
    }
    
    // Filter by department
    if (this.filters.departmentId) {
      filtered = filtered.filter(r => r.department_id == this.filters.departmentId);
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
    this.filters = { requestFrom: '', departmentId: '' }; 
    this.searchTerm = ''; 
    this.applyFilters(); 
  }

  getStatusCount(status: string): number { 
    if (!this.requisitions || this.requisitions.length === 0) return 0;
    return this.requisitions.filter(r => (r.status || 'pending') === status).length; 
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

  getTotal(items: any[]): number { 
    if (!items || items.length === 0) return 0;
    return items.reduce((sum: number, i: any) => {
      const qty = Number(i.qty) || 0;
      const unitPrice = Number(i.unit_price) || 0;
      return sum + (qty * unitPrice);
    }, 0);
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
    return dept === 'edp' || dept === 'it' || dept === 'edp/it' || 
           dept.includes('edp') || dept.includes('it');
  }

  canModify(req: any): boolean { 
    // Can only modify pending requisitions
    const isPending = (req.status || 'pending') === 'pending';
    
    // EDP users with head/manager or supervisor role can modify any pending
    if (this.isEDPUser() && this.isHeadOrSupervisor()) {
      return isPending;
    }
    
    // Regular users can only modify their own pending requisitions
    if (req.submitted_by === this.currentUser?.id) {
      return isPending;
    }
    
    return false;
  }

  isHeadOrSupervisor(): boolean {
    if (!this.currentUser) return false;
    const role = (this.currentUser.role || '').toLowerCase();
    return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
  }

  viewRequisition(req: any) {
    if (req.id) {
      this.router.navigate(['/client/request/edit'], { 
        queryParams: { id: req.id } 
      });
    }
  }

  editRequisition(req: any) {
    const id = req.id;
    if (!id) {
      console.error('No ID found for requisition:', req);
      return;
    }
    this.router.navigate(['/client/request/edit'], { 
      queryParams: { id: id } 
    });
  }

  printRequisition(req: any) {
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
    
    const companyName = this.userBranch?.company_name || this.userBranch?.name || 'Lee Super Plaza';
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
            <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${this.getDepartmentName(req.department_id)}</span></div>
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
    this.reqToDelete = req;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.reqToDelete) return;
    
    const req = this.reqToDelete;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      this.cancelDelete();
      return;
    }
    
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