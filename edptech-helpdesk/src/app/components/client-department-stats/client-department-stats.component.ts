import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

      <!-- Stats Content -->
      <div class="stats-content" *ngIf="!isLoading && stats">
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
          <div class="summary-card pending">
            <div class="summary-value">{{ stats.pending_tickets || 0 }}</div>
            <div class="summary-label">Pending</div>
          </div>
          <div class="summary-card critical">
            <div class="summary-value">{{ stats.critical_tickets || 0 }}</div>
            <div class="summary-label">Critical</div>
          </div>
          <div class="summary-card sla">
            <div class="summary-value">{{ stats.sla_compliance || 0 }}%</div>
            <div class="summary-label">SLA Compliance</div>
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
          <div class="chart-card">
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
              <span class="stat-label">Closed</span>
              <span class="stat-value">{{ stats.closed_tickets || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Requisitions Tab -->
        <div class="tab-content" *ngIf="activeTab === 'requisitions'">
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
              <span class="stat-label">Rejected</span>
              <span class="stat-value">{{ stats.rejected_requisitions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Forwarded</span>
              <span class="stat-value">{{ stats.forwarded_requisitions || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Job Orders Tab -->
        <div class="tab-content" *ngIf="activeTab === 'joborders'">
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
            <div class="stat-item">
              <span class="stat-label">Rejected</span>
              <span class="stat-value">{{ stats.rejected_job_orders || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Stats -->
      <div class="no-stats" *ngIf="!isLoading && !stats">
        <span>📭</span>
        <p>No statistics available for your department.</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
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
      padding: 6px 14px;
      cursor: pointer;
      font-size: 12px;
      border-radius: 4px;
    }

    .back-btn:hover {
      background: #e0e0e0;
    }

    .loading-state {
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

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 14px;
      text-align: center;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }

    .summary-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #888;
      margin-top: 4px;
      letter-spacing: 0.04em;
    }

    .summary-card.open .summary-value { color: #0ea5e9; }
    .summary-card.resolved .summary-value { color: #22c55e; }
    .summary-card.pending .summary-value { color: #f59e0b; }
    .summary-card.critical .summary-value { color: #ef4444; }
    .summary-card.sla .summary-value { color: #0a246a; }

    .info-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 16px;
      border-radius: 4px;
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
      border-radius: 4px 4px 0 0;
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
      border-radius: 4px;
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
      width: 65px;
      font-weight: 600;
      font-size: 12px;
      text-transform: capitalize;
    }

    .priority-label.critical { color: #cc0000; }
    .priority-label.high { color: #cc5500; }
    .priority-label.medium { color: #886600; }
    .priority-label.low { color: #006600; }

    .priority-count {
      width: 28px;
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
      border-radius: 4px;
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

    .no-stats {
      text-align: center;
      padding: 60px;
      color: #888;
    }

    .no-stats span {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
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
    }
  `]
})
export class ClientDepartmentStatsComponent implements OnInit {
  stats: DepartmentStats | null = null;
  isLoading = false;
  activeTab: 'tickets' | 'requisitions' | 'joborders' = 'tickets';
  priorityLevels = [
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadDepartmentStats();
  }

  loadDepartmentStats() {
    this.isLoading = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Get current user for department info
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const departmentId = currentUser.department_id;
    const branchId = currentUser.branch_id;

    // Fetch tickets
    this.http.get<any[]>(`${environment.apiUrl}/api/tickets/my`, { headers }).subscribe({
      next: (tickets) => {
        const ticketData = this.processTickets(tickets || []);

        // Fetch requisitions
        this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
          next: (requisitions) => {
            const reqData = this.processRequisitions(requisitions || []);

            // Fetch job orders
            this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
              next: (jobOrders) => {
                const joData = this.processJobOrders(jobOrders || []);

                // Combine all stats
                this.stats = {
                  department: currentUser.department || 'N/A',
                  department_id: departmentId,
                  branch_id: branchId,
                  branch_name: currentUser.branch_name || 'N/A',
                  ...ticketData,
                  ...reqData,
                  ...joData,
                  avg_resolution_time: this.calculateAvgResolutionTime(tickets || []),
                  sla_compliance: this.calculateSLACompliance(tickets || [])
                };
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
                this.setDefaultStats(currentUser);
              }
            });
          },
          error: () => {
            this.isLoading = false;
            this.setDefaultStats(currentUser);
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.setDefaultStats(currentUser);
      }
    });
  }

  processTickets(tickets: any[]): any {
    return {
      total_tickets: tickets.length,
      open_tickets: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
      resolved_tickets: tickets.filter(t => t.status === 'resolved').length,
      pending_tickets: tickets.filter(t => t.status === 'pending').length,
      new_tickets: tickets.filter(t => t.status === 'new').length,
      assigned_tickets: tickets.filter(t => t.status === 'assigned').length,
      in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length,
      closed_tickets: tickets.filter(t => t.status === 'closed').length,
      critical_tickets: tickets.filter(t => t.priority === 'critical').length,
      high_tickets: tickets.filter(t => t.priority === 'high').length,
      medium_tickets: tickets.filter(t => t.priority === 'medium').length,
      low_tickets: tickets.filter(t => t.priority === 'low').length,
    };
  }

  processRequisitions(requisitions: any[]): any {
    return {
      total_requisitions: requisitions.length,
      pending_requisitions: requisitions.filter(r => r.status === 'pending').length,
      approved_requisitions: requisitions.filter(r => r.status === 'approved').length,
      released_requisitions: requisitions.filter(r => r.status === 'released').length,
      rejected_requisitions: requisitions.filter(r => r.status === 'rejected').length,
      forwarded_requisitions: requisitions.filter(r => r.is_forwarded === 1).length,
    };
  }

  processJobOrders(jobOrders: any[]): any {
    return {
      total_job_orders: jobOrders.length,
      pending_job_orders: jobOrders.filter(j => j.status === 'pending').length,
      approved_job_orders: jobOrders.filter(j => j.status === 'approved').length,
      assigned_job_orders: jobOrders.filter(j => j.status === 'assigned').length,
      forwarded_job_orders: jobOrders.filter(j => j.status === 'forwarded' || j.is_forwarded === 1).length,
      done_job_orders: jobOrders.filter(j => j.status === 'done').length,
      rejected_job_orders: jobOrders.filter(j => j.status === 'rejected').length,
    };
  }

  calculateAvgResolutionTime(tickets: any[]): string {
    const resolved = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
    if (resolved.length === 0) return 'N/A';
    
    let totalHours = 0;
    resolved.forEach(t => {
      const created = new Date(t.created_at);
      const resolved = new Date(t.resolved_at);
      const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
    });
    
    const avgHours = totalHours / resolved.length;
    if (avgHours < 24) return `${Math.round(avgHours)} hours`;
    if (avgHours < 168) return `${Math.round(avgHours / 24)} days`;
    return `${(avgHours / 24).toFixed(1)} days`;
  }

  calculateSLACompliance(tickets: any[]): number {
    const resolved = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
    if (resolved.length === 0) return 0;
    
    let compliant = 0;
    resolved.forEach(t => {
      const created = new Date(t.created_at);
      const resolved = new Date(t.resolved_at);
      const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hours <= 24) compliant++;
    });
    
    return Math.round((compliant / resolved.length) * 100);
  }

  setDefaultStats(currentUser: any) {
    this.stats = {
      department: currentUser.department || 'N/A',
      department_id: currentUser.department_id || 0,
      branch_id: currentUser.branch_id || 0,
      branch_name: currentUser.branch_name || 'N/A',
      total_tickets: 0,
      open_tickets: 0,
      resolved_tickets: 0,
      pending_tickets: 0,
      new_tickets: 0,
      assigned_tickets: 0,
      in_progress_tickets: 0,
      closed_tickets: 0,
      critical_tickets: 0,
      high_tickets: 0,
      medium_tickets: 0,
      low_tickets: 0,
      total_requisitions: 0,
      pending_requisitions: 0,
      approved_requisitions: 0,
      released_requisitions: 0,
      rejected_requisitions: 0,
      forwarded_requisitions: 0,
      total_job_orders: 0,
      pending_job_orders: 0,
      approved_job_orders: 0,
      assigned_job_orders: 0,
      forwarded_job_orders: 0,
      done_job_orders: 0,
      rejected_job_orders: 0,
      avg_resolution_time: 'N/A',
      sla_compliance: 0
    };
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

  goBack() {
    this.router.navigate(['/client/dashboard']);
  }
}