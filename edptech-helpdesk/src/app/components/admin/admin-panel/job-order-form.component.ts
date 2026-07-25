import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-job-order-form',
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
          <div style="font-size:12px;color:#555;" *ngIf="userBranch?.name">
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
          
          <div class="field-row">
            <label>Recipient:</label>
            <select [(ngModel)]="selectedBranchId" class="req-input" (change)="onBranchChange()" [disabled]="approvalMode">
              <option value="">— Select Branch —</option>
              <option [value]="userBranch?.id" *ngIf="userBranch">
                🏢 {{ userBranch?.name }} - Your Branch
              </option>
              <option *ngFor="let branch of availableRecipientBranches" [value]="branch.id">
                🏛️ {{ branch.name }} ({{ branch.company_name }})
              </option>
            </select>
          </div>

          <div class="field-row">
            <label>Dept:</label>
            <select [(ngModel)]="joData.department_id" class="req-input" (change)="onDepartmentChange()" [disabled]="approvalMode">
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
  <!-- Show select when NOT in approval mode -->
  <select *ngIf="!approvalMode" [(ngModel)]="joData.attn" class="req-input">
    <option value="">— Auto from department —</option>
    <option *ngFor="let user of attnUsers" [value]="user.fullname || user.username">
      {{ user.fullname || user.username }} ({{ user.role }})
    </option>
  </select>
  <!-- Show readonly input in approval mode -->
  <input *ngIf="approvalMode" type="text" [ngModel]="joData.attn" class="req-input" readonly>
</div>        </div>

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
              <input type="text" [(ngModel)]="joData.prepared_name" class="req-input-sm" [readonly]="approvalMode">
            </div>
            <div class="sig-field">
              <label>Date:</label>
              <input type="date" [(ngModel)]="joData.prepared_date" class="req-input-sm" [readonly]="approvalMode">
            </div>
            
            <div class="sig-saved-preview" *ngIf="preparedSignature">
              <img [src]="preparedSignature" alt="Signature" class="sig-image-small">
              <span class="sig-saved-label">✓ Signature Saved</span>
              <button type="button" class="sig-clear" (click)="clearSignature('prepared')" *ngIf="!approvalMode">✕</button>
            </div>
            
            <ng-container *ngIf="!preparedSignature && !approvalMode">
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
              <input type="text" [(ngModel)]="joData.approved_name" class="req-input-sm" [readonly]="approvalMode">
            </div>
            <div class="sig-field">
              <label>Date:</label>
              <input type="date" [(ngModel)]="joData.approved_date" class="req-input-sm" [readonly]="approvalMode">
            </div>
            
            <div class="sig-saved-preview" *ngIf="approvedSignature">
              <img [src]="approvedSignature" alt="Signature" class="sig-image-small">
              <span class="sig-saved-label">✓ Signature Saved</span>
              <button type="button" class="sig-clear" (click)="clearSignature('approved')" *ngIf="!approvalMode">✕</button>
            </div>
            
            <ng-container *ngIf="!approvedSignature && !approvalMode">
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

          <!-- Form Received By - EDITABLE in approval mode -->
