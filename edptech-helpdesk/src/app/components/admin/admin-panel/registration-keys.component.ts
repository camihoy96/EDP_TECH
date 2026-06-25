import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-registration-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h2>🔑 Registration Keys Management</h2>
        <span class="header-sub">Generate and manage registration keys for user access</span>
      </div>
      
      <!-- No Keys State - Only Admin sees this -->
      <div class="empty-state" *ngIf="!hasKeys && isAdmin">
        <div class="empty-icon">🔑</div>
        <h3>No Registration Keys Found</h3>
        <p>Create a registration key to allow users to register for the system.</p>
        <button class="btn btn-primary btn-large" (click)="openCreateModal()">
          ➕ Create Registration Key
        </button>
      </div>

      <!-- Non-admin empty state -->
      <div class="empty-state" *ngIf="!hasKeys && !isAdmin">
        <div class="empty-icon">🔑</div>
        <h3>No Registration Keys Available</h3>
        <p>Please contact your administrator for a registration key.</p>
      </div>

      <!-- Keys List -->
      <div class="keys-section" *ngIf="hasKeys">
        <div class="toolbar">
          <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="isAdmin">
            ➕ Create New Key
          </button>
          <button class="btn" (click)="loadKeys()">🔄 Refresh</button>
        </div>

        <div class="key-cards">
          <div class="key-card" *ngFor="let key of keys" [class.used]="key.used">
            <div class="key-header">
              <div class="key-info">
                <span class="key-status" [class.status-active]="!key.used" 
                                       [class.status-used]="key.used">
                  {{ key.used ? '● Used' : '● Active' }}
                </span>
              </div>
              <div class="key-actions" *ngIf="isAdmin">
                <button class="icon-btn" (click)="openEditModal(key)" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete" (click)="deleteKey(key)" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="key-code-section">
              <label>Registration Key:</label>
              <div class="key-code-display">
                <code>{{ key.key_code }}</code>
                <button class="copy-btn" [class.copied]="showCopyToast && copyMessage.includes('copied')" 
        (click)="copyKey(key.key_code)" title="Copy to clipboard">
  {{ showCopyToast && copyMessage.includes('copied') ? '✅ Copied!' : '📋 Copy' }}
</button>
              </div>
            </div>
            
            <div class="key-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span>{{ key.id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span>{{ key.used ? 'Used' : 'Available' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span>{{ key.created_at | date:'MMM d, yyyy h:mm a' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unified Modal for Create & Edit -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Edit Registration Key' : '➕ Create New Registration Key' }}</h3>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Edit Mode - Show current key -->
          <div class="form-group" *ngIf="isEditing">
            <label>Current Key:</label>
            <div class="current-key">
              <code>{{ editingKey?.key_code }}</code>
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ isEditing ? 'New Key Code:' : 'Key Code:' }}</label>
            <input type="text" [(ngModel)]="modalKeyCode" class="form-control" 
                   [placeholder]="isEditing ? 'Enter new key code' : 'Enter registration key code'"
                   autofocus>
            <small>{{ isEditing ? 'Enter a new registration key code to replace the current one' : 'Enter a unique registration key code for users' }}</small>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn" (click)="closeModal()">✕ Cancel</button>
          <button class="btn btn-primary" (click)="isEditing ? updateKey() : createKey()" 
                  [disabled]="saving || !modalKeyCode.trim()">
            {{ saving ? 'Saving...' : (isEditing ? '💾 Update Key' : '🔑 Create Key') }}
          </button>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
  <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
    <div class="modal-header delete-header">
      <h3>⚠️ Delete Registration Key</h3>
      <button class="modal-close" (click)="cancelDelete()">✕</button>
    </div>
    
    <div class="modal-body">
      <div class="delete-warning">
        <div class="warning-icon">⚠️</div>
        <p>Are you sure you want to delete this registration key?</p>
        
        <div class="delete-key-info" *ngIf="deleteTarget">
          <code>{{ deleteTarget.key_code }}</code>
        </div>
        
        <p class="warning-text">This action cannot be undone. Users will no longer be able to register with this key.</p>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="btn" (click)="cancelDelete()">✕ Cancel</button>
      <button class="btn btn-danger" (click)="confirmDelete()">
        🗑️ Delete Key
      </button>
    </div>
  </div>
</div>

<!-- Toast Notification -->
<div class="toast-notification" [class.show]="showCopyToast" [class.error]="copyMessage.includes('Failed') || copyMessage.includes('Session') || copyMessage.includes('Access denied')">
  <span class="toast-icon">{{ copyMessage.includes('✅') ? '✅' : '❌' }}</span>
  <span class="toast-message">{{ copyMessage }}</span>
