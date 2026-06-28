import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, Ticket } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification.service';
import { ClientNotificationService } from '../../../services/client-notification.service';
@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-detail-view" *ngIf="ticket">
      
      <!-- Header -->
      <div class="retro-header">
        <h2>Ticket Code:{{ ticket.ticket_number }}</h2>
        <div class="badge-group">
          <span class="priority-badge" [class]="'priority-' + ticket.priority">{{ ticket.priority | uppercase }}</span>
          <span class="status-badge" [class]="'status-' + ticket.status">{{ ticket.status | titlecase }}</span>
      <button class="retro-btn" (click)="goBack()" title="Close">❌️</button>
          </div>
      </div>

      <div class="detail-layout">
        
        <!-- LEFT: Main Info -->
        <div class="main-panel">
          
          <!-- Ticket Info -->
          <div class="detail-card">
            <h3 class="ticket-title">{{ ticket.title }}</h3>
            
            <<div class="info-grid">
  <div class="info-item">
    <span class="info-label">Created By</span>
    <span class="info-value">{{ ticket.created_by_name || ticket.creator_name || 'Unknown' }}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Creator's Department</span>
    <span class="info-value">{{ ticket.creator_department || '—' }}</span>
  </div>
  <div class="info-item">
    <span class="info-label">Creator's Branch</span>
    <span class="info-value">
      <span *ngIf="ticket.creator_branch_name">🏢 {{ ticket.creator_branch_name }}</span>
      <span *ngIf="ticket.creator_company_name"> ({{ ticket.creator_company_name }})</span>
      <span *ngIf="!ticket.creator_branch_name">—</span>
    </span>
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
</div>
          </div>

          <!-- Description -->
          <div class="detail-card">
            <h4 class="section-title">📝 Description</h4>
            <div class="description-content" [innerHTML]="safeDescription"></div>
          </div>

        <!-- Attachments Gallery -->
<div class="detail-card" *ngIf="attachments.length > 0">
  <h4 class="section-title">📎 Attachments ({{ attachments.length }})</h4>
  
  <!-- Image Gallery -->
  <div class="image-gallery" *ngIf="imageAttachments.length > 0">
    <div class="image-thumb" *ngFor="let img of imageAttachments; let i = index" (click)="openImageViewer(i)">
      <img [src]="apiUrl + img.file_path" [alt]="img.original_name">
      <span class="image-label">{{ img.original_name }}</span>
    </div>
  </div>

  <!-- Document/File List -->
  <div class="file-list" *ngIf="docAttachments.length > 0">
    <div class="file-row" *ngFor="let doc of docAttachments">
      <span class="file-icon">{{ getFileIcon(doc.original_name) }}</span>
      <span class="file-name">{{ doc.original_name }}</span>
      <span class="file-size">{{ formatFileSize(doc.file_size) }}</span>
      <a [href]="apiUrl + doc.file_path" target="_blank" class="file-download" title="Download">⬇️</a>
    </div>
  </div>
</div>

<!-- Image Viewer Modal -->
<div class="viewer-overlay" *ngIf="showImageViewer" (click)="closeImageViewer()">
  <div class="viewer-content" (click)="$event.stopPropagation()">
    <button class="viewer-close" (click)="closeImageViewer()">✕</button>
    <button class="viewer-nav prev" (click)="prevImage()" *ngIf="imageAttachments.length > 1">◀</button>
    <img [src]="apiUrl + imageAttachments[currentImageIndex]?.file_path" alt="Full image">
    <button class="viewer-nav next" (click)="nextImage()" *ngIf="imageAttachments.length > 1">▶</button>
    <div class="viewer-info">
      <span>{{ imageAttachments[currentImageIndex]?.original_name }}</span>
      <span class="viewer-counter">{{ currentImageIndex + 1 }} / {{ imageAttachments.length }}</span>
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
</div>
</div>
      <!-- RIGHT: Actions Panel -->
<div class="actions-panel">
  <div class="detail-card">
    <h4 class="section-title">⚙️ Update Ticket</h4>
    
   <!-- Status -->
<div class="form-field">
  <label>Status</label>
  
  <!-- Read only when resolved/closed OR when user cannot change status -->
  <div class="status-display" *ngIf="ticket?.status === 'resolved' || ticket?.status === 'closed' || !canChangeStatus()">
    <span class="status-badge" [class]="'status-' + ticket.status">
      {{ ticket.status | titlecase }}
    </span>
  </div>
  
  <!-- Editable for assigned user or admin -->
  <select class="classic-select" 
          *ngIf="canChangeStatus()" 
          [(ngModel)]="editStatus" (change)="onStatusChange()">
    <option [value]="ticket.status" disabled selected>{{ ticket.status | titlecase }} (current)</option>
    <option value="in_progress">In Progress</option>
    <option value="pending">Pending</option>
    <option value="resolved">Resolved</option>
  </select>
</div>

   <!-- Assigned To -->
