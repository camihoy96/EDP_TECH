import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { KnowledgeBaseStateService } from './knowledge-base-state.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kb-container">
      
      <!-- Header -->
      <div class="retro-header">
        <h2>📚 Knowledge Base</h2>
        <span class="header-sub">Learn how to use the Helpdesk System effectively</span>
      </div>

      <!-- Search & Categories -->
      <div class="kb-toolbar">
        <div class="search-box">
          <input type="text" class="retro-input" placeholder="Search articles..." [(ngModel)]="searchTerm" (input)="applyFilters()">
          <span class="search-icon">🔍</span>
        </div>
        <div class="category-tabs">
          <button class="cat-tab" [class.active]="activeCategory === 'all'" (click)="setCategory('all')">📋 All</button>
          <button class="cat-tab" [class.active]="activeCategory === 'getting-started'" (click)="setCategory('getting-started')">🚀 Getting Started</button>
          <button class="cat-tab" [class.active]="activeCategory === 'tickets'" (click)="setCategory('tickets')">🎫 Tickets</button>
          <button class="cat-tab" [class.active]="activeCategory === 'account'" (click)="setCategory('account')">👤 Account</button>
          <button class="cat-tab" [class.active]="activeCategory === 'faq'" (click)="setCategory('faq')">❓ FAQ</button>
        </div>
      <div *ngIf="isAdminOrTech" style="text-align: right; margin-bottom: 8px;">
  <button class="retro-btn primary" (click)="navigateToCreate()">
    📝 Create Article
  </button>
</div>
      </div>

      <!-- Featured Article -->
      <div class="featured-card" *ngIf="featuredArticle && activeCategory === 'all' && !searchTerm">
        <div class="featured-badge">⭐ Featured</div>
        <h3>{{ featuredArticle.title }}</h3>
        <p class="featured-desc">{{ featuredArticle.summary }}</p>
        <button class="retro-btn primary" (click)="toggleArticle(featuredArticle.id); activeCategory = featuredArticle.category">
          Read More →
        </button>
      </div>

      <!-- Articles Grid -->
<div class="articles-grid">
  <div class="article-card" *ngFor="let article of filteredArticles" (click)="toggleArticle(article.id)">
    <div class="article-header">
      <span class="article-category" [class]="'cat-' + article.category">{{ getCategoryLabel(article.category) }}</span>
      <span class="article-views">👁 {{ article.views }}</span>
    </div>
    <h3 class="article-title">{{ article.title }}</h3>
    <p class="article-summary" *ngIf="expandedArticle !== article.id">{{ article.summary }}</p>
    <div class="article-meta">By {{ article.author_name || 'Unknown' }} · Updated {{ article.updated_at | date:'MMM d, yyyy' }}</div>
    
    <!-- Expanded Content -->
    <div class="article-content" *ngIf="expandedArticle === article.id">
      <div class="content-divider"></div>
      <div class="content-body" [innerHTML]="article.content"></div>
      
      <!-- Helpful? -->
      <div class="helpful-section">
        <span>Was this helpful?</span>
        <button class="retro-btn" (click)="handleHelpfulClick($event, article, 'yes')">👍 Yes ({{ article.helpful_yes || 0 }})</button>
        <button class="retro-btn" (click)="handleHelpfulClick($event, article, 'no')">👎 No ({{ article.helpful_no || 0 }})</button>
      </div>
      
     <!-- Admin Actions - Only show for admin/technician -->
<div *ngIf="isAdminOrTech" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; display: flex; gap: 4px;">
  <button class="retro-btn" (click)="navigateToEdit(article, $event)" style="font-size: 9px;">
    ✏️ Edit
  </button>
  <button class="retro-btn" (click)="deleteArticle(article, $event)" style="font-size: 9px; color: #cc0000;">
    🗑️ Delete
  </button>
</div>
    </div>
  </div>
</div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredArticles.length === 0">
        <span class="empty-icon">📭</span>
        <p>No articles found</p>
        <p class="empty-sub">Try a different search term or category</p>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
