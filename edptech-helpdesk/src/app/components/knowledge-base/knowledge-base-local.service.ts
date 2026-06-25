// knowledge-base-local.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseLocalService {
  private readonly STORAGE_KEY = 'kb_articles';
  private nextId = 100; // Start high to avoid conflicts

  getArticles(): any[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveArticles(articles: any[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(articles));
  }

  addArticle(article: any): any {
    const articles = this.getArticles();
    article.id = this.nextId++;
    article.created_at = new Date().toISOString();
    article.updated_at = new Date().toISOString();
    article.views = 0;
    article.helpful_yes = 0;
    article.helpful_no = 0;
    articles.push(article);
    this.saveArticles(articles);
    return article;
  }

  updateArticle(id: number, data: any): any {
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id == id);
    if (index !== -1) {
      articles[index] = { ...articles[index], ...data, updated_at: new Date().toISOString() };
      this.saveArticles(articles);
      return articles[index];
    }
    return null;
  }

  deleteArticle(id: number): boolean {
    const articles = this.getArticles();
    const filtered = articles.filter(a => a.id != id);
    if (filtered.length < articles.length) {
      this.saveArticles(filtered);
      return true;
    }
    return false;
  }

  getArticle(id: number): any {
    const articles = this.getArticles();
    return articles.find(a => a.id == id) || null;
  }
}