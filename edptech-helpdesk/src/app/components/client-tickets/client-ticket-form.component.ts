import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ClientNotificationService } from '../../services/client-notification.service';
import { environment } from '../../../environments/environment'; 
@Component({
  selector: 'app-client-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-form-view">

      <!-- Form Header -->
      <div class="view-header">
        <div class="header-left">
          <div class="header-icon">{{ editMode ? '✏️' : '📄' }}</div>
          <div>
            <h2>{{ editMode ? 'Edit Support Ticket' : 'Submit a New Support Ticket' }}</h2>
            <p class="header-sub">{{ editMode ? 'Update your ticket details.' : 'Describe your issue and our IT team will respond promptly.' }}</p>
          </div>
        </div>
        <div class="ticket-ref">
          <span class="ref-label" *ngIf="editMode">Editing Ticket #{{ editTicketId }}</span>
          <span class="ref-label" *ngIf="!editMode">Auto-assigned on submit</span>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="step-bar">
        <div class="step" [class.active]="formStep >= 1" [class.done]="formStep > 1">
          <span class="step-num">1</span><span class="step-label">Issue Details</span>
        </div>
        <div class="step-connector"></div>
        <div class="step" [class.active]="formStep >= 2" [class.done]="formStep > 2">
          <span class="step-num">2</span><span class="step-label">Classification</span>
        </div>
        <div class="step-connector"></div>
        <div class="step" [class.active]="formStep >= 3">
          <span class="step-num">3</span><span class="step-label">Review & Submit</span>
        </div>
      </div>

      <form (ngSubmit)="onSubmit()" class="classic-form" #ticketForm="ngForm">

        <!-- ── Step 1: Issue Details ── -->
        <div class="form-step" *ngIf="formStep === 1">
          <fieldset>
            <legend>Issue Information</legend>

            <div class="form-field">
              <label for="title">Issue Title <span class="req">*</span></label>
              <input
                id="title"
                type="text"
                [(ngModel)]="ticket.title"
                name="title"
                required
                maxlength="120"
                placeholder="e.g. Cannot connect to company VPN"
                class="classic-input"
                [class.input-error]="titleTouched && !ticket.title"
                (blur)="titleTouched = true"
              >
              <span class="char-count">{{ ticket.title.length }}/120</span>
              <div class="field-error" *ngIf="titleTouched && !ticket.title">Title is required.</div>
            </div>

            <div class="form-field">
              <label>Description <span class="req">*</span></label>
              <p class="field-hint">
                Be specific — include error messages, affected software/hardware, and steps to reproduce.
              </p>

              <div class="rich-text-toolbar">
  <button type="button" (click)="formatText('bold')" class="fmt-btn" title="Bold"><strong>B</strong></button>
  <button type="button" (click)="formatText('italic')" class="fmt-btn" title="Italic"><em>I</em></button>
  <button type="button" (click)="formatText('underline')" class="fmt-btn" title="Underline"><u>U</u></button>
  <button type="button" (click)="formatText('strikeThrough')" class="fmt-btn" title="Strikethrough"><s>S</s></button>
  <span class="toolbar-sep"></span>
  <button type="button" (click)="insertUnorderedList()" class="fmt-btn" title="Bullet List">• List</button>
  <button type="button" (click)="insertOrderedList()" class="fmt-btn" title="Numbered List">1. List</button>
  <span class="toolbar-sep"></span>
  <button type="button" (click)="formatText('insertHorizontalRule')" class="fmt-btn" title="Divider Line">— Line</button>
  <button type="button" (click)="insertCodeBlock()" class="fmt-btn" title="Code Block"><> Code</button>
  <span class="toolbar-sep"></span>
  <button type="button" (click)="openDrawingPad()" class="fmt-btn draw-btn" title="Add drawing/sketch">✎ Draw</button>
  <button type="button" (click)="triggerFileUpload()" class="fmt-btn" title="Attach files">📎 Attach</button>
  <input type="file" #fileInput multiple accept="image/*,.pdf,.doc,.docx,.txt,.log" (change)="handleFiles($event)" style="display:none">
</div>

              <div
                #editor
                contenteditable="true"
                class="rich-text-editor"
                (input)="onEditorInput()"
                (blur)="updateDescription(); descTouched = true"
                placeholder="Describe the issue in detail..."
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                [class.drag-over]="isDragOver"
              ></div>
              <div class="field-error" *ngIf="descTouched && !ticket.description">Description is required.</div>

              <div class="file-attachments" *ngIf="files.length > 0">
                <div class="attachment-header">📎 Attachments ({{ files.length }})</div>
                <div class="file-list">
                  <div class="file-item" *ngFor="let file of files; let i = index">
                    <span class="file-type-icon">{{ getFileIcon(file.name) }}</span>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    <button type="button" (click)="removeFile(i)" class="remove-btn" title="Remove">✕</button>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <div class="step-actions">
            <button type="button" class="classic-btn" (click)="cancel()">Cancel</button>
            <button type="button" class="classic-btn primary" (click)="syncDescription(); goToStep(2)"
                    [disabled]="!ticket.title || !ticket.description">
              Next: Classify Issue →
            </button>
          </div>
        </div>

        <!-- ── Step 2: Classification ── -->
        <div class="form-step" *ngIf="formStep === 2">
          <fieldset>
            <legend>Ticket Classification</legend>

            <div class="form-field">
              <label>Priority <span class="req">*</span></label>
              <p class="field-hint">Select the urgency level that best describes the impact.</p>
              <div class="priority-picker">
                <div
                  class="priority-card"
                  *ngFor="let p of priorityOptions"
                  [class.selected]="ticket.priority === p.value"
                  [class]="'priority-card ' + p.value + (ticket.priority === p.value ? ' selected' : '')"
                  (click)="ticket.priority = p.value"
                >
                  <span class="p-icon">{{ p.icon }}</span>
                  <span class="p-label">{{ p.label }}</span>
                  <span class="p-desc">{{ p.desc }}</span>
                </div>
              </div>
            </div>

            <div class="form-row-2col">
              <div class="form-field">
                <label for="location">Location / Computer Name <span class="req">*</span></label>
                <input
                  id="location"
                  type="text"
                  [(ngModel)]="ticket.location"
                  name="location"
                  required
                  placeholder="e.g. 2nd Floor, Room 204, Building A"
                  class="classic-input"
                  [class.input-error]="locationTouched && !ticket.location"
                  (blur)="locationTouched = true"
                >
                <div class="field-error" *ngIf="locationTouched && !ticket.location">Location is required.</div>
              </div>

     <div class="form-field">
  <label for="department">Send To (Department) <span class="req">*</span></label>
  <select 
    id="department" 
    [(ngModel)]="ticket.department_id" 
    name="department_id" 
    class="classic-select"
    [disabled]="departments.length <= 1 && autoFillDepartment && !editMode"
  >
    <option *ngFor="let dept of departments" [value]="dept.id">
      {{ dept.displayName || dept.name }}
    </option>
  </select>
  
  <span class="field-hint" *ngIf="autoFillDepartment && !editMode && departments.length <= 1">
    Auto-assigned based on your branch
  </span>
  
  <span class="field-hint edit-mode-hint" *ngIf="editMode">
    Department cannot be changed for existing tickets
  </span>
</div>
            </div>
          </fieldset>

          <div class="step-actions">
            <button type="button" class="classic-btn" (click)="goToStep(1)">← Back</button>
            <button type="button" class="classic-btn primary" (click)="goToStep(3)">
              Next: Review →
            </button>
          </div>
        </div>

       <!-- ── Step 3: Review ── -->
<div class="form-step" *ngIf="formStep === 3">
  <fieldset>
    <legend>Review Your Ticket</legend>

    <div class="review-grid">
      <div class="review-section">
        <div class="review-label">Issue Title</div>
        <div class="review-value">{{ ticket.title }}</div>
      </div>

      <div class="review-section">
        <div class="review-label">Priority</div>
        <div class="review-value">
          <span class="priority-pill" [class]="ticket.priority">
            {{ getPriorityLabel(ticket.priority) }}
          </span>
        </div>
      </div>

      <div class="review-section">
        <div class="review-label">Location</div>
        <div class="review-value">{{ ticket.location }}</div>
      </div>

      <!-- Send To (Department with Branch) -->
      <div class="review-section">
        <div class="review-label">Send To (Department)</div>
        <div class="review-value">
          <div class="send-to-info">
            <span class="dept-name">{{ getDeptLabel(ticket.department_id) }}</span>
            <span class="branch-tag" *ngIf="getSelectedDeptBranch(ticket.department_id)">
              🏢 {{ getSelectedDeptBranch(ticket.department_id) }}
            </span>
          </div>
        </div>
      </div>

      <div class="review-section full-width">
        <div class="review-label">Description</div>
        <div class="review-desc" [innerHTML]="ticket.description"></div>
      </div>

      <div class="review-section full-width" *ngIf="files.length > 0">
        <div class="review-label">Attachments ({{ files.length }})</div>
        <div class="review-value">{{ fileNamesList }}</div>
      </div>
    </div>

    <div class="sla-notice" [class]="ticket.priority">
      <span class="sla-icon">⏱️</span>
      <span>Expected response: <strong>{{ getSLAText() }}</strong></span>
    </div>
  </fieldset>

  <div class="step-actions">
    <button type="button" class="classic-btn" (click)="goToStep(2)">← Back</button>
    <button type="submit" class="classic-btn primary submit-btn" [disabled]="submitting">
      <span *ngIf="!submitting">✅ Submit Ticket</span>
      <span *ngIf="submitting">⏳ Submitting...</span>
    </button>
  </div>
</div>
      </form>
    </div>

    <!-- Drawing Modal -->
    <div class="modal-overlay" *ngIf="showDrawingPad" (click)="closeDrawingPad()">
      <div class="modal-window" (click)="$event.stopPropagation()">
        <div class="modal-titlebar">
          <span>✎ Drawing Pad — Sketch your issue</span>
          <button type="button" (click)="closeDrawingPad()" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <canvas
            #drawCanvas width="580" height="360"
            class="draw-canvas"
            (mousedown)="startDrawing($event)"
            (mousemove)="draw($event)"
            (mouseup)="stopDrawing()"
            (mouseleave)="stopDrawing()"
          ></canvas>
          <div class="drawing-tools">
            <div class="color-row">
              <button type="button" *ngFor="let c of drawColors"
                (click)="setDrawingColor(c)"
                class="color-swatch"
                [class.active]="currentColor === c"
                [style.background]="c"
                [title]="c"
              ></button>
              <span class="tool-sep"></span>
              <label style="font-size:11px;">Size:</label>
              <input type="range" min="1" max="10" [(ngModel)]="brushSize" (change)="updateBrushSize()" style="width:70px">
              <span style="font-size:11px;width:20px">{{ brushSize }}</span>
            </div>
            <div class="action-row">
              <button type="button" class="drawing-btn" (click)="clearCanvas()">🗑️ Clear</button>
              <button type="button" class="drawing-btn primary" (click)="saveDrawing()">Insert Drawing</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Notification Modal -->
    <div class="modal-overlay" *ngIf="showNotificationModal" (click)="closeNotificationModal()">
      <div class="notification-modal" (click)="$event.stopPropagation()">
        <div class="notification-header" [class]="notificationType">
          <span class="notification-icon">
            <span *ngIf="notificationType === 'success'">✅</span>
            <span *ngIf="notificationType === 'error'">❌</span>
            <span *ngIf="notificationType === 'warning'">⚠️</span>
            <span *ngIf="notificationType === 'info'">ℹ️</span>
          </span>
          <h3>{{ notificationTitle }}</h3>
          <button type="button" (click)="closeNotificationModal()" class="modal-close">✕</button>
        </div>
        <div class="notification-body">
          <p>{{ notificationMessage }}</p>
          <div class="notification-details" *ngIf="notificationDetails">
            <pre>{{ notificationDetails }}</pre>
          </div>
        </div>
        <div class="notification-footer">
          <button class="classic-btn primary" (click)="closeNotificationModal()">OK</button>
          <button *ngIf="notificationType === 'error' && errorDetails" class="classic-btn" (click)="copyErrorDetails()">
            📋 Copy Details
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-form-view { padding: 16px; }

    /* Header */
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #0a246a;
    }
    .header-left { display: flex; align-items: flex-start; gap: 12px; }
    .header-icon { font-size: 28px; line-height: 1; }
    .view-header h2 { margin: 0; font-size: 15px; font-weight: bold; color: #0a246a; }
    .header-sub { margin: 4px 0 0 0; font-size: 11px; color: #555; }
    .ticket-ref { font-size: 10px; color: #888; text-align: right; }
    .ref-label {
      background: #f0f0f0; border: 1px solid #c0c0c0;
      padding: 4px 8px; border-radius: 3px; display: block;
    }

    /* Step Bar */
    .step-bar {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding: 10px 16px;
      background: white;
      border: 1px solid #d0d0d0;
    }
    .step {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: #888;
    }
    .step.active { color: #0a246a; font-weight: bold; }
    .step.done   { color: #008800; }
    .step-num {
      width: 20px; height: 20px;
      border-radius: 50%; background: #d0d0d0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: bold; flex-shrink: 0;
    }
    .step.active .step-num { background: #0a246a; color: white; }
    .step.done   .step-num { background: #008800; color: white; }
    .step-connector { flex: 1; height: 1px; background: #d0d0d0; margin: 0 8px; }

    /* Form */
    .classic-form { background: white; border: 1px solid #b0b0b0; }
    .form-step { padding: 16px 20px 20px; }

    fieldset {
      border: 1px solid #c0c0c0;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    legend {
      padding: 0 10px;
      font-weight: bold; font-size: 11px;
      color: #0a246a; background: white;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .form-field { margin-bottom: 14px; display: flex; flex-direction: column; }
    .form-field label {
      font-size: 11px; font-weight: bold;
      margin-bottom: 4px; color: #222;
    }
    .req { color: #cc0000; }
    .field-hint { font-size: 10px; color: #666; margin: 0 0 6px 0; }
    .char-count { font-size: 10px; color: #888; text-align: right; margin-top: 3px; }
    .field-error { font-size: 10px; color: #cc0000; margin-top: 3px; }

    .form-row-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 0;
    }
     .field-hint {
      font-size: 10px;
      color: #008800;
      margin-top: 4px;
      font-style: italic;
    }
    
    .edit-mode-hint {
      color: #886600;
    }
    
    select:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.8;
    }
    .classic-input, .classic-select {
      padding: 7px 9px;
      border: 1px solid #a0a0a0;
      background: white;
      font-size: 12px;
      font-family: inherit;
      color: #111;
    }
    .classic-input:focus, .classic-select:focus {
      outline: none; border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10,36,106,0.15);
    }
    .classic-input.input-error { border-color: #cc0000; }

    /* Rich Text */
    .rich-text-toolbar {
      border: 1px solid #a0a0a0;
      border-bottom: none;
      padding: 5px 6px;
      background: #f2f2f2;
      display: flex; gap: 3px; flex-wrap: wrap; align-items: center;
    }
    .fmt-btn {
      background: white; border: 1px solid #b0b0b0;
      padding: 3px 8px; cursor: pointer;
      font-size: 11px; font-family: inherit;
      border-radius: 2px;
    }
    .fmt-btn:hover { background: #dde8f5; border-color: #7a9fbf; }
    .toolbar-sep { width: 1px; height: 18px; background: #b0b0b0; margin: 0 3px; }

    .rich-text-editor {
      border: 1px solid #a0a0a0;
      padding: 10px;
      min-height: 160px;
      font-size: 12px; color: #111;
      font-family: 'Segoe UI', sans-serif;
      overflow-y: auto; background: white;
      line-height: 1.6;
    }
    .rich-text-editor:focus { outline: none; border-color: #0a246a; }
    .rich-text-editor:empty:before {
      content: attr(placeholder); color: #aaa; font-style: italic;
    }

    /* Attachments */
    .file-attachments {
      margin-top: 8px; border: 1px solid #d0d0d0;
      padding: 8px 10px; background: #f9f9f9;
    }
    .attachment-header {
      font-size: 10px; font-weight: bold; color: #555; margin-bottom: 6px;
    }
    .file-list { max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; }
    .file-item {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 6px; background: white;
      border: 1px solid #e0e0e0; font-size: 11px;
    }
    .file-type-icon { font-size: 13px; flex-shrink: 0; }
    .file-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(0, 0, 0, 0.99);}
    .file-size { color: #131212; font-size: 10px; flex-shrink: 0; }
    .remove-btn {
      background: none; border: none; cursor: pointer;
      color: #cc0000; padding: 2px 6px; font-weight: bold; flex-shrink: 0;
    }
    .remove-btn:hover { background: #ffecec; }

    /* Priority Picker */
    .priority-picker {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .priority-card {
      border: 2px solid #d0d0d0;
      padding: 10px 8px;
      cursor: pointer;
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      border-radius: 4px; background: #fafafa;
      transition: border-color 0.15s;
    }
    .priority-card:hover { border-color: #a0a0a0; background: #f0f0f0; }
    .priority-card.selected { border-width: 2px; background: white; }
    .priority-card.critical.selected { border-color: #cc0000; background: #fff5f5; }
    .priority-card.high.selected     { border-color: #cc5500; background: #fff8f0; }
    .priority-card.medium.selected   { border-color: #886600; background: #fffcf0; }
    .priority-card.low.selected      { border-color: #006600; background: #f0fff0; }
    .p-icon { font-size: 20px; }
    .p-label { font-size: 11px; font-weight: bold; }
    .p-desc  { font-size: 9px; color: #666; line-height: 1.3; }
    .priority-card.critical .p-label { color: #cc0000; }
    .priority-card.high     .p-label { color: #cc5500; }
    .priority-card.medium   .p-label { color: #886600; }
    .priority-card.low      .p-label { color: #006600; }
    /* Notification Modal Styles */
    .notification-modal {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 450px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .notification-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      color: white;
    }
    
    .notification-header.success { background: #28a745; }
    .notification-header.error { background: #dc3545; }
    .notification-header.warning { background: #ffc107; color: #333; }
    .notification-header.info { background: #17a2b8; }
    
    .notification-icon { font-size: 24px; }
    
    .notification-header h3 {
      margin: 0;
      font-size: 16px;
      flex: 1;
    }
    
    .notification-body {
      padding: 20px;
      font-size: 13px;
      color: #333;
      line-height: 1.5;
    }
    
    .notification-body p {
      margin: 0;
      white-space: pre-wrap;
    }
    
    .notification-details {
      margin-top: 12px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 11px;
      max-height: 200px;
      overflow: auto;
    }
    
    .notification-details pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: monospace;
    }
    
    .notification-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 20px;
      border-top: 1px solid #e0e0e0;
      background: #f9f9f9;
    }
    
    .notification-footer .classic-btn {
      padding: 6px 16px;
      margin: 0;
    }
    /* Review */
    .review-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .review-section {
      padding: 8px 10px;
      background: #f9f9f9;
      border: 1px solid #e8e8e8;
      border-left: 3px solid #0a246a;
    }
    .review-section.full-width { grid-column: 1 / -1; }
    .review-label { font-size: 10px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 4px; }
    .review-value { font-size: 12px; color: #111; }
    .review-desc {
      font-size: 11px; color: #111; line-height: 1.6;
      max-height: 120px; overflow-y: auto;
      padding: 4px 0;
    }
    /* Send To Info */
.send-to-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dept-name {
  font-weight: 600;
  color: #0a246a;
  font-size: 13px;
}

.branch-tag {
  display: inline-block;
  background: #f0f4ff;
  color: #0a3a8c;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid #b8c8e8;
  width: fit-content;
}
  /* Rich text editor content styles */
.rich-text-editor ul {
  margin-left: 20px;
  list-style-type: disc;
}

.rich-text-editor ol {
  margin-left: 20px;
  list-style-type: decimal;
}

.rich-text-editor li {
  margin-bottom: 4px;
}

.rich-text-editor pre {
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 6px 0;
}

.rich-text-editor hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 10px 0;
}
    .priority-pill {
      display: inline-block;
      padding: 2px 8px; border-radius: 3px;
      font-size: 10px; font-weight: bold; text-transform: capitalize;
    }
    .priority-pill.critical { background: #ffecec; color: #cc0000; }
    .priority-pill.high     { background: #fff0e8; color: #cc5500; }
    .priority-pill.medium   { background: #fffae8; color: #886600; }
    .priority-pill.low      { background: #eeffee; color: #006600; }

    .sla-notice {
      display: flex; align-items: center; gap: 8px;
      margin-top: 14px; padding: 10px 14px;
      border-radius: 3px; font-size: 11px;
    }
    .sla-notice.critical { background: #fff0f0; border: 1px solid #ffb0b0; color: #aa0000; }
    .sla-notice.high     { background: #fff8f0; border: 1px solid #ffcc99; color: #884400; }
    .sla-notice.medium   { background: #fffce8; border: 1px solid #eecc66; color: #665500; }
    .sla-notice.low      { background: #f0fff0; border: 1px solid #88cc88; color: #005500; }
    .sla-icon { font-size: 14px; flex-shrink: 0; }

    /* Step Actions */
    .step-actions {
      display: flex; justify-content: space-between;
      padding-top: 16px; margin-top: 4px;
      border-top: 1px solid #e0e0e0;
    }
    .classic-btn {
      background: #f0f0f0; border: 1px solid #a0a0a0;
      border-radius: 3px; padding: 7px 18px;
      cursor: pointer; font-size: 11px; color: #000;
    }
    .classic-btn:hover { background: #dde8f0; }
    .classic-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .classic-btn.primary:hover { background: #1a3a8a; }
    .classic-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .submit-btn { padding: 8px 28px; font-size: 12px; }
    .draw-btn { background: #fff8e8; border-color: #e0c060; }
.rich-text-editor.drag-over {
  border-color: #0a246a;
  border-style: dashed;
  background: #f0f8ff;
  box-shadow: 0 0 0 3px rgba(10,36,106,0.15);
}
.modal-overlay {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-window {
  background: #f0f0f0;
  border: 1px solid #808080;
  box-shadow: 3px 3px 8px rgba(0,0,0,0.3);
  min-width: 620px;
}
.modal-titlebar {
  background: #0a246a; color: white;
  padding: 8px 12px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; font-weight: bold;
}
.modal-close {
  background: none; border: 1px solid rgba(255,255,255,0.4);
  color: white; cursor: pointer; padding: 1px 6px; font-size: 14px;
}
.modal-body { padding: 16px; }
.draw-canvas {
  border: 1px solid #a0a0a0; cursor: crosshair;
  background: white; display: block; margin: 0 auto;
}
.drawing-tools { margin-top: 12px; }
.color-row {
  display: flex; align-items: center; gap: 6px;
  flex-wrap: wrap; margin-bottom: 10px;
}
.color-swatch {
  width: 24px; height: 24px;
  border: 2px solid #a0a0a0; cursor: pointer; border-radius: 3px;
  padding: 0; flex-shrink: 0;
}
.color-swatch.active { border: 2px solid #fff; outline: 2px solid #0a246a; }
.tool-sep { width: 1px; height: 20px; background: #b0b0b0; margin: 0 4px; }
.action-row { display: flex; gap: 10px; justify-content: flex-end; }
.drawing-btn {
  background: #f0f0f0; border: 1px solid #a0a0a0;
  padding: 6px 14px; cursor: pointer; font-size: 11px; border-radius: 2px;
}
  .branch-info {
  color: #0a3a8c;
  font-weight: 500;
  background: #f0f4ff;
  padding: 4px 8px;
  border-radius: 3px;
  display: inline-block;
  margin-top: 4px;
}
.drawing-btn:hover { background: #e0e0e0; }
.drawing-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }  
    @media (max-width: 640px) {
      .priority-picker { grid-template-columns: 1fr 1fr; }
      .form-row-2col { grid-template-columns: 1fr; }
      .review-grid { grid-template-columns: 1fr; }
      .step-bar { display: none; }
    }
  `]
})
export class ClientTicketFormComponent implements AfterViewInit, OnInit {
  @ViewChild('editor') editorRef!: ElementRef;
  @ViewChild('fileInput') fileInputRef!: ElementRef;

  formStep = 1;
  editMode = false;
  editTicketId: number | null = null;
  ticket = {
    title: '',
    description: '',
    priority: 'medium',
    location: '',
    department_id: 1,
    affected_users: 'just_me',
    contact_method: 'email',
  };
  isDragOver = false;
  titleTouched = false;
  descTouched = false;
  locationTouched = false;
  files: File[] = [];
  submitting = false;
  currentUser: any;
  private isUpdating = false;
  private isRestoring = false;
  branches: any[] = [];
  mainBranchIds = [1, 5];
  currentUserBranch: any = null;
  edpItDepartments: any[] = []; 
  showNotificationModal = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationTitle = '';
  notificationMessage = '';
  notificationDetails = '';
  errorDetails: any = null;
  departments: any[] = [];
  autoFillDepartment = true;
  
  readonly priorityOptions = [
    { value: 'critical', label: 'Critical', icon: '🔴', desc: 'System down, full work stoppage' },
    { value: 'high', label: 'High', icon: '🟠', desc: 'Major issue, work blocked' },
    { value: 'medium', label: 'Medium', icon: '🟡', desc: 'Affects productivity, workaround exists' },
    { value: 'low', label: 'Low', icon: '🟢', desc: 'Minor issue or request' }
  ];

  constructor(
    private ticketService: TicketService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private clientNotificationService: ClientNotificationService,
    private http: HttpClient
  ) {}

ngOnInit() {
  this.route.params.subscribe(params => {
    const id = params['id'];
    if (id && this.router.url.includes('/edit')) {
      this.editMode = true;
      this.editTicketId = Number(id);
      this.autoFillDepartment = false;
      this.loadTicketForEdit(this.editTicketId); 
    } else {
      this.loadDepartmentsAndAutoFill();
    }
  });
}

private loadDepartmentsAndAutoFill() {
  const user = this.authService.getCurrentUser();
  if (!user) {
    this.authService.currentUser$.subscribe((u: any) => {
      if (u) this.setupDepartmentOptions(u);
    });
  } else {
    this.setupDepartmentOptions(user);
  }
}
private setupDepartmentOptions(user: any) {
  const branchId = user.branch_id;
  console.log('👤 User branch_id:', branchId);
  
  // First load branches to get branch info
  this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      this.branches = branches || [];
      this.currentUserBranch = this.branches.find(b => b.id == branchId);
      console.log('🏢 User branch:', this.currentUserBranch);
      
      // Now load departments based on branch
      if (branchId && this.mainBranchIds.includes(Number(branchId))) {
        // User is from LSP - Main branch -> only show LSP Main EDP/IT
        this.loadMainBranchEDPIT();
      } else if (branchId) {
        // User is from other branch -> show branch EDP/IT + LSP Main EDP/IT
        this.loadBranchAndMainEDPIT(branchId);
      } else {
        // No branch_id - show all departments
        this.loadAllDepartments();
      }
    },
    error: (err) => {
      console.error('Failed to load branches:', err);
      this.loadAllDepartments();
    }
  });
}
private loadMainBranchEDPIT() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments?branch_id=1`).subscribe({
    next: (depts1) => {
      this.http.get<any[]>(`${environment.apiUrl}/api/public/departments?branch_id=5`).subscribe({
        next: (depts5) => {
          const allDepts = [...(depts1 || []), ...(depts5 || [])];
          
          // Helper function for EDP/IT check
          const isEDPIT = (d: any): boolean => {
            const name = (d.name || '').toLowerCase();
            return name === 'edp' || 
                   name === 'it' ||
                   name === 'edp/it' ||
                   name === 'it/edp' ||
                   name.startsWith('edp') ||
                   name.startsWith('it ') ||
                   name.startsWith('it/') ||
                   name.includes('/it') ||
                   name.includes(' it ') ||
                   name.includes('information technology');
          };
          
          // Filter for EDP/IT only
          this.edpItDepartments = allDepts.filter(d => isEDPIT(d));
          
          // Remove duplicates by ID
          this.edpItDepartments = this.edpItDepartments.filter((d, i, arr) => 
            arr.findIndex(x => x.id === d.id) === i
          );
          
          // Add displayName
          this.edpItDepartments = this.edpItDepartments.map(d => ({
            ...d,
            displayName: `${d.name} (${d.branch_name || this.currentUserBranch?.name || 'Main Branch'})`
          }));
          
          this.departments = this.edpItDepartments;
          
          if (this.edpItDepartments.length >= 1) {
            this.ticket.department_id = this.edpItDepartments[0].id;
            this.autoFillDepartment = true;
          } else {
            this.departments = [];
            this.autoFillDepartment = false;
          }
          
          console.log('✅ Main branch EDP/IT departments:', this.edpItDepartments.length);
        },
        error: () => { this.departments = []; this.autoFillDepartment = false; }
      });
    },
    error: () => { this.departments = []; this.autoFillDepartment = false; }
  });
}
private loadBranchAndMainEDPIT(branchId: number) {
  // Helper function
  const isEDPIT = (d: any): boolean => {
    const name = (d.name || '').toLowerCase();
    return name === 'edp' || name === 'it' || name === 'edp/it' || name === 'it/edp' ||
           name.startsWith('edp') || name.startsWith('it ') || name.startsWith('it/') ||
           name.includes('/it') || name.includes(' it ') || name.includes('information technology');
  };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments?branch_id=${branchId}`).subscribe({
    next: (branchDepts) => {
      this.http.get<any[]>(`${environment.apiUrl}/api/public/departments?branch_id=1`).subscribe({
        next: (mainDepts1) => {
          this.http.get<any[]>(`${environment.apiUrl}/api/public/departments?branch_id=5`).subscribe({
            next: (mainDepts5) => {
              const branchEDPIT = (branchDepts || []).filter(d => isEDPIT(d));
              const mainEDPIT = [...(mainDepts1 || []), ...(mainDepts5 || [])].filter(d => isEDPIT(d));
              const uniqueMainEDPIT = mainEDPIT.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
              
              const taggedBranch = branchEDPIT.map(d => ({
                ...d, displayName: `🏢 ${d.name} (${d.branch_name || this.currentUserBranch?.name || 'Your Branch'})`
              }));
              const taggedMain = uniqueMainEDPIT.map(d => ({
                ...d, displayName: `🏛️ ${d.name} (${d.branch_name || 'LSP Main'})`
              }));
              
              this.departments = [...taggedBranch, ...taggedMain];
              this.departments = this.departments.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
              
              if (this.departments.length > 0) {
                this.ticket.department_id = this.departments[0].id;
              }
            }
          });
        }
      });
    }
  });
}
private loadAllDepartments() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (data) => {
      const allDepts = Array.isArray(data) ? data : [];
      
      this.departments = allDepts.filter(d => {
        const name = (d.name || '').toLowerCase();
        return name === 'edp' || name === 'it' || name === 'edp/it' || name === 'it/edp' ||
               name.startsWith('edp') || name.startsWith('it ') || name.startsWith('it/') ||
               name.includes('/it') || name.includes(' it ') || name.includes('information technology');
      }).map(d => ({
        ...d,
        displayName: `${d.name} (${d.branch_name || 'Unknown Branch'})`
      }));
      
      if (this.departments.length > 0) {
        this.ticket.department_id = this.departments[0].id;
      }
    }
  });
}
loadDepartments() {
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (data) => {
      const allDepts = Array.isArray(data) ? data : [];
      
      this.departments = allDepts.filter(d => {
        const name = (d.name || '').toLowerCase();
        return name === 'edp' || name === 'it' || name === 'edp/it' || name === 'it/edp' ||
               name.startsWith('edp') || name.startsWith('it ') || name.startsWith('it/') ||
               name.includes('/it') || name.includes(' it ') || name.includes('information technology');
      }).map(d => ({
        ...d,
        displayName: `${d.name} (${d.branch_name || 'Unknown Branch'})`
      }));
    }
  });
}

  autoFillUserDepartment() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.performAutoFill(user);
    } else {
      const sub = this.authService.currentUser$.subscribe((u: any) => {
        if (u) {
          this.performAutoFill(u);
          sub.unsubscribe();
        }
      });
    }
  }

  private performAutoFill(user: any) {
    console.log('👤 Current user for auto-fill:', user);
    console.log('📋 Available departments:', this.departments.map(d => ({ id: d.id, name: d.name })));
    
    if (user.department_id) {
      const deptExists = this.departments.some(d => d.id === user.department_id);
      if (deptExists) {
        this.ticket.department_id = user.department_id;
        this.autoFillDepartment = true;
        console.log('✅ Auto-filled by department_id:', user.department_id);
        return;
      }
    }
    
    if (user.department) {
      const matchedDept = this.findDepartmentByName(user.department);
      if (matchedDept) {
        this.ticket.department_id = matchedDept.id;
        this.autoFillDepartment = true;
        console.log('✅ Auto-filled by department name:', user.department, '-> ID:', matchedDept.id);
        return;
      }
    }
    
    if (user.department_name) {
      const matchedDept = this.findDepartmentByName(user.department_name);
      if (matchedDept) {
        this.ticket.department_id = matchedDept.id;
        this.autoFillDepartment = true;
        console.log('✅ Auto-filled by department_name:', user.department_name, '-> ID:', matchedDept.id);
        return;
      }
    }
    
    console.warn('⚠️ Could not auto-fill department. User department:', user.department || user.department_name || 'not set');
    this.autoFillDepartment = false;
  }

  private findDepartmentByName(name: string): any | null {
    if (!name || this.departments.length === 0) return null;
    const searchName = name.toLowerCase().trim();
    let match = this.departments.find(d => d.name.toLowerCase() === searchName);
    if (!match) {
      match = this.departments.find(d => 
        d.name.toLowerCase().includes(searchName) || searchName.includes(d.name.toLowerCase())
      );
    }
    return match || null;
  }

  getUserDepartmentName(): string {
    const dept = this.departments.find(d => d.id === this.ticket.department_id);
    return dept?.name || 'Not selected';
  }

  getDeptLabel(id: number | string): string {
    const dept = this.departments.find(d => d.id == id);
    return dept?.name || '—';
  }

  showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, details?: any) {
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.notificationDetails = details || '';
    this.errorDetails = details || null;
    this.showNotificationModal = true;
  }

  closeNotificationModal() {
    this.showNotificationModal = false;
    this.notificationDetails = '';
    this.errorDetails = null;
  }

  copyErrorDetails() {
    if (this.errorDetails) {
      const errorText = typeof this.errorDetails === 'string' 
        ? this.errorDetails 
        : JSON.stringify(this.errorDetails, null, 2);
      navigator.clipboard.writeText(errorText);
      this.showNotification('success', 'Copied!', 'Error details copied to clipboard');
    }
  }
  // Get the branch info for the selected department
getSelectedDeptBranch(deptId: number | string): string {
  const dept = this.departments.find(d => d.id == deptId);
  if (!dept) return '';
  
  // Return branch_name from API response or from displayName
  if (dept.branch_name) {
    return dept.branch_name + (dept.company_name ? ` (${dept.company_name})` : '');
  }
  
  // Extract branch from displayName if available
  if (dept.displayName) {
    const match = dept.displayName.match(/\(([^)]+)\)/);
    if (match) return match[1];
  }
  
  return '';
}
 loadTicketForEdit(id: number) {
  this.ticketService.getTicket(id).subscribe({
    next: (ticket: any) => {
      if (ticket.status !== 'new') {
        this.showNotification('error', 'Cannot Edit', 
          `This ticket can no longer be edited. It has been ${ticket.status}.`);
        this.router.navigate(['/client/tickets']);
        return;
      }
      this.ticket.title = ticket.title;
      this.ticket.description = ticket.description;
      this.ticket.priority = ticket.priority;
      this.ticket.location = ticket.location || '';
      this.ticket.department_id = ticket.department_id;
      
      // ✅ Load departments based on user's branch, NOT all departments
      this.loadDepartmentsAndAutoFill();
      
      setTimeout(() => {
        if (this.editorRef) {
          this.editorRef.nativeElement.innerHTML = ticket.description;
        }
      }, 100);
    },
    error: (err) => {
      console.error('Error loading ticket:', err);
      this.showNotification('error', 'Load Failed', 'Could not load ticket for editing.');
      this.router.navigate(['/client/tickets']);
    }
  });
}

  ngAfterViewInit() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
    if (this.editorRef && this.ticket.description) {
      this.isRestoring = true;
      this.editorRef.nativeElement.innerHTML = this.ticket.description;
      setTimeout(() => { this.isRestoring = false; }, 100);
    }
  }

  @ViewChild('drawCanvas') canvasRef!: ElementRef;
  showDrawingPad = false;
  private drawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  currentColor = '#000000';
  brushSize = 2;
  readonly drawColors = ['#000000','#cc0000','#0044cc','#008800','#cc6600','#9900cc','#ffffff'];

  openDrawingPad() { this.showDrawingPad = true; setTimeout(() => { this.initCanvas(); }, 100); }
  closeDrawingPad() { this.showDrawingPad = false; this.drawing = false; }
  
  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';
    }
  }

  startDrawing(event: MouseEvent) { this.drawing = true; const rect = (event.target as HTMLCanvasElement).getBoundingClientRect(); this.ctx?.beginPath(); this.ctx?.moveTo(event.clientX - rect.left, event.clientY - rect.top); }
  draw(event: MouseEvent) { if (!this.drawing || !this.ctx) return; const rect = (event.target as HTMLCanvasElement).getBoundingClientRect(); this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top); this.ctx.stroke(); }
  stopDrawing() { this.drawing = false; }
  setDrawingColor(color: string) { this.currentColor = color; if (this.ctx) this.ctx.strokeStyle = color; }
  updateBrushSize() { if (this.ctx) this.ctx.lineWidth = this.brushSize; }
  clearCanvas() { if (this.ctx && this.canvasRef) { const c = this.canvasRef.nativeElement; this.ctx.clearRect(0, 0, c.width, c.height); } }
  saveDrawing() { if (!this.canvasRef) return; const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png'); const imgHtml = `<img src="${dataUrl}" alt="Sketch" style="max-width:100%;border:1px solid #ccc;margin:6px 0;display:block;">`; this.editorRef.nativeElement.focus(); document.execCommand('insertHTML', false, imgHtml); this.onEditorInput(); this.saveDescription(); this.closeDrawingPad(); }

  onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragOver = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragOver = false; }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    this.processFiles(files);
  }

  processFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      this.files.push(file);
      
      if (file.type.startsWith('image/')) {
        this.compressImage(file, (compressedDataUrl: string) => {
          this.editorRef.nativeElement.focus();
          const imgHtml = `<img src="${compressedDataUrl}" alt="${file.name}" style="max-width:300px;max-height:300px;border:1px solid #ccc;margin:6px 0;display:block;">`;
          document.execCommand('insertHTML', false, imgHtml);
          document.execCommand('insertHTML', false, '<br>');
          this.onEditorInput();
          this.saveDescription();
        });
      } else {
        this.editorRef.nativeElement.focus();
        const fileIcon = this.getFileIcon(file.name);
        const fileRef = `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f5f5f5;border:1px solid #ddd;margin:4px 0;border-radius:3px;font-size:11px;">
          <span style="font-size:16px;">${fileIcon}</span>
          <span style="flex:1;font-weight:500;">${file.name}</span>
          <span style="color:#888;font-size:10px;">${this.formatFileSize(file.size)}</span>
        </div>`;
        document.execCommand('insertHTML', false, fileRef);
        this.onEditorInput();
        this.saveDescription();
      }
    }
  }

  compressImage(file: File, callback: (dataUrl: string) => void) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 300, maxHeight = 300;
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
        if (height > maxHeight) { width = (maxHeight / height) * width; height = maxHeight; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.4));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  goToStep(step: number) {
    if (this.formStep === 1) { this.saveDescription(); }
    if (step === 2 && (!this.ticket.title || !this.ticket.description)) {
      this.titleTouched = true; this.descTouched = true; return;
    }
    this.formStep = step;
    if (step === 1) {
      setTimeout(() => {
        if (this.editorRef && this.ticket.description) {
          this.editorRef.nativeElement.innerHTML = this.ticket.description;
        }
      }, 100);
    }
  }

  saveDescription() { if (this.editorRef && !this.isRestoring) { this.ticket.description = this.editorRef.nativeElement.innerHTML; } }
  syncDescription() { this.saveDescription(); }
  onEditorInput() { if (!this.isUpdating && !this.isRestoring && this.editorRef) { this.isUpdating = true; this.ticket.description = this.editorRef.nativeElement.innerHTML; this.isUpdating = false; } }
  updateDescription() { this.saveDescription(); }
  formatText(command: string) {
  this.editorRef.nativeElement.focus();
  document.execCommand(command, false);
  this.saveDescription();
}
  insertUnorderedList() {
  this.editorRef.nativeElement.focus();
  // Use insertHTML for better cross-browser support
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const ul = document.createElement('ul');
    ul.style.marginLeft = '20px';
    ul.style.listStyleType = 'disc';
    const li = document.createElement('li');
    li.textContent = selection.toString() || 'List item';
    ul.appendChild(li);
    range.deleteContents();
    range.insertNode(ul);
    // Place cursor inside the li
    const newRange = document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } else {
    // Fallback
    document.execCommand('insertUnorderedList', false);
  }
  this.saveDescription();
  this.editorRef.nativeElement.focus();
}
insertOrderedList() {
  this.editorRef.nativeElement.focus();
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const ol = document.createElement('ol');
    ol.style.marginLeft = '20px';
    const li = document.createElement('li');
    li.textContent = selection.toString() || 'List item';
    ol.appendChild(li);
    range.deleteContents();
    range.insertNode(ol);
    const newRange = document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } else {
    document.execCommand('insertOrderedList', false);
  }
  this.saveDescription();
  this.editorRef.nativeElement.focus();
}
insertCodeBlock() {
  this.editorRef.nativeElement.focus();
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const pre = document.createElement('pre');
    pre.style.background = '#f5f5f5';
    pre.style.border = '1px solid #ddd';
    pre.style.padding = '8px';
    pre.style.borderRadius = '3px';
    pre.style.fontFamily = 'monospace';
    pre.style.fontSize = '11px';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordBreak = 'break-all';
    pre.textContent = selection.toString() || '// code here';
    range.deleteContents();
    range.insertNode(pre);
  }
  this.saveDescription();
  this.editorRef.nativeElement.focus();
}
  triggerFileUpload() { this.fileInputRef.nativeElement.click(); }
  handleFiles(event: any) { const files = event.target.files; if (!files?.length) return; this.processFiles(files); event.target.value = ''; }
  removeFile(index: number) { this.files.splice(index, 1); }
  getFileIcon(name: string): string { const ext = name.split('.').pop()?.toLowerCase(); const map: Record<string, string> = { pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', txt: '📄', log: '📋', zip: '📦', rar: '📦' }; return map[ext ?? ''] ?? '📎'; }
  formatFileSize(bytes: number): string { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]; }
  getPriorityLabel(val: string): string { return this.priorityOptions.find(p => p.value === val)?.label ?? val; }
 getSLAText(): string { 
    const map: Record<string, string> = { 
        critical: 'Within 10 seconds', 
        high: 'Within 20 seconds', 
        medium: 'Within 40 seconds', 
        low: 'Within 90 seconds (2 minutes)' 
    }; 
    return map[this.ticket.priority] ?? 'Within 60 seconds'; 
}
  get fileNamesList(): string { return this.files.map(f => f.name).join(', '); }

  onSubmit() {
    if (!this.ticket.title || !this.ticket.description) { this.titleTouched = true; this.descTouched = true; return; }
    if (!this.ticket.location) { this.locationTouched = true; this.showNotification('warning', 'Location Required', 'Please enter your location.'); return; }
    
    this.submitting = true;
    this.saveDescription();
    
    const ticketData = {
      title: this.ticket.title,
      description: this.ticket.description,
      priority: this.ticket.priority,
      location: this.ticket.location,
      department_id: this.ticket.department_id,
      created_by: this.currentUser?.id || null,
      created_by_name: this.currentUser?.fullname || 'Unknown'
    };

    if (this.editMode && this.editTicketId) {
      this.ticketService.updateTicket(this.editTicketId, ticketData).subscribe({
        next: () => {
          if (this.files.length > 0) { this.uploadFiles(this.editTicketId!); }
          else { this.showNotification('success', 'Ticket Updated', 'Your ticket has been updated successfully!'); setTimeout(() => this.router.navigate(['/client/tickets']), 1500); this.submitting = false; }
        },
        error: (error) => { this.showNotification('error', 'Update Failed', 'Error updating ticket.', error); this.submitting = false; }
      });
    } else {
     this.ticketService.createTicket(ticketData).subscribe({
    next: (newTicket) => {
      this.notificationService.handleNewTicket(newTicket);
      
      // ✅ Notify branch EDP/IT staff about new ticket
      this.clientNotificationService.handleNewTicketForBranch(newTicket, this.currentUser?.branch_id);
        
        // ✅ Navigate back to list immediately - the list will auto-refresh
        this.showNotification('success', 'Ticket Submitted', 'Your ticket has been submitted!');
        setTimeout(() => this.router.navigate(['/client/tickets']), 500);
        this.submitting = false;
        
        // Upload files if any
        if (this.files.length > 0 && newTicket?.id) { 
          this.uploadFiles(newTicket.id); 
        }
      },
      error: (error) => { 
        this.showNotification('error', 'Submission Failed', 'Error submitting ticket.', error); 
        this.submitting = false; 
      }
    });
  }
}

  uploadFiles(ticketId: number) {
    if (!ticketId) { this.showNotification('warning', 'Attachment Issue', 'Ticket created but attachments could not be uploaded.'); this.router.navigate(['/client/tickets']); this.submitting = false; return; }
    
    let uploaded = 0, hasError = false;
    const total = this.files.length;
    
    this.files.forEach(file => {
      this.ticketService.uploadAttachment(ticketId, file, this.currentUser?.id).subscribe({
        next: () => {
          uploaded++;
          if (uploaded === total && !hasError) { this.showNotification('success', 'Complete', `Ticket submitted with ${total} attachment(s)!`); setTimeout(() => this.router.navigate(['/client/tickets']), 1500); this.submitting = false; }
        },
        error: () => {
          hasError = true; uploaded++;
          if (uploaded === total) { this.showNotification('warning', 'Partial Success', 'Ticket created but some attachments failed.'); setTimeout(() => this.router.navigate(['/client/tickets']), 1500); this.submitting = false; }
        }
      });
    });
  }

  cancel() { this.router.navigate(['/client/tickets']); }
}