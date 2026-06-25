import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container">
      <div class="section-header">
        <div class="section-title">👥 User Management</div>
        <button class="btn btn-primary btn-sm" (click)="showAddUser = !showAddUser">+ Add User</button>
      </div>

      <!-- Add User Form -->
      <div class="card" *ngIf="showAddUser">
        <h3>Create New User</h3>
        <div class="form-grid">
          <input class="form-input" placeholder="Full Name" [(ngModel)]="newUser.fullname">
          <input class="form-input" placeholder="Username" [(ngModel)]="newUser.username">
          <input class="form-input" type="email" placeholder="Email" [(ngModel)]="newUser.email">
          <input class="form-input" type="password" placeholder="Password" [(ngModel)]="newUser.password">
          <select class="form-input" [(ngModel)]="newUser.role">
            <option value="user">User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
          <input class="form-input" placeholder="Department" [(ngModel)]="newUser.department">
        </div>
        <div class="form-actions">
          <button class="btn btn-success" (click)="addUser()">Create User</button>
          <button class="btn btn-ghost" (click)="showAddUser = false">Cancel</button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <table class="data-table">
          <thead>
            <tr><th>User</th><th>Username</th><th>Role</th><th>Department</th><th>Email</th><th>Joined</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>
                <div class="user-cell">
                  <div class="avatar" [style.background]="user.avatarColor">{{ user.fullname.charAt(0) }}</div>
                  <strong>{{ user.fullname }}</strong>
                </div>
              </td>
              <td>{{ user.username }}</td>
              <td><span class="role-badge" [class]="'role-' + user.role">{{ user.role }}</span></td>
              <td>{{ user.department }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.joined }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-container { padding: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-title { font-size: 18px; font-weight: 700; }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
    .btn-primary { background: linear-gradient(135deg, #4f8ef7, #7c6af7); color: white; }
    .btn-success { background: #22c55e; color: white; }
    .btn-ghost { background: #191c24; color: #e8eaf0; border: 1px solid #272b38; }
    .card { background: #111318; border: 1px solid #272b38; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .form-input {
      background: #191c24; border: 1px solid #272b38; border-radius: 8px;
      padding: 10px; color: #e8eaf0; width: 100%;
    }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px; background: #191c24; color: #8b90a4; font-size: 11px; text-transform: uppercase; }
    .data-table td { padding: 12px; border-bottom: 1px solid #272b38; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
    .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .role-admin { background: rgba(239,68,68,.15); color: #f87171; }
    .role-agent { background: rgba(79,142,247,.15); color: #93c5fd; }
    .role-user { background: rgba(156,163,175,.15); color: #9ca3af; }
  `]
})
export class UserListComponent {
  showAddUser = false;
  users = [
    { fullname: 'System Administrator', username: 'admin', role: 'admin', department: 'IT', email: 'admin@edptech.com', joined: '2024-01-01', avatarColor: '#ef4444' },
    { fullname: 'John Smith', username: 'jsmith', role: 'user', department: 'HR', email: 'jsmith@edptech.com', joined: '2024-01-15', avatarColor: '#3b82f6' }
  ];
  newUser = { fullname: '', username: '', email: '', password: '', role: 'user', department: '' };

  addUser() {
    if (this.newUser.fullname && this.newUser.username) {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      this.users.push({
        ...this.newUser,
        joined: new Date().toISOString().split('T')[0],
        avatarColor: colors[Math.floor(Math.random() * colors.length)]
      });
      this.newUser = { fullname: '', username: '', email: '', password: '', role: 'user', department: '' };
      this.showAddUser = false;
    }
  }
}