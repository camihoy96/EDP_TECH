import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="health-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>🩺 System Health</h2>
          <span class="header-sub">Real-time system performance monitoring</span>
        </div>
        <div class="header-actions">
          <label class="auto-refresh-label">
            <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
            Auto-refresh (30s)
          </label>
          <span class="last-updated" *ngIf="lastChecked">
            Updated: {{ lastChecked | date:'medium' }}
          </span>
        </div>
      </div>

      <!-- Overall Status Banner -->
      <div class="status-banner" [class.healthy]="systemStatus === 'healthy'" 
           [class.warning]="systemStatus === 'warning'" 
           [class.critical]="systemStatus === 'critical'">
        <div class="banner-left">
          <span class="status-icon">{{ statusIcon }}</span>
          <div>
            <div class="status-title">{{ statusTitle }}</div>
            <div class="status-desc">{{ statusDescription }}</div>
          </div>
        </div>
        <div class="banner-right">
          <span class="status-dot" [class.pulse]="systemStatus === 'healthy'"></span>
          <span>{{ systemStatus === 'healthy' ? 'Operational' : systemStatus === 'warning' ? 'Degraded' : 'Critical' }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-bar" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Checking system health...</span>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <!-- Uptime -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⏱️</span>
            <span class="metric-label">Uptime</span>
          </div>
          <div class="metric-value">{{ healthData.uptime || '—' }}</div>
          <div class="metric-sub">Since last restart</div>
        </div>

        <!-- Memory -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">🧠</span>
            <span class="metric-label">Memory</span>
            <span class="metric-badge" [class.warning]="(healthData.memory_percent || 0) > 70" 
                                        [class.critical]="(healthData.memory_percent || 0) > 90">
              {{ healthData.memory_percent || 0 }}%
            </span>
          </div>
          <div class="metric-value">{{ healthData.memory_usage || '—' }}</div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="healthData.memory_percent || 0" 
                 [class.warning]="(healthData.memory_percent || 0) > 70" 
                 [class.critical]="(healthData.memory_percent || 0) > 90"></div>
          </div>
        </div>

        <!-- Disk -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">💿</span>
            <span class="metric-label">Disk</span>
            <span class="metric-badge" [class.warning]="(healthData.disk_percent || 0) > 70" 
                                        [class.critical]="(healthData.disk_percent || 0) > 90">
              {{ healthData.disk_percent || 0 }}%
            </span>
          </div>
          <div class="metric-value">{{ healthData.disk_usage || '—' }}</div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="healthData.disk_percent || 0" 
                 [class.warning]="(healthData.disk_percent || 0) > 70" 
                 [class.critical]="(healthData.disk_percent || 0) > 90"></div>
          </div>
        </div>

        <!-- CPU -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⚡</span>
            <span class="metric-label">CPU</span>
            <span class="metric-badge" [class.warning]="(healthData.cpu_percent || 0) > 70" 
                                        [class.critical]="(healthData.cpu_percent || 0) > 90">
              {{ healthData.cpu_percent || 0 }}%
            </span>
          </div>
          <div class="metric-value">{{ healthData.cpu_usage || '—' }}</div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="healthData.cpu_percent || 0" 
                 [class.warning]="(healthData.cpu_percent || 0) > 70" 
                 [class.critical]="(healthData.cpu_percent || 0) > 90"></div>
          </div>
        </div>
      </div>

      <!-- Services & Database Row -->
      <div class="info-row">
        <!-- Services Status -->
        <div class="health-section">
          <h3>🔌 Services</h3>
          <div class="services-list">
            <div class="service-row" *ngFor="let service of services">
              <div class="service-indicator" [class.online]="service.status === 'online'" 
                                             [class.offline]="service.status === 'offline'"
                                             [class.warning]="service.status === 'degraded'"></div>
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-status">{{ service.status === 'online' ? 'Running' : service.status === 'degraded' ? 'Slow' : 'Stopped' }}</span>
              </div>
              <code class="service-port">{{ service.port || (service.name === 'Node.js API' ? ':' + getApiPort() : service.name === 'MySQL Database' ? ':' + getDbPort() : 'N/A') }}</code>
              <span class="service-latency" *ngIf="service.latency">{{ service.latency }}ms</span>
            </div>
          </div>
        </div>

        <!-- Database Info -->
        <div class="health-section">
          <h3>🗄️ Database</h3>
          <div class="db-list">
            <div class="db-row">
  <span class="db-label">Status</span>
  <span class="db-value">
    <span class="status-indicator" [class.online]="healthData.db_connections > 0" [style.background]="healthData.db_connections > 0 ? '#22c55e' : '#ef4444'"></span>
    {{ healthData.db_connections > 0 ? 'Connected' : 'Disconnected' }}
  </span>
</div>
            <div class="db-row"><span class="db-label">Host</span><span class="db-value">{{ healthData.db_host || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Database</span><span class="db-value">{{ healthData.db_name || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Tables</span><span class="db-value">{{ healthData.db_tables || 0 }}</span></div>
            <div class="db-row"><span class="db-label">Size</span><span class="db-value">{{ healthData.db_size || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Connections</span><span class="db-value">{{ healthData.db_connections || 0 }}</span></div>
          </div>
        </div>

        <!-- System Info -->
        <div class="health-section">
          <h3>💻 System</h3>
          <div class="db-list">
            <div class="db-row"><span class="db-label">Node.js</span><span class="db-value">{{ healthData.node_version || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Platform</span><span class="db-value">{{ healthData.platform || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Architecture</span><span class="db-value">{{ healthData.arch || '—' }}</span></div>
            <div class="db-row"><span class="db-label">CPU Cores</span><span class="db-value">{{ healthData.cpu_cores || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Total Memory</span><span class="db-value">{{ healthData.total_memory || '—' }}</span></div>
            <div class="db-row"><span class="db-label">Process ID</span><span class="db-value"><code>{{ healthData.pid || '—' }}</code></span></div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="action-bar">
        <button class="btn btn-primary" (click)="refreshHealth()" [disabled]="isLoading">
          {{ isLoading ? '⏳ Checking...' : '🔄 Refresh Now' }}
        </button>
        <button class="btn" (click)="showClearCacheModal()" [disabled]="isLoading">
          🗑️ Clear Cache
        </button>
        <button class="btn btn-danger" (click)="openRestartModal()" [disabled]="isLoading">
          🔄 Restart Services
        </button>
      </div>

      <!-- Toast -->
      <div class="toast" [class.show]="showToast" [class.success]="toastType==='success'" [class.error]="toastType==='error'">
        <span>{{ toastType === 'success' ? '✅' : '❌' }}</span>
        <span>{{ toastMessage }}</span>
        <button class="toast-close" (click)="showToast = false">✕</button>
      </div>
    </div>

    <!-- Clear Cache Modal - Draggable -->
    <div class="modal-overlay" *ngIf="showClearCache" (click)="cancelClearCache()">
      <div class="modal-dialog" (click)="$event.stopPropagation()" [style.left.px]="cacheModalPos.x" [style.top.px]="cacheModalPos.y">
        <div class="modal-header warning" (mousedown)="startDrag($event, 'cache')">
          <span>🗑️ Clear Application Cache</span>
          <button class="modal-close" (click)="cancelClearCache()" [disabled]="clearingCache">✕</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <div class="warning-message">
              <h3>Clear application cache?</h3>
              <p>This will remove all cached data including:</p>
              <ul class="affected-services">
  <li *ngFor="let svc of getAffectedServices()">{{ svc }}</li>
</ul>
              <p class="warning-text">This action cannot be undone.</p>
            </div>
          </div>
          <div class="restart-progress" *ngIf="clearingCache">
            <div class="spinner"></div>
            <p>Clearing cache... Please wait.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" (click)="cancelClearCache()" [disabled]="clearingCache">Cancel</button>
          <button class="btn btn-warning" (click)="confirmClearCache()" [disabled]="clearingCache">
            {{ clearingCache ? '⏳ Clearing...' : '🗑️ Clear Cache' }}
          </button>
        </div>
      </div>
    </div>

  <!-- Restart Modal - Draggable -->
<div class="modal-overlay" *ngIf="showRestartModal" (click)="cancelRestart()">
  <div class="modal-dialog" (click)="$event.stopPropagation()" [style.left.px]="restartModalPos.x" [style.top.px]="restartModalPos.y">
    <div class="modal-header danger" (mousedown)="startDrag($event, 'restart')">
      <span>🔄 Restart System Services</span>
      <button class="modal-close" (click)="cancelRestart()" [disabled]="restarting">✕</button>
    </div>
    <div class="modal-body">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-message">
          <h3>Restart all system services?</h3>
          <p>This action will temporarily interrupt the following services:</p>
          <!-- ✅ Dynamic affected services -->
          <ul class="affected-services">
            <li *ngFor="let svc of getAffectedServices()" [innerHTML]="svc"></li>
          </ul>
          <div class="warning-note">
            <span class="note-icon">⏱️</span>
            <span>Estimated downtime: <strong>10-30 seconds</strong>. Active users may experience brief interruptions.</span>
          </div>
          <p class="warning-text">Are you sure you want to continue?</p>
        </div>
      </div>
      <div class="restart-progress" *ngIf="restarting">
        <div class="spinner"></div>
        <p>Restarting services... Please wait.</p>
        <p class="progress-note">Do not close this window.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" (click)="cancelRestart()" [disabled]="restarting">Cancel</button>
      <button class="btn btn-danger" (click)="confirmRestart()" [disabled]="restarting">
        {{ restarting ? '⏳ Restarting...' : '🔄 Yes, Restart Services' }}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .health-container { padding: 20px; font-family: 'Segoe UI', sans-serif; font-size: 12px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0 0 4px 0; color: #0a246a; font-size: 20px; }
    .header-sub { color: #666; font-size: 11px; }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .auto-refresh-label { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #888; cursor: pointer; }
    .last-updated { font-size: 10px; color: #aaa; font-style: italic; }
    .status-banner { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 16px; color: white; }
    .status-banner.healthy { background: linear-gradient(135deg, #059669, #10b981); }
    .status-banner.warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .status-banner.critical { background: linear-gradient(135deg, #dc2626, #ef4444); }
    .banner-left { display: flex; align-items: center; gap: 12px; }
    .status-icon { font-size: 32px; }
    .status-title { font-size: 15px; font-weight: 700; }
    .status-desc { font-size: 11px; opacity: 0.9; margin-top: 2px; }
    .banner-right { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: white; }
    .status-dot.pulse { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); } }
    .loading-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #f0f4ff; border: 1px solid #c0d0f0; margin-bottom: 16px; font-size: 11px; color: #0a246a; }
    .spinner { width: 16px; height: 16px; border: 2px solid #c0d0f0; border-top-color: #0a246a; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .metric-card { background: white; border: 1px solid #e0e0e0; padding: 16px 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .metric-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .metric-icon { font-size: 18px; }
    .metric-label { font-size: 11px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.04em; flex: 1; }
    .metric-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; background: #dcfce7; color: #166534; }
    .metric-badge.warning { background: #fef3c7; color: #92400e; }
    .metric-badge.critical { background: #fee2e2; color: #991b1b; }
    .metric-value { font-size: 16px; font-weight: 700; color: #1a1d24; margin-bottom: 4px; }
    .metric-sub { font-size: 10px; color: #999; }
    .progress-bar { width: 100%; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 3px; background: #22c55e; transition: width 0.5s ease; }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.critical { background: #ef4444; }
    .info-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .health-section { background: white; border: 1px solid #e0e0e0; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .health-section h3 { margin: 0 0 14px 0; color: #0a246a; font-size: 13px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
    .services-list { display: flex; flex-direction: column; gap: 8px; }
    .service-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .service-row:last-child { border-bottom: none; }
    .service-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .service-indicator.online { background: #22c55e; }
    .service-indicator.offline { background: #ef4444; }
    .service-indicator.warning { background: #f59e0b; }
    .service-info { flex: 1; display: flex; flex-direction: column; }
    .service-name { font-size: 11px; font-weight: 600; color: #333; }
    .service-status { font-size: 10px; color: #888; }
    .service-port { font-size: 10px; background: #f5f5f5; padding: 2px 6px; color: #666; }
    .service-latency { font-size: 10px; color: #0a246a; font-weight: 600; }
    .db-list { display: flex; flex-direction: column; gap: 6px; }
    .db-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
    .db-row:last-child { border-bottom: none; }
    .db-label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600; }
    .db-value { font-size: 11px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 6px; }
    .status-indicator { width: 7px; height: 7px; border-radius: 50%; }
    .status-indicator.online { background: #22c55e; }
    code { font-family: monospace; font-size: 10px; background: #f5f5f5; padding: 2px 5px; }
    .action-bar { display: flex; gap: 8px; }
    .btn { padding: 8px 16px; border: 1px solid #d0d0d0; background: white; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.15s; }
    .btn:hover:not(:disabled) { background: #f5f5f5; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #0a246a; color: white; border-color: #0a246a; }
    .btn-primary:hover:not(:disabled) { background: #0d2f8a; }
    .btn-warning { background: #f59e0b; color: white; border-color: #f59e0b; }
    .btn-warning:hover:not(:disabled) { background: #d97706; }
    .btn-danger { background: #fff5f5; color: #dc2626; border-color: #fca5a5; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; color: white; }

    /* Modals - No border radius, draggable */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .modal-dialog { position: fixed; background: white; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-radius: 0; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; color: white; border-radius: 0; font-size: 13px; font-weight: 700; cursor: grab; user-select: none; }
    .modal-header:active { cursor: grabbing; }
    .modal-header.danger { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .modal-header.warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .modal-close { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: white; cursor: pointer; padding: 4px 10px; font-size: 14px; border-radius: 0; }
    .modal-close:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
    .modal-close:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-body { padding: 20px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0; }
    .warning-content { display: flex; gap: 14px; align-items: flex-start; }
    .warning-icon { font-size: 40px; flex-shrink: 0; }
    .warning-message h3 { margin: 0 0 8px 0; font-size: 15px; color: #1a1d24; }
    .warning-message p { margin: 0 0 8px 0; font-size: 12px; color: #555; line-height: 1.5; }
    .affected-services { list-style: none; padding: 0; margin: 0 0 12px 0; background: #f9fafb; padding: 10px 14px; }
    .affected-services li { padding: 4px 0; font-size: 11px; color: #333; }
    .warning-note { display: flex; gap: 8px; align-items: flex-start; background: #fef3c7; border: 1px solid #fcd34d; padding: 10px 12px; margin-bottom: 8px; }
    .note-icon { font-size: 16px; flex-shrink: 0; }
    .warning-note span { font-size: 11px; color: #92400e; line-height: 1.5; }
    .warning-text { font-weight: 600; color: #dc2626 !important; }
    .restart-progress { text-align: center; padding: 16px; margin-top: 12px; }
    .restart-progress .spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
    .restart-progress p { margin: 0; font-size: 12px; color: #555; }
    .progress-note { color: #dc2626 !important; font-size: 10px !important; margin-top: 6px !important; }
    .toast { position: fixed; bottom: 24px; right: 24px; background: #333; color: white; padding: 12px 18px; display: flex; align-items: center; gap: 8px; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 4000; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast.success { background: #059669; }
    .toast.error { background: #dc2626; }
    .toast-close { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; padding: 2px 6px; font-size: 12px; margin-left: 8px; }
    @media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr 1fr; } .info-row { grid-template-columns: 1fr; } }
  `]
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  systemStatus: string = 'healthy';
  isLoading = false;
  lastChecked: Date | null = null;
  healthData: any = {};
  autoRefresh = true;
 services: any[] = [];
  // Modal states
  showClearCache = false;
  clearingCache = false;
  showRestartModal = false;
  restarting = false;
  
  // Dragging properties
  cacheModalPos = { x: 0, y: 0 };
  restartModalPos = { x: 0, y: 0 };
  private isDragging = false;
  private dragType = '';
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private refreshSub: Subscription | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshHealth();
    this.refreshSub = interval(30000).subscribe(() => this.refreshHealth());
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  get statusIcon(): string {
    if (this.systemStatus === 'healthy') return '✅';
    if (this.systemStatus === 'warning') return '⚠️';
    return '🚨';
  }

  get statusTitle(): string {
    if (this.systemStatus === 'healthy') return 'All Systems Operational';
    if (this.systemStatus === 'warning') return 'Degraded Performance';
    return 'Critical Issues Detected';
  }

  get statusDescription(): string {
    if (this.systemStatus === 'healthy') return 'All services are running normally';
    if (this.systemStatus === 'warning') return 'Some services are experiencing issues';
    return 'Immediate attention required';
  }

  toggleAutoRefresh() {
    if (this.autoRefresh) {
      this.refreshSub = interval(30000).subscribe(() => this.refreshHealth());
    } else {
      if (this.refreshSub) this.refreshSub.unsubscribe();
    }
  }
refreshHealth() {
    this.isLoading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Check all services in parallel
    Promise.all([
        this.checkApiHealth(headers),
        this.checkDatabaseHealth(headers),
        this.checkFileStorage(headers)
    ]).then(([apiStatus, dbStatus, fileStatus]) => {
        this.services = [
            { name: 'Node.js API', status: apiStatus.status, port: ':' + this.getApiPort(), latency: apiStatus.latency },
            { name: 'MySQL Database', status: dbStatus.status, port: ':' + this.getDbPort(), latency: dbStatus.latency },
            { name: 'File Storage', status: fileStatus.status, port: 'N/A', latency: fileStatus.latency },
        ];
    });
    
    this.http.get<any>(`${environment.apiUrl}/api/admin/health`, { headers }).subscribe({
      next: (data) => {
        this.healthData = data || {};
        this.lastChecked = new Date();
        
        // ✅ Update API and DB ports from health data
        const apiPort = this.getApiPort();
        const dbPort = this.getDbPort();
        
        // Update service statuses from health data
        if (this.services.length > 0) {
            this.services[0].status = data?.api === 'online' ? 'online' : this.services[0].status;
            this.services[0].port = ':' + apiPort;
            this.services[1].status = data?.database === 'connected' ? 'online' : this.services[1].status;
            this.services[1].port = ':' + dbPort;
        } else {
            // Fallback if Promise hasn't resolved yet
            this.services = [
                { name: 'Node.js API', status: data?.api === 'online' ? 'online' : 'offline', port: ':' + apiPort, latency: null },
                { name: 'MySQL Database', status: data?.database === 'connected' ? 'online' : 'offline', port: ':' + dbPort, latency: null },
                { name: 'File Storage', status: 'online', port: 'N/A', latency: null },
            ];
        }
        
        const memoryPercent = data?.memory_percent || 0;
        const cpuPercent = data?.cpu_percent || 0;
        const diskPercent = data?.disk_percent || 0;
        
        if (memoryPercent > 90 || cpuPercent > 90 || diskPercent > 95) {
          this.systemStatus = 'critical';
        } else if (memoryPercent > 70 || cpuPercent > 70 || diskPercent > 80) {
          this.systemStatus = 'warning';
        } else {
          this.systemStatus = 'healthy';
        }
        
        this.isLoading = false;
      },
      error: () => {
        this.healthData = {};
        this.systemStatus = 'warning';
        const apiPort = this.getApiPort();
        const dbPort = this.getDbPort();
        if (this.services.length === 0) {
            this.services = [
                { name: 'Node.js API', status: 'offline', port: ':' + apiPort, latency: null },
                { name: 'MySQL Database', status: 'offline', port: ':' + dbPort, latency: null },
                { name: 'File Storage', status: 'offline', port: 'N/A', latency: null },
            ];
        }
        this.lastChecked = new Date();
        this.isLoading = false;
      }
    });
}

// Check API health with latency
private checkApiHealth(headers: any): Promise<{status: string, latency: number | null}> {
    const startTime = performance.now();
    return new Promise((resolve) => {
        this.http.get(`${environment.apiUrl}/api/admin/health/ping`, { headers }).subscribe({
            next: () => {
                const latency = Math.round(performance.now() - startTime);
                resolve({ status: 'online', latency });
            },
            error: () => {
                resolve({ status: 'offline', latency: null });
            }
        });
    });
}

// Check database health
private checkDatabaseHealth(headers: any): Promise<{status: string, latency: number | null}> {
    const startTime = performance.now();
    return new Promise((resolve) => {
        this.http.get(`${environment.apiUrl}/api/admin/health/db-check`, { headers }).subscribe({
            next: (res: any) => {
                const latency = Math.round(performance.now() - startTime);
                const status = res?.connected ? 'online' : 'offline';
                resolve({ status, latency });
            },
            error: () => {
                // If dedicated endpoint fails, fall back to checking the main health endpoint
                resolve({ status: 'offline', latency: null });
            }
        });
    });
}
getApiPort(): string {
    // Get port from environment or health data
    return this.healthData?.api_port || environment.apiUrl?.split(':')?.pop()?.replace('/', '') || '6001';
}

getDbPort(): string {
    return this.healthData?.db_port;
}
// Check file storage
private checkFileStorage(headers: any): Promise<{status: string, latency: number | null}> {
    const startTime = performance.now();
    return new Promise((resolve) => {
        this.http.get(`${environment.apiUrl}/api/admin/health/file-check`, { headers }).subscribe({
            next: (res: any) => {
                const latency = Math.round(performance.now() - startTime);
                resolve({ status: res?.writable ? 'online' : 'offline', latency });
            },
            error: () => {
                resolve({ status: 'unknown', latency: null });
            }
        });
    });
}
getAffectedServices(): string[] {
    return this.services.map(s => {
        const icons: Record<string, string> = {
            'Node.js API': '🔌',
            'MySQL Database': '🗄️',
            'File Storage': '📁'
        };
        return `${icons[s.name] || '⚙️'} ${s.name} - Port ${s.port || 'N/A'}`;
    });
}
  // ─── Dragging Methods ───
  startDrag(event: MouseEvent, type: string) {
    const target = event.currentTarget as HTMLElement;
    if (target.closest('.modal-close')) return;
    
    this.isDragging = true;
    this.dragType = type;
    const pos = type === 'cache' ? this.cacheModalPos : this.restartModalPos;
    this.dragOffsetX = event.clientX - pos.x;
    this.dragOffsetY = event.clientY - pos.y;
    event.preventDefault();
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    if (this.dragType === 'cache') {
      this.cacheModalPos.x = event.clientX - this.dragOffsetX;
      this.cacheModalPos.y = event.clientY - this.dragOffsetY;
    } else if (this.dragType === 'restart') {
      this.restartModalPos.x = event.clientX - this.dragOffsetX;
      this.restartModalPos.y = event.clientY - this.dragOffsetY;
    }
  }

  onDragEnd() {
    this.isDragging = false;
    this.dragType = '';
  }

  // ─── Clear Cache Modal ───
  showClearCacheModal() {
    this.cacheModalPos = { 
      x: Math.max(0, (window.innerWidth - 480) / 2), 
      y: Math.max(0, (window.innerHeight - 300) / 2) 
    };
    this.showClearCache = true;
  }

  cancelClearCache() {
    if (!this.clearingCache) this.showClearCache = false;
  }

  confirmClearCache() {
    this.clearingCache = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post(`${environment.apiUrl}/api/admin/clear-cache`, {}, { headers }).subscribe({
      next: () => {
        this.showClearCache = false;
        this.clearingCache = false;
        this.showToastMsg('✅ Cache cleared successfully!', 'success');
      },
      error: () => {
        this.showClearCache = false;
        this.clearingCache = false;
        this.showToastMsg('❌ Failed to clear cache', 'error');
      }
    });
  }

  // ─── Restart Modal ───
  openRestartModal() {  // ✅ Changed from showRestartModal() to openRestartModal()
    this.restartModalPos = { 
      x: Math.max(0, (window.innerWidth - 480) / 2), 
      y: Math.max(0, (window.innerHeight - 400) / 2) 
    };
    this.showRestartModal = true;
}

  cancelRestart() {
    if (!this.restarting) this.showRestartModal = false;
  }

  confirmRestart() {
    this.restarting = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post(`${environment.apiUrl}/api/admin/restart`, {}, { headers }).subscribe({
      next: () => {
        this.showRestartModal = false;
        this.restarting = false;
        this.showToastMsg('✅ Services restarting... Please wait.', 'success');
        setTimeout(() => this.refreshHealth(), 5000);
      },
      error: () => {
        this.showRestartModal = false;
        this.restarting = false;
        this.showToastMsg('❌ Failed to restart services', 'error');
      }
    });
  }

  showToastMsg(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg; this.toastType = type; this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast = false, 3000);
  }
}