import { Component, Input, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
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
  <div class="ai-assistant-panel" 
       (click)="$event.stopPropagation()"
       [style.left.px]="panelPosition.x" 
       [style.top.px]="panelPosition.y"
       [style.bottom]="'auto'"
       [style.right]="'auto'">
    <div class="ai-assistant-header" (mousedown)="startDrag($event)">
      <div class="ai-assistant-title">
        <img [src]="aiAvatarUrl" alt="AI" class="ai-header-icon">
        <span>{{ aiAssistantName }}</span>
      </div>
      <div class="ai-assistant-actions">
        <button type="button" class="ai-btn-icon" (click)="clearChat()" title="Clear Chat">🗑️</button>
        <button type="button" class="ai-btn-icon" (click)="close()" title="Close">✕</button>
      </div>
    </div>
    
    <div class="ai-chat-messages" #chatMessages>
      <div *ngFor="let msg of history; let last = last" 
           class="ai-message" 
           [class.user-message]="msg.role === 'user'" 
           [class.ai-message-style]="msg.role === 'assistant'">
        <div class="ai-message-avatar">
          <!-- AI avatar (custom from settings) -->
          <img *ngIf="msg.role === 'assistant'" [src]="aiAvatarUrl" alt="AI" class="ai-avatar-img">
          
          <!-- User avatar -->
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
          <img [src]="aiAvatarUrl" alt="AI" class="ai-avatar-img">
        </div>
        <div class="ai-message-content">
          <div class="ai-typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
    
    <div class="ai-chat-input">
      <input type="text" #aiInput 
             [(ngModel)]="query" 
             placeholder="Ask me anything..."
             (keyup.enter)="send()" 
             [disabled]="loading" />
      <button type="button" (click)="send()" [disabled]="loading || !query.trim()">➤</button>
    </div>
  </div>
</div>
  `,
   styles: [`
    .ai-assistant-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 3000;
      background: transparent;
    }
    .ai-assistant-panel {
      position: fixed;
      width: 400px; height: 510px; background: white; border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column;
      overflow: hidden; border: 1px solid #d0d0d0;
    }
    .ai-assistant-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; background: linear-gradient(135deg, #515358, #7c87a0); color: white;
      cursor: grab; user-select: none; flex-shrink: 0;
    }
    .ai-assistant-header:active { cursor: grabbing; }
    .ai-assistant-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .ai-header-icon {
      width: 24px; height: 24px; object-fit: contain; border-radius: 4px;
    }
    .ai-avatar-img {
      width: 100%; height: 100%; object-fit: contain; border-radius: 50%;
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
      gap: 12px; background: #f8f9fa; min-height: 0;
    }
    .ai-message { display: flex; gap: 8px; max-width: 85%; flex-shrink: 0; }
    .user-message { align-self: flex-end; flex-direction: row-reverse; }
    .ai-message-style { align-self: flex-start; }
    .ai-message-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #e8e8e8;
      display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
      overflow: hidden;
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
      display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e0e0e0; 
      background: white; flex-shrink: 0;
    }
    .ai-chat-input input {
      flex: 1; padding: 10px 14px; border: 1px solid #d0d0d0; border-radius: 20px;
      font-size: 13px; outline: none; font-family: inherit;
    }
    .ai-user-initial {
      width: 100%; height: 100%; display: flex; align-items: center;
      justify-content: center; color: white; font-weight: bold;
      font-size: 14px; border-radius: 50%;
    }
    .ai-chat-input input:focus { border-color: #0a246a; }
    .ai-chat-input button {
      width: 40px; height: 40px; border-radius: 50%; background: #0a246a;
      color: white; border: none; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ai-chat-input button:hover:not(:disabled) { background: #1a3a8a; }
    .ai-chat-input button:disabled { background: #ccc; cursor: not-allowed; }
    @keyframes typing {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    @media (max-width: 500px) {
      .ai-assistant-panel { width: 95vw; height: 70vh; }
    }
  `]
})
export class AiAssistantComponent implements AfterViewChecked, OnInit {
  @Input() context: any = {};
  @Input() userPhotoUrl: string = '';
  @Input() userAvatarColor: string = '#0a246a';
  @Input() userInitial: string = '?';
  
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  @ViewChild('aiInput') aiInputRef!: ElementRef;
  
  // ✅ AI Settings (loaded from admin settings)
  aiAvatarUrl: string = 'assets/images/ai.png';
  aiAssistantName: string = 'St4Nger AI';
  aiGreetingMessage: string = "Hello! I'm your St4Nger AI. How can I help you today?";
  
  isOpen = false;
  query = '';
  loading = false;
  history: { role: string; content: string }[] = [];
  
  panelPosition = { x: 0, y: 0 };
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private shouldScrollToBottom = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAiSettings();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * ✅ Load AI settings from localStorage cache or admin settings
   */
 loadAiSettings() {
  // Clear old cache to force fresh load
  const cached = localStorage.getItem('ai_avatar_cache');
  if (cached) {
    try {
      const settings = JSON.parse(cached);
      if (settings.avatar) {
        this.aiAvatarUrl = settings.avatar;
        this.aiAssistantName = settings.name || 'St4Nger AI';
        this.aiGreetingMessage = settings.greeting || "Hello! I'm your St4Nger AI. How can I help you today?";
        console.log('✅ AI settings loaded from cache:', this.aiAvatarUrl.substring(0, 50));
        return;
      }
    } catch (e) {
      console.warn('Failed to parse AI cache');
    }
  }
  
  // Fetch from API
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${environment.apiUrl}/api/admin/settings`, { headers }).subscribe({
      next: (data) => {
        // ✅ Check both locations
        const avatar = data.ai?.avatar || data.ai_avatar || 'assets/images/ai.png';
        const name = data.ai?.name || 'St4Nger AI';
        const greeting = data.ai?.greeting || "Hello! I'm your St4Nger AI. How can I help you today?";
        
        this.aiAvatarUrl = avatar;
        this.aiAssistantName = name;
        this.aiGreetingMessage = greeting;
        
        // Cache
        localStorage.setItem('ai_avatar_cache', JSON.stringify({
          avatar: avatar,
          name: name,
          greeting: greeting
        }));
        
        console.log('✅ AI settings loaded from API:', avatar.substring(0, 50));
      },
      error: () => {
        console.log('Using default AI settings');
      }
    });
  }
}
  open() {
    this.isOpen = true;
    this.panelPosition.x = window.innerWidth - 420;
    this.panelPosition.y = window.innerHeight - 550;
    
    if (this.history.length === 0) {
      this.history.push({
        role: 'assistant',
        content: this.aiGreetingMessage
      });
    }
    
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    this.shouldScrollToBottom = true;
    setTimeout(() => this.focusInput(), 100);
  }

  close() {
    this.isOpen = false;
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  clearChat() {
    this.history = [];
    this.shouldScrollToBottom = true;
    setTimeout(() => this.focusInput(), 50);
  }

  startDrag(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.ai-btn-icon')) return;
    
    this.isDragging = true;
    this.dragOffsetX = event.clientX - this.panelPosition.x;
    this.dragOffsetY = event.clientY - this.panelPosition.y;
    event.preventDefault();
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.panelPosition.x = Math.max(0, event.clientX - this.dragOffsetX);
    this.panelPosition.y = Math.max(0, event.clientY - this.dragOffsetY);
  }

  onDragEnd() {
    this.isDragging = false;
  }

  send() {
    if (!this.query.trim() || this.loading) return;
    
    const userQuery = this.query.trim();
    this.history.push({ role: 'user', content: userQuery });
    this.query = '';
    this.loading = true;
    this.shouldScrollToBottom = true;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    this.http.post<any>(`${environment.aiApiUrl}/api/ai/assistant`, 
      { query: userQuery, context: this.context }, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        let answer = '';
        
        if (response && response.success && response.answer) {
          answer = response.answer;
        } else if (response && response.answer) {
          answer = response.answer;
        } else if (response && response.error) {
          answer = response.error;
        } else {
          answer = 'Sorry, I couldn\'t process that.';
        }
        
        this.history.push({ role: 'assistant', content: answer });
        this.loading = false;
        this.shouldScrollToBottom = true;
        setTimeout(() => this.focusInput(), 50);
      },
      error: (err) => {
        console.error('AI Assistant error:', err);
        
        if (err.status === 0) {
          this.history.push({ 
            role: 'assistant', 
            content: 'Cannot connect to AI service.' 
          });
        } else {
          this.history.push({ 
            role: 'assistant', 
            content: `AI service error (${err.status}).` 
          });
        }
        
        this.loading = false;
        this.shouldScrollToBottom = true;
        setTimeout(() => this.focusInput(), 50);
      }
    });
  }

  private focusInput() {
    if (this.isOpen && this.aiInputRef?.nativeElement) {
      this.aiInputRef.nativeElement.focus();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = this.chatMessagesRef?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}