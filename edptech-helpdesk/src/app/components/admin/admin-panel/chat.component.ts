import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';
interface ChatUser {
  userId?: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  department: string;
  branch?: string;     
  company?: string;  
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
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-header-left">
          <h2>💬 Messages</h2>
        </div>
        <div class="chat-header-right">
          <span class="online-count">Total: {{ users.length }} users</span>
        </div>
      </div>

      <div class="tabs-bar">
  <button class="tab-btn" [class.active]="activeTab === 'staff'" (click)="setActiveTab('staff')">
    👨‍💼 Staff ({{ staffUsers.length }})
    <span class="tab-badge" *ngIf="staffUnreadCount > 0">{{ staffUnreadCount > 99 ? '99+' : staffUnreadCount }}</span>
  </button>
  <button class="tab-btn" [class.active]="activeTab === 'clients'" (click)="setActiveTab('clients')">
    👤 Clients ({{ clientUsers.length }})
    <span class="tab-badge" *ngIf="clientUnreadCount > 0">{{ clientUnreadCount > 99 ? '99+' : clientUnreadCount }}</span>
  </button>
</div>

      <div class="chat-layout">
        <div class="chat-users-panel">
          <div class="search-box">
            <input type="text" [(ngModel)]="searchTerm" (input)="filterUsers()" placeholder="Search users..." class="search-input">
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="users-list">
          <div class="user-item" *ngFor="let user of filteredUsers" 
     [class.active]="selectedUser?.username === user.username" 
     (click)="selectUser(user)">
  
  <div class="user-avatar-wrapper" 
       (mouseenter)="showUserInfo = user; tooltipX = $event.clientX; tooltipY = $event.clientY" 
       (mouseleave)="showUserInfo = null">
    <div class="user-avatar" [style.backgroundColor]="user.avatar_color || '#0a3a8c'">
      <img *ngIf="user.photo_url" [src]="this.apiUrl + user.photo_url" [alt]="user.fullname">
      <span *ngIf="!user.photo_url">{{ getInitials(user.fullname) }}</span>
      <span class="status-dot" [class.online]="isUserOnline(user)"></span>
    </div>
    
    <!-- ✅ Popup info card that appears on hover -->
    <div class="user-info-popup" *ngIf="showUserInfo === user">
      <div class="popup-name">{{ user.fullname }}</div>
      <div class="popup-row" *ngIf="user.role"><span>🔖</span> {{ user.role }}</div>
      <div class="popup-row" *ngIf="user.department"><span>📁</span> {{ user.department }}</div>
      <div class="popup-row" *ngIf="user.branch"><span>🏢</span> {{ user.branch }}</div>
      <div class="popup-row" *ngIf="user.company"><span>🏭</span> {{ user.company }}</div>
      <div class="popup-row" *ngIf="user.email"><span>📧</span> {{ user.email }}</div>
    </div>
  </div>
  
  <div class="user-info">
    <div class="user-name">
      {{ user.fullname }}
      <span class="user-department" *ngIf="user.department">({{ user.department }})</span>
    </div>
    <div class="user-last-message">{{ user.lastMessage || 'No messages' }}</div>
  </div>
  <div class="user-badge" *ngIf="user.unreadCount > 0">{{ user.unreadCount }}</div>
</div>
            <div class="no-users" *ngIf="filteredUsers.length === 0 && users.length > 0">No users found</div>
          </div>
        </div>

        <div class="chat-messages-panel" *ngIf="selectedUser">
          <div class="chat-user-info" *ngIf="selectedUser">
  <div class="chat-user-avatar" [style.backgroundColor]="selectedUser.avatar_color || '#0a3a8c'"
       [title]="getUserHoverInfo(selectedUser)">
    <img *ngIf="selectedUser.photo_url" [src]="this.apiUrl + selectedUser.photo_url" [alt]="selectedUser.fullname">
    <span *ngIf="!selectedUser.photo_url">{{ getInitials(selectedUser.fullname) }}</span>
  </div>
  <div class="chat-user-details">
    <div class="chat-user-name">
      {{ selectedUser.fullname }}
      <span class="user-department" *ngIf="selectedUser.department">({{ selectedUser.department }})</span>
    </div>
    <div class="chat-user-status">{{ getUserStatusText(selectedUser) }}</div>
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
              <!-- Reply button on ALL messages, Delete only on OWN messages -->
              <div class="message-actions">
                <button class="action-btn reply-btn" (click)="replyToMessage(msg)" title="Reply">↩️</button>
                <button class="action-btn delete-btn" *ngIf="msg.from_username === currentUsername" (click)="deleteMessage(msg.id)" title="Delete">🗑️</button>
              </div>
              <div class="message-bubble" [class.has-reply]="msg.reply_to_id">
                <!-- Reply Reference -->
                <div class="reply-reference" *ngIf="msg.reply_to_id" (click)="scrollToMessage(msg.reply_to_id)">
                  <small>{{ msg.reply_to_username }}</small>
                  <p>{{ getReplyPreview(msg.reply_to_message || '') }}</p>
                </div>
                