<div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
  <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
    <div class="modal-header delete-header">
      <h3>⚠️ Delete Article</h3>
      <button class="modal-close" (click)="cancelDelete()">✕</button>
    </div>
    
    <div class="modal-body">
      <div class="delete-warning">
        <div class="warning-icon">⚠️</div>
        <h4>Are you sure you want to delete this article?</h4>
        
        <div class="delete-article-info" *ngIf="deleteTarget">
          <div class="delete-article-title">{{ deleteTarget.title }}</div>
          <div class="delete-article-meta">
            By {{ deleteTarget.author_name || 'Unknown' }} · {{ deleteTarget.category }}
          </div>
        </div>
        
        <p class="warning-text">
          This action cannot be undone. The article will be permanently removed from the knowledge base.
        </p>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="btn" (click)="cancelDelete()">✕ Cancel</button>
      <button class="btn btn-danger" (click)="confirmDelete()">
        🗑️ Delete Article
      </button>
    </div>
  </div>
</div>

<!-- Toast Notification -->
<div class="toast-notification" 
     [class.show]="showToast" 
     [class.success]="toastMessage.includes('successfully')"
     [class.warning]="toastMessage.includes('locally')"
     [class.error]="toastMessage.includes('Failed')">
  <span class="toast-icon">{{ toastMessage.includes('🗑️') ? '🗑️' : toastMessage.includes('Failed') ? '❌' : '⚠️' }}</span>
  <span class="toast-message">{{ toastMessage }}</span>
