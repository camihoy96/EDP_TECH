import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-container">
      <div class="page-header">
        <h2>🩺 System Health</h2>
        <span class="header-sub">Monitor system performance and status</span>
      </div>

      <!-- Overall Status -->
      <div class="status-banner" [class.healthy]="systemStatus === 'healthy'" [class.warning]="systemStatus === 'warning'" [class.critical]="systemStatus === 'critical'">
        <span class="status-icon">{{ systemStatus === 'healthy' ? '✅' : systemStatus === 'warning' ? '⚠️' : '🚨' }}</span>
        <span class="status-text">System Status: <strong>{{ systemStatus === 'healthy' ? 'All Systems Operational' : systemStatus === 'warning' ? 'Degraded Performance' : 'Critical Issues Detected' }}</strong></span>
        <span class="status-time">Last checked: {{ lastChecked | date:'h:mm:ss a' }}</span>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="health-card">
          <div class="card-icon">⏱️</div>
          <div class="card-info">
            <div class="card-value">{{ healthData.uptime || '—' }}</div>
            <div class="card-label">Uptime</div>
          </div>
        </div>
        <div class="health-card">
          <div class="card-icon">🧠</div>
          <div class="card-info">
            <div class="card-value">{{ healthData.memory_usage || '—' }}</div>
            <div class="card-label">Memory Usage</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" [style.width.%]="healthData.memory_percent || 0" [class.warning]="(healthData.memory_percent || 0) > 70" [class.critical]="(healthData.memory_percent || 0) > 90"></div></div>
        </div>
        <div class="health-card">
          <div class="card-icon">💿</div>
          <div class="card-info">
            <div class="card-value">{{ healthData.disk_usage || '—' }}</div>
            <div class="card-label">Disk Usage</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" [style.width.%]="healthData.disk_percent || 0" [class.warning]="(healthData.disk_percent || 0) > 70" [class.critical]="(healthData.disk_percent || 0) > 90"></div></div>
        </div>
        <div class="health-card">
          <div class="card-icon">⚡</div>
          <div class="card-info">
            <div class="card-value">{{ healthData.cpu_usage || '—' }}</div>
            <div class="card-label">CPU Usage</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" [style.width.%]="healthData.cpu_percent || 0" [class.warning]="(healthData.cpu_percent || 0) > 70" [class.critical]="(healthData.cpu_percent || 0) > 90"></div></div>
        </div>
      </div>

      <!-- Services Status -->
      <div class="health-section">
        <h3>🔌 Services Status</h3>
        <div class="services-grid">
          <div class="service-item" *ngFor="let service of services">
            <div class="service-dot" [class.online]="service.status === 'online'" [class.offline]="service.status === 'offline'"></div>
            <div class="service-info">
              <strong>{{ service.name }}</strong>
              <span>{{ service.status === 'online' ? 'Running' : 'Stopped' }}</span>
            </div>
            <span class="service-port">{{ service.port }}</span>
          </div>
        </div>
      </div>

      <!-- Database Info -->
      <div class="health-section">
        <h3>🗄️ Database</h3>
        <div class="db-grid">
          <div class="db-item">
            <span class="db-label">Status</span>
            <span class="db-value online">● Connected</span>
          </div>
          <div class="db-item">
            <span class="db-label">Host</span>
            <span class="db-value">{{ healthData.db_host || 'localhost' }}</span>
          </div>
          <div class="db-item">
            <span class="db-label">Database</span>
            <span class="db-value">{{ healthData.db_name || 'edptech_helpdesk' }}</span>
          </div>
          <div class="db-item">
            <span class="db-label">Tables</span>
            <span class="db-value">{{ healthData.db_tables || 0 }}</span>
          </div>
          <div class="db-item">
            <span class="db-label">Size</span>
            <span class="db-value">{{ healthData.db_size || '—' }}</span>
          </div>
          <div class="db-item">
            <span class="db-label">Connections</span>
            <span class="db-value">{{ healthData.db_connections || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Events -->
      <div class="health-section">
        <h3>📋 Recent System Events</h3>
        <table class="events-table">
          <thead>
            <tr><th>Time</th><th>Event</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let event of recentEvents">
              <td>{{ event.time | date:'h:mm:ss a' }}</td>
              <td>{{ event.message }}</td>
              <td><span class="event-status" [class.success]="event.type === 'success'" [class.error]="event.type === 'error'">{{ event.type }}</span></td>
            </tr>
            <tr *ngIf="recentEvents.length === 0">
              <td colspan="3" class="empty-row">No recent events</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="action-buttons">
        <button class="btn btn-primary" (click)="refreshHealth()">🔄 Refresh</button>
        <button class="btn btn-secondary" (click)="clearCache()">🗑️ Clear System Cache</button>
        <button class="btn btn-secondary" (click)="restartService()">🔄 Restart Services</button>
      </div>

      <div class="toast-notification" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .health-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
    .page-header { margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .page-header h2 { margin: 0 0 2px 0; color: #0a246a; font-size: 18px; }
    .header-sub { color: #666; font-size: 11px; }

    .status-banner { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; color: white; }
    .status-banner.healthy { background: linear-gradient(135deg, #008800, #00aa44); }
    .status-banner.warning { background: linear-gradient(135deg, #cc6600, #ee8833); }
    .status-banner.critical { background: linear-gradient(135deg, #cc0000, #ee3333); }
    .status-icon { font-size: 28px; }
    .status-text { font-size: 14px; flex: 1; }
    .status-time { font-size: 10px; opacity: 0.8; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .health-card { background: white; border: 1px solid #c0c0c0; border-radius: 8px; padding: 16px; display: flex; gap: 12px; flex-wrap: wrap; }
    .card-icon { font-size: 28px; }
    .card-info { flex: 1; }
    .card-value { font-size: 18px; font-weight: 700; color: #333; }
    .card-label { font-size: 10px; color: #888; text-transform: uppercase; margin-top: 2px; }
    .progress-bar { width: 100%; height: 6px; background: #e8e8e8; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 3px; background: #008800; transition: width 0.5s; }
    .progress-fill.warning { background: #cc6600; }
    .progress-fill.critical { background: #cc0000; }

    .health-section { background: white; border: 1px solid #c0c0c0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .health-section h3 { margin: 0 0 14px 0; color: #0a246a; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }

    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
    .service-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9f9f9; border-radius: 6px; }
    .service-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .service-dot.online { background: #008800; }
    .service-dot.offline { background: #cc0000; }
    .service-info { flex: 1; }
    .service-info strong { display: block; font-size: 11px; color: #333; }
    .service-info span { font-size: 10px; color: #888; }
    .service-port { font-size: 10px; color: #0a246a; font-weight: 600; }

    .db-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
    .db-item { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; }
    .db-label { display: block; font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 2px; }
    .db-value { font-size: 12px; font-weight: 600; color: #333; }
    .db-value.online { color: #008800; }

    .events-table { width: 100%; border-collapse: collapse; }
    .events-table th { background: #f0f4f8; padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; border-bottom: 2px solid #d0d0d0; text-align: left; }
    .events-table td { padding: 7px 12px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; }
    .event-status { padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: capitalize; }
    .event-status.success { background: #eeffee; color: #008800; }
    .event-status.error { background: #ffecec; color: #cc0000; }
    .empty-row { text-align: center; padding: 20px; color: #888; }

    .action-buttons { display: flex; gap: 8px; }
    .btn { padding: 8px 16px; border: 1px solid #c0c0c0; background: white; cursor: pointer; border-radius: 4px; font-size: 11px; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover { background: #0a3a8c; }
    .btn-secondary { background: #f0f0f0; color: #333; }
    .btn-secondary:hover { background: #e0e0e0; }

    .toast-notification { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 10px 18px; border-radius: 6px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 3000; }
    .toast-notification.show { transform: translateY(0); opacity: 1; }
    .toast-notification.success { background: #008800; }
    .toast-notification.error { background: #cc0000; }
  `]
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  systemStatus: string = 'healthy';
  lastChecked: Date = new Date();
  healthData: any = {};
  services: any[] = [
    { name: 'Node.js API', status: 'online', port: '8000' },
    { name: 'MySQL Database', status: 'online', port: '3307' },
    { name: 'Python Monitor', status: 'offline', port: '5000' },
    { name: 'File Storage', status: 'online', port: 'N/A' }
  ];
  recentEvents: any[] = [
    { time: new Date(), message: 'System started successfully', type: 'success' },
    { time: new Date(Date.now() - 3600000), message: 'Database backup completed', type: 'success' },
    { time: new Date(Date.now() - 7200000), message: 'High memory usage detected', type: 'error' }
  ];
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private healthInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshHealth();
    this.healthInterval = setInterval(() => this.refreshHealth(), 30000);
  }

  ngOnDestroy() {
    if (this.healthInterval) clearInterval(this.healthInterval);
  }

  refreshHealth() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any>(`${environment.apiUrl}/api/admin/health`, { headers }).subscribe({
      next: (data) => {
        this.healthData = data || {};
        this.lastChecked = new Date();
        
        // Determine system status
        const memoryPercent = data?.memory_percent || 0;
        const cpuPercent = data?.cpu_percent || 0;
        if (memoryPercent > 90 || cpuPercent > 90) {
          this.systemStatus = 'critical';
        } else if (memoryPercent > 70 || cpuPercent > 70) {
          this.systemStatus = 'warning';
        } else {
          this.systemStatus = 'healthy';
        }
        
        // Update services status
        this.services[0].status = data?.api === 'online' ? 'online' : 'offline';
        this.services[1].status = data?.database === 'connected' ? 'online' : 'offline';
        this.services[2].status = data?.python_monitor === 'running' ? 'online' : 'offline';
      },
      error: () => {
        this.healthData = {
          uptime: 'N/A',
          memory_usage: 'N/A',
          memory_percent: 0,
          disk_usage: 'N/A',
          disk_percent: 0,
          cpu_usage: 'N/A',
          cpu_percent: 0,
          db_host: 'localhost',
          db_name: 'edptech_helpdesk',
          db_tables: 'N/A',
          db_size: 'N/A',
          db_connections: 'N/A'
        };
        this.systemStatus = 'warning';
      }
    });
  }

  clearCache() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post(`${environment.apiUrl}/api/admin/clear-cache`, {}, { headers }).subscribe({
      next: () => this.showToastMsg('✅ Cache cleared!', 'success'),
      error: () => this.showToastMsg('Failed to clear cache', 'error')
    });
  }

  restartService() {
    if (confirm('Restart system services? This may cause brief downtime.')) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.post(`${environment.apiUrl}/api/admin/restart`, {}, { headers }).subscribe({
        next: () => this.showToastMsg('✅ Services restarted!', 'success'),
        error: () => this.showToastMsg('Failed to restart', 'error')
      });
    }
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}