</div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      max-width: 800px;
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

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #c0c0c0;
    }
    .empty-icon {
      font-size: 64px;
      display: block;
      margin-bottom: 16px;
    }
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
    }
    .empty-state p {
      color: #666;
      margin-bottom: 24px;
    }

    .keys-section {
      margin-top: 20px;
    }
    
    .toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      justify-content: flex-end;
    }

    .key-cards {
      display: grid;
      gap: 16px;
    }
    
    .key-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .key-card.used {
      opacity: 0.7;
      background: #f8f8f8;
    }
    
    .key-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .key-info {
      display: flex;
      align-items: center;
    }
    
    .key-status {
      font-size: 12px;
      font-weight: 600;
    }
    .status-active { color: #008800; }
    .status-used { color: #999; }

    .key-actions {
      display: flex;
      gap: 4px;
    }

    .key-code-section {
      margin-bottom: 16px;
    }
    
    .key-code-section label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 8px;
    }
    
    .key-code-display {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    
    .key-code-display code {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      color: #0a246a;
      letter-spacing: 1px;
      background: transparent;
      user-select: all;
    }

    .copy-btn {
      padding: 6px 12px;
      background: #0a246a;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
    }
    .copy-btn:hover {
      background: #1a3a8a;
    }

    .key-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    
    .detail-row {
      display: flex;
      padding: 6px 0;
      color: #1f3011;
      border-bottom: 1px solid #f0f0f0;
      font-size: 11px;
      align-items: center;
    }
    
    .detail-label {
      color: #000000;
      font-weight: 500;
      margin-right: 12px;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #c0c0c0;
      background: #f8f9fa;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover {
      background: #e8e8e8;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
    }
    .btn-primary:hover {
      background: #1a3a8a;
    }
    .btn-large {
      padding: 12px 24px;
      font-size: 14px;
    }
    
    .icon-btn {
      background: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .icon-btn:hover {
      background: #f0f0f0;
      border-color: #c0c0c0;
    }
    .icon-btn.delete:hover {
      background: #ffecec;
      border-color: #cc0000;
      color: #cc0000;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 8px 8px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      color: #0a246a;
      font-size: 16px;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #888;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .modal-close:hover {
      background: #e0e0e0;
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 8px 8px;
    }

    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #333;
      font-size: 11px;
      text-transform: uppercase;
    }
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #c0c0c0;
      border-radius: 4px;
      font-size: 12px;
      box-sizing: border-box;
    }
    .form-control:focus {
      outline: none;
      border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10,36,106,0.1);
    }
    small {
      display: block;
      margin-top: 4px;
      color: #888;
      font-size: 10px;
    }

    .current-key {
      background: #f0f4f8;
      padding: 10px 12px;
      border-radius: 4px;
      border: 1px solid #d0d8e0;
    }
    .current-key code {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #0a246a;
    }

    .error-message {
      margin-top: 12px;
      padding: 8px 12px;
      background: #ffecec;
      color: #cc0000;
      border: 1px solid #ffcccc;
      border-radius: 4px;
      font-size: 11px;
    }

    .success-message {
      margin-top: 12px;
      padding: 8px 12px;
      background: #eeffee;
      color: #008800;
      border: 1px solid #ccffcc;
      border-radius: 4px;
      font-size: 11px;
    }
    /* Delete Modal */
.delete-modal {
  max-width: 450px;
}

.delete-header {
  background: #fff5f5;
  border-bottom: 1px solid #ffcccc;
}

.delete-header h3 {
  color: #cc0000;
}