</div>
   
  `,
  styles: [`
    :host { display: block; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
    .kb-container { padding: 8px; background: #d4d0c8; min-height: 100%; }

    .retro-header {
      background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%);
      color: #fff; padding: 10px 14px; margin-bottom: 8px;
      border: 2px solid; border-color: #fff #808080 #808080 #fff;
    }
    .retro-header h2 { margin: 0; font-size: 14px; }
    .header-sub { font-size: 9px; opacity: 0.8; display: block; margin-top: 2px; }

    .kb-toolbar {
      background: #f0f0f0; border: 2px solid;
      border-color: #fff #808080 #808080 #fff; padding: 8px; margin-bottom: 8px;
    }
    .search-box { position: relative; margin-bottom: 8px; display: inline-block; }
    .retro-input { padding: 4px 8px 4px 26px; border: 1px solid #808080; font-size: 11px; width: 300px; }
    .search-icon { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); font-size: 12px; }

    .category-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
    .cat-tab {
      background: #d4d0c8; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 3px 12px; cursor: pointer; font-size: 10px; color: #333;
    }
    .cat-tab:hover { background: #e8e8e8; }
    .cat-tab.active { background: #fff; font-weight: bold; color: #0a3a8c; }

    .featured-card {
      background: #fff; border: 2px solid; border-color: #fff #808080 #808080 #fff;
      padding: 16px; margin-bottom: 8px; position: relative;
    }
    .featured-badge {
      position: absolute; top: 8px; right: 8px;
      background: #ffcc00; color: #333; padding: 2px 8px;
      border-radius: 2px; font-size: 9px; font-weight: bold;
    }
    .featured-card h3 { margin: 0 0 6px 0; font-size: 13px; color: #0a3a8c; }
    .featured-desc { font-size: 11px; color: #555; margin-bottom: 10px; }

    .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 8px; }
    
    .article-card {
      background: #fff; border: 2px solid; border-color: #fff #808080 #808080 #fff;
      padding: 12px; cursor: pointer; transition: border-color 0.2s;
    }
    .article-card:hover { border-color: #0a3a8c; }
    
    .article-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .article-category {
      padding: 1px 6px; border-radius: 2px; font-size: 9px; font-weight: bold; text-transform: uppercase;
    }
    .cat-getting-started { background: #cde8f5; color: #0066cc; }
    .cat-tickets { background: #fff0cc; color: #cc6600; }
    .cat-account { background: #ccffcc; color: #008800; }
    .cat-faq { background: #f0e0ff; color: #6600cc; }
    .article-views { font-size: 9px; color: #888; }

    .article-title { font-size: 12px; margin: 0 0 6px 0; color: #000; }
    .article-summary { font-size: 10px; color: #666; margin-bottom: 6px; line-height: 1.4; }
    .article-meta { font-size: 9px; color: #999; }

    .content-divider { height: 1px; background: #ddd; margin: 10px 0; }
    .content-body { font-size: 11px; color: #333; line-height: 1.6; }
    .content-body h4 { font-size: 12px; color: #0a3a8c; margin: 10px 0 4px 0; }
    .content-body ul { margin: 4px 0; padding-left: 20px; }
    .content-body li { margin-bottom: 4px; }
    .content-body code {
      background: #f0f0f0; padding: 1px 4px; border-radius: 2px;
      font-family: monospace; font-size: 10px; border: 1px solid #ddd;
    }

    .helpful-section {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee;
      font-size: 10px; color: #666;
    }

    .retro-btn {
      background: #f0f0f0; border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px; padding: 3px 12px;
      cursor: pointer; font-size: 10px; color: #000;
    }
    .retro-btn:hover { background: #e8f0ff; }
    .retro-btn.primary { background: #0a3a8c; color: #fff; border-color: #1c5fb5 #042070 #042070 #1c5fb5; }

    .empty-state { text-align: center; padding: 40px; color: #888; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 10px; }
    .empty-sub { font-size: 10px; margin-top: 4px; }
    /* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #888;
  padding: 4px 8px;
  border-radius: 4px;
}
.modal-close:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
}

/* Delete Modal */
.delete-modal {
  max-width: 480px;
}

.delete-header {
  background: #fff5f5;
  border-bottom: 1px solid #ffcccc;
}

.delete-header h3 {
  color: #cc0000;
}

.delete-warning {
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.delete-warning h4 {
  color: #333;
  font-size: 15px;
  margin: 0 0 16px 0;
}

.delete-article-info {
  background: #fff5f5;
  padding: 14px;
  border-radius: 6px;
  border: 1px solid #ffcccc;
  margin-bottom: 16px;
}

.delete-article-title {
  font-size: 14px;
  font-weight: bold;
  color: #cc0000;
  margin-bottom: 6px;
}

.delete-article-meta {
  font-size: 11px;
  color: #888;
}

.warning-text {
  color: #cc0000 !important;
  font-size: 11px !important;
  font-weight: 600;
  line-height: 1.4;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #c0c0c0;
  background: #f8f9fa;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn:hover {
  background: #e8e8e8;
}

.btn-danger {
  background: #cc0000;
  color: white;
  border-color: #cc0000;
}
.btn-danger:hover {
  background: #aa0000;
  border-color: #aa0000;
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

.toast-notification.warning {
  background: #cc6600;
}

.toast-notification.error {
  background: #cc0000;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  searchTerm = '';
  activeCategory = 'all';
  expandedArticle: number | null = null;
  articles: any[] = [];
  featuredArticle: any = null;
  showDeleteConfirm = false;
  deleteTarget: any = null;
  toastMessage = '';
  showToast = false;
  private toastTimer: any;
  constructor(
    private http: HttpClient,
    private router: Router,
    private stateService: KnowledgeBaseStateService,
   private authService: AuthService
  ) {}
  get isAdminOrTech(): boolean {
  const user = this.authService.getCurrentUser();
  return user?.role === 'admin' || user?.role === 'Technician';
}
  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.http.get<any[]>(`${environment.apiUrl}/api/knowledge-base`).subscribe({
  next: (articles) => {
    console.log('✅ Articles loaded:', articles.length);
    
    if (articles.length === 0) {
      console.log('No articles found, seeding data...');
      this.seedArticles();
    } else {
      this.articles = articles;
      // Find featured article, or use first one
      this.featuredArticle = articles.find(a => a.featured === true || a.featured === 1) || articles[0] || null;
    }
  },
      error: (err) => {
        console.error('❌ Failed to load articles:', err);
        this.loadHardcodedArticles();
      }
    });
  }

  seedArticles() {
    this.http.post(`${environment.apiUrl}/api/knowledge-base/seed`, {}).subscribe({
      next: (response: any) => {
        console.log('✅ Seed response:', response);
        this.loadArticles();
      },
      error: (err) => {
        console.error('❌ Failed to seed:', err);
        this.loadHardcodedArticles();
      }
    });
  }

 // Delete article - opens confirmation modal
deleteArticle(article: any, event: Event) {
  event.stopPropagation();
  this.deleteTarget = article;
  this.showDeleteConfirm = true;
}

// Confirm deletion
confirmDelete() {
  if (!this.deleteTarget) return;
  
  const article = this.deleteTarget;
  
  this.http.delete(`${environment.apiUrl}/api/knowledge-base/${article.id}`)
    .subscribe({
      next: () => {
        console.log('✅ Article deleted via API');
        this.removeArticleFromList(article);
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.showToastNotification('🗑️ Article deleted successfully!', 'success');
      },
      error: (err) => {
        console.warn('⚠️ API delete failed, removing locally:', err);
        this.removeArticleFromList(article);
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.showToastNotification('Article deleted locally (API unavailable)', 'warning');
      }
    });
}

// Cancel deletion
cancelDelete() {
  this.showDeleteConfirm = false;
  this.deleteTarget = null;
}

// Toast notification
showToastNotification(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  this.toastMessage = message;
  this.showToast = true;
  
  if (this.toastTimer) {
    clearTimeout(this.toastTimer);
  }
  
  this.toastTimer = setTimeout(() => {
    this.showToast = false;
    this.toastMessage = '';
  }, 3000);
}
private removeArticleFromList(article: any) {
  this.articles = this.articles.filter(a => a.id !== article.id);
  if (this.expandedArticle === article.id) {
    this.expandedArticle = null;
  }
  if (this.featuredArticle?.id === article.id) {
    this.featuredArticle = this.articles.find(a => a.featured) || this.articles[0];
  }
}
navigateToCreate() {
  this.router.navigate(['/knowledge-base/create']);
}

navigateToEdit(article: any, event: Event) {
  event.stopPropagation();
  this.stateService.setEditingArticle(article);  // Save article to service
  this.router.navigate(['/knowledge-base/edit'], { 
    queryParams: { id: article.id } 
  });
}
 handleHelpfulClick(event: Event, article: any, type: 'yes' | 'no'): void {
  event.stopPropagation();
  
  if (type === 'yes') {
    article.helpful_yes = (article.helpful_yes || 0) + 1;
  } else {
    article.helpful_no = (article.helpful_no || 0) + 1;
  }
  
  // Try to save to API, but it's ok if it fails
  this.http.post(`${environment.apiUrl}/api/knowledge-base/${article.id}/vote`, { type })
    .subscribe({
      error: (err) => console.warn('⚠️ Failed to save vote to API, saved locally only:', err)
    });
}
  setCategory(category: string) {
    this.activeCategory = category;
    this.expandedArticle = null;
  }

  toggleArticle(id: number) {
    this.expandedArticle = this.expandedArticle === id ? null : id;
  }

  applyFilters() {
    // Just triggers change detection
  }

  get filteredArticles() {
    let filtered = this.articles;
    
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === this.activeCategory);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.summary.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'getting-started': 'Getting Started',
      'tickets': 'Tickets',
      'account': 'Account',
      'faq': 'FAQ'
    };
    return labels[category] || category;
  }

  loadHardcodedArticles() {
    this.articles = [
      {
        id: 1, title: 'How to Submit a Support Ticket', 
        category: 'getting-started',
        featured: true,
        summary: 'Learn how to create and submit tickets for IT support.',
        author_name: 'IT Support Team',
        content: `
          <h4>📝 Step-by-Step Guide</h4>
          <ol>
            <li>Navigate to <strong>My Tickets</strong> from the sidebar</li>
            <li>Click <strong>New Ticket</strong> button</li>
            <li>Fill in the <strong>Issue Title</strong> — be specific (e.g., "Cannot connect to VPN")</li>
            <li>Provide a detailed <strong>Description</strong> including error messages, screenshots, and steps to reproduce</li>
            <li>Select the <strong>Priority</strong> level:
              <ul>
                <li><strong>Critical</strong> — System down, work stoppage</li>
                <li><strong>High</strong> — Major issue, work blocked</li>
                <li><strong>Medium</strong> — Affects productivity, workaround exists</li>
                <li><strong>Low</strong> — Minor issue or request</li>
              </ul>
            </li>
            <li>Enter your <strong>Location</strong> (Floor, Room, Building)</li>
            <li>Select your <strong>Department</strong></li>
            <li>Review and click <strong>Submit Ticket</strong></li>
          </ol>
          <h4>💡 Tips</h4>
          <ul>
            <li>Attach screenshots using the <strong>📎 Attach</strong> button</li>
            <li>Use the <strong>✎ Draw</strong> tool to sketch diagrams</li>
            <li>You can edit your ticket as long as it's in <strong>New</strong> status</li>
          </ul>
        `,
        author: 'IT Support Team', updated_at: '2024-05-01', views: 245, helpful_yes: 42, helpful_no: 3
      },
      {
        id: 2, title: 'Understanding Ticket Statuses', 
        category: 'tickets',
        summary: 'Learn what each ticket status means in the workflow.',
        content: `
          <h4>📊 Ticket Lifecycle</h4>
          <ul>
            <li><strong>🆕 New</strong> — Ticket has been submitted and is awaiting assignment</li>
            <li><strong>📌 Assigned</strong> — Ticket has been assigned to an IT technician</li>
            <li><strong>⚙️ In Progress</strong> — Technician is actively working on the issue</li>
            <li><strong>⏳ Pending</strong> — Waiting for additional information or third-party action</li>
            <li><strong>✅ Resolved</strong> — Issue has been fixed and ticket is closed</li>
            <li><strong>🔒 Closed</strong> — Ticket is permanently closed</li>
          </ul>
          <h4>⏱️ SLA Response Times</h4>
          <ul>
            <li>Critical — Within 1 hour</li>
            <li>High — Within 4 hours</li>
            <li>Medium — Within 1 business day</li>
            <li>Low — Within 3 business days</li>
          </ul>
        `,
        author: 'IT Admin', updated_at: '2024-04-28', views: 189, helpful_yes: 35, helpful_no: 2
      },
      {
        id: 3, title: 'How to Use the Drawing Pad', 
        category: 'tickets',
        summary: 'Sketch diagrams and annotate screenshots directly in your ticket.',
        content: `
          <h4>✎ Using the Drawing Tool</h4>
          <ol>
            <li>In the ticket form, click the <strong>✎ Draw</strong> button</li>
            <li>A drawing canvas will open with color options</li>
            <li>Select a <strong>color</strong> and <strong>brush size</strong></li>
            <li>Draw your diagram or annotate</li>
            <li>Click <strong>Insert Drawing</strong> to add it to your description</li>
          </ol>
          <p>The drawing will appear as an image in your ticket description.</p>
        `,
        author: 'IT Support Team', updated_at: '2024-04-25', views: 134, helpful_yes: 28, helpful_no: 1
      },
      {
        id: 4, title: 'Managing Your Profile & Schedule', 
        category: 'account',
        summary: 'Update your personal information, work schedule, and leave settings.',
        content: `
          <h4>👤 Profile Settings</h4>
          <ul>
            <li>Click <strong>Profile</strong> in the toolbar</li>
            <li>Upload a <strong>profile photo</strong> by clicking your avatar</li>
            <li>Set your <strong>work days</strong> — off days are calculated automatically</li>
            <li>Configure <strong>work hours</strong> and <strong>lunch break</strong> times</li>
            <li>Add <strong>leave entries</strong> for vacation planning</li>
            <li>Change your <strong>password</strong> anytime</li>
          </ul>
          <h4>🏖️ Leave Management</h4>
          <p>Your leave status is visible to administrators. When you're on leave:</p>
          <ul>
            <li>New tickets will be auto-assigned to available team members</li>
            <li>Your status will show "On Leave" in the system</li>
          </ul>
        `,
        author: 'HR Department', updated_at: '2024-04-20', views: 156, helpful_yes: 31, helpful_no: 4
      },
      {
        id: 5, title: 'Frequently Asked Questions', 
        category: 'faq',
        summary: 'Quick answers to common questions about the helpdesk system.',
        content: `
          <h4>❓ Common Questions</h4>
          <p><strong>Q: How do I check my ticket status?</strong></p>
          <p>A: Go to <strong>My Tickets</strong> and click on any ticket to view its details, comments, and current status.</p>
          <p><strong>Q: How do I contact IT support directly?</strong></p>
          <p>A: Email <code>support@edptech.com</code> or call ext. 1234 during business hours (Mon-Fri, 8AM-6PM).</p>
        `,
        author: 'IT Support Team', updated_at: '2024-04-15', views: 320, helpful_yes: 56, helpful_no: 5
      },
      {
        id: 6, title: 'Keyboard Shortcuts', 
        category: 'getting-started',
        summary: 'Speed up your workflow with these keyboard shortcuts.',
        content: `
          <h4>⌨️ Available Shortcuts</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr style="background:#f0f0f0;"><td style="padding:4px 8px;border:1px solid #ddd;"><strong>Ctrl + N</strong></td><td style="padding:4px 8px;border:1px solid #ddd;">Create New Ticket</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;"><strong>F5</strong></td><td style="padding:4px 8px;border:1px solid #ddd;">Refresh Data</td></tr>
            <tr style="background:#f0f0f0;"><td style="padding:4px 8px;border:1px solid #ddd;"><strong>Esc</strong></td><td style="padding:4px 8px;border:1px solid #ddd;">Close Menus/Modals</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;"><strong>Enter</strong></td><td style="padding:4px 8px;border:1px solid #ddd;">Search (in search box)</td></tr>
          </table>
        `,
        author: 'IT Admin', updated_at: '2024-04-10', views: 98, helpful_yes: 22, helpful_no: 0
      }
    ];
    this.featuredArticle = this.articles.find(a => a.featured) || this.articles[0];
  }
}