                <!-- File Attachment -->
                <div class="file-attachment" *ngIf="msg.file_url">
                  <div class="file-preview" *ngIf="isImageFile(msg.file_type)">
                    <img [src]="this.apiUrl + msg.file_url" [alt]="msg.file_name" (click)="openImage(this.apiUrl + msg.file_url)">
                  </div>
                  <div class="file-info" *ngIf="!isImageFile(msg.file_type)">
                    <span class="file-icon">📎</span>
                    <a [href]="this.apiUrl + msg.file_url" target="_blank" class="file-name">{{ msg.file_name }}</a>
                  </div>
                </div>
                
                <p *ngIf="msg.message">{{ msg.message }}</p>
                <small>{{ msg.timestamp | date:'shortTime' }}</small>
              </div>
            </div>
            <div class="no-messages" *ngIf="messages.length === 0">No messages yet. Start the conversation!</div>
            
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
            <textarea [(ngModel)]="newMessage" (keyup.enter)="sendMessage($event)" placeholder="Type your message..." rows="2" class="message-input"></textarea>
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() && !selectedFile">Send</button>
          </div>
        </div>

        <div class="no-user-selected" *ngIf="!selectedUser">
          <div class="no-user-content">💬<h3>Select a conversation</h3><p>Choose a user from the list to start chatting</p></div>
        </div>
      </div>
      
      <!-- Image Preview Modal -->
      <div class="image-overlay" *ngIf="showImagePreview" (click)="closeImagePreview()">
        <img [src]="previewImageUrl" (click)="$event.stopPropagation()" class="preview-image">
        <button class="close-preview" (click)="closeImagePreview()">✕</button>
      </div>

      <!-- Confirmation Dialog -->
      <div class="confirm-overlay" *ngIf="showConfirmDialog" (click)="cancelConfirm()">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <div class="confirm-icon">⚠️</div>
          <h3>Confirm Action</h3>
          <p>{{ confirmMessage }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" (click)="cancelConfirm()">Cancel</button>
            <button class="confirm-btn confirm" (click)="confirmAction()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 110px);
      background: #f5f5f5;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #0a246a;
      color: white;
      border-bottom: 1px solid #e0e0e0;
    }
    .chat-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-header h2 {
      margin: 0;
      font-size: 16px;
    }
    .online-count {
      font-size: 12px;
      background: rgba(255,255,255,0.2);
      padding: 4px 10px;
      border-radius: 20px;
    }

