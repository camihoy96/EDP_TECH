import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ClientNotificationService } from '../../services/client-notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-client-requisition-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="req-container">
     <div class="req-header">
    <div class="header-left">
      <h1>{{ approvalMode ? '✅ Accept Requisition' : editMode ? '✏️ Edit Requisition' : '📩 Requisition Form' }}</h1>
      <span class="header-sub">{{ approvalMode ? 'Fill in items Requested by details and signature' : editMode ? 'Update your requisition request' : 'Submit a requisition for items/equipment' }}</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="close-btn" (click)="cancel()" title="Close">✕</button>
    </div>
</div>

      <div class="req-form" id="print-section">
       <div class="req-form-header">
  <h2>{{ companyName }}</h2>
  <div style="font-size:10px;color:#555;" *ngIf="userBranch?.name">
    🏢 {{ userBranch.name }}
  </div>
  <h3>REQUISITION FORM</h3>
  <div class="ctrl-no">CTRL NO.: EDR-30</div>
</div>

       <div class="req-top-row">
  <div class="field-row">
    <label>Request From:</label>
    <input type="text" [(ngModel)]="reqData.request_from" class="req-input" readonly>
  </div>
  
 <!-- Branch Selection -->
<div class="field-row">
  <label>Recipient:</label>
  <select [(ngModel)]="selectedBranchId" class="req-input" (change)="onBranchChange()" [disabled]="isRecipientEdit">
    <option value="">— Select Branch —</option>
    <option [value]="userBranch?.id" *ngIf="userBranch">
      🏢 {{ userBranch?.name }} <small>({{ userBranch?.company_name }})</small> - Your Branch
    </option>
    <option *ngFor="let branch of availableRecipientBranches" [value]="branch.id">
      🏛️ {{ branch.name }} <small>({{ branch.company_name }})</small>
    </option>
  </select>
</div>

<!-- Department Selection - readonly for recipient edit -->
<div class="field-row">
  <label>Dept:</label>
  <select [(ngModel)]="reqData.department_id" class="req-input" (change)="onDepartmentChange()" [disabled]="isRecipientEdit">
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
    <select [(ngModel)]="reqData.attn" class="req-input">
      <option value="">— Auto from department —</option>
      <option *ngFor="let user of attnUsers" [value]="user.fullname || user.username">
        {{ user.fullname || user.username }} ({{ user.role }})
      </option>
    </select>
  </div>
 <div class="field-row">
    <label>Date:</label>
    <input type="date" [(ngModel)]="reqData.date" class="req-input" readonly>
    <input type="time" [(ngModel)]="reqData.time" class="req-input" style="max-width: 120px;" readonly>
</div>
</div>
        <div class="req-section">
          <label>Remarks / Reason:</label>
          <textarea [(ngModel)]="reqData.remarks" class="req-textarea" rows="3" 
                    placeholder="Reason for this requisition..." [readonly]="approvalMode"></textarea>
        </div>

        <!-- Items Table -->
        <div class="req-section">
          <div class="items-header">
            <h4>Itemized Table</h4>
            <button type="button" class="add-item-btn" (click)="addItem()" *ngIf="!approvalMode">➕ Add Item</button>
          </div>
          <table class="items-table">
            <thead>
              <tr><th>Qty</th><th>Item</th><th>Unit Price</th><th>Total</th><th *ngIf="!approvalMode"></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items; let i = index">
                <td><input type="number" [(ngModel)]="item.qty" class="item-input" min="1" style="width:60px" [readonly]="approvalMode"></td>
                <td><input type="text" [(ngModel)]="item.item" class="item-input" placeholder="Item description" [readonly]="approvalMode"></td>
                <td><input type="number" [(ngModel)]="item.unit_price" class="item-input" step="0.01" style="width:100px" [readonly]="approvalMode"></td>
                <td class="item-total">{{ (item.qty || 0) * (item.unit_price || 0) | number:'1.2-2' }}</td>
                <td *ngIf="!approvalMode"><button type="button" class="remove-item-btn" (click)="removeItem(i)">✕</button></td>
              </tr>
              <tr *ngIf="items.length === 0">
                <td [attr.colspan]="approvalMode ? 4 : 5" class="empty-items">No items added yet</td>
              </tr>
              <tr *ngIf="items.length > 0" class="grand-total-row">
                <td colspan="3" class="grand-total-label">Grand Total:</td>
                <td class="grand-total-value">{{ grandTotal | number:'1.2-2' }}</td>
                <td *ngIf="!approvalMode"></td>
              </tr>
            </tbody>
          </table>
        </div>
