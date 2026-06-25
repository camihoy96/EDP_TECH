import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-client-job-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="jo-container">
      
      <!-- Header -->
      <div class="jo-header">
        <div class="header-left">
<h1>{{ approvalMode ? '✅ Received Job Order' : editMode ? '✏️ Edit Job Order' : '📋 Job Order Form' }}</h1>
<span class="header-sub">{{ approvalMode ? 'Fill in received by details and signature' : editMode ? 'Update your job order request' : 'Submit a job order request' }}</span>        </div>
        <button class="print-btn" (click)="printForm()">🖨️ Print</button>
      </div>

      <!-- Job Order Form -->
      <div class="jo-form" id="print-section">
        
        <!-- Header Section -->
        <div class="jo-form-header">
          <div class="company-logo">
            <h2>{{ companyName }}</h2>
            <p class="company-sub">Job Order Request Form</p>
          </div>
          <div class="form-title">
            <h3>JOB ORDER FORM</h3>
          </div>
        </div>

        <!-- Top Info Row -->
        <div class="jo-top-row">
          <div class="top-left">
            <div class="field-row">
              <label>Date:</label>
              <input type="date" [(ngModel)]="joData.date" class="jo-input">
            </div>
            <div class="field-row">
              <label>Company:</label>
              <input type="text" [(ngModel)]="joData.company" class="jo-input" placeholder="Company name">
            </div>
          </div>
          <div class="top-right">
            <div class="field-row">
              <label>CRTL #:</label>
              <input type="text" [(ngModel)]="joData.crtk_no" class="jo-input" placeholder="CRTL number">
            </div>
            <div class="field-row">
              <label>Date Needed:</label>
              <input type="date" [(ngModel)]="joData.date_needed" class="jo-input">
            </div>
            <div class="field-row">
              <label>Dept:</label>
              <input type="text" [(ngModel)]="joData.department" class="jo-input" placeholder="Department">
            </div>
          </div>
        </div>

        <!-- Charge/Expense Checkboxes -->
        <div class="jo-checkboxes">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="joData.is_charge"> Charge
          </label>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="joData.is_expense"> Expense
          </label>
        </div>

        <!-- Job Request Section -->
        <div class="jo-section">
          <div class="section-header">
            <h4>Job Request:</h4>
            <select [(ngModel)]="joData.request_dept" class="jo-select">
              <option value="">— Select Department —</option>
              <option *ngFor="let dept of departments" [value]="dept.name">{{ dept.name }}</option>
            </select>
          </div>
        </div>

        <!-- Particulars -->
        <div class="jo-section">
          <label class="section-label">Particulars / Description:</label>
          <textarea 
            [(ngModel)]="joData.particulars" 
            class="jo-textarea" 
            rows="6"
            placeholder="Describe the job order details here..."></textarea>
        </div>

        <!-- Job Order For -->
        <div class="jo-section">
          <label class="section-label">Job Order For:</label>
          <input type="text" [(ngModel)]="joData.job_order_for" class="jo-input-full" placeholder="Name / Department">
        </div>
