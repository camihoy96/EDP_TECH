import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-container">
      <div class="page-header">
        <h2>ℹ️ About Portal</h2>
      </div>
      <div class="about-content">
        <div class="about-card">
          <h3>My Support Portal v2.0</h3>
          <p>Part of EDPtech Helpdesk System</p>
          <p class="copyright">© 2024 EDPtech. All rights reserved.</p>
        </div>
        <div class="back-link">
          <a routerLink="/client/dashboard">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .about-container { padding: 20px; max-width: 500px; margin: 0 auto; }
    .page-header { text-align: center; margin-bottom: 20px; }
    .page-header h2 { color: #0a246a; margin: 0; }
    .about-card { background: white; border: 1px solid #c0c0c0; border-radius: 8px; padding: 24px; text-align: center; }
    .about-card h3 { color: #333; margin: 0 0 8px 0; }
    .about-card p { color: #666; margin: 4px 0; font-size: 13px; }
    .copyright { color: #999 !important; font-size: 11px !important; margin-top: 12px !important; }
    .back-link { text-align: center; margin-top: 20px; }
    .back-link a { color: #0a246a; text-decoration: none; }
  `]
})
export class ClientAboutComponent {}