<!-- Signatures -->
<div class="req-signatures">
  <!-- Form Requested By - Client: fillable, Admin: readonly -->
  <div class="sig-block" [class.readonly]="approvalMode">
    <h5>Form Requested By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="reqData.prepared_name" class="req-input-sm" placeholder="Your name" [readonly]="approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="reqData.prepared_date" class="req-input-sm" [readonly]="approvalMode">
    </div>   
    <ng-container *ngIf="!approvalMode">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['prepared'] === 'draw'" (click)="setSigMode('prepared', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['prepared'] === 'upload'" (click)="setSigMode('prepared', 'upload')">📁 Upload</button>
      </div> 
      <!-- Draw Mode - Opens Modal -->
      <div class="sig-draw-area" *ngIf="sigMode['prepared'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('prepared')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
      </div>
      <!-- Upload Mode -->
      <div class="sig-upload" *ngIf="sigMode['prepared'] === 'upload'"
           [class.has-file]="preparedSignature"
           [class.drag-over]="dragOverTarget === 'prepared'"
           (dragover)="onSigDragOver($event, 'prepared')"
           (dragleave)="onSigDragLeave($event)"
           (drop)="onSigDrop($event, 'prepared')">
        <div class="sig-preview" *ngIf="preparedSignature; else noPrepSig">
          <img [src]="preparedSignature" alt="Signature" class="sig-image">
          <button type="button" class="sig-clear" (click)="clearSignature('prepared')">✕</button>
        </div>
        <ng-template #noPrepSig>
          <div class="sig-placeholder" (click)="triggerSigFileInput('prepared')">
            <span class="sig-icon">📁</span>
            <span>Drop signature or click to upload</span>
            <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'prepared')" id="preparedFileInput">
          </div>
        </ng-template>
      </div>
    </ng-container>
    <!-- Saved Signature Preview -->
    <div class="sig-saved-preview" *ngIf="preparedSignature && sigSaved['prepared']">
      <img [src]="preparedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('prepared')" *ngIf="!approvalMode">✕</button>
    </div>
  </div>

  <!-- Form Approved By - Client: fillable, Admin: readonly -->
  <div class="sig-block" [class.readonly]="approvalMode || !canApprove()">
    <h5>Form Approved By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="reqData.approved_name" class="req-input-sm" placeholder="Approver name" [readonly]="approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="reqData.approved_date" class="req-input-sm" [readonly]="approvalMode">
    </div>
    
    <ng-container *ngIf="!approvalMode">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'draw'" (click)="setSigMode('approved', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['approved'] === 'upload'" (click)="setSigMode('approved', 'upload')">📁 Upload</button>
      </div>
      
      <!-- Draw Mode - Opens Modal -->
      <div class="sig-draw-area" *ngIf="sigMode['approved'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('approved')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
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
          <div class="sig-placeholder" (click)="triggerSigFileInput('approved')">
            <span class="sig-icon">📁</span>
            <span>Drop signature or click to upload</span>
            <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'approved')" id="approvedFileInput">
          </div>
        </ng-template>
      </div>
    </ng-container>
    
    <!-- Saved Signature Preview -->
    <div class="sig-saved-preview" *ngIf="approvedSignature && sigSaved['approved']">
      <img [src]="approvedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('approved')" *ngIf="!approvalMode">✕</button>
    </div>
  </div>

  <!-- Form Received By - Client: readonly, Admin: fillable -->
  <div class="sig-block" [class.readonly]="!approvalMode">
    <h5>Form Received By:</h5>
    <div class="sig-field">
      <label>Name:</label>
      <input type="text" [(ngModel)]="reqData.items_prepared_name" class="req-input-sm" placeholder="Name" [readonly]="!approvalMode">
    </div>
    <div class="sig-field">
      <label>Date:</label>
      <input type="date" [(ngModel)]="reqData.items_prepared_date" class="req-input-sm" [readonly]="!approvalMode">
    </div>
    
    <ng-container *ngIf="approvalMode">
      <div class="sig-options">
        <button type="button" class="sig-option-btn" [class.active]="sigMode['items_prepared'] === 'draw'" (click)="setSigMode('items_prepared', 'draw')">✍️ Draw</button>
        <button type="button" class="sig-option-btn" [class.active]="sigMode['items_prepared'] === 'upload'" (click)="setSigMode('items_prepared', 'upload')">📁 Upload</button>
      </div>
      
      <!-- Draw Mode - Opens Modal -->
      <div class="sig-draw-area" *ngIf="sigMode['items_prepared'] === 'draw'">
        <button type="button" class="sig-draw-trigger" (click)="openSigModal('items_prepared')">
          <span class="sig-draw-icon">✍️</span>
          <span>Click to Draw Signature</span>
        </button>
      </div>
      
      <!-- Upload Mode -->
      <div class="sig-upload" *ngIf="sigMode['items_prepared'] === 'upload'"
           [class.has-file]="itemsPreparedSignature"
           [class.drag-over]="dragOverTarget === 'items_prepared'"
           (dragover)="onSigDragOver($event, 'items_prepared')"
           (dragleave)="onSigDragLeave($event)"
           (drop)="onSigDrop($event, 'items_prepared')">
        <div class="sig-preview" *ngIf="itemsPreparedSignature; else noItemsPrepSig">
          <img [src]="itemsPreparedSignature" alt="Signature" class="sig-image">
          <button type="button" class="sig-clear" (click)="clearSignature('items_prepared')">✕</button>
        </div>
        <ng-template #noItemsPrepSig>
          <div class="sig-placeholder" (click)="triggerSigFileInput('items_prepared')">
            <span class="sig-icon">📁</span>
            <span>Drop signature or click to upload</span>
            <input type="file" hidden accept="image/*" (change)="handleSigFile($event, 'items_prepared')" id="itemsPreparedFileInput">
          </div>
        </ng-template>
      </div>
    </ng-container>
    
    <!-- Saved Signature Preview -->
    <div class="sig-saved-preview" *ngIf="itemsPreparedSignature && sigSaved['items_prepared']">
      <img [src]="itemsPreparedSignature" alt="Signature" class="sig-image-small">
      <span class="sig-saved-label">✓ Signature</span>
      <button type="button" class="sig-clear" (click)="clearSignature('items_prepared')" *ngIf="approvalMode">✕</button>
    </div>
  </div>
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
        <!-- Returned By (only for borrow) -->
        <div class="req-section" *ngIf="reqData.request_from === 'BORROW'">
          <h4>Items (For borrowed items only) Returned By:</h4>
          <div class="sig-block">
            <div class="sig-field">
              <label>Name:</label>
              <input type="text" [(ngModel)]="reqData.returned_name" class="req-input-sm" placeholder="Name">
            </div>
            <div class="sig-field">
              <label>Date:</label>
              <input type="date" [(ngModel)]="reqData.returned_date" class="req-input-sm">
            </div>
          </div>
        </div>

        <div class="req-footer">
          <p>📋 Leave R.F. to floor supervisor when BORROWING items, include expected date of return.</p>
          <p>For Outside purchase: indicate if P.O. was made or paid by cash.</p>
          <p>EDPtech Helpdesk v2.0 | Requisition #{{ reqNumber }}</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="action-btn cancel" (click)="cancel()">✕ Cancel</button>
        <button class="action-btn submit" (click)="submitRequisition()" [disabled]="submitting">
          {{ submitting ? 'Saving...' : (approvalMode ? '✅ Accept Requisition' : editMode ? '💾 Update' : '✅ Submit Requisition') }}
        </button>
      </div>
    </div>
    <!-- Toast Notification -->
