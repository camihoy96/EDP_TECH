import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ClientNotificationService } from '../../../services/client-notification.service';
interface Announcement {
  id: number;
  tag: string;
  title: string;
  content: string;
  message?: string;
  priority?: string;
  date: string;
  created_at?: string;
  isRead: boolean;
  created_by_name?: string;
  expires_at?: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="announcements-page">
      <div class="page-header">
        <h2>📢 Announcements Center</h2>
        <div class="header-actions">
          <span class="live-indicator" *ngIf="isLive">🟢 Live</span>
          <button class="mark-all-btn" (click)="markAllAsRead()">Mark all as read</button>
        </div>
      </div>

      <div class="stats-summary">
        <div class="stat-box">
          <span class="stat-number">{{ announcements.length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ unreadCount }}</span>
          <span class="stat-label">Unread</span>
        </div>
        <div class="stat-box urgent">
          <span class="stat-number">{{ urgentCount }}</span>
          <span class="stat-label">Urgent</span>
        </div>
      </div>

      <div class="toolbar" *ngIf="canCreate">
  <button class="create-btn" (click)="openCreateModal()">✍️ Create Announcement</button>
</div>

      <div class="announcements-list">
        <div class="announcement-card" *ngFor="let ann of announcements" [class.unread]="!ann.isRead">
          <div class="card-header">
            <span class="ann-tag" [class]="'tag-' + (ann.tag || 'info').toLowerCase()">
              {{ ann.tag || 'INFO' }}
            </span>
            <span class="ann-date">{{ ann.date | date:'MMM d, yyyy h:mm a' }}</span>
            <span class="ann-author" *ngIf="ann.created_by_name">by {{ ann.created_by_name }}</span>
            <span class="read-status" *ngIf="!ann.isRead">● New</span>
            <div class="admin-actions" *ngIf="canEdit(ann) || canDelete(ann)">
  <button class="icon-btn edit" *ngIf="canEdit(ann)" (click)="openEditModal(ann)" title="Edit">✏️</button>
  <button class="icon-btn delete" *ngIf="canDelete(ann)" (click)="openDeleteModal(ann)" title="Delete">🗑️</button>
</div>
          </div>
          <h3 class="ann-title">{{ ann.title }}</h3>
          <p class="ann-content">{{ ann.content }}</p>
          <div class="card-footer">
            <span class="expiry" *ngIf="ann.expires_at">⏰ Expires: {{ ann.expires_at | date:'MMM d, yyyy' }}</span>
            <button class="mark-read-btn" *ngIf="!ann.isRead" (click)="markAsRead(ann.id)">✓ Mark as read</button>
          </div>
        </div>
        <div class="empty-state" *ngIf="announcements.length === 0">
          <span>📭</span>
          <p>No announcements at this time.</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
      <div class="modal-window" id="announceFormModal" (click)="$event.stopPropagation()"
           [class.dragging]="dragTarget === 'announceFormModal'">
        <div class="modal-titlebar" (mousedown)="startDrag($event, 'announceFormModal')">
          <span>{{ editingId ? '✏️ Edit' : '✍️ Create' }} Announcement</span>
          <button type="button" (click)="closeFormModal()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Title:</label>
            <input type="text" [(ngModel)]="formData.title" class="form-input" placeholder="Announcement title...">
          </div>
          <div class="form-group">
            <label>Message:</label>
            <textarea [(ngModel)]="formData.content" class="form-input" rows="4" placeholder="Announcement message..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Tag:</label>
              <select [(ngModel)]="formData.tag" class="form-input">
                <option value="INFO">ℹ️ Info</option>
                <option value="MAINT">🔧 Maintenance</option>
                <option value="URGENT">🚨 Urgent</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Expires (optional):</label>
              <input type="date" [(ngModel)]="formData.expires_at" class="form-input">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" (click)="closeFormModal()">Cancel</button>
          <button class="btn primary" (click)="saveAnnouncement()" [disabled]="!formData.title || !formData.content">
            {{ editingId ? '💾 Update' : '📢 Post' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="modal-window confirm-modal" id="announceDeleteModal" (click)="$event.stopPropagation()"
           [class.dragging]="dragTarget === 'announceDeleteModal'">
        <div class="modal-titlebar danger" (mousedown)="startDrag($event, 'announceDeleteModal')">
          <span>🗑️ Delete Announcement</span>
          <button type="button" (click)="closeDeleteModal()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <span class="confirm-icon">⚠️</span>
            <p>Delete this announcement?</p>
            <p class="confirm-detail" *ngIf="deleteTarget"><strong>{{ deleteTarget.title }}</strong></p>
            <p class="confirm-warning">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" (click)="closeDeleteModal()">Cancel</button>
          <button class="btn danger" (click)="confirmDelete()">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .announcements-page { padding: 20px; height: 100%; overflow-y: auto; background: #f5f5f5; font-family: 'Segoe UI', sans-serif; font-size: 12px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0a246a; }
    .page-header h2 { margin: 0; font-size: 18px; color: #0a246a; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .live-indicator { font-size: 10px; color: #008800; font-weight: bold; }
    .mark-all-btn { background: #0a246a; color: white; border: none; border-radius: 3px; padding: 6px 14px; cursor: pointer; font-size: 11px; }
    .mark-all-btn:hover { background: #0a3a8c; }
    .stats-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-box { background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 15px; text-align: center; }
    .stat-box.urgent { border-left: 3px solid #cc0000; }
    .stat-number { font-size: 28px; font-weight: bold; color: #0a246a; display: block; }
    .stat-label { font-size: 11px; color: #666; margin-top: 5px; }
    .toolbar { margin-bottom: 16px; }
    .create-btn { background: #0a246a; color: white; border: none; border-radius: 3px; padding: 8px 18px; cursor: pointer; font-size: 12px; }
    .create-btn:hover { background: #0a3a8c; }
    .announcements-list { display: flex; flex-direction: column; gap: 12px; }
    .announcement-card { background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 16px; transition: all 0.2s; }
    .announcement-card.unread { background: #e8f0fe; border-left: 4px solid #0a246a; }
    .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .ann-tag { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .tag-info { background: #0066cc; color: white; }
    .tag-maint { background: #cc6600; color: white; }
    .tag-urgent { background: #cc0000; color: white; }
    .ann-date { font-size: 10px; color: #666; flex: 1; }
    .ann-author { font-size: 10px; color: #0a3a8c; font-weight: 500; }
    .read-status { font-size: 9px; color: #0a246a; font-weight: bold; }
    .admin-actions { display: flex; gap: 4px; margin-left: auto; }
    .icon-btn { background: none; border: 1px solid transparent; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 2px; }
    .icon-btn.edit:hover { background: #e8f0fe; border-color: #0a246a; }
    .icon-btn.delete:hover { background: #ffecec; border-color: #cc0000; color: #cc0000; }
    .ann-title { margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333; }
    .ann-content { margin: 0; font-size: 12px; color: #555; line-height: 1.5; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .expiry { font-size: 9px; color: #cc6600; }
    .mark-read-btn { background: none; border: none; color: #0a246a; cursor: pointer; font-size: 11px; }
    .mark-read-btn:hover { text-decoration: underline; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 500px; max-width: 90vw; }
    .modal-window.dragging { position: fixed; }
    .confirm-modal { width: 380px; }
    .modal-titlebar { background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; cursor: grab; user-select: none; }
    .modal-titlebar:active { cursor: grabbing; }
    .modal-titlebar.danger { background: linear-gradient(180deg, #cc0000, #880000); }
    .modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    .modal-body { padding: 16px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid #d0d0d0; background: #e8e8e8; }
    .form-group { margin-bottom: 10px; }
    .form-group label { display: block; font-weight: 600; font-size: 10px; color: #555; margin-bottom: 3px; }
    .form-row { display: flex; gap: 10px; }
    .form-group.half { flex: 0.5; }
    .form-input { width: 100%; padding: 6px 8px; border: 1px solid #a0a0a0; font-size: 11px; box-sizing: border-box; font-family: inherit; }
    textarea.form-input { resize: vertical; }
    .btn { padding: 6px 16px; border: 1px solid #a0a0a0; background: #f0f0f0; cursor: pointer; font-size: 11px; border-radius: 2px; }
    .btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn.primary:hover { background: #0a3a8c; }
    .btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn.danger { background: #cc0000; color: white; border-color: #cc0000; }
    .btn.danger:hover { background: #aa0000; }
    .btn.cancel:hover { background: #e0e0e0; }
    .confirm-content { text-align: center; }
    .confirm-icon { font-size: 36px; display: block; margin-bottom: 10px; }
    .confirm-content p { font-size: 12px; color: #333; margin: 0 0 4px 0; }
    .confirm-detail { background: #f5f5f5; padding: 8px; margin: 8px 0; border-radius: 3px; font-size: 11px; }
    .confirm-detail strong { color: #0a3a8c; }
    .confirm-warning { color: #cc0000 !important; font-size: 10px !important; }
  `]
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  announcements: Announcement[] = [];
  formData = { title: '', content: '', tag: 'INFO', expires_at: '' };
  editingId: number | null = null;
  deleteTarget: Announcement | null = null;
   canCreate = false;       // Admin, Head/Manager, Supervisor
  canEditAll = false;      // Head/Manager only
  canDeleteAll = false;    // Head/Manager only
  currentUserRole = '';    // Store current user's role
  currentUserId: number | null = null; 
  showFormModal = false;
  showDeleteModal = false;
  isLive = false;

  private isDragging = false;
  dragTarget: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private apiUrl = environment.apiUrl;
  
  // ✅ Polling properties
  private pollingInterval: any = null;
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  private lastKnownIds: Set<number> = new Set();

constructor(
    private http: HttpClient,
    private clientNotificationService: ClientNotificationService
) {}

  ngOnInit() {
    this.checkUserPermissions();
    this.loadAnnouncements();
    this.startPolling(); // ✅ Start auto-refresh
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  ngOnDestroy() {
    this.stopPolling(); // ✅ Clean up
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  // ✅ Start polling for new announcements
  startPolling() {
    this.isLive = true;
    this.pollingInterval = setInterval(() => {
      this.checkForNewAnnouncements();
    }, this.POLL_INTERVAL);
  }

  // ✅ Stop polling
  stopPolling() {
    this.isLive = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  checkUserPermissions() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const role = (currentUser.role || '').toLowerCase().trim();
    const userTable = currentUser?.user_table || '';
    this.currentUserRole = role;
    this.currentUserId = currentUser?.id || null;
    
    console.log('🔍 Checking permissions for:', { role, userTable, userId: this.currentUserId });
    
    // Must be from 'users' table (admin side)
    if (userTable !== 'users') {
      this.canCreate = false;
      this.canEditAll = false;
      this.canDeleteAll = false;
      return;
    }
    
    // Admin can do everything
    if (role === 'admin') {
      this.canCreate = true;
      this.canEditAll = true;
      this.canDeleteAll = true;
      console.log('✅ Admin - full access');
      return;
    }
    
    // Head/Manager can create, edit all, delete all
    if (role === 'head/manager' || role === 'head manager') {
      this.canCreate = true;
      this.canEditAll = true;
      this.canDeleteAll = true;
      console.log('✅ Head/Manager - full access');
      return;
    }
    
    // Supervisor can create, but only edit/delete their own
    if (role === 'supervisor') {
      this.canCreate = true;
      this.canEditAll = false;   // Cannot edit all
      this.canDeleteAll = false; // Cannot delete all
      console.log('✅ Supervisor - can create, edit/delete own only');
      return;
    }
    
    // Check department_roles for management roles
    const departmentId = currentUser?.department_id;
    if (departmentId) {
      this.verifyDepartmentRole(departmentId, currentUser);
    } else {
      this.canCreate = false;
      this.canEditAll = false;
      this.canDeleteAll = false;
    }
  }
   // ✅ NEW: Verify role from department_roles table
  verifyDepartmentRole(departmentId: number, user: any) {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${this.apiUrl}/api/department-roles?department_id=${departmentId}`, { headers })
      .subscribe({
        next: (roles) => {
          const roleEntries = (roles || []).filter((r: any) => 
            Number(r.user_id) === Number(user.id)
          );
          
          const hasHeadManager = roleEntries.some((r: any) => {
            const roleName = (r.role_name || '').toLowerCase().trim();
            return roleName === 'head/manager' || roleName === 'head manager';
          });
          
          const hasSupervisor = roleEntries.some((r: any) => {
            const roleName = (r.role_name || '').toLowerCase().trim();
            return roleName === 'supervisor';
          });
          
          if (hasHeadManager) {
            this.canCreate = true;
            this.canEditAll = true;
            this.canDeleteAll = true;
            this.currentUserRole = 'head/manager';
            console.log('✅ Head/Manager (dept_roles) - full access');
          } else if (hasSupervisor) {
            this.canCreate = true;
            this.canEditAll = false;
            this.canDeleteAll = false;
            this.currentUserRole = 'supervisor';
            console.log('✅ Supervisor (dept_roles) - can create, edit/delete own');
          } else {
            this.canCreate = false;
            this.canEditAll = false;
            this.canDeleteAll = false;
            console.log('❌ Read-only access');
          }
        },
        error: () => {
          this.canCreate = false;
          this.canEditAll = false;
          this.canDeleteAll = false;
        }
      });
  }

  // ✅ NEW: Check if current user can edit a specific announcement
  canEdit(announcement: Announcement): boolean {
    if (this.canEditAll) return true;  // Head/Manager or Admin
    
    // Supervisor can only edit their own
    if (this.canCreate && this.currentUserRole === 'supervisor') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return announcement.created_by_name === currentUser?.fullname;
    }
    
    return false;
  }

  // ✅ NEW: Check if current user can delete a specific announcement
  canDelete(announcement: Announcement): boolean {
    if (this.canDeleteAll) return true;  // Head/Manager or Admin
    
    // Supervisor can only delete their own
    if (this.canCreate && this.currentUserRole === 'supervisor') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return announcement.created_by_name === currentUser?.fullname;
    }
    
    return false;
  }

  // ✅ Check for new announcements without resetting read status
  checkForNewAnnouncements() {
    this.http.get<any[]>(`${this.apiUrl}/api/announcements`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        if (!data || data.length === 0) return;
        
        const tagMap: { [key: string]: string } = {
          'normal': 'INFO', 'important': 'MAINT', 'urgent': 'URGENT'
        };
        const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        
        // Check if there are new IDs
        const currentIds = new Set(data.map(a => a.id));
        const hasNewAnnouncements = data.some(a => !this.lastKnownIds.has(a.id));
        
        if (hasNewAnnouncements || this.announcements.length !== data.length) {
          console.log('🔄 New announcements detected, updating...');
        }
        
        this.lastKnownIds = currentIds;
        
        // Update announcements while preserving read status
        this.announcements = data.map(a => ({
          id: a.id,
          title: a.title || 'No Title',
          content: a.message || a.content || 'No Content',
          message: a.message || '',
          tag: tagMap[a.priority] || a.priority || 'INFO',
          priority: a.priority || 'normal',
          date: a.created_at || a.date || '',
          created_at: a.created_at || '',
          created_by_name: a.created_by_name || '',
          expires_at: a.expires_at || '',
          isRead: readIds.includes(a.id)
        }));
      },
      error: (err) => {
        // Silently fail on polling errors
        console.warn('Polling check failed:', err.status);
      }
    });
  }

  getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  loadAnnouncements() {
    this.http.get<any[]>(`${this.apiUrl}/api/announcements`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        const tagMap: { [key: string]: string } = {
          'normal': 'INFO', 'important': 'MAINT', 'urgent': 'URGENT'
        };
        const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        
        // Track known IDs
        this.lastKnownIds = new Set((data || []).map(a => a.id));
        
        this.announcements = (data || []).map(a => ({
          id: a.id,
          title: a.title || 'No Title',
          content: a.message || a.content || 'No Content',
          message: a.message || '',
          tag: tagMap[a.priority] || a.priority || 'INFO',
          priority: a.priority || 'normal',
          date: a.created_at || a.date || '',
          created_at: a.created_at || '',
          created_by_name: a.created_by_name || '',
          expires_at: a.expires_at || '',
          isRead: readIds.includes(a.id)
        }));
      },
      error: (err) => console.error('Failed to load announcements:', err)
    });
  }

  get unreadCount(): number { return this.announcements.filter(a => !a.isRead).length; }
  get urgentCount(): number { return this.announcements.filter(a => a.tag === 'URGENT').length; }

  markAsRead(id: number) {
    const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_announcements', JSON.stringify(readIds));
    }
    const a = this.announcements.find(x => x.id === id);
    if (a) a.isRead = true;
  }

  markAllAsRead() {
    const allIds = this.announcements.map(a => a.id);
    localStorage.setItem('read_announcements', JSON.stringify(allIds));
    this.announcements.forEach(a => a.isRead = true);
  }

  openCreateModal() {
    this.formData = { title: '', content: '', tag: 'INFO', expires_at: '' };
    this.editingId = null;
    this.showFormModal = true;
  }

  openEditModal(ann: Announcement) {
    this.formData = {
      title: ann.title,
      content: ann.content || '',
      tag: ann.tag || 'INFO',
      expires_at: ann.expires_at || ''
    };
    this.editingId = ann.id;
    this.showFormModal = true;
  }

  closeFormModal() { this.showFormModal = false; this.editingId = null; }
  openDeleteModal(ann: Announcement) { this.deleteTarget = ann; this.showDeleteModal = true; }
  closeDeleteModal() { this.showDeleteModal = false; this.deleteTarget = null; }

saveAnnouncement() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tagMap: { [key: string]: string } = { 'INFO': 'normal', 'MAINT': 'important', 'URGENT': 'urgent' };
    const payload = {
      title: this.formData.title,
      message: this.formData.content,
      priority: tagMap[this.formData.tag] || 'normal',
      expires_at: this.formData.expires_at || null,
      created_by: currentUser.id,
      created_by_name: currentUser.fullname
    };

    const request = this.editingId
      ? this.http.put(`${this.apiUrl}/api/announcements/${this.editingId}`, payload, { headers: this.getHeaders() })
      : this.http.post(`${this.apiUrl}/api/announcements`, payload, { headers: this.getHeaders() });

    request.subscribe({
      next: (response: any) => {
        console.log('✅ Announcement saved, response:', response); // ✅ Debug
        
        this.closeFormModal();
        this.loadAnnouncements();
        
        // ✅ Only notify clients about NEW announcements (not edits)
        console.log('🔍 editingId:', this.editingId, 'user_table:', currentUser?.user_table); // ✅ Debug
        
        if (!this.editingId) {
            if (currentUser?.user_table === 'users') {
                console.log('📢 Sending notification for announcement:', response.id); // ✅ Debug
                this.clientNotificationService.handleNewAnnouncement({
                    id: response.id,
                    title: this.formData.title
                });
            } else {
                console.log('⚠️ Not admin, skipping notification'); // ✅ Debug
            }
        } else {
            console.log('⚠️ Edit mode, skipping notification'); // ✅ Debug
        }
      },
      error: (err) => {
        console.error('❌ Failed to save:', err); // ✅ Debug
        alert('Failed to save: ' + (err.error?.error || err.message));
      }
    });
}
private saveAnnouncementNotificationToServer(announcement: any): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        console.log('⚠️ No token, skipping announcement notification');
        return;
    }

    const url = `${environment.apiUrl}/api/client-notifications/announcement`;
    console.log('📤 Sending announcement notification to:', url); // ✅ Debug

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'info',
            title: '📢 New Announcement',
            message: announcement.title || 'New announcement posted',
            announcement_id: announcement.id,
            notification_type: 'announcement'
        }),
    })
    .then(res => {
        console.log('📥 Notification response status:', res.status); // ✅ Debug
        return res.json();
    })
    .then(data => console.log('📥 Notification response:', data)) // ✅ Debug
    .catch(err => console.log('⚠️ Failed to save announcement notification:', err));
}
  confirmDelete() {
    if (!this.deleteTarget) return;
    this.http.delete(`${this.apiUrl}/api/announcements/${this.deleteTarget.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => { this.closeDeleteModal(); this.loadAnnouncements(); },
      error: (err) => console.error('Error deleting:', err)
    });
  }

  startDrag(event: MouseEvent, modalId: string) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    this.isDragging = true;
    this.dragTarget = modalId;
    const rect = modal.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    modal.style.position = 'fixed';
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.transform = 'none';
    event.preventDefault();
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging || !this.dragTarget) return;
    const modal = document.getElementById(this.dragTarget);
    if (!modal) return;
    modal.style.left = (event.clientX - this.dragOffsetX) + 'px';
    modal.style.top = (event.clientY - this.dragOffsetY) + 'px';
  }

  onDragEnd() {
    if (this.dragTarget) {
      const modal = document.getElementById(this.dragTarget);
      if (modal) { modal.style.position = ''; modal.style.left = ''; modal.style.top = ''; modal.style.transform = ''; }
    }
    this.isDragging = false;
    this.dragTarget = null;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showFormModal) this.closeFormModal();
    if (this.showDeleteModal) this.closeDeleteModal();
  }
}