import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

interface SupportUser {
  userId?: number;  
  unreadCount?: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  department: string;
  branch_id?: number;
  branch_name?: string;
  company_name?: string;
  avatar_color: string;
  photo_url: string | null;
  workDays: string;
  dayOff: string;
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
  leaveEntries: string;
  status: 'online' | 'offline' | 'busy' | 'lunch' | 'away' | 'onLeave';
  availabilityMessage: string;
  tableName: string;
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
  selector: 'app-client-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="contact-container">
      <div class="page-header">
        <h2>📞 Contact IT Support</h2>
        <p>Connect with our support team</p>
      </div>

      <!-- Search and Filter -->
      <div class="filter-bar">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          (input)="filterUsers()"
          class="search-input" 
          placeholder="Search by name, department...">
        <select [(ngModel)]="roleFilter" (change)="filterUsers()" class="filter-select">
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="Technician">Technicians</option>
          <option value="Head/Manager">Head/Manager</option>
          <option value="Supervisor">Supervisors</option>
        </select>
        <select [(ngModel)]="statusFilter" (change)="filterUsers()" class="filter-select">
          <option value="all">All Status</option>
          <option value="online">Available</option>
          <option value="busy">Busy</option>
          <option value="lunch">Lunch Break</option>
          <option value="onLeave">On Leave</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <!-- Support Team Grid -->
      <div class="team-grid">
        <div class="team-card" *ngFor="let user of filteredUsers" [class]="'status-' + user.status">
          <div class="card-header">
            <div class="avatar" [style.backgroundColor]="user.avatar_color || '#0a3a8c'">
              <img *ngIf="user.photo_url" [src]="apiUrl + user.photo_url" [alt]="user.fullname" class="avatar-img">
              <span *ngIf="!user.photo_url">{{ getInitials(user.fullname) }}</span>
            </div>
            <div class="unread-badge" *ngIf="user.unreadCount && user.unreadCount > 0">
              {{ user.unreadCount > 99 ? '99+' : user.unreadCount }}
            </div>
            <div class="status-indicator" [class]="'status-' + user.status">
              <span class="status-dot"></span>
              <span class="status-text">{{ getStatusText(user.status) }}</span>
            </div>
          </div>
          
          <div class="card-body">
            <h3>{{ user.fullname }}</h3>
            <p class="role">{{ user.role === 'Technician' ? '🔧 Technician' : user.role === 'Head/Manager' ? '👔 Head/Manager' : user.role === 'Supervisor' ? '👤 Supervisor' : '👨‍💼 Administrator' }}</p>
            <p class="department">{{ user.department || 'General Support' }}</p>
            
            <!-- ✅ Branch & Company Info -->
            <div class="org-info" *ngIf="user.branch_name || user.company_name">
              <div class="org-row" *ngIf="user.branch_name">
                <span class="org-icon">🏢</span>
                <span class="org-label">Branch:</span>
                <span class="org-value">{{ user.branch_name }}</span>
              </div>
              <div class="org-row" *ngIf="user.company_name">
                <span class="org-icon">🏛️</span>
                <span class="org-label">Company:</span>
                <span class="org-value">{{ user.company_name }}</span>
              </div>
            </div>
            
            <p class="availability" [class]="'avail-' + user.status">
              {{ user.availabilityMessage }}
            </p>
          </div>
          
          <div class="card-footer">
            <button class="chat-btn" (click)="openChat(user)">
              💬 Send Message
            </button>
          </div>
        </div>

        <div class="no-results" *ngIf="filteredUsers.length === 0">
          <p>No support staff available at the moment.</p>
        </div>
      </div>

      <!-- Chat Modal -->
      <div class="modal-overlay" *ngIf="showChatModal" (click)="closeChat()">
        <div class="chat-modal" (click)="$event.stopPropagation()">
          <div class="chat-header" [style.backgroundColor]="selectedUser?.avatar_color || '#0a3a8c'">
            <div class="chat-user-info">
              <div class="chat-avatar" [style.backgroundColor]="selectedUser?.avatar_color || '#0a3a8c'">
                <img *ngIf="selectedUser?.photo_url" [src]="apiUrl + selectedUser?.photo_url" [alt]="selectedUser?.fullname" class="avatar-img">
                <span *ngIf="!selectedUser?.photo_url">{{ getInitials(selectedUser?.fullname || '') }}</span>
              </div>
              <div class="chat-user-details">
                <h4>{{ selectedUser?.fullname }}</h4>
                <p class="chat-status" [class]="'status-' + selectedUser?.status">
                  {{ getStatusText(selectedUser?.status || 'offline') }}
                </p>
              </div>
            </div>
            <div class="chat-actions">
              <button class="delete-convo-btn" (click)="deleteConversation()" title="Delete conversation">
                🗑️
              </button>
              <button class="close-chat" (click)="closeChat()">✕</button>
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

