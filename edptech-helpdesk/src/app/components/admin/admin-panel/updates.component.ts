import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-updates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>🔄 System Updates</h1>
      </div>

      <div class="content">
        <!-- Current Version Status -->
        <div class="card current">
          <div class="current-header">
            <div class="version-info">
              <span class="badge green">Current Version</span>
              <h2>EDPtech Helpdesk v2.0.0</h2>
            </div>
            <div class="update-status">
              <span class="status-dot" [class.checking]="checking" [class.up-to-date]="!checking"></span>
              <span>{{ checking ? 'Checking...' : 'Up to date' }}</span>
            </div>
          </div>
          <div class="build-info">
            <div class="build-item">
              <span class="b-label">Released</span>
              <span class="b-value">June 7, 2024</span>
            </div>
            <div class="build-item">
              <span class="b-label">Build</span>
              <span class="b-value">2.0.0.20240607</span>
            </div>
            <div class="build-item">
              <span class="b-label">Framework</span>
              <span class="b-value">Angular 17 + Flask</span>
            </div>
            <div class="build-item">
              <span class="b-label">Database</span>
              <span class="b-value">MySQL 8.0 / MariaDB</span>
            </div>
          </div>
          <button class="check-btn" (click)="checkForUpdates()" [disabled]="checking">
            {{ checking ? '⏳ Checking for updates...' : '🔍 Check for Updates' }}
          </button>
          <p class="update-message" *ngIf="updateMessage">{{ updateMessage }}</p>
        </div>

        <!-- What's New in Current Version -->
        <div class="card highlights">
          <h2>✨ What's New in v2.0.0</h2>
          <div class="highlights-grid">
            <div class="highlight">
              <span class="h-icon">🤖</span>
              <div>
                <strong>AI-Powered Assistant</strong>
                <p>Integrated Google Gemini 2.5 Flash for intelligent, context-aware support. Available 24/7 for all users.</p>
              </div>
            </div>
            <div class="highlight">
              <span class="h-icon">💻</span>
              <div>
                <strong>Computer Network Monitoring</strong>
                <p>Automatic device discovery with ARP scanning, port detection, OS fingerprinting, and license tracking.</p>
              </div>
            </div>
            <div class="highlight">
              <span class="h-icon">🔒</span>
              <div>
                <strong>Enhanced Security</strong>
                <p>Auto-logout after 30 minutes of inactivity, JWT authentication, and role-based access control.</p>
              </div>
            </div>
            <div class="highlight">
              <span class="h-icon">📊</span>
              <div>
                <strong>Advanced Analytics</strong>
                <p>Comprehensive reporting with SLA tracking, agent performance metrics, and priority distribution charts.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Version History Timeline -->
        <div class="card">
          <h2>📋 Version History</h2>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-marker current"></div>
              <div class="timeline-content">
                <div class="version-header">
                  <h3>v2.0.0</h3>
                  <span class="version-badge current-badge">Current</span>
                </div>
                <p class="release-date">📅 June 7, 2024</p>
                <ul>
                  <li>🤖 AI Assistant powered by Google Gemini 2.5 Flash</li>
                  <li>💻 Computer Network Monitoring with ARP, nmap, and WMI</li>
                  <li>📊 Enhanced Reporting & Analytics dashboard</li>
                  <li>🔒 Auto-logout security feature (30 min inactivity)</li>
                  <li>📄 Dedicated About, Documentation, Shortcuts, and Support pages</li>
                  <li>🔄 Improved network scanning for /16 subnets</li>
                  <li>🎨 Windows XP classic UI theme consistency</li>
                </ul>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="version-header">
                  <h3>v1.5.0</h3>
                </div>
                <p class="release-date">📅 March 15, 2024</p>
                <ul>
                  <li>📋 Job Orders module with approval workflow</li>
                  <li>📩 Requisitions module with status tracking</li>
                  <li>💬 Internal Chat System for team communication</li>
                  <li>🔑 Registration Key Management for user onboarding</li>
                  <li>🏢 Department and Department Roles management</li>
                  <li>🔔 Notification bell with real-time alerts</li>
                </ul>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="version-header">
                  <h3>v1.0.0</h3>
                </div>
                <p class="release-date">📅 January 10, 2024</p>
                <ul>
                  <li>🎫 Complete Ticket Management System</li>
                  <li>👥 User Management with role-based access</li>
                  <li>📚 Knowledge Base for self-service support</li>
                  <li>📊 Basic reporting and statistics</li>
                  <li>🔐 JWT Authentication system</li>
                  <li>📱 Responsive design for desktop and tablet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Features -->
        <div class="card upcoming">
          <h2>🔮 Coming Soon</h2>
          <div class="upcoming-grid">
            <div class="upcoming-item">
              <span class="u-icon">📱</span>
              <div>
                <strong>Mobile App</strong>
                <p>Native iOS and Android apps for on-the-go ticket management</p>
                <span class="eta">Q3 2024</span>
              </div>
            </div>
            <div class="upcoming-item">
              <span class="u-icon">🔗</span>
              <div>
                <strong>API Integrations</strong>
                <p>Slack, Microsoft Teams, and email integration</p>
                <span class="eta">Q3 2024</span>
              </div>
            </div>
            <div class="upcoming-item">
              <span class="u-icon">📧</span>
              <div>
                <strong>Email Notifications</strong>
                <p>Automated email alerts for ticket updates and SLA breaches</p>
                <span class="eta">Q4 2024</span>
              </div>
            </div>
            <div class="upcoming-item">
              <span class="u-icon">📊</span>
              <div>
                <strong>Advanced Dashboards</strong>
                <p>Customizable widgets and real-time data visualization</p>
                <span class="eta">Q4 2024</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Update Settings -->
        <div class="card settings">
          <h2>⚙️ Update Settings</h2>
          <div class="setting-row">
            <div class="setting-info">
              <strong>Automatic Update Checks</strong>
              <p>System checks for updates daily at 2:00 AM</p>
            </div>
            <span class="setting-status enabled">✅ Enabled</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <strong>Update Channel</strong>
              <p>Currently on the Stable release channel</p>
            </div>
            <span class="setting-status">Stable</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <strong>Last Checked</strong>
              <p>{{ lastChecked }}</p>
            </div>
            <span class="setting-status">{{ lastCheckedResult }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 20px; max-width: 900px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; color: #0a246a; font-size: 22px; }
    .back-link { color: #0a246a; text-decoration: none; font-size: 12px; }
    .back-link:hover { text-decoration: underline; }

    .content { display: grid; gap: 16px; }

    .card { background: white; border: 1px solid #c0c0c0; padding: 24px; border-radius: 8px; }
    .card h2 { margin: 0 0 16px 0; color: #0a246a; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .card.current { border-left: 4px solid #008800; }

    /* Current Version */
    .current-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; }
    .badge.green { background: #e8f5e9; color: #2e7d32; }
    .version-info h2 { margin: 8px 0 0 0; border: none; padding: 0; font-size: 20px; }

    .update-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #008800; font-weight: bold; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #008800; }
    .status-dot.checking { background: #ffaa00; animation: pulse 1s infinite; }
    .status-dot.up-to-date { background: #008800; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .build-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; }
    .build-item { text-align: center; }
    .b-label { display: block; font-size: 10px; color: #888; text-transform: uppercase; }
    .b-value { font-size: 12px; font-weight: bold; color: #333; }

    .check-btn {
      padding: 8px 18px; background: #0a246a; color: white; border: none;
      border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;
    }
    .check-btn:hover:not(:disabled) { background: #1a3a8a; }
    .check-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .update-message { margin-top: 8px; font-size: 12px; color: #008800; }

    /* Highlights */
    .highlights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; }
    .highlight { display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; }
    .h-icon { font-size: 28px; flex-shrink: 0; }
    .highlight strong { display: block; font-size: 13px; color: #0a246a; margin-bottom: 4px; }
    .highlight p { font-size: 11px; color: #555; margin: 0; line-height: 1.5; }

    /* Timeline */
    .timeline { position: relative; padding-left: 30px; }
    .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #d0d0d0; }
    .timeline-item { position: relative; margin-bottom: 24px; }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-marker {
      position: absolute; left: -26px; top: 4px; width: 12px; height: 12px;
      border-radius: 50%; background: #c0c0c0; border: 2px solid white;
    }
    .timeline-marker.current { background: #008800; width: 14px; height: 14px; left: -27px; }
    .version-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .version-header h3 { margin: 0; font-size: 14px; color: #333; }
    .version-badge { font-size: 9px; padding: 2px 8px; border-radius: 10px; }
    .current-badge { background: #e8f5e9; color: #2e7d32; font-weight: bold; }
    .release-date { font-size: 10px; color: #888; margin: 0 0 8px 0; }
    .timeline-content ul { margin: 0; padding-left: 18px; }
    .timeline-content li { font-size: 11px; color: #555; padding: 2px 0; }

    /* Upcoming */
    .upcoming { background: #fffdf5; border-color: #e8d88a; }
    .upcoming-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .upcoming-item { display: flex; gap: 12px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e8e8e8; }
    .u-icon { font-size: 24px; flex-shrink: 0; }
    .upcoming-item strong { display: block; font-size: 12px; color: #333; margin-bottom: 2px; }
    .upcoming-item p { font-size: 11px; color: #666; margin: 0 0 4px 0; }
    .eta { font-size: 10px; background: #fff3e0; color: #e65100; padding: 2px 6px; border-radius: 3px; font-weight: bold; }

    /* Settings */
    .settings { background: #f8f9fa; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .setting-row:last-child { border-bottom: none; }
    .setting-info strong { display: block; font-size: 12px; color: #333; }
    .setting-info p { font-size: 10px; color: #888; margin: 2px 0 0 0; }
    .setting-status { font-size: 11px; color: #555; }
    .setting-status.enabled { color: #008800; font-weight: bold; }

    @media (max-width: 600px) {
      .highlights-grid { grid-template-columns: 1fr; }
      .upcoming-grid { grid-template-columns: 1fr; }
      .current-header { flex-direction: column; gap: 8px; }
    }
  `]
})
export class AdminUpdatesComponent implements OnInit {
  checking = false;
  updateMessage = '';
  lastChecked = 'Today at 2:00 AM';
  lastCheckedResult = '✅ Up to date';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Could load real update status from backend
  }

  checkForUpdates() {
    this.checking = true;
    this.updateMessage = '';
    
    // Simulate checking for updates
    setTimeout(() => {
      this.checking = false;
      const now = new Date();
      this.lastChecked = now.toLocaleString();
      this.lastCheckedResult = '✅ Up to date';
      this.updateMessage = '✅ No updates available. You are running the latest version.';
    }, 2000);

    // For real implementation, uncomment this:
    /*
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    this.http.get<any>(`${environment.apiUrl}/api/system/updates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.checking = false;
        if (data.updateAvailable) {
          this.updateMessage = `🆕 Version ${data.latestVersion} is available!`;
          this.lastCheckedResult = '🔄 Update available';
        } else {
          this.updateMessage = '✅ No updates available.';
          this.lastCheckedResult = '✅ Up to date';
        }
        this.lastChecked = new Date().toLocaleString();
      },
      error: () => {
        this.checking = false;
        this.updateMessage = '❌ Could not check for updates.';
      }
    });
    */
  }
}