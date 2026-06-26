import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, Ticket } from '../../services/ticket.service';
import { ClientTicketService } from '../../services/client-ticket.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ClientNotificationService } from '../../services/client-notification.service';

@Component({
  selector: 'app-client-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="detail-container" *ngIf="ticket">
  
  <!-- Header -->
  <div class="retro-header">
    <h2>Ticket Code: {{ ticket.ticket_number }}</h2>
    <div class="badge-group">
      <span class="priority-badge" [class]="'priority-' + ticket.priority">{{ ticket.priority | uppercase }}</span>
      <span class="status-badge" [class]="'status-' + ticket.status">{{ ticket.status | titlecase }}</span>
      <button class="retro-btn" (click)="goBack()" title="Close">✕</button>
    </div>
  </div>

 <div class="detail-layout" [class.full-width]="!isEDPUser()">
    
    <!-- LEFT: Main Info -->
    <div class="main-panel">
      
      <!-- Ticket Info -->
      <div class="detail-card">
        <h3 class="ticket-title">{{ ticket.title }}</h3>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Created By</span>
            <span class="info-value">{{ ticket.created_by_name || ticket.creator_name || 'Unknown' }}</span>
          </div>
          <div class="info-item">
  <span class="info-label">Creator's Department</span>
  <span class="info-value">{{ ticket.creator_department || '—' }}</span>
    </div>
          <div class="info-item">
            <span class="info-label">Location</span>
            <span class="info-value">{{ ticket.location || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Created</span>
            <span class="info-value">{{ ticket.created_at | date:'MMM d, y h:mm a' }}</span>
          </div>
          <div class="info-item" *ngIf="ticket.assigned_to || (ticket.assigned_users && ticket.assigned_users.length > 0)">
            <span class="info-label">Assigned To</span>
            <span class="info-value">{{ getAssignedNames(ticket) }}</span>
          </div>
          <div class="info-item" *ngIf="ticket.resolved_at">
            <span class="info-label">Resolved</span>
            <span class="info-value">{{ ticket.resolved_at | date:'MMM d, y h:mm a' }}</span>
          </div>
          <!-- Send To (Destination) -->
<div class="info-item">
  <span class="info-label">Send To</span>
  <span class="info-value">
    {{ ticket.department_name || '—' }}
    <span *ngIf="ticket.branch_name" style="font-size:10px;color:#666;">
      🏢 {{ ticket.branch_name }} <span *ngIf="ticket.company_name">({{ ticket.company_name }}</span>
    </span>
  </span>
</div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-card">
        <h4 class="section-title">📝 Description</h4>
        <div class="description-content" [innerHTML]="safeDescription"></div>
      </div>

      <!-- Attachments -->
      <div class="detail-card" *ngIf="attachments.length > 0">
        <h4 class="section-title">📎 Attachments ({{ attachments.length }})</h4>
        <div class="attachments-list">
          <div class="attachment-item" *ngFor="let att of attachments">
            <div class="att-preview" *ngIf="att.file_type?.startsWith('image/')" (click)="openAttachmentViewer(att)">
              <img [src]="apiUrl + att.file_path" [alt]="att.original_name">
            </div>
            <div class="att-info">
              <span class="att-icon">{{ getFileIcon(att.original_name) }}</span>
              <a [href]="apiUrl + att.file_path" target="_blank" class="att-name">{{ att.original_name }}</a>
              <span class="att-size">{{ formatFileSize(att.file_size) }}</span>
              <button class="att-download-btn" (click)="downloadAttachment(att)" title="Download">⬇️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments -->
<div class="detail-card">
  <h4 class="section-title">💬 Activity & Comments</h4>
  <div class="comments-list" *ngIf="comments.length > 0">
    <div class="comment-item" *ngFor="let comment of comments">
      <div class="comment-avatar" [style.background]="comment.avatar_color || '#3b82f6'">
        <img *ngIf="comment.photo_url" [src]="apiUrl + comment.photo_url" class="comment-photo">
        <span *ngIf="!comment.photo_url">{{ comment.author_name?.charAt(0)?.toUpperCase() || '?' }}</span>
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">{{ comment.author_name || 'System' }}</span>
          <span class="comment-date">{{ comment.created_at | date:'MMM d, h:mm a' }}</span>
          <span class="comment-badge internal" *ngIf="comment.is_internal">Internal</span>
          <span class="comment-badge edp" *ngIf="isCommentFromEDP(comment)">EDP</span>
        </div>
        <div class="comment-text">{{ comment.comment }}</div>
        <div class="comment-actions">
          <button class="comment-action-btn" (click)="replyToComment(comment)" title="Reply">↩️ Reply</button>
          <button class="comment-action-btn delete" 
                  *ngIf="canDeleteComment(comment)" 
                  (click)="deleteComment(comment)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  </div>
  <div class="empty-state" *ngIf="comments.length === 0">
    <p>No comments yet.</p>
  </div>

  <!-- Reply Box -->
  <div class="reply-box" *ngIf="showReplyBox">
    <div class="reply-to" *ngIf="replyToUser">
      ↩️ Replying to <strong>{{ replyToUser }}</strong>
      <button class="cancel-reply" (click)="cancelReply()">✕ Cancel</button>
    </div>
    <textarea class="classic-textarea" rows="2" [(ngModel)]="newReply" placeholder="Type your reply..."></textarea>
    <button class="retro-btn primary" (click)="submitReply()" [disabled]="!newReply.trim()">💬 Reply</button>
  </div>
  
  <!-- Add Comment Button - Only show if EDP user OR creator AND there are EDP comments -->
  <div class="add-reply-section" *ngIf="!showReplyBox && canShowAddComment()">
    <button class="retro-btn" (click)="startReply()">💬 Add Comment</button>
  </div>
</div>
    </div>

    <!-- RIGHT: Actions Panel -->
    <div class="actions-panel" *ngIf="isEDPUser()">
      <div class="detail-card">
        <h4 class="section-title">⚙️ Actions</h4>
        
       <!-- Status Change -->
<div class="form-field">
  <label>Status</label>
  
  <!-- Always show the current status badge -->
  <div class="status-display">
    <span class="status-badge" [class]="'status-' + ticket.status">{{ ticket.status | titlecase }}</span>
  </div>
  
  <!-- Only show dropdown if user can change status -->
  <select class="classic-select" *ngIf="canChangeStatus()" [(ngModel)]="editStatus" (change)="onStatusChange()" style="margin-top:6px;">
    <option [value]="ticket.status" disabled selected>{{ ticket.status | titlecase }} (current)</option>
    <option value="in_progress" *ngIf="ticket.status !== 'in_progress'">In Progress</option>
    <option value="pending" *ngIf="ticket.status !== 'pending'">Pending</option>
    <option value="resolved" *ngIf="ticket.status !== 'resolved'">Resolved</option>
  </select>
</div>
        
        <!-- Assign/Reassign -->
        <div class="form-field">
          <label>Assigned To</label>
          <div class="assign-display">
            <span *ngIf="ticket.assigned_to || (ticket.assigned_users && ticket.assigned_users.length > 0)">
              👥 {{ getAssignedNames(ticket) }}
            </span>
            <span *ngIf="!ticket.assigned_to && (!ticket.assigned_users || ticket.assigned_users.length === 0)" style="color:#888;">— Unassigned —</span>
            <button class="retro-btn" (click)="openAssignModal()" *ngIf="canReassign()" style="margin-left:auto;font-size:9px;">{{ ticket.assigned_to ? 'Change' : 'Assign' }}</button>
          </div>
        </div>
        
        <!-- Add Comment -->
        <div class="form-field">
          <label>Add Comment</label>
          <textarea class="classic-textarea" rows="3" [(ngModel)]="newComment" placeholder="Type your comment..."></textarea>
        </div>
        
        <!-- Buttons -->
        <div class="form-actions">
          <button class="retro-btn primary" (click)="addComment()" [disabled]="!newComment.trim()">💬 Post Comment</button>
          <button *ngIf="canDelete()" class="retro-btn danger" (click)="deleteTicket()">🗑️ Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Viewer Modal -->
  <div class="viewer-overlay" *ngIf="showImageViewer" (click)="closeImageViewer()">
    <div class="viewer-content" (click)="$event.stopPropagation()">
      <button class="viewer-close" (click)="closeImageViewer()">✕</button>
      <button class="viewer-nav prev" (click)="prevImage()" *ngIf="extractedImages.length > 1">◀</button>
      <img [src]="extractedImages[currentImageIndex]" alt="Full image">
      <button class="viewer-nav next" (click)="nextImage()" *ngIf="extractedImages.length > 1">▶</button>
      <div class="viewer-count" *ngIf="extractedImages.length > 1">{{ currentImageIndex + 1 }} / {{ extractedImages.length }}</div>
    </div>
  </div>

  <!-- Assign Modal -->
  <div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
    <div class="modal-window" (click)="$event.stopPropagation()">
      <div class="modal-titlebar">
        <span>👤 {{ ticket?.assigned_to ? 'Reassign' : 'Assign' }} Ticket: {{ ticket?.ticket_number }}</span>
        <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <p class="assign-info">Select agent(s) to handle this ticket: <span class="selected-count" *ngIf="selectedAgentIds.length > 0">({{ selectedAgentIds.length }} selected)</span></p>
        <div class="agent-list">
          <div class="agent-item self-assign" [class.selected]="isAgentSelected(currentUser)" (click)="toggleAgent(currentUser)">
            <span class="agent-avatar" [style.background]="currentUser?.avatar_color || '#0a3a8c'">{{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '👤' }}</span>
            <div class="agent-info">
              <span class="agent-name">Assign to Me</span>
              <span class="agent-role">{{ currentUser?.fullname }} ({{ currentUser?.role || 'Staff' }})</span>
            </div>
            <span class="agent-checkbox" [class.checked]="isAgentSelected(currentUser)">{{ isAgentSelected(currentUser) ? '☑' : '☐' }}</span>
          </div>
          <div class="agent-item" *ngFor="let agent of availableAgents" [class.selected]="isAgentSelected(agent)" (click)="toggleAgent(agent)">
            <span class="agent-avatar" [style.background]="agent.avatar_color || '#3b82f6'">{{ agent.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
            <div class="agent-info">
              <span class="agent-name">{{ agent.fullname }}</span>
              <span class="agent-role">{{ agent.role || 'Staff' }}</span>
            </div>
            <span class="agent-checkbox" [class.checked]="isAgentSelected(agent)">{{ isAgentSelected(agent) ? '☑' : '☐' }}</span>
          </div>
          <div class="empty-agents" *ngIf="availableAgents.length === 0"><p>No other agents available in your branch.</p></div>
        </div>
        <div class="modal-actions">
          <button class="retro-btn" (click)="closeAssignModal()">Cancel</button>
          <button class="retro-btn primary" (click)="confirmAssign()" [disabled]="selectedAgentIds.length === 0">✅ {{ ticket?.assigned_to ? 'Reassign' : 'Assign' }} Ticket</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Modal -->
  <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
    <div class="modal-window" (click)="$event.stopPropagation()">
      <div class="modal-titlebar danger"><span>🗑️ Delete Ticket</span><button type="button" (click)="closeDeleteModal()" class="modal-close">✕</button></div>
      <div class="modal-body">
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <div class="warning-message">
            <h3>Permanently delete this ticket?</h3>
            <p>Ticket: <strong>#{{ ticket?.ticket_number }}</strong></p>
            <p class="resolve-title">"{{ ticket?.title }}"</p>
            <p class="warning-hint danger-text">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="retro-btn" (click)="closeDeleteModal()">Cancel</button>
          <button class="retro-btn danger" (click)="confirmDelete()">🗑️ Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
<!-- Toast Notification -->
<div class="toast-notification" [class]="toastType" *ngIf="showToast">
  <span class="toast-icon">{{ toastType === 'success' ? '✅' : '❌' }}</span>
  <span class="toast-message">{{ toastMessage }}</span>
  <button class="toast-close" (click)="showToast = false">✕</button>
</div>
  <!-- Success Modal -->
  <div class="modal-overlay" *ngIf="showUpdateSuccess" (click)="closeSuccessModal()">
    <div class="modal-window" (click)="$event.stopPropagation()">
      <div class="modal-titlebar success"><span>✅ Success</span><button type="button" (click)="closeSuccessModal()" class="modal-close">✕</button></div>
      <div class="modal-body">
        <div class="warning-content">
          <span class="warning-icon">✅</span>
          <div class="warning-message"><h3>{{ updateSuccessMessage }}</h3></div>
        </div>
        <div class="modal-actions"><button class="retro-btn primary" (click)="closeSuccessModal()">OK</button></div>
      </div>
    </div>
  </div>
</div>
<!-- Delete Comment Modal -->
<div class="modal-overlay" *ngIf="showDeleteCommentModal" (click)="closeDeleteCommentModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar danger">
      <span>🗑️ Delete Comment</span>
      <button type="button" (click)="closeDeleteCommentModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">💬</span>
        <div class="warning-message">
          <h3>Delete this comment?</h3>
          <p class="comment-preview">"{{ (deleteCommentData?.comment || '') | slice:0:100 }}{{ (deleteCommentData?.comment?.length || 0) > 100 ? '...' : '' }}"</p>
          <p class="warning-hint danger-text">By {{ deleteCommentData?.author_name || 'Unknown' }} · This action cannot be undone.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeDeleteCommentModal()">Cancel</button>
        <button class="retro-btn danger" (click)="confirmDeleteComment()">🗑️ Delete</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { 
      display: block; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 11px;
    }
    .detail-container {
      padding: 8px 12px;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    input, textarea, select {
      user-select: auto !important;
      -webkit-user-select: auto !important;
      -moz-user-select: auto !important;
      -ms-user-select: auto !important;
    }
    .detail-card, .description-content, .comment-text {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    .close-btn {
      background: #f0f0f0;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 14px;
      color: #000;
    }
    .close-btn:hover { background: #e0e0e0; }
    .close-btn:active { border-color: #808080 #fff #fff #808080; }
    .detail-card {
      background: #fff;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 10px 12px;
      margin-bottom: 6px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .ticket-number {
      font-family: monospace;
      color: #0a3a8c;
      font-weight: bold;
      font-size: 11px;
    }
    .ticket-title {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #000;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      color: #0a3a8c;
      margin: 0 0 6px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid #ddd;
    }
    .comments-list { max-height: 250px; overflow-y: auto; }
    .comment-item { display: flex; gap: 10px; padding: 8px 10px; border-bottom: 1px solid #eee; color: rgb(0, 0, 0); background: #fafafa; margin-bottom: 4px; border-radius: 2px; }
    .comment-item:last-child { border-bottom: none; margin-bottom: 0; }
    .comment-item:hover { background: #f0f0f0; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; flex-wrap: wrap; gap: 4px; }
    .comment-author { font-weight: bold; font-size: 10px; color: #0a3a8c; }
    .comment-date { font-size: 9px; color: #1b1919; font-family: monospace; }
    .comment-badge { font-size: 8px; padding: 1px 5px; border-radius: 3px; font-weight: bold; }
    .comment-badge.internal { background: #ffe0cc; color: #cc6600; }
    .comment-text { font-size: 11px; line-height: 1.5; color: #333; word-wrap: break-word; }
    .empty-state { text-align: center; padding: 20px; color: #888; font-size: 11px; }
    .empty-state p { margin: 0; font-style: italic; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; color: rgb(0, 0, 0); }
    .info-label { font-size: 9px; font-weight: bold; color: #000000; text-transform: uppercase; }
    .dept-value { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .branch-tag-small {
      font-size: 9px;
      background: #f0f4ff;
      color: #0a3a8c;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid #b8c8e8;
      font-weight: normal;
    }
  .detail-layout { display: grid; grid-template-columns: 1fr 300px; gap: 8px; }
.detail-layout.full-width { grid-template-columns: 1fr; }
.retro-header {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 10px;
  background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%);
  color: #fff;
  border: 2px solid; border-color: #fff #808080 #808080 #fff;
  margin-bottom: 8px;
}
.retro-header h2 { margin: 0; font-size: 13px; flex: 1; }
.retro-btn {
  background: #f0f0f0; border: 2px solid;
  border-color: #fff #808080 #808080 #fff;
  border-radius: 2px; padding: 3px 12px;
  cursor: pointer; font-size: 10px; color: #000;
  display: inline-flex; align-items: center; gap: 4px;
}
.retro-btn:hover { background: #e8f0ff; }
.retro-btn:active { border-color: #808080 #fff #fff #808080; }
.retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
.retro-btn.danger { background: #cc0000; color: #fff; border-color: #ff4444 #880000 #880000 #ff4444; }
.retro-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.badge-group { display: flex; gap: 8px; align-items: center; }
.main-panel { min-width: 0; }
.actions-panel { min-width: 280px; }
      .actions-panel { margin-top: 8px; }
.form-field { margin-bottom: 10px; }
.form-field label { display: block; font-size: 10px; font-weight: bold; margin-bottom: 4px; color: #000; }
.classic-select, .classic-textarea { width: 100%; padding: 5px 7px; border: 1px solid #808080; font-size: 11px; font-family: inherit; box-sizing: border-box; }
.classic-textarea { resize: vertical; min-height: 50px; }
.form-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.assign-display { display: flex; align-items: center; gap: 8px; padding: 5px 7px; border: 1px solid #808080; background: #f9f9f9; font-size: 11px; }
.status-display { padding: 8px 10px; background: #f9f9f9; border: 1px solid #ddd; text-align: center; }
    .description-content { font-size: 15px; font-weight: 800px; line-height: 1.5; padding: 6px 8px; background: #f9f9f9; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; word-wrap: break-word; color: rgb(0, 0, 0); }
    .description-content img { max-width: 100%; height: auto; border: 1px solid #ccc; margin: 4px 0; cursor: pointer; }
    .viewer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .viewer-content { position: relative; }
    .viewer-content img { max-width: 85vw; max-height: 80vh; object-fit: contain; }
    .viewer-close { position: absolute; top: -28px; right: 0; background: none; border: 1px solid #fff; color: #fff; font-size: 16px; cursor: pointer; padding: 2px 8px; }
    .viewer-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 20px; cursor: pointer; padding: 8px 12px; }
    .viewer-nav.prev { left: -40px; }
    .viewer-nav.next { right: -40px; }
    .viewer-nav:hover { background: rgba(255,255,255,0.3); }
    .viewer-count { text-align: center; color: #fff; margin-top: 6px; font-size: 10px; }
    .attachments-list { display: flex; flex-direction: column; gap: 6px; }
    .attachment-item { display: flex; gap: 10px; padding: 6px; background: #f9f9f9; border: 1px solid #ddd; }
    .att-preview { width: 60px; height: 60px; overflow: hidden; cursor: pointer; border: 1px solid #ccc; flex-shrink: 0; }
    .att-preview img { width: 100%; height: 100%; object-fit: cover; }
    .att-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .att-icon { font-size: 18px; flex-shrink: 0; }
    .att-name { color: #0066cc; text-decoration: none; font-size: 10px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .att-name:hover { text-decoration: underline; }
    .att-size { font-size: 9px; color: #888; flex-shrink: 0; }
    .att-download-btn { background: none; border: 1px solid #ccc; cursor: pointer; font-size: 12px; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }
    .att-download-btn:hover { background: #e8f0fe; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0; overflow: hidden; }
    .comment-photo { width: 100%; height: 100%; object-fit: cover; }
    .comment-content { flex: 1; min-width: 0; }
    .comment-actions { display: flex; gap: 8px; margin-top: 4px; }
    .comment-action-btn { background: none; border: none; cursor: pointer; font-size: 9px; color: #666; padding: 2px 4px; }
    .comment-action-btn:hover { color: #0a3a8c; text-decoration: underline; }
    .comment-action-btn.delete:hover { color: #cc0000; }
    .reply-box { margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; }
    .add-reply-section { margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd; }
    .reply-to { font-size: 10px; color: #666; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .reply-to strong { color: #0a3a8c; }
    .cancel-reply { background: none; border: none; cursor: pointer; color: #cc0000; font-size: 12px; }
    .classic-textarea { width: 100%; padding: 5px 7px; border: 1px solid #808080; font-size: 11px; font-family: inherit; box-sizing: border-box; resize: vertical; min-height: 40px; margin-bottom: 6px; }
    .classic-btn { background: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 3px; padding: 4px 12px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; color: #000; }
    .classic-btn:hover { background: #e0e0e0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status-badge { display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 9px; text-transform: uppercase; }
    .status-new { background: #ffffff; color: #6900f3; }
    .status-assigned { background: #e0e0e0; color: #666; }
    .status-in_progress { background: #fff0cc; color: #cc6600; }
    .status-pending { background: #ffe0cc; color: #cc6600; }
    .status-resolved { background: #ccffcc; color: #008800; }
    .status-closed { background: #f0f0f0; color: #666; }
    .priority-badge { display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .priority-critical { background: #cc0000; color: white; }
    .priority-high { background: #ff6600; color: white; }
    .priority-medium { background: #ffcc00; color: #333; }
    .priority-low { background: #008800; color: white; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-window { background: #f0f0f0; border: 2px solid #808080; box-shadow: 3px 3px 8px rgba(0,0,0,0.4); min-width: 420px; max-width: 500px; }
.modal-titlebar { background: #0a246a; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; }
.modal-titlebar.danger { background: #cc0000; }
.modal-titlebar.success { background: #008800; }
.modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 1px 6px; font-size: 14px; }
.modal-close:hover { background: rgba(255,255,255,0.2); }
.modal-body { padding: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.warning-content { display: flex; gap: 14px; align-items: flex-start; }
.warning-icon { font-size: 36px; flex-shrink: 0; }
.warning-message h3 { margin: 0 0 6px 0; font-size: 13px; color: #000; font-weight: bold; }
.warning-message p { margin: 0 0 4px 0; font-size: 11px; color: #333; }
.warning-message strong { color: #0a3a8c; font-family: monospace; }
.resolve-title { font-style: italic; color: #555; margin: 4px 0; font-size: 11px; }
.warning-hint.danger-text { color: #cc0000; background: #fff0f0; border: 1px solid #ffb0b0; padding: 6px 10px; border-radius: 3px; margin-top: 8px; font-size: 10px; }
.assign-info { font-size: 11px; margin-bottom: 12px; color: #333; }
.selected-count { font-weight: bold; color: #0a3a8c; }
.agent-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.agent-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: white; border: 1px solid #ccc; cursor: pointer; border-radius: 3px; }
.agent-item:hover { background: #e8f0ff; }
.agent-item.selected { background: #cde8f5; border-color: #0a3a8c; }
.self-assign { background: #f0f8ff; border-color: #0a3a8c; }
.agent-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0; }
.agent-info { flex: 1; }
.agent-name { font-size: 11px; font-weight: bold; display: block; color: #000; }
.agent-role { font-size: 9px; color: #666; }
.agent-checkbox { font-size: 20px; color: #aaa; flex-shrink: 0; margin-left: 8px; }
.agent-checkbox.checked { color: #0a3a8c; }
.empty-agents { text-align: center; padding: 20px; color: #888; font-size: 11px; }
.comment-badge.edp { background: #cde8f5; color: #0a3a8c; }
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease;
  max-width: 400px;
}
  .comment-preview {
  font-style: italic;
  color: #555;
  margin: 4px 0;
  font-size: 11px;
  background: #f5f5f5;
  padding: 6px 8px;
  border-radius: 2px;
  border-left: 3px solid #ccc;
  word-break: break-word;
}
.toast-notification.success { background: #008800; }
.toast-notification.error { background: #cc0000; }
.toast-icon { font-size: 16px; }
.toast-message { flex: 1; }
.toast-close { background: none; border: none; color: white; cursor: pointer; font-size: 14px; padding: 2px 6px; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
  `]
})
export class ClientTicketDetailComponent implements OnInit, OnDestroy {
  ticket: any = null;
  safeDescription: SafeHtml = '';
  extractedImages: string[] = [];
  showImageViewer = false;
  currentImageIndex = 0;
  attachments: any[] = [];
  comments: any[] = [];
  showReplyBox = false;
  replyToUser: string | null = null;
  newReply = '';
  apiUrl = environment.apiUrl;
  newComment = '';
  toastMessage: string = '';
toastType: 'success' | 'error' = 'success';
showToast: boolean = false;
editStatus = '';
showAssignModal = false;
availableAgents: any[] = [];
selectedAgentIds: number[] = [];
showAssignSuccess = false;
successAssignedNames: string = '';
showResolveModal = false;
showDeleteModal = false;
showUpdateSuccess = false;
updateSuccessMessage = '';
currentUser: any;
showDeleteCommentModal = false;
deleteCommentData: any = null;
private ticketsSub: any;
private ticketUpdateSub: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private clientTicketService: ClientTicketService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private http: HttpClient,
     private clientNotificationService: ClientNotificationService
  ) {}

 ngOnInit() {
  this.authService.currentUser$.subscribe((user: any) => {
    this.currentUser = user;
  });
  
  const id = Number(this.route.snapshot.paramMap.get('id'));
  if (id) {
    this.loadTicket(id);
    
    // ✅ Subscribe to ALL ticket updates
    this.ticketsSub = this.ticketService.tickets$.subscribe(tickets => {
      if (this.ticket && tickets.length > 0) {
        const updated = tickets.find(t => t.id === this.ticket!.id);
        if (updated) {
          this.ticket = updated;
          this.editStatus = updated.status;
          if (updated.description) {
            this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(updated.description);
          }
        }
      }
    });
    
    // ✅ Subscribe to single ticket updates
    this.ticketUpdateSub = this.ticketService.ticketUpdate$.subscribe((updatedTicket: Ticket) => {
      if (this.ticket && updatedTicket && updatedTicket.id === this.ticket.id) {
        this.ticket = updatedTicket;
        this.editStatus = updatedTicket.status;
        if (updatedTicket.description) {
          this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(updatedTicket.description);
        }
      }
    });
    
    this.pollComments(id);
  }
}

ngOnDestroy(): void {
  if (this.commentPollInterval) {
    clearInterval(this.commentPollInterval);
  }
  // ✅ Clean up subscriptions
  if (this.ticketsSub) {
    this.ticketsSub.unsubscribe();
  }
  if (this.ticketUpdateSub) {
    this.ticketUpdateSub.unsubscribe();
  }
}
private commentPollInterval: any;
private pollComments(ticketId: number): void {
  // Clear any existing interval
  if (this.commentPollInterval) {
    clearInterval(this.commentPollInterval);
  }
  
  // Poll every 15 seconds
  this.commentPollInterval = setInterval(() => {
    if (this.ticket) {
      this.ticketService.getClientComments(ticketId).subscribe({
        next: (comments) => {
          // Only update if comments actually changed
          if (JSON.stringify(comments) !== JSON.stringify(this.comments)) {
            this.comments = comments || [];
          }
        },
        error: () => {}
      });
    }
  }, 15000); // 15 seconds
}

// ─── ROLE CHECKS ───────────────────────────

isEDPUser(): boolean {
  if (!this.currentUser) return false;
  const dept = (this.currentUser.department || this.currentUser.department_name || '').toLowerCase();
  const isEDP = dept === 'edp' || dept === 'it' || dept === 'edp/it' || dept === 'it/edp' ||
                dept.includes('edp') || dept.includes('it');
  return isEDP;
}

isHeadOrSupervisor(): boolean {
  if (!this.currentUser) return false;
  const role = (this.currentUser.role || '').toLowerCase();
  return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
}

isStaffOrTechnician(): boolean {
  if (!this.currentUser) return false;
  const role = (this.currentUser.role || '').toLowerCase();
  return role === 'staff' || role === 'it technician';
}

isAdmin(): boolean {
  return this.currentUser?.role?.toLowerCase() === 'admin';
}

isCreator(): boolean {
  return this.ticket?.created_by === this.currentUser?.id;
}

isAssignedAgent(): boolean {
  if (!this.ticket || !this.currentUser) return false;
  if (this.ticket.assigned_to === this.currentUser.id) return true;
  const assignedUsers = this.ticket.assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers)) {
    return assignedUsers.some((u: any) => {
      if (typeof u === 'object') return u.id === this.currentUser.id;
      return u === this.currentUser.id;
    });
  }
  return false;
}

// ─── PERMISSIONS ───────────────────────────

canChangeStatus(): boolean {
  if (!this.ticket) return false;
  if (this.ticket.status === 'resolved' || this.ticket.status === 'closed') return false;
  if (this.ticket.status === 'new') return false;
  if (this.isAdmin()) return true;
  if (this.isHeadOrSupervisor()) return true;
  if (this.isAssignedAgent()) return true;
  return false;
}

canReassign(): boolean {
  if (!this.ticket) return false;
  if (['resolved', 'closed', 'in_progress', 'pending'].includes(this.ticket.status)) return false;
  
  // Admin can always reassign
  if (this.isAdmin()) return true;
  
  // Head/Manager or Supervisor can reassign
  if (this.isHeadOrSupervisor()) return true;
  
  // Staff/Technician can ONLY assign if ticket is NEW and UNASSIGNED
  if (this.isStaffOrTechnician()) {
    return this.ticket.status === 'new' && !this.ticket.assigned_to;
  }
  
  return false;
}

canDelete(): boolean {
  if (!this.ticket) return false;
  if (this.isAdmin()) return true;
  if (this.isHeadOrSupervisor()) return true;
  if (this.isStaffOrTechnician()) return false;
  if (this.isCreator() && this.ticket.status === 'new') return true;
  return false;
}

// ─── ASSIGN METHODS ───────────────────────────

openAssignModal() {
  if (this.ticket?.assigned_users && Array.isArray(this.ticket.assigned_users) && this.ticket.assigned_users.length > 0) {
    this.selectedAgentIds = this.ticket.assigned_users.map((u: any) => {
      return typeof u === 'object' ? u.id : u;
    });
  } else if (this.ticket?.assigned_to) {
    this.selectedAgentIds = [this.ticket.assigned_to];
  } else {
    this.selectedAgentIds = [];
  }
  this.showAssignModal = true;
  this.loadAvailableAgents();
}

loadAvailableAgents() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
    next: (users) => {
      const edpUsers = users.filter(u => {
        const dept = (u.department || u.department_name || '').toLowerCase();
        return (dept.includes('edp') || dept.includes('it')) && 
               u.branch_id === this.currentUser?.branch_id;
      });
      
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
        next: (newUsers) => {
          const edpNewUsers = newUsers.filter(u => {
            const dept = (u.department || '').toLowerCase();
            return (dept.includes('edp') || dept.includes('it')) && 
                   u.branch_id === this.currentUser?.branch_id;
          });
          this.availableAgents = [...edpUsers, ...edpNewUsers].filter(u => u.id !== this.currentUser?.id);
        },
        error: () => {
          this.availableAgents = edpUsers.filter(u => u.id !== this.currentUser?.id);
        }
      });
    },
    error: () => { this.availableAgents = []; }
  });
}
/**
 * Check if a comment was made by an EDP/IT user
 */
isCommentFromEDP(comment: any): boolean {
  // EDP users are in 'users' table (not 'new_user')
  return comment.user_table === 'users';
}

/**
 * Check if the current user can delete a comment
 */
canDeleteComment(comment: any): boolean {
  if (!this.currentUser) return false;
  
  // ✅ Only the comment author can delete their own comment
  return comment.user_id === this.currentUser?.id && 
         comment.user_table === this.currentUser?.user_table;
}

/**
 * Check if the "Add Comment" button should be shown
 */
canShowAddComment(): boolean {
  if (!this.ticket) return false;
  
  // EDP/IT users can always add comments
  if (this.isEDPUser()) return true;
  
  // Ticket creator can only add comments if there's at least one EDP comment
  if (this.isCreator()) {
    return this.comments.some(c => c.user_table === 'users'); // users table = EDP
  }
  
  return false;
}

toggleAgent(agent: any) {
  if (!agent || !agent.id) return;
  const index = this.selectedAgentIds.indexOf(agent.id);
  if (index === -1) {
    this.selectedAgentIds.push(agent.id);
  } else {
    this.selectedAgentIds.splice(index, 1);
  }
}

isAgentSelected(agent: any): boolean {
  return agent && agent.id ? this.selectedAgentIds.includes(agent.id) : false;
}

confirmAssign() {
  if (this.selectedAgentIds.length === 0 || !this.ticket) return;
  
  const assignedNames: string[] = [];
  const assignedUsersData = this.selectedAgentIds.map(id => {
    if (id === this.currentUser?.id) {
      assignedNames.push(this.currentUser?.fullname);
      return { id: id, fullname: this.currentUser?.fullname };
    }
    const agent = this.availableAgents.find(a => a.id === id);
    const name = agent?.fullname || `Agent #${id}`;
    assignedNames.push(name);
    return { id: id, fullname: name };
  });
  
  const newStatus = this.ticket.status === 'new' ? 'assigned' : this.ticket.status;
  
  this.ticketService.updateTicket(this.ticket.id, {
    assigned_to: this.selectedAgentIds[0],
    assigned_users: assignedUsersData,
    status: newStatus
  }).subscribe({
    next: (updated) => {
      this.ticket = updated;
      this.editStatus = updated.status;
      this.closeAssignModal();
      this.successAssignedNames = assignedNames.join(', ');
      this.showSuccessModal('Ticket assigned successfully!');
      
      // ✅ Notify the TICKET CREATOR
      this.clientNotificationService.handleTicketAssigned(
  updated,
  this.currentUser?.fullname || 'Administrator',
  updated.created_by,
  assignedNames.join(', ')  // ✅ Pass the actual names
);
      
      // ✅ Notify the ASSIGNED AGENTS
      this.clientNotificationService.handleTicketAssignedToAgent(
        updated,
        this.currentUser?.fullname || 'Administrator',
        this.selectedAgentIds  // Target: assigned agents
      );
    },
    error: (err) => {
      alert('Error assigning ticket: ' + (err.error?.message || err.message));
    }
  });
}

closeAssignModal() {
  this.showAssignModal = false;
  this.selectedAgentIds = [];
}

// ─── OTHER ACTIONS ───────────────────────────

onStatusChange() {
  this.updateTicket();
}

updateTicket() {
  if (!this.ticket) return;
  
  const updates: any = { status: this.editStatus };
  
  this.ticketService.updateTicket(this.ticket.id, updates).subscribe({
    next: (updated) => {
      this.ticket = updated;
      this.editStatus = updated.status;
      this.loadComments(this.ticket.id);
      this.showSuccessModal('Ticket updated successfully!');
      
      // ✅ Notify CREATOR only (not the agent who changed it)
      this.clientNotificationService.handleStatusChangeForCreator(
        updated,
        this.editStatus,
        this.currentUser?.fullname || 'Administrator',
        this.currentUser?.id  // The one who changed the status
      );
    },
    error: (err) => {
      alert('Error updating ticket: ' + (err.error?.message || err.message));
    }
  });
}

addComment() {
  if (!this.newComment.trim() || !this.ticket) return;
  
  this.ticketService.addClientComment(
    this.ticket.id, 
    this.newComment, 
    false, 
    this.currentUser?.id, 
    this.currentUser?.user_table || 'users'
  ).subscribe({
    next: () => {
      this.newComment = '';
      if (this.ticket) this.loadComments(this.ticket.id);
      this.showToastNotification('success', 'Comment posted successfully!');
    },
    error: (err) => this.showToastNotification('error', 'Error adding comment: ' + (err.error?.message || err.message))
  });
}

submitReply(): void {
  if (!this.newReply.trim() || !this.ticket) return;
  
  const currentUser = this.authService.getCurrentUser();
  
  this.ticketService.addClientComment(
    this.ticket.id, 
    this.newReply, 
    false, 
    currentUser?.id, 
    currentUser?.user_table || 'new_user'
  ).subscribe({
    next: () => {
      this.newReply = '';
      this.showReplyBox = false;
      this.replyToUser = null;
      if (this.ticket) this.loadComments(this.ticket.id);
      this.showToastNotification('success', 'Reply posted!');
    },
    error: (err) => this.showToastNotification('error', 'Error posting reply')
  });
}

deleteComment(comment: any): void {
  this.deleteCommentData = comment;
  this.showDeleteCommentModal = true;
}

confirmDeleteComment() {
  if (!this.deleteCommentData) return;
  
  this.ticketService.deleteClientComment(this.deleteCommentData.id).subscribe({
    next: () => { 
      this.closeDeleteCommentModal();
      if (this.ticket) this.loadComments(this.ticket.id);
      this.showToastNotification('success', 'Comment deleted.');
    },
    error: () => {
      this.closeDeleteCommentModal();
      this.showToastNotification('error', 'Error deleting comment');
    }
  });
}

closeDeleteCommentModal() {
  this.showDeleteCommentModal = false;
  this.deleteCommentData = null;
}

showToastNotification(type: 'success' | 'error', message: string) {
  this.toastType = type;
  this.toastMessage = message;
  this.showToast = true;
  setTimeout(() => { this.showToast = false; }, 4000);
}

deleteTicket() {
  this.showDeleteModal = true;
}

confirmDelete() {
  if (!this.ticket) return;
  this.ticketService.deleteTicket(this.ticket.id).subscribe({
    next: () => {
      this.closeDeleteModal();
      this.router.navigate(['/client/tickets']);
    },
    error: (err) => alert('Error deleting ticket')
  });
}

closeDeleteModal() {
  this.showDeleteModal = false;
}

showSuccessModal(message: string) {
  this.updateSuccessMessage = message;
  this.showUpdateSuccess = true;
}

closeSuccessModal() {
  this.showUpdateSuccess = false;
}
 getAssignedNames(ticket: any): string {
  if (!ticket) return '—';
  
  const currentUserId = this.currentUser?.id;
  
  // ✅ FIRST: Check assigned_users array
  const assignedUsers = ticket.assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
    const names = assignedUsers.map((u: any) => {
      if (typeof u === 'object' && u.id) {
        const name = u.fullname && u.fullname !== 'null' ? u.fullname : ('User #' + u.id);
        return u.id === currentUserId ? 'You' : name;
      }
      const uid = typeof u === 'object' ? u.id : u;
      return uid === currentUserId ? 'You' : ('User #' + uid);
    });
    return names.join(', ');
  }
  
  // ✅ SECOND: Fallback to assigned_to + agent_name
  if (ticket.assigned_to) {
    if (ticket.assigned_to === currentUserId) return 'You';
    return ticket.agent_name || ('User #' + ticket.assigned_to);
  }
  
  return '—';
}
  startReply(): void {
    this.replyToUser = null;
    this.newReply = '';
    this.showReplyBox = true;
    setTimeout(() => {
      const textarea = document.querySelector('.classic-textarea') as HTMLTextAreaElement;
      if (textarea) textarea.focus();
    }, 100);
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void { event.preventDefault(); }

  loadAttachments(ticketId: number): void {
    this.ticketService.getAttachments(ticketId).subscribe({
      next: (attachments) => { this.attachments = attachments || []; },
      error: () => { this.attachments = []; }
    });
  }
loadTicket(id: number): void {
    // ✅ Use client endpoint for proper assigned_users parsing
    this.clientTicketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        if (ticket.description) {
          this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(ticket.description);
          this.extractImages(ticket.description);
        }
        this.loadAttachments(id);
        this.loadComments(id);
      },
      error: (err) => console.error('Error loading ticket:', err)
    });
}

loadComments(ticketId: number): void {
  this.ticketService.getClientComments(ticketId).subscribe({  // ✅ Use client endpoint
    next: (comments) => { this.comments = comments || []; },
    error: () => { this.comments = []; }
  });
}

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  replyToComment(comment: any): void {
    this.replyToUser = comment.author_name || 'User';
    this.newReply = `@${comment.author_name || 'User'} `;
    this.showReplyBox = true;
    setTimeout(() => {
      const textarea = document.querySelector('.classic-textarea') as HTMLTextAreaElement;
      if (textarea) textarea.focus();
    }, 100);
  }

  canDeleteClientComment(comment: any): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return comment.author_name === currentUser.fullname && 
           currentUser.user_table === 'new_user';
  }

  deleteClientComment(comment: any): void {
    if (confirm('Delete your comment?')) {
      this.ticketService.deleteComment(comment.id).subscribe({
        next: () => { if (this.ticket) this.loadComments(this.ticket.id); },
        error: () => alert('Error deleting comment')
      });
    }
  }

  cancelReply(): void {
    this.showReplyBox = false;
    this.replyToUser = null;
    this.newReply = '';
  }

  openAttachmentViewer(att: any): void {
    if (att.file_type?.startsWith('image/')) {
      this.extractedImages = [this.apiUrl + att.file_path];
      this.currentImageIndex = 0;
      this.showImageViewer = true;
    } else {
      window.open(this.apiUrl + att.file_path, '_blank');
    }
  }

  downloadAttachment(att: any): void {
    const link = document.createElement('a');
    link.href = this.apiUrl + att.file_path;
    link.download = att.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  extractImages(html: string): void {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    this.extractedImages = [];
    while ((match = imgRegex.exec(html)) !== null) {
      this.extractedImages.push(match[1]);
    }
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
      txt: '📄', log: '📋', zip: '📦', rar: '📦'
    };
    return icons[ext ?? ''] ?? '📎';
  }

  openImageViewer(index: number): void { this.currentImageIndex = index; this.showImageViewer = true; }
  closeImageViewer(): void { this.showImageViewer = false; }
  prevImage(): void { if (this.currentImageIndex > 0) this.currentImageIndex--; }
  nextImage(): void { if (this.currentImageIndex < this.extractedImages.length - 1) this.currentImageIndex++; }
  goBack(): void { this.router.navigate(['/client/tickets']); }
}