<div class="toast-notification" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'" [class.warning]="toastType === 'warning'">
  <span>{{ toastMessage }}</span>
</div>
  `,
  styles: [`
    .req-container { padding: 16px; max-width: 1500px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; font-size: 12px; background: #d4d0c8; min-height: 100vh; }
    .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 8px 14px; background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .header-left h1 { margin: 0; font-size: 16px; }
    .header-sub { font-size: 12px; opacity: 0.8; }
    .print-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 4px 12px; cursor: pointer; font-size: 12px; }
    .req-form { background: white; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 20px; font-family: 'Courier New', monospace; }
    .req-form-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .req-form-header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #0a246a; }
    .req-form-header h3 { margin: 4px 0; font-size: 14px; color: #04060c; }
    .ctrl-no { font-size: 12px; color: #cc0000; font-weight: bold; }
    .req-top-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .field-row { display: flex; align-items: center; gap: 4px; }
    .field-row label { font-weight: bold; font-size: 12px; white-space: nowrap; color: #0f0e0e; }
    .req-input { flex: 1; padding: 4px 6px; border: 1px solid #888; font-size: 12px; color: #0f0e0e; font-family: 'Courier New', monospace; }
    .req-textarea { width: 100%; padding: 6px; border: 1px solid #888; font-size: 12px; font-family: 'Courier New', monospace; resize: vertical; box-sizing: border-box; }
    .req-section { margin-bottom: 12px; color: #0f0e0e; font-weight: bold; }
    .req-section h4 { font-size: 12px; margin: 0 0 6px 0; color: #000000; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .add-item-btn { background: #0a3a8c; color: white; border: 1px solid #042070; padding: 3px 10px; cursor: pointer; font-size: 12px; border-radius: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .items-table th { background: #f0f4f8; padding: 6px 8px; font-size: 12px; border: 1px solid #ccc; text-align: left; }
    .items-table td { padding: 4px 6px; border: 1px solid #eee; }
    .item-input { padding: 3px 5px; border: 1px solid #ccc; font-size: 12px; font-family: 'Courier New', monospace; width: 100%; box-sizing: border-box; }
    .item-total { font-weight: bold; text-align: right; }
    .remove-item-btn { background: none; border: none; color: #cc0000; cursor: pointer; font-size: 12px; }
    .empty-items { text-align: center; color: #888; padding: 12px; font-style: italic; }
    .grand-total-row { background: #f0f4f8; font-weight: bold; }
    .grand-total-label { text-align: right; padding: 6px; }
    .grand-total-value { text-align: right; padding: 6px; font-size: 12px; color: #0a3a8c; }
    .req-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .sig-block { border: 1px solid #ccc; padding: 8px; background: #fafafa; }
    .sig-block h5 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sig-field { display: flex; align-items: center; margin-bottom: 3px; }
    .sig-field label { width: 30px; font-size: 12px; font-weight: bold; color: #0f0e0e; }
    .sig-options { display: flex; gap: 4px; margin: 4px 0; }
    .sig-option-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 12px; border-radius: 2px; }
    .sig-option-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .sig-canvas { border: 1px solid #ccc; background: #fff; cursor: crosshair; display: block; width: 100%; }
    .sig-canvas-actions { display: flex; gap: 4px; margin-top: 4px; }
    .sig-sm-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f0f0f0; cursor: pointer; font-size: 12px; }
    .sig-sm-btn.save { background: #008800; color: white; }
    .sig-upload { border: 1px dashed #ccc; padding: 8px; text-align: center; margin-top: 4px; }
    .sig-saved-preview { display: flex; align-items: center; gap: 6px; margin-top: 4px; padding: 4px; background: #f0fff0; border: 1px solid #88cc88; border-radius: 3px; font-size: 12px; }
    .sig-image-small { max-width: 80px; max-height: 30px; }
    .req-footer { align-items: center; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .req-footer p { margin: 2px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .action-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
    .action-btn.cancel { background: #f0f0f0; color: #000; }
    .action-btn.submit { background: #0a3a8c; color: white; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sig-upload.drag-over { border-color: #0a3a8c; border-style: solid; background: #e8f0ff; box-shadow: 0 0 0 3px rgba(10,36,106,0.15); }
    .sig-upload-placeholder { padding: 12px; text-align: center; cursor: pointer; }
    .sig-clear { background: rgba(204,0,0,0.8); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; padding: 1px 4px; margin-left: 6px; }
    .sig-block.readonly { opacity: 0.8; pointer-events: none; }
    .sig-upload.has-file {
  border-style: solid;
  border-color: #008800;
}
  .close-btn { 
  background: rgba(255,255,255,0.2); 
  border: 1px solid rgba(255,255,255,0.4); 
  color: white; 
  cursor: pointer; 
  padding: 4px 10px; 
  font-size: 14px; 
  font-weight: bold;
  border-radius: 0px;
  line-height: 1;
}
.close-btn:hover { 
  background: rgba(255,0,0,0.7); 
  border-color: rgba(255,255,255,0.6);
}
  .sig-draw-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 2px dashed #ccc;
  background: #fafafa;
  cursor: pointer;
  width: 100%;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}
.sig-draw-trigger:hover {
  border-color: #0a3a8c;
  background: #e8f0ff;
  color: #0a3a8c;
}
.sig-draw-icon { font-size: 24px; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.sig-modal {
  background: white;
  border: 2px solid #808080;
  box-shadow: 3px 4px 14px rgba(0,0,0,0.3);
  width: 800px;
  max-width: 95vw;
  position: relative;
  user-select: none;
}
.sig-modal-header {
  background: linear-gradient(180deg, #1c5fb5, #0a3a8c);
  color: white;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}
.sig-modal-close {
  background: none;
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 10px;
  line-height: 1;
}
.sig-modal-close:hover {
  background: rgba(255,0,0,0.7);
}
.sig-modal-body {
  padding: 20px;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
}
.sig-modal-canvas {
  border: 2px solid #ccc;
  background: white;
  cursor: crosshair;
  display: block;
  width: 750px;
  height: 300px;
  touch-action: none;
}
.sig-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #ddd;
  background: #fafafa;
}
.sig-modal-btn {
  padding: 8px 20px;
  border: 2px solid;
  border-color: #fff #808080 #808080 #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  border-radius: 3px;
}
.sig-modal-btn.clear { background: #f0f0f0; color: #cc0000; }
.sig-modal-btn.cancel { background: #f0f0f0; color: #000; }
.sig-modal-btn.save { background: #008800; color: white; border-color: #00aa00 #006600 #006600 #00aa00; }
.sig-modal-btn:hover { filter: brightness(0.95); }
  .req-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #888;
  font-size: 12px;
  color: #0f0e0e;
  font-family: 'Courier New', monospace;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.req-input option {
  font-size: 12px;
  padding: 2px 4px;
}

.req-input option small {
  font-size: 12px;
  color: #666;
}
.sig-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  font-size: 12px;
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
  .req-input:disabled {
  background: #e8e8e8;
  color: #666;
  cursor: not-allowed;
}
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
  font-size: 12px;
  color: #008800;
  font-weight: bold;
}
  .toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #333;
  color: white;
  padding: 10px 18px;
  border-radius: 6px;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 3000;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.toast-notification.show {
  transform: translateY(0);
  opacity: 1;
}
.toast-notification.success { background: #008800; }
.toast-notification.error { background: #cc0000; }
.toast-notification.warning { background: #cc6600; }
  `]
})
export class ClientRequisitionFormComponent implements OnInit {
  submitting = false;
  editMode = false;
  approvalMode = false;
  editReqId: string | null = null;
  reqNumber: string = '';
  private sigDrawing = false;
  adminUsers: any[] = [];
  showToast = false;
  showSigModal = false;
sigModalTarget: string = '';
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
 reqData: any = {  // ✅ Change to 'any' type
    request_from: '',
    attn: '',
    department_id: null,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(':').slice(0, 2).join(':'),
    remarks: '',
    prepared_name: '',
    prepared_date: new Date().toISOString().split('T')[0],
    approved_name: '',
    approved_date: '',
    items_prepared_name: '',
    items_prepared_date: '',
    returned_name: '',
    returned_date: ''
    
};
sigModalPosition = { x: 0, y: 0 };
isDraggingSigModal = false;
sigModalDragStart = { x: 0, y: 0 };
  items: any[] = [];
  
  preparedSignature: string | null = null;
  approvedSignature: string | null = null;
  itemsPreparedSignature: string | null = null;
  
  sigMode: Record<string, 'draw' | 'upload'> = { 
    'prepared': 'draw', 
    'approved': 'draw',
    'items_prepared': 'draw'
  };
  
  sigSaved: Record<string, boolean> = { 
    'prepared': false, 
    'approved': false,
    'items_prepared': false
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private clientNotificationService: ClientNotificationService  // ✅ ADD THIS
  ) {}
ngOnInit() {
    // Load admin users for the ATTN dropdown (always)
    this.loadAdminUsers();
    
    // Check if in approval mode first
    const url = this.router.url;
    if (url.includes('/approve')) {
      this.approvalMode = true;
      this.editMode = true;
    }

    // Check for edit mode via query param FIRST
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.editReqId = params['id'];
        
        // ✅ Check for approval mode via query param
        if (params['mode'] === 'approve') {
          this.approvalMode = true;
        }
        
        // DON'T call loadBranchesAndDepartments() here
        this.loadRequisition(params['id']);
      } else {
        // Only generate new reqNumber for new requisitions
         this.reqNumber = this.generateReqNumber();
        this.loadBranchesAndDepartments();
        this.authService.currentUser$.subscribe((user: any) => {
          if (user) {
            this.reqData.prepared_name = user.fullname || '';
            this.reqData.request_from = user.department || user.dept || '';

            // ✅ INSERT THE NEW CODE HERE
            if (!this.editMode && !this.approvalMode) {
              const role = (user.role || '').toLowerCase();
              if (role === 'head/manager' || role === 'supervisor') {
                this.reqData.approved_name = user.fullname || '';
                this.reqData.approved_date = new Date().toISOString().split('T')[0];
              }
            }
          }
        });
      }
    });
  }
  triggerSigFileInput(target: string): void {
  const fileInput = document.getElementById(target + 'FileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
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
    if (this.userBranch?.company_name) {
        return this.userBranch.company_name;
    }
    if (this.userBranch?.name) {
        return this.userBranch.name;
    }
    return 'Lee Super Plaza'; // fallback
}
loadBranchesAndDepartments() {
   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  const user: any = this.authService.getCurrentUser();
  
  // Load branches
   this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
    next: (branches) => {
      this.branches = branches || [];
      this.userBranch = this.branches.find(b => b.id == user?.branch_id);
      this.mainBranches = this.branches.filter(b => this.mainBranchIds.includes(b.id));
      
      // Load departments
      this.http.get<any[]>(`${environment.apiUrl}/api/public/departments`).subscribe({
        next: (depts) => {
          this.allDepartments = (depts || []).map(d => {
            const branch = this.branches.find(b => b.id == d.branch_id);
            return {
              ...d,
              displayName: `${d.name} (${branch?.name || 'Unknown'})`,
              branch_name: branch?.name
            };
          });
          
          // Filter EDP/IT departments only
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
            // Main branch users: show only their branch departments
            this.selectedBranchId = user.branch_id;
            this.filterDepartmentsByBranch(user.branch_id);
          } else {
            // Non-main branch: default to user's branch
            this.selectedBranchId = user?.branch_id || null;
            if (this.selectedBranchId) {
              this.filterDepartmentsByBranch(this.selectedBranchId);
            }
          }
        }
      });
    }
  });
}

onBranchChange() {
  if (this.selectedBranchId) {
    this.filterDepartmentsByBranch(this.selectedBranchId);
    this.reqData.department_id = null;
    this.reqData.attn = '';
    this.attnUsers = [];
  }
}
filterDepartmentsByBranch(branchId: number) {
  this.filteredDepartments = this.allDepartments.filter(d => d.branch_id == branchId);
  
  // Auto-select first department
  if (this.filteredDepartments.length > 0 && !this.reqData.department_id) {
    this.reqData.department_id = this.filteredDepartments[0].id;
    this.onDepartmentChange();
  }
}

onDepartmentChange() {
    if (!this.reqData.department_id) {
        this.attnUsers = [];
        return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const selectedDept = this.filteredDepartments.find(d => d.id == this.reqData.department_id);
    const deptBranchId = selectedDept?.branch_id;
    const deptId = selectedDept?.id;
    
    console.log('🔍 Loading ATTN users for client - dept:', deptId, 'branch:', deptBranchId);
    
    // ✅ Use the CLIENT endpoint to get users by department
    this.http.get<any[]>(`${environment.apiUrl}/api/client/users/by-dept/${deptId}`, { headers }).subscribe({
        next: (users) => {
            console.log('📥 Received', users?.length, 'users from client API');
            
            // Filter by branch and role
            this.attnUsers = (users || []).filter(u => {
                const userBranchId = Number(u.branch_id);
                const userDeptId = Number(u.department_id || u.dept_id);
                const matchBranch = userBranchId === Number(deptBranchId);
                const matchDept = !deptId || userDeptId === Number(deptId);
                return matchBranch && matchDept;
            });
            
            console.log('👥 ATTN users for client:', this.attnUsers.length);
            
            // ✅ Also add department supervisor if available
            if (selectedDept?.supervisor) {
                const hasSupervisor = this.attnUsers.some(u => 
                    (u.fullname || u.username) === selectedDept.supervisor
                );
                if (!hasSupervisor) {
                    this.attnUsers.unshift({
                        fullname: selectedDept.supervisor,
                        username: selectedDept.supervisor,
                        role: 'supervisor'
                    });
                }
            }
            
            // Auto-select first user if ATTN is empty
            if (this.attnUsers.length > 0 && !this.reqData.attn) {
                this.reqData.attn = this.attnUsers[0].fullname || this.attnUsers[0].username;
            }
        },
        error: (err) => {
            console.error('❌ Failed to load client ATTN users:', err.status, err.message);
            
            // Fallback: Use department supervisor
            this.attnUsers = [];
            if (selectedDept?.supervisor) {
                this.attnUsers = [{ 
                    fullname: selectedDept.supervisor, 
                    username: selectedDept.supervisor, 
                    role: 'supervisor' 
                }];
                if (!this.reqData.attn) {
                    this.reqData.attn = selectedDept.supervisor;
                }
            }
        }
    });
}
loadAdminUsers() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
        next: (data) => {
            this.adminUsers = Array.isArray(data) ? data : [];
        },
        error: () => {
            console.warn('Failed to load admin users, using empty list');
            this.adminUsers = [];
        }
    });
}
 loadRequisition(id: string) {
    console.log('🔍 loadRequisition called with id:', id, 'type:', typeof id);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any>(`${environment.apiUrl}/api/requisitions/${id}`, { headers }).subscribe({
      next: (response) => {
        console.log('📦 API Response:', response);
        
        // Handle response - it might be an array or single object
        const data = Array.isArray(response) ? response[0] : response;
        
        if (!data) {
          console.error('❌ No requisition data found in response');
          return;
        }
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && data.submitted_by !== currentUser.id) {
          this.isRecipientEdit = true;
        } else {
          this.isRecipientEdit = false;
        }
        console.log('📋 Requisition loaded:', {
          id: data.id,
          number: data.requisition_number,
          branch_id: data.branch_id,
          department_id: data.department_id,
          has_prepared_sig: !!data.prepared_signature,
          has_approved_sig: !!data.approved_signature,
          has_items_prepared_sig: !!data.items_prepared_signature,
          items_count: data.items?.length || 0
        });
        
        // Set the requisition number from the loaded data
        this.reqNumber = data.requisition_number || data.req_number || '';
        
        // ✅ FIRST: Set branch and department BEFORE loading departments
        // This ensures the dropdowns are populated correctly
        const savedBranchId = data.branch_id || null;
        const savedDeptId = data.department_id || null;
        
        // ✅ Update reqData with ALL loaded values
       this.reqData = {
        request_from: data.request_from || '',
        attn: data.attn || '',
        department_id: savedDeptId,
        // ✅ Don't fall back to new Date() - preserve original or leave empty
        date: this.parseDate(data.date) || data.date || '',
        time: data.time || '', 
        remarks: data.remarks || '',
        prepared_name: data.prepared_name || '',
        prepared_date: this.parseDate(data.prepared_date) || data.prepared_date || '',
        approved_name: data.approved_name || '',
        approved_date: this.parseDate(data.approved_date) || data.approved_date || '',
        items_prepared_name: data.items_prepared_name || '',
        items_prepared_date: this.parseDate(data.items_prepared_date) || data.items_prepared_date || '',
        returned_name: data.returned_name || '',
        returned_date: this.parseDate(data.returned_date) || data.returned_date || ''
    };
        // Load items
        this.items = data.items || [];
        // Load signatures
        this.preparedSignature = data.prepared_signature || null;
        this.approvedSignature = data.approved_signature || null;
        this.itemsPreparedSignature = data.items_prepared_signature || null;
        // ✅ Set branch AFTER loading departments are ready
        this.loadBranchesAndDepartmentsForEdit(savedBranchId, savedDeptId);
        // Set sigSaved and switch to upload mode for existing signatures
        if (this.preparedSignature) {
          this.sigSaved['prepared'] = true;
          this.sigMode['prepared'] = 'upload';
        }
        if (this.approvedSignature) {
          this.sigSaved['approved'] = true;
          this.sigMode['approved'] = 'upload';
        }
        if (this.itemsPreparedSignature) {
          this.sigSaved['items_prepared'] = true;
          this.sigMode['items_prepared'] = 'upload';
        }
        // ✅ NEW: Auto-fill Approved By when Supervisor/Head/Manager edits pending request
        if (!this.approvalMode && this.editMode) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const role = (currentUser.role || '').toLowerCase();
            if (role === 'supervisor' || role === 'head/manager' || role === 'branch manager') {
              // Only auto-fill if the request is still pending (not yet approved)
              if (!data.approved_name) {
                this.reqData.approved_name = currentUser.fullname || '';
                this.reqData.approved_date = new Date().toISOString().split('T')[0];
              }
            }
          }
        }
        // In approval mode, pre-fill admin info
        if (this.approvalMode) {
  const currentUser = this.authService.getCurrentUser();
  if (currentUser) {
    // Auto-fill "Items Received By" (already exists)
    this.reqData.items_prepared_name = this.reqData.items_prepared_name || currentUser.fullname || '';
    this.reqData.items_prepared_date = this.reqData.items_prepared_date || new Date().toISOString().split('T')[0];
    // ✅ NEW: Auto-fill "Form Approved By" for Supervisor/Head/Manager
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'supervisor' || role === 'head/manager' || role === 'branch manager') {
      this.reqData.approved_name = this.reqData.approved_name || currentUser.fullname || '';
      this.reqData.approved_date = this.reqData.approved_date || new Date().toISOString().split('T')[0];
    }
  }
}
      },
      error: (err) => {
        console.error('❌ API call failed:', err.status, err.message);
        
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        const found = saved.find((r: any) => 
          String(r.id) === String(id) || 
          String(r.requisition_number) === String(id)
        );
        
        if (found) {
          console.log('📦 Found in localStorage:', found.requisition_number);
          this.reqNumber = found.requisition_number;
          this.reqData = { ...this.reqData, ...found };
          this.items = found.items || [];
          this.preparedSignature = found.prepared_signature || null;
          this.approvedSignature = found.approved_signature || null;
          this.itemsPreparedSignature = found.items_prepared_signature || null;
          
          if (this.preparedSignature) {
            this.sigSaved['prepared'] = true;
            this.sigMode['prepared'] = 'upload';
          }
          if (this.approvedSignature) {
            this.sigSaved['approved'] = true;
            this.sigMode['approved'] = 'upload';
          }
          if (this.itemsPreparedSignature) {
            this.sigSaved['items_prepared'] = true;
            this.sigMode['items_prepared'] = 'upload';
          }
          
          // Also try to set branch for localStorage data
          if (found.branch_id) {
            this.loadBranchesAndDepartmentsForEdit(found.branch_id, found.department_id);
          }
        } else {
          console.error('❌ Requisition not found anywhere');
        }
      }
    });
  }

  // ✅ NEW METHOD: Load branches/departments specifically for edit mode
  loadBranchesAndDepartmentsForEdit(branchId: number | null, deptId: number | null) {
    const user: any = this.authService.getCurrentUser();
    
    this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        this.branches = branches || [];
        this.userBranch = this.branches.find(b => b.id == user?.branch_id);
        this.mainBranches = this.branches.filter(b => this.mainBranchIds.includes(b.id));
        
        // Load departments
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
            
            // ✅ Now set the branch and filter departments
            if (branchId) {
              this.selectedBranchId = branchId;
              this.filterDepartmentsByBranch(branchId);
              
              // ✅ Set the department AFTER filtering
              // Use setTimeout to ensure Angular has updated the filteredDepartments
              setTimeout(() => {
                if (deptId) {
                  this.reqData.department_id = deptId;
                  // Check if department exists in filtered list
                  const deptExists = this.filteredDepartments.some(d => d.id == deptId);
                  if (deptExists) {
                    this.onDepartmentChange();
                  }
                }
              }, 100);
            } else if (this.isMainBranch && user?.branch_id) {
              this.selectedBranchId = user.branch_id;
              this.filterDepartmentsByBranch(user.branch_id);
            } else {
              this.selectedBranchId = user?.branch_id || null;
              if (this.selectedBranchId) {
                this.filterDepartmentsByBranch(this.selectedBranchId);
              }
            }
          }
        });
      }
    });
  }
private parseDate(val: any): string {
    if (!val) return '';
    try {
        // ✅ If already in YYYY-MM-DD format (MySQL DATE), return directly
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            return val;
        }
        
        // ✅ If it's an ISO string with time, extract date portion
        if (typeof val === 'string' && val.includes('T')) {
            const datePart = val.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                return datePart;
            }
        }
        
        // ✅ If it's a datetime string like "2025-07-27 00:00:00"
        if (typeof val === 'string' && val.includes(' ')) {
            const datePart = val.split(' ')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                return datePart;
            }
        }
        
        // Fallback: parse with UTC to avoid timezone shift
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        
        // ✅ Use UTC methods to avoid browser timezone issues
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}
generateReqNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // Check if it's a new day - reset counter
    const lastDate = localStorage.getItem('lastReqDate');
    if (lastDate !== datePart) {
        localStorage.setItem('lastReqDate', datePart);
        localStorage.setItem('lastReqNumber', '0');
    }
    
    const lastNumber = parseInt(localStorage.getItem('lastReqNumber') || '0');
    const nextNumber = lastNumber + 1;
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    localStorage.setItem('lastReqNumber', String(nextNumber));
    
    return `REQ-${paddedNumber}-${datePart}`;
}
  get grandTotal(): number {
    return this.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unit_price || 0)), 0);
  }

  addItem() {
    this.items.push({ qty: 1, item: '', unit_price: 0 });
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  dragOverTarget: string | null = null;

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
get availableRecipientBranches(): any[] {
  const user: any = this.authService.getCurrentUser();
  const userBranchId = Number(user?.branch_id);
  
  // If user is in a main branch, show the OTHER main branch(es) + non-main branches
  if (this.mainBranchIds.includes(userBranchId)) {
    return this.mainBranches.filter(b => b.id !== userBranchId);
  }
  
  // For non-main branch users, show main branches (existing behavior)
  return this.mainBranches;
}
  processSigFile(file: File, target: string) {
    if (!file.type.startsWith('image/')) {
      this.showToastMsg('Please upload an image file for the signature.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (target === 'prepared') this.preparedSignature = e.target.result;
      if (target === 'approved') this.approvedSignature = e.target.result;
      if (target === 'items_prepared') this.itemsPreparedSignature = e.target.result;
      this.sigSaved[target] = true;
    };
    reader.readAsDataURL(file);
  }

 clearSignature(target: string) {
    if (target === 'prepared') {
      this.preparedSignature = null;
      this.sigMode['prepared'] = 'draw'; // Reset to draw mode
    }
    if (target === 'approved') {
      this.approvedSignature = null;
      this.sigMode['approved'] = 'draw'; // Reset to draw mode
    }
    if (target === 'items_prepared') {
      this.itemsPreparedSignature = null;
      this.sigMode['items_prepared'] = 'draw'; // Reset to draw mode
    }
    this.sigSaved[target] = false;
  }

startSigDraw(event: any, target: string) {
    event.preventDefault();
    this.sigDrawing = true;
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;  // ✅ Always use modal canvas
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
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;  // ✅ Always use modal canvas
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
    if (canvas) { 
      const ctx = canvas.getContext('2d'); 
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); 
    }
    this.sigSaved[target] = false;
    if (target === 'prepared') {
      this.preparedSignature = null;
      this.sigMode['prepared'] = 'draw';
    }
    if (target === 'approved') {
      this.approvedSignature = null;
      this.sigMode['approved'] = 'draw';
    }
    if (target === 'items_prepared') {
      this.itemsPreparedSignature = null;
      this.sigMode['items_prepared'] = 'draw';
    }
}
setSigMode(target: string, mode: 'draw' | 'upload') {
    this.sigMode[target] = mode;
}
 saveSigCanvas(target: string) {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      if (target === 'prepared') {
        this.preparedSignature = dataUrl;
        this.sigMode['prepared'] = 'upload';
      }
      if (target === 'approved') {
        this.approvedSignature = dataUrl;
        this.sigMode['approved'] = 'upload';
      }
      if (target === 'items_prepared') {
        this.itemsPreparedSignature = dataUrl;
        this.sigMode['items_prepared'] = 'upload';
      }
      this.sigSaved[target] = true;
    }
}
openSigModal(target: string) {
  this.sigModalTarget = target;
  this.showSigModal = true;
  this.sigModalPosition = { x: 0, y: 0 }; // Reset position when opening
  
  setTimeout(() => {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (canvas) {
      // Set actual pixel dimensions to match CSS size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) { 
        ctx.strokeStyle = '#000'; 
        ctx.lineWidth = 2; 
        ctx.lineCap = 'round';
        // Restore existing signature
        const existingSig = target === 'prepared' ? this.preparedSignature :
                           target === 'approved' ? this.approvedSignature : this.itemsPreparedSignature;
        if (existingSig) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = existingSig;
        }
      }
    }
  }, 100);
}

closeSigModal() {
  this.showSigModal = false;
  this.sigDrawing = false;
}
  handleSigFile(event: any, target: string) {
    const file = event.target.files?.[0];
    if (file) {
      this.processSigFile(file, target);
    }
  }
getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'Pending', 
        'approved': 'Accepted',  // Changed from 'Received'
        'released': 'Released', 
        'rejected': 'Rejected'
    };
    return labels[status] || status || 'Pending';
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

stopSigModalDrag() {
  this.isDraggingSigModal = false;
}
/**
 * ✅ Check if current user can fill in the Approved By section
 * Only Head/Manager, Supervisor, and Branch Manager can approve
 * Staff users see it as readonly
 */
canApprove(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // In approval mode, the form is being used by a recipient to accept
    // They should be able to fill in "Received By" not "Approved By"
    if (this.approvalMode) return false;
    
    const role = (currentUser.role || '').toLowerCase();
    return role === 'head/manager' || role === 'supervisor' || role === 'branch manager';
}
submitRequisition() {
    // ✅ APPROVAL MODE - FIX THE PAYLOAD
    if (this.approvalMode) {
        if (!this.reqData.items_prepared_name) {
            this.showToastMsg('Please fill in Items Requested By name.', 'warning');
            return;
        }
        if (!this.itemsPreparedSignature) {
            alert('Please provide Items Requested By signature.');
            return;
        }
        
        this.submitting = true;
        const payload: any = {
            status: 'approved',
            items: this.items,
            // ✅ ADD THESE - Include approved fields
            approved_name: this.reqData.approved_name || this.reqData.items_prepared_name,
            approved_date: this.reqData.approved_date || this.reqData.items_prepared_date || new Date().toISOString().split('T')[0],
            approved_signature: this.approvedSignature || null,
            // Existing fields
            items_prepared_name: this.reqData.items_prepared_name,
            items_prepared_date: this.reqData.items_prepared_date,
            items_prepared_signature: this.itemsPreparedSignature
        };
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const url = `${environment.apiUrl}/api/admin/requisitions/${this.editReqId}/status`;
        
        console.log('📥 Accepting requisition:', this.editReqId, payload);
        
        this.http.put(url, payload, { headers }).subscribe({
            next: (response: any) => {
                console.log('✅ Accept response:', response);
                this.submitting = false;
                
                // ✅ Send notification
                const currentUser = this.authService.getCurrentUser();
                const userName = currentUser?.fullname || currentUser?.username || 'User';
                
                // Notify admin notification service
                this.notificationService.handleRequisitionReceived(
                    { id: this.editReqId, requisition_number: this.reqNumber, submitted_by: this.reqData.submitted_by },
                    payload.approved_name,
                    this.reqData.submitted_by
                );
                
                this.showToastMsg('✅ Requisition accepted!', 'success');
                this.router.navigate(['/client/request']);
            },
            error: (err) => {
                console.error('❌ Accept error:', err);
                this.submitting = false;
                
                if (err.status === 403) {
                    this.http.put(`${environment.apiUrl}/api/admin/requisitions/${this.editReqId}/approve`, payload, { headers }).subscribe({
                        next: () => {
                            this.submitting = false;
                            this.showToastMsg('✅ Requisition accepted!', 'success');
                            this.router.navigate(['/client/request']);
                        },
                        error: () => {
                            this.showToastMsg('⚠️ Failed to accept requisition', 'error');
                        }
                    });
                } else {
                    this.showToastMsg('⚠️ Failed to accept requisition', 'error');
                }
            }
        });
        return;
    }

    // ✅ CLIENT CREATE/EDIT MODE - Also make sure approved fields are sent
    if (!this.reqData.request_from) {
        this.showToastMsg('Please select Request From.', 'warning');
        return;
    }
    if (this.items.length === 0) {
        this.showToastMsg('Please add at least one item.', 'warning');
        return;
    }
    if (!this.reqData.prepared_name || !this.preparedSignature) {
        this.showToastMsg('Please fill in Prepared By name and signature.', 'warning');
        return;
    }

    // ✅ Only require Approved By for Head/Manager/Supervisor
    const currentUser = this.authService.getCurrentUser();
    const role = (currentUser?.role || '').toLowerCase();
    const isHeadOrManager = role === 'head/manager' || role === 'branch manager' || role === 'supervisor';

    if (isHeadOrManager && (!this.reqData.approved_name || !this.approvedSignature)) {
        this.showToastMsg('Please fill in Approved By name and signature.', 'warning');
        return;
    }

    this.submitting = true;

    const payload: any = {
        ...this.reqData,
        requisition_number: this.reqNumber,
        items: this.items,
        branch_id: this.selectedBranchId,
        department_id: this.reqData.department_id,
        prepared_signature: this.preparedSignature,
        // ✅ Always send approved signature if it exists
        approved_signature: this.approvedSignature || null,
        items_prepared_signature: this.itemsPreparedSignature || null,
        submitted_by: currentUser?.id || null,
    };

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const url = this.editMode && this.editReqId 
        ? `${environment.apiUrl}/api/requisitions/${this.editReqId}`
        : `${environment.apiUrl}/api/requisitions`;
    
    console.log('📤 SUBMITTING REQUISITION:', {
        editMode: this.editMode,
        url: url,
        hasApprovedName: !!payload.approved_name,
        hasApprovedSig: !!payload.approved_signature,
        hasApprovedDate: !!payload.approved_date,
        fullPayload: JSON.stringify(payload, null, 2)
    });
    
    const request = this.editMode 
        ? this.http.put(url, payload, { headers })
        : this.http.post(url, payload, { headers });

    request.subscribe({
    next: (response: any) => {
        console.log('✅ Success response:', response);
        this.submitting = false;
        
        const currentUser = this.authService.getCurrentUser();
        const userName = currentUser?.fullname || currentUser?.username || 'User';
        
        // ❌ REMOVE THIS - Do NOT broadcast to admin users
        // this.notificationService.addBellNotification({ ... targetUserId: null ... });
        
        // ✅ CLIENT SIDE ONLY: Notify the RECIPIENT department only
        if (!this.editMode) {
            const reqData = {
                id: response.id,
                requisition_number: this.reqNumber,
                submitted_by: currentUser?.id
            };
            this.clientNotificationService.handleNewRequisition(
                reqData,
                userName,
                this.selectedBranchId!,      // Recipient branch
                this.reqData.department_id   // Recipient department
            );
        }
        
        this.showToastMsg(this.editMode ? '✅ Requisition updated!' : '✅ Requisition submitted!', 'success');
        this.router.navigate(['/client/request']);
    },
        error: (err) => {
            this.submitting = false;
            console.error('❌ Submit error details:', {
                status: err.status,
                error: err.error,
                message: err.message,
            });
            
            const errorMsg = err.error?.error || err.message || 'Unknown error';
            this.showToastMsg(`⚠️ Failed: ${errorMsg}`, 'error');
        }
    });
}
 cancel() {
    // ✅ Always go to client request list for client users
    this.router.navigate(['/client/request']);
}
}