import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-registration-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h2>🔑 Branch Registration Keys</h2>
        <span class="header-sub">View registration keys for each branch</span>
      </div>
      
      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading branches...</p>
      </div>

      <!-- No Branches State -->
      <div class="empty-state" *ngIf="!loading && branches.length === 0">
        <div class="empty-icon">🔑</div>
        <h3>No Branches Found</h3>
        <p>Branches are managed in System Settings.</p>
      </div>

      <!-- Branches List -->
      <div class="branches-section" *ngIf="!loading && branches.length > 0">
        <div class="toolbar">
          <span class="branch-count">{{ branches.length }} branch(es)</span>
          <button class="btn" (click)="loadBranches()">🔄 Refresh</button>
        </div>

        <div class="branch-cards">
          <div class="branch-card" *ngFor="let branch of branches" [class.inactive]="!branch.is_active">
            
            <!-- Branch Header -->
            <div class="branch-header">
              <div class="branch-info">
                <div class="branch-name-row">
                  <span class="branch-name">🏢 {{ branch.name }}</span>
                  <span class="branch-status" [class.status-active]="branch.is_active" 
                                               [class.status-inactive]="!branch.is_active">
                    {{ branch.is_active ? '● Active' : '● Inactive' }}
                  </span>
                </div>
                <span class="branch-company" *ngIf="branch.company_name">
                  {{ branch.company_name }}
                </span>
              </div>
            </div>

            <!-- Registration Key -->
            <div class="key-section">
              <label>Registration Key:</label>
              <div class="key-code-display">
                <code>{{ branch.registration_key || 'No key assigned' }}</code>
                <button class="copy-btn" 
                        (click)="copyKey(branch.registration_key, branch.id)" 
                        [class.copied]="copiedBranchId === branch.id"
                        title="Copy to clipboard"
                        *ngIf="branch.registration_key">
                  {{ copiedBranchId === branch.id ? '✅ Copied!' : '📋 Copy' }}
                </button>
              </div>
            </div>

            <!-- Branch Details -->
            <div class="branch-details">
              <div class="detail-row" *ngIf="branch.address">
                <span class="detail-label">📍 Address:</span>
                <span>{{ branch.address }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Created:</span>
                <span>{{ branch.created_at | date:'MMM d, yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Updated:</span>
                <span>{{ branch.updated_at | date:'MMM d, yyyy h:mm a' }}</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Info Note -->
        <div class="info-note">
          <span>💡 <strong>Note:</strong> To create, edit, or delete branches and their registration keys, go to <strong>System Settings</strong>.</span>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" [class.show]="showToast">
        <span class="toast-icon">✅</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
    }

    .page-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
    }
    .page-header h2 {
      margin: 0 0 4px 0;
      color: #0a246a;
      font-size: 20px;
    }
    .header-sub {
      color: #666;
      font-size: 12px;
    }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 60px;
      color: #888;
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #0a246a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #c0c0c0;
    }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px 0; color: #333; }
    .empty-state p { color: #666; margin-bottom: 0; }

    /* Toolbar */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .branch-count {
      font-size: 13px;
      color: #666;
      font-weight: 600;
    }

    /* Branch Cards */
    .branches-section {
      margin-top: 8px;
    }
    
    .branch-cards {
      display: grid;
      gap: 14px;
    }
    
    .branch-card {
      background: white;
      border: 1px solid #d0d0d0;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: border-color 0.2s;
    }
    .branch-card:hover {
      border-color: #0a246a;
    }
    .branch-card.inactive {
      opacity: 0.65;
      background: #fafafa;
    }

    /* Branch Header */
    .branch-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .branch-info {
      flex: 1;
    }
    .branch-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .branch-name {
      font-size: 15px;
      font-weight: 700;
      color: #1a1d24;
    }
    .branch-company {
      font-size: 11px;
      color: #3a3a3a;
      font-style: italic;
    }
    .branch-status {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .status-active {
      background: #dcfce7;
      color: #166534;
    }
    .status-inactive {
      background: #fef2f2;
      color: #991b1b;
    }

    /* Key Section */
    .key-section {
      margin-bottom: 14px;
    }
    .key-section label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      color: #534646;
      font-weight: 600;
      margin-bottom: 6px;
      letter-spacing: 0.04em;
    }
    .key-code-display {
      display: flex;
      gap: 10px;
      align-items: center;
      background: #f8f9fa;
      padding: 12px 14px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .key-code-display code {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      color: #0a246a;
      letter-spacing: 1px;
      background: transparent;
      user-select: all;
      word-break: break-all;
    }

    .copy-btn {
      padding: 6px 14px;
      background: #0a246a;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: #1a3a8a;
    }
    .copy-btn.copied {
      background: #166534;
    }

    /* Branch Details */
    .branch-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
    }
    .detail-row {
      display: flex;
      padding: 5px 0;
      color: #ad2b2b;
      font-size: 11px;
      align-items: center;
      border-bottom: 1px solid #f5f5f5;
    }
    .detail-label {
      color: #5c5252;
      font-weight: 500;
      margin-right: 8px;
      white-space: nowrap;
    }

    /* Buttons */
    .btn {
      padding: 7px 14px;
      border: 1px solid #c0c0c0;
      background: #f8f9fa;
      cursor: pointer;
      border-radius: 5px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s;
    }
    .btn:hover { background: #e8e8e8; }

    /* Info Note */
    .info-note {
      margin-top: 20px;
      padding: 12px 16px;
      background: #f0f4ff;
      border: 1px solid #c0d0e8;
      border-radius: 6px;
      font-size: 11px;
      color: #446;
      text-align: center;
    }
    .info-note strong {
      color: #0a246a;
    }

    /* Toast */
    .toast-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #166534;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 2000;
    }
    .toast-notification.show {
      transform: translateY(0);
      opacity: 1;
    }
    .toast-icon { font-size: 16px; }
    .toast-message { color: white; }

    @media (max-width: 600px) {
      .branch-details {
        grid-template-columns: 1fr;
      }
      .branch-name-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class RegistrationKeysComponent implements OnInit {
  branches: any[] = [];
  loading = false;
  copiedBranchId: number | null = null;
  showToast = false;
  toastMessage = '';
  private toastTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBranches();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadBranches() {
    this.loading = true;
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/branches`, { headers }).subscribe({
      next: (data) => {
        // Sort branches by name
        this.branches = (data || []).sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.loading = false;
        
        if (err.status === 401) {
          this.showToastMsg('Session expired. Please login again.');
        } else if (err.status === 403) {
          this.showToastMsg('Access denied.');
        } else {
          this.showToastMsg('Failed to load branches.');
        }
      }
    });
  }

  copyKey(keyCode: string, branchId: number) {
    if (!keyCode) return;
    
    const doCopy = (text: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.copiedBranchId = branchId;
          this.showToastMsg('Key copied to clipboard!');
          setTimeout(() => this.copiedBranchId = null, 2000);
        }).catch(() => {
          this.fallbackCopy(text, branchId);
        });
      } else {
        this.fallbackCopy(text, branchId);
      }
    };
    
    doCopy(keyCode);
  }

  private fallbackCopy(text: string, branchId: number) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.copiedBranchId = branchId;
      this.showToastMsg('Key copied to clipboard!');
      setTimeout(() => this.copiedBranchId = null, 2000);
    } catch (err) {
      this.showToastMsg('Failed to copy. Please copy manually.');
    }
    document.body.removeChild(textarea);
  }

  showToastMsg(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
    }, 3000);
  }
}