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
  selector: 'app-client-requisition-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="req-container">
      <div class="req-header">
        <div class="header-left">
          <h1>{{ approvalMode ? '✅ Receive Requisition' : editMode ? '✏️ Edit Requisition' : '📩 Requisition Form' }}</h1>
          <span class="header-sub">{{ approvalMode ? 'Fill in items prepared by details and signature' : editMode ? 'Update your requisition request' : 'Submit a requisition for items/equipment' }}</span>
        </div>
        <button class="print-btn" (click)="printForm()">🖨️ Print</button>
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
  
 <!-- Branch Selection (only for non-main branch users) -->
<div class="field-row" *ngIf="!isMainBranch">
  <label>Send To Branch:</label>
  <select [(ngModel)]="selectedBranchId" class="req-input" (change)="onBranchChange()">
    <option value="">— Select Branch —</option>
    <option [value]="userBranch?.id" *ngIf="userBranch">
      🏢 {{ userBranch?.name }} <small>({{ userBranch?.company_name }})</small> - Your Branch
    </option>
    <option *ngFor="let branch of mainBranches" [value]="branch.id">
      🏛️ {{ branch.name }} <small>({{ branch.company_name }})</small>
    </option>
  </select>
</div>

  <!-- Department Selection (based on selected branch) -->
  <div class="field-row">
    <label>Dept:</label>
    <select [(ngModel)]="reqData.department_id" class="req-input" (change)="onDepartmentChange()">
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
    <input type="date" [(ngModel)]="reqData.date" class="req-input">
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
                <td><input type="number" [(ngModel)]="item.unit_price" class="item-input" step="0.01" style="width:100px" [readonly]="!approvalMode"></td>
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

  <!-- Form Prepared By - Client: fillable, Admin: readonly -->
  <div class="sig-block" [class.readonly]="approvalMode">
    <h5>Form Prepared By:</h5>
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
  <div class="sig-block" [class.readonly]="approvalMode">
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

  <!-- Items Prepared By - Client: readonly, Admin: fillable -->
  <div class="sig-block" [class.readonly]="!approvalMode">
    <h5>Items Prepared By:</h5>
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
  <div class="sig-modal" (click)="$event.stopPropagation()">
    <div class="sig-modal-header">
      <span>✍️ Draw Signature</span>
      <button type="button" class="sig-modal-close" (click)="closeSigModal()">✕</button>
    </div>
    <div class="sig-modal-body">
      <canvas id="sigModalCanvas" width="600" height="200" class="sig-modal-canvas"
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
          {{ submitting ? 'Saving...' : (approvalMode ? '✅ Receive Requisition' : editMode ? '💾 Update' : '✅ Submit Requisition') }}
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
    .req-textarea { width: 100%; padding: 6px; border: 1px solid #888; font-size: 10px; font-family: 'Courier New', monospace; resize: vertical; box-sizing: border-box; }
    .req-section { margin-bottom: 12px; color: #0f0e0e; font-weight: bold; }
    .req-section h4 { font-size: 12px; margin: 0 0 6px 0; color: #000000; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .add-item-btn { background: #0a3a8c; color: white; border: 1px solid #042070; padding: 3px 10px; cursor: pointer; font-size: 9px; border-radius: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .items-table th { background: #f0f4f8; padding: 6px 8px; font-size: 9px; border: 1px solid #ccc; text-align: left; }
    .items-table td { padding: 4px 6px; border: 1px solid #eee; }
    .item-input { padding: 3px 5px; border: 1px solid #ccc; font-size: 10px; font-family: 'Courier New', monospace; width: 100%; box-sizing: border-box; }
    .item-total { font-weight: bold; text-align: right; }
    .remove-item-btn { background: none; border: none; color: #cc0000; cursor: pointer; font-size: 12px; }
    .empty-items { text-align: center; color: #888; padding: 12px; font-style: italic; }
    .grand-total-row { background: #f0f4f8; font-weight: bold; }
    .grand-total-label { text-align: right; padding: 6px; }
    .grand-total-value { text-align: right; padding: 6px; font-size: 12px; color: #0a3a8c; }
    .req-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .sig-block { border: 1px solid #ccc; padding: 8px; background: #fafafa; }
    .sig-block h5 { margin: 0 0 6px 0; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sig-field { display: flex; align-items: center; margin-bottom: 3px; }
    .sig-field label { width: 30px; font-size: 9px; font-weight: bold; color: #0f0e0e; }
    .sig-options { display: flex; gap: 4px; margin: 4px 0; }
    .sig-option-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 8px; border-radius: 2px; }
    .sig-option-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .sig-canvas { border: 1px solid #ccc; background: #fff; cursor: crosshair; display: block; width: 100%; }
    .sig-canvas-actions { display: flex; gap: 4px; margin-top: 4px; }
    .sig-sm-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f0f0f0; cursor: pointer; font-size: 8px; }
    .sig-sm-btn.save { background: #008800; color: white; }
    .sig-upload { border: 1px dashed #ccc; padding: 8px; text-align: center; margin-top: 4px; }
    .sig-saved-preview { display: flex; align-items: center; gap: 6px; margin-top: 4px; padding: 4px; background: #f0fff0; border: 1px solid #88cc88; border-radius: 3px; font-size: 9px; }
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
    .sig-clear { background: rgba(204,0,0,0.8); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 8px; padding: 1px 4px; margin-left: 6px; }
    .sig-block.readonly { opacity: 0.8; pointer-events: none; }
    .sig-upload.has-file {
  border-style: solid;
  border-color: #008800;
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
  font-size: 9px;
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
  width: 650px;
  max-width: 95vw;
}
.sig-modal-header {
  background: linear-gradient(180deg, #1c5fb5, #0a3a8c);
  color: white;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
}
.sig-modal-close {
  background: none;
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 8px;
}
.sig-modal-body {
  padding: 16px;
  background: #f5f5f5;
}
.sig-modal-canvas {
  border: 1px solid #ccc;
  background: white;
  cursor: crosshair;
  display: block;
  width: 100%;
  height: 200px;
  touch-action: none;
}
.sig-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #ddd;
}
.sig-modal-btn {
  padding: 6px 16px;
  border: 2px solid;
  border-color: #fff #808080 #808080 #fff;
  cursor: pointer;
  font-size: 10px;
  font-weight: bold;
  border-radius: 3px;
}
.sig-modal-btn.clear { background: #f0f0f0; color: #cc0000; }
.sig-modal-btn.cancel { background: #f0f0f0; color: #000; }
.sig-modal-btn.save { background: #008800; color: white; border-color: #00aa00 #006600 #006600 #00aa00; }
  .req-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #888;
  font-size: 10px;
  color: #0f0e0e;
  font-family: 'Courier New', monospace;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.req-input option {
  font-size: 9px;
  padding: 2px 4px;
}

.req-input option small {
  font-size: 8px;
  color: #666;
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
    private notificationService: NotificationService
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

    this.loadBranchesAndDepartments();
    // Check for edit mode via query param
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.editReqId = params['id'];
        // Load existing requisition - don't generate new reqNumber
        this.loadRequisition(params['id']);
      } else {
        // Only generate new reqNumber for new requisitions
        this.reqNumber = this.generateReqNumber();
        // Pre-fill user info only for new requisitions
        this.authService.currentUser$.subscribe((user: any) => {
          if (user) {
            this.reqData.prepared_name = user.fullname || '';
            this.reqData.request_from = user.department || user.dept || '';
          }
        });
      }
    });
  }
  triggerSigFileInput(target: string) {
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
  const user: any = this.authService.getCurrentUser();  // ✅ Cast to any
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
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`, { headers }).subscribe({
    next: (users) => {
      // ✅ Filter by branch_id, role, AND department_id
      this.attnUsers = (users || []).filter(u => {
        const userBranchId = Number(u.branch_id);
        const userDeptId = Number(u.department_id);
        const matchBranch = userBranchId === Number(deptBranchId);
        const matchDept = !deptId || userDeptId === Number(deptId);
        const role = (u.role || '').toLowerCase();
        const matchRole = role === 'head/manager' || role === 'supervisor';
        return matchBranch && matchDept && matchRole;
      });
      
      console.log('👥 ATTN users found:', this.attnUsers.length);
      
      if (this.attnUsers.length > 0 && !this.reqData.attn) {
        this.reqData.attn = this.attnUsers[0].fullname || this.attnUsers[0].username;
      }
    },
    error: (err) => {
      this.attnUsers = [];
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
        console.log('📦 API Response type:', typeof response, Array.isArray(response) ? 'array' : 'object');
        console.log('📦 Full API Response:', response);
        
        // Handle response - it might be an array or single object
        const data = Array.isArray(response) ? response[0] : response;
        
        if (!data) {
          console.error('❌ No requisition data found in response');
          return;
        }
        
        console.log('📋 Requisition loaded:', {
          id: data.id,
          number: data.requisition_number,
          has_prepared_sig: !!data.prepared_signature,
          has_approved_sig: !!data.approved_signature,
          has_items_prepared_sig: !!data.items_prepared_signature,
          items_count: data.items?.length || 0
        });
        
        // Set the requisition number from the loaded data
        this.reqNumber = data.requisition_number || data.req_number || '';
        
        // Update reqData with loaded values
        this.reqData = {
  request_from: data.request_from || '',
  attn: data.attn || '',
  department_id: data.department_id || null,  // ✅ Add this
  date: this.parseDate(data.date) || new Date().toISOString().split('T')[0],
  remarks: data.remarks || '',
  prepared_name: data.prepared_name || '',
  prepared_date: this.parseDate(data.prepared_date) || new Date().toISOString().split('T')[0],
  approved_name: data.approved_name || '',
  approved_date: this.parseDate(data.approved_date) || '',
  items_prepared_name: data.items_prepared_name || '',
  items_prepared_date: this.parseDate(data.items_prepared_date) || '',
  returned_name: data.returned_name || '',
  returned_date: this.parseDate(data.returned_date) || ''
};
        
        // Load items
        this.items = data.items || [];
        
        // Load signatures
        this.preparedSignature = data.prepared_signature || null;
        this.approvedSignature = data.approved_signature || null;
        this.itemsPreparedSignature = data.items_prepared_signature || null;
        if (data.branch_id) {
  this.selectedBranchId = data.branch_id;
  this.filterDepartmentsByBranch(data.branch_id);
}
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
        
        console.log('✅ Requisition loaded successfully:', {
          number: this.reqNumber,
          preparedSig: this.preparedSignature ? 'YES' : 'NO',
          approvedSig: this.approvedSignature ? 'YES' : 'NO',
          itemsPrepSig: this.itemsPreparedSignature ? 'YES' : 'NO',
          sigSaved: this.sigSaved,
          sigMode: this.sigMode
        });
        
        // In approval mode, pre-fill admin info
        if (this.approvalMode) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            this.reqData.items_prepared_name = this.reqData.items_prepared_name || currentUser.fullname || '';
            this.reqData.items_prepared_date = this.reqData.items_prepared_date || new Date().toISOString().split('T')[0];
          }
        }
      },
      error: (err) => {
        console.error('❌ API call failed:', err.status, err.message);
        
        // Try loading from localStorage as fallback
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        console.log('📦 Looking in localStorage, entries:', saved.length);
        
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
        } else {
          console.error('❌ Requisition not found anywhere');
        }
      }
    });
  }
  private parseDate(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  generateReqNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `REQ-${datePart}-${random}`;
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

  submitRequisition() {
    // Approval mode - only validate items prepared by
    if (this.approvalMode) {
      if (!this.reqData.items_prepared_name) {
       this.showToastMsg('Please fill in Items Prepared By name.', 'warning');
        return;
      }
      if (!this.itemsPreparedSignature) {
        alert('Please provide Items Prepared By signature.');
        return;
      }
     // In submitRequisition() - Approval mode section
this.submitting = true;
const payload = {
    status: 'approved',
    items: this.items,  // ADD THIS - send the items array with updated unit prices
    items_prepared_name: this.reqData.items_prepared_name,
    items_prepared_date: this.reqData.items_prepared_date,
    items_prepared_signature: this.itemsPreparedSignature
};
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      this.http.put(`${environment.apiUrl}/api/admin/requisitions/${this.editReqId}/approve`, payload, { headers }).subscribe({
        next: () => {
          this.submitting = false;
          this.notificationService.addBellNotification({
            type: 'success',
            title: '📥 Requisition Received',
            message: `Requisition #${this.reqNumber} items prepared by ${this.reqData.items_prepared_name}`,
            ticketNumber: this.reqNumber,
            targetUserId: null,
            countInBadge: true,
          });
          this.showToastMsg('✅ Requisition received!', 'success');
          this.router.navigate(['/admin/requisitions']);
        },
        error: () => {
          this.submitting = false;
         this.showToastMsg('⚠️ Failed to receive requisition', 'error');
        }
      });
      return;
    }

    // Client mode - validate prepared by and approved by
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
    if (!this.reqData.approved_name || !this.approvedSignature) {
      this.showToastMsg('Please fill in Approved By name and signature.', 'warning');
      return;
    }

    this.submitting = true;

    const payload = {
      ...this.reqData,
      requisition_number: this.reqNumber,
      items: this.items,
       branch_id: this.selectedBranchId,
      prepared_signature: this.preparedSignature,
      approved_signature: this.approvedSignature,
      items_prepared_signature: this.itemsPreparedSignature,
      submitted_by: this.authService.getCurrentUser()?.id || null
    };

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const url = this.editMode && this.editReqId 
      ? `${environment.apiUrl}/api/requisitions/${this.editReqId}`
      : `${environment.apiUrl}/api/requisitions`;
    
    const request = this.editMode 
      ? this.http.put(url, payload, { headers })
      : this.http.post(url, payload, { headers });

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.addBellNotification({
          type: 'info',
          title: '📩 New Requisition',
          message: `Requisition #${this.reqNumber} submitted by ${this.reqData.prepared_name}`,
          ticketNumber: this.reqNumber,
          targetUserId: null,
          countInBadge: true,
        });
        this.showToastMsg('✅ Requisition submitted!', 'success');
        this.router.navigate(['/client/request']);
      },
      error: () => {
        this.submitting = false;
        // Save locally
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        const existingIndex = saved.findIndex((r: any) => r.requisition_number === this.reqNumber);
        if (existingIndex !== -1) {
          saved[existingIndex] = payload;
        } else {
          saved.push(payload);
        }
        localStorage.setItem('requisitions', JSON.stringify(saved));
        this.showToastMsg('📋 Saved locally', 'warning');
        this.router.navigate(['/client/request']);
      }
    });
  }

 printForm() {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    // Helper to format date for printing
    const fmtDate = (val: any) => {
      if (!val) return '—';
      try { 
        const d = new Date(val); 
        if (isNaN(d.getTime())) return String(val);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
      }
      catch { return String(val); }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisition - ${this.reqNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 8mm; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 9px;
            color: #000;
            padding: 10px;
          }
          .req-print {
            background: white;
            border: 2px solid #000;
            padding: 16px 20px;
            max-width: 750px;
            margin: 0 auto;
          }
          .req-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .req-header .company {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #0a246a;
          }
          .req-header .title {
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 3px;
            margin-top: 4px;
          }
          .req-header .ctrl-no {
            font-size: 8px;
            color: #cc0000;
            font-weight: bold;
            margin-top: 2px;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 4px;
            font-size: 9px;
          }
          .info-label { 
            font-weight: bold; 
            white-space: nowrap; 
            color: #333;
            width: 85px;
            flex-shrink: 0;
          }
          .info-value { flex: 1; color: #000; }
          
          .remarks-section {
            margin: 8px 0;
            padding: 6px 8px;
            border: 1px solid #ccc;
            background: #fafafa;
            font-size: 9px;
            min-height: 30px;
          }
          .remarks-label { font-weight: bold; font-size: 9px; margin-bottom: 4px; }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .items-table th {
            background: #f0f4f8;
            padding: 5px 8px;
            font-size: 9px;
            font-weight: bold;
            border: 1px solid #000;
            text-align: left;
          }
          .items-table td {
            padding: 4px 8px;
            font-size: 9px;
            border: 1px solid #ccc;
          }
          .total-row {
            font-weight: bold;
            background: #f0f4f8;
          }
          .total-row td { border: 1px solid #000; }
          
          .signatures {
            margin-top: 16px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .sig-row {
            display: flex;
            gap: 12px;
          }
          .sig-block {
            flex: 1;
            text-align: center;
            padding: 8px;
            border: 1px solid #ccc;
          }
          .sig-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 4px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
          }
          .sig-image-area {
            border: 1px solid #eee;
            min-height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            background: #fafafa;
          }
          .sig-image-area img {
            max-width: 100px;
            max-height: 40px;
            object-fit: contain;
          }
          .sig-image-area .no-sig {
            font-size: 7px;
            color: #ccc;
            font-style: italic;
          }
          .sig-name {
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 2px;
          }
          .sig-date {
            font-size: 8px;
            color: #333;
          }
          
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 7px;
            color: #555;
          }
          .footer p { margin: 2px 0; }
          
          @media print {
            body { padding: 0; margin: 0; }
            .req-print { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="req-print">
          <div class="req-header">
            <div class="company">${this.companyName}</div>
            <div class="title">REQUISITION FORM</div>
            <div class="ctrl-no">CTRL NO.: EDR-30</div>
            <div style="font-size:8px;margin-top:4px;">REQ #: ${this.reqNumber}</div>
          </div>

          <div class="info-row"><span class="info-label">Request From:</span><span class="info-value">${this.reqData.request_from || '—'}</span></div>
          <div class="info-row"><span class="info-label">ATTN:</span><span class="info-value">${this.reqData.attn || '—'}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${fmtDate(this.reqData.date)}</span></div>
          
          <div class="remarks-section">
            <div class="remarks-label">Remarks / Reason:</div>
            ${this.reqData.remarks || 'No remarks provided.'}
          </div>

          <table class="items-table">
            <thead>
              <tr><th>Qty</th><th>Item Description</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${this.items.length > 0 ? this.items.map((item: any) => `
                <tr>
                  <td>${item.qty || 0}</td>
                  <td>${item.item || '—'}</td>
                  <td>${(item.unit_price || 0).toFixed(2)}</td>
                  <td>${((item.qty || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" style="text-align:center;color:#888;font-style:italic;">No items added</td></tr>
              `}
            </tbody>
            ${this.items.length > 0 ? `
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-align:right;">Grand Total:</td>
                <td>${this.grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>` : ''}
          </table>

          <div class="signatures">
            <div class="sig-row">
              <div class="sig-block">
                <div class="sig-label">Form Prepared By</div>
                <div class="sig-image-area">
                  ${this.preparedSignature ? `<img src="${this.preparedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${this.reqData.prepared_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(this.reqData.prepared_date)}</div>
              </div>
              <div class="sig-block">
                <div class="sig-label">Form Approved By</div>
                <div class="sig-image-area">
                  ${this.approvedSignature ? `<img src="${this.approvedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${this.reqData.approved_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(this.reqData.approved_date)}</div>
              </div>
              <div class="sig-block">
                <div class="sig-label">Items Prepared By</div>
                <div class="sig-image-area">
                  ${this.itemsPreparedSignature ? `<img src="${this.itemsPreparedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}
                </div>
                <div class="sig-name">${this.reqData.items_prepared_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(this.reqData.items_prepared_date)}</div>
              </div>
            </div>
          </div>

          ${this.reqData.request_from === 'BORROW' ? `
          <div class="signatures" style="margin-top:8px;padding-top:8px;">
            <div class="sig-row">
              <div class="sig-block">
                <div class="sig-label">Returned By (Borrowed Items)</div>
                <div class="sig-image-area">
                  <span class="no-sig">No signature</span>
                </div>
                <div class="sig-name">${this.reqData.returned_name || '_______________'}</div>
                <div class="sig-date">${fmtDate(this.reqData.returned_date)}</div>
              </div>
              <div class="sig-block" style="visibility:hidden;"></div>
              <div class="sig-block" style="visibility:hidden;"></div>
            </div>
          </div>` : ''}

          <div class="footer">
            <p>📋 Leave R.F. to floor supervisor when BORROWING items, include expected date of return.</p>
            <p>For Outside purchase: indicate if P.O. was made or paid by cash.</p>
            <p>EDPtech Helpdesk v2.0 | Requisition #${this.reqNumber}</p>
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
      this.router.navigate(['/admin/requisitions']);
    } else {
      this.router.navigate(['/client/request']);
    }
  }
}