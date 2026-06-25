import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-wrapper">

      <div class="profile-body" *ngIf="currentUser">

        <!-- ── Sidebar ─────────────────────────────────────── -->
        <aside class="sidebar">

          <!-- Avatar card -->
          <div class="card avatar-card">
            <div class="avatar-wrap" (click)="triggerPhotoUpload()">
              <div class="avatar-ring">
                <div class="avatar-circle" [style.background]="!editForm.photo_url ? (editForm.avatar_color || '#3b5bdb') : 'transparent'">
                  <img *ngIf="editForm.photo_url" [src]="getPhotoUrl()" alt="Photo" class="avatar-img">
                  <span *ngIf="!editForm.photo_url" class="avatar-initial">{{ currentUser.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
                </div>
              </div>
              <div class="avatar-overlay">
                <span>{{ uploadingPhoto ? '⏳' : '📷' }}</span>
              </div>
            </div>
            <input type="file" #photoInput accept="image/*" (change)="handlePhotoUpload($event)" style="display:none">

            <h2 class="user-name">{{ currentUser.fullname }}</h2>
            <div class="badge-row">
              <span class="badge badge-role" [class]="'role-' + currentUser.role">{{ currentUser.role | titlecase }}</span>
              <span class="badge badge-dept">{{ currentUser.department || 'EDP' }}</span>
            </div>

            <!-- On-leave indicator -->
            <div class="leave-pill active" *ngIf="isOnLeave()">🔴 On Leave</div>
            <div class="leave-pill ok" *ngIf="!isOnLeave()">✅ Active</div>
          </div>

          <!-- Quick Info -->
          <div class="card info-card">
            <div class="info-row">
              <span class="info-icon">🪪</span>
              <div>
                <div class="info-label">Username</div>
                <div class="info-val">{{ currentUser.username }}</div>
              </div>
            </div>
            <div class="info-row">
              <span class="info-icon">📧</span>
              <div>
                <div class="info-label">Email</div>
                <div class="info-val">{{ currentUser.email || '—' }}</div>
              </div>
            </div>
            <div class="info-row">
              <span class="info-icon">🏢</span>
              <div>
            <div class="info-label">Account Type</div>
            <div class="info-val">{{ getAccountType() }}</div>
            </div>
            </div>
            <div class="info-row">
              <span class="info-icon">📅</span>
              <div>
                <div class="info-label">Member Since</div>
                <div class="info-val">{{ currentUser.created_at | date:'MMM d, yyyy h:mm a' }}</div>
              </div>
            </div>
          </div>

          <!-- Avatar Color -->
          <div class="card">
            <div class="card-title">🎨 Avatar Color</div>
            <div class="color-grid">
              <button *ngFor="let c of avatarColors" class="swatch" [style.background]="c"
                      [class.selected]="editForm.avatar_color === c" (click)="editForm.avatar_color = c">
                <span *ngIf="editForm.avatar_color === c">✓</span>
              </button>
            </div>
          </div>

        </aside>

        <!-- ── Main Content ─────────────────────────────────── -->
        <main class="main-content">

          <!-- Personal Information -->
         <div class="card">
  <div class="card-title">
    📝 Personal Information
    <div class="header-actions" *ngIf="currentUser">
      <button class="btn btn-ghost" *ngIf="!editMode" (click)="editMode = true">
        <span>✏️</span> Edit Profile
      </button>
      <button class="btn btn-ghost" *ngIf="editMode" (click)="cancelEdit()">Cancel</button>
      <button class="btn btn-primary" *ngIf="editMode" (click)="saveProfile()" [disabled]="saving">
        <span>{{ saving ? '⏳' : '💾' }}</span> {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>
  </div>
            <div class="form-grid two-col">
              <div class="field">
                <label>Username</label>
                <input type="text" class="input" [(ngModel)]="editForm.username" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Full Name</label>
                <input type="text" class="input" [(ngModel)]="editForm.fullname" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Email Address</label>
                <input type="email" class="input" [(ngModel)]="editForm.email" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Birthdate</label>
                <input type="date" class="input" [(ngModel)]="editForm.birthdate" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Department</label>
                <input type="text" class="input" [(ngModel)]="editForm.department" disabled>
              </div>
              <div class="field">
                <label>Role</label>
                <input type="text" class="input" [(ngModel)]="editForm.role" disabled>
              </div>
            </div>
          </div>

          <!-- Work Schedule -->
          <div class="card">
            <div class="card-title">📅 Work Schedule</div>
            <div class="field">
              <label>Work Days</label>
              <div class="day-chips">
                <label *ngFor="let day of weekDays" class="day-chip" [class.active]="editForm.workDays.includes(day)" [class.disabled]="!editMode">
                  <input type="checkbox" [value]="day" [checked]="editForm.workDays.includes(day)"
                         (change)="toggleWorkDay(day)" [disabled]="!editMode" style="display:none">
                  {{ day.slice(0,3) }}
                </label>
              </div>
              <div class="dayoff-hint" *ngIf="editForm.dayOff.length > 0">
                📌 Day off: <strong>{{ getDayOffDisplay() }}</strong>
              </div>
            </div>

            <div class="form-grid two-col" style="margin-top:12px">
              <div class="field">
                <label>Work Start</label>
                <input type="time" class="input" [(ngModel)]="editForm.workStart" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Work End</label>
                <input type="time" class="input" [(ngModel)]="editForm.workEnd" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Lunch Start</label>
                <input type="time" class="input" [(ngModel)]="editForm.lunchStart" [disabled]="!editMode">
              </div>
              <div class="field">
                <label>Lunch End</label>
                <input type="time" class="input" [(ngModel)]="editForm.lunchEnd" [disabled]="!editMode">
              </div>
            </div>
          </div>

          <!-- Leave Management -->
          <div class="card">
            <div class="card-title">🏖️ Leave Management</div>

            <!-- Current status -->
            <div class="leave-status-banner active" *ngIf="isOnLeave()">
              🔴 Currently on leave until <strong>{{ getLeaveEndDate() | date:'MMM d, yyyy' }}</strong>
            </div>
            <div class="leave-status-banner ok" *ngIf="!isOnLeave() && leaveEntries.length === 0">
              ✅ You are not currently on leave
            </div>

            <!-- Leave list -->
            <div class="leave-list" *ngIf="leaveEntries.length > 0">
              <div class="leave-entry" *ngFor="let leave of leaveEntries; let i = index">
                <div class="leave-icon-wrap">🏖️</div>
                <div class="leave-entry-info">
                  <span class="leave-range">{{ leave.startDate | date:'MMM d' }} – {{ leave.endDate | date:'MMM d, yyyy' }}</span>
                  <span class="leave-days">{{ getLeaveDuration(leave) }} day{{ getLeaveDuration(leave) !== 1 ? 's' : '' }}</span>
                </div>
                <button class="btn btn-danger-sm" *ngIf="editMode" (click)="removeLeave(i)">✕</button>
              </div>
            </div>

            <!-- Add leave -->
            <div class="add-leave-form" *ngIf="editMode">
              <div class="form-grid three-col align-end">
                <div class="field">
                  <label>Start Date</label>
                  <input type="date" class="input" [(ngModel)]="newLeave.startDate">
                </div>
                <div class="field">
                  <label>End Date</label>
                  <input type="date" class="input" [(ngModel)]="newLeave.endDate">
                </div>
                <div class="field">
                  <button class="btn btn-primary full-w"
                          (click)="addLeave()"
                          [disabled]="!newLeave.startDate || !newLeave.endDate || newLeave.endDate < newLeave.startDate">
                    ➕ Add Leave
                  </button>
                </div>
              </div>
              <div class="field-error" *ngIf="leaveError">{{ leaveError }}</div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card">
            <div class="card-title">🔒 Change Password</div>
            <div *ngIf="!showPasswordFields">
              <button class="btn btn-ghost" (click)="showPasswordFields = true">Change Password</button>
            </div>
            <div *ngIf="showPasswordFields">
              <div class="field">
                <label>Current Password</label>
                <input type="password" class="input" [(ngModel)]="passwordForm.currentPassword">
              </div>
              <div class="form-grid two-col">
                <div class="field">
                  <label>New Password</label>
                  <input type="password" class="input" [(ngModel)]="passwordForm.newPassword">
                </div>
                <div class="field">
                  <label>Confirm Password</label>
                  <input type="password" class="input" [(ngModel)]="passwordForm.confirmPassword">
                </div>
              </div>
              <div class="btn-row">
                <button class="btn btn-ghost" (click)="showPasswordFields = false">Cancel</button>
                <button class="btn btn-primary" (click)="changePassword()" [disabled]="!canChangePassword()">Update Password</button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Tokens ──────────────────────────────────────────────── */
    :host {
      display: block;
      --bg: #f0f2f7;
      --surface: #ffffff;
      --border: #e2e6f0;
      --primary: #3b5bdb;
      --primary-dark: #2f4bbd;
      --primary-light: #eef1ff;
      --text: #000000;
      --text-muted: #181616;
      --danger: #e03131;
      --danger-light: #fff5f5;
      --success: #2f9e44;
      --success-light: #ebfbee;
      --warning-light: #fff9db;
      --radius: 12px;
      --radius-sm: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
      --shadow-hover: 0 4px 20px rgba(59,91,219,.18);
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      color: var(--text);
    }

    /* ── Layout ──────────────────────────────────────────────── */
    .profile-body {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 16px;
      align-items: start;
    }

    /* ── Sidebar ─────────────────────────────────────────────── */
    .sidebar { display: flex; flex-direction: column; gap: 12px; margin: 5px; }

    /* ── Cards ───────────────────────────────────────────────── */
    .card {
  background: var(--surface); 
  border-radius: var(--radius);
  padding: 16px; 
  box-shadow: var(--shadow); 
  border: 1px solid var(--border);
}

.card-title {
  font-size: 11px; 
  font-weight: 700; 
  text-transform: uppercase;
  letter-spacing: .06em; 
  color: var(--primary); 
  margin-bottom: 14px;
  padding-bottom: 8px; 
  border-bottom: 1px solid var(--border);
  display: flex;                    /* ADD THIS */
  justify-content: space-between;  /* ADD THIS */
  align-items: center;             /* ADD THIS */
}

.header-actions { 
  display: flex; 
  gap: 8px; 
  align-items: center;  /* Changed from 'right' to 'center' */
}
    /* Avatar */
    .avatar-card { text-align: center; }
    .avatar-wrap {
      position: relative; width: 88px; height: 88px;
      margin: 0 auto 14px; cursor: pointer;
    }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .avatar-ring {
      width: 88px; height: 88px; border-radius: 50%;
      padding: 3px; background: linear-gradient(135deg, var(--primary), #818cf8);
    }
    .avatar-circle {
      width: 100%; height: 100%; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .avatar-initial { font-size: 32px; font-weight: 700; color: #fff; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,.45); display: flex; align-items: center;
      justify-content: center; font-size: 20px; opacity: 0;
      transition: opacity .2s; z-index: 2;
    }

    .user-name { margin: 0 0 8px; font-size: 15px; font-weight: 700; }
    .badge-row { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
    .badge {
      padding: 3px 9px; border-radius: 100px; font-size: 10px;
      font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
    }
    .badge-role.role-admin { background: #fff0f0; color: var(--danger); }
    .badge-role.role-technician { background: #ebfbee; color: var(--success); }
    .badge-role.role-user { background: var(--primary-light); color: var(--primary); }
    .badge-dept { background: #f1f5ff; color: #374295; }

    .leave-pill {
      display: inline-block; font-size: 11px; padding: 4px 10px;
      border-radius: 100px; font-weight: 600; margin-top: 4px;
    }
    .leave-pill.active { background: #fff0f0; color: var(--danger); }
    .leave-pill.ok { background: var(--success-light); color: var(--success); }

    /* Quick info list */
    .info-card { display: flex; flex-direction: column; gap: 0; }
    .info-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid var(--border);
    }
    .info-row:last-child { border-bottom: none; }
    .info-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; margin-top: 1px; }
    .info-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .info-val { font-size: 12px; font-weight: 500; color: rgb(0, 0, 0); margin-top: 1px; word-break: break-all; }

    /* Color swatches */
    .color-grid { display: flex; gap: 8px; flex-wrap: wrap; }
    .swatch {
      width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; display: flex; align-items: center;
      justify-content: center; font-size: 11px; color: #fff; font-weight: 700;
      transition: transform .15s, box-shadow .15s;
      padding: 0;
    }
    .swatch:hover { transform: scale(1.12); box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .swatch.selected { border-color: #1a1d2e; box-shadow: 0 0 0 3px rgba(59,91,219,.3); }

    /* ── Main content ────────────────────────────────────────── */
    .main-content { display: flex; flex-direction: column; gap: 12px; }

    /* Forms */
    .form-grid { display: grid; gap: 12px; }
    .form-grid.two-col { grid-template-columns: 1fr 1fr; }
    .form-grid.three-col { grid-template-columns: 1fr 1fr auto; }
    .align-end { align-items: end; }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .05em;
    }
    .input {
      width: 100%; padding: 8px 10px; font-size: 12px; color: var(--text);
      background: #fafbff; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-family: inherit; box-sizing: border-box; transition: border-color .15s, box-shadow .15s;
      outline: none;
    }
    .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,91,219,.12); }
    .input:disabled { background: #f4f5f9; color: var(--text-muted); cursor: default; }

    /* Day chips */
    .day-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .day-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 34px; border-radius: var(--radius-sm);
      font-size: 11px; font-weight: 600; cursor: pointer;
      border: 1px solid var(--border); background: #f8f9fc; color: var(--text-muted);
      transition: all .15s; user-select: none;
    }
    .day-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
    .day-chip.disabled { cursor: default; color: #fff;}
    .dayoff-hint { margin-top: 8px; font-size: 11px; color: rgb(253, 253, 253); }

    /* Leave management */
    .leave-status-banner {
      border-radius: var(--radius-sm); padding: 10px 14px;
      font-size: 12px; margin-bottom: 12px;
    }
    .leave-status-banner.active { background: var(--danger-light); color: var(--danger); }
    .leave-status-banner.ok { background: var(--success-light); color: var(--success); }

    .leave-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; max-height: 180px; overflow-y: auto; }
    .leave-entry {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; background: #f8f9fc; border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .leave-icon-wrap { font-size: 18px; flex-shrink: 0; }
    .leave-entry-info { flex: 1; display: flex; flex-direction: column; }
    .leave-range { font-size: 12px; font-weight: 600; }
    .leave-days { font-size: 10px; color: var(--text-muted); }

    .add-leave-form { background: #f8f9fc; border: 1px dashed var(--border); border-radius: var(--radius-sm); padding: 12px; }
    .field-error { font-size: 11px; color: var(--danger); margin-top: 6px; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
      font-size: 12px; font-weight: 600; font-family: inherit;
      border-radius: var(--radius-sm); border: 1px solid transparent;
      cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); box-shadow: var(--shadow-hover); }
    .btn-ghost { background: var(--surface); color: var(--text); border-color: var(--border); }
    .btn-ghost:hover:not(:disabled) { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
    .btn-danger-sm {
      background: var(--danger-light); color: var(--danger);
      border-color: #fcc; padding: 3px 8px; font-size: 11px;
    }
    .btn-danger-sm:hover { background: #ffe4e4; }
    .btn-row { display: flex; gap: 8px; margin-top: 12px; }
    .full-w { width: 100%; justify-content: center; }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 700px) {
      .profile-body { grid-template-columns: 1fr; }
      .form-grid.two-col { grid-template-columns: 1fr; }
      .form-grid.three-col { grid-template-columns: 1fr 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  currentUser: any;
  editMode = false;
  saving = false;
  showPasswordFields = false;

  editForm = {
    fullname: '', email: '', username: '', department: '', role: '',
    avatar_color: '#3b5bdb', photo_url: '', birthdate: '',
    workDays: [] as string[], dayOff: [] as string[],
    workStart: '', workEnd: '', lunchStart: '', lunchEnd: ''
  };

  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  readonly avatarColors = ['#ef4444','#3b5bdb','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#0a3a8c','#cc0000','#008800','#cc6600'];
  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  leaveEntries: { startDate: string; endDate: string }[] = [];
  newLeave = { startDate: '', endDate: '' };
  leaveError = '';
  uploadingPhoto = false;

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {}

  getPhotoUrl(): string {
    const photo = this.editForm.photo_url;
    if (!photo) return '';
    if (photo.startsWith('data:')) return photo;
    if (photo.startsWith('http')) return photo;
    return `${environment.apiUrl}${photo}`;
  }

  getAccountType(): string {
  if (!this.currentUser) return 'Unknown';
  
  // Based on the role from users table
  if (this.currentUser.role === 'admin') return 'Administrator';
  if (this.currentUser.role === 'Technician') return 'Technician';
  if (this.currentUser.role === 'user') return 'EDP Staff';
  
  return 'EDP Staff';
}
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        let workDaysArr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        let dayOffArr = ['Saturday', 'Sunday'];
        const accountType = user.user_table === 'user';
        try { if (user.workDays) workDaysArr = JSON.parse(user.workDays); } catch(e) {}
        try { if (user.dayOff) dayOffArr = JSON.parse(user.dayOff); } catch(e) {}
        try {
          if ((user as any).leaveEntries) this.leaveEntries = JSON.parse((user as any).leaveEntries);
        } catch(e) { this.leaveEntries = []; }

        this.editForm = {
          fullname: user.fullname || '',
          email: user.email || '',
          username: user.username || '',
          department: user.department || '',
          role: user.role || '',
          avatar_color: user.avatar_color || '#3b5bdb',
          photo_url: user.photo_url || '',
          birthdate: (user as any).birthdate || '',
          workDays: workDaysArr,
          dayOff: dayOffArr,
          workStart: (user as any).workStart || '08:00',
          workEnd: (user as any).workEnd || '17:00',
          lunchStart: (user as any).lunchStart || '12:00',
          lunchEnd: (user as any).lunchEnd || '13:00'
        };

        this.updateDayOff();
      }
    });
  }

  triggerPhotoUpload() {
    const input = document.querySelector('input[type="file"]') as HTMLElement;
    input?.click();
  }

  handlePhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editForm.photo_url = e.target.result;
        this.savePhoto(file);
      };
      reader.readAsDataURL(file);
    }
  }

  savePhoto(file: File) {
    if (!this.currentUser) return;
    this.uploadingPhoto = true;
    const formData = new FormData();
    formData.append('photo', file);
    const table = this.currentUser.user_table === 'new_user' ? 'new_user' : 'users';
    this.http.post(`${environment.apiUrl}/api/profile/${table}/${this.currentUser.id}/upload-photo`, formData).subscribe({
      next: (res: any) => {
        this.editForm.photo_url = res.file_path;
        const updated = { ...this.currentUser, photo_url: res.file_path };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        this.uploadingPhoto = false;
      },
      error: (err) => {
        console.error('Photo upload error:', err);
        this.uploadingPhoto = false;
        alert('Failed to upload photo. Please try again.');
      }
    });
  }

  toggleWorkDay(day: string) {
    if (!this.editMode) return;
    const index = this.editForm.workDays.indexOf(day);
    if (index > -1) this.editForm.workDays.splice(index, 1);
    else this.editForm.workDays.push(day);
    this.updateDayOff();
  }

  updateDayOff() {
    this.editForm.dayOff = this.weekDays.filter(d => !this.editForm.workDays.includes(d));
  }

  getDayOffDisplay(): string {
    if (this.editForm.dayOff.length === 0) return 'None';
    if (this.editForm.dayOff.length === 7) return 'All days';
    return this.editForm.dayOff.join(', ');
  }

  addLeave() {
    if (!this.newLeave.startDate || !this.newLeave.endDate) { this.leaveError = 'Please select both start and end dates.'; return; }
    if (this.newLeave.endDate < this.newLeave.startDate) { this.leaveError = 'End date cannot be before start date.'; return; }
    const start = new Date(this.newLeave.startDate);
    const end = new Date(this.newLeave.endDate);
    const hasOverlap = this.leaveEntries.some(leave => {
      const ls = new Date(leave.startDate), le = new Date(leave.endDate);
      return start <= le && end >= ls;
    });
    if (hasOverlap) { this.leaveError = 'This leave overlaps with an existing leave entry.'; return; }
    this.leaveEntries.push({ startDate: this.newLeave.startDate, endDate: this.newLeave.endDate });
    this.leaveEntries.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.newLeave = { startDate: '', endDate: '' };
    this.leaveError = '';
  }

  removeLeave(index: number) { this.leaveEntries.splice(index, 1); }

  isOnLeave(): boolean {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.leaveEntries.some(leave => {
      const s = new Date(leave.startDate), e = new Date(leave.endDate);
      return today >= s && today <= e;
    });
  }

  getLeaveEndDate(): string {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cur = this.leaveEntries.find(leave => {
      const s = new Date(leave.startDate), e = new Date(leave.endDate);
      return today >= s && today <= e;
    });
    return cur?.endDate || '';
  }

  getLeaveDuration(leave: { startDate: string; endDate: string }): number {
    const diff = new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime();
    return Math.ceil(diff / 86400000) + 1;
  }

  saveProfile() {
    if (!this.currentUser) return;
    this.saving = true;
    const payload = {
      ...this.editForm,
      workDays: JSON.stringify(this.editForm.workDays),
      dayOff: JSON.stringify(this.editForm.dayOff),
      leaveEntries: JSON.stringify(this.leaveEntries)
    };
    this.http.put(`${environment.apiUrl}/api/profile/users/${this.currentUser.id}`, payload).subscribe({
      next: (res: any) => {
        const updated = { ...this.currentUser, ...this.editForm, leaveEntries: JSON.stringify(this.leaveEntries) };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        this.editMode = false; this.saving = false;
        alert('Profile updated!');
      },
      error: (err) => { this.saving = false; alert('Error: ' + (err.error?.message || err.message)); }
    });
  }

  canChangePassword(): boolean {
    return !!(this.passwordForm.currentPassword && this.passwordForm.newPassword &&
              this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
              this.passwordForm.newPassword.length >= 3);
  }

  changePassword() {
    if (!this.canChangePassword()) return;
    this.http.post(`${environment.apiUrl}/api/profile/users/${this.currentUser.id}/change-password`, this.passwordForm).subscribe({
      next: () => {
        alert('Password changed!'); this.showPasswordFields = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  cancelEdit() { this.editMode = false; this.ngOnInit(); }
  goBack() { this.router.navigate(['/dashboard']); }
}