import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-container">
      <div class="page-header">
        <h2>📋 System Logs</h2>
        <span class="header-sub">View system activity and event logs</span>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="logLevel" (change)="applyFilters()" class="filter-select">
          <option value="all">All Levels</option>
          <option value="INFO">ℹ️ Info</option>
          <option value="WARNING">⚠️ Warning</option>
          <option value="ERROR">❌ Error</option>
        </select>
        <select [(ngModel)]="logType" (change)="applyFilters()" class="filter-select">
          <option value="all">All Types</option>
          <option value="login">Login</option>
          <option value="ticket">Ticket</option>
          <option value="system">System</option>
          <option value="database">Database</option>
        </select>
        <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" class="filter-input" placeholder="Search logs...">
        <button class="btn" (click)="refreshLogs()" [disabled]="isLoading">🔄 Refresh</button>
        <button class="btn btn-danger" (click)="showClearConfirm()" [disabled]="isLoading || logs.length === 0">🗑️ Clear Logs</button>
        <span class="count-badge">{{ filteredLogs.length }} entries</span>
      </div>

      <!-- Loading State -->
      <div class="loading-bar" *ngIf="isLoading">
        <div class="loading-progress"></div>
        <span>Loading logs...</span>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Date/Time</th><th>Level</th><th>Type</th><th>User</th><th>Action</th><th>IP Address</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of filteredLogs; trackBy: trackById" [class]="'log-' + log.level?.toLowerCase()">
              <td>{{ log.created_at | date:'MMM d, yyyy h:mm:ss a' }}</td>
              <td><span class="log-badge" [class]="'level-' + log.level?.toLowerCase()">{{ log.level }}</span></td>
              <td>{{ log.type }}</td>
              <td>{{ log.user_name || 'System' }}</td>
              <td>{{ log.action }}</td>
              <td><code>{{ log.ip_address || '—' }}</code></td>
            </tr>
            <tr *ngIf="filteredLogs.length === 0 && !isLoading">
              <td colspan="6" class="empty-row">
                <span class="empty-icon">📭</span>
                <p>No logs found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Confirmation Dialog -->
      <div class="confirm-overlay" *ngIf="showConfirmDialog" (click)="cancelClear()">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <div class="confirm-icon">⚠️</div>
          <h3>Clear All System Logs?</h3>
          <p>This action cannot be undone. All {{ logs.length }} log entries will be permanently deleted.</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" (click)="cancelClear()" [disabled]="isClearing">Cancel</button>
            <button class="confirm-btn confirm" (click)="confirmClear()" [disabled]="isClearing">
              {{ isClearing ? 'Clearing...' : '🗑️ Clear All Logs' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .logs-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0 0 2px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }
    
    .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; padding: 10px 14px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; flex-wrap: wrap; }
    .filter-input { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; width: 180px; }
    .filter-select { padding: 5px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; }
    .btn { padding: 6px 12px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 10px; white-space: nowrap; }
    .btn:hover:not(:disabled) { background: #f0f0f0; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger { background: #cc0000; color: white; border-color: #aa0000; }
    .btn-danger:hover:not(:disabled) { background: #aa0000; }
    .count-badge { margin-left: auto; color: #888; font-size: 11px; white-space: nowrap; }
    
    /* Loading */
    .loading-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #f0f4ff; border: 1px solid #c0d0f0; border-radius: 4px; margin-bottom: 12px; font-size: 11px; color: #0a246a; }
    .loading-progress { width: 16px; height: 16px; border: 2px solid #c0d0f0; border-top-color: #0a246a; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .table-container { background: white; border: 1px solid #c0c0c0; border-radius: 6px; overflow-x: auto; max-height: calc(100vh - 280px); overflow-y: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; position: sticky; top: 0; z-index: 5; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; }
    .log-info { background: #f8faff; }
    .log-warning { background: #fffdf0; }
    .log-error { background: #fff5f5; }
    .log-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; }
    .level-info { background: #e8f0ff; color: #0066cc; }
    .level-warning { background: #fffae8; color: #886600; }
    .level-error { background: #ffecec; color: #cc0000; }
    code { font-family: monospace; font-size: 10px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .empty-row { text-align: center; padding: 40px; color: #888; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
    .empty-row p { margin: 0; font-size: 12px; }
    
    /* Confirmation Dialog */
    .confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; animation: fadeIn 0.2s ease; }
    .confirm-dialog { background: white; border-radius: 12px; padding: 28px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease; }
    .confirm-icon { font-size: 48px; margin-bottom: 12px; }
    .confirm-dialog h3 { margin: 0 0 8px 0; font-size: 16px; color: #333; }
    .confirm-dialog p { margin: 0 0 20px 0; font-size: 12px; color: #666; line-height: 1.5; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; }
    .confirm-btn { padding: 8px 20px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; }
    .confirm-btn.cancel:hover:not(:disabled) { background: #e0e0e0; }
    .confirm-btn.confirm { background: #cc0000; color: white; }
    .confirm-btn.confirm:hover:not(:disabled) { background: #aa0000; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    
    /* Toast */
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 4000; font-size: 11px; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
  `]
})
export class SystemLogsComponent implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  logLevel = 'all';
  logType = 'all';
  searchTerm = '';
  isLoading = false;
  isClearing = false;
  showConfirmDialog = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadLogs(); }

  trackById(index: number, log: any): number { return log.id || index; }

  loadLogs() {
    this.isLoading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/logs`, { headers }).subscribe({
      next: (data) => { 
        this.logs = Array.isArray(data) ? data : []; 
        this.applyFilters(); 
        this.isLoading = false;
      },
      error: () => {
        this.showToastMsg('Failed to load logs', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = this.logs;
    if (this.logLevel !== 'all') {
      filtered = filtered.filter(l => l.level === this.logLevel);
    }
    if (this.logType !== 'all') {
      filtered = filtered.filter(l => l.type === this.logType);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.action?.toLowerCase().includes(term) || 
        l.user_name?.toLowerCase().includes(term) ||
        l.ip_address?.toLowerCase().includes(term)
      );
    }
    this.filteredLogs = filtered;
  }

  refreshLogs() { this.loadLogs(); }

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

  confirmClear() {
    this.isClearing = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.delete(`${environment.apiUrl}/api/admin/logs`, { headers }).subscribe({
      next: () => { 
        this.logs = []; 
        this.filteredLogs = []; 
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