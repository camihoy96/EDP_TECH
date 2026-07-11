import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { interval, Subscription } from 'rxjs';

interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  timestamp: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    email: ServiceStatus;
    storage: ServiceStatus;
  };
  metrics: {
    uptime: string;
    response_time: number;
    active_users: number;
    total_tickets_today: number;
    total_requisitions_today: number;
    total_job_orders_today: number;
  };
  recent_incidents: Incident[];
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  latency: number;
  lastChecked: string;
  uptime: number;
}

interface Incident {
  id: number;
  title: string;
  status: 'resolved' | 'investigating' | 'identified' | 'monitoring';
  created_at: string;
  resolved_at: string | null;
}

@Component({
  selector: 'app-client-system-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="system-status-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>🩺 System Status</h2>
          <p>Real-time monitoring of system health and performance</p>
        </div>
        <div class="header-actions">
          <span class="last-updated" *ngIf="systemStatus">
            Last updated: {{ systemStatus.timestamp | date:'medium' }}
          </span>
          <button class="refresh-btn" (click)="refreshStatus()" [disabled]="isRefreshing">
            {{ isRefreshing ? 'Refreshing...' : '🔄 Refresh' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Checking system status...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!isLoading && error">
        <span>⚠️</span>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="refreshStatus()">Retry</button>
      </div>

      <!-- Status Content -->
      <div class="status-content" *ngIf="!isLoading && !error && systemStatus">
        
        <!-- Overall Status Banner -->
        <div class="overall-status" [class]="systemStatus.status">
          <div class="status-icon">
            <span *ngIf="systemStatus.status === 'operational'">✅</span>
            <span *ngIf="systemStatus.status === 'degraded'">⚠️</span>
            <span *ngIf="systemStatus.status === 'down'">🔴</span>
          </div>
          <div class="status-text">
            <h3>
              {{ systemStatus.status === 'operational' ? 'All Systems Operational' : 
                 systemStatus.status === 'degraded' ? 'Some Systems Degraded' : 
                 'Systems Down' }}
            </h3>
            <p *ngIf="systemStatus.status === 'operational'">
              All services are running normally
            </p>
            <p *ngIf="systemStatus.status === 'degraded'">
              Some services are experiencing issues. Our team is working on it.
            </p>
            <p *ngIf="systemStatus.status === 'down'">
              Major outage detected. Our team has been notified and is investigating.
            </p>
          </div>
        </div>

        <!-- Services Grid -->
        <div class="services-section">
          <h3>🔧 Services</h3>
          <div class="services-grid">
            <div class="service-card" *ngFor="let service of getServicesArray()">
              <div class="service-header">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-status-badge" [class]="service.status">
                  {{ service.status | titlecase }}
                </span>
              </div>
              <div class="service-metrics">
                <div class="metric">
                  <span class="metric-label">Latency</span>
                  <span class="metric-value" [class.good]="service.latency < 200" 
                                           [class.warning]="service.latency >= 200 && service.latency < 500"
                                           [class.bad]="service.latency >= 500">
                    {{ service.latency }}ms
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">{{ service.uptime }}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Last Checked</span>
                  <span class="metric-value">{{ service.lastChecked | date:'short' }}</span>
                </div>
              </div>
              <div class="uptime-bar">
                <div class="uptime-fill" [style.width.%]="service.uptime"
                     [class.good]="service.uptime >= 99"
                     [class.warning]="service.uptime >= 95 && service.uptime < 99"
                     [class.bad]="service.uptime < 95">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Metrics -->
        <div class="metrics-section">
          <h3>📊 System Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">⏱️</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.uptime }}</span>
                <span class="metric-label">Uptime</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">⚡</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.response_time }}ms</span>
                <span class="metric-label">Avg Response Time</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">👥</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.active_users }}</span>
                <span class="metric-label">Active Users</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">🎫</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.total_tickets_today }}</span>
                <span class="metric-label">Tickets Today</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📩</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.total_requisitions_today }}</span>
                <span class="metric-label">Requisitions Today</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📋</div>
              <div class="metric-info">
                <span class="metric-value-large">{{ systemStatus.metrics.total_job_orders_today }}</span>
                <span class="metric-label">Job Orders Today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Incidents -->
        <div class="incidents-section" *ngIf="systemStatus.recent_incidents.length > 0">
          <h3>🚨 Recent Incidents</h3>
          <div class="incidents-list">
            <div class="incident-item" *ngFor="let incident of systemStatus.recent_incidents">
              <div class="incident-header">
                <span class="incident-title">{{ incident.title }}</span>
                <span class="incident-status" [class]="incident.status">
                  {{ incident.status | titlecase }}
                </span>
              </div>
              <div class="incident-dates">
                <span>Created: {{ incident.created_at | date:'medium' }}</span>
                <span *ngIf="incident.resolved_at">
                  Resolved: {{ incident.resolved_at | date:'medium' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No Incidents -->
        <div class="no-incidents" *ngIf="systemStatus.recent_incidents.length === 0">
          <span>🎉</span>
          <p>No recent incidents. All systems are running smoothly!</p>
        </div>

      </div>

      <!-- No Data -->
      <div class="no-data" *ngIf="!isLoading && !error && !systemStatus">
        <span>📡</span>
        <p>No system status available.</p>
      </div>
    </div>
  `,
  styles: [`
    .system-status-container {
      padding: 20px;
      margin: 0 auto;
      max-width: 1200px;
    }

    .page-header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-header h2 {
      color: #0a246a;
      margin: 0;
      font-size: 22px;
    }

    .page-header p {
      color: #666;
      margin: 0;
      font-size: 13px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .last-updated {
      font-size: 11px;
      color: #888;
    }

    .refresh-btn, .back-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      padding: 8px 18px;
      cursor: pointer;
      font-size: 13px;
      border-radius: 4px;
      font-weight: 500;
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-btn:hover:not(:disabled), .back-btn:hover {
      background: #e0e0e0;
    }

    .loading-state, .error-state, .no-data {
      text-align: center;
      padding: 60px;
      color: #888;
    }

    .loading-state .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #0a246a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state span, .no-data span {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
    }

    .error-state p {
      color: #ef4444;
      font-size: 14px;
      margin: 0 0 16px 0;
    }

    .retry-btn {
      background: #0a246a;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .retry-btn:hover {
      background: #0d2f8a;
    }

    /* Overall Status Banner */
    .overall-status {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 2px solid #e0e0e0;
    }

    .overall-status.operational {
      background: #f0fdf4;
      border-color: #22c55e;
    }

    .overall-status.degraded {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .overall-status.down {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .status-icon {
      font-size: 40px;
    }

    .status-text h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
    }

    .status-text p {
      margin: 0;
      font-size: 13px;
      color: #666;
    }

    /* Services */
    .services-section, .metrics-section, .incidents-section {
      margin-bottom: 24px;
    }

    .services-section h3, .metrics-section h3, .incidents-section h3 {
      color: #0f172a;
      margin: 0 0 16px 0;
      font-size: 16px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .service-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .service-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 14px;
    }

    .service-status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .service-status-badge.operational {
      background: #dcfce7;
      color: #166534;
    }

    .service-status-badge.degraded {
      background: #fef3c7;
      color: #92400e;
    }

    .service-status-badge.down {
      background: #fee2e2;
      color: #991b1b;
    }

    .service-status-badge.maintenance {
      background: #e0e7ff;
      color: #3730a3;
    }

    .service-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .metric {
      text-align: center;
    }

    .metric-label {
      display: block;
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    .metric-value.good { color: #22c55e; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.bad { color: #ef4444; }

    .uptime-bar {
      height: 4px;
      background: #f0f0f0;
      border-radius: 2px;
      overflow: hidden;
    }

    .uptime-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .uptime-fill.good { background: #22c55e; }
    .uptime-fill.warning { background: #f59e0b; }
    .uptime-fill.bad { background: #ef4444; }

    /* Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .metric-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .metric-icon {
      font-size: 24px;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-value-large {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }

    .metric-info .metric-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
    }

    /* Incidents */
    .incidents-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .incident-item {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 14px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .incident-title {
      font-weight: 600;
      color: #0f172a;
      font-size: 13px;
    }

    .incident-status {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .incident-status.resolved {
      background: #dcfce7;
      color: #166534;
    }

    .incident-status.investigating {
      background: #fee2e2;
      color: #991b1b;
    }

    .incident-status.identified {
      background: #fef3c7;
      color: #92400e;
    }

    .incident-status.monitoring {
      background: #e0e7ff;
      color: #3730a3;
    }

    .incident-dates {
      display: flex;
      gap: 16px;
      font-size: 11px;
      color: #888;
    }

    .no-incidents {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    .no-incidents span {
      font-size: 36px;
      display: block;
      margin-bottom: 8px;
    }

    .no-incidents p {
      font-size: 13px;
      margin: 0;
    }

    @media (max-width: 600px) {
      .header-actions {
        flex-direction: column;
        align-items: flex-start;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .service-metrics {
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
      }
    }
  `]
})
export class ClientSystemStatusComponent implements OnInit, OnDestroy {
  systemStatus: SystemStatus | null = null;
  isLoading = false;
  isRefreshing = false;
  error: string | null = null;
  private refreshSubscription: Subscription | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadSystemStatus();
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadSystemStatus(true);
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSystemStatus(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
      this.error = null;
    }
    this.isRefreshing = true;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<SystemStatus>(`${environment.apiUrl}/api/system-status`, { headers })
      .subscribe({
        next: (data) => {
          this.systemStatus = data;
          this.isLoading = false;
          this.isRefreshing = false;
          this.error = null;
        },
        error: (err) => {
          console.error('Error loading system status:', err);
          this.isLoading = false;
          this.isRefreshing = false;
          
          if (err.status === 401) {
            this.error = 'Session expired. Please log in again.';
          } else if (err.status === 500) {
            this.error = 'Server error. Please try again later.';
          } else {
            this.error = 'Failed to load system status. Please try again.';
          }
        }
      });
  }

  refreshStatus() {
    this.loadSystemStatus();
  }

  getServicesArray(): ServiceStatus[] {
    if (!this.systemStatus) return [];
    return Object.values(this.systemStatus.services);
  }

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }
}