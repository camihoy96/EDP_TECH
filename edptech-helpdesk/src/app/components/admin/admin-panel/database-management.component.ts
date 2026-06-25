import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment'; // ✅ ADD THIS IMPORT

@Component({
  selector: 'app-database-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- AUTH GATE - Show login form if not authenticated -->
    <div class="auth-gate" *ngIf="!isAuthenticated">
      <div class="auth-card">
        <div class="auth-icon">🔐</div>
        <h2>Database Access Verification</h2>
        <p class="auth-sub">This area contains sensitive database operations. Please verify your identity to continue.</p>
        
        <div class="auth-user-info" *ngIf="currentUser">
          <div class="user-avatar" [style.background]="currentUser.avatar_color || '#0a246a'">
            {{ currentUser.fullname?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="user-details">
            <strong>{{ currentUser.fullname }}</strong>
            <span>{{ currentUser.role | uppercase }} · {{ currentUser.department }}</span>
          </div>
        </div>

        <div class="auth-form">
          <div class="input-group">
            <label>Enter your password to continue</label>
            <input 
              type="password" 
              [(ngModel)]="authPassword" 
              (keyup.enter)="verifyAccess()"
              class="auth-input" 
              placeholder="••••••••">
          </div>
          
          <div class="auth-error" *ngIf="authError">
            <span>❌ {{ authError }}</span>
          </div>

          <button class="auth-btn" (click)="verifyAccess()" [disabled]="isVerifying || !authPassword">
            {{ isVerifying ? 'Verifying...' : '🔓 Verify & Access' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DATABASE MANAGEMENT (only shown when authenticated) -->
    <div class="db-container" *ngIf="isAuthenticated">
      <div class="page-header">
        <h2>🗄️ Database Management</h2>
        <span class="header-sub">Manage and monitor the system database</span>
        <button class="lock-btn" (click)="lockAccess()" title="Lock access">🔒 Lock</button>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-item"><span class="stat-label">Tables</span><span class="stat-value">{{ dbInfo.tables || 0 }}</span></div>
        <div class="stat-item"><span class="stat-label">Size</span><span class="stat-value">{{ dbInfo.size || '—' }}</span></div>
        <div class="stat-item"><span class="stat-label">Rows</span><span class="stat-value">{{ dbInfo.totalRows || 0 }}</span></div>
        <div class="stat-item online"><span class="stat-label">Status</span><span class="stat-value">{{ dbConnected ? 'Online' : 'Offline' }}</span></div>
      </div>

      <!-- Quick Access to phpMyAdmin -->
      <div class="settings-card">
        <h3>🔗 Quick Access - phpMyAdmin</h3>
        <p class="phpmyadmin-note">⚠️ phpMyAdmin will open in a new tab for security reasons. Always exercise caution when making direct database changes.</p>
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="openPhpMyAdmin('structure')">
            🗄️ Database Structure
          </button>
          <button class="btn btn-secondary" (click)="openPhpMyAdmin('sql')">
            📝 SQL Query
          </button>
          <button class="btn btn-secondary" (click)="exportDatabase()" [disabled]="isProcessing">
            {{ isProcessing ? '⏳ Exporting...' : '💾 Export Database' }}
          </button>
          <button class="btn btn-secondary" (click)="openPhpMyAdmin('import')">
            📥 Import Database
          </button>
        </div>
      </div>

      <!-- Table Links to phpMyAdmin -->
      <div class="settings-card">
        <h3>📊 Database Tables</h3>
        <div class="table-links">
          <a *ngFor="let table of phpMyAdminTables" 
             [href]="'http://localhost:8080/phpmyadmin/index.php?route=/table/sql&db=edptech_helpdesk&table=' + table.name" 
             target="_blank" 
             class="table-link-item">
            <span class="table-icon">📋</span>
            <span class="table-name">{{ table.name }}</span>
            <span class="table-rows">{{ table.rows }} rows</span>
            <span class="table-size">{{ table.size }}</span>
          </a>
        </div>
      </div>

      <!-- Table List with Actions -->
      <div class="settings-card">
        <h3>🔧 Table Maintenance</h3>
        <table class="data-table">
          <thead>
            <tr><th>Table Name</th><th>Rows</th><th>Size</th><th>Engine</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let table of tables">
              <td><strong>{{ table.name }}</strong></td>
              <td>{{ table.rows | number }}</td>
              <td>{{ table.size }}</td>
              <td>{{ table.engine }}</td>
              <td>
                <button class="action-btn" (click)="optimizeTable(table.name)" title="Optimize">⚡</button>
                <button class="action-btn" (click)="repairTable(table.name)" title="Repair">🔧</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Toast -->
      <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span>{{ toastMessage }}</span>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div class="confirm-overlay" *ngIf="showConfirmDialog" (click)="cancelAction()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-icon">⚙️</div>
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel" (click)="cancelAction()" [disabled]="isProcessing">Cancel</button>
          <button class="confirm-btn confirm" (click)="executeConfirmAction()" [disabled]="isProcessing">
            {{ isProcessing ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Auth Gate */
    .auth-gate {
      display: flex; align-items: center; justify-content: center;
      min-height: calc(100vh - 110px);
      padding: 20px;
      background: #f5f5f5;
    }
    .auth-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 12px;
      padding: 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .auth-icon { font-size: 48px; margin-bottom: 12px; }
    .auth-card h2 { margin: 0 0 6px 0; color: #0a246a; font-size: 18px; }
    .auth-sub { color: #666; font-size: 12px; margin: 0 0 20px 0; line-height: 1.5; }
    .auth-user-info {
      display: flex; align-items: center; gap: 12px;
      padding: 14px; background: #f0f4ff;
      border-radius: 8px; margin-bottom: 20px; text-align: left;
    }
    .user-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 16px; flex-shrink: 0;
    }
    .user-details strong { display: block; font-size: 13px; color: #333; }
    .user-details span { font-size: 10px; color: #888; }
    .input-group { text-align: left; margin-bottom: 14px; }
    .input-group label { display: block; font-size: 11px; color: #555; margin-bottom: 6px; font-weight: 600; }
    .auth-input {
      width: 100%; padding: 10px 14px; border: 1px solid #c0c0c0;
      border-radius: 6px; font-size: 14px; box-sizing: border-box;
    }
    .auth-input:focus { outline: none; border-color: #0a246a; box-shadow: 0 0 0 3px rgba(10,36,106,0.1); }
    .auth-error { background: #ffecec; color: #cc0000; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 14px; }
    .auth-btn {
      width: 100%; padding: 10px; border: none; border-radius: 6px;
      font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 8px;
      background: #0a246a; color: white;
    }
    .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-btn.cancel { background: #f0f0f0; color: #333; }
    .auth-btn.cancel:hover { background: #e0e0e0; }

    /* DB Container */
    .db-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; flex: 1; }
    .lock-btn { padding: 4px 12px; background: #f0f0f0; border: 1px solid #c0c0c0; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .lock-btn:hover { background: #e0e0e0; }
    .stats-bar { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat-item { flex: 1; text-align: center; padding: 12px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; border-left: 4px solid #0a246a; }
    .stat-item.online { border-left-color: #008800; }
    .stat-label { display: block; font-size: 10px; text-transform: uppercase; color: #888; }
    .stat-value { font-size: 22px; font-weight: 700; color: #333; }
    .settings-card { background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 20px; margin-bottom: 16px; }
    .settings-card h3 { margin: 0 0 16px 0; color: #0a246a; font-size: 14px; }
    .phpmyadmin-note { background: #fff4e5; color: #cc7000; padding: 5px 5px; border-radius: 6px; font-size: 11px; margin-bottom: 5px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f0f4f8; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; }
    .action-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 3px; }
    .action-btn:hover { background: #f0f0f0; border-color: #ccc; }
    .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { padding: 8px 16px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover { background: #0a3a8c; }
    .btn-secondary { background: #f0f0f0; color: #333; }
    .btn-secondary:hover { background: #e0e0e0; }
    .table-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
    .table-link-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; text-decoration: none; color: #333; transition: all 0.15s; }
    .table-link-item:hover { background: #e8f0ff; border-color: #0a246a; }
    .table-icon { font-size: 16px; flex-shrink: 0; }
    .table-name { font-weight: 600; flex: 1; font-size: 11px; }
    .table-rows { font-size: 10px; color: #888; }
    .table-size { font-size: 10px; color: #0a246a; font-weight: 600; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; animation: fadeIn 0.2s ease; }
    .confirm-dialog { background: white; border-radius: 12px; padding: 28px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease; }
    .confirm-icon { font-size: 40px; margin-bottom: 10px; }
    .confirm-dialog h3 { margin: 0 0 8px 0; font-size: 15px; color: #333; }
    .confirm-dialog p { margin: 0 0 20px 0; font-size: 12px; color: #666; line-height: 1.5; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; }
    .confirm-btn { padding: 8px 20px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; }
    .confirm-btn.cancel:hover:not(:disabled) { background: #e0e0e0; }
    .confirm-btn.confirm { background: #0a246a; color: white; }
    .confirm-btn.confirm:hover:not(:disabled) { background: #0a3a8c; }
    /* phpMyAdmin Modal */
    .phpmyadmin-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 4000;
      animation: fadeIn 0.2s ease;
      padding: 20px;
    }
    .phpmyadmin-modal {
      background: white;
      border-radius: 10px;
      width: 95%;
      max-width: 1200px;
      height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      animation: modalIn 0.3s ease;
    }
    @keyframes modalIn {
      from { transform: scale(0.95) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .phpmyadmin-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px;
      background: #0a246a; color: white;
      border-radius: 10px 10px 0 0;
      flex-shrink: 0;
    }
    .phpmyadmin-header h3 {
      margin: 0; font-size: 14px; display: flex; align-items: center; gap: 10px;
    }
    .phpmyadmin-url {
      font-size: 10px; font-weight: normal; opacity: 0.7; color: #ccc;
    }
    .phpmyadmin-actions { display: flex; gap: 8px; align-items: center; }
    .modal-action-btn {
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
      color: white; font-size: 14px; cursor: pointer; padding: 4px 10px; border-radius: 4px;
    }
    .modal-action-btn:hover { background: rgba(255,255,255,0.25); }
    .modal-close-btn {
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
      color: white; font-size: 16px; cursor: pointer; width: 30px; height: 30px;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
    }
    .modal-close-btn:hover { background: rgba(255,0,0,0.5); }
    .phpmyadmin-body {
      flex: 1; position: relative; background: #f5f5f5;
    }
    .phpmyadmin-loading {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: white; color: #888;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #e0e0e0;
      border-top-color: #0a246a; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .phpmyadmin-iframe {
      width: 100%; height: 100%; border: none;
    }
    .phpmyadmin-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; background: #fff8e0; border-top: 1px solid #ffaa00;
      border-radius: 0 0 10px 10px; flex-shrink: 0; font-size: 11px; color: #886600;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class DatabaseManagementComponent implements OnInit {
  // ✅ ADD THIS PROPERTY
  private apiUrl = environment.apiUrl;
  
  // Auth properties
  isAuthenticated = false;
  isVerifying = false;
  authPassword = '';
  authError = '';
  currentUser: any = null;
  // DB properties
  dbInfo: any = { tables: 0, size: '—', totalRows: 0 };
  tables: any[] = [];
  phpMyAdminTables: any[] = [];
  dbConnected = true;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;
  isProcessing = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { 
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUser = user;
    
    // Check if already authenticated in this session
    const dbAuth = sessionStorage.getItem('db_authenticated');
    if (dbAuth === 'true') {
      this.isAuthenticated = true;
      this.loadDBInfo();
      this.loadTablesForLinks();
    }
  }

  openPhpMyAdmin(page: string) {
    this.router.navigate(['/admin/phpmyadmin'], { queryParams: { page } });
  }

  verifyAccess() {
    if (!this.authPassword) {
      this.authError = 'Please enter your password';
      return;
    }

    this.isVerifying = true;
    this.authError = '';

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // ✅ FIXED: Use apiUrl instead of hardcoded localhost
    this.http.post(`${this.apiUrl}/api/auth/verify-password`, 
      { password: this.authPassword },
      { headers }
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.isAuthenticated = true;
          sessionStorage.setItem('db_authenticated', 'true');
          this.authPassword = '';
          this.loadDBInfo();
          this.loadTablesForLinks();
        } else {
          this.authError = 'Invalid password';
        }
        this.isVerifying = false;
      },
      error: (err) => {
        this.authError = err.error?.message || 'Verification failed';
        this.isVerifying = false;
      }
    });
  }

  lockAccess() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('db_authenticated');
    this.authPassword = '';
    this.authError = '';
  }

  goBack() {
    window.history.back();
  }

  loadDBInfo() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // ✅ FIXED: Use apiUrl instead of hardcoded localhost
    this.http.get<any>(`${this.apiUrl}/api/admin/database/info`, { headers }).subscribe({
      next: (data) => { 
        this.dbInfo = {
          tables: data.totalTables || 0,
          size: data.size || '—',
          totalRows: data.totalRows || 0
        };
        this.tables = data.tables || []; 
        this.dbConnected = true;
      },
      error: () => { 
        this.dbConnected = false; 
        this.showToastMsg('Failed to load DB info', 'error'); 
      }
    });
  }

  exportDatabase() {
    this.showConfirm(
      '💾 Export Database', 
      'This will download a complete SQL backup of the EDPTech Helpdesk database. The export includes all table structures and data. Continue?', 
      () => {
        this.isProcessing = true;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 
          'Authorization': `Bearer ${token}`
        };

        this.showToastMsg('⏳ Preparing database export...', 'success');

        // ✅ FIXED: Use apiUrl instead of hardcoded localhost
        this.http.get(`${this.apiUrl}/api/admin/database/export`, { 
          headers,
          responseType: 'blob',
          observe: 'response'
        }).subscribe({
          next: (response: any) => {
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'edptech_helpdesk_backup.sql';
            if (contentDisposition) {
              const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
              if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
              }
            }

            const blob = new Blob([response.body], { type: 'application/sql' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.showToastMsg('✅ Database exported successfully!', 'success');
            this.isProcessing = false;
          },
          error: (err) => {
            console.error('Export failed:', err);
            
            if (err.error) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const errorMsg = JSON.parse(reader.result as string);
                  this.showToastMsg('❌ ' + (errorMsg.error || 'Export failed'), 'error');
                } catch {
                  this.showToastMsg('❌ Failed to export database', 'error');
                }
              };
              reader.readAsText(err.error);
            } else {
              this.showToastMsg('❌ Failed to export database', 'error');
            }
            
            this.isProcessing = false;
          }
        });
      }
    );
  }

  loadTablesForLinks() {
    this.phpMyAdminTables = [
      { name: 'assets', rows: 0, size: '64.0 KiB' },
      { name: 'computer_monitoring', rows: 144, size: '32.0 KiB' },
      { name: 'departments', rows: 7, size: '16.0 KiB' },
      { name: 'department_roles', rows: 10, size: '16.0 KiB' },
      { name: 'job_orders', rows: 2, size: '32.0 KiB' },
      { name: 'knowledge_base', rows: 0, size: '32.0 KiB' },
      { name: 'new_user', rows: 2, size: '48.0 KiB' },
      { name: 'registration_keys', rows: 1, size: '48.0 KiB' },
      { name: 'requisitions', rows: 2, size: '48.0 KiB' },
      { name: 'requisition_items', rows: 2, size: '32.0 KiB' },
      { name: 'system_settings', rows: 7, size: '32.0 KiB' },
      { name: 'tickets', rows: 4, size: '144.0 KiB' },
      { name: 'ticket_attachments', rows: 3, size: '32.0 KiB' },
      { name: 'ticket_comments', rows: 11, size: '64.0 KiB' },
      { name: 'users', rows: 4, size: '48.0 KiB' }
    ];
  }

  optimizeTable(name: string) {
    this.showConfirm('Optimize Table', `Are you sure you want to optimize the table "${name}"?`, () => {
      this.isProcessing = true;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // ✅ FIXED: Use apiUrl instead of hardcoded localhost
      this.http.post(`${this.apiUrl}/api/admin/database/optimize/${name}`, {}, { headers }).subscribe({
        next: () => { 
          this.showToastMsg(`✅ Table "${name}" optimized!`, 'success'); 
          this.loadDBInfo(); 
          this.isProcessing = false; 
        },
        error: () => { 
          this.showToastMsg(`Failed to optimize`, 'error'); 
          this.isProcessing = false; 
        }
      });
    });
  }

  repairTable(name: string) {
    this.showConfirm('Repair Table', `Are you sure you want to repair the table "${name}"?`, () => {
      this.isProcessing = true;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // ✅ FIXED: Use apiUrl instead of hardcoded localhost
      this.http.post(`${this.apiUrl}/api/admin/database/repair/${name}`, {}, { headers }).subscribe({
        next: () => { 
          this.showToastMsg(`✅ Table "${name}" repaired!`, 'success'); 
          this.loadDBInfo(); 
          this.isProcessing = false; 
        },
        error: () => { 
          this.showToastMsg(`Failed to repair`, 'error'); 
          this.isProcessing = false; 
        }
      });
    });
  }

  showConfirm(title: string, message: string, action: () => void) {
    this.confirmTitle = title; 
    this.confirmMessage = message; 
    this.confirmAction = action; 
    this.showConfirmDialog = true;
  }

  executeConfirmAction() {
    if (this.confirmAction) { 
      this.confirmAction(); 
    }
    this.showConfirmDialog = false; 
    this.confirmAction = null;
  }

  cancelAction() { 
    this.showConfirmDialog = false; 
    this.confirmAction = null; 
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}