<div class="sig-block" [class.approval-block]="approvalMode">
  <h5>Form Received By:</h5>
  <div class="sig-field">
    <label>Name:</label>
    <input type="text" [(ngModel)]="joData.received_name" class="req-input-sm" 
           [readonly]="!approvalMode" [placeholder]="approvalMode ? 'Your name' : 'To be filled by recipient'">
  </div>
  <div class="sig-field">
    <label>Date:</label>
    <input type="date" [(ngModel)]="joData.received_date" class="req-input-sm" [readonly]="!approvalMode">
  </div>
  
  <!-- In approval mode: show draw/upload when no signature saved -->
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
  
  <!-- Saved signature preview (shows after saving) -->
  <div class="sig-saved-preview" *ngIf="receivedSignature">
    <img [src]="receivedSignature" alt="Signature" class="sig-image-small">
    <span class="sig-saved-label">✓ Signature Saved</span>
    <button type="button" class="sig-clear" (click)="clearSignature('received')" *ngIf="approvalMode">✕</button>
  </div>
  
  <!-- Show placeholder only when NOT in approval mode AND no signature -->
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
       [ngStyle]="{'transform': 'translate(' + sigModalPos.x + 'px, ' + sigModalPos.y + 'px)'}"
       (click)="$event.stopPropagation()">
    <div class="sig-modal-header" 
         (mousedown)="startSigDrag($event)"
         style="cursor: move;">
      <span>✍️ Draw Signature</span>
      <button type="button" class="sig-modal-close" (click)="closeSigModal()">✕</button>
    </div>
    <div class="sig-modal-body">
      <canvas id="sigModalCanvas" class="sig-modal-canvas"
              (mousedown)="startSigDraw($event)"
              (mousemove)="drawSig($event)"
              (mouseup)="stopSigDraw()"
              (mouseleave)="stopSigDraw()"
              (touchstart)="startSigDraw($event)"
              (touchmove)="drawSig($event)"
              (touchend)="stopSigDraw()"></canvas>
    </div>
    <div class="sig-modal-footer">
      <button type="button" class="sig-modal-btn clear" (click)="clearSigCanvas()">🗑️ Clear</button>
      <button type="button" class="sig-modal-btn cancel" (click)="closeSigModal()">Cancel</button>
      <button type="button" class="sig-modal-btn save" (click)="saveSigCanvas(); closeSigModal()">✅ Save Signature</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .req-container { padding: 16px; max-width: 1500px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; font-size: 12px; background: #d4d0c8; min-height: 100vh; }
    .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 8px 14px; background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .header-left h1 { margin: 0; font-size: 16px; }
    .header-sub { font-size: 12px; opacity: 0.8; }
    .print-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 4px 12px; cursor: pointer; font-size: 12px; }
    .close-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 4px 12px; font-size: 14px; font-weight: bold; border-radius: 0px; line-height: 1; }
    .close-btn:hover { background: rgba(255,0,0,0.7); border-color: rgba(255,255,255,0.6); }
    .req-form { background: white; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 20px; font-family: 'Courier New', monospace; }
    .req-form-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .req-form-header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #0a246a; }
    .req-form-header h3 { margin: 4px 0; font-size: 14px; color: #04060c; }
    .ctrl-no { font-size: 9px; color: #cc0000; font-weight: bold; }
    .req-top-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .field-row { display: flex; align-items: center; gap: 4px; }
    .field-row label { font-weight: bold; font-size: 12px; white-space: nowrap; color: #0f0e0e; }
    .req-input { flex: 1; padding: 4px 6px; border: 1px solid #888; font-size: 12px; color: #0f0e0e; font-family: 'Courier New', monospace; }
    .req-input:disabled { background: #e8e8e8; color: #666; cursor: not-allowed; }
    .req-textarea { width: 100%; padding: 6px; border: 1px solid #888; font-size: 12px; font-family: 'Courier New', monospace; resize: vertical; box-sizing: border-box; }
    .req-section { margin-bottom: 12px; color: #0f0e0e; font-weight: bold; }
    .req-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .sig-block { border: 1px solid #ccc; padding: 8px; background: #fafafa; }
    .sig-block.approval-block { border: 2px solid #008800; background: #f0fff0; }
    .sig-block h5 { margin: 0 0 6px 0; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .sig-field { display: flex; align-items: center; margin-bottom: 3px; }
    .sig-field label { width: 30px; font-size: 9px; font-weight: bold; color: #0f0e0e; }
    .req-input-sm { flex: 1; padding: 3px 5px; border: 1px solid #ccc; font-size: 12px; font-family: 'Courier New', monospace; }
    .req-footer { align-items: center; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000; color: #0f0e0e; }
    .req-footer p { margin: 2px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .action-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
    .action-btn.cancel { background: #f0f0f0; color: #000; }
    .action-btn.submit { background: #0a3a8c; color: white; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sig-options { display: flex; gap: 4px; margin: 4px 0; }
    .sig-option-btn { flex: 1; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 8px; border-radius: 2px; }
    .sig-option-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .sig-draw-trigger { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; border: 2px dashed #ccc; background: #fafafa; cursor: pointer; width: 100%; border-radius: 4px; font-size: 9px; color: #666; }
    .sig-draw-trigger:hover { border-color: #0a3a8c; background: #e8f0ff; color: #0a3a8c; }
    .sig-draw-icon { font-size: 24px; }
    .sig-upload { border: 1px dashed #ccc; padding: 8px; text-align: center; margin-top: 4px; }
    .sig-upload.has-file { border-style: solid; border-color: #008800; }
    .sig-upload.drag-over { border-color: #0a3a8c; border-style: solid; background: #e8f0ff; }
    .sig-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; font-size: 9px; color: #888; cursor: pointer; }
    .sig-icon { font-size: 20px; }
    .sig-saved-preview { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding: 4px 8px; background: #f0fff0; border: 1px solid #88cc88; border-radius: 3px; }
    .sig-image-small { max-width: 100px; max-height: 40px; object-fit: contain; }
    .sig-saved-label { font-size: 9px; color: #008800; font-weight: bold; }
    .sig-clear { background: rgba(204,0,0,0.8); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 8px; padding: 1px 4px; margin-left: 6px; }
    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 12px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 3000; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
    .toast-notification.warning { background: #cc6600; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .sig-modal { background: white; border: 2px solid #808080; box-shadow: 3px 4px 14px rgba(0,0,0,0.3); width: 800px; max-width: 95vw; position: relative; user-select: none; }
    .sig-modal-header { background: linear-gradient(180deg, #1c5fb5, #0a3a8c); color: white; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold; }
    .sig-modal-close { background: none; border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; font-size: 16px; padding: 4px 10px; line-height: 1; }
    .sig-modal-close:hover { background: rgba(255,0,0,0.7); }
    .sig-modal-body { padding: 20px; background: #f5f5f5; display: flex; justify-content: center; }
    .sig-modal-canvas { border: 2px solid #ccc; background: white; cursor: crosshair; display: block; width: 750px; height: 300px; touch-action: none; }
    .sig-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 12px 20px; border-top: 1px solid #ddd; background: #fafafa; }
    .sig-modal-btn { padding: 8px 20px; border: 2px solid; border-color: #fff #808080 #584a4a #fff; cursor: pointer; font-size: 12px; font-weight: bold; border-radius: 3px; }
    .sig-modal-btn.clear { background: #f0f0f0; color: #cc0000; }
    .sig-modal-btn.cancel { background: #f0f0f0; color: #000; }
    .sig-modal-btn.save { background: #008800; color: white; border-color: #00aa00 #006600 #006600 #00aa00; }
    .sig-modal-btn:hover { filter: brightness(0.95); }
  `]
})
export class AdminJobOrderFormComponent implements OnInit {
  submitting = false;
  editMode = false;
  editReqId: string | null = null;
  approvalMode = false;
  joNumber: string = '';
  joCtrlNumber: string = '';
  showToast = false;
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
  preparedSignature: string | null = null;
  approvedSignature: string | null = null;
  receivedSignature: string | null = null;
  showSigModal = false;
  sigModalTarget: string = '';
  dragOverTarget: string | null = null;
  private sigDrawing = false;
  sigMode: Record<string, 'draw' | 'upload'> = { 
    'prepared': 'draw', 
    'approved': 'draw',
    'received': 'draw' 
  };
  sigSaved: Record<string, boolean> = { 
    'prepared': false, 
    'approved': false,
    'received': false 
  };
  joData: any = {
    request_from: '', attn: '', department_id: null,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    remarks: '', prepared_name: '', prepared_date: new Date().toISOString().split('T')[0],
    approved_name: '', approved_date: '', received_name: '', received_date: '',
  };
sigModalPos = { x: 0, y: 0 };
private isDraggingSig = false;
private sigDragStart = { x: 0, y: 0 };
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
        if (params['mode'] === 'approve') {
          this.approvalMode = true;
        }
        this.loadJobOrder(params['id']);
      } else {
        this.joNumber = this.generateJONumber();
        this.joCtrlNumber = this.generateCtrlNumber();
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

 loadJobOrder(id: string) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  console.log('Loading job order with id:', id);
  
  // ✅ Try client endpoint first (handles both numeric ID and job_order_number)
  this.http.get<any>(`${environment.apiUrl}/api/job-orders/${id}`, { headers }).subscribe({
    next: (data) => {
      const jo = data.jobOrder || data;
      console.log('Loaded job order:', jo);
      this.populateFormFromJobOrder(jo);
    },
    error: (err) => {
      console.error('Client endpoint failed, trying admin:', err);
      // Fallback: try admin endpoint
      this.http.get<any>(`${environment.apiUrl}/api/admin/job-orders/${id}`, { headers }).subscribe({
        next: (data) => {
          const jo = data.jobOrder || data;
          console.log('Loaded from admin endpoint:', jo);
          this.populateFormFromJobOrder(jo);
        },
        error: (err2) => {
          console.error('Both endpoints failed:', err2);
          this.showToastMsg('Failed to load job order', 'error');
        }
      });
    }
  });
}
populateFormFromJobOrder(jo: any) {
  this.joNumber = jo.jo_number || jo.job_order_number || '';
  this.joCtrlNumber = jo.ctrl_no || jo.crtk_no || '';
  this.selectedBranchId = jo.branch_id || null;
  
  // ✅ Parse dates properly
  const parseDate = (val: any): string => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}\s/.test(val)) return val.split(' ')[0];
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch { return ''; }
  };
  
  // ✅ Parse time properly
  const parseTime = (val: any): string => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) return val;
      if (typeof val === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(val)) return val.substring(0, 5);
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return ''; }
  };
  
  const attnValue = jo.job_order_for || jo.attn || '';
  
  this.joData = {
    request_from: jo.request_dept || jo.request_from || '',
    attn: attnValue,
    department_id: jo.department_id || null,
    date: parseDate(jo.date) || new Date().toISOString().split('T')[0],
    time: parseTime(jo.time) || new Date().toTimeString().split(' ')[0].substring(0, 5),
    remarks: jo.particulars || jo.remarks || '',
    prepared_name: jo.requested_name || jo.prepared_name || '',
    prepared_date: parseDate(jo.requested_date || jo.prepared_date) || new Date().toISOString().split('T')[0],
    approved_name: jo.approved_name || '',
    approved_date: parseDate(jo.approved_date) || '',
    received_name: jo.received_name || '',
    received_date: parseDate(jo.received_date) || '',
  };
  
  if (attnValue) {
    this.attnUsers = [{ fullname: attnValue, username: attnValue, role: '' }];
  }
  
  this.preparedSignature = jo.requested_signature || jo.prepared_signature || null;
  this.approvedSignature = jo.approved_signature || null;
  this.receivedSignature = jo.received_signature || null;
  
  if (this.preparedSignature) this.sigSaved['prepared'] = true;
  if (this.approvedSignature) this.sigSaved['approved'] = true;
  if (this.receivedSignature) this.sigSaved['received'] = true;
  
  if (this.approvalMode) {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.joData.received_name = currentUser.fullname || '';
      this.joData.received_date = new Date().toISOString().split('T')[0];
    }
  }
  
  this.loadBranchesAndDepartments();
}
  showToastMsg(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = msg; 
    this.toastType = type; 
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }

  get companyName(): string {
    if (this.userBranch?.company_name) return this.userBranch.company_name;
    if (this.userBranch?.name) return this.userBranch.name;
    return 'Lee Super Plaza';
  }

  get availableRecipientBranches(): any[] {
    const user: any = this.authService.getCurrentUser();
    const userBranchId = Number(user?.branch_id);
    if (this.mainBranchIds.includes(userBranchId)) return this.mainBranches.filter(b => b.id !== userBranchId);
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
                displayName: `${d.name} — ${branch?.name || 'Unknown'} (${branch?.company_name || 'N/A'})` 
              };
            });
            
            if (!this.editMode) {
              const userBranchId = Number(user?.branch_id);
              const userDeptId = Number(user?.dept_id);
              this.selectedBranchId = userBranchId;
              this.joData.department_id = userDeptId;
            }
            this.onBranchChange();
          },
          error: (err) => { console.error('Failed to load departments:', err); }
        });
      },
      error: (err) => { console.error('Failed to load branches:', err); }
    });
  }
// ✅ Signature modal drag methods
startSigDrag(event: MouseEvent) {
  this.isDraggingSig = true;
  this.sigDragStart = {
    x: event.clientX - this.sigModalPos.x,
    y: event.clientY - this.sigModalPos.y
  };
  event.preventDefault();
  
  // Add temporary event listeners
  document.addEventListener('mousemove', this.onSigDragMove);
  document.addEventListener('mouseup', this.onSigDragEnd);
}

onSigDragMove = (event: MouseEvent) => {
  if (!this.isDraggingSig) return;
  this.sigModalPos = {
    x: event.clientX - this.sigDragStart.x,
    y: event.clientY - this.sigDragStart.y
  };
}

onSigDragEnd = () => {
  this.isDraggingSig = false;
  document.removeEventListener('mousemove', this.onSigDragMove);
  document.removeEventListener('mouseup', this.onSigDragEnd);
}
onBranchChange() {
    if (this.selectedBranchId) {
        // ✅ Create new array reference to trigger change detection
        this.filteredDepartments = [...this.allDepartments.filter(d => d.branch_id == this.selectedBranchId)];
        
        console.log('🔍 Admin JO - Branch changed to:', this.selectedBranchId, 'Departments:', this.filteredDepartments.length);
        
        // ✅ Always reset department and ATTN when branch changes
        this.joData.department_id = null;
        this.joData.attn = '';
        this.attnUsers = [];
        
        // ✅ Auto-select first department if available
        if (this.filteredDepartments.length > 0) {
            this.joData.department_id = this.filteredDepartments[0].id;
            setTimeout(() => this.onDepartmentChange(), 50);
        }
    } else {
        this.filteredDepartments = [];
        this.joData.department_id = null;
        this.joData.attn = '';
        this.attnUsers = [];
    }
    this.generateCtrlNumber();
}
 loadAttnUsers() {
  if (!this.selectedBranchId || !this.joData.department_id) {
    if (!this.editMode && !this.approvalMode) {
      this.attnUsers = [];
      this.joData.attn = '';
    }
    return;
  }
  
  this.loadAttnUsersFromApi();
}
loadAttnUsersFromApi() {
  if (!this.selectedBranchId || !this.joData.department_id) {
    return;
  }
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/users/by-dept/${this.joData.department_id}`, { headers }).subscribe({
    next: (users) => {
      if (users && users.length > 0) {
        // Add API users that aren't already in the list
        const existingNames = new Set(this.attnUsers.map(u => u.fullname || u.username));
        const newUsers = users.filter(u => !existingNames.has(u.fullname || u.username));
        this.attnUsers = [...this.attnUsers, ...newUsers];
      }
    },
    error: (err) => {
      console.error('Failed to load additional attn users:', err);
    }
  });
}
onDepartmentChange() {
    if (!this.joData.department_id) {
      this.attnUsers = [];
      this.joData.attn = '';
      return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const selectedDept = this.filteredDepartments.find(d => d.id == this.joData.department_id);
    const deptBranchId = selectedDept?.branch_id;
    const deptId = selectedDept?.id;
    
    console.log('🔍 Admin JO - Loading ATTN users - dept:', deptId, 'branch:', deptBranchId);
    
    // ✅ First, set supervisor as default if available
    if (selectedDept?.supervisor) {
      this.joData.attn = selectedDept.supervisor;
      this.attnUsers = [{
        fullname: selectedDept.supervisor,
        username: selectedDept.supervisor,
        role: 'supervisor'
      }];
    } else {
      this.joData.attn = '';
      this.attnUsers = [];
    }
    
    // ✅ Use the CLIENT endpoint to get users by department (loads from BOTH tables)
    this.http.get<any[]>(`${environment.apiUrl}/api/client/users/by-dept/${deptId}`, { headers }).subscribe({
      next: (users) => {
        console.log('📥 Admin JO - Received', users?.length, 'users from API');
        
        // Filter by branch AND role (Head/Manager & Supervisor only)
        const apiUsers = (users || []).filter(u => {
          const userBranchId = Number(u.branch_id);
          const userDeptId = Number(u.department_id || u.dept_id);
          const matchBranch = userBranchId === Number(deptBranchId);
          const matchDept = userDeptId === Number(deptId);
          const role = (u.role || '').toLowerCase().trim();
          const matchRole = role === 'head/manager' || role === 'head manager' || role === 'supervisor';
          return matchBranch && matchDept && matchRole;
        });
        
        console.log('👥 Admin JO - ATTN users:', apiUsers.length);
        
        // Merge with existing supervisor entry (avoid duplicates)
        const existingNames = new Set(this.attnUsers.map(u => u.fullname || u.username));
        const newUsers = apiUsers.filter(u => !existingNames.has(u.fullname || u.username));
        this.attnUsers = [...this.attnUsers, ...newUsers];
        
        // If attn is still empty and we have users, auto-select first
        if (!this.joData.attn && this.attnUsers.length > 0) {
          this.joData.attn = this.attnUsers[0].fullname || this.attnUsers[0].username;
        }
      },
      error: (err) => {
        console.error('❌ Admin JO - Failed to load ATTN users:', err.status, err.message);
        // Keep the supervisor as default if API fails
      }
    });
    
    this.generateCtrlNumber();
}
  generateJONumber(): string {
    const yr = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `JO-${yr}-${rand}`;
  }

  generateCtrlNumber(): string {
    const yr = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `CTRL-JO-${yr}-${rand}`;
  }

  setSigMode(target: string, mode: 'draw' | 'upload') {
    this.sigMode[target] = mode;
  }

  triggerSigFileInput(target: string) {
    const fileInput = document.getElementById(`${target}FileInput`) as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  handleSigFile(event: any, target: string) {
    const file = event.target.files[0];
    if (file) this.processSigFile(file, target);
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
    const file = event.dataTransfer?.files[0];
    if (file) this.processSigFile(file, target);
  }

  processSigFile(file: File, target: string) {
    if (!file.type.startsWith('image/')) {
      this.showToastMsg('Please upload an image file', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400, maxH = 150;
        let w = img.width, h = img.height;
        if (w > maxW) { h *= maxW / w; w = maxW; }
        if (h > maxH) { w *= maxH / h; h = maxH; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png');
        this.setSignatureData(target, dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  setSignatureData(target: string, dataUrl: string) {
    if (target === 'prepared') this.preparedSignature = dataUrl;
    else if (target === 'approved') this.approvedSignature = dataUrl;
    else if (target === 'received') this.receivedSignature = dataUrl;
    this.sigSaved[target] = true;
    this.showToastMsg('Signature saved!', 'success');
  }

  clearSignature(target: string) {
    if (target === 'prepared') this.preparedSignature = null;
    else if (target === 'approved') this.approvedSignature = null;
    else if (target === 'received') this.receivedSignature = null;
    this.sigSaved[target] = false;
  }

  openSigModal(target: string) {
  this.sigModalTarget = target;
  this.sigModalPos = { x: 0, y: 0 }; 
  this.showSigModal = true;
  setTimeout(() => this.initSigCanvas(target), 100);
}

  closeSigModal() {
    this.showSigModal = false;
  }

  initSigCanvas(target: string) {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (target === 'prepared' && this.preparedSignature) {
      this.loadSigToCanvas(canvas, this.preparedSignature);
    } else if (target === 'approved' && this.approvedSignature) {
      this.loadSigToCanvas(canvas, this.approvedSignature);
    } else if (target === 'received' && this.receivedSignature) {
      this.loadSigToCanvas(canvas, this.receivedSignature);
    }
  }

  loadSigToCanvas(canvas: HTMLCanvasElement, dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }

  startSigDraw(event: any) {
    event.preventDefault();
    this.sigDrawing = true;
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  drawSig(event: any) {
    if (!this.sigDrawing) return;
    event.preventDefault();
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  stopSigDraw() { 
    this.sigDrawing = false; 
  }

  clearSigCanvas() {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) { 
      ctx.fillStyle = 'white'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height); 
    }
  }

  saveSigCanvas() {
    const canvas = document.getElementById('sigModalCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    this.setSignatureData(this.sigModalTarget, dataUrl);
  }
submitJobOrder() {
    // Approval mode - receive the job order
    if (this.approvalMode) {
      if (!this.joData.received_name) {
        this.showToastMsg('Please fill in Received By name.', 'warning');
        return;
      }
      if (!this.receivedSignature) {
        this.showToastMsg('Please provide Received By signature.', 'warning');
        return;
      }

      this.submitting = true;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const payload = {
        received_name: this.joData.received_name,
        received_date: this.joData.received_date || new Date().toISOString().split('T')[0],
        received_signature: this.receivedSignature,
        status: 'approved'
      };

      console.log('📤 Approval payload:', payload);

      // ✅ FIXED: Use ADMIN endpoint
      this.http.put(`${environment.apiUrl}/api/admin/job-orders/${this.editReqId}/receive`, payload, { headers }).subscribe({
        next: () => {
          this.showToastMsg('📥 Job Order received successfully!', 'success');
          setTimeout(() => this.cancel(), 1500);
        },
        error: (err) => {
          console.error('Failed to receive:', err);
          this.showToastMsg('Failed to receive job order', 'error');
          this.submitting = false;
        }
      });
      return;
    }
    
    // Normal submit/edit mode
    if (!this.joData.request_from || !this.joData.attn || !this.joData.department_id) {
      this.showToastMsg('Please fill in all required fields', 'warning');
      return;
    }
    
    this.submitting = true;
    
    const formatDate = (val: any): string => {
      if (!val) return new Date().toISOString().split('T')[0];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      try {
        return new Date(val).toISOString().split('T')[0];
      } catch { return new Date().toISOString().split('T')[0]; }
    };
    
    const payload: any = {
      job_order_number: this.joNumber,
      ctrl_no: this.joCtrlNumber,
      date: formatDate(this.joData.date),
      time: this.joData.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
      request_dept: this.joData.request_from,
      department: this.getDepartmentName(this.joData.department_id),
      branch_id: this.selectedBranchId,
      department_id: this.joData.department_id,
      particulars: this.joData.remarks,
      job_order_for: this.joData.attn,
      requested_name: this.joData.prepared_name,
      requested_date: formatDate(this.joData.prepared_date),
      requested_signature: this.preparedSignature || null,
      prepared_signature: this.preparedSignature || null,  // ✅ Send both field names
      approved_name: this.joData.approved_name || null,
      approved_date: this.joData.approved_date ? formatDate(this.joData.approved_date) : null,
      approved_signature: this.approvedSignature || null,
      received_name: this.joData.received_name || null,
      received_date: this.joData.received_date || null,
      received_signature: this.receivedSignature || null,
      submitted_by: this.authService.getCurrentUser()?.id || null,
      status: 'pending'
    };

    console.log('📤 Submitting payload:', payload);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    // ✅ FIXED: Use ADMIN endpoint
    const url = this.editMode 
      ? `${environment.apiUrl}/api/admin/job-orders/${this.editReqId}` 
      : `${environment.apiUrl}/api/admin/job-orders`;  // ← /api/admin/job-orders

    const request = this.editMode 
      ? this.http.put(url, payload, { headers })
      : this.http.post(url, payload, { headers });

    request.subscribe({
      next: (res: any) => {
        console.log('✅ Server response:', res);
        this.showToastMsg(this.editMode ? 'Job Order updated!' : 'Job Order submitted successfully!', 'success');
        setTimeout(() => this.cancel(), 1500);
      },
      error: (err) => {
        this.showToastMsg('Failed to save Job Order', 'error');
        console.error('❌ Error:', err);
        this.submitting = false;
      }
    });
}
getDepartmentName(deptId: number): string {
    if (!deptId) return '';
    const dept = this.filteredDepartments.find(d => d.id == deptId) || 
                 this.allDepartments.find(d => d.id == deptId);
    return dept?.name || '';
}
  printForm() { 
    window.print(); 
  }

 cancel() {
  if (this.approvalMode) {
    this.router.navigate(['/admin/job-orders'], { replaceUrl: true });
  } else {
    window.history.back();
  }
}
}