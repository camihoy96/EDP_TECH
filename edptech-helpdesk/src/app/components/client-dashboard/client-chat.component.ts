import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ChatUser {
  userId?: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  department: string;
  branch_id?: number;
  branch_name?: string;
  avatar_color: string;
  photo_url: string | null;
  status: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  userType: 'staff' | 'client';
}

interface ChatMessage {
  id: number;
  from_username: string;
  to_username: string;
  message: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  reply_to_id: number | null;
  reply_to_message: string | null;
  reply_to_username: string | null;
  timestamp: Date;
  is_read: boolean;
}

@Component({
  selector: 'app-client-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-header-left">
          <h2>💬 Messages</h2>
        </div>
        <div class="chat-header-right">
          <span class="branch-badge" *ngIf="currentBranch">🏢 {{ currentBranch.name }}</span>
          <span class="online-count">Total: {{ filteredUsers.length }} users</span>
        </div>
      </div>

      <div class="chat-layout">
        <!-- Users Panel -->
        <div class="chat-users-panel">
          <div class="search-box">
            <input type="text" [(ngModel)]="searchTerm" (input)="filterUsers()" placeholder="Search users..." class="search-input">
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="users-list">
            <div class="user-item" *ngFor="let user of filteredUsers" 
                 [class.active]="selectedUser?.username === user.username" 
                 (click)="selectUser(user)">
              <div class="user-avatar" [style.backgroundColor]="user.avatar_color || '#4f46e5'">
                <img *ngIf="user.photo_url" [src]="apiUrl + user.photo_url" [alt]="user.fullname">
                <span *ngIf="!user.photo_url">{{ getInitials(user.fullname) }}</span>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.fullname }}</div>
                <div class="user-dept">{{ user.department || 'General' }}</div>
                <div class="user-last-message">{{ user.lastMessage || 'No messages yet' }}</div>
              </div>
             <div class="user-badge" *ngIf="user.unreadCount > 0">{{ user.unreadCount > 99 ? '99+' : user.unreadCount }}</div>
            </div>
            <div class="no-users" *ngIf="filteredUsers.length === 0">
              <span>📭</span>
              <p>No contacts available in your branch</p>
            </div>
          </div>
        </div>

        <!-- Messages Panel -->
        <div class="chat-messages-panel" *ngIf="selectedUser">
          <div class="chat-user-info">
            <div class="chat-user-avatar" [style.backgroundColor]="selectedUser.avatar_color || '#4f46e5'">
              <img *ngIf="selectedUser.photo_url" [src]="apiUrl + selectedUser.photo_url" [alt]="selectedUser.fullname">
              <span *ngIf="!selectedUser.photo_url">{{ getInitials(selectedUser.fullname) }}</span>
            </div>
            <div class="chat-user-details">
              <div class="chat-user-name">{{ selectedUser.fullname }}</div>
              <div class="chat-user-status">{{ selectedUser.department || 'General' }}</div>
            </div>
            <div class="chat-header-actions">
              <button class="delete-convo-btn" (click)="deleteConversation()" title="Delete conversation">🗑️</button>
            </div>
          </div>

          <div class="messages-area" #messagesContainer>
            <div class="message" *ngFor="let msg of messages" [class.my-message]="msg.from_username === currentUsername">
              <div class="message-bubble">
                <p *ngIf="msg.message">{{ msg.message }}</p>
                <small>{{ msg.timestamp | date:'shortTime' }}</small>
              </div>
            </div>
            <div class="no-messages" *ngIf="messages.length === 0">
              <span>💬</span>
              <p>Start a conversation!</p>
            </div>
          </div>

          <div class="message-input-area">
            <textarea [(ngModel)]="newMessage" (keyup.enter)="sendMessage($event)" 
                      placeholder="Type your message..." rows="2" class="message-input"></textarea>
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">Send</button>
          </div>
        </div>

        <div class="no-user-selected" *ngIf="!selectedUser">
          <div class="no-user-content">
            <span>💬</span>
            <h3>Select a conversation</h3>
            <p>Choose a user from the list to start chatting</p>
          </div>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <div class="confirm-overlay" *ngIf="showConfirmDialog" (click)="cancelConfirm()">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <div class="confirm-icon">⚠️</div>
          <h3>Delete Conversation?</h3>
          <p>This will delete all messages with this user.</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" (click)="cancelConfirm()">Cancel</button>
            <button class="confirm-btn confirm" (click)="confirmAction()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #f5f5f5; font-family: 'Segoe UI', sans-serif; }
    .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #0a246a; color: white; }
    .chat-header h2 { margin: 0; font-size: 16px; }
    .branch-badge { font-size: 11px; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 12px; }
    .online-count { font-size: 11px; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 12px; }

    .chat-layout { display: flex; flex: 1; overflow: hidden; }
    .chat-users-panel { width: 320px; background: white; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; }
    .search-box { padding: 12px; position: relative; border-bottom: 1px solid #e0e0e0; }
    .search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; }
    .search-icon { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #999; }

    .users-list { flex: 1; overflow-y: auto; }
    .user-item { display: flex; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
    .user-item:hover { background: #f8f9fa; }
    .user-item.active { background: #e8f0ff; }
    .user-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px; overflow: hidden; flex-shrink: 0; }
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-weight: 600; font-size: 13px; color: #333; }
    .user-dept { font-size: 10px; color: #888; }
    .user-last-message { font-size: 11px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-badge { background: #ef4444; color: white; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 10px; }
    .no-users { text-align: center; padding: 60px; color: #999; }
    .no-users span { font-size: 40px; display: block; margin-bottom: 10px; }

    .chat-messages-panel { flex: 1; display: flex; flex-direction: column; background: #f9f9f9; }
    .chat-user-info { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-bottom: 1px solid #e0e0e0; }
    .chat-header-actions { margin-left: auto; }
    .delete-convo-btn { background: rgba(0,0,0,0.05); border: none; cursor: pointer; font-size: 16px; padding: 6px 8px; border-radius: 6px; }
    .delete-convo-btn:hover { background: rgba(239,68,68,0.1); }
    .chat-user-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; overflow: hidden; }
    .chat-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .chat-user-name { font-weight: 600; font-size: 13px; }
    .chat-user-status { font-size: 11px; color: #888; }

    .messages-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .message { display: flex; }
    .my-message { justify-content: flex-end; }
    .message-bubble { max-width: 70%; padding: 8px 12px; border-radius: 12px; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .my-message .message-bubble { background: #e3f2fd; }
    .message-bubble p { margin: 0 0 2px 0; font-size: 12px; color: #1a1d24; }
    .message-bubble small { font-size: 9px; color: #888; }
    .no-messages { text-align: center; padding: 40px; color: #aaa; }
    .no-messages span { font-size: 36px; display: block; margin-bottom: 8px; }

    .message-input-area { display: flex; gap: 10px; align-items: center; padding: 12px 16px; background: white; border-top: 1px solid #e0e0e0; }
    .message-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; resize: none; font-family: inherit; }
    .message-input:focus { outline: none; border-color: #0a246a; }
    .send-btn { padding: 8px 18px; background: #0a246a; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .no-user-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: #f9f9f9; }
    .no-user-content { text-align: center; color: #aaa; }
    .no-user-content span { font-size: 48px; display: block; margin-bottom: 12px; }
    .no-user-content h3 { margin: 0 0 6px 0; font-size: 15px; color: #666; }
    .no-user-content p { margin: 0; font-size: 12px; }

    .confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .confirm-dialog { background: white; border-radius: 12px; padding: 28px; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .confirm-icon { font-size: 40px; margin-bottom: 12px; }
    .confirm-dialog h3 { margin: 0 0 8px 0; font-size: 16px; }
    .confirm-dialog p { margin: 0 0 20px 0; font-size: 13px; color: #666; }
    .confirm-actions { display: flex; gap: 8px; justify-content: center; }
    .confirm-btn { padding: 8px 20px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; }
    .confirm-btn.confirm { background: #ef4444; color: white; }
  `]
})
export class ClientChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  apiUrl = environment.apiUrl;
  currentBranch: any = null;
  
  users: ChatUser[] = [];
  filteredUsers: ChatUser[] = [];
  selectedUser: ChatUser | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  searchTerm = '';
  
  currentUsername = '';
  currentUserBranchId: number | null = null;
  currentUserDeptId: number | null = null;
  private messagePolling: any;

  showConfirmDialog = false;
  confirmCallback: (() => void) | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUsername = currentUser.username || '';
    this.currentUserBranchId = currentUser.branch_id || null;
    this.currentUserDeptId = currentUser.department_id || null;
    
    this.loadBranchInfo();
    this.loadUsers();
    
    this.messagePolling = setInterval(() => {
      if (this.selectedUser) this.loadMessages();
      this.loadUnreadCounts();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.messagePolling) clearInterval(this.messagePolling);
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { 'Authorization': `Bearer ${token}` };
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
  }

  loadBranchInfo() {
    if (!this.currentUserBranchId) return;
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.currentBranch = branches.find(b => b.id === Number(this.currentUserBranchId)) || null;
      }
    });
  }

  // ✅ Load ALL users from SAME BRANCH (both staff and clients)
loadUsers() {
    const headers = this.getHeaders();
    const branchId = this.currentUserBranchId;

    if (!branchId) {
      this.users = [];
      this.filteredUsers = [];
      return;
    }

    // Load staff users from users table
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (staffData) => {
        const staffUsers = (staffData || [])
          .filter((u: any) => {
            const sameBranch = u.branch_id === Number(branchId);
            const notMe = u.username !== this.currentUsername;
            return sameBranch && notMe;
          })
          .map((u: any) => ({
            userId: u.id,
            username: u.username,
            fullname: u.fullname,
            email: u.email || '',
            role: u.role || 'Staff',
            department: u.department || 'General',
            branch_id: u.branch_id,
            branch_name: this.currentBranch?.name || '',
            avatar_color: u.avatar_color || '#4f46e5',
            photo_url: u.photo_url || null,
            status: 'offline',
            unreadCount: 0,
            lastMessage: '',
            userType: 'staff' as const
          }));

        // Load client users from new_user table
        this.http.get<any[]>(`${environment.apiUrl}/api/admin/new-users`, { headers }).subscribe({
          next: (clientData) => {
            const clientUsers = (clientData || [])
              .filter((u: any) => {
                const sameBranch = u.branch_id === Number(branchId);
                const notMe = u.username !== this.currentUsername;
                return sameBranch && notMe;
              })
              .map((u: any) => ({
                userId: u.id,
                username: u.username,
                fullname: u.fullname,
                email: u.email || '',
                role: u.role || 'User',
                department: u.department || 'General',
                branch_id: u.branch_id,
                branch_name: this.currentBranch?.name || '',
                avatar_color: u.avatar_color || '#3b82f6',
                photo_url: u.photo_url || null,
                status: 'offline',
                unreadCount: 0,
                lastMessage: '',
                userType: 'client' as const
              }));

            // Combine both lists, removing duplicates by username
            const allUsers = [...staffUsers, ...clientUsers];
            const uniqueUsers = allUsers.filter((user, index, self) =>
              index === self.findIndex(u => u.username === user.username)
            );

            this.users = uniqueUsers;
            this.filterUsers();
            this.loadUnreadCounts();
            this.loadLastMessages();
          },
          error: (err) => {
            console.error('Failed to load client users:', err);
            // Still use staff users if client users fail
            this.users = staffUsers;
            this.filterUsers();
            this.loadUnreadCounts();
            this.loadLastMessages();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load staff users:', err);
        // Try loading just client users
        this.http.get<any[]>(`${environment.apiUrl}/api/admin/new-users`, { headers }).subscribe({
          next: (clientData) => {
            this.users = (clientData || [])
              .filter((u: any) => u.branch_id === Number(branchId) && u.username !== this.currentUsername)
              .map((u: any) => ({
                userId: u.id,
                username: u.username,
                fullname: u.fullname,
                email: u.email || '',
                role: u.role || 'User',
                department: u.department || 'General',
                branch_id: u.branch_id,
                branch_name: this.currentBranch?.name || '',
                avatar_color: u.avatar_color || '#3b82f6',
                photo_url: u.photo_url || null,
                status: 'offline',
                unreadCount: 0,
                lastMessage: '',
                userType: 'client' as const
              }));
            this.filterUsers();
            this.loadUnreadCounts();
            this.loadLastMessages();
          },
          error: () => {
            this.users = [];
            this.filteredUsers = [];
          }
        });
      }
    });
  }

  loadUnreadCounts() {
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/unread/${this.currentUsername}`, { headers: this.getHeaders() }).subscribe({
      next: (unread) => {
        this.users.forEach(user => {
          const match = (unread || []).find((u: any) => u.from_username === user.username);
          user.unreadCount = match ? match.count : 0;
        });
        this.filterUsers();
      }
    });
  }

  loadLastMessages() {
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/last/${this.currentUsername}`, { headers: this.getHeaders() }).subscribe({
      next: (lastMessages) => {
        (lastMessages || []).forEach((msg: any) => {
          const user = this.users.find(u => u.username === msg.username);
          if (user) {
            user.lastMessage = msg.message;
            user.lastMessageTime = new Date(msg.timestamp);
          }
        });
        this.filterUsers();
      }
    });
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = term
      ? this.users.filter(u => u.fullname.toLowerCase().includes(term) || u.department.toLowerCase().includes(term))
      : [...this.users];
  }

  selectUser(user: ChatUser) {
    this.selectedUser = user;
    this.newMessage = '';
    if (user.unreadCount > 0) {
      this.markAsRead(user.username);  // ✅ Marks messages as read
      user.unreadCount = 0;             // ✅ Clears the badge
    }
    this.loadMessages();
  }

  loadMessages() {
    if (!this.selectedUser) return;
    this.http.get<ChatMessage[]>(`${environment.apiUrl}/api/messages/${this.selectedUser.username}`, { headers: this.getHeaders() }).subscribe({
      next: (msgs) => { this.messages = msgs || []; this.scrollToBottom(); },
      error: () => { this.messages = []; }
    });
  }

  markAsRead(fromUsername: string) {
    this.http.put(`${environment.apiUrl}/api/messages/read/${fromUsername}`, {}, { headers: this.getHeaders() }).subscribe();
  }

  sendMessage(event?: Event) {
    if (event) {
      if (event instanceof KeyboardEvent && event.shiftKey) return;
      event.preventDefault();
    }
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const formData = new FormData();
    formData.append('to_username', this.selectedUser.username);
    formData.append('message', this.newMessage.trim());

    this.http.post(`${environment.apiUrl}/api/messages`, formData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadMessages();
        const user = this.users.find(u => u.username === this.selectedUser?.username);
        if (user) { user.lastMessage = this.newMessage || '...'; user.lastMessageTime = new Date(); }
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.messages-area');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  deleteConversation() {
    this.showConfirm('Delete all messages with this user?', () => {
      if (!this.selectedUser) return;
      this.http.delete(`${environment.apiUrl}/api/conversation/${this.selectedUser.username}`, { headers: this.getHeaders() }).subscribe({
        next: () => { this.messages = []; }
      });
    });
  }

  showConfirm(message: string, callback: () => void) {
    this.confirmCallback = callback;
    this.showConfirmDialog = true;
  }

  confirmAction() {
    if (this.confirmCallback) this.confirmCallback();
    this.showConfirmDialog = false;
  }

  cancelConfirm() {
    this.showConfirmDialog = false;
    this.confirmCallback = null;
  }
}