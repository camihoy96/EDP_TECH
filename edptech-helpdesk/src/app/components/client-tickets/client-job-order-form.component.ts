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
    <div class="req-container">
     <div class="req-header">
    <div class="header-left">
  <h1>{{ approvalMode ? '📥 Receive Job Order' : editMode ? '✏️ Edit Job Order' : '📋 Job Order Form' }}</h1>
  <span class="header-sub">{{ approvalMode ? 'Fill in received by details and signature' : editMode ? 'Update your job order request' : 'Submit a job order for work/services' }}</span>
</div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="print-btn" (click)="printForm()">🖨️ Print</button>
      <button class="close-btn" (click)="cancel()" title="Close">✕</button>
    </div>
</div>

      <div class="req-form" id="print-section">
       <div class="req-form-header">
  <h2>{{ companyName }}</h2>
  <div style="font-size:10px;color:#555;" *ngIf="userBranch?.name">
    🏢 {{ userBranch.name }}
  </div>
  <h3>JOB ORDER FORM</h3>
  <div class="ctrl-no">CTRL NO.: {{ joCtrlNumber }}</div>
</div>

       <div class="req-top-row">
  <div class="field-row">
    <label>Request From:</label>
    <input type="text" [(ngModel)]="joData.request_from" class="req-input" readonly>
  </div>
  
 <!-- Branch Selection (Recipient) -->
<div class="field-row">
  <label>Recipient:</label>
 <select [(ngModel)]="selectedBranchId" class="req-input" [disabled]="approvalMode || isRecipientEdit">
    <option value="">— Select Branch —</option>
    <option [value]="userBranch?.id" *ngIf="userBranch">
      🏢 {{ userBranch?.name }} <small>({{ userBranch?.company_name }})</small> - Your Branch
    </option>
    <option *ngFor="let branch of availableRecipientBranches" [value]="branch.id">
      🏛️ {{ branch.name }} <small>({{ branch.company_name }})</small>
    </option>
  </select>
</div>

<!-- Department Selection - based on selected branch -->
<div class="field-row">
  <label>Dept:</label>
   <select [(ngModel)]="joData.department_id" class="req-input" [disabled]="approvalMode || isRecipientEdit">
    <option value="">— Select Department —</option>
    <option *ngFor="let dept of filteredDepartments" [value]="dept.id">
      {{ dept.displayName || dept.name }}
    </option>
  </select>
</div>
</div>
<div class="req-top-row">
  <!-- ATTN (auto-filled from department supervisor) -->
  <div class="field-row">
    <label>ATTN.:</label>
    <select [(ngModel)]="joData.attn" class="req-input" [disabled]="approvalMode">
      <option value="">— Auto from department —</option>
      <option *ngFor="let user of attnUsers" [value]="user.fullname || user.username">
        {{ user.fullname || user.username }} ({{ user.role }})
      </option>
    </select>
  </div>
  <div class="field-row">
    <label>Date:</label>
   <input type="date" [(ngModel)]="joData.date" class="req-input" [readonly]="approvalMode">
  </div>
  <div class="field-row">
    <label>Time:</label>
     <input type="time" [(ngModel)]="joData.time" class="req-input" [readonly]="approvalMode">
  </div>
</div>
        <div class="req-section">
          <label>Work Description / Remarks:</label>
           <textarea [(ngModel)]="joData.remarks" class="req-textarea" rows="4" 
            placeholder="Describe the work or service needed..." [readonly]="approvalMode"></textarea>
        </div>       