<div class="form-field">
  <label>Assigned To</label>
  <div class="assign-display">
    <span *ngIf="ticket.assigned_to || (ticket.assigned_users && ticket.assigned_users.length > 0)">
      👥 {{ getAssignedNames(ticket) }}
    </span>
    <span *ngIf="!ticket.assigned_to && (!ticket.assigned_users || ticket.assigned_users.length === 0)" style="color:#888;">— Unassigned —</span>
    <button class="retro-btn" (click)="openAssignModal()" 
            *ngIf="canReassign()"
            [disabled]="ticket?.status === 'resolved' || ticket?.status === 'closed'"
            style="margin-left:auto;font-size:9px;">Change</button>
  </div>
  <div class="field-hint" *ngIf="ticket?.status === 'resolved' || ticket?.status === 'closed'" style="font-size:9px;color:#888;margin-top:4px;">
    Ticket is {{ ticket.status }} — cannot reassign
  </div>
</div>

    <!-- Add Comment -->
    <div class="form-field">
      <label>Add Comment</label>
      <textarea class="classic-textarea" rows="3" [(ngModel)]="newComment" 
                placeholder="Type your comment here..."
                [disabled]="ticket?.status === 'closed'"></textarea>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button class="retro-btn" (click)="addComment()" 
              [disabled]="!newComment.trim() || ticket?.status === 'closed'">💬 Post Comment</button>
      
      <!-- Delete - Only if user is creator AND ticket is new (unassigned) -->
      <button *ngIf="canDelete()"
              class="retro-btn danger" (click)="deleteTicket()">🗑️ Delete</button>
    </div>
  </div>
</div>
      <!-- Assign Ticket Modal -->
