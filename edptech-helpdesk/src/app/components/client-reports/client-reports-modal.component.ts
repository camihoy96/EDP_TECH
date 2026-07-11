import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ReportData {
  tickets: {
    total: number;
    open: number;
    resolved: number;
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
    released: number;
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
}

@Component({
  selector: 'app-client-reports-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Overlay -->
    <div class="modal-overlay" (click)="closeOnOverlay($event)">
      <!-- Draggable Modal -->
      <div class="modal-container" 
           #modalContainer
           [style.left.px]="modalX" 
           [style.top.px]="modalY">
        
        <!-- Modal Header (Drag Handle) -->
        <div class="modal-header" (mousedown)="startDrag($event)">
          <h3>
            {{ reportTitles[reportType] }}
          </h3>
          <div class="header-actions">
            <span class="branch-info" *ngIf="branchName">
              🏢 {{ branchName }}
            </span>
            <button class="btn-close" (click)="close()">✕</button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Loading -->
          <div class="loading" *ngIf="isLoading">
            <div class="spinner"></div>
            <p>Generating report...</p>
          </div>

          <!-- Error -->
          <div class="error" *ngIf="error">
            <p>⚠️ {{ error }}</p>
            <button (click)="loadReport()">Retry</button>
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
                <div class="summary-label">Departments</div>
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
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.tickets.avgResolutionTime }}</span>
                  <span class="stat-label">Avg Time</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ reportData.tickets.slaCompliance }}%</span>
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

            <!-- Department Breakdown -->
            <div class="section" *ngIf="reportData.tickets.byDepartment.length > 0">
              <h4>🏢 By Department</h4>
              <div class="dept-list">
                <div class="dept-item" *ngFor="let dept of reportData.tickets.byDepartment">
                  <span class="dept-name">{{ dept.name }}</span>
                  <span class="dept-count">{{ dept.count }} tickets</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer" *ngIf="!isLoading && !error && reportData">
          <span class="generated-time">Generated: {{ generatedTime | date:'medium' }}</span>
          <div class="footer-actions">
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
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-container {
      position: fixed;
      width: 90%;
      max-width: 900px;
      max-height: 85vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #0a246a;
      color: white;
      cursor: move;
      user-select: none;
      border-radius: 12px 12px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .branch-info {
      font-size: 12px;
      opacity: 0.9;
    }

    .btn-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      background: rgba(255,255,255,0.3);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .loading, .error {
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

    .error button {
      background: #0a246a;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 12px;
    }

    /* Summary */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 14px;
      text-align: center;
      border-radius: 8px;
    }

    .summary-value {
      font-size: 22px;
      font-weight: 700;
      color: #0a246a;
    }

    .summary-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
    }

    /* Sections */
    .section {
      margin-bottom: 20px;
    }

    .section h4 {
      color: #0f172a;
      margin: 0 0 12px 0;
      font-size: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .sub-section h5 {
      font-size: 12px;
      color: #666;
      margin: 12px 0 8px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 8px;
    }

    .stat-item {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 10px;
      text-align: center;
      border-radius: 6px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
    }

    .stat-item.open .stat-value { color: #0ea5e9; }
    .stat-item.resolved .stat-value { color: #22c55e; }
    .stat-item.pending .stat-value { color: #f59e0b; }
    .stat-item.approved .stat-value { color: #22c55e; }
    .stat-item.released .stat-value { color: #0ea5e9; }
    .stat-item.forwarded .stat-value { color: #8b5cf6; }
    .stat-item.assigned .stat-value { color: #4f46e5; }
    .stat-item.done .stat-value { color: #22c55e; }

    /* Bars */
    .bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .bar-label {
      width: 60px;
      font-size: 11px;
      font-weight: 600;
    }

    .bar-label.critical { color: #cc0000; }
    .bar-label.high { color: #ff6600; }
    .bar-label.medium { color: #cc8800; }
    .bar-label.low { color: #008800; }

    .bar-count {
      width: 24px;
      text-align: right;
      font-weight: 700;
      font-size: 11px;
    }

    .bar-track {
      flex: 1;
      height: 6px;
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
      gap: 6px;
    }

    .dept-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .dept-name {
      font-size: 12px;
      font-weight: 500;
    }

    .dept-count {
      font-size: 12px;
      color: #888;
    }

    /* Footer */
    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
      border-radius: 0 0 12px 12px;
    }

    .generated-time {
      font-size: 11px;
      color: #aaa;
    }

    .footer-actions {
      display: flex;
      gap: 8px;
    }

    .btn-print, .btn-close-bottom {
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      border: 1px solid #d0d0d0;
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
      .modal-container {
        width: 95%;
        max-height: 90vh;
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
        position: static;
        background: none;
      }

      .modal-container {
        position: static;
        width: 100%;
        max-width: 100%;
        box-shadow: none;
      }

      .modal-header {
        background: #0a246a !important;
        -webkit-print-color-adjust: exact;
      }

      .btn-close, .btn-print, .btn-close-bottom {
        display: none;
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
  generatedTime: Date = new Date();
  branchName = '';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Center modal
    this.modalX = Math.max(0, (window.innerWidth - 900) / 2);
    this.modalY = Math.max(0, (window.innerHeight - 600) / 2);
    
    this.loadReport();
  }

  loadReport() {
    this.isLoading = true;
    this.error = null;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Get branch name
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}'
    );
    this.branchName = currentUser.branch_name || '';

    this.http.get<ReportData>(
      `${environment.apiUrl}/api/reports/${this.reportType}`, 
      { headers }
    ).subscribe({
      next: (data) => {
        this.reportData = data;
        this.generatedTime = new Date();
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
    return (value / total) * 100;
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
    window.print();
  }
}