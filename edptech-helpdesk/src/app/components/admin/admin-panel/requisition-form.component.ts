import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';  
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';
import { ClientNotificationService } from '../../../services/client-notification.service';
@Component({
  selector: 'app-admin-requisition-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="req-container">
      <div class="req-header">
    <div class="header-left">
      <h1>{{ approvalMode ? '✅ Accept Requisition' : editMode ? '✏️ Edit Requisition' : '📩 Requisition Form' }}</h1>
      <span class="header-sub">{{ approvalMode ? 'Fill in items prepared by details and signature' : editMode ? 'Update your requisition request' : 'Submit a requisition for items/equipment' }}</span>
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
          <h3>REQUISITION FORM</h3>
          <div class="ctrl-no">CTRL NO.: EDR-30</div>
        </div>
        <div class="req-top-row">
          <div class="field-row">
            <label>Request From:</label>
            <input type="text" [(ngModel)]="reqData.request_from" class="req-input" readonly>
          </div>
          <!-- Branch Selection - Always visible for all users -->
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
          <!-- Department Selection -->
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
         <div class="field-row">
  <label>ATTN.:</label>
  <select [(ngModel)]="reqData.attn" class="req-input">
    <option value="">— Auto from department —</option>
    <!-- ✅ Show the current ATTN value even if not in attnUsers list -->
    <option *ngIf="reqData.attn && !isAttnInList()" [value]="reqData.attn" selected>
      {{ reqData.attn }} (Current)
    </option>
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
              <div class="sig-draw-area" *ngIf="sigMode['prepared'] === 'draw'">
                <button type="button" class="sig-draw-trigger" (click)="openSigModal('prepared')">
                  <span class="sig-draw-icon">✍️</span>
                  <span>Click to Draw Signature</span>
                </button>
              </div>
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
            <div class="sig-saved-preview" *ngIf="preparedSignature && sigSaved['prepared']">
              <img [src]="preparedSignature" alt="Signature" class="sig-image-small">
              <span class="sig-saved-label">✓ Signature</span>
              <button type="button" class="sig-clear" (click)="clearSignature('prepared')" *ngIf="!approvalMode">✕</button>
            </div>
          </div>
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
              <div class="sig-draw-area" *ngIf="sigMode['approved'] === 'draw'">
                <button type="button" class="sig-draw-trigger" (click)="openSigModal('approved')">
                  <span class="sig-draw-icon">✍️</span>
                  <span>Click to Draw Signature</span>
                </button>
              </div>
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
            <div class="sig-saved-preview" *ngIf="approvedSignature && sigSaved['approved']">
              <img [src]="approvedSignature" alt="Signature" class="sig-image-small">
              <span class="sig-saved-label">✓ Signature</span>
              <button type="button" class="sig-clear" (click)="clearSignature('approved')" *ngIf="!approvalMode">✕</button>
            </div>
          </div>
          <div class="sig-block" [class.readonly]="!approvalMode">
            <h5>Recieved By:</h5>
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
              <div class="sig-draw-area" *ngIf="sigMode['items_prepared'] === 'draw'">
                <button type="button" class="sig-draw-trigger" (click)="openSigModal('items_prepared')">
                  <span class="sig-draw-icon">✍️</span>
                  <span>Click to Draw Signature</span>
                </button>
              </div>
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
    .req-input:disabled { background: #e8e8e8; color: #666; cursor: not-allowed; }
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
    .sig-block.readonly { opacity: 0.8; pointer-events: none; }
    .sig-block h5 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sig-field { display: flex; align-items: center; margin-bottom: 3px; }
    .sig-field label { width: 30px; font-size: 12px; font-weight: bold; color: #0f0e0e; }
    .sig-options { display: flex; gap: 4px; margin: 4px 0; }
    .sig-option-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 12px; border-radius: 2px; }
    .sig-option-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .sig-upload { border: 1px dashed #ccc; padding: 8px; text-align: center; margin-top: 4px; }
    .sig-upload.has-file { border-style: solid; border-color: #008800; }
    .sig-upload.drag-over { border-color: #0a3a8c; border-style: solid; background: #e8f0ff; box-shadow: 0 0 0 3px rgba(10,36,106,0.15); }
    .sig-draw-trigger { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; border: 2px dashed #ccc; background: #fafafa; cursor: pointer; width: 100%; border-radius: 4px; font-size: 12px; color: #666; transition: all 0.2s; }
    .sig-draw-trigger:hover { border-color: #0a3a8c; background: #e8f0ff; color: #0a3a8c; }
    .sig-draw-icon { font-size: 24px; }
    .sig-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; font-size: 12px; color: #888; cursor: pointer; }
    .sig-icon { font-size: 20px; }
    .sig-preview { position: relative; width: 100%; padding: 8px; }
    .sig-image { max-width: 100%; max-height: 80px; object-fit: contain; display: block; margin: 0 auto; }
    .sig-saved-preview { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding: 4px 8px; background: #f0fff0; border: 1px solid #88cc88; border-radius: 3px; }
    .sig-image-small { max-width: 100px; max-height: 40px; object-fit: contain; }
    .sig-saved-label { font-size: 12px; color: #008800; font-weight: bold; }
    .sig-clear { background: rgba(204,0,0,0.8); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; padding: 1px 4px; margin-left: 6px; }
    .req-footer { align-items: center; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .req-footer p { margin: 2px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .action-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
    .action-btn.cancel { background: #f0f0f0; color: #000; }
    .action-btn.submit { background: #0a3a8c; color: white; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
    .req-input-sm { padding: 3px 5px; border: 1px solid #ccc; font-size: 12px; font-family: 'Courier New', monospace; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 3000; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .toast-notification.warning { background: #cc6600; }
    .close-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 4px 10px; font-size: 14px; font-weight: bold; border-radius: 0px; line-height: 1; }
    .close-btn:hover { background: rgba(255,0,0,0.7); border-color: rgba(255,255,255,0.6); }
  `]
})
export class AdminRequisitionFormComponent implements OnInit {
  submitting = false;
  editMode = false;
  approvalMode = false;
  editReqId: string | null = null;
  reqNumber: string = '';
  private sigDrawing = false;
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
  private isLoadingRequisition = false;
  // Draggable modal properties
  sigModalPosition = { x: 0, y: 0 };
  isDraggingSigModal = false;
  sigModalDragStart = { x: 0, y: 0 };
  
  reqData: any = {
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

  dragOverTarget: string | null = null;

 constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private clientNotificationService: ClientNotificationService  // ✅ ADD THIS
) {}

  ngOnInit() {
    const url = this.router.url;
    if (url.includes('/approve')) {
      this.approvalMode = true;
      this.editMode = true;
    }

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.editReqId = params['id'];
        if (params['mode'] === 'approve') {
          this.approvalMode = true;
        }
        this.loadRequisition(params['id']);
      } else {
        this.reqNumber = this.generateReqNumber();
        this.loadBranchesAndDepartments();
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (user && user.fullname) {
          this.reqData.prepared_name = user.fullname || '';
          this.reqData.request_from = user.department || user.dept || '';
          
          // ✅ Auto-fill Approved By for Head/Manager/Supervisor/Branch Manager
          const role = (user.role || '').toLowerCase();
          if (role === 'head/manager' || role === 'supervisor' || role === 'branch manager') {
            this.reqData.approved_name = user.fullname || '';
            this.reqData.approved_date = new Date().toISOString().split('T')[0];
          }
        }
      }
    });
  }

  // ==================== METHODS ====================

 get isMainBranch(): boolean {
    const user: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return !!(user && this.mainBranchIds.includes(Number(user.branch_id)));
}

  get availableRecipientBranches(): any[] {
    const user: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userBranchId = Number(user?.branch_id);
    
    if (this.mainBranchIds.includes(userBranchId)) {
        return this.mainBranches.filter(b => b.id !== userBranchId);
    }
    
    return this.mainBranches;
  }

  get companyName(): string {
    if (this.userBranch?.company_name) return this.userBranch.company_name;
    if (this.userBranch?.name) return this.userBranch.name;
    return 'Lee Super Plaza';
  }

  get grandTotal(): number {
    return this.items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unit_price || 0)), 0);
  }

  generateReqNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // Generate a 3-digit sequential number (or random if you prefer)
    // For sequential, you could store the last number in localStorage
    const lastNumber = parseInt(localStorage.getItem('lastReqNumber') || '0');
    const nextNumber = lastNumber + 1;
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    // Save the new number back to localStorage
    localStorage.setItem('lastReqNumber', String(nextNumber));
    
    return `REQ-${paddedNumber}-${datePart}`;
}

  showToastMsg(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  loadBranchesAndDepartments() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const user: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
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
          }
        });
      }
    });
  }

 loadBranchesAndDepartmentsForEdit(branchId: number | null, deptId: number | null) {
    const user: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
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
            
            if (branchId) {
              this.selectedBranchId = branchId;
              this.filteredDepartments = this.allDepartments.filter(d => d.branch_id == branchId);
              
              if (deptId) {
                this.reqData.department_id = deptId;
                this.onDepartmentChange(); // Load ATTN users but don't override existing ATTN
              }
            } else if (this.isMainBranch && user?.branch_id) {
              this.selectedBranchId = user.branch_id;
              this.filterDepartmentsByBranch(user.branch_id);
            } else {
              this.selectedBranchId = user?.branch_id || null;
              if (this.selectedBranchId) this.filterDepartmentsByBranch(this.selectedBranchId);
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
      if (!this.isLoadingRequisition) {
        this.reqData.attn = '';
      }
      this.attnUsers = [];
    }
}

filterDepartmentsByBranch(branchId: number) {
    this.filteredDepartments = this.allDepartments.filter(d => d.branch_id == branchId);
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
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        console.warn('⚠️ No valid token available for admin/users call');
        this.attnUsers = [];
        return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const selectedDept = this.filteredDepartments.find(d => d.id == this.reqData.department_id);
    const deptBranchId = selectedDept?.branch_id;
    const deptId = selectedDept?.id;
    
    // ✅ SAVE current ATTN before it potentially gets cleared
    const currentAttn = this.reqData.attn;
    console.log('🔍 onDepartmentChange - current ATTN:', currentAttn, 'isLoading:', this.isLoadingRequisition);
    
    // ✅ Clear ATTN when switching departments during new requisition creation
    if (!this.isLoadingRequisition && !this.editMode) {
        this.reqData.attn = '';
    }
    
    this.http.get<any[]>(`${environment.apiUrl}/api/client/users`, { headers }).subscribe({
        next: (users) => {
            this.attnUsers = (users || []).filter(u => {
                const userBranchId = Number(u.branch_id);
                const userDeptId = Number(u.department_id || u.dept_id);
                const matchBranch = userBranchId === Number(deptBranchId);
                const matchDept = !deptId || userDeptId === Number(deptId);
                const role = (u.role || '').toLowerCase().trim();
                const matchRole = role === 'head/manager' || role === 'head manager' || role === 'supervisor';
                return matchBranch && matchDept && matchRole;
            });
            
            // Add department supervisor if available
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
            
            // ✅ ONLY add "Current ATTN" entry when loading an existing requisition (edit/approval mode)
            // NOT when creating a new requisition or switching departments
            if (this.isLoadingRequisition || this.editMode) {
                const savedAttn = currentAttn;
                if (savedAttn && !this.attnUsers.some(u => 
                    (u.fullname || u.username) === savedAttn)) {
                    console.log('⚠️ ATTN not in list, adding as preserved:', savedAttn);
                    this.attnUsers.unshift({
                        fullname: savedAttn,
                        username: savedAttn,
                        role: 'Preserved ATTN'
                    });
                }
            }
            
            // Preserve ATTN during loading of existing requisition
            if (this.isLoadingRequisition) {
                this.reqData.attn = currentAttn || '';
                console.log('🔒 Preserved ATTN during load:', currentAttn);
            } else if (!this.reqData.attn && this.attnUsers.length > 0) {
                // Auto-fill ATTN for new requisitions only if it's empty
                this.reqData.attn = this.attnUsers[0].fullname || this.attnUsers[0].username;
                console.log('🆕 Auto-filled ATTN for new req:', this.reqData.attn);
            }
        },
        error: (err) => {
            console.warn('Could not load ATTN users');
            this.attnUsers = [];
            if (selectedDept?.supervisor) {
                this.attnUsers = [{ fullname: selectedDept.supervisor, username: selectedDept.supervisor, role: 'supervisor' }];
            }
            
            if (this.isLoadingRequisition) {
                this.reqData.attn = currentAttn || '';
            } else if (!this.reqData.attn && selectedDept?.supervisor) {
                this.reqData.attn = selectedDept.supervisor;
            }
        }
    });
}
isAttnInList(): boolean {
    if (!this.reqData.attn) return true;
    return this.attnUsers.some(u => 
      (u.fullname || u.username) === this.reqData.attn
    );
  }
 loadRequisition(id: string) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any>(`${environment.apiUrl}/api/requisitions/${id}`, { headers }).subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response[0] : response;
        if (!data) return;
        
        // ✅ SET FLAG and save attn
        this.isLoadingRequisition = true;
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'); 
        this.isRecipientEdit = !!(currentUser && data.submitted_by !== currentUser.id);
        
        this.reqNumber = data.requisition_number || data.req_number || '';
        const savedBranchId = data.branch_id || null;
        const savedDeptId = data.department_id || null;
        const savedAttn = data.attn || '';
        
        console.log('📋 Loaded requisition - ATTN:', savedAttn, 'Full data:', data);
        
        this.reqData = {
          request_from: data.request_from || '',
          attn: savedAttn, // ✅ Set ATTN from saved data
          department_id: savedDeptId,
          date: this.parseDate(data.date) || new Date().toISOString().split('T')[0],
          time: data.time || '',
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
        
        this.items = data.items || [];
        this.preparedSignature = data.prepared_signature || null;
        this.approvedSignature = data.approved_signature || null;
        this.itemsPreparedSignature = data.items_prepared_signature || null;
        
        if (this.preparedSignature) { this.sigSaved['prepared'] = true; this.sigMode['prepared'] = 'upload'; }
        if (this.approvedSignature) { this.sigSaved['approved'] = true; this.sigMode['approved'] = 'upload'; }
        if (this.itemsPreparedSignature) { this.sigSaved['items_prepared'] = true; this.sigMode['items_prepared'] = 'upload'; }
        
        // ✅ Load branches and departments FIRST, then set ATTN after everything
        this.loadBranchesAndDepartmentsForEdit(savedBranchId, savedDeptId);
        
        // ✅ RESTORE ATTN AFTER ALL ASYNC OPERATIONS COMPLETE
        // Use a subscription/observer pattern or just multiple timeouts
        setTimeout(() => {
            if (savedAttn) {
                this.reqData.attn = savedAttn;
                console.log('🔄 [300ms] Restored ATTN:', savedAttn);
            }
        }, 300);
        
        setTimeout(() => {
            if (savedAttn && this.reqData.attn !== savedAttn) {
                this.reqData.attn = savedAttn;
                console.log('🔄 [800ms] Re-restored ATTN:', savedAttn);
            }
        }, 800);
        
        setTimeout(() => {
            if (savedAttn && this.reqData.attn !== savedAttn) {
                this.reqData.attn = savedAttn;
                console.log('🔄 [1500ms] Final ATTN restore:', savedAttn);
            }
            this.isLoadingRequisition = false;
            console.log('✅ Loading complete. Final ATTN:', this.reqData.attn);
        }, 1500);
        
        // Auto-fill Approved By when Supervisor/Head/Manager edits pending request
        if (!this.approvalMode && this.editMode) {
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          if (currentUser) {
            const role = (currentUser.role || '').toLowerCase();
            if (role === 'supervisor' || role === 'head/manager' || role === 'branch manager') {
              if (!data.approved_name) {
                this.reqData.approved_name = currentUser.fullname || '';
                this.reqData.approved_date = new Date().toISOString().split('T')[0];
              }
            }
          }
        }
        
        if (this.approvalMode) {
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'); 
          if (currentUser) {
            this.reqData.items_prepared_name = this.reqData.items_prepared_name || currentUser.fullname || '';
            this.reqData.items_prepared_date = this.reqData.items_prepared_date || new Date().toISOString().split('T')[0];
            
            const role = (currentUser.role || '').toLowerCase();
            if (role === 'supervisor' || role === 'head/manager' || role === 'branch manager') {
              this.reqData.approved_name = this.reqData.approved_name || currentUser.fullname || '';
              this.reqData.approved_date = this.reqData.approved_date || new Date().toISOString().split('T')[0];
            }
          }
        }
      },
      error: (err) => {
        console.error('Failed to load requisition:', err);
        const saved = JSON.parse(localStorage.getItem('requisitions') || '[]');
        const found = saved.find((r: any) => String(r.id) === String(id) || String(r.requisition_number) === String(id));
        if (found) {
          this.reqNumber = found.requisition_number;
          this.reqData = { ...this.reqData, ...found };
          this.items = found.items || [];
          this.preparedSignature = found.prepared_signature || null;
          this.approvedSignature = found.approved_signature || null;
          this.itemsPreparedSignature = found.items_prepared_signature || null;
          if (found.branch_id) this.loadBranchesAndDepartmentsForEdit(found.branch_id, found.department_id);
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
    } catch { return ''; }
  }

  addItem() { this.items.push({ qty: 1, item: '', unit_price: 0 }); }
  removeItem(index: number) { this.items.splice(index, 1); }

  // Signature methods
  triggerSigFileInput(target: string) {
    const fileInput = document.getElementById(target + 'FileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onSigDragOver(event: DragEvent, target: string) { event.preventDefault(); event.stopPropagation(); this.dragOverTarget = target; }
  onSigDragLeave(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.dragOverTarget = null; }
  
  onSigDrop(event: DragEvent, target: string) {
    event.preventDefault(); event.stopPropagation(); this.dragOverTarget = null;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.processSigFile(files[0], target);
  }

  processSigFile(file: File, target: string) {
    if (!file.type.startsWith('image/')) { this.showToastMsg('Please upload an image file.', 'warning'); return; }
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
    if (target === 'prepared') { this.preparedSignature = null; this.sigMode['prepared'] = 'draw'; }
    if (target === 'approved') { this.approvedSignature = null; this.sigMode['approved'] = 'draw'; }
    if (target === 'items_prepared') { this.itemsPreparedSignature = null; this.sigMode['items_prepared'] = 'draw'; }
    this.sigSaved[target] = false;
  }

  setSigMode(target: string, mode: 'draw' | 'upload') { this.sigMode[target] = mode; }

  // Draggable modal methods
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
        if (ctx) { 
          ctx.strokeStyle = '#000'; 
          ctx.lineWidth = 2; 
          ctx.lineCap = 'round';
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

  closeSigModal() { this.showSigModal = false; this.sigDrawing = false; }

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

  saveSigCanvas(target: string) {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      if (target === 'prepared') this.preparedSignature = dataUrl;
      if (target === 'approved') this.approvedSignature = dataUrl;
      if (target === 'items_prepared') this.itemsPreparedSignature = dataUrl;
      this.sigSaved[target] = true;
    }
  }

  handleSigFile(event: any, target: string) {
    const file = event.target.files?.[0];
    if (file) this.processSigFile(file, target);
  }

  // Submit
  submitRequisition() {
    if (this.approvalMode) {
      if (!this.reqData.items_prepared_name) { this.showToastMsg('Please fill in Requested By name.', 'warning'); return; }
      if (!this.itemsPreparedSignature) { alert('Please provide Requested By signature.'); return; }
      
      this.submitting = true;
      const payload: any = {
        status: 'approved',
        items: this.items,
        items_prepared_name: this.reqData.items_prepared_name,
        items_prepared_date: this.reqData.items_prepared_date,
        items_prepared_signature: this.itemsPreparedSignature
      };
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const url = `${environment.apiUrl}/api/admin/requisitions/${this.editReqId}/status`;
      
      this.http.put(url, payload, { headers }).subscribe({
        next: () => {
          this.submitting = false;
          this.showToastMsg('✅ Requisition accepted!', 'success');
          this.router.navigate(['/admin/requisitions']);
        },
        error: () => { this.submitting = false; this.showToastMsg('⚠️ Failed to accept requisition', 'error'); }
      });
      return;
    }

    // Client mode validation
    if (!this.reqData.request_from) { this.showToastMsg('Please select Request From.', 'warning'); return; }
    if (this.items.length === 0) { this.showToastMsg('Please add at least one item.', 'warning'); return; }
    if (!this.reqData.prepared_name || !this.preparedSignature) { 
      this.showToastMsg('Please fill in Prepared By name and signature.', 'warning'); 
      return; 
    }

    // ✅ Only require Approved By for Head/Manager/Supervisor/Branch Manager
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
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
      approved_signature: this.approvedSignature,
      items_prepared_signature: this.itemsPreparedSignature,
      submitted_by: currentUser.id || null,
    };

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const url = this.editMode && this.editReqId 
      ? `${environment.apiUrl}/api/admin/requisitions/${this.editReqId}` 
      : `${environment.apiUrl}/api/admin/requisitions`;
    
    const request = this.editMode 
      ? this.http.put(url, payload, { headers })
      : this.http.post(url, payload, { headers });

    request.subscribe({
    next: (response: any) => {
        this.submitting = false;
        
        // ✅ ADD: Notify recipient department about new requisition
        if (!this.editMode && response.id) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            this.clientNotificationService.handleNewRequisition(
                { id: response.id, requisition_number: this.reqNumber, submitted_by: currentUser.id },
                currentUser.fullname || 'Admin',
                this.selectedBranchId!,
                this.reqData.department_id
            );
        }
        
        this.showToastMsg(this.editMode ? '✅ Requisition updated!' : '✅ Requisition submitted!', 'success');
        this.router.navigate(['/admin/requisitions']);
    }
});
  }

  cancel() {
    this.router.navigate(['/admin/requisitions']);
  }

  printForm() {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) { alert('Please allow popups for printing'); return; }

    const fmtDate = (val: any) => {
      if (!val) return '—';
      try { const d = new Date(val); if (isNaN(d.getTime())) return String(val); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
      catch { return String(val); }
    };

    const printContent = `<!DOCTYPE html><html><head><title>Requisition - ${this.reqNumber}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:8mm}
        body{font-family:'Courier New',monospace;font-size:9px;color:#000;padding:10px}
        .req-print{background:white;border:2px solid #000;padding:16px 20px;max-width:750px;margin:0 auto}
        .req-header{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
        .req-header .company{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#0a246a}
        .req-header .title{font-size:12px;font-weight:bold;letter-spacing:3px;margin-top:4px}
        .req-header .ctrl-no{font-size:8px;color:#c00;font-weight:bold;margin-top:2px}
        .info-row{display:flex;margin-bottom:4px;font-size:9px}
        .info-label{font-weight:bold;white-space:nowrap;color:#333;width:85px;flex-shrink:0}
        .info-value{flex:1;color:#000}
        .remarks-section{margin:8px 0;padding:6px 8px;border:1px solid #ccc;background:#fafafa;font-size:9px;min-height:30px}
        .remarks-label{font-weight:bold;font-size:9px;margin-bottom:4px}
        .items-table{width:100%;border-collapse:collapse;margin:10px 0}
        .items-table th{background:#f0f4f8;padding:5px 8px;font-size:9px;font-weight:bold;border:1px solid #000;text-align:left}
        .items-table td{padding:4px 8px;font-size:9px;border:1px solid #ccc}
        .total-row{font-weight:bold;background:#f0f4f8}.total-row td{border:1px solid #000}
        .signatures{margin-top:16px;padding-top:10px;border-top:2px solid #000}
        .sig-row{display:flex;gap:12px}
        .sig-block{flex:1;text-align:center;padding:8px;border:1px solid #ccc}
        .sig-label{font-size:8px;font-weight:bold;text-transform:uppercase;color:#555;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:3px}
        .sig-image-area{border:1px solid #eee;min-height:45px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;background:#fafafa}
        .sig-image-area img{max-width:100px;max-height:40px;object-fit:contain}
        .sig-image-area .no-sig{font-size:7px;color:#ccc;font-style:italic}
        .sig-name{font-size:10px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:2px}
        .sig-date{font-size:8px;color:#333}
        .footer{margin-top:12px;padding-top:8px;border-top:1px solid #ccc;text-align:center;font-size:7px;color:#555}
        .footer p{margin:2px 0}
        @media print{body{padding:0;margin:0}.req-print{border:1px solid #000}}
      </style></head><body><div class="req-print">
      <div class="req-header"><div class="company">${this.companyName}</div><div class="title">REQUISITION FORM</div><div class="ctrl-no">CTRL NO.: EDR-30</div><div style="font-size:8px;margin-top:4px;">REQ #: ${this.reqNumber}</div></div>
      <div class="info-row"><span class="info-label">Request From:</span><span class="info-value">${this.reqData.request_from || '—'}</span></div>
      <div class="info-row"><span class="info-label">ATTN:</span><span class="info-value">${this.reqData.attn || '—'}</span></div>
      <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${fmtDate(this.reqData.date)} ${this.reqData.time ? 'at ' + this.reqData.time : ''}</span></div>
      <div class="remarks-section"><div class="remarks-label">Remarks / Reason:</div>${this.reqData.remarks || 'No remarks provided.'}</div>
      <table class="items-table"><thead><tr><th>Qty</th><th>Item Description</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${this.items.length > 0 ? this.items.map((item: any) => `<tr><td>${item.qty || 0}</td><td>${item.item || '—'}</td><td>${(item.unit_price || 0).toFixed(2)}</td><td>${((item.qty || 0) * (item.unit_price || 0)).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#888;font-style:italic;">No items added</td></tr>'}</tbody>${this.items.length > 0 ? `<tfoot><tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total:</td><td>${this.grandTotal.toFixed(2)}</td></tr></tfoot>` : ''}</table>
      <div class="signatures"><div class="sig-row">
      <div class="sig-block"><div class="sig-label">Form Requested By</div><div class="sig-image-area">${this.preparedSignature ? `<img src="${this.preparedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${this.reqData.prepared_name || '_______________'}</div><div class="sig-date">${fmtDate(this.reqData.prepared_date)}</div></div>
      <div class="sig-block"><div class="sig-label">Form Approved By</div><div class="sig-image-area">${this.approvedSignature ? `<img src="${this.approvedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${this.reqData.approved_name || '_______________'}</div><div class="sig-date">${fmtDate(this.reqData.approved_date)}</div></div>
      <div class="sig-block"><div class="sig-label">Form Received By</div><div class="sig-image-area">${this.itemsPreparedSignature ? `<img src="${this.itemsPreparedSignature}" alt="Signature">` : '<span class="no-sig">No signature</span>'}</div><div class="sig-name">${this.reqData.items_prepared_name || '_______________'}</div><div class="sig-date">${fmtDate(this.reqData.items_prepared_date)}</div></div>
      </div></div>
      <div class="footer"><p>📋 Leave R.F. to floor supervisor when BORROWING items, include expected date of return.</p><p>For Outside purchase: indicate if P.O. was made or paid by cash.</p><p>EDPtech Helpdesk v2.0 | Requisition #${this.reqNumber}</p></div>
      </div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}