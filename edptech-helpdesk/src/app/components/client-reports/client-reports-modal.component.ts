import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ReportData {
  period: string;
  branch_name: string;
  department_name: string;
  scope: 'branch' | 'department';
  tickets: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
    byPriority: { critical: number; high: number; medium: number; low: number };
    byStatus: { new: number; assigned: number; in_progress: number; pending: number; resolved: number; closed: number };
    byDepartment: { name: string; count: number }[];
    avgResolutionTime: string;
    slaCompliance: number;
    list: TicketItem[];
  };
  requisitions: {
    total: number;
    pending: number;
    approved: number;
    processing: number;
    released: number;
    rejected: number;
    forwarded: number;
    byDepartment: { name: string; count: number }[];
    list: RequisitionItem[];
  };
  jobOrders: {
    total: number;
    pending: number;
    approved: number;
    assigned: number;
    forwarded: number;
    done: number;
    byDepartment: { name: string; count: number }[];
    list: JobOrderItem[];
  };
  summary: {
    totalRequests: number;
    completedRequests: number;
    completionRate: number;
    departments: number;
  };
  generatedAt: string;
}

interface TicketItem {
  id: number;
  ticket_number: string;
  title: string;
  priority: string;
  status: string;
  department_name: string;
  created_by_name: string;
  created_at: string;
  resolved_at: string | null;
}

interface RequisitionItem {
  id: number;
  requisition_number: string;
  request_from: string;
  department_name: string;
  status: string;
  date: string;
  prepared_name: string;
  is_forwarded: boolean;
}

interface JobOrderItem {
  id: number;
  job_order_number: string;
  job_order_for: string;
  department_name: string;
  status: string;
  date: string;
  requested_name: string;
  is_forwarded: boolean;
}