<div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar">
      <span>👤 Assign Ticket: {{ ticket?.ticket_number }}</span>
      <button type="button" (click)="closeAssignModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p class="assign-info">
        Select one or more agents to handle this ticket:
        <span class="selected-count" *ngIf="selectedAgentIds.length > 0">
          ({{ selectedAgentIds.length }} selected)
        </span>
      </p>
      
      <div class="agent-list">
        <!-- Assign to Me -->
        <div 
          class="agent-item self-assign" 
          [class.selected]="isAgentSelected(currentUser)"
          (click)="toggleAgent(currentUser)">
          <span class="agent-avatar" [style.background]="currentUser?.avatar_color || '#0a3a8c'">
            <img *ngIf="currentUser?.photo_url" [src]="apiUrl + currentUser.photo_url" alt="Photo" class="agent-photo">
            <span *ngIf="!currentUser?.photo_url">{{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '👤' }}</span>
          </span>
          <div class="agent-info">
            <span class="agent-name">Assign to Me</span>
            <span class="agent-role">{{ currentUser?.fullname }} ({{ currentUser?.role | titlecase }})</span>
            <span class="agent-status" [class]="getAgentStatus(currentUser)?.class">
              {{ getAgentStatus(currentUser)?.label }}
            </span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(currentUser)">
            {{ isAgentSelected(currentUser) ? '☑' : '☐' }}
          </span>
        </div>
        
        <!-- Other Agents -->
        <div 
          class="agent-item" 
          *ngFor="let agent of availableAgents" 
          [class.selected]="isAgentSelected(agent)"
          [class.agent-unavailable]="isAgentUnavailable(agent)"
          (click)="toggleAgent(agent)">
          <span class="agent-avatar" [style.background]="agent.avatar_color || '#3b82f6'">
            <img *ngIf="agent.photo_url" [src]="apiUrl + agent.photo_url" alt="Photo" class="agent-photo">
            <span *ngIf="!agent.photo_url">{{ agent.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
          </span>
          <div class="agent-info">
            <span class="agent-name">{{ agent.fullname }}</span>
            <span class="agent-role">{{ agent.role | titlecase }}</span>
            <span class="agent-status" [class]="getAgentStatus(agent)?.class">
              {{ getAgentStatus(agent)?.label }}
            </span>
          </div>
          <span class="agent-checkbox" [class.checked]="isAgentSelected(agent)">
            {{ isAgentSelected(agent) ? '☑' : '☐' }}
          </span>
          <span class="agent-warning" *ngIf="isAgentUnavailable(agent)" title="Agent is currently unavailable">⚠️</span>
        </div>
      </div>
      
      <div class="empty-agents" *ngIf="availableAgents.length === 0">
        <p>No other agents available.</p>
      </div>

      <div class="selected-summary" *ngIf="selectedAgentIds.length > 0">
        <span class="summary-label">Selected agents:</span>
        <span class="summary-count">{{ selectedAgentIds.length }} agent(s)</span>
      </div>

      <div class="modal-actions">
        <button class="retro-btn" (click)="closeAssignModal()">Cancel</button>
        <button class="retro-btn primary" (click)="confirmAssign()" [disabled]="selectedAgentIds.length === 0">
          ✅ Assign Ticket
        </button>
      </div>
      <div class="assign-warning" *ngIf="hasUnavailableSelected()">
        ⚠️ Some selected agents are currently unavailable. They may not respond immediately.
      </div>
    </div>
  </div>
</div>
<!-- Resolve Ticket Modal -->
<div class="modal-overlay" *ngIf="showResolveModal" (click)="closeResolveModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar resolve">
      <span>✅ Resolve Ticket</span>
      <button type="button" (click)="closeResolveModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">✅</span>
        <div class="warning-message">
          <h3>Mark ticket as resolved?</h3>
          <p>Ticket: <strong>#{{ ticket?.ticket_number }}</strong></p>
          <p class="resolve-title">"{{ ticket?.title }}"</p>
          <p class="warning-hint success">This will close the ticket and mark it as resolved.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeResolveModal()">Cancel</button>
        <button class="retro-btn primary" (click)="confirmResolve()">✅ Yes, Resolve</button>
      </div>
    </div>
  </div>
</div>

<!-- Delete Ticket Modal -->
<div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar danger">
      <span>🗑️ Delete Ticket</span>
      <button type="button" (click)="closeDeleteModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Delete this ticket permanently?</h3>
          <p>Ticket: <strong>#{{ ticket?.ticket_number }}</strong></p>
          <p class="resolve-title">"{{ ticket?.title }}"</p>
          <p class="warning-hint danger-text">This action cannot be undone. All data will be permanently removed.</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn" (click)="closeDeleteModal()">Cancel</button>
        <button class="retro-btn danger" (click)="confirmDelete()">🗑️ Yes, Delete</button>
      </div>
    </div>
  </div>
</div>
<!-- Success Modal -->
<div class="modal-overlay" *ngIf="showUpdateSuccess" (click)="closeSuccessModal()">
  <div class="modal-window" (click)="$event.stopPropagation()">
    <div class="modal-titlebar success">
      <span>✅ Success</span>
      <button type="button" (click)="closeSuccessModal()" class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon"></span>
        <div class="warning-message">
          <h3>{{ updateSuccessMessage }}</h3>
        </div>
      </div>
      <div class="modal-actions">
        <button class="retro-btn primary" (click)="closeSuccessModal()">OK</button>
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
          <p class="comment-preview">"{{ deleteCommentData?.comment | slice:0:100 }}{{ (deleteCommentData?.comment?.length || 0) > 100 ? '...' : '' }}"</p>
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
    :host { display: block; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    
    .ticket-detail-view { padding: 8px; background: #d4d0c8; min-height: 100%; }

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
      background: #c7c2c2; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px; padding: 3px 12px;
      color: rgb(0, 0, 0);
      cursor: pointer; font-size: 10px; color: #000;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .retro-btn:hover { background: #e8f0ff; }
    .retro-btn:active { border-color: #808080 #fff #fff #808080; }
    .retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .retro-btn.danger { background: #cc0000; color: #fff; border-color: #ff4444 #880000 #880000 #ff4444; }
    .retro-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .badge-group { display: flex; gap: 8px; }

    .detail-layout { display: grid; grid-template-columns: 1fr 300px; gap: 8px; }

    .detail-card {
      background: #fff; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 10px 12px; margin-bottom: 8px;
    }

    .section-title {
      font-size: 10px; font-weight: bold; color: #0a3a8c;
      margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd;
    }

    .ticket-title { margin: 0 0 10px 0; font-size: 14px; color: #000; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 9px; font-weight: bold; color: #666; text-transform: uppercase; }
    .info-value { font-size: 11px; color: #000; }

    .description-content {
      font-size: 11px; line-height: 1.5; padding: 8px;
      background: #f9f9f9; border: 1px solid #ddd;
      color: rgb(0, 0, 0);
      max-height: 200px; overflow-y: auto;
    }
    .description-content img { max-width: 100%; height: auto; }

    .attachments-grid { display: flex; flex-direction: column; gap: 4px; }
    .attachment-item { display: flex; gap: 8px; padding: 4px; background: #f9f9f9; border: 1px solid #ddd; }
    .att-preview { width: 50px; height: 50px; overflow: hidden; cursor: pointer; border: 1px solid #ccc; flex-shrink: 0; }
    .att-preview img { width: 100%; height: 100%; object-fit: cover; }
    .att-info { display: flex; align-items: center; gap: 6px; flex: 1; font-size: 10px; }
    .att-icon { font-size: 16px; }
    .att-name { color: #0066cc; text-decoration: none; }
    .att-name:hover { text-decoration: underline; }
    .att-size { color: #888; font-size: 9px; }

    .comments-list { max-height: 250px; overflow-y: auto; }
    .comment-item { padding: 6px 8px; border-bottom: 1px solid #eee; color: rgb(0, 0, 0);}
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .comment-author { font-weight: bold; font-size: 10px; }
    .comment-date { font-size: 9px; color: #000000; }
    .comment-text { font-size: 11px; line-height: 1.4; }
    .empty-state { text-align: center; padding: 16px; color: #888; }

    .form-field { margin-bottom: 10px; }
    .form-field label { display: block; font-size: 10px; font-weight: bold; margin-bottom: 4px; color: rgb(0, 0, 0);}
    .classic-select, .classic-textarea { width: 100%; padding: 5px 7px; border: 1px solid #808080; font-size: 11px; font-family: inherit; box-sizing: border-box; }
    .classic-textarea { resize: vertical; min-height: 60px; }
    .form-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }

    .viewer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .viewer-content { position: relative; }
    .viewer-content img { max-width: 85vw; max-height: 80vh; object-fit: contain; }
    .viewer-close { position: absolute; top: -28px; right: 0; background: none; border: 1px solid #fff; color: #fff; font-size: 16px; cursor: pointer; padding: 2px 8px; }
    /* Image Gallery */
.image-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.image-thumb {
  width: 120px;
  height: 100px;
  border: 1px solid #ddd;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
}

.image-thumb img {
  width: 100%;
  height: 75px;
  object-fit: cover;
  flex-shrink: 0;
}

.image-thumb:hover {
  border-color: #0a3a8c;
  box-shadow: 0 0 5px rgba(10,58,140,0.3);
}

.image-label {
  font-size: 8px;
  padding: 2px 4px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  background: #fff;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* File List */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  font-size: 10px;
}

.file-row:hover {
  background: #e8f0ff;
}

.file-icon { font-size: 18px; flex-shrink: 0; }

.file-name {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #888;
  font-size: 9px;
  flex-shrink: 0;
}

.file-download {
  color: #0066cc;
  text-decoration: none;
  font-size: 14px;
  flex-shrink: 0;
  padding: 2px 6px;
}

.file-download:hover {
  background: #e0e0e0;
  border-radius: 2px;
}

/* Viewer Navigation */
.viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 10px 15px;
}

.viewer-nav.prev { left: -50px; }
.viewer-nav.next { right: -50px; }
.viewer-nav:hover { background: rgba(255,255,255,0.3); }

.viewer-info {
  display: flex;
  justify-content: space-between;
  color: #fff;
  margin-top: 8px;
  font-size: 11px;
}
.assign-display {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 7px; border: 1px solid #808080; background: #f9f9f9;
  font-size: 11px;
  color: rgb(0, 0, 0);
}

.modal-overlay {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}

.modal-window {
  background: #f0f0f0;
  border: 2px solid #808080;
  box-shadow: 3px 3px 8px rgba(0,0,0,0.4);
  min-width: 400px;
  max-width: 500px;
}

.modal-titlebar {
  background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%);
  color: white;
  padding: 6px 10px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; font-weight: bold;
}

.modal-close {
  background: none; border: 1px solid rgba(255,255,255,0.4);
  color: white; cursor: pointer; padding: 1px 6px; font-size: 14px;
}

.modal-body { padding: 16px; }

.assign-info { font-size: 11px; margin-bottom: 12px; color: #333; }

.agent-list {
  max-height: 250px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 14px;
}

.agent-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; background: white;
  border: 1px solid #ccc; cursor: pointer;
}

.agent-item:hover { background: #e8f0ff; }
.agent-item.selected { background: #cde8f5; border-color: #0a3a8c; }

.self-assign { background: #f0f8ff; border-color: #0a3a8c; }

.agent-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 14px; flex-shrink: 0;
}

.agent-info { flex: 1; }
.agent-name { font-size: 11px; font-weight: bold; display: block; color: rgb(5, 5, 5);}
.agent-role { font-size: 9px; color: #000000; }

.agent-check { color: #008800; font-weight: bold; font-size: 16px; }

.agent-divider {
  padding: 8px 0 4px 0; text-align: center;
  font-size: 9px; font-weight: bold; color: #888;
  text-transform: uppercase; border-top: 1px solid #ddd; margin-top: 4px;
}

.agent-divider span { background: #f0f0f0; padding: 0 8px; }

.empty-agents { text-align: center; padding: 20px; color: #888; font-size: 11px; }
.agent-photo {
  width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
}

.agent-status {
  font-size: 8px; padding: 1px 5px; border-radius: 2px; font-weight: bold;
  display: inline-block; margin-top: 2px;
}

.status-available { background: #ccffcc; color: #008800; }
.status-dayoff { background: #ffe0e0; color: #cc0000; }
.status-onleave { background: #ffe0cc; color: #cc6600; }
.status-lunch { background: #fffae8; color: #886600; }

.agent-unavailable { opacity: 0.6; }

.agent-warning { color: #cc6600; font-size: 14px; flex-shrink: 0; }

.assign-warning {
  background: #fffae8; border: 1px solid #e0c060;
  padding: 6px 10px; margin-top: 8px; font-size: 10px; color: #886600;
  border-radius: 3px;
}
.modal-titlebar.resolve {
  background: linear-gradient(180deg, #008800 0%, #006600 100%);
}

.modal-titlebar.danger {
  background: linear-gradient(180deg, #cc0000 0%, #880000 100%);
}

.warning-hint.success {
  color: #006600;
  background: #eeffee;
  border: 1px solid #88cc88;
}

.warning-hint.danger-text {
  color: #cc0000;
  background: #fff0f0;
  border: 1px solid #ffb0b0;
}

.resolve-title {
  font-style: italic;
  color: #555;
  margin: 4px 0;
  font-size: 11px;
}

.resolve-btn {
  background: #eeffee;
  color: #008800;
  border-color: #88cc88 #006600 #006600 #88cc88;
}

.resolve-btn:hover {
  background: #ccffcc;
}

.retro-btn.danger {
  background: #cc0000;
  color: #fff;
  border-color: #ff4444 #880000 #880000 #ff4444;
}

.retro-btn.danger:hover {
  background: #aa0000;
}
  .status-display {
  padding: 8px 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  text-align: center;
}

.field-hint {
  font-size: 9px;
  color: #888;
  margin-top: 4px;
}
  .modal-titlebar.success {
  background: linear-gradient(180deg, #008800 0%, #006600 100%) color: rgba(0, 0, 0, 0.4);;
}
  .warning-message{ color: rgba(2, 2, 2, 0.99);}
  .comment-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 12px; flex-shrink: 0;
  overflow: hidden;
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
}
.comment-photo { width: 100%; height: 100%; object-fit: cover; }
.comment-item { display: flex; gap: 10px; padding: 8px; border-bottom: 1px solid #eee; }
.comment-content { flex: 1; }
.comment-actions { display: flex; gap: 8px; margin-top: 4px; }
.comment-action-btn {
  background: none; border: none; cursor: pointer; font-size: 9px; color: #666; padding: 2px 4px;
}
  .agent-checkbox {
  font-size: 20px;
  color: #aaa;
  flex-shrink: 0;
  margin-left: 8px;
}

.agent-checkbox.checked {
  color: #0a3a8c;
}

.selected-count {
  font-weight: bold;
  color: #0a3a8c;
}

.selected-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #e8f0ff;
  border: 1px solid #0a3a8c;
  border-radius: 3px;
  margin-bottom: 12px;
  font-size: 10px;
}

.summary-label { color: #666; }
.summary-count { font-weight: bold; color: #0a3a8c; }
.comment-action-btn:hover { color: #0a3a8c; text-decoration: underline; }
.comment-action-btn.delete:hover { color: #cc0000; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .priority-badge, .status-badge { padding: 2px 8px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .priority-critical { background: #cc0000; color: white; }
    .priority-high { background: #ff6600; color: white; }
    .priority-medium { background: #ffcc00; color: #333; }
    .priority-low { background: #008800; color: white; }
    .status-new { background: #cde8f5; color: #0066cc; }
    .status-assigned { background: #e0e0e0; color: #666; }
    .status-in_progress { background: #fff0cc; color: #cc6600; }
    .status-pending { background: #ffe0cc; color: #cc6600; }
    .status-resolved { background: #ccffcc; color: #008800; }
    .status-closed { background: #f0f0f0; color: #666; }
  `]
})
export class TicketDetailComponent implements OnInit {
  ticket: any = null;
  comments: any[] = [];
  attachments: any[] = [];
  imageAttachments: any[] = [];    // ← ADD THIS
  docAttachments: any[] = [];
  currentImageIndex = 0;
  apiUrl = environment.apiUrl;
  newComment = '';
  editStatus = '';
  editAssignedTo: any = '';
  safeDescription: SafeHtml = '';
  showImageViewer = false;
  viewerImage: any = null;
  currentUser: any;
  showAssignModal = false;
  availableAgents: any[] = [];
  selectedAgentIds: number[] = []; 
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private notificationService: NotificationService,
     private clientNotificationService: ClientNotificationService
  ) {}

  ngOnInit() {
  this.authService.currentUser$.subscribe(user => {
    this.currentUser = user;
  });
  
  const id = Number(this.route.snapshot.paramMap.get('id'));
  if (id) {
    this.loadTicket(id);
    
    // Subscribe to real-time updates for this ticket
    this.ticketService.tickets$.subscribe(tickets => {
      if (this.ticket) {
        const updated = tickets.find(t => t.id === this.ticket.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(this.ticket)) {
          this.ticket = updated;
          this.editStatus = updated.status;
        }
      }
    });
  }
}
openAssignModal() {
    // Pre-select all currently assigned users
    if (this.ticket?.assigned_users && Array.isArray(this.ticket.assigned_users) && this.ticket.assigned_users.length > 0) {
        // ✅ Extract IDs from objects or use plain numbers
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

private getHeaders(): any {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
}
loadAvailableAgents() {
  const currentUserId = this.currentUser?.id;
  const headers = this.getHeaders();  // Add headers
  
  // Load from both tables
  this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
    next: (users) => {
      // Load new_user table too
      this.http.get<any[]>(`${environment.apiUrl}/api/new-users`, { headers }).subscribe({
        next: (newUsers) => {
          // Combine both user tables
          const allUsers = [...users, ...newUsers];
          
          // Filter: show all users EXCEPT current user
          this.availableAgents = allUsers.filter(u => 
            u.id !== currentUserId  // Just exclude self, show everyone else
          );
          console.log('Available agents:', this.availableAgents.length, this.availableAgents);
        },
        error: () => {
          // Fallback: just show users table
          this.availableAgents = users.filter(u => u.id !== currentUserId);
        }
      });
    },
    error: (err) => {
      console.error('Error loading agents:', err);
      this.availableAgents = [];
    }
  });
}
isEDPUser(): boolean {
  return this.currentUser?.user_table === 'users';
}
private agentNameCache: Map<number, string> = new Map();
canChangeStatus(): boolean {
  if (!this.ticket) return false;
  
  // ❌ Cannot change if resolved or closed
  if (this.ticket.status === 'resolved' || this.ticket.status === 'closed') return false;
  
  // ❌ Cannot change if new (must be assigned first)
  if (this.ticket.status === 'new') return false;
  
  // ✅ Admin can always change (for assigned, in_progress, pending)
  if (this.isAdmin()) return true;
  
  // ✅ Assigned agent can change
  if (this.isAssignedAgent()) return true;
  
  return false;
}
getAssignedNames(ticket: any): string {
    if (!ticket) return '—';
    
    // Check for multiple assigned users first
    if (ticket.assigned_users && Array.isArray(ticket.assigned_users) && ticket.assigned_users.length > 0) {
        const names = ticket.assigned_users.map((user: any) => {
            if (typeof user === 'number') {
                if (user === this.currentUser?.id) return 'You';
                return `Agent #${user}`;
            }
            if (user.id === this.currentUser?.id) return 'You';
            return user.fullname || `Agent #${user.id}`;
        });
        return names.join(', ');
    }
    
    // Fallback to single assigned agent
    if (ticket.assigned_to) {
        if (ticket.assigned_to === this.currentUser?.id) return 'You';
        return ticket.agent_name || `Agent #${ticket.assigned_to}`;
    }
    
    return '—';
}
private fetchAgentName(userId: number) {
    if (this.agentNameCache.has(userId)) return;
    
    const headers = this.getHeaders();
    
    // Try users table first
    this.http.get<any>(`${environment.apiUrl}/api/users/${userId}`, { headers }).subscribe({
        next: (user) => {
            if (user?.fullname) {
                this.agentNameCache.set(userId, user.fullname);
            }
        },
        error: () => {
            // Try new_user table
            this.http.get<any>(`${environment.apiUrl}/api/new-users/${userId}`, { headers }).subscribe({
                next: (user) => {
                    if (user?.fullname) {
                        this.agentNameCache.set(userId, user.fullname);
                    }
                },
                error: () => {
                    this.agentNameCache.set(userId, `Agent #${userId}`);
                }
            });
        }
    });
}
// Check if current user is admin
isAdmin(): boolean {
  return this.currentUser?.role === 'admin';
}
isAssignedAgent(): boolean {
  if (!this.ticket || !this.currentUser) return false;
  
  // Check single assigned_to
  if (this.ticket.assigned_to === this.currentUser.id) return true;
  
  // Check multi-assign assigned_users array
  const assignedUsers = this.ticket.assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers)) {
    return assignedUsers.some((u: any) => {
      if (typeof u === 'object') return u.id === this.currentUser.id;
      return u === this.currentUser.id;
    });
  }
  
  return false;
}
canReassign(): boolean {
  if (!this.ticket) return false;
  
  // ❌ Cannot reassign resolved, closed, in_progress, or pending tickets
  if (['resolved', 'closed', 'in_progress', 'pending'].includes(this.ticket.status)) {
    return false;
  }
  
  // ✅ Admin can reassign only if status is 'new' or 'assigned'
  if (this.isAdmin() && ['new', 'assigned'].includes(this.ticket.status)) {
    return true;
  }
  
  // ✅ Any EDP user can assign if unassigned and new
  if (!this.ticket.assigned_to && this.ticket.status === 'new' && this.isEDPUser()) {
    return true;
  }
  
  return false;
}

// Can delete: Only if user is creator AND ticket is new/unassigned
canDelete(): boolean {
  if (!this.ticket) return false;
  if (this.ticket.status === 'resolved' || this.ticket.status === 'closed') return false;
  
  // Only creator can delete
  if (!this.isCreator()) return false;
  
  // Only if ticket is new (not yet assigned)
  if (this.ticket.status !== 'new') return false;
  
  // Only if ticket is not assigned to anyone
  if (this.ticket.assigned_to) return false;
  
  return true;
}
// Check if current user is the ticket creator
isCreator(): boolean {
  return this.ticket?.created_by === this.currentUser?.id;
}

confirmAssign() {
    if (this.selectedAgentIds.length === 0 || !this.ticket) return;
    
    const newStatus = this.ticket.status === 'new' ? 'assigned' : this.ticket.status;
    
    const assignedUsersData = this.selectedAgentIds.map(id => {
        if (id === this.currentUser?.id) {
            return { id: id, fullname: this.currentUser?.fullname };
        }
        const agent = this.availableAgents.find(a => a.id === id);
        return { id: id, fullname: agent?.fullname || `Agent #${id}` };
    });
    
    const allNames = assignedUsersData.map((u: any) => u.fullname).join(', ');
    const assignedByName = this.currentUser?.fullname || 'Administrator';
    
    this.ticketService.updateTicket(this.ticket.id, { 
        assigned_to: this.selectedAgentIds[0],
        assigned_users: assignedUsersData,
        status: newStatus
    }).subscribe({
        next: (updated) => {
            this.ticket = updated;
            this.editStatus = updated.status;
            
            if (!this.currentUser?.fullname) {
                this.showErrorModal('User session expired. Please refresh.');
                return;
            }
            
            // ✅ Notify ticket creator
            this.clientNotificationService.handleTicketAssigned(
                updated,
                this.currentUser.fullname,
                updated.created_by,
                allNames
            );
            
            // ✅ Notify assigned agents
            this.clientNotificationService.handleTicketAssignedToAgent(
                updated,
                this.currentUser.fullname,
                this.selectedAgentIds
            );
            
            this.closeAssignModal();
            this.showSuccessModal('Ticket assigned successfully!');
        },
        error: (err) => alert('Error assigning ticket: ' + err.message)
    });
}

// Get agent status for display
getAgentStatus(agent: any): { label: string; class: string } | null {
  if (!agent) return null;
  
  // Check if on leave
  if (this.isOnLeave(agent)) {
    return { label: 'On Leave', class: 'status-onleave' };
  }
  
  // Check if day off today
  if (this.isDayOff(agent)) {
    return { label: 'Day Off', class: 'status-dayoff' };
  }
  
  // Check if lunch break
  if (this.isLunchBreak(agent)) {
    return { label: 'Lunch Break', class: 'status-lunch' };
  }
  
  // Available
  return { label: 'Available', class: 'status-available' };
}
// Add these properties to the class:
showResolveModal = false;
showDeleteModal = false;

confirmDelete() {
  if (!this.ticket) return;
  this.ticketService.deleteTicket(this.ticket.id).subscribe({
    next: () => {
      this.closeDeleteModal();
      this.router.navigate(['/tickets']);
    },
    error: (err) => alert('Error deleting ticket')
  });
}

closeDeleteModal() {
  this.showDeleteModal = false;
}

// Add resolve methods:
resolveTicket() {
  this.showResolveModal = true;
}
confirmResolve() {
    if (!this.ticket) return;
    
    const adminName = this.currentUser?.fullname;
    if (!adminName) {
        this.showErrorModal('User session expired. Please refresh.');
        return;
    }
    
    this.ticketService.updateTicket(this.ticket.id, { 
        status: 'resolved',
        resolved_at: new Date().toISOString()
    }).subscribe({
        next: (updated) => {
            this.ticket = updated;
            this.editStatus = 'resolved';
            
            // ✅ Notify other admin users
            this.notificationService.handleStatusChange(
                updated,
                'resolved',
                adminName
            );
            
            // ✅ Notify the ticket creator (client)
            this.clientNotificationService.handleStatusChange(
                updated,
                'resolved',
                adminName,
                updated.created_by
            );
            
            this.closeResolveModal();
        },
        error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
}
closeResolveModal() {
  this.showResolveModal = false;
}

// Check if agent is on leave
isOnLeave(agent: any): boolean {
  if (!agent || !agent.leaveEntries) return false;
  
  try {
    const leaves = typeof agent.leaveEntries === 'string' ? JSON.parse(agent.leaveEntries) : agent.leaveEntries;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return leaves.some((l: any) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return today >= start && today <= end;
    });
  } catch(e) {
    return false;
  }
}

// Check if today is agent's day off
isDayOff(agent: any): boolean {
  if (!agent || !agent.dayOff) return false;
  
  try {
    const dayOffArr = typeof agent.dayOff === 'string' ? JSON.parse(agent.dayOff) : agent.dayOff;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
    return dayOffArr.includes(todayName);
  } catch(e) {
    return false;
  }
}

// Check if agent is on lunch break
isLunchBreak(agent: any): boolean {
  if (!agent || !agent.lunchStart || !agent.lunchEnd) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = agent.lunchStart.split(':').map(Number);
  const [endH, endM] = agent.lunchEnd.split(':').map(Number);
  
  const lunchStart = startH * 60 + startM;
  const lunchEnd = endH * 60 + endM;
  
  return currentTime >= lunchStart && currentTime <= lunchEnd;
}

// Check if agent is unavailable
isAgentUnavailable(agent: any): boolean {
  return this.isOnLeave(agent) || this.isDayOff(agent) || this.isLunchBreak(agent);
}

// Check if selected agent is unavailable
isAgentSelected(agent: any): boolean {
    return agent && agent.id ? this.selectedAgentIds.includes(agent.id) : false;
}
hasUnavailableSelected(): boolean {
    return this.selectedAgentIds.some(id => {
        if (id === this.currentUser?.id) {
            return this.isAgentUnavailable(this.currentUser);
        }
        const agent = this.availableAgents.find(a => a.id === id);
        return agent ? this.isAgentUnavailable(agent) : false;
    });
}
// Select agent (allow even if unavailable, but show warning)
toggleAgent(agent: any) {
    if (!agent || !agent.id) return;
    const index = this.selectedAgentIds.indexOf(agent.id);
    if (index === -1) {
        this.selectedAgentIds.push(agent.id);
    } else {
        this.selectedAgentIds.splice(index, 1);
    }
}

closeAssignModal() {
    this.showAssignModal = false;
    this.selectedAgentIds = [];
}

  extractedImages: string[] = [];
extractedFiles: string[] = [];

loadTicket(id: number) {
    this.ticketService.getTicket(id).subscribe(ticket => {
        this.ticket = ticket;
        this.editStatus = ticket.status;
        this.editAssignedTo = ticket.assigned_to || '';
        
        // Pre-load agent names for all assigned users
        const assignedUsers = (ticket as any).assigned_users;
        if (assignedUsers && Array.isArray(assignedUsers)) {
            assignedUsers.forEach((user: any) => {
                // ✅ Extract ID from object or use plain number
                const userId = typeof user === 'object' ? user.id : user;
                this.fetchAgentName(userId);
            });
        }
        
        if (ticket.description) {
            this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(ticket.description);
            this.extractImages(ticket.description);
            this.extractFiles(ticket.description);
        }
        this.loadComments(id);
        this.loadAttachments(id);
    });
}

extractImages(html: string) {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  this.extractedImages = [];
  while ((match = imgRegex.exec(html)) !== null) {
    this.extractedImages.push(match[1]);
  }
}

extractFiles(html: string) {
  const fileRegex = /📎\s+([^<]+(?:\.\w+)?)\s*\([^)]*\)/g;
  let match;
  this.extractedFiles = [];
  while ((match = fileRegex.exec(html)) !== null) {
    this.extractedFiles.push(match[1].trim());
  }
}

  loadComments(ticketId: number) {
  this.ticketService.getComments(ticketId).subscribe({
    next: (comments) => {
      console.log('💬 Comments loaded:', comments.length);
      this.comments = comments; // Replace entire array
    },
    error: () => this.comments = []
  });
}

  loadAttachments(ticketId: number) {
    this.ticketService.getAttachments(ticketId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.imageAttachments = attachments.filter((a: any) => 
          a.file_type?.startsWith('image/')
        );
        this.docAttachments = attachments.filter((a: any) => 
          !a.file_type?.startsWith('image/')
        );
      },
      error: () => {
        this.attachments = [];
        this.imageAttachments = [];
        this.docAttachments = [];
      }
    });
  }
canDeleteComment(comment: any): boolean {
  // Creator of the ticket can delete, admin can delete, or the comment author can delete
  return this.isCreator() || this.isAdmin() || comment.user_id === this.currentUser?.id;
}

showDeleteCommentModal = false;
deleteCommentData: any = null;

deleteComment(comment: any) {
  this.deleteCommentData = comment;
  this.showDeleteCommentModal = true;
}

confirmDeleteComment() {
  if (!this.deleteCommentData) return;
  
  this.ticketService.deleteComment(this.deleteCommentData.id).subscribe({
    next: () => {
      this.closeDeleteCommentModal();
      this.loadComments(this.ticket.id);
    },
    error: () => {
      this.closeDeleteCommentModal();
      alert('Error deleting comment');
    }
  });
}

closeDeleteCommentModal() {
  this.showDeleteCommentModal = false;
  this.deleteCommentData = null;
}
replyToComment(comment: any) {
  this.newComment = `@${comment.author_name} `;
  // Focus the textarea
  setTimeout(() => {
    const textarea = document.querySelector('.classic-textarea') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  }, 100);
}
  openImageViewer(index: number) {
    this.currentImageIndex = index;
    this.showImageViewer = true;
  }

  closeImageViewer() {
    this.showImageViewer = false;
  }

  prevImage() {
    if (this.currentImageIndex > 0) this.currentImageIndex--;
  }

  nextImage() {
    if (this.currentImageIndex < this.imageAttachments.length - 1) this.currentImageIndex++;
  }

  onStatusChange() {
  // Auto-update immediately when status changes
  this.updateTicket();
}

showUpdateSuccess = false;
updateSuccessMessage = '';
updateTicket() {
    if (!this.ticket) return;
    
    const adminName = this.currentUser?.fullname;
    if (!adminName) {
        this.showErrorModal('User session expired. Please refresh.');
        return;
    }
    
    const oldStatus = this.ticket.status;
    const updates: any = { status: this.editStatus };
    
    this.ticketService.updateTicket(this.ticket.id, updates).subscribe({
        next: (updated) => {
            this.ticket = updated;
            this.editStatus = updated.status;
            this.loadComments(this.ticket.id);
            
            if (this.editStatus !== oldStatus) {
                // ✅ Notify other admin users
                this.notificationService.handleStatusChange(
                    updated,
                    this.editStatus,
                    adminName
                );
                
                // ✅ Notify the ticket creator (client)
                this.clientNotificationService.handleStatusChange(
                    updated,
                    this.editStatus,
                    adminName,
                    updated.created_by
                );
            }
            
            this.showSuccessModal('Ticket updated successfully!');
        },
        error: (err) => {
            this.showErrorModal('Error updating ticket: ' + (err.error?.message || err.message));
        }
    });
}
showSuccessModal(message: string) {
  this.updateSuccessMessage = message;
  this.showUpdateSuccess = true;
}

closeSuccessModal() {
  this.showUpdateSuccess = false;
}

showErrorModal(message: string) {
  alert(message); // Or use a proper error modal
}

addComment() {
  if (!this.newComment.trim() || !this.ticket) return;
  
  const ticketId = this.ticket.id;
  const userId = this.currentUser?.id;
  const userTable = this.currentUser?.user_table || 'users';
  
  this.ticketService.addComment(ticketId, this.newComment, false, userId, userTable).subscribe({
    next: () => {
      this.newComment = '';
      if (this.ticket) this.loadComments(this.ticket.id);
    },
    error: () => alert('Error adding comment')
  });
}
 deleteTicket() {
  this.showDeleteModal = true;
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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  goBack() {
    this.router.navigate(['/tickets']);
  }
}