<!-- Signatures Section -->
<div class="jo-signatures">

  <!-- Requested By -->
  <div class="sig-block" [class.readonly]="approvalMode">
    <h5>Requested By:</h5>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="joData.requested_date" class="jo-input">
    </div>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="joData.requested_name" class="jo-input" placeholder="Your name">
    </div>
    <div class="sig-options">
      <button type="button" class="sig-option-btn" [class.active]="sigMode['requested'] === 'draw'" (click)="setSigMode('requested', 'draw')">✍️ Draw</button>
      <button type="button" class="sig-option-btn" [class.active]="sigMode['requested'] === 'upload'" (click)="setSigMode('requested', 'upload')">📁 Upload</button>
    </div>
    
    <!-- Draw Mode -->
    <div class="sig-canvas-wrap" *ngIf="sigMode['requested'] === 'draw'">
      <canvas id="reqCanvas" width="200" height="80" class="sig-canvas"
              (mousedown)="startSigDraw($event, 'requested')"
              (mousemove)="drawSig($event, 'requested')"
              (mouseup)="stopSigDraw()"
              (mouseleave)="stopSigDraw()"
              (touchstart)="startSigDraw($event, 'requested')"
              (touchmove)="drawSig($event, 'requested')"
              (touchend)="stopSigDraw()"></canvas>
      <div class="sig-canvas-actions">
        <button type="button" class="sig-sm-btn" (click)="clearSigCanvas('requested')">🗑️ Clear</button>
        <button type="button" class="sig-sm-btn save" (click)="saveSigCanvas('requested')">✅ Save</button>
      </div>
    </div>
    
    <!-- Upload Mode -->
    <div class="sig-upload" *ngIf="sigMode['requested'] === 'upload'"
         [class.has-file]="requestedSignature"
         [class.drag-over]="dragOverTarget === 'requested'"
         (dragover)="onSigDragOver($event, 'requested')"
         (dragleave)="onSigDragLeave($event)"
         (drop)="onSigDrop($event, 'requested')">
      <div class="sig-preview" *ngIf="requestedSignature; else noReqSig">
        <img [src]="requestedSignature" alt="Signature" class="sig-image">
        <button type="button" class="sig-clear" (click)="clearSignature('requested')">✕</button>
      </div>
      <ng-template #noReqSig>
        <div class="sig-placeholder" (click)="triggerSigUpload('sigRequested')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" #sigRequested hidden accept="image/*" (change)="handleSigFile($event, 'requested')">
        </div>
      </ng-template>
    </div>
    
    <!-- Saved Signature Preview -->
    <!-- Show saved signature preview (whenever there's a signature) -->
<div class="sig-saved-preview" *ngIf="requestedSignature && sigSaved['requested']">
  <img [src]="requestedSignature" alt="Signature" class="sig-image-small">
  <span class="sig-saved-label">✓ Signature</span>
  <button type="button" class="sig-clear" (click)="clearSignature('requested')">✕</button>
</div>
  </div>

  <!-- Approved By -->
  <div class="sig-block" [class.readonly]="approvalMode">
    <h5>Approved By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="joData.approved_name" class="jo-input" placeholder="Approver name">
    </div>
    <div class="sig-options">
      <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'draw'" (click)="setSigMode('approved', 'draw')">✍️ Draw</button>
      <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'upload'" (click)="setSigMode('approved', 'upload')">📁 Upload</button>
    </div>
    
    <!-- Draw Mode -->
    <div class="sig-canvas-wrap" *ngIf="sigMode['approved'] === 'draw'">
      <canvas id="appCanvas" width="200" height="80" class="sig-canvas"
              (mousedown)="startSigDraw($event, 'approved')"
              (mousemove)="drawSig($event, 'approved')"
              (mouseup)="stopSigDraw()"
              (mouseleave)="stopSigDraw()"
              (touchstart)="startSigDraw($event, 'approved')"
              (touchmove)="drawSig($event, 'approved')"
              (touchend)="stopSigDraw()"></canvas>
      <div class="sig-canvas-actions">
        <button type="button" class="sig-sm-btn" (click)="clearSigCanvas('approved')">🗑️ Clear</button>
        <button type="button" class="sig-sm-btn save" (click)="saveSigCanvas('approved')">✅ Save</button>
      </div>
    </div>
    
    <!-- Upload Mode -->
    <div class="sig-upload" *ngIf="sigMode['approved'] === 'upload'"
         [class.has-file]="approvedSignature"
         [class.drag-over]="dragOverTarget === 'approved'"
         (dragover)="onSigDragOver($event, 'approved')"
         (dragleave)="onSigDragLeave($event)"
         (drop)="onSigDrop($event, 'approved')">
      <div class="sig-preview" *ngIf="approvedSignature; else noAppSig">
        <img [src]="approvedSignature" alt="Signature" class="sig-image">
        <button type="button" class="sig-clear" (click)="clearSignature('approved')">✕</button>
      </div>
      <ng-template #noAppSig>
        <div class="sig-placeholder" (click)="triggerSigUpload('sigApproved')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" #sigApproved hidden accept="image/*" (change)="handleSigFile($event, 'approved')">
        </div>
      </ng-template>
    </div>
    
    <!-- Saved Signature Preview -->
    <div class="sig-saved-preview" *ngIf="approvedSignature && sigSaved['approved']">
  <img [src]="approvedSignature" alt="Signature" class="sig-image-small">
  <span class="sig-saved-label">✓ Signature</span>
  <button type="button" class="sig-clear" (click)="clearSignature('approved')">✕</button>
</div>
  </div>

  <!-- Received By -->
<div class="sig-block" [class.readonly]="!approvalMode">
  <h5>Received By:</h5>
  <div class="sig-field">
    <label>Date:</label>
    <input type="date" [(ngModel)]="joData.received_date" class="jo-input" [readonly]="!approvalMode">
  </div>
  <div class="sig-field">
    <label>Name:</label>
    <input type="text" [(ngModel)]="joData.received_name" class="jo-input" [readonly]="!approvalMode">
  </div>
  
  <!-- Only show draw/upload options in approval mode -->
  <ng-container *ngIf="approvalMode">
    <div class="sig-options">
      <button type="button" class="sig-option-btn" [class.active]="sigMode['received'] === 'draw'" (click)="setSigMode('received', 'draw')">✍️ Draw</button>
      <button type="button" class="sig-option-btn" [class.active]="sigMode['received'] === 'upload'" (click)="setSigMode('received', 'upload')">📁 Upload</button>
    </div>
    <!-- Draw Mode -->
    <div class="sig-canvas-wrap" *ngIf="sigMode['received'] === 'draw'">
      <canvas id="recCanvas" width="200" height="80" class="sig-canvas"
              (mousedown)="startSigDraw($event, 'received')"
              (mousemove)="drawSig($event, 'received')"
              (mouseup)="stopSigDraw()"
              (mouseleave)="stopSigDraw()"
              (touchstart)="startSigDraw($event, 'received')"
              (touchmove)="drawSig($event, 'received')"
              (touchend)="stopSigDraw()"></canvas>
      <div class="sig-canvas-actions">
        <button type="button" class="sig-sm-btn" (click)="clearSigCanvas('received')">🗑️ Clear</button>
        <button type="button" class="sig-sm-btn save" (click)="saveSigCanvas('received')">✅ Save</button>
      </div>
    </div>
    <!-- Upload Mode -->
    <div class="sig-upload" *ngIf="sigMode['received'] === 'upload'"
         [class.has-file]="receivedSignature"
         [class.drag-over]="dragOverTarget === 'received'"
         (dragover)="onSigDragOver($event, 'received')"
         (dragleave)="onSigDragLeave($event)"
         (drop)="onSigDrop($event, 'received')">
      <div class="sig-preview" *ngIf="receivedSignature; else noRecSig">
        <img [src]="receivedSignature" alt="Signature" class="sig-image">
        <button type="button" class="sig-clear" (click)="clearSignature('received')">✕</button>
      </div>
      <ng-template #noRecSig>
        <div class="sig-placeholder" (click)="triggerSigUpload('sigReceived')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" #sigReceived hidden accept="image/*" (change)="handleSigFile($event, 'received')">
        </div>
      </ng-template>
    </div>
  </ng-container>
  
  <!-- Saved Signature Preview -->
  <div class="sig-saved-preview" *ngIf="receivedSignature && sigSaved['received']">
    <img [src]="receivedSignature" alt="Signature" class="sig-image-small">
    <span class="sig-saved-label">✓ Signature</span>
    <button type="button" class="sig-clear" (click)="clearSignature('received')" *ngIf="approvalMode">✕</button>
  </div>
</div>
</div>

        <!-- Footer -->
        <div class="jo-footer">
          <p>📋 Form Info: Form filled out together with Floor/Dept Logbook.</p>
          <p>EDPtech Helpdesk System v2.0 | Job Order #{{ joNumber }}</p>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button class="action-btn cancel" (click)="cancel()">✕ Cancel</button>
        <button class="action-btn submit" (click)="submitJobOrder()" [disabled]="submitting">
          {{ submitting ? 'Saving...' : (approvalMode ? '✅ Receive Job Order' : editMode ? '💾 Update Job Order' : '✅ Submit Job Order') }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .jo-container {
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      background: #d4d0c8;
      min-height: 100vh;
    }

    .jo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 8px 14px;
      background: linear-gradient(180deg, #1c5fb5, #0a3a8c);
      color: white;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
    }
    .header-left h1 { margin: 0; font-size: 16px; }
    .header-sub { font-size: 10px; opacity: 0.8; }

    .print-btn {
      background: #f0f0f0;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 10px;
      color: #000;
    }
    .print-btn:hover { background: #e0e0e0; }

    /* Form */
    .jo-form {
      background: white;
      border: 2px solid;
      border-color: #808080 #fff #fff #808080;
      padding: 20px;
      font-family: 'Courier New', monospace;
    }

    .jo-form-header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .company-logo h2 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0a3a8c;
    }
    .company-sub {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #555;
    }
    .form-title h3 {
      margin: 8px 0 0 0;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 3px;
      color:   #000;
    }

    /* Top Row */
    .jo-top-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 12px;
    }
    .field-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .field-row label {
      width: 90px;
      font-weight: bold;
      font-size: 11px;
      flex-shrink: 0;
      color: #333;
    }
    .jo-input {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #888;
      border-radius: 2px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      background: #fffef8;
    }
    .jo-input:focus {
      outline: none;
      border-color: #0a3a8c;
    }

    /* Checkboxes */
    .jo-checkboxes {
      display: flex;
      gap: 30px;
      padding: 8px 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      margin-bottom: 12px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      color: #000000;
    }
    .checkbox-label input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    /* Sections */
    .jo-section {
      margin-bottom: 12px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-header h4 {
      margin: 0;
      font-size: 12px;
      white-space: nowrap;
      color: #000000;
    }
    .jo-select {
      padding: 4px 8px;
      border: 1px solid #888;
      border-radius: 2px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
    }
    .section-label {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 11px;
      color: #000000;
    }
    .jo-textarea {
      width: 100%;
      padding: 6px;
      border: 1px solid #888;
      border-radius: 2px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      resize: vertical;
      box-sizing: border-box;
      background: #fffef8;
      min-height: 100px;
    }
    .jo-input-full {
      width: 100%;
      padding: 6px;
      border: 1px solid #888;
      border-radius: 2px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      box-sizing: border-box;
      background: #fffef8;
    }

    /* Signatures */
    .jo-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #000;
    }
    .sig-block {
      border: 1px solid #ccc;
      padding: 10px;
      background: #fafafa;
    }
    .sig-block h5 {
      margin: 0 0 8px 0;
      font-size: 10px;
      text-transform: uppercase;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      color: #050505;
    }
    .sig-field {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .sig-field label {
      width: 35px;
      font-size: 10px;
      font-weight: bold;
      color: #050505;
    }
    .sig-field .jo-input {
      flex: 1;
      padding: 2px 4px;
      font-size: 10px;
    }
    .sig-line {
      margin-top: 12px;
    }
    .sig-label {
      font-size: 9px;
      color: #0e0d0d;
    }
    .signature-area {
      height: 40px;
      border-bottom: 1px solid #000;
      margin-top: 4px;
    }

    /* Footer */
    .jo-footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 9px;
      color: #0e0d0d;
    }
    .jo-footer p {
      margin: 2px 0;
    }
    /* Signature Upload */
.sig-upload {
  margin-top: 8px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  overflow: hidden;
}
.sig-upload:hover {
  border-color: #0a3a8c;
  background: #f8faff;
}
.sig-upload.drag-over {
  border-color: #0a3a8c;
  border-style: solid;
  background: #e8f0ff;
  box-shadow: 0 0 0 3px rgba(10,36,106,0.15);
}
.sig-upload.has-file {
  border-style: solid;
  border-color: #008800;
}

.sig-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  font-size: 9px;
  color: #888;
  cursor: pointer;
}
.sig-icon { font-size: 20px; }