.delete-warning {
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.delete-warning p {
  color: #666;
  font-size: 13px;
  margin-bottom: 16px;
}

.delete-key-info {
  background: #fff5f5;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ffcccc;
  margin-bottom: 16px;
}

.delete-key-info code {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  color: #cc0000;
  font-weight: bold;
}

.warning-text {
  color: #cc0000 !important;
  font-size: 11px !important;
  font-weight: 600;
}

.btn-danger {
  background: #cc0000;
  color: white;
  border-color: #cc0000;
}

.btn-danger:hover {
  background: #aa0000;
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 2000;
  max-width: 400px;
}

.toast-notification.show {
  transform: translateY(0);
  opacity: 1;
}

.toast-notification.error {
  background: #cc0000;
}

.toast-icon {
  font-size: 18px;
}

.toast-message {
  flex: 1;
  color: white;
}

/* Copy button feedback */
/* Copy button states */
.copy-btn {
  transition: all 0.2s ease;
}

.copy-btn.copied {
  background: #008800;
  color: white;
}

.copy-btn:hover {
  background: #1a3a8a;
}

.copy-btn.copied:hover {
  background: #006600;
}

/* Delete Confirmation Modal */
.delete-modal {
  max-width: 450px;
}

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class RegistrationKeysComponent implements OnInit {
  keys: any[] = [];
  isAdmin = false;
  showModal = false;
  isEditing = false;
  editingKey: any = null;
  modalKeyCode = '';
  saving = false;
  errorMessage = '';
  successMessage = '';
  showDeleteConfirm = false;
  deleteTarget: any = null;
  copyMessage = '';
  showCopyToast = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkAdminRole();
    this.loadKeys();
  }

  checkAdminRole() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.isAdmin = user?.role === 'admin';
    });
  }

  get hasKeys(): boolean {
    return this.keys.length > 0;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔐 Token available:', !!token);
    console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadKeys() {
    console.log('🔍 Loading registration keys...');
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/registration-keys`, { headers }).subscribe({
      next: (data) => {
        console.log('✅ Keys loaded:', data);
        this.keys = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('❌ Failed to load keys:', err);
        
        if (err.status === 401) {
          alert('Session expired. Please login again.');
        } else if (err.status === 403) {
          alert('Access denied. Admin only.');
        } else {
          this.keys = [];
        }
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingKey = null;
    this.modalKeyCode = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  openEditModal(key: any) {
    this.isEditing = true;
    this.editingKey = key;
    this.modalKeyCode = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingKey = null;
    this.modalKeyCode = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.saving = false;
  }

  createKey() {
    if (!this.modalKeyCode.trim() || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const headers = this.getAuthHeaders();
    const payload = { key_code: this.modalKeyCode.trim() };
    
    console.log('🔑 Sending create request:', payload);
    
    this.http.post(`${environment.apiUrl}/api/admin/registration-keys`, payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Key created successfully:', response);
          this.successMessage = '✅ Registration key created successfully!';
          this.saving = false;
          
          setTimeout(() => {
            this.closeModal();
            this.loadKeys();
          }, 1000);
        },
        error: (err) => {
          this.saving = false;
          console.error('❌ Failed to create key:', err);
          console.error('Error details:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error
          });
          
          if (err.status === 400) {
            this.errorMessage = err.error?.error || 'This key code already exists. Please use a different one.';
          } else if (err.status === 401) {
            this.closeModal();
            alert('Session expired. Please login again.');
          } else if (err.status === 403) {
            this.closeModal();
            alert('Access denied. Admin only.');
          } else if (err.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
          } else {
            this.errorMessage = `Failed to create key: ${err.error?.error || err.message || 'Unknown error'}`;
          }
        }
      });
  }

  updateKey() {
    if (!this.editingKey || !this.modalKeyCode.trim() || this.saving) return;
    
    if (this.modalKeyCode.trim() === this.editingKey.key_code) {
      this.errorMessage = 'New key code must be different from the current one';
      return;
    }
    
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const headers = this.getAuthHeaders();
    
    this.http.put(`${environment.apiUrl}/api/admin/registration-keys/${this.editingKey.id}`, 
      { key_code: this.modalKeyCode.trim() }, 
      { headers }
    ).subscribe({
      next: () => {
        console.log('✅ Key updated');
        this.successMessage = '✅ Registration key updated successfully!';
        this.saving = false;
        
        setTimeout(() => {
          this.closeModal();
          this.loadKeys();
        }, 1000);
      },
      error: (err) => {
        this.saving = false;
        console.error('❌ Failed to update key:', err);
        
        if (err.status === 400) {
          this.errorMessage = 'This key code already exists. Please use a different one.';
        } else if (err.status === 401) {
          this.closeModal();
          alert('Session expired. Please login again.');
        } else if (err.status === 403) {
          this.closeModal();
          alert('Access denied. Admin only.');
        } else {
          this.errorMessage = 'Failed to update key. Please try again.';
        }
      }
    });
  }

  deleteKey(key: any) {
  this.deleteTarget = key;
  this.showDeleteConfirm = true;
}
cancelDelete() {
  this.showDeleteConfirm = false;
  this.deleteTarget = null;
}
// New method - confirm deletion
confirmDelete() {
  if (!this.deleteTarget) return;
  
  const headers = this.getAuthHeaders();
  const key = this.deleteTarget;
  
  this.http.delete(`${environment.apiUrl}/api/admin/registration-keys/${key.id}`, { headers }).subscribe({
    next: () => {
      console.log('✅ Key deleted');
      this.keys = this.keys.filter(k => k.id !== key.id);
      this.showDeleteConfirm = false;
      this.deleteTarget = null;
      this.showToast('🗑️ Key deleted successfully!', 'success');
    },
    error: (err) => {
      console.error('❌ Failed to delete key:', err);
      this.showDeleteConfirm = false;
      this.deleteTarget = null;
      
      if (err.status === 401) {
        this.showToast('Session expired. Please login again.', 'error');
      } else if (err.status === 403) {
        this.showToast('Access denied. Admin only.', 'error');
      } else {
        this.showToast('Failed to delete key. Please try again.', 'error');
      }
    }
  });
}

// Updated copyKey method with toast notification
copyKey(keyCode: string) {
  const doCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('✅ Key copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  };
  
  doCopy(keyCode);
}

// Fallback copy method
private fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    this.showToast('✅ Key copied to clipboard!', 'success');
  } catch (err) {
    this.showToast('Failed to copy. Please copy manually: ' + text, 'error');
  }
  document.body.removeChild(textarea);
}

// Toast notification system
private toastTimer: any;

showToast(message: string, type: 'success' | 'error' = 'success') {
  this.copyMessage = message;
  this.showCopyToast = true;
  
  if (this.toastTimer) {
    clearTimeout(this.toastTimer);
  }
  
  this.toastTimer = setTimeout(() => {
    this.showCopyToast = false;
    this.copyMessage = '';
  }, 3000);
}
}