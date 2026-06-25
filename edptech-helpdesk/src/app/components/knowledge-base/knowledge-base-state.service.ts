// knowledge-base-state.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseStateService {
  private editingArticle: any = null;

  setEditingArticle(article: any) {
    this.editingArticle = article;
  }

  getEditingArticle(): any {
    const article = this.editingArticle;
    this.editingArticle = null; // Clear after getting
    return article;
  }
}