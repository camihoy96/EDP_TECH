import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DepartmentStats {
  department: string;
  department_id: number;
  branch_id: number;
  branch_name: string;
  // Tickets
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  pending_tickets: number;
  new_tickets: number;
  assigned_tickets: number;
  in_progress_tickets: number;
  closed_tickets: number;
  critical_tickets: number;
  high_tickets: number;
  medium_tickets: number;
  low_tickets: number;
  // Requisitions
  total_requisitions: number;
  pending_requisitions: number;
  approved_requisitions: number;
  released_requisitions: number;
  rejected_requisitions: number;
  forwarded_requisitions: number;
  // Job Orders
  total_job_orders: number;
  pending_job_orders: number;
  approved_job_orders: number;
  assigned_job_orders: number;
  forwarded_job_orders: number;
  done_job_orders: number;
  rejected_job_orders: number;
  // Metrics
  avg_resolution_time: string;
  sla_compliance: number;
  // Weekly trends
  weekly_tickets: { day: string; count: number }[];
  weekly_resolved: { day: string; count: number }[];
  weekly_requisitions: { day: string; count: number }[];
  weekly_job_orders: { day: string; count: number }[];
}

@Component({
  selector: 'app-client-department-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stats-container">
      <div class="page-header">
        <div>
          <h2>📊 Department Statistics</h2>
          <p>View statistics for your department</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading department statistics...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!isLoading && error">
        <span>⚠️</span>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadDepartmentStats()">Retry</button>
      </div>

      <!-- Stats Content -->
      <div class="stats-content" *ngIf="!isLoading && !error && stats">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">{{ stats.total_tickets || 0 }}</div>
            <div class="summary-label">Total Tickets</div>
          </div>
          <div class="summary-card open">
            <div class="summary-value">{{ stats.open_tickets || 0 }}</div>
            <div class="summary-label">Open Tickets</div>
          </div>
          <div class="summary-card resolved">
            <div class="summary-value">{{ stats.resolved_tickets || 0 }}</div>
            <div class="summary-label">Resolved</div>
          </div>
          <div class="summary-card critical">
            <div class="summary-value">{{ stats.critical_tickets || 0 }}</div>
            <div class="summary-label">Critical</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ stats.total_requisitions || 0 }}</div>
            <div class="summary-label">Requisitions</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ stats.total_job_orders || 0 }}</div>
            <div class="summary-label">Job Orders</div>
          </div>
        </div>

        <!-- Department Info -->
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Department:</span>
            <span class="info-value">{{ stats.department || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Branch:</span>
            <span class="info-value">{{ stats.branch_name || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Avg Resolution Time:</span>
            <span class="info-value">{{ stats.avg_resolution_time || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">SLA Compliance:</span>
            <span class="info-value">{{ stats.sla_compliance || 0 }}%</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab === 'tickets'" (click)="activeTab = 'tickets'">
            🎫 Tickets
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'requisitions'" (click)="activeTab = 'requisitions'">
            📩 Requisitions
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'joborders'" (click)="activeTab = 'joborders'">
            📋 Job Orders
          </button>
        </div>

        <!-- Tickets Tab -->
        <div class="tab-content" *ngIf="activeTab === 'tickets'">
          <!-- Weekly Ticket Trend Chart -->
          <div class="chart-card">
            <h3>📈 Weekly Ticket Trend</h3>
            <div class="chart-container" *ngIf="hasWeeklyData(stats.weekly_tickets); else noTicketData">
              <div class="bar-chart">
                <div class="bar-item" *ngFor="let item of stats.weekly_tickets">
                  <div class="bar-value">{{ item.count }}</div>
                  <div class="bar-wrapper">
                    <div class="bar-fill" [style.height.%]="getMaxPercentage(item.count, stats.weekly_tickets)">
                    </div>
                  </div>
                  <span class="bar-label">{{ item.day }}</span>
                </div>
              </div>
            </div>
            <ng-template #noTicketData>
              <div class="no-data">No ticket data for this week</div>
            </ng-template>
          </div>

          <!-- Weekly Resolved Trend -->
          <div class="chart-card">
            <h3>✅ Weekly Resolved Trend</h3>
            <div class="chart-container" *ngIf="hasWeeklyData(stats.weekly_resolved); else noResolvedData">
              <div class="bar-chart">
                <div class="bar-item" *ngFor="let item of stats.weekly_resolved">
                  <div class="bar-value">{{ item.count }}</div>
                  <div class="bar-wrapper">
                    <div class="bar-fill resolved-bar" [style.height.%]="getMaxPercentage(item.count, stats.weekly_resolved)">
                    </div>
                  </div>
                  <span class="bar-label">{{ item.day }}</span>
                </div>
              </div>
            </div>
            <ng-template #noResolvedData>
              <div class="no-data">No resolved tickets this week</div>
            </ng-template>
          </div>

          <!-- Priority Distribution -->
          <div class="chart-card" *ngIf="stats.total_tickets > 0">
            <h3>Priority Distribution</h3>
            <div class="priority-bars">
              <div class="priority-row" *ngFor="let p of priorityLevels">
                <span class="priority-label" [class]="p.key">{{ p.label }}</span>
                <span class="priority-count">{{ getPriorityCount(p.key) }}</span>
                <div class="priority-track">
                  <div class="priority-fill" [class]="p.key"
                       [style.width.%]="stats.total_tickets > 0 ? (getPriorityCount(p.key) / stats.total_tickets * 100) : 0">
                  </div>
                </div>
                <span class="priority-percent">{{ stats.total_tickets > 0 ? ((getPriorityCount(p.key) / stats.total_tickets) * 100).toFixed(0) : 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- Ticket Status Grid -->
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">New</span>
              <span class="stat-value">{{ stats.new_tickets || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Assigned</span>
              <span class="stat-value">{{ stats.assigned_tickets || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">In Progress</span>
              <span class="stat-value">{{ stats.in_progress_tickets || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Pending</span>
              <span class="stat-value">{{ stats.pending_tickets || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Resolved</span>
              <span class="stat-value">{{ stats.resolved_tickets || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Closed</span>
              <span class="stat-value">{{ stats.closed_tickets || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Requisitions Tab -->
        <div class="tab-content" *ngIf="activeTab === 'requisitions'">
          <!-- Weekly Requisitions Trend -->
          <div class="chart-card">
            <h3>📈 Weekly Requisitions Trend</h3>
            <div class="chart-container" *ngIf="hasWeeklyData(stats.weekly_requisitions); else noReqData">
              <div class="bar-chart">
                <div class="bar-item" *ngFor="let item of stats.weekly_requisitions">
                  <div class="bar-value">{{ item.count }}</div>
                  <div class="bar-wrapper">
                    <div class="bar-fill req-bar" [style.height.%]="getMaxPercentage(item.count, stats.weekly_requisitions)">
                    </div>
                  </div>
                  <span class="bar-label">{{ item.day }}</span>
                </div>
              </div>
            </div>
            <ng-template #noReqData>
              <div class="no-data">No requisition data for this week</div>
            </ng-template>
          </div>

          <!-- Requisition Status Distribution -->
          <div class="chart-card" *ngIf="stats.total_requisitions > 0">
            <h3>📊 Requisition Status Distribution</h3>
            <div class="priority-bars">
              <div class="priority-row" *ngFor="let req of requisitionStatuses">
                <span class="priority-label" [style.color]="req.color">{{ req.label }}</span>
                <span class="priority-count">{{ getRequisitionCount(req.key) }}</span>
                <div class="priority-track">
                  <div class="priority-fill" [style.background]="req.color"
                       [style.width.%]="stats.total_requisitions > 0 ? (getRequisitionCount(req.key) / stats.total_requisitions * 100) : 0">
                  </div>
                </div>
                <span class="priority-percent">{{ stats.total_requisitions > 0 ? ((getRequisitionCount(req.key) / stats.total_requisitions) * 100).toFixed(0) : 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- Requisition Stats Grid -->
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ stats.total_requisitions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Pending</span>
              <span class="stat-value">{{ stats.pending_requisitions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Approved</span>
              <span class="stat-value">{{ stats.approved_requisitions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Released</span>
              <span class="stat-value">{{ stats.released_requisitions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Forwarded</span>
              <span class="stat-value">{{ stats.forwarded_requisitions || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Job Orders Tab -->
        <div class="tab-content" *ngIf="activeTab === 'joborders'">
          <!-- Weekly Job Orders Trend -->
          <div class="chart-card">
            <h3>📈 Weekly Job Orders Trend</h3>
            <div class="chart-container" *ngIf="hasWeeklyData(stats.weekly_job_orders); else noJOData">
              <div class="bar-chart">
                <div class="bar-item" *ngFor="let item of stats.weekly_job_orders">
                  <div class="bar-value">{{ item.count }}</div>
                  <div class="bar-wrapper">
                    <div class="bar-fill jo-bar" [style.height.%]="getMaxPercentage(item.count, stats.weekly_job_orders)">
                    </div>
                  </div>
                  <span class="bar-label">{{ item.day }}</span>
                </div>
              </div>
            </div>
            <ng-template #noJOData>
              <div class="no-data">No job order data for this week</div>
            </ng-template>
          </div>

          <!-- Job Order Status Distribution -->
          <div class="chart-card" *ngIf="stats.total_job_orders > 0">
            <h3>📊 Job Order Status Distribution</h3>
            <div class="priority-bars">
              <div class="priority-row" *ngFor="let jo of jobOrderStatuses">
                <span class="priority-label" [style.color]="jo.color">{{ jo.label }}</span>
                <span class="priority-count">{{ getJobOrderCount(jo.key) }}</span>
                <div class="priority-track">
                  <div class="priority-fill" [style.background]="jo.color"
                       [style.width.%]="stats.total_job_orders > 0 ? (getJobOrderCount(jo.key) / stats.total_job_orders * 100) : 0">
                  </div>
                </div>
                <span class="priority-percent">{{ stats.total_job_orders > 0 ? ((getJobOrderCount(jo.key) / stats.total_job_orders) * 100).toFixed(0) : 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- Job Order Stats Grid -->
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ stats.total_job_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Pending</span>
              <span class="stat-value">{{ stats.pending_job_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Approved/Received</span>
              <span class="stat-value">{{ stats.approved_job_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Assigned</span>
              <span class="stat-value">{{ stats.assigned_job_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Forwarded</span>
              <span class="stat-value">{{ stats.forwarded_job_orders || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Done</span>
              <span class="stat-value">{{ stats.done_job_orders || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Stats -->
      <div class="no-stats" *ngIf="!isLoading && !error && !stats">
        <span>📭</span>
        <p>No statistics available for your department.</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
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

    .back-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      padding: 8px 18px;
      cursor: pointer;
      font-size: 13px;
      border-radius: 4px;
      font-weight: 500;
    }

    .back-btn:hover {
      background: #e0e0e0;
    }

    .loading-state, .error-state, .no-stats {
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

    .error-state span, .no-stats span {
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

    .no-data {
      text-align: center;
      color: #999;
      padding: 20px;
      font-size: 13px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      text-align: center;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }

    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #888;
      margin-top: 4px;
      letter-spacing: 0.04em;
    }

    .summary-card.open .summary-value { color: #0ea5e9; }
    .summary-card.resolved .summary-value { color: #22c55e; }
    .summary-card.critical .summary-value { color: #ef4444; }

    .info-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-label {
      font-weight: 600;
      color: #555;
      font-size: 12px;
    }

    .info-value {
      color: #0f172a;
      font-weight: 500;
      font-size: 13px;
    }

    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
      border-radius: 6px 6px 0 0;
      overflow: hidden;
    }

    .tab-btn {
      padding: 10px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: #888;
      transition: all 0.15s;
      border-bottom: 3px solid transparent;
    }

    .tab-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .tab-btn.active {
      color: #0a246a;
      border-bottom-color: #0a246a;
      background: white;
    }

    .tab-content {
      margin-bottom: 20px;
    }

    .chart-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .chart-card h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #0f172a;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .chart-container {
      padding: 10px 0;
    }

    .bar-chart {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 150px;
      padding: 0 10px;
      gap: 8px;
    }

    .bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
    }

    .bar-value {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .bar-wrapper {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-height: 100px;
    }

    .bar-fill {
      width: 60%;
      min-height: 4px;
      background: linear-gradient(180deg, #4f46e5, #818cf8);
      border-radius: 3px 3px 0 0;
      transition: height 0.6s ease;
    }

    .bar-fill.resolved-bar {
      background: linear-gradient(180deg, #22c55e, #4ade80);
    }

    .bar-fill.req-bar {
      background: linear-gradient(180deg, #f59e0b, #fbbf24);
    }

    .bar-fill.jo-bar {
      background: linear-gradient(180deg, #8b5cf6, #a78bfa);
    }

    .bar-label {
      font-size: 9px;
      color: #888;
      margin-top: 6px;
      font-weight: 600;
    }

    .priority-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .priority-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .priority-label {
      width: 80px;
      font-weight: 600;
      font-size: 12px;
      text-transform: capitalize;
    }

    .priority-label.critical { color: #cc0000; }
    .priority-label.high { color: #cc5500; }
    .priority-label.medium { color: #886600; }
    .priority-label.low { color: #006600; }

    .priority-count {
      width: 30px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
      color: #0f172a;
    }

    .priority-track {
      flex: 1;
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .priority-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .priority-fill.critical { background: #cc0000; }
    .priority-fill.high { background: #ff6600; }
    .priority-fill.medium { background: #ffaa00; }
    .priority-fill.low { background: #008800; }

    .priority-percent {
      width: 40px;
      text-align: right;
      font-size: 11px;
      color: #888;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }

    .stat-item {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 14px;
      text-align: center;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .stat-item .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #888;
      display: block;
      margin-bottom: 4px;
      letter-spacing: 0.04em;
    }

    .stat-item .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }

    .no-stats p {
      font-size: 14px;
      margin: 0;
    }

    @media (max-width: 600px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .info-card {
        flex-direction: column;
        gap: 8px;
      }

      .tabs {
        overflow-x: auto;
      }

      .tab-btn {
        padding: 8px 14px;
        font-size: 12px;
        white-space: nowrap;
      }

      .bar-chart {
        height: 120px;
        padding: 0 4px;
        gap: 4px;
      }

      .bar-wrapper {
        min-height: 80px;
      }

      .bar-fill {
        width: 70%;
      }

      .bar-label {
        font-size: 8px;
      }
    }
  `]
})
export class ClientDepartmentStatsComponent implements OnInit {
  stats: DepartmentStats | null = null;
  isLoading = false;
  error: string | null = null;
  activeTab: 'tickets' | 'requisitions' | 'joborders' = 'tickets';
  
  priorityLevels = [
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' }
  ];

  requisitionStatuses = [
    { key: 'pending', label: 'Pending', color: '#f59e0b' },
    { key: 'approved', label: 'Approved', color: '#22c55e' },
    { key: 'released', label: 'Released', color: '#0ea5e9' },
    { key: 'forwarded', label: 'Forwarded', color: '#8b5cf6' }
  ];

  jobOrderStatuses = [
    { key: 'pending', label: 'Pending', color: '#f59e0b' },
    { key: 'approved', label: 'Received', color: '#22c55e' },
    { key: 'assigned', label: 'Assigned', color: '#4f46e5' },
    { key: 'forwarded', label: 'Forwarded', color: '#8b5cf6' },
    { key: 'done', label: 'Done', color: '#0ea5e9' }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadDepartmentStats();
  }

  loadDepartmentStats() {
    this.isLoading = true;
    this.error = null;
    this.stats = null;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      this.error = 'No authentication token found. Please log in again.';
      this.isLoading = false;
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // Single API call to backend
    this.http.get<DepartmentStats>(`${environment.apiUrl}/api/department-stats`, { headers })
      .subscribe({
        next: (data) => {
          console.log('✅ Department stats loaded successfully:', data);
          this.stats = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading department stats:', err);
          
          // More specific error messages based on status code
          if (err.status === 401) {
            this.error = 'Session expired. Please log in again.';
          } else if (err.status === 403) {
            this.error = 'You do not have permission to view these statistics.';
          } else if (err.status === 404) {
            this.error = 'Department not found. Please contact your administrator.';
          } else if (err.status === 500) {
            this.error = 'Server error. Please try again later.';
          } else if (err.status === 0) {
            this.error = 'Cannot connect to server. Please check your connection.';
          } else {
            this.error = `Failed to load statistics (Error: ${err.status}). Please try again.`;
          }
          
          this.isLoading = false;
        }
      });
  }

  hasWeeklyData(items: { day: string; count: number }[]): boolean {
    return items && items.some(item => item.count > 0);
  }

  getMaxPercentage(count: number, items: { day: string; count: number }[]): number {
    if (!items || items.length === 0) return 0;
    const max = Math.max(...items.map(i => i.count), 1);
    return Math.max((count / max) * 100, 5);
  }

  getPriorityCount(priority: string): number {
    if (!this.stats) return 0;
    const map: Record<string, number> = {
      critical: this.stats.critical_tickets || 0,
      high: this.stats.high_tickets || 0,
      medium: this.stats.medium_tickets || 0,
      low: this.stats.low_tickets || 0
    };
    return map[priority] || 0;
  }

  getRequisitionCount(status: string): number {
    if (!this.stats) return 0;
    const map: Record<string, number> = {
      pending: this.stats.pending_requisitions || 0,
      approved: this.stats.approved_requisitions || 0,
      released: this.stats.released_requisitions || 0,
      rejected: this.stats.rejected_requisitions || 0,
      forwarded: this.stats.forwarded_requisitions || 0
    };
    return map[status] || 0;
  }

  getJobOrderCount(status: string): number {
    if (!this.stats) return 0;
    const map: Record<string, number> = {
      pending: this.stats.pending_job_orders || 0,
      approved: this.stats.approved_job_orders || 0,
      assigned: this.stats.assigned_job_orders || 0,
      forwarded: this.stats.forwarded_job_orders || 0,
      done: this.stats.done_job_orders || 0,
      rejected: this.stats.rejected_job_orders || 0
    };
    return map[status] || 0;
  }

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }
}