          <div class="chat-messages" #chatMessagesContainer
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
            <div class="message" *ngFor="let msg of chatMessages" 
                 [class.my-message]="msg.from_username === currentUsername">
              <div class="message-actions">
                <button class="action-btn reply-btn" (click)="replyToMessage(msg)" title="Reply">↩️</button>
                <button class="action-btn delete-btn" *ngIf="msg.from_username === currentUsername" (click)="deleteMessage(msg.id)" title="Delete">🗑️</button>
              </div>
              <div class="message-bubble" [class.has-reply]="msg.reply_to_id">
                <div class="reply-reference" *ngIf="msg.reply_to_id" (click)="scrollToMessage(msg.reply_to_id)">
                  <small>{{ msg.reply_to_username }}</small>
                  <p>{{ getReplyPreview(msg.reply_to_message || '') }}</p>
                </div>
                
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
            <div class="no-messages" *ngIf="chatMessages.length === 0">
              <p>No messages yet. Start the conversation!</p>
            </div>
            
            <div class="drag-overlay" *ngIf="isDragging">
              <div class="drag-overlay-content">
                <span class="upload-icon">📤</span>
                <p>Drop files here to upload</p>
              </div>
            </div>
          </div>
          
          <div class="file-send-preview" *ngIf="selectedFile">
            <div class="file-send-info">
              <span class="file-icon">📎</span>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
            </div>
            <button class="remove-file" (click)="removeSelectedFile()">✕</button>
          </div>
          
          <div class="chat-input-area">
            <label class="attach-btn" title="Attach file">
              📎
              <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx" hidden>
            </label>
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              (keyup.enter)="sendMessage()"
              class="chat-input" 
              placeholder="Type your message...">
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() && !selectedFile">
              Send
            </button>
          </div>
        </div>
      </div>
      
