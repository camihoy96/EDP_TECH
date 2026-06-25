import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <div class="page-header">
        <h2>📊 Reports & Analytics</h2>
        <span class="header-sub">View system performance and ticket statistics</span>
      </div>

      <!-- Date Filter -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Period:</label>
          <select [(ngModel)]="selectedPeriod" (change)="loadReportData()" class="filter-select">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <button class="btn" (click)="loadReportData()">🔄 Refresh</button>
        <button class="btn" (click)="printReport()">🖨️ Print</button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">🎫</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.totalTickets }}</div>
            <div class="card-label">Total Tickets</div>
          </div>
        </div>
        <div class="summary-card open">
          <div class="card-icon">🔓</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.openTickets }}</div>
            <div class="card-label">Open Tickets</div>
          </div>
        </div>
        <div class="summary-card resolved">
          <div class="card-icon">✅</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.resolvedTickets }}</div>
            <div class="card-label">Resolved</div>
          </div>
        </div>
        <div class="summary-card critical">
          <div class="card-icon">🔥</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.criticalTickets }}</div>
            <div class="card-label">Critical</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">⏱️</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.avgResolutionTime }}</div>
            <div class="card-label">Avg Resolution Time</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">📈</div>
          <div class="card-info">
            <div class="card-value">{{ reportData.slaCompliance }}%</div>
            <div class="card-label">SLA Compliance</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Priority Distribution -->
        <div class="chart-card">
          <div class="chart-header">📊 Priority Distribution</div>
          <div class="chart-body">
            <div class="priority-bar" *ngFor="let p of priorityData">
              <div class="bar-label">
                <span class="priority-dot" [style.background]="p.color"></span>
                {{ p.label }}
              </div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="p.percentage" [style.background]="p.color"></div>
              </div>
              <div class="bar-value">{{ p.count }} ({{ p.percentage }}%)</div>
            </div>
          </div>
        </div>

        <!-- Status Distribution -->
        <div class="chart-card">
          <div class="chart-header">📋 Status Breakdown</div>
          <div class="chart-body">
            <div class="status-grid">
              <div class="status-item" *ngFor="let s of statusData">
                <div class="status-icon">{{ s.icon }}</div>
                <div class="status-count">{{ s.count }}</div>
                <div class="status-label">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Performance -->
      <div class="chart-card">
        <div class="chart-header">🏢 Department Performance</div>
        <div class="chart-body">
          <table class="data-table" *ngIf="departmentData.length > 0">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total</th>
                <th>Open</th>
                <th>Resolved</th>
                <th>Avg Resolution</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of departmentData">
                <td><strong>{{ d.name }}</strong></td>
                <td>{{ d.total }}</td>
                <td><span class="badge-open">{{ d.open }}</span></td>
                <td><span class="badge-resolved">{{ d.resolved }}</span></td>
                <td>{{ d.avgResolution || 'N/A' }}</td>
                <td>
                  <span [class.sla-good]="d.sla >= 90" [class.sla-warn]="d.sla >= 70 && d.sla < 90" [class.sla-bad]="d.sla < 70">
                    {{ d.sla }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="departmentData.length === 0">
            No department data available
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="chart-card">
        <div class="chart-header">🕐 Recent Ticket Activity</div>
        <div class="chart-body">
          <table class="data-table" *ngIf="recentTickets.length > 0">
            <thead>
              <tr>
                <th>Ticket Code</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Department</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of recentTickets.slice(0, 10)">
                <td><code>{{ t.ticket_number }}</code></td>
                <td>{{ t.title }}</td>
                <td><span class="priority-badge" [class]="t.priority">{{ t.priority }}</span></td>
                <td><span class="status-badge" [class]="'status-' + t.status">{{ t.status }}</span></td>
                <td>{{ t.department_name || 'N/A' }}</td>
                <td>{{ t.created_at | date:'MMM d, yyyy h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="recentTickets.length === 0">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 20px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
    }

    .page-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
    }
    .page-header h2 {
      margin: 0 0 4px 0;
      color: #0a246a;
      font-size: 20px;
    }
    .header-sub {
      color: #666;
      font-size: 12px;
    }

    .filter-bar {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 20px;
      padding: 12px;
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 6px;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-group label {
      font-weight: 600;
      font-size: 11px;
      color: #555;
    }
    .filter-select {
      padding: 6px 10px;
      border: 1px solid #c0c0c0;
      border-radius: 4px;
      font-size: 11px;
    }

    .btn {
      padding: 6px 14px;
      border: 1px solid #c0c0c0;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #f0f0f0; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-left: 4px solid #0a246a;
    }
    .summary-card.open { border-left-color: #0066cc; }
    .summary-card.resolved { border-left-color: #008800; }
    .summary-card.critical { border-left-color: #cc0000; }
    .card-icon { font-size: 28px; }
    .card-value { font-size: 22px; font-weight: 700; color: #333; }
    .card-label { font-size: 10px; color: #888; text-transform: uppercase; }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .chart-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .chart-header {
      padding: 12px 16px;
      background: #f0f4f8;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
      font-size: 13px;
      color: #0a246a;
    }
    .chart-body {
      padding: 16px;
    }

    .priority-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .bar-label {
      width: 70px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #000000;
      font-size: 11px;
      font-weight: 500;
    }
    .priority-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .bar-track {
      flex: 1;
      height: 10px;
      background: #f0f0f0;
      border-radius: 5px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
    }
    .bar-value {
      width: 80px;
      text-align: right;
      font-size: 10px;
      color: #888;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .status-item {
      text-align: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .status-icon { font-size: 24px; margin-bottom: 4px; }
    .status-count { font-size: 20px; font-weight: 700; color: #333; }
    .status-label { font-size: 10px; color: #888; text-transform: uppercase; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      background: #f0f4f8;
      padding: 8px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #000000;
      border-bottom: 2px solid #d0d0d0;
    }
    .data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 11px;
      color: #000000;
    }
    .data-table tr:hover td {
      background: #f8faff;
    }
    code {
      font-family: monospace;
      font-size: 10px;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .badge-open { color: #0066cc; font-weight: 600; }
    .badge-resolved { color: #008800; font-weight: 600; }

    .sla-good { color: #008800; font-weight: 700; }
    .sla-warn { color: #cc6600; font-weight: 700; }
    .sla-bad { color: #cc0000; font-weight: 700; }

    .priority-badge {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      text-transform: capitalize;
      font-weight: 600;
    }
    .priority-badge.critical { background: #ffecec; color: #cc0000; }
    .priority-badge.high { background: #fff0e8; color: #cc5500; }
    .priority-badge.medium { background: #fffae8; color: #886600; }
    .priority-badge.low { background: #eeffee; color: #006600; }

    .status-badge {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      text-transform: capitalize;
      font-weight: 600;
    }
    .status-new { background: #e8f0ff; color: #0066cc; }
    .status-assigned { background: #fff0e8; color: #cc5500; }
    .status-in_progress { background: #fffae8; color: #886600; }
    .status-resolved { background: #eeffee; color: #008800; }
    .status-closed { background: #f0f0f0; color: #888; }

    .empty-state {
      text-align: center;
      padding: 30px;
      color: #999;
    }

    @media (max-width: 768px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }
      .status-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  selectedPeriod = 'last7days';
  
  reportData = {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    criticalTickets: 0,
    avgResolutionTime: 'N/A',
    slaCompliance: 0
  };

  priorityData: any[] = [];
  statusData: any[] = [];
  departmentData: any[] = [];
  recentTickets: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadReportData();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadReportData() {
    const headers = this.getAuthHeaders();
    const params = { period: this.selectedPeriod };
    
    this.http.get<any>(`${environment.apiUrl}/api/reports`, { headers, params }).subscribe({
      next: (data) => {
        this.reportData = {
          totalTickets: data.totalTickets || 0,
          openTickets: data.openTickets || 0,
          resolvedTickets: data.resolvedTickets || 0,
          criticalTickets: data.criticalTickets || 0,
          avgResolutionTime: data.avgResolutionTime || 'N/A',
          slaCompliance: data.slaCompliance || 0
        };
        this.priorityData = data.priorityData || [];
        this.statusData = data.statusData || [];
        this.departmentData = data.departmentData || [];
        this.recentTickets = data.recentTickets || [];
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
      }
    });
  }

 // Replace the printReport method
printReport() {
  const periodLabels: Record<string, string> = {
    'today': 'Today',
    'yesterday': 'Yesterday', 
    'last7days': 'Last 7 Days',
    'last30days': 'Last 30 Days',
    'thisMonth': 'This Month',
    'lastMonth': 'Last Month',
    'all': 'All Time'
  };

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  
  if (!printWindow) {
    alert('Please allow popups for printing');
    return;
  }

  const periodLabel = periodLabels[this.selectedPeriod] || this.selectedPeriod;
  const now = new Date().toLocaleString();

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>EDPtech Helpdesk Report - ${periodLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 20px; 
          color: #333;
          font-size: 12px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #0a246a;
        }
        .print-header h1 {
          color: #0a246a;
          font-size: 20px;
          margin-bottom: 4px;
        }
        .print-header .subtitle {
          color: #666;
          font-size: 12px;
        }
        .print-header .meta {
          color: #888;
          font-size: 10px;
          margin-top: 4px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .summary-item {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          border-left: 4px solid #0a246a;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }
        .summary-item .label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          margin-top: 4px;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0a246a;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th {
          background: #f0f4f8;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #555;
          border: 1px solid #ddd;
        }
        td {
          padding: 7px 10px;
          border: 1px solid #eee;
          font-size: 11px;
        }
        tr:nth-child(even) td {
          background: #fafafa;
        }
        
        .badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }
        .badge-critical { background: #ffecec; color: #cc0000; }
        .badge-high { background: #fff0e8; color: #cc5500; }
        .badge-medium { background: #fffae8; color: #886600; }
        .badge-low { background: #eeffee; color: #006600; }
        .badge-open { color: #0066cc; font-weight: 700; }
        .badge-resolved { color: #008800; font-weight: 700; }
        
        .sla-good { color: #008800; font-weight: 700; }
        .sla-warn { color: #cc6600; font-weight: 700; }
        .sla-bad { color: #cc0000; font-weight: 700; }
        
        .priority-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .bar-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0;
        }
        .bar-label { width: 70px; font-size: 11px; }
        .bar-track {
          flex: 1; height: 8px;
          background: #f0f0f0; border-radius: 4px;
        }
        .bar-fill {
          height: 100%; border-radius: 4px;
        }
        .bar-pct { width: 50px; text-align: right; font-size: 10px; color: #888; }
        
        .print-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #888;
        }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>📊 EDPtech Helpdesk Report</h1>
        <div class="subtitle">Period: ${periodLabel}</div>
        <div class="meta">Generated: ${now} | EDPtech Helpdesk v2.0</div>
      </div>
      
      <!-- Summary -->
      <div class="section">
        <div class="section-title">📋 Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="value">${this.reportData.totalTickets}</div>
            <div class="label">Total Tickets</div>
          </div>
          <div class="summary-item">
            <div class="value">${this.reportData.openTickets}</div>
            <div class="label">Open</div>
          </div>
          <div class="summary-item">
            <div class="value">${this.reportData.resolvedTickets}</div>
            <div class="label">Resolved</div>
          </div>
          <div class="summary-item">
            <div class="value">${this.reportData.criticalTickets}</div>
            <div class="label">Critical</div>
          </div>
          <div class="summary-item">
            <div class="value">${this.reportData.avgResolutionTime}</div>
            <div class="label">Avg Resolution</div>
          </div>
          <div class="summary-item">
            <div class="value">${this.reportData.slaCompliance}%</div>
            <div class="label">SLA Compliance</div>
          </div>
        </div>
      </div>
      
      <!-- Priority Distribution -->
      <div class="section">
        <div class="section-title">📊 Priority Distribution</div>
        ${this.priorityData.map(p => `
          <div class="priority-bar">
            <div class="bar-dot" style="background:${p.color}"></div>
            <span class="bar-label">${p.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${p.percentage}%;background:${p.color}"></div>
            </div>
            <span class="bar-pct">${p.count} (${p.percentage}%)</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Status Breakdown -->
      <div class="section">
        <div class="section-title">📋 Status Breakdown</div>
        <table>
          <thead>
            <tr><th>Status</th><th>Count</th></tr>
          </thead>
          <tbody>
            ${this.statusData.map(s => `
              <tr><td>${s.icon} ${s.label}</td><td>${s.count}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Department Performance -->
      <div class="section">
        <div class="section-title">🏢 Department Performance</div>
        <table>
          <thead>
            <tr>
              <th>Department</th><th>Total</th><th>Open</th>
              <th>Resolved</th><th>Avg Resolution</th><th>SLA</th>
            </tr>
          </thead>
          <tbody>
            ${this.departmentData.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.total}</td>
                <td><span class="badge-open">${d.open}</span></td>
                <td><span class="badge-resolved">${d.resolved}</span></td>
                <td>${d.avgResolution || 'N/A'}</td>
                <td class="${d.sla >= 90 ? 'sla-good' : d.sla >= 70 ? 'sla-warn' : 'sla-bad'}">${d.sla}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Recent Tickets -->
      <div class="section">
        <div class="section-title">🕐 Recent Tickets</div>
        <table>
          <thead>
            <tr>
              <th>Ticket #</th><th>Title</th><th>Priority</th>
              <th>Status</th><th>Department</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${this.recentTickets.slice(0, 20).map(t => `
              <tr>
                <td><code>${t.ticket_number}</code></td>
                <td>${t.title}</td>
                <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
                <td>${t.status}</td>
                <td>${t.department_name || 'N/A'}</td>
                <td>${new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="print-footer">
        EDPtech Helpdesk v2.0 | Report Period: ${periodLabel} | Generated: ${now}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}
}