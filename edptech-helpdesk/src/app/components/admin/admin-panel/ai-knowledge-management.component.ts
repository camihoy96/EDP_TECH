import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface KnowledgeEntry {
  id?: number;
  category: string;
  keywords: string;
  answer: string;
  priority: number;
  is_active?: boolean;
  created_at?: string;
}

@Component({
  selector: 'app-ai-knowledge-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kb-container">
      <div class="kb-header"><h2>🧠 AI Knowledge Base Management</h2><p>Type information and it will be automatically stored in the AI's brain</p></div>

      <div class="kb-form-section">
        <h3>📝 Add Knowledge to AI Brain</h3>
        <div class="simple-form">
          <div class="input-group">
            <textarea [(ngModel)]="promptText" class="prompt-input" rows="4" placeholder="Type the information you want the AI to learn...&#10;&#10;Example:&#10;The EDPTech system has 4 branches. Each branch has different departments like HR, Accounting, and IT. Users can submit tickets for technical support." [disabled]="isLoading"></textarea>
          </div>
          <div class="loading-indicator" *ngIf="isLoading"><div class="spinner"></div><span class="loading-text">Processing & storing knowledge...</span></div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="processAndSave()" [disabled]="isLoading || !promptText.trim()">
              <svg *ngIf="!isLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
              <svg *ngIf="isLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M22 12a10 10 0 0 1-10 10"/></svg>
              {{ isLoading ? 'Storing...' : '🧠 Store Knowledge' }}
            </button>
            <button class="btn btn-clear" (click)="promptText = ''" [disabled]="isLoading">Clear</button>
          </div>
        </div>
      </div>

      <div class="kb-list-section">
        <div class="list-header"><h3>📚 Stored Knowledge ({{ knowledgeEntries.length }})</h3><button class="btn btn-refresh" (click)="loadKnowledgeBase()" [disabled]="isLoading">🔄 Refresh</button></div>
        <div class="kb-search"><input type="text" [(ngModel)]="searchTerm" (input)="filterEntries()" class="form-input" placeholder="Search stored knowledge..."></div>
        <div class="kb-list">
          <div class="kb-card" [class.disabled-card]="!entry.is_active" *ngFor="let entry of filteredEntries">
            <div class="kb-card-header"><span class="kb-category">{{ entry.category | uppercase }}</span><span class="kb-status" [class.active]="entry.is_active" [class.inactive]="!entry.is_active">{{ entry.is_active ? '✅ Active' : '🚫 Disabled' }}</span><button class="btn btn-delete-small" (click)="deleteEntry(entry)" title="Delete">🗑️</button></div>
            <div class="kb-keywords"><strong>Keywords:</strong> {{ entry.keywords }}</div>
            <div class="kb-answer"><strong>Knowledge:</strong><div class="kb-answer-text">{{ entry.answer }}</div></div>
            <div class="kb-card-footer"><span class="kb-date">{{ entry.created_at | date:'MMM d, yyyy h:mm a' }}</span>
              <button class="btn btn-enable" *ngIf="!entry.is_active" (click)="toggleActive(entry)">✅ Enable</button>
              <button class="btn btn-toggle" *ngIf="entry.is_active" (click)="toggleActive(entry)">🚫 Disable</button>
            </div>
          </div>
          <div class="kb-empty" *ngIf="filteredEntries.length === 0">{{ knowledgeEntries.length === 0 ? 'No knowledge stored yet. Type above to add!' : 'No matching entries found' }}</div>
        </div>
      </div>
    </div>

    <!-- Success/Error Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content" [style.left.px]="modalPosition.x" [style.top.px]="modalPosition.y" (click)="$event.stopPropagation()">
        <div class="modal-header" (mousedown)="startDrag($event)" [class.success]="modalType === 'success'" [class.error]="modalType === 'error'" [class.confirm]="modalType === 'confirm'">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-icon">{{ modalType === 'success' ? '✅' : modalType === 'error' ? '❌' : '⚠️' }}</div>
          <p class="modal-message">{{ modalMessage }}</p>
          <div class="modal-actions" *ngIf="modalType === 'confirm'">
            <button class="btn btn-cancel" (click)="confirmAction(false)">Cancel</button>
            <button class="btn btn-danger" (click)="confirmAction(true)">Confirm</button>
          </div>
          <div class="modal-actions" *ngIf="modalType !== 'confirm'">
            <button class="btn btn-primary" (click)="closeModal()">OK</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kb-container{padding:20px;font-family:'Segoe UI',sans-serif;margin:0 auto}
    .kb-header{margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #0a246a;text-align:center}
    .kb-header h2{color:#0a246a;margin:0 0 4px 0;font-size:20px}
    .kb-header p{color:#666;margin:0;font-size:12px}
    .kb-form-section{background:#f8f9fa;border:1px solid #d0d0d0;padding:20px;margin-bottom:20px}
    .kb-form-section h3{margin:0 0 12px 0;color:#0a246a;font-size:14px;text-align:center}
    .simple-form{display:flex;flex-direction:column;gap:12px}
    .input-group{position:relative}
    .prompt-input{width:100%;padding:12px;border:2px solid #c0c0c0;font-size:12px;resize:vertical;font-family:inherit;box-sizing:border-box;transition:border-color 0.2s;min-height:100px}
    .prompt-input:focus{outline:none;border-color:#0a246a;box-shadow:0 0 0 3px rgba(10,36,106,0.1)}
    .prompt-input:disabled{background:#f5f5f5;cursor:not-allowed}
    .loading-indicator{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;background:#f0f4ff;animation:fadeIn 0.3s ease}
    .spinner{width:24px;height:24px;border:3px solid #e0e0e0;border-top-color:#0a246a;border-radius:50%;animation:spin 0.8s linear infinite}
    .loading-text{font-size:12px;color:#0a246a;font-weight:600}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
    .form-actions{display:flex;gap:8px;justify-content:center}
    .btn{padding:8px 16px;border:1px solid #c0c0c0;background:#fff;cursor:pointer;font-size:12px;transition:all 0.15s;display:inline-flex;align-items:center;gap:6px;border-radius:0}
    .btn:disabled{opacity:0.6;cursor:not-allowed}
    .btn-primary{background:#0a246a;color:#fff;border-color:#0a246a;font-weight:600}
    .btn-primary:hover:not(:disabled){background:#0a3a8c}
    .btn-clear{background:#f0f0f0;color:#666}
    .btn-clear:hover:not(:disabled){background:#e0e0e0}
    .btn-refresh{background:#e8f0fe;border-color:#0a246a;color:#0a246a;font-size:10px;padding:4px 10px}
    .btn-toggle{background:#fff8e1;border-color:#ff9800;color:#e65100;font-size:10px;padding:4px 10px}
    .btn-enable{background:#e8f5e9;border-color:#4caf50;color:#2e7d32;font-size:10px;padding:4px 10px;font-weight:600}
    .btn-enable:hover{background:#c8e6c9;border-color:#388e3c}
    .btn-danger{background:#cc0000;color:#fff;border-color:#cc0000;font-weight:600}
    .btn-cancel{background:#f0f0f0;color:#333}
    .btn-delete-small{background:none;border:none;cursor:pointer;font-size:14px;padding:2px 6px;margin-left:auto}
    .btn-delete-small:hover{background:#ffebee}
    .kb-list-section{margin-top:20px}
    .list-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .list-header h3{color:#0a246a;font-size:14px;margin:0}
    .kb-search{margin-bottom:12px}
    .form-input{width:100%;padding:8px 12px;border:1px solid #c0c0c0;font-size:12px;box-sizing:border-box;border-radius:0}
    .kb-list{display:flex;flex-direction:column;gap:10px;max-height:500px;overflow-y:auto}
    .kb-card{background:#fff;border:1px solid #d0d0d0;padding:14px;transition:box-shadow 0.15s,opacity 0.3s}
    .kb-card:hover{box-shadow:0 2px 8px rgba(0,0,0,0.1)}
    .kb-card.disabled-card{background:#fafafa;border-color:#e0e0e0;opacity:0.7}
    .kb-card.disabled-card:hover{opacity:0.9;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
    .kb-card-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .kb-category{background:#0a246a;color:#fff;padding:3px 10px;font-size:10px;font-weight:600;letter-spacing:0.05em}
    .disabled-card .kb-category{background:#888}
    .kb-status{font-size:10px;padding:2px 6px}
    .kb-status.active{background:#e8f5e9;color:#2e7d32}
    .kb-status.inactive{background:#ffebee;color:#cc0000}
    .kb-keywords{font-size:11px;color:#555;margin-bottom:6px}
    .disabled-card .kb-keywords{color:#999}
    .kb-answer{font-size:11px;color:#333;margin-bottom:8px}
    .kb-answer-text{background:#f8f9fa;padding:10px;margin-top:4px;white-space:pre-wrap;max-height:120px;overflow-y:auto;line-height:1.5}
    .disabled-card .kb-answer-text{background:#f5f5f5;color:#999}
    .kb-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0}
    .kb-date{font-size:10px;color:#888}
    .kb-empty{text-align:center;padding:40px 20px;color:#888;font-style:italic;background:#f8f9fa;border:1px dashed #d0d0d0}
    
    /* Modal Styles - No border-radius, no backdrop filter, draggable */
    .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000}
    .modal-content{background:#fff;width:90%;max-width:380px;box-shadow:0 10px 30px rgba(0,0,0,0.3);position:fixed;border-radius:0}
    .modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;color:#fff;cursor:grab;user-select:none}
    .modal-header:active{cursor:grabbing}
    .modal-header.success{background:#008800}
    .modal-header.error{background:#cc0000}
    .modal-header.confirm{background:#cc6600}
    .modal-header h3{margin:0;font-size:13px}
    .modal-close{background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:16px;cursor:pointer;padding:2px 8px}
    .modal-close:hover{background:rgba(255,0,0,0.5)}
    .modal-body{padding:20px;text-align:center}
    .modal-icon{font-size:36px;margin-bottom:10px}
    .modal-message{font-size:12px;color:#333;margin:0 0 16px 0;line-height:1.5}
    .modal-actions{display:flex;gap:8px;justify-content:center}
  `]
})
export class AiKnowledgeManagementComponent implements OnInit {
  knowledgeEntries: KnowledgeEntry[] = [];
  filteredEntries: KnowledgeEntry[] = [];
  searchTerm = '';
  promptText = '';
  isLoading = false;
  
  // Modal properties
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'confirm' = 'success';
  modalPosition = { x: 0, y: 0 };
  private pendingAction: (() => void) | null = null;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const role = (currentUser.role || '').toLowerCase().trim();
    if (role !== 'admin') {
      this.showNotification('error', 'Access Denied', 'Admin privileges required.');
      setTimeout(() => window.history.back(), 1500);
      return;
    }
    this.loadKnowledgeBase();
  }
  
  loadKnowledgeBase() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${environment.apiUrl}/api/ai/knowledge-base`, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.knowledgeEntries = response.data;
          this.filterEntries();
        }
      },
      error: () => {
        this.showNotification('error', 'Error', 'Failed to load knowledge base.');
      }
    });
  }
  
  processAndSave() {
    if (!this.promptText.trim()) {
      this.showNotification('error', 'Error', 'Please type some knowledge to store.');
      return;
    }
    this.isLoading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    this.http.post<any>(`${environment.apiUrl}/api/ai/knowledge-base/process`, { prompt: this.promptText.trim() }, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.promptText = '';
          this.loadKnowledgeBase();
          this.showNotification('success', 'Success', 'Knowledge stored successfully!');
        } else {
          this.showNotification('error', 'Error', 'Failed to store knowledge: ' + (response.error || 'Unknown error'));
        }
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('error', 'Error', 'Failed to store knowledge. Please try again.');
      }
    });
  }
  
  toggleActive(entry: KnowledgeEntry) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    this.http.put<any>(`${environment.apiUrl}/api/ai/knowledge-base/${entry.id}`, { ...entry, is_active: !entry.is_active }, { headers }).subscribe({
      next: () => { 
        this.loadKnowledgeBase();
        const action = entry.is_active ? 'disabled' : 'enabled';
        this.showNotification('success', 'Success', `Knowledge ${action} successfully!`);
      },
      error: () => this.showNotification('error', 'Error', 'Failed to toggle status.')
    });
  }
  
  deleteEntry(entry: KnowledgeEntry) {
    this.showNotification('confirm', 'Confirm Delete', 'Are you sure you want to delete this knowledge entry?', () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.delete<any>(`${environment.apiUrl}/api/ai/knowledge-base/${entry.id}`, { headers }).subscribe({
        next: () => { this.loadKnowledgeBase(); this.showNotification('success', 'Success', 'Knowledge deleted!'); },
        error: () => this.showNotification('error', 'Error', 'Failed to delete.')
      });
    });
  }
  
  filterEntries() {
    if (!this.searchTerm.trim()) {
      this.filteredEntries = [...this.knowledgeEntries];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEntries = this.knowledgeEntries.filter(entry => 
        entry.category.toLowerCase().includes(term) || entry.keywords.toLowerCase().includes(term) || entry.answer.toLowerCase().includes(term)
      );
    }
  }
  
  // Modal methods
  showNotification(type: 'success' | 'error' | 'confirm', title: string, message: string, action?: () => void) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.pendingAction = action || null;
    this.centerModal();
    this.showModal = true;
  }
  
  closeModal() {
    this.showModal = false;
    this.pendingAction = null;
  }
  
  confirmAction(confirmed: boolean) {
    if (confirmed && this.pendingAction) {
      this.pendingAction();
    }
    this.closeModal();
  }
  
  centerModal() {
    this.modalPosition = { x: (window.innerWidth - 380) / 2, y: (window.innerHeight - 250) / 2 };
  }
  
  startDrag(event: MouseEvent) {
    this.isDragging = true;
    this.dragOffsetX = event.clientX - this.modalPosition.x;
    this.dragOffsetY = event.clientY - this.modalPosition.y;
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    event.preventDefault();
  }
  
  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.modalPosition.x = event.clientX - this.dragOffsetX;
    this.modalPosition.y = event.clientY - this.dragOffsetY;
  }
  
  onDragEnd() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }
  
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showModal) this.closeModal();
  }
}