      <!-- Image Preview Modal -->
      <div class="image-overlay" *ngIf="showImagePreview" (click)="closeImagePreview()">
        <img [src]="previewImageUrl" (click)="$event.stopPropagation()" class="preview-image">
        <button class="close-preview" (click)="closeImagePreview()">✕</button>
      </div>
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
  `,
  styles: [`
    .contact-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 24px;
      text-align: center;
    }
    .page-header h2 {
      color: #0a246a;
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    .page-header p { color: #666; margin: 0; font-size: 14px; }

    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .search-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #c0c0c0;
      border-radius: 4px;
      font-size: 13px;
    }
    .filter-select {
      padding: 8px 12px;
      border: 1px solid #c0c0c0;
      border-radius: 4px;
      font-size: 13px;
      min-width: 140px;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .team-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .team-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .team-card.status-online { border-top: 3px solid #008800; }
    .team-card.status-busy { border-top: 3px solid #cc6600; }
    .team-card.status-lunch { border-top: 3px solid #ffaa00; }
    .team-card.status-onLeave { border-top: 3px solid #cc0000; }
    .team-card.status-offline { border-top: 3px solid #888; }

    .card-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      overflow: hidden;
      flex-shrink: 0;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-text{ color: #0c0c0c; }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-online .status-dot { background: #008800; box-shadow: 0 0 4px #008800; }
    .status-busy .status-dot { background: #cc6600; }
    .status-lunch .status-dot { background: #ffaa00; }
    .status-onLeave .status-dot { background: #cc0000; }
    .status-offline .status-dot { background: #888; }
    
    .status-lunch .status-indicator { background: #fff8e0; color: #ffaa00; }
    .status-onLeave .status-indicator { background: #ffe0e0; color: #cc0000; }
    .status-offline .status-indicator { background: #f0f0f0; color: #888; }

    .card-body {
      padding: 16px;
    }
    .card-body h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      color: #333;
    }
    .role, .department {
      margin: 4px 0;
      font-size: 12px;
      color: #666;
    }
    .org-info {
      margin: 8px 0;
      padding: 6px 10px;
      background: #f8f9fc;
      border-radius: 6px;
      border: 1px solid #e8ecf5;
      font-size: 11px;
    }
    .org-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 1px 0;
    }
    .org-icon { font-size: 12px; flex-shrink: 0; }
    .org-label { font-weight: 600; color: #666; min-width: 46px; }
    .org-value { color: #333; }
    .availability {
      margin-top: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 11px;
      color: #111111;
    }
    .avail-online { background: #e8f5e8; color: #008800; }
    .avail-busy { background: #fff3e0; color: #cc6600; }
    .avail-lunch { background: #fff8e0; color: #ffaa00; }
    .avail-onLeave { background: #ffe0e0; color: #cc0000; }

    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
    }
    .chat-btn {
      width: 100%;
      padding: 8px;
      background: #0a246a;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    .chat-btn:hover { background: #0a3a8c; }

    /* Chat Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    .chat-modal {
      width: 500px;
      max-width: 95%;
      height: 600px;
      background: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .chat-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }
    .chat-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      color: white;
      overflow: hidden;
      flex-shrink: 0;
    }
    .chat-avatar .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .chat-user-details h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
    }
    .chat-status {
      font-size: 10px;
      margin: 0;
    }
    .close-chat, .delete-convo-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-chat:hover, .delete-convo-btn:hover { background: rgba(255,255,255,0.3); }
    .delete-convo-btn { font-size: 14px; }

    /* Reply Preview */
    .reply-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #f0f0f0;
      border-bottom: 1px solid #ddd;
    }
    .reply-preview-content small {
      color: #666;
      font-size: 10px;
    }
    .reply-preview-content p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #333;
    }
    .cancel-reply {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #666;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9f9f9;
      position: relative;
    }
    .message {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }
    .my-message {
      align-items: flex-end;
    }
    .message-actions {
      display: flex;
      gap: 4px;
      margin-bottom: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .message:hover .message-actions {
      opacity: 1;
    }
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .action-btn:hover {
      background: rgba(0,0,0,0.1);
    }
    .message-bubble {
      max-width: 70%;
      padding: 8px 12px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      position: relative;
    }
    .message-bubble.has-reply {
      border-left: 3px solid #0a246a;
    }
    .my-message .message-bubble {
      background: #e3f2fd;
    }
    .reply-reference {
      background: rgba(0,0,0,0.05);
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
      cursor: pointer;
      border-left: 2px solid #0a246a;
    }
    .reply-reference small {
      font-size: 9px;
      color: #666;
    }
    .reply-reference p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #333;
    }
    .message-bubble p {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #080808;
    }
    .message-bubble small {
      font-size: 9px;
      opacity: 0.7;
      color: #464242;
    }
    .no-messages {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    /* File Attachments */
    .file-attachment {
      margin-bottom: 8px;
    }
    .file-preview img {
      max-width: 200px;
      max-height: 150px;
      border-radius: 8px;
      cursor: pointer;
    }
    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(0,0,0,0.05);
      border-radius: 8px;
    }
    .file-icon {
      font-size: 20px;
    }
    .file-name {
      color: #0a246a;
      text-decoration: none;
      font-size: 12px;
    }
    .file-name:hover {
      text-decoration: underline;
    }

    /* File Send Preview */
    .file-send-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #e3f2fd;
      border-top: 1px solid #bbdefb;
    }
    .file-send-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .file-size {
      color: #666;
    }
    .remove-file {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
    }

    .chat-input-area {
      padding: 12px;
      display: flex;
      gap: 8px;
      border-top: 1px solid #e0e0e0;
      background: white;
      align-items: center;
    }
    .attach-btn {
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
    }
    .chat-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #c0c0c0;
      border-radius: 20px;
      font-size: 13px;
    }
    .send-btn {
      padding: 8px 16px;
      background: #0a246a;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
    }
    .send-btn:hover { background: #0a3a8c; }
    .send-btn:disabled { background: #ccc; cursor: not-allowed; }

    /* Drag & Drop Overlay */
    .drag-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(10, 36, 106, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .drag-overlay-content {
      text-align: center;
      color: white;
    }
    .upload-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
    }

    /* Image Preview Modal */
    .image-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    }
    .preview-image {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
    .close-preview {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .no-results {
      text-align: center;
      padding: 60px;
      color: #888;
    }
    .back-link {
      text-align: center;
      margin-top: 20px;
    }
    .back-link a {
      color: #0a246a;
      text-decoration: none;
      font-size: 13px;
    }
    /* Confirmation Dialog */
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 4000;
      animation: fadeIn 0.2s ease;
    }

    .confirm-dialog {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    .confirm-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .confirm-dialog h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .confirm-dialog p {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    .unread-badge {
      background: #cc0000;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 12px;
      min-width: 20px;
      text-align: center;
      margin-right: auto;
      margin-left: 12px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .confirm-btn {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .confirm-btn.cancel {
      background: #f0f0f0;
      color: #333;
    }

    .confirm-btn.cancel:hover {
      background: #e0e0e0;
    }

    .confirm-btn.confirm {
      background: #cc0000;
      color: white;
    }

    .confirm-btn.confirm:hover {
      background: #aa0000;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .back-link a:hover { text-decoration: underline; }
  `]
})
export class ClientContactComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;
  private unreadCountInterval: any;
  supportUsers: SupportUser[] = [];
  filteredUsers: SupportUser[] = [];
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';
  currentUsername = '';
  apiUrl = environment.apiUrl;
  
  // Chat properties
  showChatModal = false;
  selectedUser: SupportUser | null = null;
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  currentUserId = 0;
  currentUserOriginalId = 0;
  currentUserTable = 'new_user';
  currentUserCompositeId = '';

  // Reply functionality
  replyingTo: ChatMessage | null = null;

  // File upload
  selectedFile: File | null = null;
  isDragging = false;

  // Image preview
  showImagePreview = false;
  previewImageUrl = '';

  private refreshInterval: any;
  private pollingInterval: any;
  private currentUserBranchId: number | null = null;
  private allBranches: any[] = [];

  constructor(private http: HttpClient,
    private notificationService: NotificationService 
  ) {}

  ngOnInit() {
    this.initUserSession();
    this.loadBranches();
    this.loadSupportUsers();
    this.refreshInterval = setInterval(() => this.loadSupportUsers(), 60000);
    this.pollingInterval = setInterval(() => {
      if (this.showChatModal && this.selectedUser) this.loadMessages();
    }, 5000);
    this.unreadCountInterval = setInterval(() => this.loadUnreadMessageCounts(), 5000);
    setTimeout(() => this.loadUnreadMessageCounts(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
    clearInterval(this.pollingInterval);
    clearInterval(this.unreadCountInterval);
  }

  // --- Initialization ---

  private initUserSession() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUsername = currentUser.username ?? '';
    this.currentUserId = currentUser.id ?? 0;
    this.currentUserOriginalId = currentUser.id ?? 0;
    this.currentUserTable = 'new_user';
    this.currentUserCompositeId = `${this.currentUserTable}_${this.currentUserOriginalId}`;
    this.currentUserBranchId = currentUser.branch_id || null;
    
    console.log('🔍 Current User Branch ID:', this.currentUserBranchId);
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { 'Authorization': `Bearer ${token}` };
  }

  // --- Load Branches ---

  private loadBranches() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.allBranches = branches || [];
        console.log('📋 Branches loaded:', this.allBranches.length);
      },
      error: (err) => console.error('Failed to load branches:', err)
    });
  }

  private getBranchName(branchId: number): string {
    if (!branchId) return '';
    const branch = this.allBranches.find(b => b.id === branchId);
    return branch?.name || '';
  }

  private getCompanyName(branchId: number): string {
    if (!branchId) return '';
    const branch = this.allBranches.find(b => b.id === branchId);
    return branch?.company_name || '';
  }

  // --- UI Helpers ---

  getInitials(fullname: string): string {
    return fullname
      ? fullname.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?';
  }

  getReplyPreview(message: string | undefined | null): string {
    if (!message) return '';
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      online: 'On Duty',
      lunch: 'On Lunch',
      onLeave: 'On Leave',
      offline: 'Not Available',
      busy: 'Busy',
      away: 'Away'
    };
    return statusMap[status] || status;
  }

  formatTimeTo12Hour(timeStr: string): string {
    if (!timeStr) return '';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minutes} ${suffix}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  isImageFile(fileType: string | null): boolean {
    return fileType ? fileType.startsWith('image/') : false;
  }

  // --- File Handling ---

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
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
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  openImage(url: string) {
    this.previewImageUrl = url;
    this.showImagePreview = true;
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = '';
  }

  // --- Reply Functions ---

  replyToMessage(message: ChatMessage) {
    this.replyingTo = message;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  scrollToMessage(messageId: number) {
    const container = document.querySelector('.chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // --- Delete Functions ---
  showConfirmDialog = false;
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  showConfirm(message: string, callback: () => void) {
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirmDialog = true;
  }

  confirmAction() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.showConfirmDialog = false;
    this.confirmCallback = null;
  }

  cancelConfirm() {
    this.showConfirmDialog = false;
    this.confirmCallback = null;
  }

  deleteMessage(messageId: number) {
    this.showConfirm('Are you sure you want to delete this message?', () => {
      const headers = this.getHeaders();
      this.http.delete(`${environment.apiUrl}/api/messages/${messageId}`, { headers }).subscribe({
        next: () => {
          this.chatMessages = this.chatMessages.filter(m => m.id !== messageId);
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
          this.chatMessages = [];
        },
        error: (err) => console.error('Failed to delete conversation:', err)
      });
    });
  }

  // --- Parsing Helpers ---

  private parseDayArray(str: string): string[] {
    if (!str) return [];
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) return arr;
    } catch {
      // fall through
    }
    return str.split(',').map(d => d.trim()).filter(Boolean);
  }

  private parseLeaveEntries(str: string): any[] {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  private parseTimeToDecimal(timeStr: string): number {
    if (!timeStr) return 0;
    const cleaned = timeStr.trim().toLowerCase();
    
    const ampmMatch = cleaned.match(/(\d+):?(\d*)\s*(am|pm)/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
        const period = ampmMatch[3];
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        return hours + minutes / 60;
    }
    
    const parts = cleaned.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    
    if (isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid time format:', timeStr);
        return 0;
    }
    
    return hours + minutes / 60;
  }

  // --- Availability Logic ---

  private getTodayName(): string {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  }

  private isOnLeave(user: any): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const leaves = this.parseLeaveEntries(user.leaveEntries);
    return leaves.some((leave: any) => {
      const leaveDate = new Date(leave.date).toISOString().split('T')[0];
      return leaveDate === today && leave.status === 'approved';
    });
  }

  private formatLeaveReason(leaveEntries: string): string {
    const leaves = this.parseLeaveEntries(leaveEntries);
    const today = new Date().toISOString().split('T')[0];
    const todayLeave = leaves.find((l: any) => l.date === today);
    return todayLeave?.reason || 'Scheduled leave';
  }

  private isDayOffToday(dayOffStr: string): boolean {
    const todayName = this.getTodayName();
    return this.parseDayArray(dayOffStr).includes(todayName);
  }

  private isWorkingDayToday(workDaysStr: string): boolean {
    if (!workDaysStr) return true;
    const todayName = this.getTodayName();
    return this.parseDayArray(workDaysStr).includes(todayName);
  }

  private isWithinTimeRange(start: string, end: string): boolean {
    const now = new Date();
    const currentDecimal = now.getHours() + now.getMinutes() / 60;
    return (
      currentDecimal >= this.parseTimeToDecimal(start) &&
      currentDecimal <= this.parseTimeToDecimal(end)
    );
  }

  private isLunchBreak(user: any): boolean {
    return this.isWithinTimeRange(user.lunchStart, user.lunchEnd);
  }

  private isWithinWorkHours(user: any): boolean {
    return this.isWithinTimeRange(user.workStart || '09:00', user.workEnd || '17:00');
  }

  calculateAvailability(user: any): SupportUser {
    console.log(`\n=== CALCULATING AVAILABILITY FOR: ${user.fullname} ===`);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeDecimal = currentHour + currentMinute / 60;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[now.getDay()];
    
    console.log(`Current date/time: ${now.toString()}`);
    console.log(`Today is: ${todayName}`);
    console.log(`Current time decimal: ${currentTimeDecimal}`);
    
    const hasWorkSchedule = user.workStart && user.workStart !== null && user.workStart !== 'null' && user.workStart.toString().trim() !== '' && 
                           user.workEnd && user.workEnd !== null && user.workEnd !== 'null' && user.workEnd.toString().trim() !== '';
    
    console.log(`Has work schedule? ${hasWorkSchedule}`);
    console.log(`  workStart value: "${user.workStart}" (type: ${typeof user.workStart})`);
    console.log(`  workEnd value: "${user.workEnd}" (type: ${typeof user.workEnd})`);
    
    const hasWorkDays = user.workDays && user.workDays !== null && user.workDays !== 'null' && user.workDays.toString().trim() !== '';
    console.log(`Has work days? ${hasWorkDays}`);
    console.log(`  workDays value: "${user.workDays}" (type: ${typeof user.workDays})`);
    
    const hasDayOff = user.dayOff && user.dayOff !== null && user.dayOff !== 'null' && user.dayOff.toString().trim() !== '';
    console.log(`Has day off? ${hasDayOff}`);
    console.log(`  dayOff value: "${user.dayOff}" (type: ${typeof user.dayOff})`);
    
    const hasLunchSchedule = user.lunchStart && user.lunchStart !== null && user.lunchStart !== 'null' && user.lunchStart.toString().trim() !== '' && 
                            user.lunchEnd && user.lunchEnd !== null && user.lunchEnd !== 'null' && user.lunchEnd.toString().trim() !== '';
    console.log(`Has lunch schedule? ${hasLunchSchedule}`);
    console.log(`  lunchStart value: "${user.lunchStart}" (type: ${typeof user.lunchStart})`);
    console.log(`  lunchEnd value: "${user.lunchEnd}" (type: ${typeof user.lunchEnd})`);
    
    const hasLeaveEntries = user.leaveEntries && user.leaveEntries !== null && user.leaveEntries !== 'null' && user.leaveEntries.toString().trim() !== '';
    console.log(`Has leave entries? ${hasLeaveEntries}`);
    console.log(`  leaveEntries value: "${user.leaveEntries}" (type: ${typeof user.leaveEntries})`);
    
    if (!hasWorkSchedule && !hasWorkDays && !hasDayOff) {
        console.log('RESULT: SCHEDULE NOT SET');
        return {
            ...user,
            status: 'offline',
            availabilityMessage: 'Schedule not set'
        };
    }
    
    if (hasLeaveEntries) {
        try {
            const leaves = JSON.parse(user.leaveEntries);
            if (Array.isArray(leaves) && leaves.length > 0) {
                const todayDate = now.toISOString().split('T')[0];
                console.log(`Checking leave for date: ${todayDate}`);
                console.log(`Leave entries:`, leaves);
                
                const onLeave = leaves.some((leave: any) => {
                    const leaveDate = new Date(leave.date).toISOString().split('T')[0];
                    console.log(`  Leave date: ${leaveDate}, Status: ${leave.status}, Match: ${leaveDate === todayDate && leave.status === 'approved'}`);
                    return leaveDate === todayDate && leave.status === 'approved';
                });
                
                if (onLeave) {
                    console.log('RESULT: ON LEAVE');
                    return {
                        ...user,
                        status: 'onLeave',
                        availabilityMessage: `On leave - ${this.getLeaveReason(user.leaveEntries)}`
                    };
                }
            }
        } catch(e) {
            console.error('Error parsing leave entries:', e);
        }
    }
    
    if (hasDayOff) {
        try {
            const daysOff = JSON.parse(user.dayOff);
            console.log(`Parsed days off:`, daysOff);
            console.log(`Checking if ${todayName} is a day off: ${Array.isArray(daysOff) && daysOff.includes(todayName)}`);
            
            if (Array.isArray(daysOff) && daysOff.includes(todayName)) {
                console.log('RESULT: DAY OFF');
                return {
                    ...user,
                    status: 'offline',
                    availabilityMessage: 'Not available (scheduled day off)'
                };
            }
        } catch(e) {
            const daysOff = user.dayOff.split(',').map((d: string) => d.trim());
            console.log(`Parsed days off (comma-separated):`, daysOff);
            
            if (daysOff.includes(todayName)) {
                console.log('RESULT: DAY OFF');
                return {
                    ...user,
                    status: 'offline',
                    availabilityMessage: 'Not available (scheduled day off)'
                };
            }
        }
    }
    
    if (hasWorkDays) {
        try {
            const workDays = JSON.parse(user.workDays);
            console.log(`Parsed work days:`, workDays);
            console.log(`Checking if ${todayName} is a working day: ${Array.isArray(workDays) && workDays.length > 0 && workDays.includes(todayName)}`);
            
            if (Array.isArray(workDays) && workDays.length > 0 && !workDays.includes(todayName)) {
                console.log('RESULT: NOT A WORKING DAY');
                return {
                    ...user,
                    status: 'offline',
                    availabilityMessage: 'Not available (not a working day)'
                };
            }
        } catch(e) {
            const workDays = user.workDays.split(',').map((d: string) => d.trim());
            console.log(`Parsed work days (comma-separated):`, workDays);
            
            if (workDays.length > 0 && !workDays.includes(todayName)) {
                console.log('RESULT: NOT A WORKING DAY');
                return {
                    ...user,
                    status: 'offline',
                    availabilityMessage: 'Not available (not a working day)'
                };
            }
        }
    }
    
    if (!hasWorkSchedule) {
        if (hasLunchSchedule) {
            const lunchStartDecimal = this.parseTimeToDecimal(user.lunchStart);
            const lunchEndDecimal = this.parseTimeToDecimal(user.lunchEnd);
            const isLunchBreak = currentTimeDecimal >= lunchStartDecimal && 
                                currentTimeDecimal <= lunchEndDecimal;
            
            console.log(`Lunch check (no work hours): ${currentTimeDecimal} between ${lunchStartDecimal}-${lunchEndDecimal}? ${isLunchBreak}`);
            
            if (isLunchBreak) {
                console.log('RESULT: ON LUNCH BREAK');
                return {
                    ...user,
                    status: 'lunch',
                    availabilityMessage: `On lunch break until ${this.formatTimeTo12Hour(user.lunchEnd)}`
                };
            }
        }
        
        if (hasWorkDays) {
            console.log('RESULT: ON DUTY (work hours not set)');
            return {
                ...user,
                status: 'online',
                availabilityMessage: 'Available (work hours not set)'
            };
        }
        
        console.log('RESULT: AVAILABLE (schedule partially set)');
        return {
            ...user,
            status: 'online',
            availabilityMessage: 'Available'
        };
    }
    
    const workStartDecimal = this.parseTimeToDecimal(user.workStart);
    const workEndDecimal = this.parseTimeToDecimal(user.workEnd);
    
    console.log(`Work hours: ${workStartDecimal} (${user.workStart}) to ${workEndDecimal} (${user.workEnd})`);
    console.log(`Current time: ${currentTimeDecimal}`);
    
    const isWorkingHour = currentTimeDecimal >= workStartDecimal && 
                         currentTimeDecimal <= workEndDecimal;
    
    console.log(`Is within work hours? ${isWorkingHour}`);
    
    if (!isWorkingHour) {
        const startDisplay = this.formatTimeTo12Hour(user.workStart);
        const endDisplay = this.formatTimeTo12Hour(user.workEnd);
        console.log('RESULT: OFF DUTY');
        return {
            ...user,
            status: 'offline',
            availabilityMessage: `Not available (off duty ${startDisplay} - ${endDisplay})`
        };
    }
    
    if (hasLunchSchedule) {
        const lunchStartDecimal = this.parseTimeToDecimal(user.lunchStart);
        const lunchEndDecimal = this.parseTimeToDecimal(user.lunchEnd);
        const isLunchBreak = currentTimeDecimal >= lunchStartDecimal && 
                            currentTimeDecimal <= lunchEndDecimal;
        
        console.log(`Lunch check: ${currentTimeDecimal} between ${lunchStartDecimal}-${lunchEndDecimal}? ${isLunchBreak}`);
        
        if (isLunchBreak) {
            console.log('RESULT: ON LUNCH BREAK');
            return {
                ...user,
                status: 'lunch',
                availabilityMessage: `On lunch break until ${this.formatTimeTo12Hour(user.lunchEnd)}`
            };
        }
    }
    
    const endDisplay = this.formatTimeTo12Hour(user.workEnd);
    console.log('RESULT: ON DUTY');
    return {
        ...user,
        status: 'online',
        availabilityMessage: `On duty until ${endDisplay}`
    };
  }

  private getLeaveReason(leaveEntries: string): string {
    try {
        const leaves = JSON.parse(leaveEntries);
        const today = new Date().toISOString().split('T')[0];
        const todayLeave = leaves.find((l: any) => l.date === today);
        return todayLeave?.reason || 'Scheduled leave';
    } catch {
        return 'Scheduled leave';
    }
  }

  markMessagesAsRead(fromUsername: string) {
    this.http.put(`${environment.apiUrl}/api/messages/read/${fromUsername}`, {}, { headers: this.getHeaders() }).subscribe({ 
      error: (err) => console.error('Error marking messages as read:', err) 
    });
  }

  // --- User and Chat API Actions ---

  loadUnreadMessageCounts() {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/unread/${this.currentUsername}`, { headers }).subscribe({
      next: (unread) => {
        this.supportUsers.forEach(user => {
          const match = unread.find((u: any) => u.from_username === user.username);
          user.unreadCount = match ? match.count : 0;
        });
        this.filterUsers();
      },
      error: (err) => console.error('Error loading unread counts:', err)
    });
  }

  loadSupportUsers() {
    const headers = this.getHeaders();
    
    // ✅ Just use the main endpoint - it handles filtering based on the user's branch
    const url = `${environment.apiUrl}/api/users`;
    
    console.log(`📡 Fetching users from: ${url}`);
    
    this.http.get<any[]>(url, { headers }).subscribe({
        next: (users) => {
            console.log('=== USERS FROM API ===');
            console.log(`Received ${users.length} users`);
            
            // The backend already filters based on the user's branch
            // Just process the returned users
            this.supportUsers = users.map(user => {
                console.log(`\nProcessing: ${user.fullname} (${user.role}) - Branch: ${user.branch_name || 'N/A'}`);
                const processed = this.calculateAvailability(user);
                processed.userId = user.id;
                processed.branch_id = user.branch_id;
                processed.branch_name = user.branch_name || this.getBranchName(user.branch_id);
                processed.company_name = user.company_name || this.getCompanyName(user.branch_id);
                return processed;
            });
            
            console.log(`✅ Total support users: ${this.supportUsers.length}`);
            this.supportUsers.forEach(user => {
                console.log(`  - ${user.fullname}: ${user.role} @ ${user.branch_name || 'No Branch'}`);
            });
            
            this.filterUsers();
            this.loadUnreadMessageCounts();
        },
        error: (err) => {
            console.error('Failed to load support staff:', err);
            this.supportUsers = [];
            this.filteredUsers = [];
        }
    });
}

// Fallback method if the new endpoints don't work
private loadSupportUsersFallback() {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
        next: (users) => {
            const allowedRoles = ['Technician', 'Head/Manager', 'Supervisor'];
            const mainBranchIds = [1, 5];
            const isMainBranch = mainBranchIds.includes(this.currentUserBranchId || 0);
            
            let supportStaff = users.filter(u => 
                allowedRoles.includes(u.role) && 
                u.user_table === 'users'
            );
            
            // If not main branch, filter by branch
            if (!isMainBranch) {
                supportStaff = supportStaff.filter(u => 
                    u.branch_id === this.currentUserBranchId
                );
            }
            
            this.supportUsers = supportStaff.map(user => {
                const processed = this.calculateAvailability(user);
                processed.userId = user.id;
                processed.branch_id = user.branch_id;
                processed.branch_name = user.branch_name || this.getBranchName(user.branch_id);
                processed.company_name = user.company_name || this.getCompanyName(user.branch_id);
                return processed;
            });
            
            this.filterUsers();
            this.loadUnreadMessageCounts();
        },
        error: (err) => console.error('Fallback failed:', err)
    });
}

  filterUsers() {
    let filtered = [...this.supportUsers];
    const term = this.searchTerm.toLowerCase();
    if (term) {
      filtered = filtered.filter(u =>
        u.fullname?.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.branch_name?.toLowerCase().includes(term) ||
        u.company_name?.toLowerCase().includes(term)
      );
    }
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === this.statusFilter);
    }
    this.filteredUsers = filtered;
  }

  openChat(user: SupportUser) {
    this.selectedUser = user;
    this.showChatModal = true;
    this.chatMessages = [];
    this.replyingTo = null;
    this.selectedFile = null;
    
    if (user.unreadCount && user.unreadCount > 0) {
      this.markMessagesAsRead(user.username);
      user.unreadCount = 0;
      this.filterUsers();
    }
    
    this.loadMessages();
    this.loadUnreadMessageCounts();
  }

  closeChat() {
    this.showChatModal = false;
    this.selectedUser = null;
    this.chatMessages = [];
    this.newMessage = '';
    this.replyingTo = null;
    this.selectedFile = null;
  }

  loadMessages() {
    if (!this.selectedUser) return;
    const headers = this.getHeaders();
    const url = `${environment.apiUrl}/api/messages/${this.selectedUser.username}`;
    this.http.get<ChatMessage[]>(url, { headers }).subscribe({
      next: (messages) => {
        this.chatMessages = messages || [];
        this.scrollToBottom();
      },
      error: () => {
        this.chatMessages = [];
      }
    });
  }

  sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUser) return;
    
    const messageText = this.newMessage.trim();
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
      },
      error: (err) => console.error('Failed to send message:', err)
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }
}