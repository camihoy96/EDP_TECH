import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-department-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h2>🏤 Department Positions</h2>
        <span class="header-sub">Manage positions assigned to each department</span>
      </div>
      
      <!-- Empty State -->
      <div class="empty-state" *ngIf="roles.length === 0 && !showForm">
        <div class="empty-icon">🏤</div>
        <h3>No Department Positions Found</h3>
        <p>Create position assignments for different departments.</p>
        <button class="btn btn-primary btn-large" (click)="openCreateForm()">
          ➕ Create Department Position
        </button>
      </div>

      <!-- Department Tabs/Grid -->
      <div class="dept-tabs" *ngIf="roles.length > 0">
        <button class="dept-tab" 
                [class.active]="selectedDepartment === 'all'"
                (click)="selectDepartment('all')">
          <span class="tab-icon">📋</span>
          <span class="tab-label">All</span>
          <span class="tab-count">{{ roles.length }}</span>
        </button>
        
        <button class="dept-tab" 
                *ngFor="let dept of getUniqueDepartments()"
                [class.active]="selectedDepartment === dept"
                (click)="selectDepartment(dept)">
          <span class="tab-icon">🏢</span>
          <span class="tab-label">{{ dept }}</span>
          <span class="tab-count">{{ getRolesByDepartment(dept).length }}</span>
        </button>
      </div>

      <!-- Roles Table -->
      <div class="roles-section" *ngIf="roles.length > 0">
        <div class="toolbar">
          <button class="btn btn-primary" (click)="openCreateForm()">
            ➕ Create Position
          </button>
          <button class="btn" (click)="loadRoles()">🔄 Refresh</button>
          <span class="count-badge">{{ displayedRoles.length }} position(s)</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department</th>
                <th>Position Name</th>
                <th>Position Value</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let role of displayedRoles">
                <td class="col-id">{{ role.id }}</td>
                <td>
                  <span class="dept-badge">{{ role.department_name }}</span>
                </td>
                <td class="col-name">{{ role.role_name }}</td>
                <td>
                  <code class="role-code">{{ role.role_value }}</code>
                </td>
                <td class="col-desc">{{ role.role_description || '-' }}</td>
                <td class="col-date">{{ role.created_at | date:'MMM d, yyyy' }}</td>
               <td>
  <div class="dept-actions">
    <button class="icon-btn" *ngIf="currentUser?.role === 'admin'" (click)="openEditForm(role)" title="Edit">✏️</button>
    <button class="icon-btn delete" *ngIf="currentUser?.role === 'admin'" (click)="confirmDeleteRole(role)" title="Delete">🗑️</button>
    <span *ngIf="currentUser?.role !== 'admin'" style="font-size:10px;color:#888;">Admin only</span>
  </div>
