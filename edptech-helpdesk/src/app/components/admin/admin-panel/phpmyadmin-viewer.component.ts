import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-phpmyadmin-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pma-container">
      <div class="pma-header">
        <div class="pma-header-left">
          <h2>🗄️ phpMyAdmin</h2>
          <span class="pma-page-title">{{ pageTitle }}</span>
        </div>
        <div class="pma-header-right">
          <button class="pma-btn" (click)="openInNewTab()">🔗 Open in New Tab</button>
          <button class="pma-btn pma-lock-btn" (click)="goBack()">🔒 Lock & Exit</button>
        </div>
      </div>
      
      <div class="pma-loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading phpMyAdmin...</p>
      </div>

      <div class="pma-error" *ngIf="loadError">
        <span>⚠️</span>
        <p>phpMyAdmin could not be loaded in this window. Your browser may be blocking it.</p>
        <button class="pma-btn pma-open-btn" (click)="openInNewTab()">🔗 Open in New Tab Instead</button>
      </div>

      <iframe 
        *ngIf="!isLoading && !loadError"
        [src]="safeUrl" 
        class="pma-iframe"
        (load)="onIframeLoad()"
        (error)="onIframeError()"
        title="phpMyAdmin">
      </iframe>
    </div>
  `,
  styles: [`
    .pma-container {
      height: calc(100vh - 110px);
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }
    .pma-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: #0a246a;
      color: white;
      flex-shrink: 0;
    }
    .pma-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .pma-header-left h2 {
      margin: 0;
      font-size: 15px;
    }
    .pma-page-title {
      font-size: 10px;
      opacity: 0.7;
      background: rgba(255,255,255,0.15);
      padding: 3px 8px;
      border-radius: 3px;
    }
    .pma-header-right {
      display: flex;
      gap: 8px;
    }
    .pma-back-btn {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 5px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    .pma-back-btn:hover {
      background: rgba(255,255,255,0.25);
    }
    .pma-btn {
      padding: 6px 14px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    .pma-btn:hover {
      background: rgba(255,255,255,0.25);
    }
    .pma-lock-btn {
      background: rgba(255,0,0,0.3);
      border-color: rgba(255,0,0,0.5);
    }
    .pma-lock-btn:hover {
      background: rgba(255,0,0,0.5);
    }
    .pma-open-btn {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
      font-size: 12px;
      padding: 8px 16px;
    }
    .pma-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      color: #888;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #0a246a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pma-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      text-align: center;
      padding: 40px;
    }
    .pma-error span { font-size: 48px; margin-bottom: 12px; }
    .pma-error p { color: #666; margin-bottom: 20px; font-size: 13px; max-width: 400px; }
    .pma-iframe {
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    }
  `]
})
export class PhpMyAdminViewerComponent implements OnInit {
  isLoading = true;
  loadError = false;
  pageTitle = '';
  phpMyAdminUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const page = this.route.snapshot.queryParamMap.get('page') || 'structure';
    
    const routes: Record<string, { url: string; title: string }> = {
      structure: {
        url: 'http://localhost:8080/phpmyadmin/index.php?route=/database/structure&db=edptech_helpdesk',
        title: 'Database Structure'
      },
      sql: {
        url: 'http://localhost:8080/phpmyadmin/index.php?route=/database/sql&db=edptech_helpdesk',
        title: 'SQL Query'
      },
      export: {
        url: 'http://localhost:8080/phpmyadmin/index.php?route=/server/export&db=edptech_helpdesk',
        title: 'Export Database'
      },
      import: {
        url: 'http://localhost:8080/phpmyadmin/index.php?route=/server/import&db=edptech_helpdesk',
        title: 'Import Database'
      }
    };

    const route = routes[page] || routes['structure'];
    this.phpMyAdminUrl = route.url;
    this.pageTitle = route.title;
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }
  get safeUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.phpMyAdminUrl);
  }

  onIframeLoad() {
    this.isLoading = false;
  }

  onIframeError() {
    this.loadError = true;
    this.isLoading = false;
  }

  openInNewTab() {
    window.open(this.phpMyAdminUrl, '_blank');
  }

  goBack() {
    this.router.navigate(['/admin/database']);
  }
}