.sig-preview {
  position: relative;
  width: 100%;
  padding: 8px;
}
.sig-image {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.sig-clear {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(204,0,0,0.8);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  padding: 2px 6px;
}
.sig-clear:hover {
  background: #cc0000;
}
  /* Signature Options */
.sig-options {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.sig-option-btn {
  flex: 1;
  padding: 3px 8px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 9px;
  border-radius: 3px;
  font-weight: bold;
}
.sig-option-btn.active {
  background: #0a3a8c;
  color: white;
  border-color: #0a3a8c;
}

/* Signature Canvas */
.sig-canvas-wrap {
  margin-top: 4px;
}
.sig-canvas {
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
  cursor: crosshair;
  display: block;
  width: 100%;
}
.sig-canvas-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.sig-sm-btn {
  flex: 1;
  padding: 2px 8px;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 9px;
  border-radius: 2px;
}
.sig-sm-btn:hover { background: #e0e0e0; }
.sig-sm-btn.save {
  background: #008800;
  color: white;
  border-color: #006600;
}
.sig-sm-btn.save:hover { background: #006600; }

/* Saved Preview */
.sig-saved-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 8px;
  background: #f0fff0;
  border: 1px solid #88cc88;
  border-radius: 3px;
}
.sig-image-small {
  max-width: 100px;
  max-height: 40px;
  object-fit: contain;
}
.sig-saved-label {
  font-size: 9px;
  color: #008800;
  font-weight: bold;
}
  .bg-remove-option {
  margin-top: 4px;
  padding: 2px 0;
}
.checkbox-label.small {
  font-size: 9px;
  font-weight: normal;
}
.checkbox-label.small input {
  width: 12px;
  height: 12px;
}
    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
    .action-btn {
      padding: 8px 20px;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      border-radius: 3px;
    }
    .action-btn.cancel {
      background: #f0f0f0;
      color: #000;
    }
    .action-btn.cancel:hover { background: #e0e0e0; }
    .action-btn.submit {
      background: #0a3a8c;
      color: white;
      border-color: #1c5fb5 #042070 #042070 #1c5fb5;
    }
    .action-btn.submit:hover { background: #1c5fb5; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sig-block.readonly {
  opacity: 0.8;
  pointer-events: none;
  position: relative;
}
.readonly-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.1);
  z-index: 1;
}
    /* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 2000;
  max-width: 400px;
}
.toast-notification.show {
  transform: translateY(0);
  opacity: 1;
}
.toast-notification.success {
  background: #008800;
}
.toast-notification.error {
  background: #cc6600;
}
.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.toast-message {
  flex: 1;
  line-height: 1.4;
}
    /* Print styles */
    @media print {
      body * { visibility: hidden; }
      #print-section, #print-section * { visibility: visible; }
      #print-section { position: absolute; left: 0; top: 0; width: 100%; }
      .jo-header, .form-actions { display: none; }
    }
  `]
})
export class ClientJobOrderFormComponent implements OnInit {
  companyName = 'Lee Super Plaza';
  submitting = false;
  departments: any[] = [];
  removeBg = true;
  showToast = false;
toastMessage = '';
toastType: 'success' | 'error' = 'success';
joNumber: string = '';
 // Signature properties
requestedSignature: string | null = null;
approvedSignature: string | null = null;
receivedSignature: string | null = null;
dragOverTarget: string | null = null;
editMode = false;
editJobId: string | null = null;
approvalMode = false;
  joData = {
    date: new Date().toISOString().split('T')[0],
    company: 'Lee Super Plaza',
    crtk_no: '',
    date_needed: '',
    department: '',
    is_charge: false,
    is_expense: false,
    request_dept: '',
    particulars: '',
    job_order_for: '',
    requested_date: new Date().toISOString().split('T')[0],
    requested_name: '',
    approved_name: '',
    received_date: '',
    received_name: ''
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

ngOnInit() {
  this.joData.crtk_no = this.generateCRTLNumber();
  this.joNumber = this.generateJobOrderNumber();
  
  // Check if in approval mode
  const url = this.router.url;
  if (url.includes('/approve')) {
    this.approvalMode = true;
    this.editMode = true;
  }
  
  this.route.queryParams.subscribe(params => {
    if (params['id']) {
      this.editMode = true;
      this.editJobId = params['id'];
      this.loadJobOrder(params['id']);
    }
  });

  // Load departments with error handling
  this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
    next: (data) => {
      this.departments = Array.isArray(data) ? data : [];
    },
    error: (err) => {
      console.warn('Departments API failed, using empty list');
      this.departments = [];
    }
  });
  
  // Pre-fill name with delay to avoid blocking
  setTimeout(() => {
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.joData.requested_name = user.fullname || '';
        this.joData.department = user.department || '';
      }
    });
  }, 0);
}
get isClientMode(): boolean {
  return !this.approvalMode && this.router.url.includes('/client');
}
loadJobOrder(id: string) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  this.http.get<any>(`${environment.apiUrl}/api/job-orders/${id}`, { headers }).subscribe({
    next: (data) => {
      this.joNumber = data.job_order_number;
      this.joData = {
        date: this.parseDate(data.date) || new Date().toISOString().split('T')[0],
        company: data.company || '',
        crtk_no: data.crtk_no || '',
        date_needed: this.parseDate(data.date_needed) || '',
        department: data.department || '',
        is_charge: data.is_charge || false,
        is_expense: data.is_expense || false,
        request_dept: data.request_dept || '',
        particulars: data.particulars || '',
        job_order_for: data.job_order_for || '',
        requested_date: this.parseDate(data.requested_date) || new Date().toISOString().split('T')[0],
        requested_name: data.requested_name || '',
        approved_name: data.approved_name || '',
        received_date: this.parseDate(data.received_date) || '',
        received_name: data.received_name || ''
      };
      this.requestedSignature = data.requested_signature || null;
      this.approvedSignature = data.approved_signature || null;
      this.receivedSignature = data.received_signature || null;
     if (data.requested_signature) {
        this.sigSaved['requested'] = true;
      }
      if (this.approvalMode) {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.joData.approved_name = this.joData.approved_name || currentUser.fullname || '';
          this.joData.received_name = this.joData.received_name || currentUser.fullname || '';
          this.joData.received_date = this.joData.received_date || new Date().toISOString().split('T')[0];
        }
      }
      if (data.approved_signature) {
        this.sigSaved['approved'] = true;
      }
      if (data.received_signature) {
        this.sigSaved['received'] = true;
      }
    },

    error: (err) => {
      console.error('Failed to load job order:', err);
      this.showToastNotification('Failed to load job order', 'error');
    }
  });
}
// Add this helper method
private parseDate(val: any): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

private toastTimer: any;
generateCRTLNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CRTL-${year}${month}${day}-${random}`;
}
  loadDepartments() {
    this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
      next: (data) => {
        this.departments = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.departments = [];
      }
    });
  }
 // Signature mode: 'draw' or 'upload'