</td>
              </tr>
              <tr *ngIf="displayedRoles.length === 0">
                <td colspan="7" class="empty-row">
                  No roles found for this department
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingRole ? '✏️ Edit Department Position' : '➕ Create Department Position' }}</h3>
            <button class="modal-close" (click)="closeForm()">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Department *</label>
              <select [(ngModel)]="formData.department_name" class="form-control">
                <option value="">Select Department</option>
                <option *ngFor="let dept of departments" [value]="dept.name">{{ dept.name }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Position Name *</label>
              <input type="text" [(ngModel)]="formData.role_name" class="form-control" 
                     placeholder="e.g., Department Head, Manager, Staff">
            </div>
            
            <div class="form-group">
              <label>Position Value *</label>
              <input type="text" [(ngModel)]="formData.role_value" class="form-control" 
                     placeholder="e.g., dept_head, manager, staff">
              <small>Unique identifier (lowercase, no spaces)</small>
            </div>
            
            <div class="form-group">
              <label>Description (Optional)</label>
              <textarea [(ngModel)]="formData.role_description" class="form-control" 
                        placeholder="Brief description of this position" rows="3"></textarea>
            </div>

            <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          </div>
          
          <div class="modal-footer">
            <button class="btn" (click)="closeForm()">✕ Cancel</button>
            <button class="btn btn-primary" (click)="editingRole ? updateRole() : createRole()" 
                    [disabled]="saving || !formData.department_name || !formData.role_name || !formData.role_value">
              {{ saving ? 'Saving...' : (editingRole ? '💾 Update' : '💾 Create') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
        <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header delete-header">
            <h3>⚠️ Delete Department Position</h3>
            <button class="modal-close" (click)="cancelDelete()">✕</button>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <div class="warning-icon">⚠️</div>
              <p>Are you sure you want to delete this position?</p>
              <div class="delete-role-info" *ngIf="deleteTarget">
                <div><strong>{{ deleteTarget.role_name }}</strong></div>
                <div>Department: {{ deleteTarget.department_name }}</div>
                <div>Value: {{ deleteTarget.role_value }}</div>
              </div>
              <p class="warning-text">This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="cancelDelete()">✕ Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">🗑️ Delete Position</button>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" [class.show]="showToast" 
           [class.error]="toastType === 'error'"
           [class.success]="toastType === 'success'">
        <span class="toast-icon">{{ toastType === 'success' ? '✅' : '❌' }}</span>
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
    .page-header h2 { margin: 0 0 4px 0; color: #0a246a; font-size: 20px; }
    .header-sub { color: #666; font-size: 12px; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #c0c0c0;
    }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px 0; color: #333; }
    .empty-state p { color: #666; margin-bottom: 24px; }

    /* Department Tabs */
    .dept-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding: 4px;
      background: #f0f4f8;
      border-radius: 8px;
    }

    .dept-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid transparent;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
      white-space: nowrap;
      color: #555;
    }
    .dept-tab:hover {
      background: #e8eeff;
    }
    .dept-tab.active {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
    }
    .dept-tab.active .tab-count {
      background: rgba(255,255,255,0.3);
      color: white;
    }
    .tab-icon { font-size: 14px; }
    .tab-label { font-weight: 500; }
    .tab-count {
      background: #e0e0e0;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      color: #666;
    }

    /* Roles Section */
    .roles-section { margin-top: 10px; }

    .toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      align-items: center;
    }
    .count-badge {
      margin-left: auto;
      color: #888;
      font-size: 11px;
    }

    .table-container {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 6px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      background: #f0f4f8;
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: #555;
      text-transform: uppercase;
      border-bottom: 2px solid #d0d0d0;
      white-space: nowrap;
    }
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 12px;
      color: #333;
    }
    .data-table tr:hover td {
      background: #f8faff;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }

    .col-id { width: 50px; color: #999; font-size: 10px; }
    .col-name { font-weight: 600; }
    .col-desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #666; }
    .col-date { font-size: 10px; color: #999; white-space: nowrap; }
    .col-actions { width: 80px; text-align: center; }

    .dept-badge {
      padding: 2px 8px;
      background: #e8eeff;
      color: #0a246a;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    .role-code {
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #333;
    }
    .empty-row {
      text-align: center !important;
      color: #999 !important;
      padding: 30px !important;
      font-style: italic;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
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
      max-width: 520px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
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
    .modal-header h3 { margin: 0; color: #0a246a; font-size: 16px; }
    .modal-close {
      background: none; border: none;
      font-size: 20px; cursor: pointer;
      color: #888; padding: 4px 8px; border-radius: 4px;
    }
    .modal-close:hover { background: #e0e0e0; color: #333; }
    .modal-body { padding: 20px; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 8px 8px;
    }

    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block; margin-bottom: 6px;
      font-weight: 600; color: #333;
      font-size: 11px; text-transform: uppercase;
    }
    .form-control {
      width: 100%; padding: 8px 12px;
      border: 1px solid #c0c0c0; border-radius: 4px;
      font-size: 12px; box-sizing: border-box; font-family: inherit;
    }
    .form-control:focus {
      outline: none; border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10,36,106,0.1);
    }
    small { display: block; margin-top: 4px; color: #888; font-size: 10px; }
    .error-message {
      margin-top: 12px; padding: 8px 12px;
      background: #ffecec; color: #cc0000;
      border: 1px solid #ffcccc; border-radius: 4px; font-size: 11px;
    }

    .delete-modal { max-width: 450px; }
    .delete-header { background: #fff5f5; border-bottom: 1px solid #ffcccc; }
    .delete-header h3 { color: #cc0000; }
    .delete-warning { text-align: center; }
    .warning-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .delete-warning p { color: #000000; font-size: 13px; margin-bottom: 12px; }
    .delete-role-info {
      background: #fff5f5; padding: 12px; color: #000000;
      border-radius: 6px; border: 1px solid #ffcccc;
      margin-bottom: 12px; text-align: left; font-size: 12px;
    }
    .delete-role-info div { margin-bottom: 4px; }
    .warning-text { color: #cc0000 !important; font-size: 11px !important; font-weight: 600; }

    .btn {
      padding: 8px 16px; border: 1px solid #c0c0c0;
      background: #f8f9fa; cursor: pointer; border-radius: 4px;
      font-size: 12px; display: inline-flex; align-items: center; gap: 6px;
    }
    .btn:hover { background: #e8e8e8; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover { background: #1a3a8a; }
    .btn-large { padding: 12px 24px; font-size: 14px; }
    .btn-danger { background: #cc0000; color: white; border-color: #cc0000; }
    .btn-danger:hover { background: #aa0000; }
    
    .icon-btn {
      background: none; border: 1px solid transparent;
      cursor: pointer; font-size: 16px;
      padding: 4px 8px; border-radius: 4px;
    }
    .icon-btn:hover { background: #f0f0f0; border-color: #c0c0c0; }
    .icon-btn.delete:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }

    .toast-notification {
      position: fixed; bottom: 24px; right: 24px;
      background: #333; color: white;
      padding: 12px 20px; border-radius: 8px;
      display: flex; align-items: center; gap: 10px;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateY(100px); opacity: 0;
      transition: all 0.3s ease; z-index: 2000;
    }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .toast-icon { font-size: 18px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class DepartmentRolesComponent implements OnInit {
  roles: any[] = [];
  departments: any[] = [];
  selectedDepartment = 'all';
  
  showForm = false;
  editingRole: any = null;
  saving = false;
  errorMessage = '';
  currentUser: any;

  showDeleteConfirm = false;
  deleteTarget: any = null;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  formData = {
    department_name: '',
    role_name: '',
    role_value: '',
    role_description: ''
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadRoles();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadDepartments() {
    const headers = this.getAuthHeaders();
    // ❌ Wrong: '${environment.apiUrl}/api/departments'
    // ✅ Fix:
    this.http.get<any[]>(`${environment.apiUrl}/api/departments`, { headers }).subscribe({
      next: (data) => { this.departments = Array.isArray(data) ? data : []; },
      error: (err) => console.error('Failed to load departments:', err)
    });
}

loadRoles() {
    const headers = this.getAuthHeaders();
    // ❌ Wrong: '${environment.apiUrl}/api/department-roles'
    // ✅ Fix:
    this.http.get<any[]>(`${environment.apiUrl}/api/department-roles`, { headers }).subscribe({
      next: (data) => { this.roles = Array.isArray(data) ? data : []; },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.showToastNotification('Failed to load department roles', 'error');
      }
    });
}

  get displayedRoles(): any[] {
    if (this.selectedDepartment === 'all') return this.roles;
    return this.roles.filter(r => r.department_name === this.selectedDepartment);
  }

  getUniqueDepartments(): string[] {
    return [...new Set(this.roles.map(r => r.department_name))].sort();
  }

  getRolesByDepartment(dept: string): any[] {
    return this.roles.filter(r => r.department_name === dept);
  }

  selectDepartment(dept: string) {
    this.selectedDepartment = dept;
  }

  openCreateForm() {
    this.editingRole = null;
    this.formData = { department_name: '', role_name: '', role_value: '', role_description: '' };
    this.errorMessage = '';
    this.showForm = true;
  }

  openEditForm(role: any) {
    this.editingRole = role;
    this.formData = {
      department_name: role.department_name || '',
      role_name: role.role_name || '',
      role_value: role.role_value || '',
      role_description: role.role_description || ''
    };
    this.errorMessage = '';
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingRole = null;
    this.errorMessage = '';
    this.saving = false;
  }

  createRole() {
    if (!this.formData.department_name || !this.formData.role_name || !this.formData.role_value || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    const headers = this.getAuthHeaders();
    
    this.http.post(`${environment.apiUrl}/api/department-roles`, this.formData, { headers }).subscribe({
      next: () => {
        this.closeForm();
        this.loadRoles();
        this.showToastNotification('✅ Department role created successfully!', 'success');
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error || 'Failed to create role.';
      }
    });
  }

  updateRole() {
    if (!this.editingRole || !this.formData.department_name || !this.formData.role_name || !this.formData.role_value || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    const headers = this.getAuthHeaders();
    
    this.http.put(`${environment.apiUrl}/api/department-roles/${this.editingRole.id}`, this.formData, { headers }).subscribe({
      next: () => {
        this.closeForm();
        this.loadRoles();
        this.showToastNotification('✅ Department role updated successfully!', 'success');
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error || 'Failed to update role.';
      }
    });
  }

  confirmDeleteRole(role: any) {
    this.deleteTarget = role;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    const headers = this.getAuthHeaders();
    
    this.http.delete(`${environment.apiUrl}/api/department-roles/${this.deleteTarget.id}`, { headers }).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.loadRoles();
        this.showToastNotification('🗑️ Role deleted successfully!', 'success');
      },
      error: (err) => {
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.showToastNotification('Failed to delete role', 'error');
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  showToastNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
    }, 3000);
  }
}