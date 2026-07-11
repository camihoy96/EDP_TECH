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
  priorities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  requisitions: number;
  jobOrders: number;
  timestamp: string;
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
          <div class="stat-label">Resolved Today</div>
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
          <div class="stat-value sla-compliance" 
               [class.good]="slaStats.slaCompliance >= 90" 
               [class.warning]="slaStats.slaCompliance >= 70 && slaStats.slaCompliance < 90" 
               [class.bad]="slaStats.slaCompliance < 70">
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
        <p>⚠️ Unable to load live SLA data. Showing default SLA targets.</p>
      </div>

      <!-- Priority Breakdown - FIXED with optional chaining -->
      <div class="priority-section" *ngIf="slaStats?.priorities">
        <h3>📊 Open Tickets by Priority</h3>
        <div class="priority-bars">
          <div class="priority-row">
            <span class="priority-label critical">Critical</span>
            <span class="priority-count">{{ slaStats?.priorities?.critical || 0 }}</span>
            <div class="priority-track">
              <div class="priority-fill critical" 
                   [style.width.%]="getPriorityPercent('critical')"></div>
            </div>
          </div>
          <div class="priority-row">
            <span class="priority-label high">High</span>
            <span class="priority-count">{{ slaStats?.priorities?.high || 0 }}</span>
            <div class="priority-track">
              <div class="priority-fill high" 
                   [style.width.%]="getPriorityPercent('high')"></div>
            </div>
          </div>
          <div class="priority-row">
            <span class="priority-label medium">Medium</span>
            <span class="priority-count">{{ slaStats?.priorities?.medium || 0 }}</span>
            <div class="priority-track">
              <div class="priority-fill medium" 
                   [style.width.%]="getPriorityPercent('medium')"></div>
            </div>
          </div>
          <div class="priority-row">
            <span class="priority-label low">Low</span>
            <span class="priority-count">{{ slaStats?.priorities?.low || 0 }}</span>
            <div class="priority-track">
              <div class="priority-fill low" 
                   [style.width.%]="getPriorityPercent('low')"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- SLA Cards -->
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

      <!-- Last Updated - FIXED with optional chaining -->
      <div class="last-updated" *ngIf="slaStats?.timestamp">
        Last updated: {{ slaStats?.timestamp | date:'medium' }}
      </div>
    </div>
  `,
  styles: [`
    .sla-container {
      padding: 20px;
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

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 20px;
      padding: 14px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
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

    .priority-section {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .priority-section h3 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #0a246a;
    }
    .priority-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .priority-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .priority-label {
      width: 60px;
      font-weight: 600;
      font-size: 11px;
    }
    .priority-label.critical { color: #cc0000; }
    .priority-label.high { color: #ff6600; }
    .priority-label.medium { color: #cc8800; }
    .priority-label.low { color: #008800; }
    .priority-count {
      width: 24px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
    }
    .priority-track {
      flex: 1;
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .priority-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .priority-fill.critical { background: #cc0000; }
    .priority-fill.high { background: #ff6600; }
    .priority-fill.medium { background: #ffaa00; }
    .priority-fill.low { background: #008800; }

    .sla-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .sla-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      border-top: 4px solid #ccc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
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

    .info-section {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
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

    .last-updated {
      text-align: center;
      font-size: 11px;
      color: #aaa;
      margin-bottom: 12px;
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
        console.log('✅ SLA Stats loaded:', data);
        this.slaStats = {
          totalTickets: data.total || 0,
          openTickets: data.open || 0,
          resolvedTickets: data.resolvedToday || 0,
          criticalTickets: data.critical || 0,
          avgResolutionTime: data.avgResolutionTime || 'N/A',
          slaCompliance: data.slaCompliance || 98,
          priorities: data.priorities || { critical: 0, high: 0, medium: 0, low: 0 },
          requisitions: data.requisitions || 0,
          jobOrders: data.jobOrders || 0,
          timestamp: data.timestamp || new Date().toISOString()
        };
        this.loadError = false;
      },
      error: (err) => {
        console.error('❌ Error loading SLA stats:', err);
        this.loadError = true;
        if (!this.slaStats) {
          this.slaStats = {
            totalTickets: 0,
            openTickets: 0,
            resolvedTickets: 0,
            criticalTickets: 0,
            avgResolutionTime: 'N/A',
            slaCompliance: 98,
            priorities: { critical: 0, high: 0, medium: 0, low: 0 },
            requisitions: 0,
            jobOrders: 0,
            timestamp: new Date().toISOString()
          };
        }
      }
    });
  }

  getPriorityPercent(priority: string): number {
    if (!this.slaStats) return 0;
    const total = this.slaStats.openTickets || 1;
    const count = this.slaStats.priorities[priority as keyof typeof this.slaStats.priorities] || 0;
    return (count / total) * 100;
  }
}