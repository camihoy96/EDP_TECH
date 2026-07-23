import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>📋 System Logs</h2>
          <span class="header-sub">Monitor system activity and security events</span>
        </div>
        <div class="header-stats">
          <span class="stat-chip info">ℹ️ {{ getLevelCount('INFO') }}</span>
          <span class="stat-chip warning">⚠️ {{ getLevelCount('WARNING') }}</span>
          <span class="stat-chip error">❌ {{ getLevelCount('ERROR') }}</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Level:</label>
          <select [(ngModel)]="logLevel" (change)="applyFilters()" class="filter-select">
            <option value="all">All Levels</option>
            <option value="INFO">ℹ️ Info</option>
            <option value="WARNING">⚠️ Warning</option>
            <option value="ERROR">❌ Error</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type:</label>
          <select [(ngModel)]="logType" (change)="applyFilters()" class="filter-select">
          <option value="all">All Types</option>
          <option value="auth">🔐 Auth</option>
          <option value="ticket">🎫 Ticket</option>
          <option value="job_order">📋 Job Order</option>
          <option value="requisition">📩 Requisition</option>
          <option value="user">👤 User</option>
          <option value="system">⚙️ System</option>
          <option value="database">🗄️ Database</option>
      </select>

        </div>
        <div class="filter-group">
          <label>Date:</label>
          <select [(ngModel)]="dateFilter" (change)="applyFilters()" class="filter-select">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div class="filter-group search-group">
          <label>Search:</label>
          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
                 class="filter-input" placeholder="Search logs...">
          <button *ngIf="searchTerm" class="clear-search" (click)="searchTerm=''; applyFilters()">✕</button>
        </div>
        <div class="filter-actions">
          <button class="btn" (click)="refreshLogs()" [disabled]="isLoading" title="Refresh">
            {{ isLoading ? '⏳' : '🔄' }}
          </button>
          <button class="btn btn-export" (click)="exportLogs()" [disabled]="isLoading || filteredLogs.length === 0" title="Export to CSV">
            📥 Export
          </button>
          <button class="btn btn-danger" (click)="showClearConfirm()" [disabled]="isLoading || logs.length === 0" title="Clear All Logs">
            🗑️ Clear
          </button>
        </div>
        <span class="count-badge">{{ filteredLogs.length }} of {{ logs.length }} entries</span>
      </div>

      <!-- Auto-refresh Toggle -->
      <div class="auto-refresh-bar">
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
          <span>Auto-refresh every 30 seconds</span>
        </label>
        <span class="last-refresh" *ngIf="lastRefresh">Last refreshed: {{ lastRefresh | date:'medium' }}</span>
      </div>

      <!-- Loading State -->
      <div class="loading-bar" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Loading logs...</span>
      </div>

      <!-- Logs Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th style="width:150px;">Date/Time</th>
              <th style="width:80px;">Level</th>
              <th style="width:80px;">Type</th>
              <th style="width:120px;">User</th>
              <th>Action</th>
              <th style="width:120px;">IP Address</th>
              <th style="width:60px;">Details</th>
            </tr>
          </thead>
        <tbody>
  <ng-container *ngFor="let log of paginatedLogs; let i = index; trackBy: trackById">
    <tr [class]="'log-' + log.level?.toLowerCase()"
        (click)="toggleLogDetails(log)"
        class="clickable-row">
      <td class="row-num">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
      <td class="date-cell">
        <div>{{ log.created_at | date:'MMM d, yyyy' }}</div>
        <div class="time">{{ log.created_at | date:'h:mm:ss a' }}</div>
      </td>
      <td><span class="log-badge" [class]="'level-' + log.level?.toLowerCase()">{{ log.level }}</span></td>
      <td><span class="type-badge">{{ getTypeIcon(log.type) }} {{ log.type | titlecase }}</span></td>
      <td>
        <div class="user-cell">
          <span class="user-name">{{ log.user_name || 'System' }}</span>
          <span class="user-role" *ngIf="log.user_role">({{ log.user_role }})</span>
        </div>
      </td>
      <td class="action-cell">{{ log.action }}</td>
      <td><code>{{ log.ip_address || '—' }}</code></td>
      <td>
        <button class="detail-btn" (click)="$event.stopPropagation(); toggleLogDetails(log)" title="View Details">
          {{ expandedLogId === log.id ? '▲' : '▼' }}
        </button>
      </td>
    </tr>
    <!-- ✅ Moved INSIDE the ng-container so 'log' is accessible -->
    <tr *ngIf="expandedLogId === log.id" class="detail-row">
  <td colspan="8">
    <div class="log-details">
      <div class="detail-grid">
        <div class="detail-item">
          <label>Log ID:</label>
          <span>{{ log.id }}</span>
        </div>
        <div class="detail-item">
          <label>Username:</label>
          <span>{{ log.user_name || 'System' }}</span>
        </div>
        <div class="detail-item">
          <label>User ID:</label>
          <span>{{ log.user_id || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <label>User Table:</label>
          <span>{{ log.user_table || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <label>IP Address:</label>
          <span>{{ log.ip_address || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <label>Full Timestamp:</label>
          <span>{{ log.created_at }}</span>
        </div>
        <div class="detail-item full-width" *ngIf="log.details">
          <label>Additional Details:</label>
          <pre>{{ log.details | json }}</pre>
        </div>
      </div>
    </div>
  </td>
</tr>
  </ng-container>
  <!-- Empty State -->
  <tr *ngIf="filteredLogs.length === 0 && !isLoading">
    <td colspan="8" class="empty-row">
      <span class="empty-icon">📭</span>
      <p>No logs found</p>
      <button class="btn" (click)="clearFilters()">Clear Filters</button>
    </td>
  </tr>
</tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar" *ngIf="totalPages > 1">
        <button class="page-btn" (click)="goToPage(1)" [disabled]="currentPage === 1">« First</button>
        <button class="page-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">◀ Prev</button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="page-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">Next ▶</button>
        <button class="page-btn" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">Last »</button>
        <select class="page-size-select" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
          <option [value]="25">25 per page</option>
          <option [value]="50">50 per page</option>
          <option [value]="100">100 per page</option>
        </select>
      </div>

      <!-- Clear Confirmation Dialog -->
      <div class="confirm-overlay" *ngIf="showConfirmDialog" (click)="cancelClear()">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <div class="confirm-icon">⚠️</div>
          <h3>Clear All System Logs?</h3>
          <p>This action cannot be undone. All <strong>{{ logs.length }}</strong> log entries will be permanently deleted.</p>
          <p class="confirm-note">Consider exporting logs before clearing.</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" (click)="cancelClear()" [disabled]="isClearing">Cancel</button>
            <button class="confirm-btn export" (click)="exportAndClear()" [disabled]="isClearing">📥 Export & Clear</button>
            <button class="confirm-btn confirm" (click)="confirmClear()" [disabled]="isClearing">
              {{ isClearing ? 'Clearing...' : '🗑️ Clear All' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span class="toast-icon">{{ toastType === 'success' ? '✅' : '❌' }}</span>
        <span>{{ toastMessage }}</span>
        <button class="toast-close" (click)="showToast = false">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .logs-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0 0 2px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }
    
    .header-stats { display: flex; gap: 8px; }
    .stat-chip { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .stat-chip.info { background: #e8f0ff; color: #0066cc; }
    .stat-chip.warning { background: #fffae8; color: #886600; }
    .stat-chip.error { background: #ffecec; color: #cc0000; }
    
    .filter-bar { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; padding: 10px 14px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; flex-wrap: wrap; }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 9px; font-weight: 600; color: #888; text-transform: uppercase; white-space: nowrap; }
    .filter-input { padding: 5px 28px 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; width: 160px; }
    .filter-select { padding: 5px 8px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; background: white; }
    .search-group { position: relative; }
    .clear-search { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #888; font-size: 12px; padding: 2px 4px; }
    .clear-search:hover { color: #333; }
    .filter-actions { display: flex; gap: 4px; }
    .btn { padding: 5px 10px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; white-space: nowrap; transition: all 0.15s; }
    .btn:hover:not(:disabled) { background: #f0f0f0; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-export { color: #0066cc; border-color: #0066cc; }
    .btn-export:hover:not(:disabled) { background: #e8f0ff; }
    .btn-danger { background: #fff5f5; color: #cc0000; border-color: #cc0000; }
    .btn-danger:hover:not(:disabled) { background: #cc0000; color: white; }
    .count-badge { margin-left: auto; color: #888; font-size: 10px; white-space: nowrap; font-weight: 600; }
    
    .auto-refresh-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; font-size: 10px; color: #888; }
    .toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .toggle-label input[type="checkbox"] { cursor: pointer; }
    .last-refresh { font-style: italic; }
    
    .loading-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #f0f4ff; border: 1px solid #c0d0f0; border-radius: 4px; margin-bottom: 8px; font-size: 11px; color: #0a246a; }
    .spinner { width: 16px; height: 16px; border: 2px solid #c0d0f0; border-top-color: #0a246a; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .table-container { background: white; border: 1px solid #c0c0c0; border-radius: 6px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; white-space: nowrap; }
    .data-table td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; font-size: 11px; color: #333; }
    .clickable-row { cursor: pointer; transition: background 0.1s; }
    .clickable-row:hover { background: #f8faff; }
    .log-info { background: #fcfdff; }
    .log-warning { background: #fffef8; }
    .log-error { background: #fffafa; }
    
    .row-num { color: #aaa; font-size: 10px; text-align: center; }
    .date-cell { white-space: nowrap; }
    .date-cell .time { color: #888; font-size: 10px; }
    
    .log-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .level-info { background: #e8f0ff; color: #0066cc; }
    .level-warning { background: #fffae8; color: #886600; }
    .level-error { background: #ffecec; color: #cc0000; }
    
    .type-badge { font-size: 10px; }
    .user-cell { display: flex; flex-direction: column; }
    .user-name { font-weight: 500; }
    .user-role { font-size: 9px; color: #888; }
    .action-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    code { font-family: 'Courier New', monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; color: #0a246a; }
    
    .detail-btn { background: none; border: 1px solid #d0d0d0; border-radius: 3px; cursor: pointer; padding: 2px 6px; font-size: 10px; color: #888; }
    .detail-btn:hover { background: #f0f0f0; color: #333; }
    
    .detail-row td { padding: 0; background: #f8fafc; border-bottom: 2px solid #d0d0d0; }
    .log-details { padding: 12px 16px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item label { font-size: 9px; font-weight: 600; color: #888; text-transform: uppercase; }
    .detail-item span { font-size: 11px; color: #333; }
    .detail-item pre { margin: 0; font-size: 10px; background: #f0f0f0; padding: 8px; border-radius: 4px; max-height: 200px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
    
    .empty-row { text-align: center; padding: 40px; color: #888; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
    .empty-row p { margin: 0 0 12px 0; font-size: 12px; }
    
    .pagination-bar { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 10px; background: white; border: 1px solid #c0c0c0; border-top: none; border-radius: 0 0 6px 6px; }
    .page-btn { padding: 4px 10px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 3px; font-size: 10px; }
    .page-btn:hover:not(:disabled) { background: #f0f0f0; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 11px; color: #555; font-weight: 600; }
    .page-size-select { padding: 4px 6px; border: 1px solid #c0c0c0; border-radius: 3px; font-size: 10px; margin-left: 12px; }
    
    .confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .confirm-dialog { background: white; border-radius: 12px; padding: 28px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .confirm-icon { font-size: 48px; margin-bottom: 12px; }
    .confirm-dialog h3 { margin: 0 0 8px 0; font-size: 16px; color: #333; }
    .confirm-dialog p { margin: 0 0 8px 0; font-size: 12px; color: #666; line-height: 1.5; }
    .confirm-note { font-style: italic; color: #888 !important; }
    .confirm-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .confirm-btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; }
    .confirm-btn.export { background: #e8f0ff; color: #0066cc; }
    .confirm-btn.confirm { background: #cc0000; color: white; }
    
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; display: flex; align-items: center; gap: 8px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 4000; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .toast-icon { font-size: 14px; }
    .toast-close { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-left: 8px; }
  `]
})
export class SystemLogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  filteredLogs: any[] = [];
  paginatedLogs: any[] = [];
  logLevel = 'all';
  logType = 'all';
  dateFilter = 'all';
  searchTerm = '';
  isLoading = false;
  isClearing = false;
  showConfirmDialog = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  autoRefresh = false;
  lastRefresh: Date | null = null;
  expandedLogId: number | null = null;
  currentPage = 1;
  pageSize = 50;
  totalPages = 0;
  private toastTimer: any;
  private refreshSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadLogs(); }

  ngOnDestroy() {
    if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  trackById(index: number, log: any): number { return log.id || index; }

  getLevelCount(level: string): number {
    return this.logs.filter(l => l.level === level).length;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      auth: '🔐', login: '🔐', logout: '🚪',
      ticket: '🎫', job_order: '📋', requisition: '📩',
      system: '⚙️', database: '🗄️',
      user: '👤', error: '❌', security: '🛡️'
    };
    return icons[type?.toLowerCase()] || '📋';
}
  loadLogs() {
    this.isLoading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/logs`, { headers }).subscribe({
      next: (data) => { 
        this.logs = Array.isArray(data) ? data : []; 
        this.applyFilters();
        this.lastRefresh = new Date();
        this.isLoading = false;
      },
      error: () => {
        this.showToastMsg('Failed to load logs', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.logs];

    // Level filter
    if (this.logLevel !== 'all') {
      filtered = filtered.filter(l => l.level === this.logLevel);
    }

    // Type filter
    if (this.logType !== 'all') {
      filtered = filtered.filter(l => l.type?.toLowerCase() === this.logType.toLowerCase());
    }

    // Date filter
    if (this.dateFilter !== 'all') {
      const now = new Date();
      let fromDate: Date;
      switch (this.dateFilter) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'week':
          fromDate = new Date(now);
          fromDate.setDate(now.getDate() - now.getDay());
          fromDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          fromDate = new Date(0);
      }
      filtered = filtered.filter(l => new Date(l.created_at) >= fromDate);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.action?.toLowerCase().includes(term) || 
        l.user_name?.toLowerCase().includes(term) ||
        l.ip_address?.toLowerCase().includes(term) ||
        l.type?.toLowerCase().includes(term) ||
        l.level?.toLowerCase().includes(term)
      );
    }

    this.filteredLogs = filtered;
    this.totalPages = Math.ceil(this.filteredLogs.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
    this.updatePaginatedLogs();
  }

  updatePaginatedLogs() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedLogs();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleLogDetails(log: any) {
    this.expandedLogId = this.expandedLogId === log.id ? null : log.id;
  }

  clearFilters() {
    this.logLevel = 'all';
    this.logType = 'all';
    this.dateFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  toggleAutoRefresh() {
    if (this.autoRefresh) {
      this.refreshSubscription = interval(30000).subscribe(() => this.loadLogs());
    } else {
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
        this.refreshSubscription = null;
      }
    }
  }

  refreshLogs() { this.loadLogs(); }

  exportLogs() {
    if (this.filteredLogs.length === 0) return;
    
    const headers = ['ID', 'Date/Time', 'Level', 'Type', 'User', 'Action', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...this.filteredLogs.map(l => [
        l.id,
        `"${l.created_at}"`,
        l.level,
        l.type,
        `"${l.user_name || 'System'}"`,
        `"${l.action?.replace(/"/g, '""') || ''}"`,
        l.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToastMsg('Logs exported successfully!', 'success');
  }

  showClearConfirm() {
    if (this.logs.length === 0) {
      this.showToastMsg('No logs to clear', 'error');
      return;
    }
    this.showConfirmDialog = true;
  }

  cancelClear() {
    this.showConfirmDialog = false;
  }

  exportAndClear() {
    this.exportLogs();
    this.confirmClear();
  }

  confirmClear() {
    this.isClearing = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.delete(`${environment.apiUrl}/api/admin/logs`, { headers }).subscribe({
      next: () => { 
        this.logs = []; 
        this.filteredLogs = [];
        this.paginatedLogs = [];
        this.isClearing = false;
        this.showConfirmDialog = false;
        this.showToastMsg('✅ All logs cleared successfully!', 'success'); 
      },
      error: () => {
        this.isClearing = false;
        this.showConfirmDialog = false;
        this.showToastMsg('Failed to clear logs', 'error');
      }
    });
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}