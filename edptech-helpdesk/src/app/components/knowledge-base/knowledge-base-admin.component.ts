import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-knowledge-base-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ═══════════ LIST VIEW ═══════════ -->
    <div class="admin-container" *ngIf="!showEditor">
      <div class="retro-header">
        <div class="header-left">
          <h2>📚 Knowledge Base</h2>
          <span class="header-sub">Manage articles and documentation</span>
        </div>
        <div class="header-actions">
          <button class="retro-btn primary" (click)="createArticle()" *ngIf="canEdit()">
            📝 Create Article
          </button>
        </div>
      </div>

      <div class="articles-list">
        <div class="article-row" *ngFor="let article of articles">
          <div class="article-info">
            <div class="article-title">
              <span *ngIf="article.featured">⭐</span> {{ article.title }}
            </div>
            <div class="article-meta">
              <span>{{ getCategoryLabel(article.category) }}</span>
              <span>👤 {{ article.author_name || 'Unknown' }}</span>
              <span class="status-badge" [class]="'status-' + article.status">
                {{ article.status === 'published' ? '✅ Published' : article.status === 'draft' ? '📝 Draft' : '📦 Archived' }}
              </span>
              <span>📅 {{ article.created_at | date:'MMM d, yyyy' }}</span>
            </div>
          </div>
          <div class="article-actions" *ngIf="canEdit()">
            <button class="retro-btn" (click)="editArticle(article)">✏️ Edit</button>
            <button class="retro-btn danger" (click)="confirmDeleteFromList(article)">🗑️ Delete</button>
          </div>
        </div>
        <div class="empty-state" *ngIf="articles.length === 0 && !isLoading">
          <span>📭</span><p>No articles yet</p>
          <button class="retro-btn primary" (click)="createArticle()" *ngIf="canEdit()">📝 Create First Article</button>
        </div>
        <div class="loading-state" *ngIf="isLoading"><div class="spinner"></div><p>Loading articles...</p></div>
      </div>
    </div>

    <!-- ═══════════ EDITOR VIEW ═══════════ -->
    <div class="admin-container" *ngIf="showEditor">
      <div class="retro-header">
        <div class="header-left">
          <h2>{{ editingArticle ? '✏️ Edit Article' : '📝 Create New Article' }}</h2>
          <span class="header-sub">Knowledge Base Management</span>
        </div>
        <div class="header-actions">
          <button class="retro-btn" (click)="togglePreview()">{{ showPreview ? '📝 Edit' : '👁️ Preview' }}</button>
          <button class="retro-btn" (click)="goBack()">✕ Close</button>
        </div>
      </div>
      <div class="main-layout">
        <div class="editor-panel" *ngIf="!showPreview">
          <div class="form-card">
            <div class="form-group"><label>📌 Article Title <span class="required">*</span></label><input type="text" class="retro-input" [(ngModel)]="articleForm.title" placeholder="Enter a descriptive title..."></div>
            <div class="form-row">
              <div class="form-group flex-1"><label>📂 Category</label><select class="retro-input" [(ngModel)]="articleForm.category"><option value="">Select category...</option><option *ngFor="let cat of categories" [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option></select></div>
              <div class="form-group flex-1"><label>🏷️ Tags</label><input type="text" class="retro-input" [(ngModel)]="articleForm.tags" placeholder="e.g., printer, network"></div>
            </div>
            <div class="form-group"><label>📝 Summary</label><input type="text" class="retro-input" [(ngModel)]="articleForm.summary" placeholder="Brief summary..."></div>
            <div class="form-row">
              <div class="form-group flex-1"><label>👤 Author</label><input type="text" class="retro-input" [(ngModel)]="articleForm.author_name" [placeholder]="currentUser?.fullname || 'Author name'"></div>
              <div class="form-group flex-1"><label>📊 Status</label><select class="retro-input" [(ngModel)]="articleForm.status"><option value="draft">📝 Draft</option><option value="published">✅ Published</option><option value="archived">📦 Archived</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="checkbox-label"><input type="checkbox" [(ngModel)]="articleForm.featured"> ⭐ Featured Article</label><small>Featured articles appear at the top</small></div>
              <div class="form-group flex-1" *ngIf="articleForm.featured"><label>📊 Display Order</label><input type="number" class="retro-input" [(ngModel)]="articleForm.display_order" min="0" max="100" style="width:80px;"></div>
            </div>
            <div class="form-group">
              <label>📄 Content <span class="editor-tabs"><button class="tab-btn" [class.active]="editorMode==='visual'" (click)="editorMode='visual'">Visual</button><button class="tab-btn" [class.active]="editorMode==='html'" (click)="editorMode='html'">HTML</button></span></label>
              <div class="editor-toolbar" *ngIf="editorMode==='visual'">
                <button class="tool-btn" (click)="insertFormat('bold')"><b>B</b></button><button class="tool-btn" (click)="insertFormat('italic')"><i>I</i></button><button class="tool-btn" (click)="insertFormat('underline')"><u>U</u></button><span class="tool-sep"></span>
                <button class="tool-btn" (click)="insertFormat('h3')">H3</button><button class="tool-btn" (click)="insertFormat('h4')">H4</button><span class="tool-sep"></span>
                <button class="tool-btn" (click)="insertFormat('ul')">• List</button><button class="tool-btn" (click)="insertFormat('ol')">1. List</button><span class="tool-sep"></span>
                <button class="tool-btn" (click)="insertFormat('code')">&lt;/&gt;</button><button class="tool-btn" (click)="insertFormat('note')">ℹ️</button><button class="tool-btn" (click)="insertFormat('warning')">⚠️</button>
              </div>
              <textarea *ngIf="editorMode==='visual'" class="retro-input content-editor" [(ngModel)]="articleForm.content" placeholder="Write your article content here..."></textarea>
              <textarea *ngIf="editorMode==='html'" class="retro-input content-editor html-editor" [(ngModel)]="articleForm.content" placeholder="<h3>Section Title</h3>..."></textarea>
              <small class="editor-hint">💡 {{ editorMode==='visual' ? 'Use toolbar to format. HTML supported.' : 'Write raw HTML.' }}</small>
            </div>
            <div class="action-bar">
              <button class="retro-btn primary" (click)="saveArticle()" [disabled]="saving">{{ saving ? '⏳ Saving...' : (editingArticle ? '💾 Update' : '💾 Publish') }}</button>
              <button class="retro-btn" (click)="saveAsDraft()" [disabled]="saving" *ngIf="!editingArticle || editingArticle?.status==='draft'">📝 Save Draft</button>
              <button class="retro-btn danger" (click)="confirmDeleteArticle()" *ngIf="editingArticle" [disabled]="saving">🗑️ Delete</button>
              <button class="retro-btn" (click)="goBack()">✕ Cancel</button>
            </div>
          </div>
        </div>
        <div class="preview-panel" *ngIf="showPreview">
          <div class="preview-card">
            <div class="preview-header"><span class="preview-badge" *ngIf="articleForm.featured">⭐ Featured</span><span class="preview-badge status" [class]="'status-'+articleForm.status">{{ articleForm.status==='published'?'✅ Published':articleForm.status==='draft'?'📝 Draft':'📦 Archived' }}</span></div>
            <h2 class="preview-title">{{ articleForm.title || 'Untitled' }}</h2>
            <div class="preview-meta"><span>📂 {{ getCategoryLabel(articleForm.category) }}</span><span>👤 {{ articleForm.author_name || 'Unknown' }}</span><span>📅 {{ today | date:'MMM d, yyyy' }}</span></div>
            <div class="preview-summary" *ngIf="articleForm.summary">{{ articleForm.summary }}</div>
            <div class="preview-content" [innerHTML]="previewContent"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ DELETE CONFIRMATION MODAL (Draggable) ═══════════ -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
      <div class="modal-dialog" (click)="$event.stopPropagation()" [style.left.px]="deleteModalPos.x" [style.top.px]="deleteModalPos.y">
        <div class="modal-header danger" (mousedown)="startDrag($event, 'delete')">
          <span>🗑️ Delete Article</span>
          <button class="modal-close" (click)="cancelDelete()" [disabled]="saving">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Delete this article permanently?</h3>
              <p>Article: <strong>"{{ deleteTarget?.title || 'Untitled' }}"</strong></p>
              <p class="warning-text">This action cannot be undone. All content will be permanently removed.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="retro-btn" (click)="cancelDelete()" [disabled]="saving">Cancel</button>
          <button class="retro-btn danger" (click)="executeDelete()" [disabled]="saving">{{ saving ? '⏳ Deleting...' : '🗑️ Yes, Delete' }}</button>
        </div>
      </div>
    </div>

    <!-- ═══════════ SUCCESS MODAL (Draggable) ═══════════ -->
    <div class="modal-overlay" *ngIf="showSuccessModal" (click)="closeSuccessModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()" [style.left.px]="successModalPos.x" [style.top.px]="successModalPos.y">
        <div class="modal-header success" (mousedown)="startDrag($event, 'success')">
          <span>✅ Success</span>
          <button class="modal-close" (click)="closeSuccessModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">✅</span>
            <div class="warning-message"><h3>{{ successMessage }}</h3></div>
          </div>
        </div>
        <div class="modal-footer"><button class="retro-btn primary" (click)="closeSuccessModal()">OK</button></div>
      </div>
    </div>

    <!-- ═══════════ ERROR MODAL (Draggable) ═══════════ -->
    <div class="modal-overlay" *ngIf="showErrorModal" (click)="closeErrorModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()" [style.left.px]="errorModalPos.x" [style.top.px]="errorModalPos.y">
        <div class="modal-header error" (mousedown)="startDrag($event, 'error')">
          <span>❌ Error</span>
          <button class="modal-close" (click)="closeErrorModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">❌</span>
            <div class="warning-message"><h3>{{ errorMessage }}</h3></div>
          </div>
        </div>
        <div class="modal-footer"><button class="retro-btn" (click)="closeErrorModal()">OK</button></div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 16px; background: #d4d0c8; min-height: 100vh; }
    .retro-header { background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%); color: #fff; padding: 12px 16px; margin-bottom: 12px; border: 2px solid; border-color: #fff #808080 #808080 #fff; display: flex; justify-content: space-between; align-items: center; }
    .header-left h2 { margin: 0; font-size: 16px; } .header-sub { font-size: 10px; opacity: 0.8; } .header-actions { display: flex; gap: 6px; }
    .main-layout { display: flex; gap: 16px; } .editor-panel { flex: 1; min-width: 0; } .preview-panel { flex: 1; min-width: 0; }
    .form-card { background: #fff; border: 2px solid; border-color: #fff #808080 #808080 #fff; padding: 20px; }
    .form-group { margin-bottom: 14px; } .form-group label { display: block; margin-bottom: 4px; font-size: 11px; font-weight: bold; color: #333; }
    .required { color: #cc0000; } .form-row { display: flex; gap: 16px; margin-bottom: 14px; } .flex-1 { flex: 1; }
    .retro-input { width: 100%; padding: 8px; border: 1px solid #808080; font-size: 11px; box-sizing: border-box; background: #fff; }
    .checkbox-label { display: flex !important; align-items: center; gap: 6px; cursor: pointer; font-weight: normal !important; }
    .editor-tabs { float: right; } .tab-btn { background: #e0e0e0; border: 1px solid #a0a0a0; padding: 2px 10px; cursor: pointer; font-size: 10px; margin-left: 4px; }
    .tab-btn.active { background: #0a3a8c; color: white; border-color: #0a3a8c; }
    .editor-toolbar { display: flex; gap: 2px; padding: 6px 8px; background: #f0f0f0; border: 1px solid #c0c0c0; border-bottom: none; }
    .tool-btn { background: #fff; border: 1px solid #c0c0c0; padding: 3px 8px; cursor: pointer; font-size: 10px; min-width: 28px; }
    .tool-sep { width: 1px; background: #c0c0c0; margin: 0 4px; }
    .content-editor { width: 100%; min-height: 350px; padding: 12px; font-family: 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; resize: vertical; }
    .html-editor { font-family: 'Courier New', monospace; font-size: 11px; } .editor-hint { color: #888; font-size: 9px; }
    .action-bar { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .retro-btn { background: #f0f0f0; border: 2px solid; border-color: #fff #808080 #808080 #fff; border-radius: 2px; padding: 7px 18px; cursor: pointer; font-size: 11px; color: #000; white-space: nowrap; }
    .retro-btn:hover { background: #e8f0ff; } .retro-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }
    .retro-btn.danger { background: #fff5f5; color: #cc0000; border-color: #fcc; } .retro-btn.danger:hover { background: #cc0000; color: white; }
    .articles-list { display: flex; flex-direction: column; gap: 4px; }
    .article-row { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 16px; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .article-row:hover { background: #f8faff; } .article-info { flex: 1; min-width: 0; }
    .article-title { font-size: 13px; font-weight: 600; color: #0a246a; margin-bottom: 4px; }
    .article-meta { display: flex; gap: 12px; font-size: 10px; color: #888; flex-wrap: wrap; align-items: center; }
    .article-actions { display: flex; gap: 6px; flex-shrink: 0; margin-left: 12px; }
    .status-badge { padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
    .status-badge.status-published { background: #dcfce7; color: #166534; }
    .status-badge.status-draft { background: #e0e0e0; color: #666; }
    .status-badge.status-archived { background: #fee2e2; color: #991b1b; }
    .empty-state,.loading-state { text-align: center; padding: 40px; color: #888; background: #fff; border: 2px solid; border-color: #fff #808080 #808080 #fff; }
    .spinner { width: 24px; height: 24px; border: 3px solid #e0e0e0; border-top-color: #0a3a8c; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .modal-dialog { position: fixed; background: white; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-radius: 0; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; color: white; border-radius: 0; font-size: 13px; font-weight: 700; cursor: grab; user-select: none; }
    .modal-header:active { cursor: grabbing; }
    .modal-header.danger { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .modal-header.success { background: linear-gradient(135deg, #059669, #10b981); }
    .modal-header.error { background: linear-gradient(135deg, #dc2626, #ef4444); }
    .modal-close { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: white; cursor: pointer; padding: 4px 10px; font-size: 14px; border-radius: 0; }
    .modal-close:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
    .modal-body { padding: 20px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 40px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 8px 0; font-size: 15px; color: #1a1d24; }
    .warning-message p { margin: 0 0 8px 0; font-size: 12px; color: #555; }
    .warning-text { font-weight: 600; color: #dc2626 !important; }
    @media (max-width: 900px) { .main-layout { flex-direction: column; } }
    .modal-dialog { 
    position: fixed !important; 
    background: white; 
    width: 100%; 
    max-width: 440px; 
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    border-radius: 0; 
    /* Remove any transform, margin, or other positioning */
    transform: none !important;
    margin: 0 !important;
}
  `]
})
export class KnowledgeBaseAdminComponent implements OnInit {
  editingArticle: any = null; saving = false; successMessage = ''; errorMessage = '';
  showPreview = false; showEditor = false; isLoading = false;
  editorMode: 'visual' | 'html' = 'visual'; currentUser: any = null; today = new Date();
  articles: any[] = [];
  
  // Modal states
  showDeleteModal = false; deleteTarget: any = null;
  showSuccessModal = false; showErrorModal = false;
  
  // Dragging
  deleteModalPos = { x: 0, y: 0 }; successModalPos = { x: 0, y: 0 }; errorModalPos = { x: 0, y: 0 };
  private isDragging = false; private dragType = ''; private dragOffsetX = 0; private dragOffsetY = 0;

  articleForm = { title: '', summary: '', content: '', category: '', tags: '', featured: false, display_order: 0, author_name: '', status: 'published' };
  categories = [
    { value: 'getting-started', label: 'Getting Started', icon: '🚀' }, { value: 'tickets', label: 'Tickets', icon: '🎫' },
    { value: 'job-orders', label: 'Job Orders', icon: '📋' }, { value: 'requisitions', label: 'Requisitions', icon: '📩' },
    { value: 'account', label: 'Account', icon: '👤' }, { value: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    { value: 'faq', label: 'FAQ', icon: '❓' },
  ];

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    try {
      const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (storedUser) { this.currentUser = JSON.parse(storedUser); if (this.currentUser?.fullname) this.articleForm.author_name = this.currentUser.fullname; }
    } catch (e) {}
    if (!this.canEdit()) { this.showError('Access denied. Only Admin and Head/Manager can manage articles.'); setTimeout(() => this.router.navigate(['/knowledge-base']), 3000); return; }
    this.loadArticles();
    const articleId = this.route.snapshot.queryParams['id'];
    if (articleId) this.loadArticleForEdit(articleId);
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  canEdit(): boolean {
    try { const u = JSON.parse(localStorage.getItem('currentUser') || '{}'); this.currentUser = u; } catch (e) {}
    if (!this.currentUser) return false;
    const role = (this.currentUser.role || '').toLowerCase().trim();
    const userTable = (this.currentUser.user_table || this.currentUser.userTable || '').toLowerCase().trim();
    if (userTable !== 'users') return false;
    return role === 'admin' || role === 'head/manager' || role === 'head manager';
  }

  get previewContent(): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(this.articleForm.content || '<p>No content yet...</p>'); }
  getCategoryLabel(value: string): string { const cat = this.categories.find(c => c.value === value); return cat ? `${cat.icon} ${cat.label}` : value || 'Uncategorized'; }

  loadArticles() { this.isLoading = true; const t = localStorage.getItem('token') || sessionStorage.getItem('token'); const h = { 'Authorization': `Bearer ${t}` }; this.http.get<any[]>(`${environment.apiUrl}/api/knowledge-base`, { headers: h }).subscribe({ next: (d) => { this.articles = d || []; this.isLoading = false; }, error: () => { this.isLoading = false; } }); }
  createArticle() { this.editingArticle = null; this.articleForm = { title: '', summary: '', content: '', category: '', tags: '', featured: false, display_order: 0, author_name: this.currentUser?.fullname || '', status: 'published' }; this.showEditor = true; this.showPreview = false; }
  editArticle(article: any) { this.editingArticle = article; this.articleForm = { title: article.title || '', summary: article.summary || '', content: article.content || '', category: article.category || '', tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''), featured: article.featured || false, display_order: article.display_order || 0, author_name: article.author_name || this.currentUser?.fullname || '', status: article.status || 'published' }; this.showEditor = true; this.showPreview = false; }
  loadArticleForEdit(id: number) { const t = localStorage.getItem('token') || sessionStorage.getItem('token'); const h = { 'Authorization': `Bearer ${t}` }; this.http.get<any>(`${environment.apiUrl}/api/knowledge-base/${id}`, { headers: h }).subscribe({ next: (a) => this.editArticle(a), error: () => {} }); }
  
  // Delete from list
// Delete from list
confirmDeleteFromList(article: any) { 
    this.deleteTarget = article; 
    this.deleteModalPos = { 
        x: Math.max(0, (window.innerWidth - 440) / 2), 
        y: Math.max(0, (window.innerHeight - 250) / 2) 
    }; 
    this.showDeleteModal = true; 
}

confirmDeleteArticle() { 
    this.deleteTarget = this.editingArticle; 
    this.deleteModalPos = { 
        x: Math.max(0, (window.innerWidth - 440) / 2), 
        y: Math.max(0, (window.innerHeight - 250) / 2) 
    }; 
    this.showDeleteModal = true; 
}
  
  cancelDelete() { if (!this.saving) { this.showDeleteModal = false; this.deleteTarget = null; } }
  
  executeDelete() {
    if (!this.deleteTarget) return;
    this.saving = true;
    const t = localStorage.getItem('token') || sessionStorage.getItem('token');
    const h = { 'Authorization': `Bearer ${t}` };
    this.http.delete(`${environment.apiUrl}/api/knowledge-base/${this.deleteTarget.id}`, { headers: h }).subscribe({
      next: () => { this.showDeleteModal = false; this.deleteTarget = null; this.saving = false; this.showSuccess('Article deleted successfully!'); this.goBack(); this.loadArticles(); },
      error: () => { this.showDeleteModal = false; this.saving = false; this.showError('Failed to delete article.'); }
    });
  }

  // Modals
  showSuccess(msg: string) { this.successMessage = msg; this.successModalPos = { x: Math.max(0, (window.innerWidth - 440) / 2), y: Math.max(0, (window.innerHeight - 200) / 2) }; this.showSuccessModal = true; }
  showError(msg: string) { this.errorMessage = msg; this.errorModalPos = { x: Math.max(0, (window.innerWidth - 440) / 2), y: Math.max(0, (window.innerHeight - 200) / 2) }; this.showErrorModal = true; }
  closeSuccessModal() { this.showSuccessModal = false; }
  closeErrorModal() { this.showErrorModal = false; }

  // Dragging
 startDrag(event: MouseEvent, type: string) { 
    if ((event.target as HTMLElement).closest('.modal-close')) return; 
    this.isDragging = true; 
    this.dragType = type; 
    const pos = type === 'delete' ? this.deleteModalPos : 
                type === 'success' ? this.successModalPos : this.errorModalPos; 
    this.dragOffsetX = event.clientX - pos.x; 
    this.dragOffsetY = event.clientY - pos.y; 
    event.preventDefault(); 
}
  onDragMove(event: MouseEvent) { if (!this.isDragging) return; if (this.dragType === 'delete') { this.deleteModalPos.x = event.clientX - this.dragOffsetX; this.deleteModalPos.y = event.clientY - this.dragOffsetY; } else if (this.dragType === 'success') { this.successModalPos.x = event.clientX - this.dragOffsetX; this.successModalPos.y = event.clientY - this.dragOffsetY; } else if (this.dragType === 'error') { this.errorModalPos.x = event.clientX - this.dragOffsetX; this.errorModalPos.y = event.clientY - this.dragOffsetY; } }
  onDragEnd() { this.isDragging = false; this.dragType = ''; }

  // Keep existing methods: loadArticle, insertFormat, togglePreview, saveArticle, saveAsDraft, goBack
  loadArticle(id: number) { /* existing */ }
  insertFormat(type: string) { /* existing */ }
  togglePreview() { this.showPreview = !this.showPreview; }
  saveArticle() { /* existing - replace successMessage/errorMessage with showSuccess/showError */ }
  saveAsDraft() { this.articleForm.status = 'draft'; this.saveArticle(); }
  goBack() { this.showEditor = false; this.showPreview = false; this.editingArticle = null; this.loadArticles(); }
}