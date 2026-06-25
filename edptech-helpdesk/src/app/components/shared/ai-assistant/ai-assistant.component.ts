import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
   <!-- AI Assistant Modal -->
<div class="ai-assistant-overlay" *ngIf="isOpen" (click)="close()">
  <div class="ai-assistant-panel" (click)="$event.stopPropagation()">
    <div class="ai-assistant-header">
      <div class="ai-assistant-title">
        <img src="assets/images/ai.png" alt="AI" class="ai-header-icon">
        <span>EDPTech AI Assistant</span>
      </div>
      <div class="ai-assistant-actions">
        <button class="ai-btn-icon" (click)="clearChat()" title="Clear Chat">🗑️</button>
        <button class="ai-btn-icon" (click)="close()" title="Close">✕</button>
      </div>
    </div>
    
    <div class="ai-chat-messages" #chatMessages>
      <div *ngFor="let msg of history" class="ai-message" 
           [class.user-message]="msg.role === 'user'" 
           [class.ai-message-style]="msg.role === 'assistant'">
        <div class="ai-message-avatar">
  <!-- AI avatar -->
  <img *ngIf="msg.role === 'assistant'" src="assets/images/ai.png" alt="AI" class="ai-avatar-img">
  
  <!-- User avatar - same style as toolbar -->
  <ng-container *ngIf="msg.role === 'user'">
    <img *ngIf="userPhotoUrl" [src]="userPhotoUrl" alt="User" class="ai-avatar-img">
    <span *ngIf="!userPhotoUrl" class="ai-user-initial" [style.background]="userAvatarColor">
      {{ userInitial }}
    </span>
  </ng-container>
</div>
        <div class="ai-message-content">{{ msg.content }}</div>
      </div>
      
      <div *ngIf="loading" class="ai-message ai-message-style">
        <div class="ai-message-avatar">
          <img src="assets/images/ai.png" alt="AI" class="ai-avatar-img">
        </div>
        <div class="ai-message-content">
          <div class="ai-typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
    
    <div class="ai-chat-input">
      <input type="text" [(ngModel)]="query" placeholder="Ask me anything..."
        (keyup.enter)="send()" [disabled]="loading" />
      <button (click)="send()" [disabled]="loading || !query.trim()">➤</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .ai-assistant-overlay {
      position: fixed; bottom: 80px; right: 20px; z-index: 3000;
      animation: slideUp 0.3s ease;
    }
    .ai-assistant-panel {
      width: 400px; height: 510px; background: white; border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column;
      overflow: hidden; border: 1px solid #d0d0d0;
    }
    .ai-assistant-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; background: linear-gradient(135deg, #515358, #7c87a0); color: white;
    }
    .ai-assistant-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.ai-header-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}
.ai-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}
    .ai-assistant-actions { display: flex; gap: 4px; }
    .ai-btn-icon {
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
      color: white; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
      font-size: 14px; display: flex; align-items: center; justify-content: center;
    }
    .ai-btn-icon:hover { background: rgba(255,255,255,0.25); }
    .ai-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column;
      gap: 12px; background: #f8f9fa;
    }
    .ai-message { display: flex; gap: 8px; max-width: 85%; }
    .user-message { align-self: flex-end; flex-direction: row-reverse; }
    .ai-message-style { align-self: flex-start; }
    .ai-message-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #e8e8e8;
      display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
    }
    .user-message .ai-message-avatar { background: #0a246a; color: white; }
    .ai-message-content {
      padding: 10px 14px; border-radius: 12px; font-size: 12px;
      line-height: 1.5; white-space: pre-wrap; word-break: break-word;
    }
    .user-message .ai-message-content { background: #0a246a; color: white; border-bottom-right-radius: 4px; }
    .ai-message-style .ai-message-content { background: white; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px; color: #111; }
    .ai-typing { display: flex; gap: 4px; padding: 4px 0; }
    .ai-typing span {
      width: 8px; height: 8px; border-radius: 50%; background: #999;
      animation: typing 1.4s infinite;
    }
    .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
    .ai-chat-input {
      display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e0e0e0; background: white;
    }
    .ai-chat-input input {
      flex: 1; padding: 10px 14px; border: 1px solid #d0d0d0; border-radius: 20px;
      font-size: 13px; outline: none; font-family: inherit;
    }
      .ai-user-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  border-radius: 50%;
}
    .ai-chat-input input:focus { border-color: #0a246a; }
    .ai-chat-input button {
      width: 40px; height: 40px; border-radius: 50%; background: #0a246a;
      color: white; border: none; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .ai-chat-input button:hover:not(:disabled) { background: #1a3a8a; }
    .ai-chat-input button:disabled { background: #ccc; cursor: not-allowed; }
    @keyframes typing {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 500px) {
      .ai-assistant-panel { width: 95vw; height: 70vh; }
      .ai-assistant-overlay { right: 10px; bottom: 60px; }
    }
  `]
})
export class AiAssistantComponent {
  @Input() context: any = {};
  
  isOpen = false;
  query = '';
  loading = false;
  history: { role: string; content: string }[] = [];

  constructor(private http: HttpClient) {}

  open() {
    this.isOpen = true;
    if (this.history.length === 0) {
      this.history.push({
        role: 'assistant',
        content: 'Hello! I\'m your EDPTech AI Assistant, powered by Google Gemini. How can I help you today?'
      });
    }
  }

  @Input() userPhotoUrl: string = '';
@Input() userAvatarColor: string = '#0a246a';
@Input() userInitial: string = '?';
  close() {
    this.isOpen = false;
  }

  clearChat() {
    this.history = [];
    this.isOpen = false;
  }

  send() {
    if (!this.query.trim()) return;
    
    const userQuery = this.query.trim();
    this.history.push({ role: 'user', content: userQuery });
    this.query = '';
    this.loading = true;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    this.http.post<any>(`${environment.aiApiUrl}/api/ai/assistant`, 
      { query: userQuery, context: this.context }, 
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.success && response.answer) {
          this.history.push({ role: 'assistant', content: response.answer });
        } else {
          this.history.push({ role: 'assistant', content: 'Sorry, I couldn\'t process that.' });
        }
        this.loading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('AI Assistant error:', err);
        this.history.push({ role: 'assistant', content: 'Unable to connect to AI service.' });
        this.loading = false;
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.ai-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }
}