import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kb-container">
      <h2>Knowledge Base</h2>
      <div class="search-box">
        <input type="text" placeholder="Search articles..." [(ngModel)]="searchTerm">
      </div>
      <div class="articles">
        <div *ngFor="let article of filteredArticles" class="article-card">
          <h3>{{ article.title }}</h3>
          <p>{{ article.content | slice:0:150 }}...</p>
          <small>Category: {{ article.category }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kb-container { padding: 20px; }
    .search-box { margin-bottom: 20px; }
    .search-box input { width: 100%; padding: 8px; }
    .article-card { padding: 16px; margin-bottom: 16px; border: 1px solid #ddd; border-radius: 4px; }
    .article-card h3 { margin: 0 0 8px 0; }
  `]
})
export class KnowledgeBaseComponent {
  searchTerm = '';
  articles = [
    { title: 'How to reset password', content: 'Go to settings...', category: 'Account' },
    { title: 'VPN Connection Guide', content: 'Download Cisco AnyConnect...', category: 'Network' }
  ];

  get filteredArticles() {
    return this.articles.filter(a => 
      a.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}