sigMode: Record<string, 'draw' | 'upload'> = {
  'requested': 'draw',
  'approved': 'draw',
  'received': 'draw'
};

// Track if signature was saved from canvas
sigSaved: Record<string, boolean> = {
  'requested': false,
  'approved': false,
  'received': false
};

// Drawing state
private sigDrawing = false;
private activeSigTarget: string = '';
private sigCtx: Record<string, CanvasRenderingContext2D | null> = {
  'requested': null,
  'approved': null,
  'received': null
}; 
setSigMode(target: string, mode: 'draw' | 'upload') {
  this.sigMode[target] = mode;
  if (mode === 'draw') {
    setTimeout(() => this.initCanvas(target), 200);
  }
}
initCanvas(target: string) {
  const canvasId = target === 'requested' ? 'reqCanvas' : target === 'approved' ? 'appCanvas' : 'recCanvas';
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }
}
// Get canvas element
getCanvas(target: string): HTMLCanvasElement | null {
  const canvasId = target === 'requested' ? 'reqCanvas' : target === 'approved' ? 'appCanvas' : 'recCanvas';
  return document.getElementById(canvasId) as HTMLCanvasElement;
}

// Initialize canvas contexts when switching to draw mode
initSigCanvas(target: string) {
  setTimeout(() => {
    const canvasRefs: any = {
      'requested': 'reqCanvas',
      'approved': 'appCanvas',
      'received': 'recCanvas'
    };
    const ref = (this as any)[canvasRefs[target]];
    if (ref?.nativeElement) {
      const canvas = ref.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        this.sigCtx[target] = ctx;
      }
    }
  }, 100);
}

