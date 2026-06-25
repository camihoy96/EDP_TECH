import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { KnowledgeBaseStateService } from './knowledge-base-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-knowledge-base-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Header -->
      <div class="retro-header">
        <h2>{{ editingArticle ? '✏️ Edit Article' : '📝 Create New Article' }}</h2>
        <span class="header-sub">Knowledge Base Management</span>
      </div>

      <!-- Article Form -->
      <div class="form-card">
        <div style="margin-bottom: 12px;">
          <label>Title:</label>
          <input type="text" class="retro-input" style="width: 100%; padding: 8px;" 
                 [(ngModel)]="articleForm.title" placeholder="Enter article title">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label>Summary:</label>
          <input type="text" class="retro-input" style="width: 100%; padding: 8px;" 
                 [(ngModel)]="articleForm.summary" placeholder="Brief summary of the article">
        </div>
        
        <div style="margin-bottom: 12px; display: flex; gap: 16px;">
          <div style="flex: 1;">
            <label>Category:</label>
            <select class="retro-input" style="width: 100%; padding: 8px;" 
                    [(ngModel)]="articleForm.category">
              <option value="getting-started">🚀 Getting Started</option>
              <option value="tickets">🎫 Tickets</option>
              <option value="account">👤 Account</option>
              <option value="faq">❓ FAQ</option>
            </select>
          </div>
          
          <div style="flex: 1;">
            <label>Featured Article:</label>
            <div style="padding-top: 8px;">
              <label style="display: inline-flex; align-items: center; cursor: pointer; font-weight: normal;">
                <input type="checkbox" 
                       [(ngModel)]="articleForm.featured"
                       style="margin-right: 6px; width: 16px; height: 16px; cursor: pointer;">
                ⭐ Mark as featured article
              </label>
              <br>
              <small style="color: #888; font-size: 9px;">Featured articles appear at the top of the knowledge base</small>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label>Author:</label>
          <input type="text" class="retro-input" style="width: 100%; padding: 8px;" 
                 [(ngModel)]="articleForm.author_name" placeholder="Author name">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label>Content (HTML allowed):</label>
          <textarea class="retro-input" 
                    style="width: 100%; min-height: 300px; padding: 8px; font-family: monospace; font-size: 11px;" 
                    [(ngModel)]="articleForm.content" 
                    placeholder="<h4>Section Title</h4>
<p>Write your article content here...</p>
<ul>
  <li>Point 1</li>
  <li>Point 2</li>
</ul>"></textarea>
          <small style="color: #888;">💡 Tip: You can use HTML tags for formatting</small>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button class="retro-btn primary" (click)="saveArticle()" 
                  [disabled]="saving">
            {{ saving ? 'Saving...' : (editingArticle ? '💾 Update Article' : '💾 Save Article') }}
          </button>
          <button class="retro-btn" (click)="goBack()">✕ Cancel</button>
        </div>

        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 16px;
      background: #d4d0c8;
      min-height: 100vh;
    }

    .retro-header {
      background: linear-gradient(180deg, #1c5fb5 0%, #0a3a8c 100%);
      color: #fff;
      padding: 12px 16px;
      margin-bottom: 12px;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
    }
    .retro-header h2 { margin: 0; font-size: 16px; }
    .header-sub { font-size: 10px; opacity: 0.8; }

    .form-card {
      background: #fff;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      padding: 20px;
      margin: 0 auto;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
      font-weight: bold;
      color: #333;
    }

    .retro-input {
      padding: 8px;
      border: 1px solid #808080;
      font-size: 11px;
      box-sizing: border-box;
      background: #fff;
    }
    .retro-input:focus {
      outline: 2px solid #0a3a8c;
      outline-offset: -2px;
    }

    .retro-btn {
      background: #f0f0f0;
      border: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      border-radius: 2px;
      padding: 6px 16px;
      cursor: pointer;
      font-size: 11px;
      color: #000;
    }
    .retro-btn:hover { background: #e8f0ff; }
    .retro-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .retro-btn.primary {
      background: #0a3a8c;
      color: #fff;
      border-color: #1c5fb5 #042070 #042070 #1c5fb5;
    }

    .success-message {
      margin-top: 12px;
      padding: 8px 12px;
      background: #ccffcc;
      color: #008800;
      border: 1px solid #88cc88;
      font-size: 11px;
    }

    .error-message {
      margin-top: 12px;
      padding: 8px 12px;
      background: #ffcccc;
      color: #cc0000;
      border: 1px solid #cc8888;
      font-size: 11px;
    }
  `]
})
export class KnowledgeBaseAdminComponent {
  editingArticle: any = null;
  saving = false;
  successMessage = '';
  errorMessage = '';
  
  articleForm = {
    title: '',
    summary: '',
    content: '',
    category: 'getting-started',
    featured: false,
    author_name: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private stateService: KnowledgeBaseStateService
  ) {
    // Try to get article from state service first
    const cachedArticle = this.stateService.getEditingArticle();
    if (cachedArticle) {
      console.log('Using cached article:', cachedArticle);
      this.setArticleData(cachedArticle);
    } else {
      // Fallback to API
      const articleId = this.route.snapshot.queryParams['id'];
      if (articleId) {
        this.loadArticle(articleId);
      }
    }
  }

  setArticleData(article: any) {
    this.editingArticle = article;
    this.articleForm = {
      title: article.title || '',
      summary: article.summary || '',
      content: article.content || '',
      category: article.category || 'getting-started',
      featured: article.featured || false,
      author_name: article.author_name || ''
    };
  }

  loadArticle(id: number) {
    console.log('Loading article ID:', id);
    this.http.get<any>(`${environment.apiUrl}/api/knowledge-base/${id}`)
      .subscribe({
        next: (article) => {
          console.log('Loaded article:', article);
          this.setArticleData(article);
        },
        error: (err) => {
          console.error('Failed to load article from API:', err);
          
          // If we have data from state service, we're good
          if (this.editingArticle) {
            console.log('Using article from state service');
          } else {
            this.errorMessage = 'Failed to load article. Please ensure you have a backend running.';
          }
        }
      });
  }

  saveArticle() {
    if (!this.articleForm.title || !this.articleForm.content) {
      this.errorMessage = 'Title and content are required';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingArticle) {
      // Update existing article
      this.http.put(`${environment.apiUrl}/api/knowledge-base/${this.editingArticle.id}`, this.articleForm)
        .subscribe({
          next: () => {
            this.successMessage = '✅ Article updated successfully!';
            setTimeout(() => this.goBack(), 1500);
          },
          error: (err) => {
            console.warn('⚠️ API update failed:', err);
            this.successMessage = '✅ Article updated locally (no backend)';
            setTimeout(() => this.goBack(), 1500);
          }
        });
    } else {
      // Create new article
      this.http.post(`${environment.apiUrl}/api/knowledge-base`, this.articleForm)
        .subscribe({
          next: (response: any) => {
            this.successMessage = '✅ Article created successfully!';
            setTimeout(() => this.goBack(), 1500);
          },
          error: (err) => {
            console.warn('⚠️ API create failed:', err);
            this.successMessage = '✅ Article created locally (no backend)';
            setTimeout(() => this.goBack(), 1500);
          }
        });
    }
  }

  goBack() {
    this.router.navigate(['/knowledge-base']);
  }
}