@Component({
  selector: 'app-client-reports-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Overlay -->
    <div class="modal-overlay" (click)="closeOnOverlay($event)">
      <!-- Draggable Modal -->
      <div class="report-modal" 
           [style.left.px]="modalX" 
           [style.top.px]="modalY">
        
        <!-- Modal Header (Drag Handle) -->
        <div class="report-modal-header" (mousedown)="startDrag($event)">
          <div class="header-left">
            <h3>{{ getReportTitle() }}</h3>
            <span class="scope-badge" [class.branch]="isBranchManager" [class.dept]="!isBranchManager">
              {{ isBranchManager ? '🏢 Entire Branch' : '📂 ' + userDepartment }}
            </span>
          </div>
          <div class="header-right">
            <span class="branch-name" *ngIf="userBranch">🏢 {{ userBranch }}</span>
            <button class="btn-close" (click)="close()">✕</button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="report-modal-body">
          <!-- Loading -->
          <div class="loading-state" *ngIf="isLoading">
            <div class="spinner"></div>
            <p>Generating {{ reportType }} report...</p>
          </div>

          <!-- Error -->
          <div class="error-state" *ngIf="error">
            <span>⚠️</span>
            <p>{{ error }}</p>
            <button class="btn-retry" (click)="loadReport()">🔄 Retry</button>
          </div>

          <!-- Report Content -->
          <div class="report-content" *ngIf="!isLoading && !error && reportData">
            
            <!-- Summary Cards -->
            <div class="summary-row">
              <div class="summary-card">
                <div class="summary-value">{{ reportData.summary.totalRequests }}</div>
                <div class="summary-label">Total Requests</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">{{ reportData.summary.completedRequests }}</div>
                <div class="summary-label">Completed</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">{{ reportData.summary.completionRate }}%</div>
                <div class="summary-label">Completion Rate</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">{{ reportData.summary.departments }}</div>
                <div class="summary-label">{{ isBranchManager ? 'Departments' : 'Categories' }}</div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
              <button class="tab-btn" [class.active]="activeTab === 'tickets'" (click)="activeTab = 'tickets'">
                🎫 Tickets ({{ reportData.tickets.total }})
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'requisitions'" (click)="activeTab = 'requisitions'">
                📩 Requisitions ({{ reportData.requisitions.total }})
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'jobOrders'" (click)="activeTab = 'jobOrders'">
                📋 Job Orders ({{ reportData.jobOrders.total }})
              </button>
            </div>

            <!-- Tickets Tab -->
            <div class="tab-content" *ngIf="activeTab === 'tickets'">
              <!-- Stats -->
              <div class="stats-grid">
                <div class="stat-item clickable" [class.active]="ticketFilter === 'all'" (click)="ticketFilter = 'all'">
                  <span class="stat-value">{{ reportData.tickets.total }}</span>
                  <span class="stat-label">All</span>
                </div>
                <div class="stat-item open clickable" [class.active]="ticketFilter === 'open'" (click)="ticketFilter = 'open'">
                  <span class="stat-value">{{ reportData.tickets.open }}</span>
                  <span class="stat-label">Open</span>
                </div>
                <div class="stat-item clickable" [class.active]="ticketFilter === 'new'" (click)="ticketFilter = 'new'">
                  <span class="stat-value">{{ reportData.tickets.byStatus.new }}</span>
                  <span class="stat-label">New</span>
                </div>
                <div class="stat-item clickable" [class.active]="ticketFilter === 'assigned'" (click)="ticketFilter = 'assigned'">
                  <span class="stat-value">{{ reportData.tickets.byStatus.assigned }}</span>
                  <span class="stat-label">Assigned</span>
                </div>
                <div class="stat-item clickable" [class.active]="ticketFilter === 'in_progress'" (click)="ticketFilter = 'in_progress'">
                  <span class="stat-value">{{ reportData.tickets.byStatus.in_progress }}</span>
                  <span class="stat-label">In Progress</span>
                </div>
                <div class="stat-item clickable" [class.active]="ticketFilter === 'pending'" (click)="ticketFilter = 'pending'">
                  <span class="stat-value">{{ reportData.tickets.byStatus.pending }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item resolved clickable" [class.active]="ticketFilter === 'resolved'" (click)="ticketFilter = 'resolved'">
                  <span class="stat-value">{{ reportData.tickets.resolved }}</span>
                  <span class="stat-label">Resolved</span>
                </div>
                <div class="stat-item closed clickable" [class.active]="ticketFilter === 'closed'" (click)="ticketFilter = 'closed'">
                  <span class="stat-value">{{ reportData.tickets.closed }}</span>
                  <span class="stat-label">Closed</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.tickets.avgResolutionTime }}</span>
                  <span class="stat-label">Avg Time</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" [class.good]="reportData.tickets.slaCompliance >= 90" 
                                             [class.warning]="reportData.tickets.slaCompliance >= 70 && reportData.tickets.slaCompliance < 90"
                                             [class.bad]="reportData.tickets.slaCompliance < 70">
                    {{ reportData.tickets.slaCompliance }}%
                  </span>
                  <span class="stat-label">SLA</span>
                </div>
              </div>

              <!-- Priority Bars -->
              <div class="sub-section">
                <h5>By Priority</h5>
                <div class="bar-row">
                  <span class="bar-label critical">Critical</span>
                  <span class="bar-count">{{ reportData.tickets.byPriority.critical }}</span>
                  <div class="bar-track">
                    <div class="bar-fill critical" [style.width.%]="getPercent(reportData.tickets.byPriority.critical, reportData.tickets.total)"></div>
                  </div>
                </div>
                <div class="bar-row">
                  <span class="bar-label high">High</span>
                  <span class="bar-count">{{ reportData.tickets.byPriority.high }}</span>
                  <div class="bar-track">
                    <div class="bar-fill high" [style.width.%]="getPercent(reportData.tickets.byPriority.high, reportData.tickets.total)"></div>
                  </div>
                </div>
                <div class="bar-row">
                  <span class="bar-label medium">Medium</span>
                  <span class="bar-count">{{ reportData.tickets.byPriority.medium }}</span>
                  <div class="bar-track">
                    <div class="bar-fill medium" [style.width.%]="getPercent(reportData.tickets.byPriority.medium, reportData.tickets.total)"></div>
                  </div>
                </div>
                <div class="bar-row">
                  <span class="bar-label low">Low</span>
                  <span class="bar-count">{{ reportData.tickets.byPriority.low }}</span>
                  <div class="bar-track">
                    <div class="bar-fill low" [style.width.%]="getPercent(reportData.tickets.byPriority.low, reportData.tickets.total)"></div>
                  </div>
                </div>
              </div>

              <!-- Department Breakdown (Branch Manager only) -->
              <div class="sub-section" *ngIf="isBranchManager && reportData.tickets.byDepartment.length > 0">
                <h5>By Department</h5>
                <div class="dept-list">
                  <div class="dept-item" *ngFor="let dept of reportData.tickets.byDepartment">
                    <span class="dept-name">{{ dept.name }}</span>
                    <span class="dept-count">{{ dept.count }} tickets</span>
                    <div class="dept-track">
                      <div class="dept-fill" [style.width.%]="getPercent(dept.count, reportData.tickets.total)"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ticket Table -->
              <div class="table-section">
                <div class="table-header">
                  <h5>{{ getTicketTableTitle() }}</h5>
                  <span class="table-count">{{ filteredTickets.length }} records</span>
                </div>
                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Ticket #</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th *ngIf="isBranchManager">Department</th>
                        <th>Created By</th>
                        <th>Created</th>
                        <th>Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let ticket of filteredTickets">
                        <td class="ticket-number">{{ ticket.ticket_number }}</td>
                        <td class="ticket-title">{{ ticket.title }}</td>
                        <td>
                          <span class="priority-badge" [class]="ticket.priority">{{ ticket.priority }}</span>
                        </td>
                        <td>
                          <span class="status-badge" [class]="ticket.status">{{ formatStatus(ticket.status) }}</span>
                        </td>
                        <td *ngIf="isBranchManager">{{ ticket.department_name }}</td>
                        <td>{{ ticket.created_by_name }}</td>
                        <td>{{ ticket.created_at | date:'short' }}</td>
                        <td>{{ ticket.resolved_at ? (ticket.resolved_at | date:'short') : '-' }}</td>
                      </tr>
                      <tr *ngIf="filteredTickets.length === 0">
                        <td [attr.colspan]="isBranchManager ? 8 : 7" class="no-data">No tickets found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Requisitions Tab -->
            <div class="tab-content" *ngIf="activeTab === 'requisitions'">
              <!-- Stats -->
              <div class="stats-grid">
                <div class="stat-item clickable" [class.active]="reqFilter === 'all'" (click)="reqFilter = 'all'">
                  <span class="stat-value">{{ reportData.requisitions.total }}</span>
                  <span class="stat-label">All</span>
                </div>
                <div class="stat-item pending clickable" [class.active]="reqFilter === 'pending'" (click)="reqFilter = 'pending'">
                  <span class="stat-value">{{ reportData.requisitions.pending }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item approved clickable" [class.active]="reqFilter === 'approved'" (click)="reqFilter = 'approved'">
                  <span class="stat-value">{{ reportData.requisitions.approved }}</span>
                  <span class="stat-label">Approved</span>
                </div>
                <div class="stat-item processing clickable" [class.active]="reqFilter === 'processing'" (click)="reqFilter = 'processing'">
                  <span class="stat-value">{{ reportData.requisitions.processing }}</span>
                  <span class="stat-label">Processing</span>
                </div>
                <div class="stat-item released clickable" [class.active]="reqFilter === 'released'" (click)="reqFilter = 'released'">
                  <span class="stat-value">{{ reportData.requisitions.released }}</span>
                  <span class="stat-label">Released</span>
                </div>
                <div class="stat-item forwarded clickable" [class.active]="reqFilter === 'forwarded'" (click)="reqFilter = 'forwarded'">
                  <span class="stat-value">{{ reportData.requisitions.forwarded }}</span>
                  <span class="stat-label">Forwarded</span>
                </div>
                <div class="stat-item clickable" [class.active]="reqFilter === 'rejected'" (click)="reqFilter = 'rejected'">
                  <span class="stat-value">{{ reportData.requisitions.rejected }}</span>
                  <span class="stat-label">Rejected</span>
                </div>
              </div>

              <!-- Requisition Table -->
              <div class="table-section">
                <div class="table-header">
                  <h5>{{ getReqTableTitle() }}</h5>
                  <span class="table-count">{{ filteredRequisitions.length }} records</span>
                </div>
                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Req #</th>
                        <th>Request From</th>
                        <th *ngIf="isBranchManager">Department</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Prepared By</th>
                        <th>Forwarded</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let req of filteredRequisitions">
                        <td class="ticket-number">{{ req.requisition_number }}</td>
                        <td>{{ req.request_from }}</td>
                        <td *ngIf="isBranchManager">{{ req.department_name }}</td>
                        <td>
                          <span class="status-badge" [class]="req.status">{{ formatStatus(req.status) }}</span>
                        </td>
                        <td>{{ req.date | date:'shortDate' }}</td>
                        <td>{{ req.prepared_name }}</td>
                        <td>
                          <span *ngIf="req.is_forwarded" class="forwarded-badge">Yes</span>
                          <span *ngIf="!req.is_forwarded">No</span>
                        </td>
                      </tr>
                      <tr *ngIf="filteredRequisitions.length === 0">
                        <td [attr.colspan]="isBranchManager ? 7 : 6" class="no-data">No requisitions found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Job Orders Tab -->
            <div class="tab-content" *ngIf="activeTab === 'jobOrders'">
              <!-- Stats -->
              <div class="stats-grid">
                <div class="stat-item clickable" [class.active]="joFilter === 'all'" (click)="joFilter = 'all'">
                  <span class="stat-value">{{ reportData.jobOrders.total }}</span>
                  <span class="stat-label">All</span>
                </div>
                <div class="stat-item pending clickable" [class.active]="joFilter === 'pending'" (click)="joFilter = 'pending'">
                  <span class="stat-value">{{ reportData.jobOrders.pending }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item approved clickable" [class.active]="joFilter === 'received'" (click)="joFilter = 'received'">
                  <span class="stat-value">{{ reportData.jobOrders.approved }}</span>
                  <span class="stat-label">Received</span>
                </div>
                <div class="stat-item assigned clickable" [class.active]="joFilter === 'assigned'" (click)="joFilter = 'assigned'">
                  <span class="stat-value">{{ reportData.jobOrders.assigned }}</span>
                  <span class="stat-label">Assigned</span>
                </div>
                <div class="stat-item forwarded clickable" [class.active]="joFilter === 'forwarded'" (click)="joFilter = 'forwarded'">
                  <span class="stat-value">{{ reportData.jobOrders.forwarded }}</span>
                  <span class="stat-label">Forwarded</span>
                </div>
                <div class="stat-item done clickable" [class.active]="joFilter === 'done'" (click)="joFilter = 'done'">
                  <span class="stat-value">{{ reportData.jobOrders.done }}</span>
                  <span class="stat-label">Done</span>
                </div>
              </div>

              <!-- Job Order Table -->
              <div class="table-section">
                <div class="table-header">
                  <h5>{{ getJOTableTitle() }}</h5>
                  <span class="table-count">{{ filteredJobOrders.length }} records</span>
                </div>
                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>JO #</th>
                        <th>Job For</th>
                        <th *ngIf="isBranchManager">Department</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Requested By</th>
                        <th>Forwarded</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let jo of filteredJobOrders">
                        <td class="ticket-number">{{ jo.job_order_number }}</td>
                        <td>{{ jo.job_order_for }}</td>
                        <td *ngIf="isBranchManager">{{ jo.department_name }}</td>
                        <td>
                          <span class="status-badge" [class]="jo.status">{{ formatStatus(jo.status) }}</span>
                        </td>
                        <td>{{ jo.date | date:'shortDate' }}</td>
                        <td>{{ jo.requested_name }}</td>
                        <td>
                          <span *ngIf="jo.is_forwarded" class="forwarded-badge">Yes</span>
                          <span *ngIf="!jo.is_forwarded">No</span>
                        </td>
                      </tr>
                      <tr *ngIf="filteredJobOrders.length === 0">
                        <td [attr.colspan]="isBranchManager ? 7 : 6" class="no-data">No job orders found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Generated Info -->
            <div class="generated-info">
              <span>📅 Period: {{ getPeriodLabel() }}</span>
              <span>🕐 Generated: {{ reportData.generatedAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="report-modal-footer" *ngIf="!isLoading && !error && reportData">
          <div class="footer-left">
            <span class="footer-scope">{{ isBranchManager ? 'Branch Report' : 'Department Report' }}</span>
          </div>
          <div class="footer-right">
            <!-- In the footer, update the print button: -->
<div class="print-dropdown">
  <button class="btn-print-dropdown" (click)="togglePrintDropdown($event)">
    🖨️ Print <span class="dropdown-arrow">▼</span>
  </button>
  <div class="print-dropdown-menu" *ngIf="showPrintDropdown" (click)="$event.stopPropagation()">
    <div class="dropdown-item" (click)="printReport('all'); showPrintDropdown = false">📄 All Documents</div>
    <div class="dropdown-item" (click)="printReport('tickets'); showPrintDropdown = false">🎫 Tickets Only</div>
    <div class="dropdown-item" (click)="printReport('requisitions'); showPrintDropdown = false">📩 Requisitions Only</div>
    <div class="dropdown-item" (click)="printReport('jobOrders'); showPrintDropdown = false">📋 Job Orders Only</div>
  </div>
</div>
            <button class="btn-close-bottom" (click)="close()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .report-modal {
      position: fixed;
      width: 95%;
      max-width: 1100px;
      max-height: 90vh;
      background: white;
      border: 2px solid #808080;
      box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .report-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #0a246a;
      color: white;
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }

    .report-modal-header:active { cursor: grabbing; }

    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-left h3 { margin: 0; font-size: 14px; font-weight: 700; }

    .scope-badge {
      padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;
    }
    .scope-badge.branch { background: rgba(255,255,255,0.2); color: white; }
    .scope-badge.dept { background: rgba(255,255,255,0.2); color: #ffcc00; }

    .header-right { display: flex; align-items: center; gap: 10px; }
    .branch-name { font-size: 11px; opacity: 0.9; }

    .btn-close {
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
      color: white; width: 28px; height: 28px; border-radius: 4px;
      cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;
    }
    .btn-close:hover { background: rgba(239,68,68,0.5); }

    .report-modal-body { flex: 1; overflow-y: auto; padding: 16px 20px; }

    .loading-state, .error-state { text-align: center; padding: 40px; color: #888; }

    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #0a246a; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-retry {
      background: #0a246a; color: white; border: none; padding: 8px 18px;
      border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 12px;
    }

    /* Summary */
    .summary-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;
    }
    .summary-card {
      background: #f8f9fa; border: 1px solid #e0e0e0; padding: 12px;
      text-align: center; border-radius: 6px;
    }
    .summary-value { font-size: 20px; font-weight: 700; color: #0a246a; }
    .summary-label { font-size: 9px; color: #888; text-transform: uppercase; margin-top: 2px; }

    /* Tabs */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 2px solid #e0e0e0;
    }
    .tab-btn {
      padding: 8px 16px; border: none; background: transparent;
      cursor: pointer; font-size: 12px; font-weight: 600; color: #888;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
    }
    .tab-btn.active {
      color: #0a246a; border-bottom-color: #0a246a;
    }
    .tab-btn:hover { color: #0a246a; }

    /* Stats Grid */
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
      gap: 6px; margin-bottom: 12px;
    }
    .stat-item {
      background: #f8f9fa; border: 1px solid #e0e0e0; padding: 8px;
      text-align: center; border-radius: 4px;
    }
    .stat-item.clickable {
      cursor: pointer; transition: all 0.2s;
    }
    .stat-item.clickable:hover {
      background: #e8f0fe; border-color: #0a246a;
    }
    .stat-item.clickable.active {
      background: #0a246a; color: white; border-color: #0a246a;
    }
    .stat-item.clickable.active .stat-value { color: white; }
    .stat-item.clickable.active .stat-label { color: rgba(255,255,255,0.8); }

    .stat-value { font-size: 16px; font-weight: 700; color: #333; }
    .stat-label { font-size: 8px; color: #888; text-transform: uppercase; }

    .stat-item.open .stat-value { color: #0ea5e9; }
    .stat-item.resolved .stat-value { color: #22c55e; }
    .stat-item.closed .stat-value { color: #94a3b8; }
    .stat-item.pending .stat-value { color: #f59e0b; }
    .stat-item.approved .stat-value { color: #22c55e; }
    .stat-item.processing .stat-value { color: #cc6600; }
    .stat-item.released .stat-value { color: #0066cc; }
    .stat-item.forwarded .stat-value { color: #8b5cf6; }
    .stat-item.assigned .stat-value { color: #4f46e5; }
    .stat-item.done .stat-value { color: #22c55e; }

    .stat-value.good { color: #22c55e; }
    .stat-value.warning { color: #f59e0b; }
    .stat-value.bad { color: #ef4444; }

    /* Bars */
    .sub-section { margin-bottom: 12px; }
    .sub-section h5 { font-size: 11px; color: #666; margin: 0 0 8px 0; }

    .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .bar-label { width: 55px; font-size: 10px; font-weight: 600; }
    .bar-label.critical { color: #cc0000; }
    .bar-label.high { color: #ff6600; }
    .bar-label.medium { color: #cc8800; }
    .bar-label.low { color: #008800; }
    .bar-count { width: 22px; text-align: right; font-weight: 700; font-size: 10px; }
    .bar-track { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; }
    .bar-fill.critical { background: #cc0000; }
    .bar-fill.high { background: #ff6600; }
    .bar-fill.medium { background: #ffaa00; }
    .bar-fill.low { background: #008800; }

    /* Department List */
    .dept-list { display: flex; flex-direction: column; gap: 4px; }
    .dept-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: #f8f9fa; border-radius: 3px; }
    .dept-name { font-size: 11px; font-weight: 500; min-width: 100px; }
    .dept-count { font-size: 10px; color: #888; min-width: 60px; }
    .dept-track { flex: 1; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; }
    .dept-fill { height: 100%; background: #0a246a; border-radius: 2px; }

    /* Table Section */
    .table-section { margin-top: 12px; }
    .table-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .table-header h5 { font-size: 12px; color: #333; margin: 0; }
    .table-count { font-size: 10px; color: #888; }

    .table-wrapper {
      max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px;
    }

    .data-table {
      width: 100%; border-collapse: collapse; font-size: 11px;
    }
    .data-table thead {
      position: sticky; top: 0; z-index: 1;
    }
    .data-table th {
      background: #0a246a; color: white; padding: 8px 10px;
      text-align: left; font-size: 10px; font-weight: 600; white-space: nowrap;
    }
    .data-table td {
      padding: 7px 10px; border-bottom: 1px solid #f0f0f0;
    }
    .data-table tbody tr:hover { background: #f8f9fa; }
    .data-table .no-data {
      text-align: center; padding: 20px; color: #888;
    }

    .ticket-number { font-family: monospace; font-size: 10px; color: #0a246a; font-weight: 600; }
    .ticket-title { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .priority-badge {
      padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: uppercase;
    }
    .priority-badge.critical { background: #fce4e4; color: #cc0000; }
    .priority-badge.high { background: #fff0e0; color: #ff6600; }
    .priority-badge.medium { background: #fff8e0; color: #cc8800; }
    .priority-badge.low { background: #e8f5e9; color: #008800; }

    .status-badge {
      padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;
    }
    .status-badge.new, .status-badge.pending { background: #fff8e0; color: #cc8800; }
    .status-badge.assigned, .status-badge.in_progress { background: #e8f0fe; color: #0ea5e9; }
    .status-badge.resolved, .status-badge.done, .status-badge.released { background: #e8f5e9; color: #22c55e; }
    .status-badge.closed { background: #f0f0f0; color: #94a3b8; }
    .status-badge.approved, .status-badge.received { background: #e8f5e9; color: #22c55e; }
    .status-badge.processing { background: #fff0e0; color: #cc6600; }
    .status-badge.forwarded { background: #f0e8ff; color: #8b5cf6; }
    .status-badge.rejected { background: #fce4e4; color: #ef4444; }

    .forwarded-badge {
      padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;
      background: #f0e8ff; color: #8b5cf6;
    }

    /* Generated Info */
    .generated-info {
      display: flex; gap: 16px; font-size: 10px; color: #aaa;
      padding-top: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0;
    }

    /* Footer */
    .report-modal-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; border-top: 1px solid #ccc; background: #e0e0e0; flex-shrink: 0;
    }
    .footer-scope { font-size: 10px; color: #666; }
    .footer-right { display: flex; gap: 6px; align-items: center; }

    /* Print Dropdown */
    .print-dropdown {
      position: relative;
    }
    .btn-print-dropdown {
      padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 11px;
      border: 1px solid #a0a0a0; background: #f0f0f0; font-family: 'Segoe UI', sans-serif;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-print-dropdown:hover { background: #e0e0e0; }
    .dropdown-arrow { font-size: 8px; }

    .print-dropdown-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 4px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 180px;
      z-index: 10001;
      overflow: hidden;
    }
    .dropdown-item {
      padding: 8px 14px;
      cursor: pointer;
      font-size: 12px;
      color: #333;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.15s;
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: #e8f0fe; color: #0a246a; }

    .btn-close-bottom {
      padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 11px;
      border: 1px solid #a0a0a0; font-family: 'Segoe UI', sans-serif;
      background: #0a246a; color: white; border-color: #0a246a;
    }
    .btn-close-bottom:hover { background: #0d2f8a; }

    @media (max-width: 768px) {
      .report-modal { width: 98%; max-height: 95vh; }
      .summary-row { grid-template-columns: repeat(2, 1fr); }
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
      .data-table { font-size: 10px; }
    }
  `]
})
export class ClientReportsModalComponent implements OnInit {
  @Input() reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
  @Output() closeModal = new EventEmitter<void>();

  reportData: ReportData | null = null;
  isLoading = false;
  error: string | null = null;
  isBranchManager = false;
  userBranch = '';
  userDepartment = '';

  // Tab state
  activeTab: 'tickets' | 'requisitions' | 'jobOrders' = 'tickets';
  
  // Filters
  ticketFilter = 'all';
  reqFilter = 'all';
  joFilter = 'all';

  // Print dropdown
  showPrintDropdown = false;

  // Dragging
  modalX = 0;
  modalY = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  reportTitles: Record<string, string> = {
    daily: '📅 Daily Report',
    weekly: '📊 Weekly Report',
    monthly: '📈 Monthly Report',
    yearly: '📆 Yearly Report'
  };

  periodLabels: Record<string, string> = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year'
  };

  constructor(private http: HttpClient) {}

   ngOnInit() {
    this.modalX = Math.max(10, (window.innerWidth - 1100) / 2);
    this.modalY = Math.max(10, (window.innerHeight - 700) / 2);
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 
      sessionStorage.getItem('currentUser') || 
      '{}'
    );
    const userRole = (currentUser.role || '').toLowerCase().trim();
    this.userBranch = currentUser.branch_name || '';
    this.userDepartment = currentUser.department || currentUser.department_name || '';
    this.isBranchManager = 
      userRole === 'branch manager' || 
      (currentUser.department_role || '').toLowerCase().trim() === 'branch manager';
    this.loadReport();
  }
@HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Only close if clicking outside the print dropdown
    if (!target.closest('.print-dropdown')) {
      this.showPrintDropdown = false;
    }
  }

  get filteredTickets(): TicketItem[] {
    if (!this.reportData?.tickets.list) return [];
    if (this.ticketFilter === 'all') return this.reportData.tickets.list;
    if (this.ticketFilter === 'open') {
      return this.reportData.tickets.list.filter(t => 
        !['resolved', 'closed'].includes(t.status)
      );
    }
    return this.reportData.tickets.list.filter(t => t.status === this.ticketFilter);
  }

  get filteredRequisitions(): RequisitionItem[] {
    if (!this.reportData?.requisitions.list) return [];
    if (this.reqFilter === 'all') return this.reportData.requisitions.list;
    if (this.reqFilter === 'forwarded') {
      return this.reportData.requisitions.list.filter(r => r.is_forwarded);
    }
    return this.reportData.requisitions.list.filter(r => r.status === this.reqFilter);
  }

  get filteredJobOrders(): JobOrderItem[] {
    if (!this.reportData?.jobOrders.list) return [];
    if (this.joFilter === 'all') return this.reportData.jobOrders.list;
    if (this.joFilter === 'received') {
      return this.reportData.jobOrders.list.filter(j => 
        j.status === 'approved' || j.status === 'received'
      );
    }
    if (this.joFilter === 'forwarded') {
      return this.reportData.jobOrders.list.filter(j => j.is_forwarded);
    }
    return this.reportData.jobOrders.list.filter(j => j.status === this.joFilter);
  }

  getReportTitle(): string {
    return this.reportTitles[this.reportType] || '📊 Report';
  }

  getPeriodLabel(): string {
    return this.periodLabels[this.reportType] || 'Custom';
  }

  getTicketTableTitle(): string {
    const map: Record<string, string> = {
      all: 'All Tickets', open: 'Open Tickets', new: 'New Tickets',
      assigned: 'Assigned Tickets', in_progress: 'In Progress Tickets',
      pending: 'Pending Tickets', resolved: 'Resolved Tickets', closed: 'Closed Tickets'
    };
    return map[this.ticketFilter] || 'Tickets';
  }

  getReqTableTitle(): string {
    const map: Record<string, string> = {
      all: 'All Requisitions', pending: 'Pending Requisitions',
      approved: 'Approved Requisitions', processing: 'Processing Requisitions',
      released: 'Released Requisitions', forwarded: 'Forwarded Requisitions',
      rejected: 'Rejected Requisitions'
    };
    return map[this.reqFilter] || 'Requisitions';
  }

  getJOTableTitle(): string {
    const map: Record<string, string> = {
      all: 'All Job Orders', pending: 'Pending Job Orders',
      received: 'Received Job Orders', assigned: 'Assigned Job Orders',
      forwarded: 'Forwarded Job Orders', done: 'Done Job Orders'
    };
    return map[this.joFilter] || 'Job Orders';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  togglePrintDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showPrintDropdown = !this.showPrintDropdown;
  }
  loadReport() {
    this.isLoading = true;
    this.error = null;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const scope = this.isBranchManager ? 'branch' : 'department';
    const params: any = { scope };

    this.http.get<ReportData>(
      `${environment.apiUrl}/api/reports/${this.reportType}`, 
      { headers, params }
    ).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.error = 'Failed to load report. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getPercent(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  startDrag(event: MouseEvent) {
    this.isDragging = true;
    this.dragStartX = event.clientX - this.modalX;
    this.dragStartY = event.clientY - this.modalY;

    const moveHandler = (e: MouseEvent) => {
      if (this.isDragging) {
        this.modalX = e.clientX - this.dragStartX;
        this.modalY = e.clientY - this.dragStartY;
      }
    };

    const upHandler = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }

  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.closeModal.emit();
  }

  // ============ PRINT FUNCTION ============
  printReport(section: 'all' | 'tickets' | 'requisitions' | 'jobOrders') {
    if (!this.reportData) return;

    const getPercent = (value: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    };

    const slaColor = this.reportData.tickets.slaCompliance >= 90 ? '#22c55e' : 
                     this.reportData.tickets.slaCompliance >= 70 ? '#f59e0b' : '#ef4444';

    // Build sections based on what to print
    const includeSummary = section === 'all';
    const includeTickets = section === 'all' || section === 'tickets';
    const includeRequisitions = section === 'all' || section === 'requisitions';
    const includeJobOrders = section === 'all' || section === 'jobOrders';

    // Department breakdown HTML
    const deptBreakdownHtml = this.isBranchManager && includeTickets && this.reportData.tickets.byDepartment.length > 0 ? `
      <div class="sub-section">
        <h5>By Department</h5>
        <div class="dept-list">
          ${this.reportData.tickets.byDepartment.map(d => `
            <div class="dept-item">
              <span class="dept-name">${d.name}</span>
              <span class="dept-count">${d.count} tickets</span>
              <div class="dept-track">
                <div class="dept-fill" style="width:${getPercent(d.count, this.reportData!.tickets.total)}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Tickets table rows
    const ticketRowsHtml = includeTickets ? this.reportData.tickets.list.map(t => `
      <tr>
        <td class="ticket-number">${t.ticket_number}</td>
        <td>${t.title}</td>
        <td><span class="priority-badge ${t.priority}">${t.priority}</span></td>
        <td><span class="status-badge ${t.status}">${this.formatStatus(t.status)}</span></td>
        ${this.isBranchManager ? `<td>${t.department_name}</td>` : ''}
        <td>${t.created_by_name}</td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>${t.resolved_at ? new Date(t.resolved_at).toLocaleString() : '-'}</td>
      </tr>
    `).join('') : '';

    // Requisitions table rows
    const reqRowsHtml = includeRequisitions ? this.reportData.requisitions.list.map(r => `
      <tr>
        <td class="ticket-number">${r.requisition_number}</td>
        <td>${r.request_from}</td>
        ${this.isBranchManager ? `<td>${r.department_name}</td>` : ''}
        <td><span class="status-badge ${r.status}">${this.formatStatus(r.status)}</span></td>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${r.prepared_name}</td>
        <td>${r.is_forwarded ? '<span class="forwarded-badge">Yes</span>' : 'No'}</td>
      </tr>
    `).join('') : '';

    // Job Orders table rows
    const joRowsHtml = includeJobOrders ? this.reportData.jobOrders.list.map(j => `
      <tr>
        <td class="ticket-number">${j.job_order_number}</td>
        <td>${j.job_order_for}</td>
        ${this.isBranchManager ? `<td>${j.department_name}</td>` : ''}
        <td><span class="status-badge ${j.status}">${this.formatStatus(j.status)}</span></td>
        <td>${new Date(j.date).toLocaleDateString()}</td>
        <td>${j.requested_name}</td>
        <td>${j.is_forwarded ? '<span class="forwarded-badge">Yes</span>' : 'No'}</td>
      </tr>
    `).join('') : '';

    const ticketColspan = this.isBranchManager ? 8 : 7;
    const reqColspan = this.isBranchManager ? 7 : 6;
    const joColspan = this.isBranchManager ? 7 : 6;

    const sectionTitle = section === 'all' ? 'Complete Report' : 
                         section === 'tickets' ? 'Tickets Report' :
                         section === 'requisitions' ? 'Requisitions Report' : 'Job Orders Report';

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${sectionTitle} - ${this.userBranch}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 10mm; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 10px; color: #000; line-height: 1.4;
    }
    .print-container { max-width: 100%; padding: 8px; }
    .print-header {
      text-align: center; border-bottom: 2px solid #0a246a;
      padding-bottom: 8px; margin-bottom: 12px;
    }
    .print-header h1 { font-size: 16px; color: #0a246a; margin: 0 0 4px 0; }
    .print-header .subtitle { font-size: 10px; color: #666; }
    .print-header .meta { font-size: 9px; color: #888; margin-top: 4px; }
    .scope-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 9px; font-weight: 600; margin: 4px 0;
      background: #f0f4ff; color: #0a246a; border: 1px solid #b8c8e8;
    }
    .summary-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;
    }
    .summary-card {
      background: #f8f9fa; border: 1px solid #e0e0e0; padding: 8px;
      text-align: center; border-radius: 4px;
    }
    .summary-value { font-size: 16px; font-weight: 700; color: #0a246a; }
    .summary-label { font-size: 7px; color: #888; text-transform: uppercase; }
    .section {
      margin-bottom: 12px; border: 1px solid #e0e0e0; border-radius: 4px;
      padding: 10px; page-break-inside: avoid;
    }
    .section h4 {
      color: #0a246a; margin: 0 0 8px 0; font-size: 11px;
      padding-bottom: 4px; border-bottom: 1px solid #e0e0e0;
    }
    .sub-section { margin-top: 8px; }
    .sub-section h5 { font-size: 9px; color: #666; margin: 0 0 6px 0; }
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
      gap: 4px; margin-bottom: 8px;
    }
    .stat-item {
      background: #f8f9fa; border: 1px solid #e0e0e0; padding: 4px;
      text-align: center; border-radius: 3px;
    }
    .stat-value { font-size: 12px; font-weight: 700; color: #333; }
    .stat-label { font-size: 6px; color: #888; text-transform: uppercase; }
    .bar-row { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
    .bar-label { width: 45px; font-size: 8px; font-weight: 600; }
    .bar-label.critical { color: #cc0000; }
    .bar-label.high { color: #ff6600; }
    .bar-label.medium { color: #cc8800; }
    .bar-label.low { color: #008800; }
    .bar-count { width: 18px; text-align: right; font-weight: 700; font-size: 8px; }
    .bar-track { flex: 1; height: 3px; background: #f0f0f0; border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 2px; }
    .bar-fill.critical { background: #cc0000; }
    .bar-fill.high { background: #ff6600; }
    .bar-fill.medium { background: #ffaa00; }
    .bar-fill.low { background: #008800; }
    .dept-list { display: flex; flex-direction: column; gap: 2px; }
    .dept-item { display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: #f8f9fa; border-radius: 2px; }
    .dept-name { font-size: 9px; font-weight: 500; min-width: 70px; }
    .dept-count { font-size: 8px; color: #888; min-width: 45px; }
    .dept-track { flex: 1; height: 3px; background: #e0e0e0; border-radius: 1px; overflow: hidden; }
    .dept-fill { height: 100%; background: #0a246a; border-radius: 1px; }

    /* Table */
    .table-section { margin-top: 8px; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .table-header h5 { font-size: 10px; color: #333; margin: 0; }
    .table-count { font-size: 8px; color: #888; }
    .table-wrapper { border: 1px solid #e0e0e0; border-radius: 3px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 9px; }
    .data-table th {
      background: #0a246a; color: white; padding: 5px 8px;
      text-align: left; font-size: 8px; font-weight: 600; white-space: nowrap;
    }
    .data-table td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; }
    .data-table tbody tr:nth-child(even) { background: #fafafa; }
    .ticket-number { font-family: monospace; font-size: 8px; color: #0a246a; font-weight: 600; }

    .priority-badge {
      padding: 1px 4px; border-radius: 2px; font-size: 7px; font-weight: 600; text-transform: uppercase;
    }
    .priority-badge.critical { background: #fce4e4; color: #cc0000; }
    .priority-badge.high { background: #fff0e0; color: #ff6600; }
    .priority-badge.medium { background: #fff8e0; color: #cc8800; }
    .priority-badge.low { background: #e8f5e9; color: #008800; }
    .status-badge {
      padding: 1px 4px; border-radius: 2px; font-size: 7px; font-weight: 600;
    }
    .status-badge.new, .status-badge.pending { background: #fff8e0; color: #cc8800; }
    .status-badge.assigned, .status-badge.in_progress { background: #e8f0fe; color: #0ea5e9; }
    .status-badge.resolved, .status-badge.done, .status-badge.released { background: #e8f5e9; color: #22c55e; }
    .status-badge.closed { background: #f0f0f0; color: #94a3b8; }
    .status-badge.approved, .status-badge.received { background: #e8f5e9; color: #22c55e; }
    .status-badge.processing { background: #fff0e0; color: #cc6600; }
    .status-badge.forwarded { background: #f0e8ff; color: #8b5cf6; }
    .status-badge.rejected { background: #fce4e4; color: #ef4444; }
    .forwarded-badge {
      padding: 1px 4px; border-radius: 2px; font-size: 7px; font-weight: 600;
      background: #f0e8ff; color: #8b5cf6;
    }
    .print-footer {
      margin-top: 12px; padding-top: 6px; border-top: 1px solid #e0e0e0;
      text-align: center; font-size: 8px; color: #aaa;
    }
    .print-footer p { margin: 2px 0; }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="print-header">
      <h1>${this.getReportTitle()} - ${sectionTitle}</h1>
      <div class="subtitle">${this.userBranch}${this.isBranchManager ? '' : ' - ' + this.userDepartment}</div>
      <div class="scope-badge">${this.isBranchManager ? '🏢 Entire Branch Report' : '📂 Department Report'}</div>
      <div class="meta">
        Period: ${this.getPeriodLabel()} | Generated: ${new Date(this.reportData.generatedAt).toLocaleString()}
      </div>
    </div>

    ${includeSummary ? `
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-value">${this.reportData.summary.totalRequests}</div>
        <div class="summary-label">Total Requests</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${this.reportData.summary.completedRequests}</div>
        <div class="summary-label">Completed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${this.reportData.summary.completionRate}%</div>
        <div class="summary-label">Completion Rate</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${this.reportData.summary.departments}</div>
        <div class="summary-label">${this.isBranchManager ? 'Departments' : 'Categories'}</div>
      </div>
    </div>
    ` : ''}

    ${includeTickets ? `
    <div class="section">
      <h4>🎫 Tickets (${this.reportData.tickets.total})</h4>
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${this.reportData.tickets.total}</div><div class="stat-label">Total</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#0ea5e9">${this.reportData.tickets.open}</div><div class="stat-label">Open</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#22c55e">${this.reportData.tickets.resolved}</div><div class="stat-label">Resolved</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#94a3b8">${this.reportData.tickets.closed}</div><div class="stat-label">Closed</div></div>
        <div class="stat-item"><div class="stat-value">${this.reportData.tickets.avgResolutionTime}</div><div class="stat-label">Avg Time</div></div>
        <div class="stat-item"><div class="stat-value" style="color:${slaColor}">${this.reportData.tickets.slaCompliance}%</div><div class="stat-label">SLA</div></div>
      </div>
      <div class="sub-section">
        <h5>By Priority</h5>
        <div class="bar-row"><span class="bar-label critical">Critical</span><span class="bar-count">${this.reportData.tickets.byPriority.critical}</span><div class="bar-track"><div class="bar-fill critical" style="width:${getPercent(this.reportData.tickets.byPriority.critical, this.reportData.tickets.total)}%"></div></div></div>
        <div class="bar-row"><span class="bar-label high">High</span><span class="bar-count">${this.reportData.tickets.byPriority.high}</span><div class="bar-track"><div class="bar-fill high" style="width:${getPercent(this.reportData.tickets.byPriority.high, this.reportData.tickets.total)}%"></div></div></div>
        <div class="bar-row"><span class="bar-label medium">Medium</span><span class="bar-count">${this.reportData.tickets.byPriority.medium}</span><div class="bar-track"><div class="bar-fill medium" style="width:${getPercent(this.reportData.tickets.byPriority.medium, this.reportData.tickets.total)}%"></div></div></div>
        <div class="bar-row"><span class="bar-label low">Low</span><span class="bar-count">${this.reportData.tickets.byPriority.low}</span><div class="bar-track"><div class="bar-fill low" style="width:${getPercent(this.reportData.tickets.byPriority.low, this.reportData.tickets.total)}%"></div></div></div>
      </div>
      ${deptBreakdownHtml}
      <div class="table-section">
        <div class="table-header"><h5>Ticket List</h5><span class="table-count">${this.reportData.tickets.list.length} records</span></div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket #</th><th>Title</th><th>Priority</th><th>Status</th>
                ${this.isBranchManager ? '<th>Department</th>' : ''}
                <th>Created By</th><th>Created</th><th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRowsHtml || `<tr><td colspan="${ticketColspan}" style="text-align:center;padding:15px;">No tickets found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ` : ''}

    ${includeRequisitions ? `
    <div class="section">
      <h4>📩 Requisitions (${this.reportData.requisitions.total})</h4>
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${this.reportData.requisitions.total}</div><div class="stat-label">Total</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#f59e0b">${this.reportData.requisitions.pending}</div><div class="stat-label">Pending</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#22c55e">${this.reportData.requisitions.approved}</div><div class="stat-label">Approved</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#cc6600">${this.reportData.requisitions.processing}</div><div class="stat-label">Processing</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#0066cc">${this.reportData.requisitions.released}</div><div class="stat-label">Released</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#8b5cf6">${this.reportData.requisitions.forwarded}</div><div class="stat-label">Forwarded</div></div>
      </div>
      <div class="table-section">
        <div class="table-header"><h5>Requisition List</h5><span class="table-count">${this.reportData.requisitions.list.length} records</span></div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Req #</th><th>Request From</th>
                ${this.isBranchManager ? '<th>Department</th>' : ''}
                <th>Status</th><th>Date</th><th>Prepared By</th><th>Forwarded</th>
              </tr>
            </thead>
            <tbody>
              ${reqRowsHtml || `<tr><td colspan="${reqColspan}" style="text-align:center;padding:15px;">No requisitions found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ` : ''}

    ${includeJobOrders ? `
    <div class="section">
      <h4>📋 Job Orders (${this.reportData.jobOrders.total})</h4>
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${this.reportData.jobOrders.total}</div><div class="stat-label">Total</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#f59e0b">${this.reportData.jobOrders.pending}</div><div class="stat-label">Pending</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#22c55e">${this.reportData.jobOrders.approved}</div><div class="stat-label">Received</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#4f46e5">${this.reportData.jobOrders.assigned}</div><div class="stat-label">Assigned</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#22c55e">${this.reportData.jobOrders.done}</div><div class="stat-label">Done</div></div>
      </div>
      <div class="table-section">
        <div class="table-header"><h5>Job Order List</h5><span class="table-count">${this.reportData.jobOrders.list.length} records</span></div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>JO #</th><th>Job For</th>
                ${this.isBranchManager ? '<th>Department</th>' : ''}
                <th>Status</th><th>Date</th><th>Requested By</th><th>Forwarded</th>
              </tr>
            </thead>
            <tbody>
              ${joRowsHtml || `<tr><td colspan="${joColspan}" style="text-align:center;padding:15px;">No job orders found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="print-footer">
      <p>EDPtech Helpdesk System - Support Portal v2.0</p>
      <p>Report generated on ${new Date().toLocaleString()} | ${sectionTitle}</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert('Please allow popups for this site to print reports.');
    }
  }
}