startSigDraw(event: any, target: string) {
  event.preventDefault();
  this.sigDrawing = true;
  this.activeSigTarget = target;
  
  const canvas = this.getCanvas(target);
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (event.touches?.[0]?.clientX || event.clientX) - rect.left;
  const y = (event.touches?.[0]?.clientY || event.clientY) - rect.top;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
}

drawSig(event: any, target: string) {
  if (!this.sigDrawing || this.activeSigTarget !== target) return;
  event.preventDefault();
  
  const canvas = this.getCanvas(target);
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (event.touches?.[0]?.clientX || event.clientX) - rect.left;
  const y = (event.touches?.[0]?.clientY || event.clientY) - rect.top;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

stopSigDraw() {
  this.sigDrawing = false;
  this.activeSigTarget = '';
}

clearSigCanvas(target: string) {
  const canvas = this.getCanvas(target);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  this.sigSaved[target] = false;
}

saveSigCanvas(target: string) {
  const canvas = this.getCanvas(target);
  if (canvas) {
    const dataUrl = canvas.toDataURL('image/png');
    switch (target) {
      case 'requested': this.requestedSignature = dataUrl; break;
      case 'approved': this.approvedSignature = dataUrl; break;
      case 'received': this.receivedSignature = dataUrl; break;
    }
    this.sigSaved[target] = true;
  }
}


getSigCanvas(target: string): HTMLCanvasElement | null {
  const canvasRefs: any = {
    'requested': 'reqCanvas',
    'approved': 'appCanvas',
    'received': 'recCanvas'
  };
  return (this as any)[canvasRefs[target]]?.nativeElement || null;
}

onSigDragOver(event: DragEvent, target: string) {
  event.preventDefault();
  event.stopPropagation();
  this.dragOverTarget = target;
}

onSigDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  this.dragOverTarget = null;
}

