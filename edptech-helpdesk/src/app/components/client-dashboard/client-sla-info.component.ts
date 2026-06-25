import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SlaStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  avgResolutionTime: string;
  slaCompliance: number;
}

@Component({
  selector: 'app-client-sla-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sla-container">
      <div class="page-header">
        <h2>📋 SLA Information</h2>
        <p>Service Level Agreement - Response & Resolution Times</p>
      </div>

      <!-- Real-time Stats -->
      <div class="stats-bar" *ngIf="slaStats">
        <div class="stat-item">
          <div class="stat-value">{{ slaStats.totalTickets }}</div>
          <div class="stat-label">Total Tickets</div>
        </div>
        <div class="stat-item open">
          <div class="stat-value">{{ slaStats.openTickets }}</div>
          <div class="stat-label">Open</div>
        </div>
        <div class="stat-item resolved">
          <div class="stat-value">{{ slaStats.resolvedTickets }}</div>
          <div class="stat-label">Resolved</div>
        </div>
        <div class="stat-item critical">
          <div class="stat-value">{{ slaStats.criticalTickets }}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ slaStats.avgResolutionTime }}</div>
          <div class="stat-label">Avg Resolution</div>
        </div>
        <div class="stat-item">
          <div class="stat-value sla-compliance" [class.good]="slaStats.slaCompliance >= 90" [class.warning]="slaStats.slaCompliance < 90 && slaStats.slaCompliance >= 70" [class.bad]="slaStats.slaCompliance < 70">
            {{ slaStats.slaCompliance }}%
          </div>
          <div class="stat-label">SLA Compliance</div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="!slaStats && !loadError">
        <div class="spinner"></div>
        <p>Loading SLA data...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="loadError">
        <p>⚠️ Unable to load SLA data. Showing default SLA targets.</p>
      </div>
      
      <div class="sla-cards">
        <div class="sla-card critical">
          <div class="sla-icon">🔴</div>
          <h3>Critical</h3>
          <div class="sla-time">Response: <strong>20 Seconds</strong></div>
          <div class="sla-time">Resolution: <strong>1-2 minutes</strong></div>
          <p>System down, security breach, major outage affecting multiple users</p>
        </div>
        
        <div class="sla-card high">
          <div class="sla-icon">🟠</div>
          <h3>High</h3>
          <div class="sla-time">Response: <strong>40 seconds</strong></div>
          <div class="sla-time">Resolution: <strong>2-3 minutes</strong></div>
          <p>Single user unable to work, critical application issue</p>
        </div>
        
        <div class="sla-card medium">
          <div class="sla-icon">🟡</div>
          <h3>Medium</h3>
          <div class="sla-time">Response: <strong>1 minute</strong></div>
          <div class="sla-time">Resolution: <strong>4-5 minutes</strong></div>
          <p>Non-critical issue, workaround available</p>
        </div>
        
        <div class="sla-card low">
          <div class="sla-icon">🟢</div>
          <h3>Low</h3>
          <div class="sla-time">Response: <strong>2 minutes</strong></div>
          <div class="sla-time">Resolution: <strong>5-10 minutes</strong></div>
          <p>General inquiry, minor enhancement request</p>
        </div>
      </div>

      <!-- Support Hours -->
      <div class="info-section">
        <h3>🕐 IT Support Hours</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Monday - Sunday:</strong> 8:00 AM - 7:00 PM
          </div>
          
        </div>
      </div>

      <!-- Contact Info -->
      <div class="info-section">
        <h3>📞 Emergency Contacts</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>IT Support Hotline:</strong> ext. 521
          </div>
          <div class="info-item">
            <strong>Emergency Line:</strong> ext. 890
          </div>
          <div class="info-item">
            <strong>Email:</strong> support&#64;edptech.com
          </div>
        </div>
      </div>
      
      <div class="back-link">
        <a routerLink="/client/dashboard">← Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .sla-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 20px;
      text-align: center;
    }
    .page-header h2 {
      color: #0a246a;
      margin: 0 0 8px 0;
      font-size: 20px;
    }
    .page-header p {
      color: #666;
      margin: 0;
      font-size: 13px;
    }

    /* Stats Bar */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 20px;
      padding: 14px;
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
    }
    .stat-item {
      text-align: center;
      padding: 8px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #333;
    }
    .stat-item.open .stat-value { color: #0066cc; }
    .stat-item.resolved .stat-value { color: #008800; }
    .stat-item.critical .stat-value { color: #cc0000; }
    .stat-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .sla-compliance.good { color: #008800; }
    .sla-compliance.warning { color: #cc7700; }
    .sla-compliance.bad { color: #cc0000; }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 30px;
      color: #888;
    }
    .spinner {
      width: 30px; height: 30px;
      border: 3px solid #e0e0e0;
      border-top-color: #0a246a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .error-state {
      text-align: center;
      padding: 16px;
      background: #fff8e0;
      border: 1px solid #ffaa00;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #886600;
    }

    .sla-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .sla-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      border-top: 4px solid #ccc;
    }
    .sla-card.critical { border-top-color: #cc0000; }
    .sla-card.high { border-top-color: #ff6600; }
    .sla-card.medium { border-top-color: #ffaa00; }
    .sla-card.low { border-top-color: #008800; }
    .sla-icon { font-size: 32px; margin-bottom: 8px; }
    .sla-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
    .sla-time {
      font-size: 12px;
      color: #555;
      margin-bottom: 6px;
    }
    .sla-time strong { color: #0a246a; }
    .sla-card p {
      font-size: 11px;
      color: #888;
      margin: 10px 0 0 0;
      line-height: 1.4;
    }

    /* Info Sections */
    .info-section {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-section h3 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #0a246a;
    }
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .info-item {
      font-size: 12px;
      color: #444;
    }
    .info-item strong {
      color: #333;
    }

    .back-link {
      text-align: center;
    }
    .back-link a {
      color: #0a246a;
      text-decoration: none;
      font-size: 13px;
    }
    .back-link a:hover { text-decoration: underline; }

    @media (max-width: 600px) {
      .stats-bar {
        grid-template-columns: repeat(3, 1fr);
      }
      .sla-cards {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class ClientSlaInfoComponent implements OnInit, OnDestroy {
  slaStats: SlaStats | null = null;
  loadError = false;
  private pollingSub: Subscription | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSlaStats();
    // Refresh every 30 seconds
    this.pollingSub = interval(30000).subscribe(() => this.loadSlaStats());
  }

  ngOnDestroy() {
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { 'Authorization': `Bearer ${token}` };
  }

  loadSlaStats() {
    const headers = this.getHeaders();
    this.http.get<any>(`${environment.apiUrl}/api/stats`, { headers }).subscribe({
      next: (data) => {
        this.slaStats = {
          totalTickets: data.total || 0,
          openTickets: data.open || 0,
          resolvedTickets: data.resolvedToday || 0,
          criticalTickets: data.critical || 0,
          avgResolutionTime: '~2h',
          slaCompliance: data.slaCompliance || 98,
        };
        this.loadError = false;
      },
      error: () => {
        this.loadError = true;
        // Fallback to defaults
        this.slaStats = {
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
          criticalTickets: 0,
          avgResolutionTime: 'N/A',
          slaCompliance: 98,
        };
      }
    });
  }
}