    .tabs-bar {
      display: flex;
      gap: 2px;
      padding: 8px 16px 0 16px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
    }
    .tab-btn {
      padding: 8px 20px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #0a246a; }
    .tab-btn.active { color: #0a246a; border-bottom-color: #0a246a; }

    .chat-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .chat-users-panel {
      width: 320px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }

    .search-box {
      padding: 12px;
      position: relative;
      border-bottom: 1px solid #e0e0e0;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 12px;
    }
    .search-icon {
      position: absolute;
      left: 24px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: #999;
    }

    .users-list { flex: 1; overflow-y: auto; }
    .user-item {
      display: flex;
      align-items: center;
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
      position: relative;
    }
    .user-item:hover { background: #f8f9fa; }
    .user-item.active { background: #e8f0ff; }
   .user-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 18px;
  margin-right: 12px;
  position: relative; flex-shrink: 0;
  overflow: visible !important; /* ✅ Important */
}
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .status-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px;
      border-radius: 50%; background: #888;
      border: 2px solid white;
    }
    .status-dot.online { background: #008800; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-weight: 600; font-size: 13px; color: #333; display: flex; align-items: center; gap: 4px; }
    .user-role { font-size: 10px; }
    .user-last-message { font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-badge { background: #cc0000; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
    .no-users { text-align: center; padding: 40px; color: #999; }

    .chat-messages-panel { flex: 1; display: flex; flex-direction: column; background: #f9f9f9; }
    .chat-user-info {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px;
      background: white; border-bottom: 1px solid #e0e0e0;
    }
    .chat-header-actions { margin-left: auto; display: flex; gap: 8px; }
    .delete-convo-btn {
      background: rgba(0,0,0,0.05); border: none; cursor: pointer;
      font-size: 16px; padding: 6px 8px; border-radius: 6px;
    }
    .delete-convo-btn:hover { background: rgba(0,0,0,0.1); }
    .chat-user-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 14px; overflow: hidden;
    }
    .chat-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .chat-user-name { font-weight: 600; font-size: 14px; color: #333; }
    .chat-user-status { font-size: 11px; color: #666; }

    /* Reply Preview */
    .reply-preview {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px; background: #f0f0f0; border-bottom: 1px solid #ddd;
    }
    .reply-preview-content small { color: #666; font-size: 10px; }
    .reply-preview-content p { margin: 2px 0 0 0; font-size: 12px; color: #333; }
    .cancel-reply { background: none; border: none; cursor: pointer; font-size: 16px; color: #666; }

    .messages-area {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
      position: relative;
    }
    .message { display: flex; flex-direction: column; }
    .my-message { align-items: flex-end; }
    .message-actions {
      display: flex; gap: 4px; margin-bottom: 2px;
      opacity: 0; transition: opacity 0.2s;
    }
    .message:hover .message-actions { opacity: 1; }
    .action-btn {
      background: none; border: none; cursor: pointer;
      font-size: 14px; padding: 2px 4px; border-radius: 4px;
    }
    .action-btn:hover { background: rgba(0,0,0,0.1); }
    .message-bubble {
      max-width: 60%; padding: 8px 12px;
      background: white; border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      position: relative;
    }
    .message-bubble.has-reply { border-left: 3px solid #0a246a; }
    .my-message .message-bubble { background: #e3f2fd; }
    .reply-reference {
      background: rgba(0,0,0,0.05); padding: 4px 8px;
      border-radius: 4px; margin-bottom: 4px; cursor: pointer;
      border-left: 2px solid #0a246a;
    }
    .reply-reference small { font-size: 9px; color: #666; }
    .reply-reference p { margin: 2px 0 0 0; font-size: 11px; color: #333; }
    .message-bubble p { margin: 0 0 4px 0; font-size: 13px; word-wrap: break-word; color: #222121; }
    .message-bubble small { font-size: 9px; opacity: 0.7; color: #464242; }
    .no-messages { text-align: center; padding: 40px; color: #999; }

    /* File Attachments */
    .file-attachment { margin-bottom: 8px; }
    .file-preview img { max-width: 200px; max-height: 150px; border-radius: 8px; cursor: pointer; }
    .file-info { display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 8px; }
    .file-icon { font-size: 20px; }
    .file-name { color: #0a246a; text-decoration: none; font-size: 12px; }
    .file-name:hover { text-decoration: underline; }

    /* File Send Preview */
    .file-send-preview {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px; background: #e3f2fd; border-top: 1px solid #bbdefb;
    }
    .file-send-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .file-size { color: #666; }
    .remove-file { background: none; border: none; cursor: pointer; color: #666; }

    .message-input-area {
      display: flex; gap: 12px; align-items: center;
      padding: 16px 20px; background: white; border-top: 1px solid #e0e0e0;
    }
    .attach-btn { cursor: pointer; font-size: 20px; padding: 4px; }
    .message-input {
      flex: 1; padding: 10px 12px;
      border: 1px solid #ddd; border-radius: 20px;
      font-size: 12px; resize: none; font-family: inherit;
    }
    .message-input:focus { outline: none; border-color: #0a246a; }
    .send-btn {
      padding: 8px 20px; background: #0a246a; color: white;
      border: none; border-radius: 20px; cursor: pointer;
      font-size: 12px; font-weight: 600;
    }
    .send-btn:hover:not(:disabled) { background: #1a3a8a; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Drag & Drop */
    .drag-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 36, 106, 0.9);
      display: flex; align-items: center; justify-content: center; z-index: 10;
    }
    .drag-overlay-content { text-align: center; color: white; }
    .upload-icon { font-size: 48px; display: block; margin-bottom: 12px; }

    /* Image Preview */
    .image-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center; z-index: 4000;
    }
    .preview-image { max-width: 90%; max-height: 90%; object-fit: contain; }
    .close-preview {
      position: absolute; top: 20px; right: 20px;
      background: rgba(255,255,255,0.2); border: none; color: white;
      font-size: 24px; cursor: pointer; width: 40px; height: 40px; border-radius: 50%;
    }

    /* Confirmation Dialog */
    .confirm-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 5000;
      animation: fadeIn 0.2s ease;
    }
    .confirm-dialog {
      background: white; border-radius: 16px; padding: 32px;
      max-width: 400px; width: 90%; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    }
    .confirm-icon { font-size: 48px; margin-bottom: 16px; }
    .confirm-dialog h3 { margin: 0 0 8px 0; font-size: 18px; color: #333; }
    .confirm-dialog p { margin: 0 0 24px 0; font-size: 14px; color: #666; line-height: 1.5; }
    .confirm-actions { display: flex; gap: 12px; justify-content: center; }
    .confirm-btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .confirm-btn.cancel { background: #f0f0f0; color: #333; }
    .confirm-btn.cancel:hover { background: #e0e0e0; }
    .confirm-btn.confirm { background: #cc0000; color: white; }
    .confirm-btn.confirm:hover { background: #aa0000; }
    .tab-badge {
  background: #cc0000;
  color: white;
  font-size: 9px;
  font-weight: bold;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
  min-width: 16px;
  text-align: center;
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}
.user-department {
  font-size: 10px;
  font-weight: 400;
  color: #888;
  margin-left: 2px;
}
/* User Avatar Wrapper */
.user-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
  margin-right: 12px;
}

/* User Avatar */
.user-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 18px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.status-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px;
  border-radius: 50%; background: #888;
  border: 2px solid white;
}
.status-dot.online { background: #008800; }

/* ✅ User Info Popup - appears on hover */
.user-info-popup {
  position: fixed;
  background: #1a1a2e;
  color: #fff;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 11px;
  z-index: 99999;
  line-height: 1.6;
  min-width: 180px;
  max-width: 240px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.15);
  pointer-events: none;
  animation: popupFadeIn 0.15s ease;
  transform: translate(60px, -20px);
}

.popup-name {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  color: #fff;
}

.popup-row {
  padding: 2px 0;
  font-size: 11px;
  color: #ccc;
}

.popup-row span {
  margin-right: 4px;
}

@keyframes popupFadeIn {
  from { opacity: 0; transform: translate(60px, -16px); }
  to { opacity: 1; transform: translate(60px, -20px); }
}

.user-department {
  font-size: 10px;
  font-weight: 400;
  color: #888;
  margin-left: 2px;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.status-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px;
  border-radius: 50%; background: #888;
  border: 2px solid white;
}
.status-dot.online { background: #008800; }
.user-avatar {
  cursor: pointer;
}

/* Tooltip styles - shown on hover via title attribute */
.user-avatar[title]:hover::after {
  /* Note: title attribute provides native browser tooltip */
  /* For custom tooltip, see alternative below */
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .no-user-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: #f9f9f9; }
    .no-user-content { text-align: center; color: #999; }
    .no-user-content h3 { margin: 0 0 8px 0; font-size: 16px; color: #666; }
    .no-user-content p { margin: 0; font-size: 12px; }

    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
apiUrl = environment.apiUrl;
  staffUsers: ChatUser[] = [];
  clientUsers: ChatUser[] = [];
  users: ChatUser[] = [];
  filteredUsers: ChatUser[] = [];
  selectedUser: ChatUser | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  searchTerm = '';
  activeTab: 'staff' | 'clients' = 'staff';
  
  currentUsername = '';
  currentUserRole = '';
  private messagePolling: any;

  // Reply functionality
  replyingTo: ChatMessage | null = null;

  // File upload
  selectedFile: File | null = null;
  isDragging = false;
  showUserInfo: ChatUser | null = null;
  tooltipX = 0;
  tooltipY = 0;
  // Image preview
  showImagePreview = false;
  previewImageUrl = '';

  // Confirmation dialog
  showConfirmDialog = false;
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  constructor(private http: HttpClient, private router: Router,  private notificationService: NotificationService) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUsername = currentUser.username;
    this.currentUserRole = currentUser.role;
    this.loadAllUsers();
    
    this.messagePolling = setInterval(() => {
      if (this.selectedUser) this.loadMessages();
      this.loadUnreadCounts();
      this.loadLastMessages();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.messagePolling) clearInterval(this.messagePolling);
  }

  getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  }

  getInitials(fullname: string): string { 
    return fullname?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'; 
  }

  getReplyPreview(message: string | undefined | null): string {
    if (!message) return '';
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }
  
  getUserRoleIcon(role: string): string { 
    return role === 'Technician' ? '🔧' : role === 'admin' ? '👨‍💼' : '👤'; 
  }
  
  isUserOnline(user: ChatUser): boolean { return user.status === 'online'; }
  
  getUserStatusText(user: ChatUser): string { 
    return user.status === 'online' ? 'Online' : user.status === 'lunch' ? 'Lunch Break' : user.status === 'onLeave' ? 'On Leave' : 'Offline'; 
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  isImageFile(fileType: string | null): boolean {
    return fileType ? fileType.startsWith('image/') : false;
  }

  setActiveTab(tab: 'staff' | 'clients') {
    this.activeTab = tab;
    this.selectedUser = null;
    this.messages = [];
    this.replyingTo = null;
    this.selectedFile = null;
    this.users = tab === 'staff' ? [...this.staffUsers] : [...this.clientUsers];
    this.filterUsers();
  }
get staffUnreadCount(): number {
  return this.staffUsers.reduce((total, user) => total + (user.unreadCount || 0), 0);
}

get clientUnreadCount(): number {
  return this.clientUsers.reduce((total, user) => total + (user.unreadCount || 0), 0);
}
 loadAllUsers() {
  this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers: this.getHeaders() }).subscribe({
    next: (staffData) => {
      console.log('Staff data sample:', staffData[0]); 
      this.staffUsers = staffData
        .filter(user => user.username !== this.currentUsername)
        .map(user => ({
          userId: user.id,  
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          department: user.department,
          branch: user.branch || user.branch_name || user.branchName || '',
          company: user.company || user.company_name || user.companyName || '',
          avatar_color: user.avatar_color,
          photo_url: user.photo_url,
          status: 'online',
          unreadCount: 0,
          lastMessage: '',
          lastMessageTime: undefined,
          userType: 'staff' as const
        }));
      
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers: this.getHeaders() }).subscribe({
        next: (clientData) => {
          this.clientUsers = (clientData || []).map(user => ({
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            role: user.role || 'user',
            department: user.department,
            branch: user.branch || user.branch_name || user.branchName || '',
            company: user.company || user.company_name || user.companyName || '',
            avatar_color: user.avatar_color || '#3b82f6',
            photo_url: user.photo_url,
            status: 'online',
            unreadCount: 0,
            lastMessage: '',
            lastMessageTime: undefined,
            userType: 'client' as const
          }));
          
          this.users = this.activeTab === 'staff' ? [...this.staffUsers] : [...this.clientUsers];
          this.filterUsers();
          this.loadUnreadCounts();
          this.loadLastMessages();
        },
        error: () => {
          this.clientUsers = [];
          this.users = this.activeTab === 'staff' ? [...this.staffUsers] : [...this.clientUsers];
          this.filterUsers();
        }
      });
    },
    error: (err) => console.error('Error loading staff users:', err)
  });
}

  loadUnreadCounts() {
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/unread/${this.currentUsername}`, { headers: this.getHeaders() }).subscribe({
      next: (unread) => {
        // Update BOTH the current users list and the source arrays
        const updateUser = (user: ChatUser) => {
          const match = unread.find((u: any) => u.from_username === user.username);
          user.unreadCount = match ? match.count : 0;
        };
        
        // Update current users list
        this.users.forEach(updateUser);
        
        // Update source arrays for tab badges
        this.staffUsers.forEach(updateUser);
        this.clientUsers.forEach(updateUser);
        
        this.filterUsers();
      },
      error: (err) => console.error('Error loading unread counts:', err)
    });
  }

  loadLastMessages() {
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/last/${this.currentUsername}`, { headers: this.getHeaders() }).subscribe({
      next: (lastMessages) => {
        lastMessages.forEach(msg => { 
          let user = this.users.find(u => u.username === msg.username); 
          if (user) { 
            user.lastMessage = msg.message; 
            user.lastMessageTime = new Date(msg.timestamp); 
          } 
        });
        this.filterUsers();
      },
      error: (err) => console.error('Error loading last messages:', err)
    });
  }

  filterUsers() {
    if (!this.searchTerm.trim()) { 
      this.filteredUsers = [...this.users]; 
    } else { 
      const term = this.searchTerm.toLowerCase(); 
      this.filteredUsers = this.users.filter(u => 
        u.fullname?.toLowerCase().includes(term) || 
        u.username?.toLowerCase().includes(term) || 
        u.department?.toLowerCase().includes(term)
      ); 
    }
  }

  selectUser(user: ChatUser) {
    this.selectedUser = user;
    this.replyingTo = null;
    this.selectedFile = null;
    if (user.unreadCount > 0) { 
      this.markMessagesAsRead(user.username); 
      user.unreadCount = 0; 
    }
    this.loadMessages();
  }

  loadMessages() {
    if (!this.selectedUser) return;
    
    this.http.get<ChatMessage[]>(`${environment.apiUrl}/api/messages/${this.selectedUser.username}`, { headers: this.getHeaders() }).subscribe({
      next: (messages) => { 
        this.messages = messages || []; 
        setTimeout(() => this.scrollToBottom(), 100); 
      },
      error: () => { this.messages = []; }
    });
  }
 getUserHoverInfo(user: ChatUser): string {
  // ✅ Always show user info for testing
  return `👤 ${user.fullname}\n📁 ${user.department || 'No Department'}\n🏢 ${user.branch || 'No Branch'}\n🏭 ${user.company || 'No Company'}`;
}
  // --- Reply Functions ---
  replyToMessage(message: ChatMessage) {
    this.replyingTo = message;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  scrollToMessage(messageId: number) {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  // --- File Handling ---
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
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = '';
  }

  // --- Confirmation Dialog ---
  showConfirm(message: string, callback: () => void) {
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirmDialog = true;
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

  // --- Delete Functions ---
  deleteMessage(messageId: number) {
    this.showConfirm('Are you sure you want to delete this message?', () => {
      const headers = this.getHeaders();
      this.http.delete(`${environment.apiUrl}/api/messages/${messageId}`, { headers }).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== messageId);
        },
        error: (err) => console.error('Failed to delete message:', err)
      });
    });
  }

  deleteConversation() {
    if (!this.selectedUser) return;
    this.showConfirm('Are you sure you want to delete the entire conversation? This cannot be undone.', () => {
      const headers = this.getHeaders();
      this.http.delete(`${environment.apiUrl}/api/conversation/${this.selectedUser!.username}`, { headers }).subscribe({
        next: () => {
          this.messages = [];
        },
        error: (err) => console.error('Failed to delete conversation:', err)
      });
    });
  }

  sendMessage(event?: Event) {
    if (event) { 
      if (event instanceof KeyboardEvent && event.shiftKey) return; 
      event.preventDefault(); 
    }
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUser) return;
    
    const messageText = this.newMessage.trim(); // Save before clearing
    const headers = this.getHeaders();
    const formData = new FormData();
    formData.append('to_username', this.selectedUser.username);
    
    if (messageText) {
      formData.append('message', messageText);
    }
    
    if (this.replyingTo) {
      formData.append('reply_to_id', this.replyingTo.id.toString());
      formData.append('reply_to_message', this.replyingTo.message || '');
      formData.append('reply_to_username', this.replyingTo.from_username);
    }
    
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    
    this.http.post(`${environment.apiUrl}/api/messages`, formData, { headers }).subscribe({
      next: () => {
        this.newMessage = '';
        this.replyingTo = null;
        this.selectedFile = null;
        this.loadMessages();
        const user = this.users.find(u => u.username === this.selectedUser?.username);
        if (user) { 
          user.lastMessage = messageText || '📎 File'; 
          user.lastMessageTime = new Date(); 
        }
        this.filterUsers();
        
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }
  markMessagesAsRead(fromUsername: string) {
    this.http.put(`${environment.apiUrl}/api/messages/read/${fromUsername}`, {}, { headers: this.getHeaders() }).subscribe({ 
      error: (err) => console.error('Error marking messages as read:', err) 
    });
  }

  scrollToBottom() { 
    setTimeout(() => { 
      if (this.messagesContainer) { 
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; 
      } 
    }, 100); 
  }
}