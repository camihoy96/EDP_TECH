import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-mgmt-container">
      
      <!-- Header -->
      <div class="retro-header">
        <h2>👥 User Management</h2>
        <span style="font-size:10px;opacity:0.8;">Total: {{ teamUsers.length + clientUsers.length }} users</span>
      </div>

      <!-- Tabs -->
      <div class="status-tabs-bar">
        <button class="status-tab" [class.active]="activeTab === 'team'" (click)="setActiveTab('team')">
          👨‍💻 Team (Admin/Technician)
          <span class="tab-count">{{ teamUsers.length }}</span>
        </button>
        <button class="status-tab" [class.active]="activeTab === 'users'" (click)="setActiveTab('users')">
          👤 Client Users
          <span class="tab-count">{{ clientUsers.length }}</span>
        </button>
      </div>

     <!-- Filters - Only show for Client Users tab -->
<div class="filter-bar" *ngIf="activeTab === 'users'">
  <div class="filter-group">
    <label>Branch:</label>
    <select class="retro-select" [(ngModel)]="filterBranch" (change)="onBranchChange()">
      <option value="">All Branches</option>
      <option *ngFor="let branch of branches" [value]="branch.id">
        🏢 {{ branch.name }}
        <ng-container *ngIf="branch.company_name"> — {{ branch.company_name }}</ng-container>
      </option>
    </select>
  </div>
  <div class="filter-group">
    <label>Department:</label>
    <select class="retro-select" [(ngModel)]="filterDepartment" (change)="applyFilters()">
      <option value="">All Departments</option>
      <option *ngFor="let dept of filteredDepartments" [value]="dept.id">{{ dept.name }}</option>
    </select>
  </div>
  <div class="filter-group search-group">
    <label>Search:</label>
    <input type="text" class="retro-input" placeholder="Name, username, email..." 
           [(ngModel)]="searchTerm" (input)="applyFilters()">
  </div>
  <button class="retro-btn" (click)="clearFilters()">
    <span>🔄</span> Clear
  </button>