onSigDrop(event: DragEvent, target: string) {
  event.preventDefault();
  event.stopPropagation();
  this.dragOverTarget = null;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    this.processSigFile(files[0], target);
  }
}

triggerSigUpload(inputRef: string) {
  // Access the hidden file input by reference
  const input = document.querySelector(`[ng-reflect-name="${inputRef}"]`) as HTMLInputElement;
  if (!input) {
    // Fallback: find by ViewChild reference name
    const refs: any = (this as any);
    if (refs[inputRef]) {
      refs[inputRef].nativeElement.click();
    }
  } else {
    input.click();
  }
}

handleSigFile(event: any, target: string) {
  const file = event.target.files?.[0];
  if (file) {
    this.processSigFile(file, target);
  }
}

processSigFile(file: File, target: string) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file for the signature.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e: any) => {
    const img = new Image();
    img.onload = () => {
      // Only remove background if toggle is on
      const result = this.removeBg ? this.removeBackground(img) : (e.target.result as string);
      switch (target) {
        case 'requested':
          this.requestedSignature = result;
          break;
        case 'approved':
          this.approvedSignature = result;
          break;
        case 'received':
          this.receivedSignature = result;
          break;
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Background removal using canvas
removeBackground(img: HTMLImageElement): string {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return img.src;
  
  // Draw image
  ctx.drawImage(img, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Find the average brightness to determine threshold
  let totalBrightness = 0;
  let pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Calculate brightness (perceived luminance)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Set threshold - pixels brighter than 85% of average become transparent
  // For signatures on white paper, this works well
  const threshold = Math.max(avgBrightness * 0.85, 200);
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (brightness > threshold) {
      // Make this pixel transparent
      data[i + 3] = 0; // Alpha = 0 (transparent)
    } else {
      // Keep the pixel but enhance contrast for signature clarity
      const darkness = 255 - brightness;
      const enhancement = Math.min(darkness * 1.2, 255);
      const factor = enhancement / Math.max(darkness, 1);
      
      data[i] = Math.min(Math.round((r - (255 - threshold)) * factor + 255 - threshold), 255);
      data[i + 1] = Math.min(Math.round((g - (255 - threshold)) * factor + 255 - threshold), 255);
      data[i + 2] = Math.min(Math.round((b - (255 - threshold)) * factor + 255 - threshold), 255);
      data[i + 3] = 255; // Fully opaque
    }
  }
  
  // Put processed data back
  ctx.putImageData(imageData, 0, 0);
  
  // Return as PNG (supports transparency)
  return canvas.toDataURL('image/png');
}
clearSignature(target: string) {
  switch (target) {
    case 'requested':
      this.requestedSignature = null;
      break;
    case 'approved':
      this.approvedSignature = null;
      break;
    case 'received':
      this.receivedSignature = null;
      break;
  }
}
  generateJobOrderNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JO-${datePart}-${random}`;
  }
showToastNotification(message: string, type: 'success' | 'error' = 'success') {
  this.toastMessage = message;
  this.toastType = type;
  this.showToast = true;
  
  if (this.toastTimer) {
    clearTimeout(this.toastTimer);
  }
  
  this.toastTimer = setTimeout(() => {
    this.showToast = false;
    this.toastMessage = '';
  }, 3000);
}
 submitJobOrder() {
  // Common validation for all modes
  if (!this.joData.company) {
    this.showToastNotification('Company field is required.', 'error');
    return;
  }
  if (!this.joData.particulars) {
    this.showToastNotification('Particulars / Description is required.', 'error');
    return;
  }
  if (!this.joData.request_dept) {
    this.showToastNotification('Job Request department is required.', 'error');
    return;
  }
  if (!this.joData.requested_name) {
    this.showToastNotification('Requested By name is required.', 'error');
    return;
  }
  if (!this.requestedSignature) {
    this.showToastNotification('Requested By signature is required. Please draw or upload a signature.', 'error');
    return;
  }

  // Approval mode - validate received by section
  if (this.approvalMode) {
    if (!this.joData.received_name) {
      this.showToastNotification('Received By name is required.', 'error');
      return;
    }
    if (!this.receivedSignature) {
      this.showToastNotification('Received By signature is required. Please draw or upload a signature.', 'error');
      return;
    }
  }

  this.submitting = true;

  if (this.approvalMode) {
    const payload = {
      status: 'approved',
      approved_name: this.joData.approved_name || this.authService.getCurrentUser()?.fullname || '',
      approved_signature: this.approvedSignature,
      received_name: this.joData.received_name,
      received_date: this.joData.received_date,
      received_signature: this.receivedSignature
    };
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    this.http.put(`${environment.apiUrl}/api/admin/job-orders/${this.editJobId}/approve`, payload, { headers }).subscribe({
      // In ClientJobOrderFormComponent, approval mode submit:
next: () => {
  this.submitting = false;
  this.showToastNotification('✅ Job Order received!', 'success');
  
  // 🔔 Notify about received job order
  const receiverName = this.joData.received_name || this.authService.getCurrentUser()?.fullname || 'Admin';
  this.notificationService.addBellNotification({
    type: 'success',
    title: '📥 Job Order Received',
    message: `Job Order #${this.joNumber} received by ${receiverName}`,
    ticketId: undefined,
    ticketNumber: this.joNumber,
    targetUserId: null,
    countInBadge: true,
  });
  
  setTimeout(() => this.router.navigate(['/admin/job-orders']), 1500);
},
      error: () => {
        this.submitting = false;
        this.showToastNotification('⚠️ Received locally', 'error');
        setTimeout(() => this.router.navigate(['/admin/job-orders']), 1500);
      }
    });
    return;
  }
  
  // Regular submit/create logic
  const payload = {
    ...this.joData,
    job_order_number: this.joNumber,
    submitted_by: this.authService.getCurrentUser()?.id || null,
    requested_signature: this.requestedSignature,
    approved_signature: this.approvedSignature,
    received_signature: this.receivedSignature
  };

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const url = this.editMode && this.editJobId 
    ? `${environment.apiUrl}/api/job-orders/${this.editJobId}`
    : `${environment.apiUrl}/api/job-orders`;
  
  const request = this.editMode 
    ? this.http.put(url, payload, { headers })
    : this.http.post(url, payload, { headers });

  request.subscribe({
    next: () => {
      this.submitting = false;
      this.showToastNotification(this.editMode ? '✅ Job Order updated!' : '✅ Job Order submitted!', 'success');
      
      // 🔔 Notify about new job order (if not editing)
      if (!this.editMode) {
        this.notificationService.addBellNotification({
          type: 'info',
          title: '📋 New Job Order',
          message: `Job Order #${this.joNumber} submitted by ${this.joData.requested_name}`,
          ticketId: undefined,
          ticketNumber: this.joNumber,
          targetUserId: null,
          countInBadge: true,
        });
      }
      
      setTimeout(() => this.router.navigate(['/client/job-orders']), 1500);
    },
    error: (err) => {
      console.error('Failed:', err);
      this.submitting = false;
      const savedData = {
        ...this.joData,
        job_order_number: this.joNumber,
        requested_signature: this.requestedSignature,
        approved_signature: this.approvedSignature,
        received_signature: this.receivedSignature
      };
      const savedOrders = JSON.parse(localStorage.getItem('job_orders') || '[]');
      if (this.editMode) {
        const idx = savedOrders.findIndex((j: any) => j.job_order_number === this.joNumber);
        if (idx !== -1) savedOrders[idx] = savedData;
      } else {
        savedOrders.push(savedData);
      }
      localStorage.setItem('job_orders', JSON.stringify(savedOrders));
      this.showToastNotification('📋 Saved locally', 'error');
      setTimeout(() => this.router.navigate(['/client/job-orders']), 1500);
    }
  });
}
printForm() {
  const printWindow = window.open('', '_blank', 'width=700,height=800');
  if (!printWindow) {
    alert('Please allow popups for printing');
    return;
  }

  const joNumber = this.generateJobOrderNumber();
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job Order - ${joNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A5 portrait; margin: 6mm; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 9px;
          color: #000;
        }
        .jo-receipt {
          background: white;
          border: 1px solid #000;
          padding: 10px 14px;
          max-width: 420px;
          margin: 0 auto;
        }
        .jo-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .jo-header .company {
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .jo-header .title {
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-top: 2px;
        }
        .jo-header .ref {
          font-size: 7px;
          color: #0e0d0d;
          margin-top: 2px;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 3px;
          font-size: 8px;
        }
        .info-label { 
          font-weight: bold; 
          white-space: nowrap; 
          color: #555;
          width: 65px;
          flex-shrink: 0;
        }
        .info-value { flex: 1; font-weight: bold; color: #030303; }
        
        .check-row {
          display: flex;
          gap: 16px;
          margin: 6px 0;
          font-size: 8px;
        }
        
        .divider {
          border: none;
          border-top: 1px dashed #ccc;
          margin: 6px 0;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 8px;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 3px;
        }
        .description {
          border: 1px solid #eee;
          padding: 6px 8px;
          min-height: 50px;
          font-size: 8px;
          line-height: 1.4;
          white-space: pre-wrap;
          background: #fafafa;
          margin-bottom: 8px;
        }
        
        .signatures {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #000;
        }
        .sig-row {
          display: flex;
          gap: 8px;
          justify-content: space-between;
        }
        .sig-block {
          flex: 1;
          text-align: center;
        }
        .sig-label {
          font-size: 7px;
          font-weight: bold;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 3px;
        }
        .sig-image {
          border: 1px solid #eee;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3px;
          background: #fafafa;
          height: 45px;
        }
        .sig-image img {
          max-width: 100px;
          max-height: 35px;
        }
        .sig-image .no-sig {
          font-size: 7px;
          color: #ccc;
          font-style: italic;
        }
        .sig-name {
          font-size: 9px;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 1px;
        }
        .sig-date {
          font-size: 7px;
          color: #030303;
          font-weight: bold;
        }
        
        .jo-footer {
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px dashed #ccc;
          text-align: center;
          font-size: 7px;
          color: #2b2929;
        }
        @media print {
          body { padding: 0; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="jo-receipt">
        <div class="jo-header">
          <div class="company">${this.companyName}</div>
          <div class="title">JOB ORDER</div>
          <div class="ref">Ref #: ${joNumber}</div>
        </div>

        <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${this.joData.date || '—'}</span></div>
        <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${this.joData.company || '—'}</span></div>
        <div class="info-row"><span class="info-label">CRTL #:</span><span class="info-value">${this.joData.crtk_no || '—'}</span></div>
        <div class="info-row"><span class="info-label">Date Needed:</span><span class="info-value">${this.joData.date_needed || '—'}</span></div>
        <div class="info-row"><span class="info-label">Dept:</span><span class="info-value">${this.joData.department || '—'}</span></div>
        <div class="info-row"><span class="info-label">Request:</span><span class="info-value">${this.joData.request_dept || '—'}</span></div>
        <div class="info-row"><span class="info-label">Job For:</span><span class="info-value">${this.joData.job_order_for || '—'}</span></div>
        
        <div class="check-row">
          <span>${this.joData.is_charge ? '☑ Charge' : '☐ Charge'}</span>
          <span>${this.joData.is_expense ? '☑ Expense' : '☐ Expense'}</span>
        </div>

        <hr class="divider">

        <div class="section-title">Particulars / Description</div>
        <div class="description">${this.joData.particulars || 'No details provided.'}</div>

        <div class="signatures">
          <div class="sig-row">
            <div class="sig-block">
              <div class="sig-label">Requested By</div>
              <div class="sig-image">
                ${this.requestedSignature ? `<img src="${this.requestedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
              </div>
              <div class="sig-name">${this.joData.requested_name || '_______________'}</div>
              <div class="sig-date">${this.joData.requested_date || '__/__/__'}</div>
            </div>
            <div class="sig-block">
              <div class="sig-label">Approved By</div>
              <div class="sig-image">
                ${this.approvedSignature ? `<img src="${this.approvedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
              </div>
              <div class="sig-name">${this.joData.approved_name || '_______________'}</div>
              <div class="sig-date"></div>
            </div>
            <div class="sig-block">
              <div class="sig-label">Received By</div>
              <div class="sig-image">
                ${this.receivedSignature ? `<img src="${this.receivedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
              </div>
              <div class="sig-name">${this.joData.received_name || '_______________'}</div>
              <div class="sig-date">${this.joData.received_date || '__/__/__'}</div>
            </div>
          </div>
        </div>

        <div class="jo-footer">
          Form filled out together with Floor/Dept Logbook &nbsp;|&nbsp; EDPtech Helpdesk v2.0
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}
  cancel() {
  if (this.approvalMode) {
    this.router.navigate(['/admin/job-orders']);
  } else {
    this.router.navigate(['/client/job-orders']);
  }
}
}