<!-- Signatures -->
<div class="req-signatures">
  <!-- Form Requested By -->
  <div class="sig-block">
    <h5>Form Requested By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="joData.prepared_name" class="req-input-sm" placeholder="Your name" [readonly]="approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="joData.prepared_date" class="req-input-sm" [readonly]="approvalMode">
    </div>
    
    <!-- Show saved signature preview -->
    <div class="sig-saved-preview" *ngIf="preparedSignature">
      <img [src]="preparedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('prepared')" *ngIf="!approvalMode">✕</button>
    </div>
    
    <!-- Draw/Upload options - ONLY when NOT in approval mode and no signature -->
    <ng-container *ngIf="!approvalMode && !preparedSignature">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['prepared'] === 'draw'" (click)="setSigMode('prepared', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['prepared'] === 'upload'" (click)="setSigMode('prepared', 'upload')">📁 Upload</button>
      </div>
      <div class="sig-draw-area" *ngIf="sigMode['prepared'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('prepared')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
      </div>
      <div class="sig-upload" *ngIf="sigMode['prepared'] === 'upload'"
           [class.drag-over]="dragOverTarget === 'prepared'"
           (dragover)="onSigDragOver($event, 'prepared')"
           (dragleave)="onSigDragLeave($event)"
           (drop)="onSigDrop($event, 'prepared')">
        <div class="sig-placeholder" (click)="triggerSigFileInput('prepared')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'prepared')" id="preparedFileInput">
        </div>
      </div>
    </ng-container>
  </div>

  <!-- Form Approved By -->
  <div class="sig-block">
    <h5>Form Approved By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="joData.approved_name" class="req-input-sm" placeholder="Approver name" [readonly]="approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="joData.approved_date" class="req-input-sm" [readonly]="approvalMode">
    </div>
    
    <!-- Show saved signature preview -->
    <div class="sig-saved-preview" *ngIf="approvedSignature">
      <img [src]="approvedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('approved')" *ngIf="!approvalMode">✕</button>
    </div>
    
    <!-- Draw/Upload options - ONLY when NOT in approval mode and no signature -->
    <ng-container *ngIf="!approvalMode && !approvedSignature">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'draw'" (click)="setSigMode('approved', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'upload'" (click)="setSigMode('approved', 'upload')">📁 Upload</button>
      </div>
      <div class="sig-draw-area" *ngIf="sigMode['approved'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('approved')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
      </div>
      <div class="sig-upload" *ngIf="sigMode['approved'] === 'upload'"
           [class.drag-over]="dragOverTarget === 'approved'"
           (dragover)="onSigDragOver($event, 'approved')"
           (dragleave)="onSigDragLeave($event)"
           (drop)="onSigDrop($event, 'approved')">
        <div class="sig-placeholder" (click)="triggerSigFileInput('approved')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'approved')" id="approvedFileInput">
        </div>
      </div>
    </ng-container>
  </div>

  <!-- Form Received By - Fillable in approval mode, readonly otherwise -->
  <div class="sig-block" [class.readonly]="!approvalMode">
    <h5>Form Received By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="joData.received_name" class="req-input-sm" 
             placeholder="Receiver name" [readonly]="!approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="joData.received_date" class="req-input-sm" [readonly]="!approvalMode">
    </div>
    
    <!-- Show saved signature preview -->
    <div class="sig-saved-preview" *ngIf="receivedSignature">
      <img [src]="receivedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('received')" *ngIf="approvalMode">✕</button>
    </div>
    
    <!-- Draw/Upload options - ONLY in approval mode and no signature -->
    <ng-container *ngIf="approvalMode && !receivedSignature">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['received'] === 'draw'" (click)="setSigMode('received', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['received'] === 'upload'" (click)="setSigMode('received', 'upload')">📁 Upload</button>
      </div>
      <div class="sig-draw-area" *ngIf="sigMode['received'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('received')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
      </div>
      <div class="sig-upload" *ngIf="sigMode['received'] === 'upload'"
           [class.drag-over]="dragOverTarget === 'received'"
           (dragover)="onSigDragOver($event, 'received')"
           (dragleave)="onSigDragLeave($event)"
           (drop)="onSigDrop($event, 'received')">
        <div class="sig-placeholder" (click)="triggerSigFileInput('received')">
          <span class="sig-icon">📁</span>
          <span>Drop signature or click to upload</span>
          <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'received')" id="receivedFileInput">
        </div>
      </div>
    </ng-container>
    
    <!-- Placeholder when not in approval mode and no signature -->
    <div *ngIf="!approvalMode && !receivedSignature" style="padding: 12px; text-align: center; color: #888; font-style: italic; font-size: 9px;">
      To be completed upon receipt
    </div>
  </div>
</div>
        <div class="req-footer">
          <p>📋 This Job Order authorizes the recipient department to perform the described work.</p>
          <p>EDPtech Helpdesk v2.0 | Job Order #{{ joNumber }}</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="action-btn cancel" (click)="cancel()">✕ Cancel</button>
       <button class="action-btn submit" (click)="submitJobOrder()" [disabled]="submitting">
  {{ submitting ? 'Saving...' : (approvalMode ? '📥 Receive Job Order' : editMode ? '💾 Update' : '✅ Submit Job Order') }}
</button>
      </div>
    </div>
    <!-- Toast Notification -->
<div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'" [class.warning]="toastType === 'warning'">
  <span>{{ toastMessage }}</span>
</div>
<!-- Signature Drawing Modal -->
<div class="modal-overlay" *ngIf="showSigModal" (click)="closeSigModal()">
  <div class="sig-modal" 
       [ngStyle]="{'transform': 'translate(' + sigModalPosition.x + 'px, ' + sigModalPosition.y + 'px)'}"
       (click)="$event.stopPropagation()">
    <div class="sig-modal-header" 
         (mousedown)="startSigModalDrag($event)"
         (mousemove)="onSigModalDrag($event)"
         (mouseup)="stopSigModalDrag()"
         (mouseleave)="stopSigModalDrag()"
         style="cursor: move;">
      <span>✍️ Draw Signature</span>
      <button type="button" class="sig-modal-close" (click)="closeSigModal()">✕</button>
    </div>
    <div class="sig-modal-body">
      <canvas id="sigModalCanvas" class="sig-modal-canvas"
              (mousedown)="startSigDraw($event, sigModalTarget)"
              (mousemove)="drawSig($event, sigModalTarget)"
              (mouseup)="stopSigDraw()"
              (mouseleave)="stopSigDraw()"
              (touchstart)="startSigDraw($event, sigModalTarget)"
              (touchmove)="drawSig($event, sigModalTarget)"
              (touchend)="stopSigDraw()"></canvas>
    </div>
    <div class="sig-modal-footer">
      <button type="button" class="sig-modal-btn clear" (click)="clearSigCanvas(sigModalTarget)">🗑️ Clear</button>
      <button type="button" class="sig-modal-btn cancel" (click)="closeSigModal()">Cancel</button>
      <button type="button" class="sig-modal-btn save" (click)="saveSigCanvas(sigModalTarget); closeSigModal()">✅ Save Signature</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .req-container { padding: 16px; max-width: 1500px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; font-size: 12px; background: #d4d0c8; min-height: 100vh; }
    .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 8px 14px; background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .header-left h1 { margin: 0; font-size: 16px; }
    .header-sub { font-size: 10px; opacity: 0.8; }
    .print-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 4px 12px; cursor: pointer; font-size: 10px; }
    .req-form { background: white; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 20px; font-family: 'Courier New', monospace; }
    .req-form-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .req-form-header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #0a246a; }
    .req-form-header h3 { margin: 4px 0; font-size: 14px; color: #04060c; }
    .ctrl-no { font-size: 9px; color: #cc0000; font-weight: bold; }
    .req-top-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .field-row { display: flex; align-items: center; gap: 4px; }
    .field-row label { font-weight: bold; font-size: 10px; white-space: nowrap; color: #0f0e0e; }
    .req-input { flex: 1; padding: 4px 6px; border: 1px solid #888; font-size: 10px; color: #0f0e0e; font-family: 'Courier New', monospace; }
    .req-input:disabled { background: #e8e8e8; color: #666; cursor: not-allowed; }
    .req-textarea { width: 100%; padding: 6px; border: 1px solid #888; font-size: 10px; font-family: 'Courier New', monospace; resize: vertical; box-sizing: border-box; }
    .req-section { margin-bottom: 12px; color: #0f0e0e; font-weight: bold; }
    .req-section h4 { font-size: 12px; margin: 0 0 6px 0; color: #000000; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .add-item-btn { background: #0a3a8c; color: white; border: 1px solid #042070; padding: 3px 10px; cursor: pointer; font-size: 9px; border-radius: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .items-table th { background: #f0f4f8; padding: 6px 8px; font-size: 9px; border: 1px solid #ccc; text-align: left; }
    .items-table td { padding: 4px 6px; border: 1px solid #eee; }
    .item-input { padding: 3px 5px; border: 1px solid #ccc; font-size: 10px; font-family: 'Courier New', monospace; width: 100%; box-sizing: border-box; }
    .remove-item-btn { background: none; border: none; color: #cc0000; cursor: pointer; font-size: 12px; }
    .empty-items { text-align: center; color: #888; padding: 12px; font-style: italic; }
    .req-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .sig-block { border: 1px solid #ccc; padding: 8px; background: #fafafa; }
    .sig-block h5 { margin: 0 0 6px 0; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sig-field { display: flex; align-items: center; margin-bottom: 3px; }
    .sig-field label { width: 30px; font-size: 9px; font-weight: bold; color: #0f0e0e; }
    .req-input-sm { flex: 1; padding: 3px 5px; border: 1px solid #ccc; font-size: 10px; font-family: 'Courier New', monospace; }
    .req-footer { align-items: center; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .req-footer p { margin: 2px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .action-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
    .action-btn.cancel { background: #f0f0f0; color: #000; }
    .action-btn.submit { background: #0a3a8c; color: white; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .close-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 4px 10px; font-size: 14px; font-weight: bold; border-radius: 0px; line-height: 1; }
    .close-btn:hover { background: rgba(255,0,0,0.7); border-color: rgba(255,255,255,0.6); }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 3000; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .toast-notification.warning { background: #cc6600; }
    .sig-options { display: flex; gap: 4px; margin: 4px 0; }
.sig-option-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 8px; border-radius: 2px; }
.sig-option-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
.sig-draw-trigger { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; border: 2px dashed #ccc; background: #fafafa; cursor: pointer; width: 100%; border-radius: 4px; font-size: 9px; color: #666; transition: all 0.2s; }
.sig-draw-trigger:hover { border-color: #0a3a8c; background: #e8f0ff; color: #0a3a8c; }
.sig-draw-icon { font-size: 24px; }
.sig-upload { border: 1px dashed #ccc; padding: 8px; text-align: center; margin-top: 4px; }
.sig-upload.has-file { border-style: solid; border-color: #008800; }
.sig-upload.drag-over { border-color: #0a3a8c; border-style: solid; background: #e8f0ff; box-shadow: 0 0 0 3px rgba(10,36,106,0.15); }
.sig-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; font-size: 9px; color: #888; cursor: pointer; }
.sig-icon { font-size: 20px; }
.sig-preview { position: relative; width: 100%; padding: 8px; }
.sig-image { max-width: 100%; max-height: 80px; object-fit: contain; display: block; margin: 0 auto; }
.sig-saved-preview { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding: 4px 8px; background: #f0fff0; border: 1px solid #88cc88; border-radius: 3px; }
.sig-image-small { max-width: 100px; max-height: 40px; object-fit: contain; }
.sig-saved-label { font-size: 9px; color: #008800; font-weight: bold; }
.sig-clear { background: rgba(204,0,0,0.8); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 8px; padding: 1px 4px; margin-left: 6px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.sig-modal { background: white; border: 2px solid #808080; box-shadow: 3px 4px 14px rgba(0,0,0,0.3); width: 800px; max-width: 95vw; position: relative; user-select: none; }
.sig-modal-header { background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold; }
.sig-modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; font-size: 16px; padding: 4px 10px; line-height: 1; }
.sig-modal-close:hover { background: rgba(255,0,0,0.7); }
.sig-modal-body { padding: 20px; background: #f5f5f5; display: flex; justify-content: center; }
.sig-modal-canvas { border: 2px solid #ccc; background: white; cursor: crosshair; display: block; width: 750px; height: 300px; touch-action: none; }
.sig-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #ddd; background: #fafafa; }
.sig-modal-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
.sig-modal-btn.clear { background: #f0f0f0; color: #cc0000; }
.sig-modal-btn.cancel { background: #f0f0f0; color: #000; }
.sig-modal-btn.save { background: #008800; color: white; border-color: #00aa00 #006600 #006600 #00aa00; }
.sig-modal-btn:hover { filter: brightness(0.95); }
.sig-block.readonly { opacity: 0.6; pointer-events: none; }
  `]
})
export class ClientJobOrderFormComponent implements OnInit {
  submitting = false;
  editMode = false;
  editReqId: string | null = null;
  joNumber: string = '';
  joCtrlNumber: string = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  isRecipientEdit: boolean = false;
  private toastTimer: any;
  selectedBranchId: number | null = null;
  branches: any[] = [];
  mainBranches: any[] = [];
  userBranch: any = null;
  filteredDepartments: any[] = [];
  allDepartments: any[] = [];
  attnUsers: any[] = [];
  mainBranchIds = [1, 5];
  approvalMode = false;
receivedSignature: string | null = null;
  // Signature properties
preparedSignature: string | null = null;
approvedSignature: string | null = null;
showSigModal = false;
sigModalTarget: string = '';
sigModalPosition = { x: 0, y: 0 };
isDraggingSigModal = false;
sigModalDragStart = { x: 0, y: 0 };
dragOverTarget: string | null = null;
private sigDrawing = false;
sigMode: Record<string, 'draw' | 'upload'> = { 
  'prepared': 'draw', 
  'approved': 'draw',
  'received': 'draw'
};
private isDragging = false;
private dragOffsetX = 0;
private dragOffsetY = 0;
private currentDragModal: HTMLElement | null = null;
sigSaved: Record<string, boolean> = { 
  'prepared': false, 
  'approved': false,
  'received': false
};
  joData: any = {
    request_from: '',
    attn: '',
    department_id: null,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5), // ✅ Auto-fill current time
    remarks: '',
    prepared_name: '',
    prepared_date: new Date().toISOString().split('T')[0],
    approved_name: '',
    approved_date: '',
    received_name: '',
    received_date: '',  
};  

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

 ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.editReqId = params['id'];
        
        // ✅ Check for approval mode
        if (params['mode'] === 'approve') {
          this.approvalMode = true;
        }
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
        this.loadJobOrder(params['id']);
      } else {
        this.joNumber = this.generateJONumber();
        this.loadBranchesAndDepartments();
        this.authService.currentUser$.subscribe((user: any) => {
          if (user) {
            this.joData.prepared_name = user.fullname || '';
            this.joData.request_from = user.department || user.dept || '';
            
            const role = (user.role || '').toLowerCase();
            if (role === 'head/manager' || role === 'supervisor' || role === 'branch manager') {
              this.joData.approved_name = user.fullname || '';
              this.joData.approved_date = new Date().toISOString().split('T')[0];
            }
          }
        });
      }
    });
}
  showToastMsg(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  get isMainBranch(): boolean {
    const user: any = this.authService.getCurrentUser();
    return !!(user && this.mainBranchIds.includes(Number(user.branch_id)));
  }

  get companyName(): string {
    if (this.userBranch?.company_name) return this.userBranch.company_name;
    if (this.userBranch?.name) return this.userBranch.name;
    return 'Lee Super Plaza';
  }

  get availableRecipientBranches(): any[] {
    const user: any = this.authService.getCurrentUser();
    const userBranchId = Number(user?.branch_id);
    if (this.mainBranchIds.includes(userBranchId)) {
      return this.mainBranches.filter(b => b.id !== userBranchId);
    }
    return this.mainBranches;
  }

  loadBranchesAndDepartments() {
    const user: any = this.authService.getCurrentUser();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.branches = branches || [];
        this.userBranch = this.branches.find(b => b.id == user?.branch_id);
        this.mainBranches = this.branches.filter(b => this.mainBranchIds.includes(b.id));
        
        this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
          next: (depts) => {
            this.allDepartments = (depts || []).map(d => {
              const branch = this.branches.find(b => b.id == d.branch_id);
              return {
                ...d,
                displayName: `${d.name} — ${branch?.name || 'Unknown'} (${branch?.company_name || ''})`,
                branch_name: branch?.name,
                company_name: branch?.company_name
              };
            });
            
            if (this.isMainBranch && user?.branch_id) {
              this.selectedBranchId = user.branch_id;
              this.filterDepartmentsByBranch(user.branch_id);
            } else {
              this.selectedBranchId = user?.branch_id || null;
              if (this.selectedBranchId) {
                this.filterDepartmentsByBranch(this.selectedBranchId);
              }
            }
            this.generateCtrlNumber();
          }
        });
      }
    });
  }

  // Signature methods
triggerSigFileInput(target: string): void {
  const fileInput = document.getElementById(target + 'FileInput') as HTMLInputElement;
  if (fileInput) fileInput.click();
}

onSigDragOver(event: DragEvent, target: string) {
  event.preventDefault(); event.stopPropagation();
  this.dragOverTarget = target;
}

onSigDragLeave(event: DragEvent) {
  event.preventDefault(); event.stopPropagation();
  this.dragOverTarget = null;
}

onSigDrop(event: DragEvent, target: string) {
  event.preventDefault(); event.stopPropagation();
  this.dragOverTarget = null;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) this.processSigFile(files[0], target);
}

processSigFile(file: File, target: string) {
  if (!file.type.startsWith('image/')) {
    this.showToastMsg('Please upload an image file.', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e: any) => {
    if (target === 'prepared') this.preparedSignature = e.target.result;
    if (target === 'approved') this.approvedSignature = e.target.result;
    if (target === 'received') this.receivedSignature = e.target.result;  // ✅ Add
    this.sigSaved[target] = true;
  };
  reader.readAsDataURL(file);
}

clearSignature(target: string) {
  if (target === 'prepared') { this.preparedSignature = null; this.sigMode['prepared'] = 'draw'; }
  if (target === 'approved') { this.approvedSignature = null; this.sigMode['approved'] = 'draw'; }
  if (target === 'received') { this.receivedSignature = null; this.sigMode['received'] = 'draw'; }  // ✅ Add
  this.sigSaved[target] = false;
}

saveSigCanvas(target: string) {
  const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
  if (canvas) {
    const dataUrl = canvas.toDataURL('image/png');
    if (target === 'prepared') this.preparedSignature = dataUrl;
    if (target === 'approved') this.approvedSignature = dataUrl;
    if (target === 'received') this.receivedSignature = dataUrl;  // ✅ Add
    this.sigSaved[target] = true;
  }
}
setSigMode(target: string, mode: 'draw' | 'upload') { this.sigMode[target] = mode; }

openSigModal(target: string) {
  this.sigModalTarget = target;
  this.showSigModal = true;
  this.sigModalPosition = { x: 0, y: 0 };
  setTimeout(() => {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; }
    }
  }, 100);
}

closeSigModal() { this.showSigModal = false; this.sigDrawing = false; }

startSigDraw(event: any, target: string) {
  event.preventDefault(); this.sigDrawing = true;
  const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.touches?.[0]?.clientX || event.clientX) - rect.left;
  const y = (event.touches?.[0]?.clientY || event.clientY) - rect.top;
  const ctx = canvas.getContext('2d');
  if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
}

drawSig(event: any, target: string) {
  if (!this.sigDrawing) return;
  event.preventDefault();
  const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.touches?.[0]?.clientX || event.clientX) - rect.left;
  const y = (event.touches?.[0]?.clientY || event.clientY) - rect.top;
  const ctx = canvas.getContext('2d');
  if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
}

stopSigDraw() { this.sigDrawing = false; }

clearSigCanvas(target: string) {
  const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
  if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
  this.sigSaved[target] = false;
}

handleSigFile(event: any, target: string) {
  const file = event.target.files?.[0];
  if (file) this.processSigFile(file, target);
}

startSigModalDrag(event: MouseEvent) {
  this.isDraggingSigModal = true;
  this.sigModalDragStart = {
    x: event.clientX - this.sigModalPosition.x,
    y: event.clientY - this.sigModalPosition.y
  };
  event.preventDefault();
}

onSigModalDrag(event: MouseEvent) {
  if (!this.isDraggingSigModal) return;
  event.preventDefault();
  this.sigModalPosition = {
    x: event.clientX - this.sigModalDragStart.x,
    y: event.clientY - this.sigModalDragStart.y
  };
}

stopSigModalDrag() { this.isDraggingSigModal = false; }
  onBranchChange() {
    if (this.selectedBranchId) {
      this.filterDepartmentsByBranch(this.selectedBranchId);
      this.joData.department_id = null;
      this.joData.attn = '';
      this.attnUsers = [];
    }
    this.generateCtrlNumber();
  }
startDrag(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.modal-titlebar')) return;
  
  const modal = target.closest('.modal-window') as HTMLElement;
  if (!modal) return;
  
  this.isDragging = true;
  this.currentDragModal = modal;
  
  const rect = modal.getBoundingClientRect();
  this.dragOffsetX = event.clientX - rect.left;
  this.dragOffsetY = event.clientY - rect.top;
  
  modal.style.position = 'fixed';
  modal.style.cursor = 'grabbing';
  modal.style.transition = 'none';
  modal.style.left = rect.left + 'px';
  modal.style.top = rect.top + 'px';
  modal.style.transform = 'none';
  event.preventDefault();
}

onDragMove(event: MouseEvent) {
  if (!this.isDragging || !this.currentDragModal) return;
  
  const x = event.clientX - this.dragOffsetX;
  const y = event.clientY - this.dragOffsetY;
  
  this.currentDragModal.style.left = x + 'px';
  this.currentDragModal.style.top = y + 'px';
}

onDragEnd() {
  if (this.currentDragModal) {
    this.currentDragModal.style.cursor = '';
  }
  this.isDragging = false;
  this.currentDragModal = null;
}
  filterDepartmentsByBranch(branchId: number) {
    this.filteredDepartments = this.allDepartments.filter(d => d.branch_id == branchId);
    if (this.filteredDepartments.length > 0 && !this.joData.department_id) {
      this.joData.department_id = this.filteredDepartments[0].id;
      this.onDepartmentChange();
    }
  }

  onDepartmentChange() {
    if (!this.joData.department_id) {
      this.attnUsers = [];
      return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const selectedDept = this.filteredDepartments.find(d => d.id == this.joData.department_id);
    const deptBranchId = selectedDept?.branch_id;
    const deptId = selectedDept?.id;
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
      next: (users) => {
        this.attnUsers = (users || []).filter(u => {
          const userBranchId = Number(u.branch_id);
          const userDeptId = Number(u.department_id);
          const matchBranch = userBranchId === Number(deptBranchId);
          const matchDept = !deptId || userDeptId === Number(deptId);
          const role = (u.role || '').toLowerCase();
          const matchRole = role === 'head/manager' || role === 'supervisor';
          return matchBranch && matchDept && matchRole;
        });
        
        if (this.attnUsers.length > 0 && !this.joData.attn) {
          this.joData.attn = this.attnUsers[0].fullname || this.attnUsers[0].username;
        }
      },
      error: () => { this.attnUsers = []; }
    });
    this.generateCtrlNumber();
  }

  generateCtrlNumber(): string {
    let branchCode = 'BR';
    let deptCode = 'DP';
    
    if (this.selectedBranchId) {
      const branch = this.branches.find(b => b.id == this.selectedBranchId);
      if (branch?.name) {
        branchCode = branch.name.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
      }
    }
    
    if (this.joData.department_id) {
      const dept = this.filteredDepartments.find(d => d.id == this.joData.department_id);
      if (dept?.name) {
        deptCode = dept.name.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
      }
    }
    
    this.joCtrlNumber = `JO-${branchCode}-${deptCode}-001`;
    return this.joCtrlNumber;
  }

  generateJONumber(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    let branchCode = 'BRC';
    let deptCode = 'DEPT';
    
    if (this.selectedBranchId) {
      const branch = this.branches.find(b => b.id == this.selectedBranchId);
      if (branch?.name) branchCode = branch.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    }
    
    if (this.joData.department_id) {
      const dept = this.filteredDepartments.find(d => d.id == this.joData.department_id);
      if (dept?.name) deptCode = dept.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    }
    
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `JO-${branchCode}-${deptCode}-${datePart}-${random}`;
  }
submitJobOrder() {
    // ✅ Approval mode - receive the job order
    if (this.approvalMode) {
      if (!this.joData.received_name) {
        this.showToastMsg('Please fill in Received By name.', 'warning');
        return;
      }
      if (!this.joData.received_date) {
        this.showToastMsg('Please fill in Received By date.', 'warning');
        return;
      }
      if (!this.receivedSignature) {
        this.showToastMsg('Please provide Received By signature.', 'warning');
        return;
      }

      this.submitting = true;
      const payload = {
        received_name: this.joData.received_name,
        received_date: this.joData.received_date,
        received_signature: this.receivedSignature,
        status: 'approved'
      };

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const url = `${environment.apiUrl}/api/job-orders/${this.editReqId}/receive`;

      this.http.put(url, payload, { headers }).subscribe({
        next: () => {
          this.submitting = false;
          this.showToastMsg('📥 Job Order received!', 'success');
          this.router.navigate(['/client/job-orders']);
        },
        error: (err) => {
          this.submitting = false;
          this.showToastMsg('⚠️ Failed to receive job order', 'error');
        }
      });
      return;
    }
    
    // ✅ Required fields validation (for new/edit mode)
    if (!this.joData.request_from) {
      this.showToastMsg('Please fill in Request From.', 'warning');
      return;
    }
    if (!this.selectedBranchId) {
      this.showToastMsg('Please select a Recipient Branch.', 'warning');
      return;
    }
    if (!this.joData.department_id) {
      this.showToastMsg('Please select a Recipient Department.', 'warning');
      return;
    }
    if (!this.joData.date) {
      this.showToastMsg('Please select a Date.', 'warning');
      return;
    }
    if (!this.joData.time) {
      this.showToastMsg('Please fill in Time.', 'warning');
      return;
    }
    if (!this.joData.remarks || !this.joData.remarks.trim()) {
      this.showToastMsg('Please fill in Work Description / Remarks.', 'warning');
      return;
    }
    if (!this.joData.prepared_name) {
      this.showToastMsg('Please fill in Requested By name.', 'warning');
      return;
    }
    if (!this.joData.prepared_date) {
      this.showToastMsg('Please fill in Requested By date.', 'warning');
      return;
    }
    if (!this.preparedSignature) {
      this.showToastMsg('Please provide Requested By signature.', 'warning');
      return;
    }

    // ✅ Only require Approved By for Head/Manager/Branch Manager
    const currentUser = this.authService.getCurrentUser();
    const role = (currentUser?.role || '').toLowerCase();
    const isHeadOrManager = role === 'head/manager' || role === 'branch manager';

    if (isHeadOrManager) {
      if (!this.joData.approved_name) {
        this.showToastMsg('Please fill in Approved By name.', 'warning');
        return;
      }
      if (!this.joData.approved_date) {
        this.showToastMsg('Please fill in Approved By date.', 'warning');
        return;
      }
      if (!this.approvedSignature) {
        this.showToastMsg('Please provide Approved By signature.', 'warning');
        return;
      }
    }

    this.submitting = true;

  const payload: any = {
    job_order_number: this.joNumber,
    ctrl_no: this.joCtrlNumber,
    date: this.joData.date,
    time: this.joData.time,
    request_dept: this.joData.request_from,
    department: this.getDepartmentNameForSubmission(this.joData.department_id),
    branch_id: this.selectedBranchId,
    department_id: this.joData.department_id,
    particulars: this.joData.remarks,
    job_order_for: this.joData.attn,
    requested_name: this.joData.prepared_name,
    requested_date: this.joData.prepared_date,  // ✅ Already correct
    requested_signature: this.preparedSignature,
    approved_name: this.joData.approved_name || null,
    approved_date: this.joData.approved_date || null,  // ✅ ADD THIS
    approved_signature: this.approvedSignature || null,
    submitted_by: this.authService.getCurrentUser()?.id || null,
};

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const url = this.editMode && this.editReqId 
      ? `${environment.apiUrl}/api/job-orders/${this.editReqId}`
      : `${environment.apiUrl}/api/job-orders`;

    const request = this.editMode 
      ? this.http.put(url, payload, { headers })
      : this.http.post(url, payload, { headers });

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.showToastMsg(this.editMode ? '✅ Job Order updated!' : '✅ Job Order submitted!', 'success');
        this.router.navigate(['/client/job-orders']);
      },
      error: (err) => {
        this.submitting = false;
        const errorMsg = err.error?.error || err.message || 'Unknown error';
        this.showToastMsg(`⚠️ Failed: ${errorMsg}`, 'error');
      }
    });
}
getDepartmentNameForSubmission(deptId: number): string {
  if (!deptId) return '';
  const dept = this.filteredDepartments.find(d => d.id == deptId);
  return dept?.name || dept?.displayName || '';
}
 loadJobOrder(id: string) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any>(`${environment.apiUrl}/api/job-orders/${id}`, { headers }).subscribe({
      next: (data) => {
        const jo = Array.isArray(data) ? data[0] : data;
        if (!jo) return;
        
        this.joNumber = jo.job_order_number || '';
        this.joCtrlNumber = jo.ctrl_no || '';
        this.selectedBranchId = jo.branch_id || null;
        
        // ✅ Parse dates properly - handle ISO strings, null, and date-only strings
        const parseDate = (val: any): string => {
          if (!val) return '';
          try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
          } catch { return ''; }
        };
        
        this.joData = {
          request_from: jo.request_dept || '',
          attn: jo.job_order_for || '',
          department_id: jo.department_id || null,
          date: parseDate(jo.date) || new Date().toISOString().split('T')[0],
          time: jo.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
          remarks: jo.particulars || '',
          prepared_name: jo.requested_name || '',
          prepared_date: parseDate(jo.requested_date) || new Date().toISOString().split('T')[0],
          approved_name: jo.approved_name || '',
          approved_date: parseDate(jo.approved_date) || '',  // ✅ Load approved_date
          received_name: jo.received_name || '',
          received_date: parseDate(jo.received_date) || '',  // ✅ Load received_date
        };
        
        // Load signatures
        this.preparedSignature = jo.requested_signature || null;
        this.approvedSignature = jo.approved_signature || null;
        this.receivedSignature = jo.received_signature || null;
        
        if (this.preparedSignature) { this.sigSaved['prepared'] = true; this.sigMode['prepared'] = 'upload'; }
        if (this.approvedSignature) { this.sigSaved['approved'] = true; this.sigMode['approved'] = 'upload'; }
        if (this.receivedSignature) { this.sigSaved['received'] = true; this.sigMode['received'] = 'upload'; }
        
        // ✅ Auto-fill Received By for approval mode
        if (this.approvalMode) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            this.joData.received_name = this.joData.received_name || currentUser.fullname || '';
            this.joData.received_date = this.joData.received_date || new Date().toISOString().split('T')[0];
          }
        }
        
        this.loadBranchesAndDepartmentsForEdit(jo.branch_id, jo.department_id);
      },
      error: (err) => {
        console.error('Failed to load job order:', err);
      }
    });
}

  loadBranchesAndDepartmentsForEdit(branchId: number | null, deptId: number | null) {
    const user: any = this.authService.getCurrentUser();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.branches = branches || [];
        this.userBranch = this.branches.find(b => b.id == user?.branch_id);
        this.mainBranches = this.branches.filter(b => this.mainBranchIds.includes(b.id));
        
        this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
          next: (depts) => {
            this.allDepartments = (depts || []).map(d => {
              const branch = this.branches.find(b => b.id == d.branch_id);
              return { ...d, displayName: `${d.name} — ${branch?.name || 'Unknown'} (${branch?.company_name || ''})`, branch_name: branch?.name, company_name: branch?.company_name };
            });
            
            if (branchId) {
              this.selectedBranchId = branchId;
              this.filterDepartmentsByBranch(branchId);
              setTimeout(() => {
                if (deptId) {
                  this.joData.department_id = deptId;
                  if (this.filteredDepartments.some(d => d.id == deptId)) {
                    this.onDepartmentChange();
                  }
                }
              }, 100);
            }
          }
        });
      }
    });
  }

  printForm() {
    window.print();
  }

  cancel() {
    this.router.navigate(['/client/job-orders']);
  }
}