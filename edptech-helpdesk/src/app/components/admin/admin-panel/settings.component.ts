import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <h2>⚙️ System Settings</h2>
        <span class="header-sub">Configure system preferences and parameters</span>
      </div>

      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button class="settings-tab" [class.active]="activeTab === 'general'" (click)="activeTab = 'general'">🏠 General</button>
        <button class="settings-tab" [class.active]="activeTab === 'branches'" (click)="activeTab = 'branches'">🏢 Branches</button>
        <button class="settings-tab" [class.active]="activeTab === 'notifications'" (click)="activeTab = 'notifications'">🔔 Notifications</button>
        <button class="settings-tab" [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">🔒 Security</button>
        <button class="settings-tab" [class.active]="activeTab === 'monitoring'" (click)="activeTab = 'monitoring'">💻 Monitoring</button>
        <button class="settings-tab" [class.active]="activeTab === 'appearance'" (click)="activeTab = 'appearance'">🎨 Appearance</button>
        <button class="settings-tab" [class.active]="activeTab === 'backup'" (click)="activeTab = 'backup'">💾 Backup</button>
      </div>
      
      <!-- General Settings -->
      <div class="settings-content" *ngIf="activeTab === 'general'">
        <div class="settings-card">
          <h3>🏢 Company Information</h3>
          <div class="form-group">
  <label>System Logo</label>
  <div class="logo-upload-area" (click)="logoFileInput.click()" 
       [class.has-logo]="logoImage || logoPreview">
    <div class="logo-preview" *ngIf="logoImage || logoPreview">
      <img [src]="logoPreview || logoImage" alt="System Logo" class="system-logo-preview">
      <button class="remove-logo-btn" (click)="$event.stopPropagation(); removeLogo()" title="Remove Logo">✕</button>
    </div>
    <div class="logo-placeholder" *ngIf="!logoImage && !logoPreview">
      <span class="logo-icon">🖼️</span>
      <span class="logo-text">Click to upload logo</span>
      <span class="logo-hint">PNG, JPG, SVG • Max 2MB</span>
    </div>
    <input type="file" #logoFileInput accept="image/*" style="display:none" 
           (change)="onLogoSelected($event)">
  </div>
  <div class="logo-actions" *ngIf="logoFile || (logoImage && !logoPreview)">
    <button class="btn btn-primary btn-sm" (click)="uploadLogo()" [disabled]="uploadingLogo || !logoFile">
      {{ uploadingLogo ? 'Uploading...' : 'Upload Logo' }}
    </button>
    <button class="btn btn-secondary btn-sm" (click)="cancelLogoUpload()">Cancel</button>
  </div>
  <div class="logo-error" *ngIf="logoError">{{ logoError }}</div>
</div>

          <div class="form-group"><label>Company Name:</label><input type="text" [(ngModel)]="generalSettings.company_name" class="form-input"></div>
          <div class="form-group"><label>System Title:</label><input type="text" [(ngModel)]="generalSettings.system_title" class="form-input"></div>
          <div class="form-group"><label>Contact Email:</label><input type="email" [(ngModel)]="generalSettings.contact_email" class="form-input"></div>
          <div class="form-group"><label>Contact Phone:</label><input type="text" [(ngModel)]="generalSettings.contact_phone" class="form-input"></div>
        </div>
        <div class="settings-card">
          <h3>🕐 Business Hours</h3>
          <div class="form-row">
            <div class="form-group half"><label>Opening Time:</label><input type="time" [(ngModel)]="generalSettings.open_time" class="form-input"></div>
            <div class="form-group half"><label>Closing Time:</label><input type="time" [(ngModel)]="generalSettings.close_time" class="form-input"></div>
          </div>
          <div class="form-group"><label>Working Days:</label>
            <div class="checkbox-group">
              <label *ngFor="let day of generalSettings.workingDays" class="checkbox-label">
                <input type="checkbox" [(ngModel)]="day.selected"> {{ day.name }}
              </label>
            </div>
          </div>
        </div>
        <div class="settings-card">
          <h3>📊 Ticket Defaults</h3>
          <div class="form-group"><label>Default Priority:</label>
            <select [(ngModel)]="generalSettings.default_priority" class="form-input">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <div class="form-group"><label>Auto-close Resolved Tickets After (days):</label>
            <input type="number" [(ngModel)]="generalSettings.auto_close_days" class="form-input" min="0" max="90">
          </div>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>

       <!-- Branches Management -->
      <div class="settings-content" *ngIf="activeTab === 'branches'">
        <div class="settings-card">
          <div class="branch-header">
            <h3>🏢 Branch Management</h3>
            <button class="btn btn-primary" (click)="openBranchModal()">➕ Add Branch</button>
          </div>
          
          <div class="branch-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Registration Key</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let branch of branches">
                  <td>{{ branch.id }}</td>
                  <td>
                    <div class="branch-name-cell">
                      <strong class="branch-name">{{ branch.name }}</strong>
                      <span class="branch-company" *ngIf="branch.company_name">
                        {{ branch.company_name }}
                      </span>
                    </div>
                  </td>
                  <td class="address-cell">{{ branch.address || '—' }}</td>
                  <td>
                    <code class="key-code">{{ branch.registration_key }}</code>
                    <button class="copy-btn-small" (click)="copyKey(branch.registration_key)">📋</button>
                  </td>
                  <td>
                    <span class="status-badge" [class.active]="branch.is_active">
                      {{ branch.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="action-btn" (click)="editBranch(branch)">✏️</button>
                    <button class="action-btn delete" (click)="deleteBranch(branch)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="empty-state" *ngIf="branches.length === 0">
              <p>No branches configured yet. Click "Add Branch" to create one.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="settings-content" *ngIf="activeTab === 'notifications'">
        <div class="settings-card">
          <h3>🔔 Alert Preferences</h3>
          <div class="checkbox-item" *ngFor="let notif of notificationSettings.notifications">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="notif.enabled">
              <span class="toggle-text">{{ notif.label }}</span>
            </label>
            <p class="toggle-desc">{{ notif.description }}</p>
          </div>
        </div>
        <div class="settings-card">
          <h3>📧 Email Notifications</h3>
          <div class="form-group"><label>SMTP Server:</label><input type="text" [(ngModel)]="notificationSettings.smtp_server" class="form-input"></div>
          <div class="form-group"><label>SMTP Port:</label><input type="number" [(ngModel)]="notificationSettings.smtp_port" class="form-input"></div>
          <div class="form-group"><label>Sender Email:</label><input type="email" [(ngModel)]="notificationSettings.sender_email" class="form-input"></div>
          <button class="btn btn-secondary" (click)="testEmail()">📧 Test Email</button>
        </div>
        <div class="settings-card">
          <h3>📝 Email Templates</h3>
          <div class="form-group"><label>New Ticket Subject:</label><input type="text" [(ngModel)]="notificationSettings.new_ticket_subject" class="form-input"></div>
          <div class="form-group"><label>Assigned Ticket Subject:</label><input type="text" [(ngModel)]="notificationSettings.assigned_subject" class="form-input"></div>
          <div class="form-group"><label>Resolved Ticket Subject:</label><input type="text" [(ngModel)]="notificationSettings.resolved_subject" class="form-input"></div>
          <div class="form-group"><label>Footer Signature:</label><textarea [(ngModel)]="notificationSettings.footer_signature" class="form-input" rows="3"></textarea></div>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>

      <!-- Security Settings -->
      <div class="settings-content" *ngIf="activeTab === 'security'">
        <div class="settings-card">
          <h3>🔒 Password Policy</h3>
          <div class="form-group"><label>Minimum Password Length:</label><input type="number" [(ngModel)]="securitySettings.min_password_length" class="form-input" min="6" max="20"></div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="securitySettings.require_special_chars">
              <span class="toggle-text">Require Special Characters</span>
            </label>
          </div>
        </div>
        <div class="settings-card">
          <h3>🕐 Session Settings</h3>
          <div class="form-group"><label>Session Timeout (minutes):</label><input type="number" [(ngModel)]="securitySettings.session_timeout" class="form-input" min="5" max="480"></div>
          <div class="form-group"><label>Max Login Attempts:</label><input type="number" [(ngModel)]="securitySettings.max_login_attempts" class="form-input" min="3" max="10"></div>
          <div class="form-group"><label>Lockout Duration (minutes):</label><input type="number" [(ngModel)]="securitySettings.lockout_duration" class="form-input" min="5" max="60"></div>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>

      <!-- Monitoring Settings -->
      <div class="settings-content" *ngIf="activeTab === 'monitoring'">
        <div class="settings-card">
          <h3>💻 Network Scanning</h3>
          <div class="form-group"><label>Network Range (CIDR):</label><input type="text" [(ngModel)]="monitoringSettings.network_range" class="form-input" placeholder="e.g., 192.168.0.0/16"></div>
          <div class="form-group"><label>Scan Interval (hours):</label><input type="number" [(ngModel)]="monitoringSettings.scan_interval" class="form-input" min="1" max="24"></div>
          <div class="form-group"><label>Auto-scan Enabled:</label>
            <select [(ngModel)]="monitoringSettings.auto_scan" class="form-input">
              <option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
            </select>
          </div>
          <button class="btn btn-secondary" (click)="triggerScan()">🔍 Scan Now</button>
        </div>
        <div class="settings-card">
          <h3>📋 License Alerts</h3>
          <div class="form-group"><label>Alert Before Expiry (days):</label><input type="number" [(ngModel)]="monitoringSettings.expiry_alert_days" class="form-input" min="7" max="90"></div>
          <div class="form-group"><label>Critical Alert Before (days):</label><input type="number" [(ngModel)]="monitoringSettings.critical_alert_days" class="form-input" min="1" max="30"></div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="monitoringSettings.send_email_alerts">
              <span class="toggle-text">Send Email Alerts for Expiring Licenses</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="monitoringSettings.auto_mark_offline">
              <span class="toggle-text">Auto-mark Offline Computers</span>
            </label>
          </div>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>

      <!-- Appearance Settings -->
      <div class="settings-content" *ngIf="activeTab === 'appearance'">
        <div class="settings-card">
          <h3>🎨 Display Settings</h3>
          <div class="form-group"><label>Default View Mode:</label>
            <select [(ngModel)]="appearanceSettings.default_view" class="form-input">
              <option value="list">📋 List View</option><option value="grid">🔲 Grid View</option><option value="kanban">📊 Kanban View</option>
            </select>
          </div>
          <div class="form-group"><label>Items Per Page:</label><input type="number" [(ngModel)]="appearanceSettings.items_per_page" class="form-input" min="10" max="100"></div>
          <div class="form-group"><label>Date Format:</label>
            <select [(ngModel)]="appearanceSettings.date_format" class="form-input">
              <option value="YYYY-MM-DD">YYYY-MM-DD</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </select>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.sidebar_default_open">
              <span class="toggle-text">Sidebar Open by Default</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_animations">
              <span class="toggle-text">Show Animations</span>
            </label>
          </div>
        </div>
        <div class="settings-card">
          <h3>🏷️ Dashboard Widgets</h3>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_priority_widget">
              <span class="toggle-text">Priority Distribution Widget</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_issues_widget">
              <span class="toggle-text">Top Issues Widget</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_activity_widget">
              <span class="toggle-text">Recent Activity Widget</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_requisitions_widget">
              <span class="toggle-text">Requisitions Overview Widget</span>
            </label>
          </div>
          <div class="checkbox-item">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="appearanceSettings.show_joborders_widget">
              <span class="toggle-text">Job Orders Overview Widget</span>
            </label>
          </div>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>

      <!-- Backup Settings -->
      <div class="settings-content" *ngIf="activeTab === 'backup'">
        <div class="settings-card">
          <h3>💾 Database Backup</h3>
          <div class="form-group"><label>Auto Backup:</label>
            <select [(ngModel)]="backupSettings.auto_backup" class="form-input">
              <option value="none">Disabled</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div class="form-group"><label>Backup Time:</label><input type="time" [(ngModel)]="backupSettings.backup_time" class="form-input"></div>
          <div class="form-group"><label>Backup Location:</label><input type="text" [(ngModel)]="backupSettings.backup_location" class="form-input"></div>
          <div class="form-group"><label>Retain Backups (count):</label><input type="number" [(ngModel)]="backupSettings.retain_count" class="form-input" min="1" max="30"></div>
        </div>
        <div class="settings-card">
          <h3>🔄 Actions</h3>
          <button class="btn btn-primary" (click)="backupNow()">💾 Backup Now</button>
          <button class="btn btn-secondary" (click)="restoreBackup()">🔄 Restore from Backup</button>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">💾 Save Settings</button>
      </div>
<!-- AI Assistant Settings -->
<div class="settings-card">
  <h3>🤖 AI Assistant Settings</h3>
  
  <div class="form-group">
    <label>AI Assistant Name:</label>
    <input type="text" [(ngModel)]="aiAssistantName" class="form-input" placeholder="e.g., St4Nger AI">
  </div>
  
  <div class="form-group">
    <label>AI Avatar</label>
    <div class="logo-upload-area" (click)="aiAvatarFileInput.click()" 
         [class.has-logo]="aiAvatarImage || aiAvatarPreview">
      <div class="logo-preview" *ngIf="aiAvatarImage || aiAvatarPreview">
        <img [src]="aiAvatarPreview || aiAvatarImage" alt="AI Avatar" class="system-logo-preview">
        <button class="remove-logo-btn" (click)="$event.stopPropagation(); removeAiAvatar()" title="Remove Avatar">✕</button>
      </div>
      <div class="logo-placeholder" *ngIf="!aiAvatarImage && !aiAvatarPreview">
        <span class="logo-icon">🤖</span>
        <span class="logo-text">Click to upload AI avatar</span>
        <span class="logo-hint">PNG, JPG, SVG • Max 2MB</span>
      </div>
      <input type="file" #aiAvatarFileInput accept="image/*" style="display:none" 
             (change)="onAiAvatarSelected($event)">
    </div>
    <div class="logo-actions" *ngIf="aiAvatarFile || (aiAvatarImage && !aiAvatarPreview)">
      <button class="btn btn-primary btn-sm" (click)="uploadAiAvatar()" [disabled]="uploadingAiAvatar || !aiAvatarFile">
        {{ uploadingAiAvatar ? 'Uploading...' : 'Upload AI Avatar' }}
      </button>
      <button class="btn btn-secondary btn-sm" (click)="cancelAiAvatarUpload()">Cancel</button>
    </div>
    <div class="logo-error" *ngIf="aiAvatarError">{{ aiAvatarError }}</div>
  </div>
  
  <div class="form-group">
    <label>AI Greeting Message:</label>
    <textarea [(ngModel)]="aiGreetingMessage" class="form-input" rows="3" 
              placeholder="Hello! I'm your St4Nger AI. How can I help you today?"></textarea>
  </div>
</div>
      <!-- Toast -->
      <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span>{{ toastMessage }}</span>
      </div>
    </div>

     <!-- Branch Modal -->
    <div class="modal-overlay" *ngIf="showBranchModal" (click)="closeBranchModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isEditingBranch ? '✏️ Edit Branch' : '➕ Add New Branch' }}</h3>
          <button class="modal-close" (click)="closeBranchModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Branch Name:</label>
            <input type="text" [(ngModel)]="branchForm.name" class="form-control" placeholder="e.g., Main Office" required>
          </div>
          
          <div class="form-group">
            <label>Company Name:</label>
            <input type="text" [(ngModel)]="branchForm.company_name" class="form-control" placeholder="e.g., Lee Super Plaza">
          </div>
          
          <div class="form-group">
            <label>Registration Key:</label>
            <div class="key-input-group">
              <input type="text" [(ngModel)]="branchForm.registration_key" class="form-control" placeholder="Enter registration key" required>
              <button class="btn btn-secondary" (click)="generateKey()">🔄 Generate</button>
            </div>
            <small>Users will need this key to register under this branch</small>
          </div>
          
          <div class="form-group">
            <label>Address:</label>
            <input type="text" [(ngModel)]="branchForm.address" class="form-control" placeholder="Branch address">
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="branchForm.is_active">
              <span>Active</span>
            </label>
          </div>

          <div class="error-message" *ngIf="branchError">
            {{ branchError }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn" (click)="closeBranchModal()">✕ Cancel</button>
          <button class="btn btn-primary" (click)="saveBranch()" [disabled]="savingBranch">
            {{ savingBranch ? 'Saving...' : (isEditingBranch ? '💾 Update Branch' : '➕ Create Branch') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
      <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
        <div class="modal-header delete-header">
          <h3>⚠️ Delete Branch</h3>
          <button class="modal-close" (click)="cancelDelete()">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <p>Are you sure you want to delete branch <strong>"{{ deleteTarget?.name }}"</strong>?</p>
            <p class="warning-text">This action cannot be undone. All associated departments and users will need to be reassigned.</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn" (click)="cancelDelete()">✕ Cancel</button>
          <button class="btn btn-danger" (click)="confirmDelete()">🗑️ Delete Branch</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
   .settings-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0 0 2px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }
    .settings-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
    .settings-tab { padding: 8px 14px; background: white; border: 1px solid #c0c0c0; cursor: pointer; font-size: 11px; border-radius: 6px 6px 0 0; }
    .settings-tab.active { background: #0a246a; color: white; border-color: #0a246a; }
    .settings-tab:hover:not(.active) { background: #f0f0f0; }
    .settings-card { background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 20px; margin-bottom: 16px; }
    .settings-card h3 { margin: 0 0 16px 0; color: #0a246a; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-weight: 600; font-size: 11px; color: #555; margin-bottom: 4px; }
    .form-input { width: 100%; padding: 7px 10px; border: 1px solid #c0c0c0; border-radius: 4px; font-size: 11px; box-sizing: border-box; max-width: 400px; }
    .form-input:focus { outline: none; border-color: #0a246a; }
    textarea.form-input { max-width: 500px; min-height: 70px; resize: vertical; }
    .form-row { display: flex; gap: 12px; }
    .form-group.half { flex: 1; }
    .checkbox-group { display: flex; gap: 16px; flex-wrap: wrap; }
    .checkbox-label { font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
    .checkbox-item { margin-bottom: 12px; }
    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .toggle-label input { cursor: pointer; width: 16px; height: 16px; }
    .toggle-text { font-size: 12px; font-weight: 600; color: #333; }
    .toggle-desc { font-size: 10px; color: #888; margin: 4px 0 0 24px; }
    .btn { padding: 8px 16px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 11px; margin-right: 8px; margin-top: 8px; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover { background: #0a3a8c; }
    .btn-secondary { background: #f0f0f0; color: #333; }
    .btn-secondary:hover { background: #e0e0e0; }
    
    /* Branch Management Styles */
    .branch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .branch-table {
      overflow-x: auto;
    }
    
    .branch-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    .branch-table th {
      background: #f8f9fa;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .branch-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
      color: #333;
    }
    
    .branch-table tr:hover td {
      background: #fafafa;
    }
    
    .branch-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .branch-name {
      font-size: 13px;
      color: #0a246a;
    }
    
    .branch-company {
      font-size: 10px;
      color: #888;
      font-style: italic;
    }
    
    .address-cell {
      max-width: 200px;
      word-break: break-word;
      color: #666;
    }
    
    .key-code {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: #f0f4f8;
      padding: 4px 8px;
      border-radius: 3px;
      color: #0a246a;
    }
    
    .copy-btn-small {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      margin-left: 4px;
    }
    
    .copy-btn-small:hover {
      background: #e0e0e0;
    }
    
    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      background: #f0f0f0;
      color: #888;
    }
    
    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }
    
    .action-btn {
      background: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      margin: 0 2px;
    }
    
    .action-btn:hover {
      background: #f0f0f0;
      border-color: #c0c0c0;
    }
    
    .action-btn.delete:hover {
      background: #ffecec;
      border-color: #cc0000;
      color: #cc0000;
    }
    
    .key-input-group {
      display: flex;
      gap: 8px;
    }
    
    .key-input-group .form-control {
      flex: 1;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }
    
    .checkbox-label input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #888;
    }
    
    /* Toast styles */
    .toast-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #333;
      color: white;
      padding: 10px 18px;
      border-radius: 6px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 3000;
    }
    .toast-notification.show {
      transform: translateY(0);
      opacity: 1;
    }
    .toast-notification.success {
      background: #008800;
    }
    .toast-notification.error {
      background: #cc0000;
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
      max-width: 550px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
      max-height: 90vh;
      overflow-y: auto;
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
    .logo-upload-area {
  border: 2px dashed #c0c0c0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.logo-upload-area:hover {
  border-color: #0a246a;
  background: #f5f7fa;
}
.logo-upload-area.has-logo {
  border-color: #0a246a;
  background: #f5f7fa;
  padding: 10px;
}
.logo-preview {
  position: relative;
  display: inline-block;
}
.system-logo-preview {
  max-height: 80px;
  max-width: 200px;
  object-fit: contain;
}
.remove-logo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #cc0000;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.remove-logo-btn:hover {
  transform: scale(1.1);
}
.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #888;
}
.logo-icon {
  font-size: 32px;
}
.logo-text {
  font-size: 13px;
  font-weight: 500;
}
.logo-hint {
  font-size: 10px;
  color: #aaa;
}
.logo-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: center;
}
.btn-sm {
  padding: 4px 12px;
  font-size: 10px;
}
.logo-error {
  color: #cc0000;
  font-size: 11px;
  margin-top: 4px;
  text-align: center;
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
    
    .error-message {
      margin-top: 12px;
      padding: 8px 12px;
      background: #ffecec;
      color: #cc0000;
      border: 1px solid #ffcccc;
      border-radius: 4px;
      font-size: 11px;
    }
    
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
export class SettingsComponent implements OnInit {
  activeTab = 'general';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  // Settings objects - loaded from database
  generalSettings: any = {};
  notificationSettings: any = {};
  securitySettings: any = {};
  monitoringSettings: any = {};
  appearanceSettings: any = {};
  backupSettings: any = {};
  // AI Avatar properties
aiAvatarImage: string | null = null;
aiAvatarFile: File | null = null;
aiAvatarPreview: string | null = null;
uploadingAiAvatar = false;
aiAvatarError = '';
aiAssistantName = 'St4Nger AI'; // Admin can change this
aiGreetingMessage = "Hello! I'm your St4Nger AI. How can I help you today?";
  // Logo properties
  logoImage: string | null = null;
  logoFile: File | null = null;
  logoPreview: string | null = null;
  uploadingLogo = false;
  logoError = '';
  
 @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;
@ViewChild('aiAvatarFileInput') aiAvatarFileInput!: ElementRef<HTMLInputElement>;
  // Branch Management
  branches: any[] = [];
  showBranchModal = false;
  isEditingBranch = false;
  savingBranch = false;
  branchError = '';
  branchForm: any = {
    name: '',
    company_name: '',
    registration_key: '',
    address: '',
    is_active: true
  };
  showDeleteConfirm = false;
  deleteTarget: any = null;

  // Default settings if not found in database
  private defaultSettings = {
    general: {
      company_name: 'Lee Super Plaza',
      system_title: 'EDPtech Helpdesk',
      contact_email: 'support@edptech.com',
      contact_phone: 'ext. 1234',
      open_time: '08:00',
      close_time: '18:00',
      default_priority: 'medium',
      auto_close_days: 7,
      workingDays: [
        { name: 'Mon', selected: true },
        { name: 'Tue', selected: true },
        { name: 'Wed', selected: true },
        { name: 'Thu', selected: true },
        { name: 'Fri', selected: true },
        { name: 'Sat', selected: false },
        { name: 'Sun', selected: false }
      ]
    },
    notification: {
      smtp_server: '',
      smtp_port: 587,
      sender_email: '',
      new_ticket_subject: '🆕 New Ticket Created: #{{ticket_number}}',
      assigned_subject: '📌 Ticket #{{ticket_number}} Assigned to You',
      resolved_subject: '✅ Ticket #{{ticket_number}} Resolved',
      footer_signature: 'Thank you,\nEDPtech Helpdesk Support Team\nsupport@edptech.com',
      notifications: [
        { label: 'New Tickets', description: 'Notify when new tickets are created', enabled: true },
        { label: 'Ticket Assigned', description: 'Notify when tickets are assigned', enabled: true },
        { label: 'Status Changes', description: 'Notify when ticket status changes', enabled: true },
        { label: 'SLA Breaches', description: 'Notify when SLA deadlines approach', enabled: true },
        { label: 'License Expiry', description: 'Notify when MS licenses expire', enabled: true }
      ]
    },
    security: {
      min_password_length: 8,
      require_special_chars: true,
      session_timeout: 30,
      max_login_attempts: 5,
      lockout_duration: 15
    },
    monitoring: {
      network_range: '192.168.0.0/16',
      scan_interval: 1,
      auto_scan: true,
      expiry_alert_days: 30,
      critical_alert_days: 7,
      send_email_alerts: true,
      auto_mark_offline: true
    },
    appearance: {
      default_view: 'list',
      items_per_page: 25,
      date_format: 'YYYY-MM-DD',
      sidebar_default_open: true,
      show_animations: true,
      show_priority_widget: true,
      show_issues_widget: true,
      show_activity_widget: true,
      show_requisitions_widget: true,
      show_joborders_widget: true
    },
    backup: {
      auto_backup: 'weekly',
      backup_time: '02:00',
      backup_location: 'D:\\Backups\\',
      retain_count: 7
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit() { 
    this.loadAllSettings(); 
    this.loadBranches();
  }

 // ======================
// LOAD ALL SETTINGS FROM DATABASE
// ======================
loadAllSettings() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any>(`${environment.apiUrl}/api/admin/settings`, { headers }).subscribe({
    next: (data) => {
      // Load each settings category
      this.generalSettings = data.general || { ...this.defaultSettings.general };
      this.notificationSettings = data.notification || { ...this.defaultSettings.notification };
      this.securitySettings = data.security || { ...this.defaultSettings.security };
      this.monitoringSettings = data.monitoring || { ...this.defaultSettings.monitoring };
      this.appearanceSettings = data.appearance || { ...this.defaultSettings.appearance };
      this.backupSettings = data.backup || { ...this.defaultSettings.backup };
      
      // Load AI settings
      this.aiAssistantName = data.ai?.name || 'St4Nger AI';
      this.aiGreetingMessage = data.ai?.greeting || "Hello! I'm your St4Nger AI. How can I help you today?";
this.aiAvatarImage = data.ai?.avatar || data.ai_avatar || null;
      
      // Load logo if available
      if (data.logo) {
        if (data.logo.startsWith('data:')) {
          this.logoImage = data.logo;
        } else if (data.logo.startsWith('http')) {
          this.logoImage = data.logo;
        } else {
          this.logoImage = `${environment.apiUrl}${data.logo}`;
        }
      } else {
        this.logoImage = null;
      }
      
      console.log('✅ Settings loaded from database');
    },
    error: (err) => {
      console.warn('Failed to load settings:', err);
      this.generalSettings = { ...this.defaultSettings.general };
      this.notificationSettings = { ...this.defaultSettings.notification };
      this.securitySettings = { ...this.defaultSettings.security };
      this.monitoringSettings = { ...this.defaultSettings.monitoring };
      this.appearanceSettings = { ...this.defaultSettings.appearance };
      this.backupSettings = { ...this.defaultSettings.backup };
      this.logoImage = null;
      this.aiAssistantName = 'St4Nger AI';
      this.aiGreetingMessage = "Hello! I'm your St4Nger AI. How can I help you today?";
      this.aiAvatarImage = null;
      this.showToastMsg('⚠️ Using default settings', 'error');
    }
  });
}
// ======================
// SAVE ALL SETTINGS TO DATABASE
// ======================
saveSettings() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

     const payload: any = {
    general: this.generalSettings,
    notification: this.notificationSettings,
    security: this.securitySettings,
    monitoring: this.monitoringSettings,
    appearance: this.appearanceSettings,
    backup: this.backupSettings,
    ai: {
      name: this.aiAssistantName,
      greeting: this.aiGreetingMessage,
      avatar: this.aiAvatarImage
    }
  };

    // Only include logo if it exists
    if (this.logoImage) {
      payload.logo = this.logoImage;
    }

    this.http.post(`${environment.apiUrl}/api/admin/settings`, payload, { headers }).subscribe({
      next: () => {
        // Clear the client dashboard cache so it picks up the new settings
        localStorage.removeItem('system_settings_cache');
        this.showToastMsg('✅ All settings saved successfully!', 'success');
      },
      error: (err) => {
        console.error('Failed to save settings:', err);
        // Save to localStorage as fallback
        const localPayload: any = { 
          general: this.generalSettings,
          notification: this.notificationSettings,
          security: this.securitySettings,
          monitoring: this.monitoringSettings,
          appearance: this.appearanceSettings,
          backup: this.backupSettings
        };
        if (this.logoImage) {
          localPayload.logo = this.logoImage;
        }
        localStorage.setItem('system_settings', JSON.stringify(localPayload));
        this.showToastMsg('⚠️ Settings saved locally only', 'error');
      }
    });
}
  // ======================
  // LOGO MANAGEMENT METHODS
  // ======================
  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.logoError = 'File size exceeds 2MB limit.';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.logoError = 'Please upload PNG, JPG, SVG, or WebP images only.';
        return;
      }
      
      this.logoFile = file;
      this.logoError = '';
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelLogoUpload() {
    this.logoFile = null;
    this.logoPreview = null;
    this.logoError = '';
    if (this.logoFileInput) {
      this.logoFileInput.nativeElement.value = '';
    }
  }
uploadLogo() {
  if (!this.logoFile) return;
  
  this.uploadingLogo = true;
  this.logoError = '';
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Create FormData
  const formData = new FormData();
  formData.append('logo', this.logoFile, this.logoFile.name);
  
  this.http.post(`${environment.apiUrl}/api/admin/upload-logo`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .subscribe({
      next: (response: any) => {
        this.uploadingLogo = false;
        this.logoImage = `${environment.apiUrl}${response.logoUrl}`;
        this.logoFile = null;
        this.logoPreview = null;
        if (this.logoFileInput) {
          this.logoFileInput.nativeElement.value = '';
        }
        // Clear the client dashboard cache
        localStorage.removeItem('system_settings_cache');
        this.showToastMsg('✅ Logo uploaded successfully!', 'success');
      },
      error: (err) => {
        this.uploadingLogo = false;
        this.logoError = err.error?.message || 'Failed to upload logo.';
        this.showToastMsg('❌ Failed to upload logo', 'error');
      }
    });
}
removeLogo() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.delete(`${environment.apiUrl}/api/admin/remove-logo`, { headers })
      .subscribe({
        next: () => {
          this.logoImage = null;
          this.logoFile = null;
          this.logoPreview = null;
          if (this.logoFileInput) {
            this.logoFileInput.nativeElement.value = '';
          }
          // Clear the client dashboard cache
          localStorage.removeItem('system_settings_cache');
          this.showToastMsg('🗑️ Logo removed successfully!', 'success');
        },
        error: (err) => {
          console.error('Failed to remove logo:', err);
          this.showToastMsg('❌ Failed to remove logo', 'error');
        }
      });
}
  // ======================
  // BRANCH MANAGEMENT METHODS
  // ======================
  loadBranches() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/branches`, { headers }).subscribe({
      next: (data) => {
        this.branches = data || [];
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.branches = [];
        this.showToastMsg('❌ Failed to load branches', 'error');
      }
    });
  }

  openBranchModal() {
    this.isEditingBranch = false;
    this.branchForm = {
      name: '',
      company_name: '',
      registration_key: '',
      address: '',
      is_active: true
    };
    this.branchError = '';
    this.showBranchModal = true;
  }

  editBranch(branch: any) {
    this.isEditingBranch = true;
    this.branchForm = { ...branch };
    this.branchError = '';
    this.showBranchModal = true;
  }

  closeBranchModal() {
    this.showBranchModal = false;
    this.isEditingBranch = false;
    this.branchError = '';
    this.savingBranch = false;
  }

  generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.branchForm.registration_key = key.match(/.{1,4}/g)?.join('-') || key;
  }

  saveBranch() {
    if (!this.branchForm.name?.trim() || !this.branchForm.registration_key?.trim()) {
      this.branchError = 'Branch Name and Registration Key are required.';
      return;
    }

    const duplicate = this.branches.find(b => 
      b.registration_key === this.branchForm.registration_key &&
      b.id !== this.branchForm.id
    );

    if (duplicate) {
      this.branchError = 'Registration key already exists.';
      return;
    }

    this.savingBranch = true;
    this.branchError = '';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const url = this.isEditingBranch 
      ? `${environment.apiUrl}/api/admin/branches/${this.branchForm.id}`
      : `${environment.apiUrl}/api/admin/branches`;

    const method = this.isEditingBranch ? 'put' : 'post';

    const payload = {
      name: this.branchForm.name,
      company_name: this.branchForm.company_name || '',
      registration_key: this.branchForm.registration_key,
      address: this.branchForm.address || '',
      is_active: this.branchForm.is_active !== false
    };

    this.http[method](url, payload, { headers }).subscribe({
      next: () => {
        this.showToastMsg(`✅ Branch ${this.isEditingBranch ? 'updated' : 'created'} successfully!`, 'success');
        this.savingBranch = false;
        setTimeout(() => {
          this.closeBranchModal();
          this.loadBranches();
        }, 500);
      },
      error: (err) => {
        this.savingBranch = false;
        console.error('Failed to save branch:', err);
        this.branchError = err.error?.error || 'Failed to save branch. Please try again.';
      }
    });
  }

  deleteBranch(branch: any) {
    this.deleteTarget = branch;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.delete(`${environment.apiUrl}/api/admin/branches/${this.deleteTarget.id}`, { headers }).subscribe({
      next: () => {
        this.showToastMsg('🗑️ Branch deleted successfully!', 'success');
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.loadBranches();
      },
      error: (err) => {
        console.error('Failed to delete branch:', err);
        const errorMsg = err.error?.error || 'Failed to delete branch';
        this.showToastMsg(`❌ ${errorMsg}`, 'error');
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
      }
    });
  }

  copyKey(key: string) {
    if (!key) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(key).then(() => {
        this.showToastMsg('✅ Key copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopyKey(key);
      });
    } else {
      this.fallbackCopyKey(key);
    }
  }

  private fallbackCopyKey(key: string) {
    const textarea = document.createElement('textarea');
    textarea.value = key;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.showToastMsg('✅ Key copied to clipboard!', 'success');
    } catch {
      this.showToastMsg('❌ Failed to copy key', 'error');
    }
    document.body.removeChild(textarea);
  }

  // ======================
  // TOAST NOTIFICATION
  // ======================
  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  // ======================
  // OTHER METHODS
  // ======================
  testEmail() { 
    this.showToastMsg('📧 Test email sent!', 'success'); 
  }
  
  triggerScan() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post(`${environment.apiUrl}/api/computers/scan`, {}, { headers }).subscribe({
      next: () => this.showToastMsg('🔍 Network scan triggered!', 'success'),
      error: () => this.showToastMsg('⚠️ Failed to trigger scan', 'error')
    });
  }
// ======================
// AI AVATAR MANAGEMENT METHODS
// ======================
onAiAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      this.aiAvatarError = 'File size exceeds 2MB limit.';
      return;
    }
    
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.aiAvatarError = 'Please upload PNG, JPG, SVG, or WebP images only.';
      return;
    }
    
    this.aiAvatarFile = file;
    this.aiAvatarError = '';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.aiAvatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

uploadAiAvatar() {
  if (!this.aiAvatarFile) return;
  
  this.uploadingAiAvatar = true;
  this.aiAvatarError = '';
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // ✅ Read file as base64 and send as JSON
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const base64Data = e.target.result as string; // This is a data URL: "data:image/png;base64,..."
    
    // Send as JSON to backend
    this.http.post(`${environment.apiUrl}/api/admin/upload-ai-avatar`, 
      { avatar: base64Data },  // ✅ JSON payload
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    ).subscribe({
      next: (response: any) => {
        this.uploadingAiAvatar = false;
        this.aiAvatarImage = base64Data; // ✅ Use base64 directly
        this.aiAvatarFile = null;
        this.aiAvatarPreview = null;
        localStorage.removeItem('ai_avatar_cache');
        this.showToastMsg('✅ AI Avatar uploaded!', 'success');
      },
      error: (err) => {
        this.uploadingAiAvatar = false;
        this.aiAvatarError = err.error?.message || 'Failed to upload AI avatar.';
        this.showToastMsg('❌ Failed to upload AI avatar', 'error');
      }
    });
  };
  
  reader.onerror = () => {
    this.uploadingAiAvatar = false;
    this.aiAvatarError = 'Failed to read file.';
    this.showToastMsg('❌ Failed to read file', 'error');
  };
  
  reader.readAsDataURL(this.aiAvatarFile);
}
removeAiAvatar() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  this.http.delete(`${environment.apiUrl}/api/admin/remove-ai-avatar`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).subscribe({
    next: () => {
      this.aiAvatarImage = null;
      this.aiAvatarFile = null;
      this.aiAvatarPreview = null;
      localStorage.removeItem('ai_avatar_cache');
      this.showToastMsg('🗑️ AI Avatar removed!', 'success');
    },
    error: () => this.showToastMsg('❌ Failed to remove avatar', 'error')
  });
}

cancelAiAvatarUpload() {
  this.aiAvatarFile = null;
  this.aiAvatarPreview = null;
  this.aiAvatarError = '';
  if (this.aiAvatarFileInput) {
    this.aiAvatarFileInput.nativeElement.value = '';
  }
}
// ============================================
// BACKUP & RESTORE
// ============================================

backupNow() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    this.showToastMsg('❌ No authentication token found', 'error');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.showToastMsg('💾 Starting database backup...', 'success');
  
  // Use the existing export endpoint
  this.http.get(`${environment.apiUrl}/api/admin/database/export`, { 
    headers,
    responseType: 'text',  // SQL is text
    observe: 'response'
  }).subscribe({
    next: (response: any) => {
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `edptech_helpdesk_backup_${new Date().toISOString().split('T')[0]}.sql`;
      
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const sqlContent = response.body;
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Calculate file size
      const fileSizeKB = (blob.size / 1024).toFixed(1);
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      const sizeDisplay = blob.size > 1048576 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
      
      this.showToastMsg(`✅ Backup completed! 📁 ${filename} (${sizeDisplay})`, 'success');
    },
    error: (err) => {
      console.error('❌ Backup failed:', err);
      
      let errorMsg = 'Failed to export database.';
      if (err.status === 403) {
        errorMsg = 'Access denied. Admin privileges required.';
      } else if (err.status === 0) {
        errorMsg = 'Cannot connect to server. Check if backend is running.';
      } else if (err.status === 404) {
        errorMsg = 'Backup endpoint not found.';
      } else {
        errorMsg = `Backup failed (Error ${err.status}).`;
      }
      
      this.showToastMsg('❌ ' + errorMsg, 'error');
    }
  });
}

restoreBackup() {
  // Create file input for SQL file selection
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.sql,.txt';
  
  input.onchange = (event: any) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.txt')) {
      this.showToastMsg('❌ Please select a valid SQL backup file (.sql or .txt)', 'error');
      return;
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToastMsg('❌ File is too large. Maximum size is 50MB.', 'error');
      return;
    }
    
    // Confirm restoration
    if (!confirm(`⚠️ WARNING: This will overwrite your current database!\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nAre you sure you want to proceed?`)) {
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const sqlContent = e.target.result;
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      this.showToastMsg('🔄 Restoring database... This may take a few moments.', 'success');
      
      // Send to import endpoint
      this.http.post(`${environment.apiUrl}/api/admin/database/import`, 
        { sql: sqlContent, filename: file.name }, 
        { headers }
      ).subscribe({
        next: (response: any) => {
          this.showToastMsg('✅ Database restored successfully! Refreshing page...', 'success');
          
          // Reload after delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Restore failed:', err);
          
          let errorMsg = 'Failed to restore database.';
          if (err.status === 403) {
            errorMsg = 'Access denied. Admin privileges required.';
          } else if (err.status === 413) {
            errorMsg = 'File is too large for server to process.';
          } else if (err.status === 400) {
            errorMsg = err.error?.error || 'Invalid SQL file format.';
          } else if (err.status === 404) {
            errorMsg = 'Import endpoint not found. Please add /api/admin/database/import to server.js';
          } else {
            errorMsg = `Restore failed (Error ${err.status}).`;
          }
          
          this.showToastMsg('❌ ' + errorMsg, 'error');
        }
      });
    };
    
    reader.onerror = () => {
      this.showToastMsg('❌ Failed to read file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

}