import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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
  };
  jobOrders: {
    total: number;
    pending: number;
    approved: number;
    assigned: number;
    forwarded: number;
    done: number;
    byDepartment: { name: string; count: number }[];
  };
  summary: {
    totalRequests: number;
    completedRequests: number;
    completionRate: number;
    departments: number;
  };
  generatedAt: string;
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
              {{ isBranchManager ? '🏢 Entire Branch' : '📂 ' + departmentName }}
            </span>
          </div>
          <div class="header-right">
            <span class="branch-name" *ngIf="branchName">🏢 {{ branchName }}</span>
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

            <!-- Tickets Section -->
            <div class="section">
              <h4>🎫 Tickets</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.tickets.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
                <div class="stat-item open">
                  <span class="stat-value">{{ reportData.tickets.open }}</span>
                  <span class="stat-label">Open</span>
                </div>
                <div class="stat-item resolved">
                  <span class="stat-value">{{ reportData.tickets.resolved }}</span>
                  <span class="stat-label">Resolved</span>
                </div>
                <div class="stat-item closed">
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
              
              <!-- Priority Distribution -->
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

              <!-- Department Breakdown (only for Branch Manager) -->
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
            </div>

            <!-- Requisitions Section -->
            <div class="section">
              <h4>📩 Requisitions</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.requisitions.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
                <div class="stat-item pending">
                  <span class="stat-value">{{ reportData.requisitions.pending }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item approved">
                  <span class="stat-value">{{ reportData.requisitions.approved }}</span>
                  <span class="stat-label">Approved</span>
                </div>
                <div class="stat-item processing">
                  <span class="stat-value">{{ reportData.requisitions.processing }}</span>
                  <span class="stat-label">Processing</span>
                </div>
                <div class="stat-item released">
                  <span class="stat-value">{{ reportData.requisitions.released }}</span>
                  <span class="stat-label">Released</span>
                </div>
                <div class="stat-item forwarded">
                  <span class="stat-value">{{ reportData.requisitions.forwarded }}</span>
                  <span class="stat-label">Forwarded</span>
                </div>
              </div>
            </div>

            <!-- Job Orders Section -->
            <div class="section">
              <h4>📋 Job Orders</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.jobOrders.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
                <div class="stat-item pending">
                  <span class="stat-value">{{ reportData.jobOrders.pending }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item approved">
                  <span class="stat-value">{{ reportData.jobOrders.approved }}</span>
                  <span class="stat-label">Received</span>
                </div>
                <div class="stat-item assigned">
                  <span class="stat-value">{{ reportData.jobOrders.assigned }}</span>
                  <span class="stat-label">Assigned</span>
                </div>
                <div class="stat-item done">
                  <span class="stat-value">{{ reportData.jobOrders.done }}</span>
                  <span class="stat-label">Done</span>
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
            <button class="btn-print" (click)="printReport()">🖨️ Print</button>
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
      width: 92%;
      max-width: 950px;
      max-height: 88vh;
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

    .report-modal-header:active {
      cursor: grabbing;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-left h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
    }

    .scope-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
    }

    .scope-badge.branch {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .scope-badge.dept {
      background: rgba(255, 255, 255, 0.2);
      color: #ffcc00;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .branch-name {
      font-size: 11px;
      opacity: 0.9;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      background: rgba(239, 68, 68, 0.5);
    }

    .report-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #0a246a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-retry {
      background: #0a246a;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 12px;
    }

    /* Summary */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .summary-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 12px;
      text-align: center;
      border-radius: 6px;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 700;
      color: #0a246a;
    }

    .summary-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* Sections */
    .section {
      margin-bottom: 16px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 14px;
    }

    .section h4 {
      color: #0a246a;
      margin: 0 0 10px 0;
      font-size: 13px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
    }

    .sub-section {
      margin-top: 12px;
    }

    .sub-section h5 {
      font-size: 11px;
      color: #666;
      margin: 0 0 8px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
      gap: 6px;
    }

    .stat-item {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 8px;
      text-align: center;
      border-radius: 4px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 8px;
      color: #888;
      text-transform: uppercase;
    }

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
    .bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .bar-label {
      width: 55px;
      font-size: 10px;
      font-weight: 600;
    }

    .bar-label.critical { color: #cc0000; }
    .bar-label.high { color: #ff6600; }
    .bar-label.medium { color: #cc8800; }
    .bar-label.low { color: #008800; }

    .bar-count {
      width: 22px;
      text-align: right;
      font-weight: 700;
      font-size: 10px;
    }

    .bar-track {
      flex: 1;
      height: 5px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    .bar-fill.critical { background: #cc0000; }
    .bar-fill.high { background: #ff6600; }
    .bar-fill.medium { background: #ffaa00; }
    .bar-fill.low { background: #008800; }

    /* Department List */
    .dept-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dept-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 3px;
    }

    .dept-name {
      font-size: 11px;
      font-weight: 500;
      min-width: 100px;
    }

    .dept-count {
      font-size: 10px;
      color: #888;
      min-width: 60px;
    }

    .dept-track {
      flex: 1;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .dept-fill {
      height: 100%;
      background: #0a246a;
      border-radius: 2px;
    }

    /* Generated Info */
    .generated-info {
      display: flex;
      gap: 16px;
      font-size: 10px;
      color: #aaa;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    /* Footer */
    .report-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-top: 1px solid #ccc;
      background: #e0e0e0;
      flex-shrink: 0;
    }

    .footer-scope {
      font-size: 10px;
      color: #666;
    }

    .footer-right {
      display: flex;
      gap: 6px;
    }

    .btn-print, .btn-close-bottom {
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      border: 1px solid #a0a0a0;
      font-family: 'Segoe UI', sans-serif;
    }

    .btn-print {
      background: #f0f0f0;
    }

    .btn-print:hover {
      background: #e0e0e0;
    }

    .btn-close-bottom {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
    }

    .btn-close-bottom:hover {
      background: #0d2f8a;
    }

    @media (max-width: 600px) {
      .report-modal {
        width: 96%;
        max-height: 92vh;
      }

      .summary-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

  @media print {
  .modal-overlay {
    position: static !important;
    background: none !important;
  }
  .report-modal {
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
    border: 1px solid #000 !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .report-modal-header {
    background: #0a246a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .btn-close, .btn-print, .btn-close-bottom, .report-modal-footer {
    display: none !important;
  }
  .report-modal-body {
    max-height: none !important;
    overflow: visible !important;
  }
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
  branchName = '';
  departmentName = '';

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
    // Center modal
    this.modalX = Math.max(10, (window.innerWidth - 950) / 2);
    this.modalY = Math.max(10, (window.innerHeight - 650) / 2);

    // Get user info
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 
      sessionStorage.getItem('currentUser') || 
      '{}'
    );

    const role = (currentUser.role || '').toLowerCase().trim();
    this.isBranchManager = role === 'branch manager';
    this.branchName = currentUser.branch_name || '';
    this.departmentName = currentUser.department || currentUser.department_name || '';

    this.loadReport();
  }

  getReportTitle(): string {
    return this.reportTitles[this.reportType] || '📊 Report';
  }

  getPeriodLabel(): string {
    return this.periodLabels[this.reportType] || 'Custom';
  }

  loadReport() {
    this.isLoading = true;
    this.error = null;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const scope = this.isBranchManager ? 'branch' : 'department';

    this.http.get<ReportData>(
      `${environment.apiUrl}/api/reports/${this.reportType}?scope=${scope}`, 
      { headers }
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

  printReport() {
  if (!this.reportData) return;
  
  const getPercent = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const deptBreakdownHtml = this.isBranchManager && this.reportData.tickets.byDepartment.length > 0 ? `
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

  const slaColor = this.reportData.tickets.slaCompliance >= 90 ? '#22c55e' : 
                   this.reportData.tickets.slaCompliance >= 70 ? '#f59e0b' : '#ef4444';

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${this.getReportTitle()} - ${this.branchName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 12mm; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 11px; 
      color: #000; 
      line-height: 1.4;
    }
    .print-container {
      max-width: 100%;
      padding: 10px;
    }
    .print-header {
      text-align: center;
      border-bottom: 2px solid #0a246a;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .print-header h1 {
      font-size: 18px;
      color: #0a246a;
      margin: 0 0 4px 0;
    }
    .print-header .subtitle {
      font-size: 11px;
      color: #666;
    }
    .print-header .meta {
      font-size: 10px;
      color: #888;
      margin-top: 4px;
    }
    .scope-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      margin: 6px 0;
      background: #f0f4ff;
      color: #0a246a;
      border: 1px solid #b8c8e8;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .summary-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 10px;
      text-align: center;
      border-radius: 4px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #0a246a;
    }
    .summary-label {
      font-size: 8px;
      color: #888;
      text-transform: uppercase;
    }

    .section {
      margin-bottom: 14px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      page-break-inside: avoid;
    }
    .section h4 {
      color: #0a246a;
      margin: 0 0 8px 0;
      font-size: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    .sub-section {
      margin-top: 10px;
    }
    .sub-section h5 {
      font-size: 10px;
      color: #666;
      margin: 0 0 6px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 4px;
    }
    .stat-item {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 6px;
      text-align: center;
      border-radius: 3px;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #333;
    }
    .stat-label {
      font-size: 7px;
      color: #888;
      text-transform: uppercase;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .bar-label {
      width: 50px;
      font-size: 9px;
      font-weight: 600;
    }
    .bar-label.critical { color: #cc0000; }
    .bar-label.high { color: #ff6600; }
    .bar-label.medium { color: #cc8800; }
    .bar-label.low { color: #008800; }
    .bar-count {
      width: 20px;
      text-align: right;
      font-weight: 700;
      font-size: 9px;
    }
    .bar-track {
      flex: 1;
      height: 4px;
      background: #f0f0f0;
      border-radius: 2px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 2px;
    }
    .bar-fill.critical { background: #cc0000; }
    .bar-fill.high { background: #ff6600; }
    .bar-fill.medium { background: #ffaa00; }
    .bar-fill.low { background: #008800; }

    .dept-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .dept-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 6px;
      background: #f8f9fa;
      border-radius: 2px;
    }
    .dept-name {
      font-size: 10px;
      font-weight: 500;
      min-width: 80px;
    }
    .dept-count {
      font-size: 9px;
      color: #888;
      min-width: 50px;
    }
    .dept-track {
      flex: 1;
      height: 3px;
      background: #e0e0e0;
      border-radius: 1px;
      overflow: hidden;
    }
    .dept-fill {
      height: 100%;
      background: #0a246a;
      border-radius: 1px;
    }

    .print-footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 9px;
      color: #aaa;
    }
    .print-footer p { margin: 2px 0; }
  </style>
</head>
<body>
  <div class="print-container">
    <!-- Header -->
    <div class="print-header">
      <h1>${this.getReportTitle()}</h1>
      <div class="subtitle">${this.branchName}${this.isBranchManager ? '' : ' - ' + this.departmentName}</div>
      <div class="scope-badge">${this.isBranchManager ? '🏢 Entire Branch Report' : '📂 Department Report'}</div>
      <div class="meta">
        Period: ${this.getPeriodLabel()} | Generated: ${new Date(this.reportData.generatedAt).toLocaleString()}
      </div>
    </div>

    <!-- Summary Cards -->
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

    <!-- Tickets Section -->
    <div class="section">
      <h4>🎫 Tickets</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${this.reportData.tickets.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#0ea5e9">${this.reportData.tickets.open}</div>
          <div class="stat-label">Open</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#22c55e">${this.reportData.tickets.resolved}</div>
          <div class="stat-label">Resolved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#94a3b8">${this.reportData.tickets.closed}</div>
          <div class="stat-label">Closed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.reportData.tickets.avgResolutionTime}</div>
          <div class="stat-label">Avg Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:${slaColor}">${this.reportData.tickets.slaCompliance}%</div>
          <div class="stat-label">SLA</div>
        </div>
      </div>
      
      <div class="sub-section">
        <h5>By Priority</h5>
        <div class="bar-row">
          <span class="bar-label critical">Critical</span>
          <span class="bar-count">${this.reportData.tickets.byPriority.critical}</span>
          <div class="bar-track"><div class="bar-fill critical" style="width:${getPercent(this.reportData.tickets.byPriority.critical, this.reportData.tickets.total)}%"></div></div>
        </div>
        <div class="bar-row">
          <span class="bar-label high">High</span>
          <span class="bar-count">${this.reportData.tickets.byPriority.high}</span>
          <div class="bar-track"><div class="bar-fill high" style="width:${getPercent(this.reportData.tickets.byPriority.high, this.reportData.tickets.total)}%"></div></div>
        </div>
        <div class="bar-row">
          <span class="bar-label medium">Medium</span>
          <span class="bar-count">${this.reportData.tickets.byPriority.medium}</span>
          <div class="bar-track"><div class="bar-fill medium" style="width:${getPercent(this.reportData.tickets.byPriority.medium, this.reportData.tickets.total)}%"></div></div>
        </div>
        <div class="bar-row">
          <span class="bar-label low">Low</span>
          <span class="bar-count">${this.reportData.tickets.byPriority.low}</span>
          <div class="bar-track"><div class="bar-fill low" style="width:${getPercent(this.reportData.tickets.byPriority.low, this.reportData.tickets.total)}%"></div></div>
        </div>
      </div>

      ${deptBreakdownHtml}
    </div>

    <!-- Requisitions Section -->
    <div class="section">
      <h4>📩 Requisitions</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${this.reportData.requisitions.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#f59e0b">${this.reportData.requisitions.pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#22c55e">${this.reportData.requisitions.approved}</div>
          <div class="stat-label">Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#cc6600">${this.reportData.requisitions.processing}</div>
          <div class="stat-label">Processing</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#0066cc">${this.reportData.requisitions.released}</div>
          <div class="stat-label">Released</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#8b5cf6">${this.reportData.requisitions.forwarded}</div>
          <div class="stat-label">Forwarded</div>
        </div>
      </div>
    </div>

    <!-- Job Orders Section -->
    <div class="section">
      <h4>📋 Job Orders</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${this.reportData.jobOrders.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#f59e0b">${this.reportData.jobOrders.pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#22c55e">${this.reportData.jobOrders.approved}</div>
          <div class="stat-label">Received</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#4f46e5">${this.reportData.jobOrders.assigned}</div>
          <div class="stat-label">Assigned</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#22c55e">${this.reportData.jobOrders.done}</div>
          <div class="stat-label">Done</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="print-footer">
      <p>EDPtech Helpdesk System - Support Portal v2.0</p>
      <p>Report generated on ${new Date().toLocaleString()}</p>
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

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  } else {
    alert('Please allow popups for this site to print reports.');
  }
}
}