</div>

      <!-- Simple Search for Team tab -->
      <div class="filter-bar" *ngIf="activeTab === 'team'">
        <div class="filter-group search-group">
          <label>Search:</label>
          <input type="text" class="retro-input" placeholder="Name, username, email..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        <button class="retro-btn" (click)="clearFilters()">
          <span>🔄</span> Clear
        </button>
      </div>

      <!-- Summary Bar -->
      <div class="retro-status-bar">
        <span>Showing: {{ activeTab === 'team' ? paginatedTeamUsers.length : paginatedClientUsers.length }} of {{ activeTab === 'team' ? filteredTeamUsers.length : filteredClientUsers.length }} users</span>
        <span *ngIf="filterBranch && activeTab === 'users'">| Branch: <strong>{{ getBranchName(filterBranch) }}</strong></span>
        <span *ngIf="filterDepartment && activeTab === 'users'">| Dept: <strong>{{ getDeptName(filterDepartment) }}</strong></span>
      </div>

      <!-- Team Table (users table) -->
      <div class="retro-table-container" *ngIf="activeTab === 'team'">
        <table class="retro-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Avatar</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Email</th>
              <th>Status</th>
              <th *ngIf="canManageUsers">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of paginatedTeamUsers">
              <td>{{ user.id }}</td>
            <td>
 <div class="user-avatar-sm" 
     [style.background]="user.avatar_color || '#3b82f6'"
     [class.clickable-avatar]="canViewProfile"
     (click)="openProfileModal(user, 'users')"
     [title]="canViewProfile ? 'Click to view profile' : ''">
    <img *ngIf="user.photo_url" [src]="apiUrl + user.photo_url" class="avatar-img">
    <span *ngIf="!user.photo_url">{{ user.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
  </div>
</td>
              <td>{{ user.username }}</td>
              <td>{{ user.fullname }}</td>
              <td>
                <span class="role-badge" [class]="'role-' + (user.role || '').toLowerCase()">{{ user.role | titlecase }}</span>
              </td>
              <td>{{ user.department || '—' }}</td>
              <td>{{ getBranchName(user.branch_id) || '—' }}</td>
              <td>{{ user.email || '—' }}</td>
              <td>
                <div class="status-with-dot">
                  <span class="status-dot" [class]="getStatusClass(user)"></span>
                  <span class="status-text" [class]="getStatusClass(user)">{{ getAvailabilityStatus(user) }}</span>
                </div>
              </td>
              <td class="action-cell" *ngIf="canManageUsers">
                <span *ngIf="currentUser?.id === user.id" class="you-label">You</span>
                <!-- Admin user - no actions for non-admin managers -->
                <ng-container *ngIf="currentUser?.id !== user.id && user.role === 'admin'">
                  <span class="you-label">Admin</span>
                </ng-container>
                <!-- Non-admin team users - Head/Manager has full access, Supervisor no delete -->
                <ng-container *ngIf="currentUser?.id !== user.id && user.role !== 'admin'">
                  <button class="action-btn" *ngIf="canEditUsers" (click)="editUser(user, 'users')" title="Edit">✏️</button>
                  <button class="action-btn" *ngIf="canEditUsers" (click)="resetPassword(user, 'users')" title="Reset Password">🔑</button>
                  <button class="action-btn lock-btn" (click)="toggleLockUser(user, 'users')" [title]="user.locked_until ? 'Unlock' : 'Lock'">
                    {{ user.locked_until ? '🗝️' : '🔒' }}
                  </button>
                  <button class="action-btn delete-btn" *ngIf="canDeleteUsers" (click)="deleteUser(user, 'users')" title="Delete">🗑️</button>
                </ng-container>
              </td>
            </tr>
            <tr *ngIf="filteredTeamUsers.length === 0">
              <td [attr.colspan]="canManageUsers ? 10 : 9" class="empty-row">No team members found</td>
            </tr>
          </tbody>
        </table>
        <div class="pagination-bar" *ngIf="teamTotalPages > 1">
          <button class="page-btn" (click)="goToPage('team', teamPage - 1)" [disabled]="teamPage === 1">◀ Prev</button>
          <span class="page-info">Page {{ teamPage }} of {{ teamTotalPages }}</span>
          <button class="page-btn" (click)="goToPage('team', teamPage + 1)" [disabled]="teamPage === teamTotalPages">Next ▶</button>
        </div>
      </div>

     <!-- Client Users Table (new_user table) - Organized by Branch/Department -->
<div class="retro-table-container" *ngIf="activeTab === 'users'">
  <table class="retro-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Avatar</th>
        <th>Username</th>
        <th>Full Name</th>
        <th>Role</th>
        <th>Department</th>
        <th>Branch</th>
        <th>Email</th>
        <th>Reg Key</th>
        <th>Status</th>
        <th *ngIf="canManageUsers">Actions</th>
      </tr>
    </thead>
    <tbody>
      <ng-container *ngFor="let branchGroup of groupedClientUsers">
        <!-- Branch Header Row -->
        <tr class="branch-group-header">
          <td [attr.colspan]="canManageUsers ? 11 : 10" style="background:#e8edf8; font-weight:bold; text-align:left; padding:8px;">
            🏢 {{ branchGroup.branchName }} 
            <!-- ✅ Count total users in this branch across all departments -->
            <span style="color:#888; font-weight:normal;">
              ({{ getBranchUserCount(branchGroup) }} users)
            </span>
          </td>
        </tr>
        <!-- Department sub-groups within branch -->
        <ng-container *ngFor="let deptGroup of branchGroup.departments">
          <!-- Only show dept header if there are multiple departments -->
          <tr class="dept-group-header" *ngIf="branchGroup.departments.length > 1">
            <td [attr.colspan]="canManageUsers ? 11 : 10" style="background:#f0f4f8; font-weight:600; text-align:left; padding:6px 8px 6px 24px;">
              📂 {{ deptGroup.deptName }}
              <span style="color:#888; font-weight:normal;">({{ deptGroup.users.length }} users)</span>
            </td>
          </tr>
          <!-- Users in this department -->
          <tr *ngFor="let user of deptGroup.users">
            <td>{{ user.id }}</td>
           <td>
  <div class="user-avatar-sm" 
       [style.background]="user.avatar_color || '#3b82f6'"
       [class.clickable-avatar]="canViewProfile"
       (click)="onAvatarClick(user, 'new_user')"
       [title]="canViewProfile ? 'Click to view profile' : ''">
    <img *ngIf="user.photo_url" [src]="apiUrl + user.photo_url" class="avatar-img">
    <span *ngIf="!user.photo_url">{{ user.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
  </div>
</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullname }}</td>
            <td>{{ user.role || '—' }}</td>
            <td>{{ user.department || '—' }}</td>
            <td>{{ getBranchName(user.branch_id) || '—' }}</td>
            <td>{{ user.email || '—' }}</td>
            <td><code class="key-code">{{ user.registration_key || '—' }}</code></td>
            <td>
              <div class="status-with-dot">
                <span class="status-dot" [class]="getClientStatusClass(user)"></span>
                <span class="status-text" [class]="getClientStatusClass(user)">{{ getClientAvailabilityStatus(user) }}</span>
              </div>
            </td>
           <td class="action-cell" *ngIf="canManageUsers">
  <ng-container *ngIf="canEditUsers">
    <button class="action-btn" (click)="editUser(user, 'new_user')" title="Edit">✏️</button>
    <button class="action-btn" (click)="resetPassword(user, 'new_user')" title="Reset Password">🔑</button>
  </ng-container>
  <button class="action-btn lock-btn" *ngIf="canLockUsers" (click)="toggleLockUser(user, 'new_user')" [title]="user.locked_until ? 'Unlock' : 'Lock'">
    {{ user.locked_until ? '🗝️' : '🔒' }}
  </button>
  <button class="action-btn delete-btn" *ngIf="canDeleteUsers" (click)="deleteUser(user, 'new_user')" title="Delete">🗑️</button>
</td>
          </tr>
        </ng-container>
      </ng-container>
      <tr *ngIf="filteredClientUsers.length === 0">
        <td [attr.colspan]="canManageUsers ? 11 : 10" class="empty-row">No users found</td>
      </tr>
    </tbody>
  </table>
  <!-- ✅ Pagination for client users -->
  <div class="pagination-bar" *ngIf="clientTotalPages > 1">
    <button class="page-btn" (click)="goToPage('users', clientPage - 1)" [disabled]="clientPage === 1">◀ Prev</button>
    <span class="page-info">Page {{ clientPage }} of {{ clientTotalPages }}</span>
    <button class="page-btn" (click)="goToPage('users', clientPage + 1)" [disabled]="clientPage === clientTotalPages">Next ▶</button>
  </div>
</div>
    </div>
    <!-- Edit User Modal -->
<div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
  <div class="modal-window" id="editUserModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event, 'editUserModal')">
      <span>✏️ Edit User: {{ editUserData?.username }}</span>
      <button type="button" (click)="closeEditModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-field">
          <label>Username</label>
          <input type="text" class="classic-input" [(ngModel)]="editForm.username">
        </div>
        <div class="form-field">
          <label>Full Name</label>
          <input type="text" class="classic-input" [(ngModel)]="editForm.fullname">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Email</label>
          <input type="email" class="classic-input" [(ngModel)]="editForm.email">
        </div>
        <div class="form-field">
          <label>Branch</label>
          <input type="text" class="classic-input readonly-input" [value]="getBranchName(editUserData?.branch_id)" disabled>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Department</label>
          <input type="text" class="classic-input readonly-input" [(ngModel)]="editForm.department" disabled>
        </div>
        <div class="form-field">
          <label>Role</label>
          <input type="text" class="classic-input readonly-input" [(ngModel)]="editForm.role" disabled>
        </div>
      </div>
      <div class="form-row" *ngIf="editTable === 'users'">
        <div class="form-field">
          <label>Avatar Color</label>
          <input type="color" class="classic-input" [(ngModel)]="editForm.avatar_color" style="height:32px; padding:2px;">
        </div>
        <div class="form-field"></div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeEditModal()">Cancel</button>
        <button class="retro-btn primary" (click)="saveUser()" [disabled]="saving">
          {{ saving ? 'Saving...' : '💾 Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</div>
    <!-- Reset Password Modal - FIXED -->
    <div class="modal-overlay" *ngIf="showPasswordModal" (click)="closePasswordModal()">
  <div class="modal-window" id="resetPasswordModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event, 'resetPasswordModal')">
      <span>🔑 Reset Password: {{ resetPasswordUser?.username }}</span>
      <button type="button" (click)="closePasswordModal()" class="modal-close">✕</button>
    </div>
        <div class="modal-body">
          <div class="form-field">
            <label>New Password</label>
            <input type="password" class="classic-input" [(ngModel)]="resetPasswordInput" placeholder="Enter new password" autocomplete="off">
          </div>
          <div class="form-field">
            <label>Confirm Password</label>
            <input type="password" class="classic-input" [(ngModel)]="confirmPasswordInput" placeholder="Confirm new password" autocomplete="off">
          </div>
          <div class="modal-actions">
            <button class="retro-btn" (click)="closePasswordModal()" [disabled]="isResetting">Cancel</button>
            <button class="retro-btn primary" (click)="confirmResetPassword()" [disabled]="isResetting || !resetPasswordInput || !confirmPasswordInput">
              {{ isResetting ? '⏳ Resetting...' : '🔑 Reset Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lock/Unlock Confirmation Modal -->
  <div class="modal-overlay" *ngIf="showLockModal" (click)="closeLockModal()">
  <div class="modal-window" id="lockModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" 
         [class.warning]="!lockUserData?.locked_until" 
         [class.success]="lockUserData?.locked_until"
         (mousedown)="startDrag($event, 'lockModal')">
      <span>{{ lockUserData?.locked_until ? '🔓 Unlock User' : '🔒 Lock User' }}</span>
      <button type="button" (click)="closeLockModal()" class="modal-close">✕</button>
    </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">{{ lockUserData?.locked_until ? '🔓' : '🔒' }}</span>
            <div class="warning-message">
              <h3>{{ lockUserData?.locked_until ? 'Unlock' : 'Lock' }} user account?</h3>
              <p>User: <strong>{{ lockUserData?.fullname }}</strong> ({{ lockUserData?.username }})</p>
              <p class="warning-hint" [class.danger-text]="!lockUserData?.locked_until" [class.success]="lockUserData?.locked_until">
                {{ lockUserData?.locked_until ? 
                   'This will restore access for this user. They will be able to log in again.' : 
                   'This will temporarily prevent the user from logging in for 30 minutes.' }}
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="retro-btn" (click)="closeLockModal()">Cancel</button>
            <button class="retro-btn" [class.primary]="lockUserData?.locked_until" [class.danger]="!lockUserData?.locked_until" (click)="confirmLockAction()">
              {{ lockUserData?.locked_until ? '🔓 Yes, Unlock' : '🔒 Yes, Lock' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
   <div class="modal-overlay" *ngIf="showDeleteUserModal" (click)="closeDeleteUserModal()">
  <div class="modal-window" id="deleteUserModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar danger" (mousedown)="startDrag($event, 'deleteUserModal')">
      <span>🗑️ Delete User</span>
      <button type="button" (click)="closeDeleteUserModal()" class="modal-close">✕</button>
    </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Permanently delete this user?</h3>
              <p>User: <strong>{{ deleteUserData?.fullname }}</strong> ({{ deleteUserData?.username }})</p>
              <p class="warning-hint danger-text">This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="retro-btn" (click)="closeDeleteUserModal()">Cancel</button>
            <button class="retro-btn danger" (click)="confirmDeleteUser()">🗑️ Yes, Delete</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Custom Notification Modal -->
<div class="modal-overlay" *ngIf="showNotificationModal" (click)="closeNotificationModal()">
  <div class="modal-window notification-modal" id="notificationModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" [class]="notificationType" (mousedown)="startDrag($event, 'notificationModal')">
      <span>{{ notificationTitle }}</span>
      <button type="button" (click)="closeNotificationModal()" class="modal-close">✕</button>
    </div>
        <div class="modal-body">
            <div class="notification-content">
                <div class="notification-icon" [class]="notificationType">
                    <span *ngIf="notificationType === 'success'">✅</span>
                    <span *ngIf="notificationType === 'error'">❌</span>
                    <span *ngIf="notificationType === 'warning'">⚠️</span>
                    <span *ngIf="notificationType === 'info'">ℹ️</span>
                </div>
                <div class="notification-message">
                    <p>{{ notificationMessage }}</p>
                    <p *ngIf="notificationDetails" class="notification-details">{{ notificationDetails }}</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="retro-btn primary" (click)="closeNotificationModal()">OK</button>
                <button *ngIf="notificationType === 'error' && errorDetails" class="retro-btn" (click)="copyErrorDetails()">
                    📋 Copy Details
                </button>
            </div>
        </div>
    </div>
</div>
<!-- User Profile Modal -->
<div class="modal-overlay" *ngIf="showProfileModal" (click)="closeProfileModal()">
  <div class="modal-window profile-modal" id="profileModal" (click)="$event.stopPropagation()">
    <div class="modal-titlebar" (mousedown)="startDrag($event, 'profileModal')">
      <span>👤 User Profile: {{ profileUser?.fullname }}</span>
      <button type="button" (click)="closeProfileModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body profile-body">
      <div class="profile-header">
        <!-- Avatar -->
        <div class="profile-avatar-lg" [style.background]="profileUser?.avatar_color || '#0a3a8c'">
          <img *ngIf="profileUser?.photo_url" [src]="apiUrl + profileUser.photo_url" class="profile-avatar-img">
          <span *ngIf="!profileUser?.photo_url" class="profile-avatar-text">
            {{ profileUser?.fullname?.charAt(0)?.toUpperCase() || '?' }}
          </span>
        </div>
        <div class="profile-header-info">
          <h3>{{ profileUser?.fullname || '—' }}</h3>
          <span class="profile-role-badge" [class]="'role-' + (profileUser?.role || '').toLowerCase()">
            {{ profileUser?.role || '—' }}
          </span>
          <span class="profile-status" [class.active]="!profileUser?.locked_until" [class.locked]="profileUser?.locked_until">
            {{ profileUser?.locked_until ? '🔒 Locked' : '🟢 Active' }}
          </span>
        </div>
      </div>

      <div class="profile-divider"></div>

      <!-- Profile Details Grid -->
      <div class="profile-details-grid">
        <div class="profile-field">
          <label>Username</label>
          <span>{{ profileUser?.username || '—' }}</span>
        </div>
        <div class="profile-field">
          <label>Email</label>
          <span>{{ profileUser?.email || '—' }}</span>
        </div>
        <div class="profile-field">
          <label>Department</label>
          <span>{{ profileUser?.department || '—' }}</span>
        </div>
        <div class="profile-field">
          <label>Branch</label>
          <span>🏢 {{ getBranchName(profileUser?.branch_id) || '—' }}</span>
        </div>
        <div class="profile-field">
          <label>Role</label>
          <span>{{ profileUser?.role || '—' }}</span>
        </div>
        <div class="profile-field">
          <label>User ID</label>
          <span><code>#{{ profileUser?.id }}</code></span>
        </div>
        <div class="profile-field">
          <label>Account Type</label>
          <span>{{ profileTable === 'users' ? '👨‍💻 Team (Admin/Technician)' : '👤 Client User' }}</span>
        </div>
        <div class="profile-field">
          <label>Registered</label>
          <span>{{ profileUser?.created_at | date:'MMM d, yyyy h:mm a' }}</span>
        </div>
        
        <!-- Client-specific fields -->
        <ng-container *ngIf="profileTable === 'new_user'">
          <div class="profile-field">
            <label>Registration Key</label>
            <span><code class="key-code">{{ profileUser?.registration_key || '—' }}</code></span>
          </div>
          <div class="profile-field">
            <label>Verified</label>
            <span>{{ profileUser?.is_verified ? '✅ Yes' : '❌ No' }}</span>
          </div>
        </ng-container>

        <!-- Lock Status -->
        <div class="profile-field full-width" *ngIf="profileUser?.locked_until">
          <label>Locked Until</label>
          <span class="locked-info">🔒 {{ profileUser?.locked_until | date:'MMM d, yyyy h:mm a' }}</span>
        </div>

        <!-- Failed Attempts -->
        <div class="profile-field" *ngIf="profileUser?.failed_attempts > 0">
          <label>Failed Login Attempts</label>
          <span class="failed-attempts">⚠️ {{ profileUser?.failed_attempts }}</span>
        </div>
      </div>

      <!-- Team-specific working hours -->
      <ng-container *ngIf="profileTable === 'users'">
        <div class="profile-divider"></div>
        <h4 class="profile-section-title">🕐 Working Schedule</h4>
        <div class="profile-details-grid">
          <div class="profile-field">
            <label>Work Hours</label>
            <span>{{ profileUser?.workStart || '—' }} - {{ profileUser?.workEnd || '—' }}</span>
          </div>
          <div class="profile-field">
            <label>Lunch Break</label>
            <span>{{ profileUser?.lunchStart || '—' }} - {{ profileUser?.lunchEnd || '—' }}</span>
          </div>
          <div class="profile-field">
            <label>Day Off</label>
            <span>{{ profileUser?.dayOff || '—' }}</span>
          </div>
        </div>
      </ng-container>
    </div>
    <div class="modal-footer">
      <button class="retro-btn" (click)="closeProfileModal()">Close</button>
      <button class="retro-btn primary" *ngIf="canEditUsers && profileUser?.id !== currentUser?.id && profileUser?.role !== 'admin'" 
              (click)="closeProfileModal(); editUser(profileUser, profileTable)">
        ✏️ Edit User
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .user-mgmt-container { padding: 8px; background: #d4d0c8; min-height: 100%; }
    
    .retro-header {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 10px;
      background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%);
      color: #fff;
      border: 2px solid; border-color: #fff #808080 #808080 #fff;
      margin-bottom: 8px;
    }
    .retro-header h2 { margin: 0; font-size: 13px; flex: 1; }

    .status-tabs-bar {
      display: flex; gap: 2px; padding: 4px 6px;
      background: #e8e8e8; border: 2px solid;
      border-color: #808080 #fff #fff #808080; margin-bottom: 4px;
    }
    .status-tab {
      background: #d4d0c8; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px 2px 0 0; padding: 4px 16px;
      cursor: pointer; font-size: 11px; color: #333;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .status-tab:hover { background: #e8e8e8; }
    .status-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; border-bottom-color: #fff; }
    .tab-count { background: #999; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 9px; }
    .status-tab.active .tab-count { background: #0a3a8c; }

    .filter-bar {
      background: #f0f0f0; border: 2px solid;
      border-color: #fff #808080 #808080 #fff; padding: 4px 8px;
      display: flex; gap: 12px; align-items: center; margin-bottom: 6px;
    }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 10px; font-weight: bold; }
    .retro-input { padding: 2px 6px; border: 1px solid #808080; font-size: 10px; width: 200px; }
    .retro-btn {
      background: #f0f0f0; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px; padding: 3px 12px;
      cursor: pointer; font-size: 10px; color: #000;
    }
    .retro-btn:hover { background: #e8f0ff; }
    .retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .retro-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .retro-table-container {
      border: 2px solid; border-color: #fff #808080 #808080 #fff;
      background: #f0f0f0; overflow-x: auto;
    }
    .retro-table { width: 100%; border-collapse: collapse; font-size: 10px; background: #fff; }
    .retro-table th {
      background: linear-gradient(180deg, #1c5fb5, #0a3a8c);
      color: #fff; padding: 4px 8px; text-align: center;
      font-weight: bold; font-size: 10px; border-bottom: 1px solid #808080;
    }
    .retro-table td { padding: 6px 8px; text-align: center; border-bottom: 1px solid #ddd; color: #000000; }
    
    .user-avatar-sm {
      width: 28px; height: 28px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 12px; overflow: hidden;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }

    .role-badge {
      padding: 1px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase;
    }
    .role-admin { background: #ffecec; color: #cc0000; }
    .role-technician { background: #eeffee; color: #008800; }
    .role-user { background: #e8eeff; color: #0a3a8c; }

    .status-with-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.on-duty { background: #008800; box-shadow: 0 0 4px #008800; }
    .status-dot.lunch { background: #ffaa00; }
    .status-dot.day-off { background: #cc6600; }
    .status-dot.on-leave { background: #cc0000; }
    .status-dot.off-duty { background: #888; }
    .status-dot.locked { background: #444; }

    .status-text {
      font-size: 10px;
      font-weight: 500;
    }
    .status-text.on-duty { color: #008800; }
    .status-text.lunch { color: #cc6600; }
    .status-text.day-off { color: #cc6600; }
    .status-text.on-leave { color: #cc0000; }
    .status-text.off-duty { color: #888; }
    .status-text.locked { color: #444; }

    .action-cell { white-space: nowrap; display: flex; gap: 2px; justify-content: center; }
    .action-btn {
      background: #f0f0f0; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      cursor: pointer; font-size: 11px; padding: 1px 6px; border-radius: 2px;
    }
    .action-btn:hover { background: #e8f0ff; }

    .lock-btn { color: #886600; }
    .lock-btn:hover { background: #fffae8; }
    .delete-btn { color: #cc0000; }
    .delete-btn:hover { background: #ffecec; }

    .empty-row { text-align: center; padding: 20px; color: #888; }
    .you-label { font-weight: bold; color: #0a3a8c; font-size: 10px; font-style: italic; }

    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: #f0f0f0;
      border: 2px solid;
      border-color: #808080 #fff #fff #808080;
      margin-top: 4px;
    }
    .page-btn {
      background: #f0f0f0;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 3px 12px;
      cursor: pointer;
      font-size: 10px;
      color: #000;
    }
      .modal-titlebar {
  cursor: grab;
  user-select: none;
}
.modal-titlebar:active {
  cursor: grabbing;
}
      /* Clickable Avatar */
.clickable-avatar {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.clickable-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(10,36,106,0.4);
}

/* Profile Modal */
.profile-modal {
  max-width: 550px;
}
.profile-body {
  max-height: 65vh;
  overflow-y: auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}
.profile-avatar-lg {
  width: 72px; height: 72px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: white;
  flex-shrink: 0; overflow: hidden;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}
.profile-avatar-img {
  width: 100%; height: 100%; object-fit: cover;
}
.profile-avatar-text {
  user-select: none;
}
.profile-header-info h3 {
  margin: 0 0 4px 0; font-size: 16px; color: #1a1d24;
}
.profile-role-badge {
  display: inline-block;
  padding: 2px 8px; border-radius: 3px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  margin-right: 6px;
}
.profile-status {
  font-size: 10px; font-weight: 600;
}
.profile-status.active { color: #008800; }
.profile-status.locked { color: #cc0000; }

.profile-divider {
  height: 1px; background: #ddd; margin: 14px 0;
}
.profile-section-title {
  margin: 0 0 10px 0; font-size: 12px; color: #0a3a8c;
}

.profile-details-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.profile-field {
  display: flex; flex-direction: column; gap: 2px;
}
.profile-field.full-width {
  grid-column: 1 / -1;
}
.profile-field label {
  font-size: 9px; font-weight: 700; color: #888;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.profile-field span {
  font-size: 12px; color: #333; font-weight: 500;
}
.locked-info { color: #cc0000 !important; }
.failed-attempts { color: #cc6600 !important; font-weight: 700 !important; }
    .page-btn:hover { background: #e8f0ff; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 10px; color: #333; font-weight: bold; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); min-width: 400px; max-width: 500px; }
    .modal-titlebar { background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; }
    .modal-titlebar.warning { background: linear-gradient(180deg, #cc7700 0%, #884400 100%); }
    .modal-titlebar.success { background: linear-gradient(180deg, #008800 0%, #006600 100%); }
    .modal-titlebar.danger { background: linear-gradient(180deg, #cc0000 0%, #880000 100%); }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
    .modal-body { padding: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
    .form-field { margin-bottom: 8px; }
    .form-field label { display: block; font-size: 10px; font-weight: bold; margin-bottom: 4px; color: #020202; }
    .classic-input { width: 100%; padding: 5px 7px; border: 1px solid #808080; font-size: 11px; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }

    .warning-content { display: flex; gap: 16px; align-items: flex-start; }
    .warning-icon { font-size: 40px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 8px 0; font-size: 13px; color: #000; font-weight: bold; }
    .warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
    .warning-hint { font-size: 10px; padding: 6px 10px; border-radius: 3px; margin-top: 8px; }
    .warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; }
    .warning-hint.success { color: #006600; background: #eeffee; border: 1px solid #88cc88; }

    .retro-btn.danger { background: #cc0000; color: #fff; border-color: #ff4444 #880000 #880000 #ff4444; }
    .retro-btn.danger:hover { background: #aa0000; }
     .notification-modal {
        max-width: 450px;
    }
    /* Status Bar */
.retro-status-bar {
    color: #333;

}
    /* Branch & Department Group Headers */
.branch-group-header td {
  background: #e8edf8 !important;
  font-weight: bold;
  text-align: left;
  padding: 8px !important;
  border-bottom: 2px solid #c0d0e8 !important;
}

.dept-group-header td {
  background: #f0f4f8 !important;
  font-weight: 600;
  text-align: left;
  padding: 6px 8px 6px 24px !important;
  border-bottom: 1px solid #d0d8e8 !important;
}

.key-code {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  background: #f5f5f5;
  padding: 2px 5px;
  border-radius: 2px;
  color: #0a3a8c;
}
    .notification-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding: 10px 0;
    }
    
    .notification-icon {
        font-size: 48px;
        flex-shrink: 0;
    }
    
    .notification-icon.success {
        color: #28a745;
    }
    
    .notification-icon.error {
        color: #dc3545;
    }
    
    .notification-icon.warning {
        color: #ffc107;
    }
    
    .notification-icon.info {
        color: #17a2b8;
    }
    
    .notification-message {
        flex: 1;
    }
    
    .notification-message p {
        margin: 0 0 8px 0;
        font-size: 13px;
        line-height: 1.4;
        color: #333;
        white-space: pre-wrap;
    }
    
    .notification-details {
        font-size: 11px;
        color: #666;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        max-height: 150px;
        overflow: auto;
    }
    /* Readonly input style */
.classic-input.readonly-input {
  background: #e8e8e8;
  color: #666;
  cursor: not-allowed;
  border-color: #a0a0a0;
}
    .modal-titlebar.success {
        background: linear-gradient(180deg, #28a745 0%, #1e7e34 100%);
    }
    
    .modal-titlebar.error {
        background: linear-gradient(180deg, #dc3545 0%, #bd2130 100%);
    }
    
    .modal-titlebar.warning {
        background: linear-gradient(180deg, #ffc107 0%, #d39e00 100%);
    }
    
    .modal-titlebar.info {
        background: linear-gradient(180deg, #17a2b8 0%, #117a8b 100%);
    }
  `]
})
export class UserManagementComponent implements OnInit {
  activeTab: 'team' | 'users' = 'team';
  teamUsers: any[] = [];
  clientUsers: any[] = [];
  filteredTeamUsers: any[] = [];
  filteredClientUsers: any[] = [];
  searchTerm = '';
  filterBranch: any = '';
  filterDepartment: any = '';
  apiUrl = environment.apiUrl;
  currentUser: any;
  isAdminUser = false;
   branches: any[] = [];
  departments: any[] = [];
  showLockModal = false;
  lockUserData: any = null;
  lockTable = '';
  canManageUsers = false;
  canEditUsers = false;
  canDeleteUsers = false;
  canLockUsers = false;  
  userRole = '';
  showDeleteUserModal = false;
  deleteUserData: any = null;
  deleteTable = '';
  filteredDepartments: any[] = [];
  teamPage = 1;
  clientPage = 1;
  pageSize = 15;
  teamTotalPages = 0;
  clientTotalPages = 0;
  paginatedTeamUsers: any[] = [];
  paginatedClientUsers: any[] = [];

  showEditModal = false;
  editUserData: any = null;
  editTable = '';
  editForm = { username: '', fullname: '', email: '', department: '', role: '', avatar_color: '#3b82f6' };
  saving = false;
// Notification modal properties
showNotificationModal = false;
notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
notificationTitle = '';
notificationMessage = '';
notificationDetails = '';
errorDetails: any = null;
  showPasswordModal = false;
  resetPasswordUser: any = null;
  resetPasswordTable = '';
  resetPasswordInput = '';
  confirmPasswordInput = '';
  isResetting = false;
  // Dragging properties
private isDragging = false;
private dragOffsetX = 0;
private dragOffsetY = 0;
private currentDragModal: HTMLElement | null = null;
// User Profile Modal
showProfileModal = false;
profileUser: any = null;
profileTable = '';
canViewProfile = false;
  constructor(private http: HttpClient, private router: Router) {}

 ngOnInit() {
    try {
      this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.isAdminUser = this.currentUser?.role === 'admin';
      this.checkPermissions();
    } catch {}
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.loadBranchesAndDepartments();
    this.loadAllUsers();
    
    setInterval(() => {
      this.applyFilters();
    }, 60000);
  }
checkPermissions() {
    const role = (this.currentUser?.role || '').toLowerCase().trim();
    this.userRole = role;
    
    switch (role) {
      case 'admin':
        this.canManageUsers = true;
        this.canEditUsers = true;
        this.canDeleteUsers = true;
        this.canLockUsers = true;
        this.canViewProfile = true;  // ✅ Admin can view profile
        break;
      
      case 'head/manager':
      case 'head manager':
        this.canManageUsers = true;
        this.canEditUsers = true;
        this.canDeleteUsers = true;
        this.canLockUsers = false;
        this.canViewProfile = true;  // ✅ Head/Manager can view profile
        break;
      
      case 'supervisor':
        this.canManageUsers = true;
        this.canEditUsers = true;
        this.canDeleteUsers = false;
        this.canLockUsers = true;
        this.canViewProfile = false; // ❌ Supervisor cannot view profile
        break;
      
      case 'branch manager':
        this.canManageUsers = true;
        this.canEditUsers = true;
        this.canDeleteUsers = false;
        this.canLockUsers = true;
        this.canViewProfile = false; // ❌ Branch Manager cannot view profile
        break;
      
      case 'technician':
        this.canManageUsers = true;
        this.canEditUsers = false;
        this.canDeleteUsers = false;
        this.canLockUsers = false;
        this.canViewProfile = false; // ❌ Technician cannot view profile
        break;
      
      default:
        this.canManageUsers = false;
        this.canEditUsers = false;
        this.canDeleteUsers = false;
        this.canLockUsers = false;
        this.canViewProfile = false;
        break;
    }
    
    console.log('🔑 Permissions:', {
      role: this.userRole,
      canManage: this.canManageUsers,
      canEdit: this.canEditUsers,
      canDelete: this.canDeleteUsers,
      canLock: this.canLockUsers,
      canViewProfile: this.canViewProfile
    });
}
// ✅ Group client users by branch and department
get groupedClientUsers(): any[] {
  const groups: any[] = [];
  const branchMap = new Map<number, any>();
  
  // Sort users by branch then department
  const sortedUsers = [...this.filteredClientUsers].sort((a: any, b: any) => {
    const branchA = this.getBranchName(a.branch_id) || '';
    const branchB = this.getBranchName(b.branch_id) || '';
    if (branchA !== branchB) return branchA.localeCompare(branchB);
    const deptA = a.department || '';
    const deptB = b.department || '';
    return deptA.localeCompare(deptB);
  });
  
  // Group by branch
  sortedUsers.forEach((user: any) => {
    const branchId = user.branch_id || 0;
    const branchName = this.getBranchName(user.branch_id) || 'Unassigned';
    
    if (!branchMap.has(branchId)) {
      branchMap.set(branchId, {
        branchId,
        branchName,
        departments: new Map<string, any[]>()
      });
    }
    
    const branchGroup = branchMap.get(branchId)!;
    const deptName = user.department || 'Unassigned';
    
    if (!branchGroup.departments.has(deptName)) {
      branchGroup.departments.set(deptName, []);
    }
    branchGroup.departments.get(deptName)!.push(user);
  });
  
  // Convert maps to arrays with proper type annotations
  branchMap.forEach((branchGroup: any) => {
    const departments: any[] = [];
    branchGroup.departments.forEach((users: any[], deptName: string) => {
      departments.push({ deptName, users });
    });
    groups.push({
      branchId: branchGroup.branchId,
      branchName: branchGroup.branchName,
      departments
    });
  });
  
  return groups;
}
// ✅ Helper to count total users in a branch group
getBranchUserCount(branchGroup: any): number {
  let count = 0;
  if (branchGroup.departments) {
    branchGroup.departments.forEach((dept: any) => {
      count += dept.users?.length || 0;
    });
  }
  return count;
}
openProfileModal(user: any, table: string) {
  console.log('🖱️ Avatar clicked!', { user: user.fullname, table, canViewProfile: this.canViewProfile });
  this.profileUser = user;
  this.profileTable = table;
  this.showProfileModal = true;
}

closeProfileModal() {
  this.showProfileModal = false;
  this.profileUser = null;
}
// Draggable Modal Methods
startDrag(event: MouseEvent, modalId: string) {
  const target = event.currentTarget as HTMLElement;
  if (!target.closest('.modal-titlebar')) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  this.isDragging = true;
  this.currentDragModal = modal;
  
  const rect = modal.getBoundingClientRect();
  this.dragOffsetX = event.clientX - rect.left;
  this.dragOffsetY = event.clientY - rect.top;
  
  modal.style.cursor = 'grabbing';
  modal.style.transition = 'none';
  modal.style.position = 'fixed';
  modal.style.left = rect.left + 'px';
  modal.style.top = rect.top + 'px';
  modal.style.transform = 'none';
  
  event.preventDefault();
}

onDragMove(event: MouseEvent) {
  if (!this.isDragging || !this.currentDragModal) return;
  
  const x = event.clientX - this.dragOffsetX;
  const y = event.clientY - this.dragOffsetY;
  
  this.currentDragModal.style.left = x + 'px';
  this.currentDragModal.style.top = y + 'px';
}

onDragEnd() {
  if (this.currentDragModal) {
    this.currentDragModal.style.cursor = '';
    this.currentDragModal.style.transition = '';
  }
  this.isDragging = false;
  this.currentDragModal = null;
}
onAvatarClick(user: any, table: string) {
  if (this.canViewProfile) {
    this.openProfileModal(user, table);
  }
}
  loadBranchesAndDepartments() {
    const headers = this.getHeaders();
    
    // Load branches
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/branches`, { headers }).subscribe({
      next: (data) => {
        this.branches = data || [];
        console.log('✅ Branches loaded:', this.branches.length);
      },
      error: (err) => console.error('Error loading branches:', err)
    });
    
    // Load all departments initially
    this.loadDepartments();
  }
  loadDepartments(branchId?: number) {
    const headers = this.getHeaders();
    let url = `${environment.apiUrl}/api/departments`; // Changed from /api/admin/departments
    if (branchId) {
      url += `?branch_id=${branchId}`;
    }
    
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => {
        this.departments = data || [];
        // Initially show all departments
        if (!branchId) {
          this.filteredDepartments = [...this.departments];
        } else {
          this.filteredDepartments = data || [];
        }
        console.log('✅ Departments loaded:', this.filteredDepartments.length);
      },
      error: (err) => console.error('Error loading departments:', err)
    });
}
 onBranchChange() {
    this.filterDepartment = ''; // Reset department filter
    if (this.filterBranch) {
      this.loadDepartments(this.filterBranch);
    } else {
      this.filteredDepartments = [...this.departments];
    }
    this.applyFilters();
  }
  getBranchName(branchId: number | null): string {
    if (!branchId) return '—';
    const branch = this.branches.find(b => b.id === branchId);
    return branch?.name || `Branch #${branchId}`;
  }

  getDeptName(deptId: number | null): string {
    if (!deptId) return '—';
    const dept = this.departments.find(d => d.id === deptId);
    return dept?.name || `Dept #${deptId}`;
  }
 clearFilters() {
    this.searchTerm = '';
    this.filterBranch = '';
    this.filterDepartment = '';
    this.filteredDepartments = [...this.departments];
    this.applyFilters();
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    
    // Filter team users (no branch/department filter for team)
    this.filteredTeamUsers = this.teamUsers.filter(u => {
      const matchesSearch = !term || 
        u.username?.toLowerCase().includes(term) || 
        u.fullname?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term);
      return matchesSearch;
    });
    
    // Filter client users (with branch and department)
    this.filteredClientUsers = this.clientUsers.filter(u => {
      const matchesSearch = !term || 
        u.username?.toLowerCase().includes(term) || 
        u.fullname?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term);
      const matchesBranch = !this.filterBranch || u.branch_id == this.filterBranch;
      const matchesDept = !this.filterDepartment || u.department_id == this.filterDepartment;
      return matchesSearch && matchesBranch && matchesDept;
    });
    
    this.teamTotalPages = Math.ceil(this.filteredTeamUsers.length / this.pageSize);
    this.clientTotalPages = Math.ceil(this.filteredClientUsers.length / this.pageSize);
    this.teamPage = 1;
    this.clientPage = 1;
    this.updatePaginatedLists();
  }

  parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    let hours = 0, minutes = 0;
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0]);
      minutes = parseInt(parts[1]);
    } else {
      hours = parseInt(timeStr);
    }
    if (timeStr.toLowerCase().includes('pm') && hours < 12) hours += 12;
    if (timeStr.toLowerCase().includes('am') && hours === 12) hours = 0;
    return hours + minutes / 60;
  }

  getAvailabilityStatus(user: any): string {
    // Check if locked
    if (user.locked_until) {
      return 'Locked';
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;
    const currentDay = now.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[currentDay];

    // Check if on leave
    if (user.leaveEntries) {
      try {
        const leaves = JSON.parse(user.leaveEntries);
        const today = now.toISOString().split('T')[0];
        const onLeave = leaves.some((leave: any) => {
          const leaveDate = new Date(leave.date).toISOString().split('T')[0];
          return leaveDate === today && leave.status === 'approved';
        });
        if (onLeave) return 'On Leave';
      } catch (e) {}
    }

    // Check day off
    if (user.dayOff) {
      try {
        const dayOffs = JSON.parse(user.dayOff);
        if (dayOffs.includes(todayName)) return 'Day Off';
      } catch (e) {}
    }

    // Check working hours
    const hasWorkHours = user.workStart && user.workEnd;
    let isWorkingHour = false;
    if (hasWorkHours) {
      const workStart = this.parseTime(user.workStart);
      const workEnd = this.parseTime(user.workEnd);
      isWorkingHour = currentTime >= workStart && currentTime <= workEnd;
    } else {
      isWorkingHour = currentTime >= 9 && currentTime <= 17;
    }

    if (!isWorkingHour) return 'Off Duty';

    // Check lunch break
    if (user.lunchStart && user.lunchEnd) {
      const lunchStart = this.parseTime(user.lunchStart);
      const lunchEnd = this.parseTime(user.lunchEnd);
      if (currentTime >= lunchStart && currentTime <= lunchEnd) return 'Lunch Break';
    }

    return 'On Duty';
  }

  getStatusClass(user: any): string {
    const status = this.getAvailabilityStatus(user);
    if (status === 'On Duty') return 'on-duty';
    if (status === 'Lunch Break') return 'lunch';
    if (status === 'Day Off') return 'day-off';
    if (status === 'On Leave') return 'on-leave';
    if (status === 'Locked') return 'locked';
    return 'off-duty';
  }

  getClientAvailabilityStatus(user: any): string {
    if (user.locked_until) return 'Locked';
    return 'Active';
  }

  getClientStatusClass(user: any): string {
    if (user.locked_until) return 'locked';
    return 'on-duty';
  }

  updatePaginatedLists() {
    const teamStart = (this.teamPage - 1) * this.pageSize;
    this.paginatedTeamUsers = this.filteredTeamUsers.slice(teamStart, teamStart + this.pageSize);
    const clientStart = (this.clientPage - 1) * this.pageSize;
    this.paginatedClientUsers = this.filteredClientUsers.slice(clientStart, clientStart + this.pageSize);
  }

  goToPage(type: 'team' | 'users', page: number) {
    if (type === 'team') {
      if (page < 1 || page > this.teamTotalPages) return;
      this.teamPage = page;
    } else {
      if (page < 1 || page > this.clientTotalPages) return;
      this.clientPage = page;
    }
    this.updatePaginatedLists();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

 // In UserManagementComponent - loadAllUsers()
loadAllUsers() {
    const headers = this.getHeaders();
    console.log('🔍 Loading team users...');
    
    // ✅ Updated endpoints with /api/admin/ prefix
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (users) => {
        console.log('✅ Team users loaded:', users.length);
        this.teamUsers = users;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error loading team:', err.status, err.error);
        if (err.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/api/admin/new-users`, { headers }).subscribe({
      next: (users) => {
        console.log('✅ Client users loaded:', users.length);
        this.clientUsers = users;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => console.error('❌ Error loading client users:', err.status, err.error)
    });
}
  
   setActiveTab(tab: 'team' | 'users') {
    this.activeTab = tab;
    // Reset filters when switching tabs
    if (tab === 'team') {
      this.filterBranch = '';
      this.filterDepartment = '';
    }
    this.applyFilters();
  }

  applySearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredTeamUsers = this.teamUsers.filter(u => 
      !term || u.username?.toLowerCase().includes(term) || 
      u.fullname?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
    this.filteredClientUsers = this.clientUsers.filter(u => 
      !term || u.username?.toLowerCase().includes(term) || 
      u.fullname?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
    
    this.teamTotalPages = Math.ceil(this.filteredTeamUsers.length / this.pageSize);
    this.clientTotalPages = Math.ceil(this.filteredClientUsers.length / this.pageSize);
    this.teamPage = 1;
    this.clientPage = 1;
    this.updatePaginatedLists();
  }

  toggleLockUser(user: any, table: string) {
    this.lockUserData = user;
    this.lockTable = table;
    this.showLockModal = true;
  }

  confirmLockAction() {
    if (!this.lockUserData) return;
    const table = this.lockTable;
    const user = this.lockUserData;
    
    if (user.locked_until) {
     this.http.post(`${environment.apiUrl}/api/admin/users/${table}/${user.id}/lock`, {}, { headers: this.getHeaders() }).subscribe({
        next: () => {
          user.locked_until = null;
          user.failed_attempts = 0;
          this.closeLockModal();
          this.applySearch();
        },
        error: (err) => {
          this.closeLockModal();
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/api/admin/users/${table}/${user.id}/unlock`, {}, { headers: this.getHeaders() }).subscribe({
        next: () => {
          user.locked_until = new Date(Date.now() + 24 * 60 * 60 * 1000);
          this.closeLockModal();
          this.applySearch();
        },
        error: (err) => {
          this.closeLockModal();
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  closeLockModal() {
    this.showLockModal = false;
    this.lockUserData = null;
  }

  deleteUser(user: any, table: string) {
    this.deleteUserData = user;
    this.deleteTable = table;
    this.showDeleteUserModal = true;
  }

  confirmDeleteUser() {
    if (!this.deleteUserData) return;
   this.http.delete(`${environment.apiUrl}/api/admin/users/${this.deleteTable}/${this.deleteUserData.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.closeDeleteUserModal();
        this.loadAllUsers();
      },
      error: (err) => {
        this.closeDeleteUserModal();
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal = false;
    this.deleteUserData = null;
  }

 editUser(user: any, table: string) {
    this.editUserData = user;
    this.editTable = table;
    this.editForm = {
      username: user.username || '',
      fullname: user.fullname || '',
      email: user.email || '',
      department: user.department || '',
      role: user.role || '',
      avatar_color: user.avatar_color || '#3b82f6'
    };
    this.showEditModal = true;
}
  saveUser() {
    if (!this.editUserData) return;
    this.saving = true;
    this.http.put(`${environment.apiUrl}/api/admin/profile/${this.editTable}/${this.editUserData.id}`, this.editForm, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.loadAllUsers();
      },
      error: (err) => {
        this.saving = false;
        alert('Error saving: ' + (err.error?.message || err.message));
      }
    });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editUserData = null;
  }

  resetPassword(user: any, table: string) {
    console.log('📝 resetPassword called with:', { user: user.id, table });
    
    if (!user || !user.id) {
        alert('Invalid user data');
        return;
    }
    
    if (table !== 'users' && table !== 'new_user') {
        console.error('Invalid table name:', table);
        alert('Invalid table type');
        return;
    }
    
    this.resetPasswordUser = { ...user };
    this.resetPasswordTable = table;
    this.resetPasswordInput = '';
    this.confirmPasswordInput = '';
    this.showPasswordModal = true;
  }

confirmResetPassword() {
    console.log('🔐 confirmResetPassword called');
    
    if (!this.resetPasswordUser) {
        this.showNotification('error', 'Reset Failed', 'No user selected for password reset. Please try again.');
        this.closePasswordModal();
        return;
    }
    
    if (!this.resetPasswordUser.id) {
        this.showNotification('error', 'Reset Failed', 'Invalid user data. Please select the user again.');
        this.closePasswordModal();
        return;
    }
    
    if (!this.resetPasswordTable) {
        this.showNotification('error', 'System Error', 'Missing table reference. Please contact support.');
        this.closePasswordModal();
        return;
    }
    
    if (!this.resetPasswordInput || this.resetPasswordInput.trim() === '') {
        this.showNotification('warning', 'Invalid Input', 'Please enter a new password.');
        return;
    }
    
    if (this.resetPasswordInput !== this.confirmPasswordInput) {
        this.showNotification('warning', 'Password Mismatch', 'Passwords do not match! Please make sure both passwords are identical.');
        return;
    }
    
    if (this.resetPasswordInput.length < 6) {
        this.showNotification('warning', 'Weak Password', 'Password must be at least 6 characters long for security reasons.');
        return;
    }
    
    this.isResetting = true;
    
    const url = `${environment.apiUrl}/api/admin/reset-password/${this.resetPasswordTable}/${this.resetPasswordUser.id}`;
    const payload = {
        newPassword: this.resetPasswordInput.trim()
    };
    
    console.log('📡 Sending POST request to:', url);
    
    this.http.post(url, payload, { headers: this.getHeaders() }).subscribe({
        next: (response: any) => {
            console.log('✅ Password reset successful:', response);
            this.showNotification(
                'success', 
                'Password Reset Successful', 
                `Password has been reset successfully for ${this.resetPasswordUser.fullname || this.resetPasswordUser.username}!\n\nPlease inform the user to login with their new password.`
            );
            this.closePasswordModal();
        },
        error: (err: HttpErrorResponse) => {
            console.error('❌ Password reset failed:', err);
            this.isResetting = false;
            
            let errorTitle = 'Reset Failed';
            let errorMessage = '';
            let errorDetails = null;
            
            if (err.status === 0) {
                errorMessage = 'Unable to connect to the server. Please check your connection.';
                errorDetails = {
                    status: err.status,
                    message: err.message,
                    url: err.url,
                    timestamp: new Date().toISOString()
                };
            } else if (err.status === 401) {
                errorMessage = 'Your session has expired. Please login again.';
                errorDetails = {
                    status: err.status,
                    message: err.message,
                    timestamp: new Date().toISOString()
                };
                localStorage.removeItem('token');
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            } else if (err.status === 403) {
                errorMessage = 'You don\'t have permission to reset passwords. Only administrators can perform this action.';
            } else if (err.status === 404) {
                errorMessage = 'User not found in the system. The user may have been deleted.';
            } else if (err.error?.message) {
                errorMessage = err.error.message;
                errorDetails = err.error;
            } else {
                errorMessage = 'An unexpected error occurred. Please try again or contact support.';
                errorDetails = {
                    status: err.status,
                    statusText: err.statusText,
                    message: err.message,
                    error: err.error,
                    timestamp: new Date().toISOString()
                };
            }
            
            this.showNotification('error', errorTitle, errorMessage, errorDetails);
        },
        complete: () => {
            this.isResetting = false;
        }
    });
}
showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, details?: any) {
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.notificationDetails = details || '';
    this.errorDetails = details || null;
    this.showNotificationModal = true;
}

closeNotificationModal() {
    this.showNotificationModal = false;
    this.notificationDetails = '';
    this.errorDetails = null;
}

copyErrorDetails() {
    if (this.errorDetails) {
        const errorText = typeof this.errorDetails === 'string' 
            ? this.errorDetails 
            : JSON.stringify(this.errorDetails, null, 2);
        navigator.clipboard.writeText(errorText);
        this.showNotification('success', 'Copied!', 'Error details copied to clipboard');
    }
}
// Add this temporary method to debug
debugFormValues() {
    setInterval(() => {
        if (this.showPasswordModal) {
            console.log('Current form values:', {
                resetPasswordInput: this.resetPasswordInput,
                confirmPasswordInput: this.confirmPasswordInput,
                showPasswordModal: this.showPasswordModal
            });
        }
    }, 1000);
}
  closePasswordModal() {
    this.showPasswordModal = false;
    this.resetPasswordUser = null;
    this.resetPasswordTable = '';
    this.resetPasswordInput = '';
    this.confirmPasswordInput = '';
    this.isResetting = false;
  }
  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
}
}