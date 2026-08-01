import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
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
          <span class="unread-count" *ngIf="totalUnreadCount > 0">{{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }} new</span>
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
                 [class.has-unread]="user.unreadCount > 0"
                 (click)="selectUser(user)">
              <div class="user-avatar" [style.backgroundColor]="user.avatar_color || '#4f46e5'">
                <img *ngIf="user.photo_url" [src]="apiUrl + user.photo_url" [alt]="user.fullname">
                <span *ngIf="!user.photo_url">{{ getInitials(user.fullname) }}</span>
                <span class="online-dot" *ngIf="user.status === 'online'"></span>
              </div>
              <div class="user-info">
                <div class="user-name">
                  {{ user.fullname }}
                  <span class="user-role-tag">{{ user.role }}</span>
                </div>
                <div class="user-dept">{{ user.department || 'General' }}</div>
                <div class="user-last-message">{{ user.lastMessage || 'No messages yet' }}</div>
              </div>
              <div class="user-meta">
                <div class="user-badge" *ngIf="user.unreadCount > 0">{{ user.unreadCount > 99 ? '99+' : user.unreadCount }}</div>
                <div class="user-time" *ngIf="user.lastMessageTime">{{ formatMessageTime(user.lastMessageTime) }}</div>
              </div>
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
              <div class="chat-user-status">{{ selectedUser.role }} · {{ selectedUser.department || 'General' }}</div>
            </div>
            <div class="chat-header-actions">
              <button class="delete-convo-btn" (click)="deleteConversation()" title="Delete conversation">🗑️</button>
            </div>
          </div>

          <!-- Reply Preview -->
          <div class="reply-preview" *ngIf="replyingTo">
            <div class="reply-preview-content">
              <small>Replying to {{ replyingTo.from_username }}</small>
              <p>{{ getReplyPreview(replyingTo.message || '') }}</p>
            </div>
            <button class="cancel-reply" (click)="cancelReply()">✕</button>
          </div>

          <div class="messages-area" #messagesContainer
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
            <div class="message" *ngFor="let msg of messages" [class.my-message]="msg.from_username === currentUsername">
              <div class="message-actions">
                <button class="action-btn reply-btn" (click)="replyToMessage(msg)" title="Reply">↩️</button>
                <button class="action-btn delete-btn" *ngIf="msg.from_username === currentUsername" (click)="deleteMessage(msg.id)" title="Delete">🗑️</button>
              </div>
              <div class="message-bubble" [class.has-reply]="msg.reply_to_id">
                <div class="reply-reference" *ngIf="msg.reply_to_id" (click)="scrollToMessage(msg.reply_to_id)">
                  <small>{{ msg.reply_to_username }}</small>
                  <p>{{ getReplyPreview(msg.reply_to_message || '') }}</p>
                </div>
                
                <!-- File Attachment -->
                <div class="file-attachment" *ngIf="msg.file_url">
                  <div class="file-preview" *ngIf="isImageFile(msg.file_type)">
                    <img [src]="apiUrl + msg.file_url" [alt]="msg.file_name" (click)="openImage(apiUrl + msg.file_url)">
                  </div>
                  <div class="file-info" *ngIf="!isImageFile(msg.file_type)">
                    <span class="file-icon">📎</span>
                    <a [href]="apiUrl + msg.file_url" target="_blank" class="file-name">{{ msg.file_name }}</a>
                  </div>
                </div>
                
                <p *ngIf="msg.message">{{ msg.message }}</p>
                <small>{{ msg.timestamp | date:'shortTime' }}</small>
              </div>
            </div>
            <div class="no-messages" *ngIf="messages.length === 0">
              <span>💬</span>
              <p>Start a conversation!</p>
            </div>
            
            <!-- Drag & Drop Overlay -->
            <div class="drag-overlay" *ngIf="isDragging">
              <div class="drag-overlay-content">
                <span class="upload-icon">📤</span>
                <p>Drop files here to upload</p>
              </div>
            </div>
          </div>

          <!-- File Preview Before Sending -->
          <div class="file-send-preview" *ngIf="selectedFile">
            <div class="file-send-info">
              <span class="file-icon">📎</span>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
            </div>
            <button class="remove-file" (click)="removeSelectedFile()">✕</button>
          </div>

          <div class="message-input-area">
            <label class="attach-btn" title="Attach file">
              📎
              <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx" hidden>
            </label>
            <textarea [(ngModel)]="newMessage" (keyup.enter)="sendMessage($event)" 
                      placeholder="Type your message..." rows="2" class="message-input"></textarea>
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() && !selectedFile">Send</button>
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

      <!-- Image Preview Modal -->
      <div class="modal-overlay" *ngIf="showImagePreview" (click)="closeImagePreview()">
        <div class="image-modal" 
             [style.transform]="'translate(' + imageModalPos.x + 'px, ' + imageModalPos.y + 'px)'"
             (click)="$event.stopPropagation()">
          <div class="image-modal-header" (mousedown)="startDrag($event, 'image')">
            <span>🖼️ Image Preview</span>
            <button class="modal-close-btn" (click)="closeImagePreview()">✕</button>
          </div>
          <div class="image-modal-body">
            <img [src]="previewImageUrl" class="preview-image">
          </div>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <div class="modal-overlay" *ngIf="showConfirmDialog" (click)="cancelConfirm()">
        <div class="confirm-modal" 
             [style.transform]="'translate(' + confirmModalPos.x + 'px, ' + confirmModalPos.y + 'px)'"
             (click)="$event.stopPropagation()">
          <div class="confirm-modal-header" (mousedown)="startDrag($event, 'confirm')">
            <span>⚠️ Confirm Action</span>
            <button class="modal-close-btn" (click)="cancelConfirm()">✕</button>
          </div>
          <div class="confirm-modal-body">
            <div class="confirm-icon">⚠️</div>
            <h3>{{ confirmTitle }}</h3>
            <p>{{ confirmMessage }}</p>
          </div>
          <div class="confirm-modal-footer">
            <button class="confirm-btn cancel" (click)="cancelConfirm()">Cancel</button>
            <button class="confirm-btn confirm" (click)="confirmAction()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #f5f5f5; font-family: 'Segoe UI', sans-serif; }
    .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #0a246a; color: white; flex-shrink: 0; }
    .chat-header-left { display: flex; align-items: center; gap: 12px; }
    .chat-header h2 { margin: 0; font-size: 16px; }
    .chat-header-right { display: flex; gap: 8px; align-items: center; }
    .branch-badge { font-size: 11px; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 12px; }
    .unread-count { font-size: 11px; background: #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
    .online-count { font-size: 11px; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 12px; }

    .chat-layout { display: flex; flex: 1; overflow: hidden; }
    .chat-users-panel { width: 340px; background: white; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; }
    .search-box { padding: 12px; position: relative; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; }
    .search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; outline: none; }
    .search-input:focus { border-color: #0a246a; }
    .search-icon { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #999; }

    .users-list { flex: 1; overflow-y: auto; }
    .user-item { display: flex; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; gap: 10px; }
    .user-item:hover { background: #f8f9fa; }
    .user-item.active { background: #e8f0ff; }
    .user-item.has-unread { background: #fef3c7; }
    .user-item.has-unread:hover { background: #fde68a; }
    .user-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; overflow: hidden; flex-shrink: 0; position: relative; }
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .online-dot { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid white; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-weight: 600; font-size: 13px; color: #333; display: flex; align-items: center; gap: 4px; }
    .user-role-tag { font-size: 9px; background: #e8f0ff; color: #0a246a; padding: 1px 5px; border-radius: 3px; font-weight: 500; }
    .user-dept { font-size: 10px; color: #888; }
    .user-last-message { font-size: 11px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .user-badge { background: #ef4444; color: white; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 10px; }
    .user-time { font-size: 9px; color: #999; }
    .no-users { text-align: center; padding: 60px; color: #999; }
    .no-users span { font-size: 40px; display: block; margin-bottom: 10px; }

    .chat-messages-panel { flex: 1; display: flex; flex-direction: column; background: #f9f9f9; }
    .chat-user-info { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; }
    .chat-header-actions { margin-left: auto; }
    .delete-convo-btn { background: rgba(0,0,0,0.05); border: none; cursor: pointer; font-size: 16px; padding: 6px 8px; border-radius: 6px; }
    .delete-convo-btn:hover { background: rgba(239,68,68,0.1); }
    .chat-user-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; overflow: hidden; flex-shrink: 0; }
    .chat-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .chat-user-name { font-weight: 600; font-size: 13px; }
    .chat-user-status { font-size: 11px; color: #888; }

    /* Reply Preview */
    .reply-preview { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #f0f0f0; border-bottom: 1px solid #ddd; flex-shrink: 0; }
    .reply-preview-content small { color: #666; font-size: 10px; }
    .reply-preview-content p { margin: 2px 0 0 0; font-size: 12px; color: #333; }
    .cancel-reply { background: none; border: none; cursor: pointer; font-size: 16px; color: #666; }

    .messages-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; position: relative; }
    .message { display: flex; flex-direction: column; }
    .my-message { align-items: flex-end; }
    .message-actions { display: flex; gap: 4px; margin-bottom: 2px; opacity: 0; transition: opacity 0.2s; }
    .message:hover .message-actions { opacity: 1; }
    .action-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 4px; border-radius: 4px; }
    .action-btn:hover { background: rgba(0,0,0,0.1); }
    .message-bubble { max-width: 70%; padding: 8px 12px; border-radius: 12px; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .message-bubble.has-reply { border-left: 3px solid #0a246a; }
    .my-message .message-bubble { background: #e3f2fd; }
    .reply-reference { background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; margin-bottom: 4px; cursor: pointer; border-left: 2px solid #0a246a; }
    .reply-reference small { font-size: 9px; color: #666; }
    .reply-reference p { margin: 2px 0 0 0; font-size: 11px; color: #333; }
    .message-bubble p { margin: 0 0 2px 0; font-size: 13px; word-wrap: break-word; color: #222; }
    .message-bubble small { font-size: 9px; color: #888; }
    .no-messages { text-align: center; padding: 40px; color: #aaa; }
    .no-messages span { font-size: 36px; display: block; margin-bottom: 8px; }

    /* File Attachments */
    .file-attachment { margin-bottom: 6px; }
    .file-preview img { max-width: 200px; max-height: 150px; border-radius: 8px; cursor: pointer; }
    .file-info { display: flex; align-items: center; gap: 8px; padding: 6px; background: rgba(0,0,0,0.05); border-radius: 6px; }
    .file-name { color: #0a246a; text-decoration: none; font-size: 11px; }
    .file-name:hover { text-decoration: underline; }

    /* File Send Preview */
    .file-send-preview { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #e3f2fd; border-top: 1px solid #bbdefb; flex-shrink: 0; }
    .file-send-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .file-size { color: #666; }
    .remove-file { background: none; border: none; cursor: pointer; color: #666; font-size: 14px; }

    .message-input-area { display: flex; gap: 10px; align-items: center; padding: 12px 16px; background: white; border-top: 1px solid #e0e0e0; flex-shrink: 0; }
    .attach-btn { cursor: pointer; font-size: 18px; padding: 4px; }
    .message-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; resize: none; font-family: inherit; outline: none; }
    .message-input:focus { border-color: #0a246a; }
    .send-btn { padding: 8px 18px; background: #0a246a; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .send-btn:hover:not(:disabled) { background: #1a3a8a; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Drag & Drop */
    .drag-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10,36,106,0.9); display: flex; align-items: center; justify-content: center; z-index: 10; }
    .drag-overlay-content { text-align: center; color: white; }
    .upload-icon { font-size: 48px; display: block; margin-bottom: 12px; }

    .no-user-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: #f9f9f9; }
    .no-user-content { text-align: center; color: #aaa; }
    .no-user-content span { font-size: 48px; display: block; margin-bottom: 12px; }
    .no-user-content h3 { margin: 0 0 6px 0; font-size: 15px; color: #666; }
    .no-user-content p { margin: 0; font-size: 12px; }

    /* Modal Overlay */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    
    /* Image Modal */
    .image-modal { background: white; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; }
    .image-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #0a246a; color: white; cursor: grab; user-select: none; }
    .image-modal-header:active { cursor: grabbing; }
    .image-modal-body { padding: 16px; display: flex; align-items: center; justify-content: center; }
    .preview-image { max-width: 80vw; max-height: 70vh; object-fit: contain; }
    
    /* Confirm Modal */
    .confirm-modal { background: white; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); width: 380px; max-width: 90vw; }
    .confirm-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0a246a; color: white; cursor: grab; user-select: none; }
    .confirm-modal-header:active { cursor: grabbing; }
    .confirm-modal-body { padding: 24px; text-align: center; }
    .confirm-icon { font-size: 40px; margin-bottom: 12px; }
    .confirm-modal-body h3 { margin: 0 0 8px 0; font-size: 16px; color: #333; }
    .confirm-modal-body p { margin: 0; font-size: 13px; color: #666; line-height: 1.5; }
    .confirm-modal-footer { display: flex; justify-content: center; gap: 8px; padding: 16px; border-top: 1px solid #e0e0e0; background: #f8f9fa; }
    .confirm-btn { padding: 8px 24px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; border: 1px solid #ccc; }
    .confirm-btn.cancel:hover { background: #e0e0e0; }
    .confirm-btn.confirm { background: #ef4444; color: white; }
    .confirm-btn.confirm:hover { background: #dc2626; }

    .modal-close-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; cursor: pointer; font-size: 14px; padding: 2px 8px; }
    .modal-close-btn:hover { background: rgba(239,68,68,0.5); }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
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
  currentUserRole = '';
  currentUserDept = '';
  isEDPUser = false;
  isMainBranch = false;
  private messagePolling: any;

  // Reply functionality
  replyingTo: ChatMessage | null = null;

  // File upload
  selectedFile: File | null = null;
  isDragging = false;

  // Image preview
  showImagePreview = false;
  previewImageUrl = '';

  // Confirmation dialog
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  // Dragging
  isDraggingModal = false;
  dragStartX = 0;
  dragStartY = 0;
  currentDragModal = '';
  imageModalPos = { x: 0, y: 0 };
  confirmModalPos = { x: 0, y: 0 };

  // Main branch IDs
  private readonly MAIN_BRANCH_IDS = [1, 5];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUsername = currentUser.username || '';
    this.currentUserBranchId = currentUser.branch_id || null;
    this.currentUserDeptId = currentUser.department_id || null;
    this.currentUserRole = (currentUser.role || '').toLowerCase().trim();
    this.currentUserDept = (currentUser.department || currentUser.department_name || '').toLowerCase().trim();
    
    this.isEDPUser = this.checkIsEDP(this.currentUserDept, this.currentUserRole);
    this.isMainBranch = this.MAIN_BRANCH_IDS.includes(Number(this.currentUserBranchId));
    
    this.loadBranchInfo();
    this.loadUsers();
    
    this.messagePolling = setInterval(() => {
      if (this.selectedUser) this.loadMessages();
      this.loadUnreadCounts();
      this.loadLastMessages();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.messagePolling) clearInterval(this.messagePolling);
  }

  get totalUnreadCount(): number {
    return this.users.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
  }

  private checkIsEDP(dept: string, role: string): boolean {
    const edpDepartments = ['edp', 'it', 'edp/it', 'it/edp', 'edp - it department', 'it department', 'edp department'];
    const isEDPDept = edpDepartments.includes(dept) || dept === 'edp' || dept === 'it' || dept.startsWith('edp/') || dept.startsWith('it/');
    const isEDPRole = role === 'technician' || role === 'main_edp_it' || role === 'edp_it' || role === 'it technician' || role === 'edp technician';
    return isEDPDept || isEDPRole;
  }

  private isManagementRole(role: string): boolean {
    return role === 'head/manager' || role === 'head manager' || role === 'supervisor' || role === 'branch manager';
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { 'Authorization': `Bearer ${token}` };
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
  }

  getReplyPreview(message: string): string {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  formatMessageTime(date: Date): string {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return msgDate.toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  isImageFile(fileType: string | null): boolean {
    return fileType ? fileType.startsWith('image/') : false;
  }

  // ─── DRAG MODAL ───
  startDrag(event: MouseEvent, modal: string) {
    this.isDraggingModal = true;
    this.currentDragModal = modal;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDraggingModal) return;
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    if (this.currentDragModal === 'image') {
      this.imageModalPos = { x: this.imageModalPos.x + deltaX, y: this.imageModalPos.y + deltaY };
    } else if (this.currentDragModal === 'confirm') {
      this.confirmModalPos = { x: this.confirmModalPos.x + deltaX, y: this.confirmModalPos.y + deltaY };
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDraggingModal = false;
    this.currentDragModal = '';
  }

  // ─── LOAD DATA ───
  loadBranchInfo() {
    if (!this.currentUserBranchId) return;
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.currentBranch = branches.find(b => b.id === Number(this.currentUserBranchId)) || null;
      }
    });
  }

  loadUsers() {
    const headers = this.getHeaders();
    const branchId = this.currentUserBranchId;
    if (!branchId) { this.users = []; this.filteredUsers = []; return; }

    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (staffData) => {
        const allStaff = staffData || [];
        this.http.get<any[]>(`${environment.apiUrl}/api/admin/new-users`, { headers }).subscribe({
          next: (clientData) => {
            const allClients = clientData || [];
            this.users = this.filterUsersByRole([...allStaff, ...allClients]);
            const uniqueUsers = this.users.filter((user, index, self) =>
              index === self.findIndex(u => u.username === user.username)
            );
            this.users = uniqueUsers;
            this.filterUsers();
            this.loadUnreadCounts();
            this.loadLastMessages();
          },
          error: () => {
            this.users = this.filterUsersByRole(allStaff);
            this.filterUsers();
            this.loadUnreadCounts();
            this.loadLastMessages();
          }
        });
      },
      error: () => { this.users = []; this.filteredUsers = []; }
    });
  }

  private filterUsersByRole(allUsers: any[]): ChatUser[] {
    const branchId = Number(this.currentUserBranchId);
    const isManagement = this.isManagementRole(this.currentUserRole);
    
    return allUsers
      .filter((u: any) => {
        if (u.username === this.currentUsername) return false;
        const userRole = (u.role || '').toLowerCase().trim();
        if (userRole === 'admin') return false;
        const userDept = (u.department || '').toLowerCase().trim();
        const userBranchId = Number(u.branch_id);
        const isUserEDP = this.checkIsEDP(userDept, userRole);
        const isUserManagement = this.isManagementRole(userRole);
        
        if (this.isEDPUser && this.isMainBranch) return true;
        if (this.isEDPUser && !this.isMainBranch) {
          if (isUserManagement && userBranchId === branchId) return true;
          if (isUserEDP && userBranchId === branchId) return true;
          if (isUserManagement && isUserEDP && this.MAIN_BRANCH_IDS.includes(userBranchId)) return true;
          return false;
        }
        if (isManagement) {
          if (isUserManagement && userBranchId === branchId) return true;
          if (isUserEDP && userBranchId === branchId) return true;
          if (isUserManagement && isUserEDP && this.MAIN_BRANCH_IDS.includes(userBranchId)) return true;
          return false;
        }
        if (isUserEDP && userBranchId === branchId) return true;
        return false;
      })
      .map((u: any) => ({
        userId: u.id,
        username: u.username,
        fullname: u.fullname,
        email: u.email || '',
        role: u.role || 'User',
        department: u.department || 'General',
        branch_id: u.branch_id,
        branch_name: this.getBranchName(u.branch_id),
        avatar_color: u.avatar_color || '#4f46e5',
        photo_url: u.photo_url || null,
        status: 'offline',
        unreadCount: 0,
        lastMessage: '',
        userType: (u.role === 'user' || !u.role) ? 'client' as const : 'staff' as const
      }));
  }

  private getBranchName(branchId: number): string {
    if (branchId === this.currentUserBranchId) return this.currentBranch?.name || '';
    return '';
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
            const rawMsg = msg.message || '';
            user.lastMessage = rawMsg.length > 40 ? rawMsg.substring(0, 40) + '...' : rawMsg;
            user.lastMessageTime = new Date(msg.timestamp);
          }
        });
        this.filterUsers();
        this.sortUsers();
      }
    });
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = term
      ? this.users.filter(u => u.fullname.toLowerCase().includes(term) || u.department.toLowerCase().includes(term))
      : [...this.users];
    this.sortUsers();
  }

  sortUsers(): void {
    this.filteredUsers.sort((a, b) => {
      // 1. Unread messages first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      if (a.unreadCount > 0 && b.unreadCount > 0) {
        return (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0);
      }
      // 2. Recent conversations
      if (a.lastMessageTime && b.lastMessageTime) {
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      }
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      // 3. Alphabetical
      return (a.fullname || a.username).localeCompare(b.fullname || b.username);
    });
  }

  selectUser(user: ChatUser) {
    this.selectedUser = user;
    this.newMessage = '';
    this.replyingTo = null;
    this.selectedFile = null;
    if (user.unreadCount > 0) {
      this.markAsRead(user.username);
      user.unreadCount = 0;
      this.sortUsers();
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

  // ─── REPLY ───
  replyToMessage(msg: ChatMessage) {
    this.replyingTo = msg;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  scrollToMessage(messageId: number) {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  // ─── FILE HANDLING ───
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  removeSelectedFile() {
    this.selectedFile = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.selectedFile = files[0];
  }

  openImage(url: string) {
    this.previewImageUrl = url;
    this.showImagePreview = true;
    this.imageModalPos = { x: 0, y: 0 };
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = '';
  }

  // ─── SEND MESSAGE ───
  sendMessage(event?: Event) {
    if (event) {
      if (event instanceof KeyboardEvent && event.shiftKey) return;
      event.preventDefault();
    }
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUser) return;

    const messageText = this.newMessage.trim();
    const headers = this.getHeaders();
    const formData = new FormData();
    formData.append('to_username', this.selectedUser.username);
    
    if (messageText) formData.append('message', messageText);
    if (this.replyingTo) {
      formData.append('reply_to_id', this.replyingTo.id.toString());
      formData.append('reply_to_message', this.replyingTo.message || '');
      formData.append('reply_to_username', this.replyingTo.from_username);
    }
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/api/messages`, formData, { headers }).subscribe({
      next: () => {
        this.newMessage = '';
        this.replyingTo = null;
        this.selectedFile = null;
        this.loadMessages();
        const user = this.users.find(u => u.username === this.selectedUser?.username);
        if (user) {
          const preview = messageText || '📎 File';
          user.lastMessage = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
          user.lastMessageTime = new Date();
        }
        this.sortUsers();
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // ─── DELETE ───
  deleteMessage(messageId: number) {
    this.confirmTitle = 'Delete Message';
    this.confirmMessage = 'Are you sure you want to delete this message?';
    this.showConfirm(messageId, () => {
      this.http.delete(`${environment.apiUrl}/api/messages/${messageId}`, { headers: this.getHeaders() }).subscribe({
        next: () => { this.messages = this.messages.filter(m => m.id !== messageId); }
      });
    });
  }

  deleteConversation() {
    if (!this.selectedUser) return;
    this.confirmTitle = 'Delete Conversation';
    this.confirmMessage = `Are you sure you want to delete all messages with ${this.selectedUser.fullname}? This cannot be undone.`;
    this.showConfirm(null, () => {
      this.http.delete(`${environment.apiUrl}/api/conversation/${this.selectedUser!.username}`, { headers: this.getHeaders() }).subscribe({
        next: () => { this.messages = []; }
      });
    });
  }

  showConfirm(data: any, callback: () => void) {
    this.confirmCallback = callback;
    this.showConfirmDialog = true;
    this.confirmModalPos = { x: 0, y: 0 };
  }

  confirmAction() {
    if (this.confirmCallback) this.confirmCallback();
    this.showConfirmDialog = false;
    this.confirmCallback = null;
  }

  cancelConfirm() {
    this.showConfirmDialog = false;
    this.confirmCallback = null;
  }
}