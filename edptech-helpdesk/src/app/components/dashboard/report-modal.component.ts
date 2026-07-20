import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
     <div class="modal-overlay" (click)="close()">
      <div class="report-modal-content" id="reportModal" (click)="$event.stopPropagation()" 
           [class.is-dragging]="isDragging"
           [style.left.px]="isDragging ? modalPosition.x : null"
           [style.top.px]="isDragging ? modalPosition.y : null">
        <div class="report-modal-header modal-header-handle" (mousedown)="startDrag($event)">
          <h3>{{ title }}</h3>
          <div class="modal-actions">
            <button class="btn btn-sm" (click)="print()">🖨️ Print</button>
            <button class="modal-close-btn" (click)="close()">✕</button>
          </div>
        </div>
        
        <div class="report-modal-body">
          <!-- Loading -->
          <div class="loading-state" *ngIf="loading">
            <div class="spinner"></div>
            <p>Loading report data...</p>
          </div>

          <!-- Error State -->
          <div class="loading-state" *ngIf="error && !loading">
            <p style="color: #cc0000;">❌ {{ error }}</p>
            <button class="btn btn-sm" (click)="retry()" style="margin-top: 10px;">🔄 Retry</button>
          </div>

          <!-- No Data -->
          <div class="loading-state" *ngIf="!loading && !error && !reportData">
            <p>No report data available.</p>
          </div>

          <!-- Report Data -->
          <div class="print-area" *ngIf="!loading && !error && reportData">
            <!-- Period Label -->
            <div class="report-period" *ngIf="reportData.periodLabel">
              <span class="period-icon">📅</span>
              <span>{{ reportData.periodLabel }}</span>
            </div>

            <!-- Summary -->
            <div class="report-summary">
              <div class="report-stat">
                <div class="stat-value">{{ reportData.totalTickets }}</div>
                <div class="stat-label">Total</div>
              </div>
              <div class="report-stat open">
                <div class="stat-value">{{ reportData.openTickets }}</div>
                <div class="stat-label">Open</div>
              </div>
              <div class="report-stat resolved">
                <div class="stat-value">{{ reportData.resolvedTickets }}</div>
                <div class="stat-label">Resolved</div>
              </div>
              <div class="report-stat critical">
                <div class="stat-value">{{ reportData.criticalTickets }}</div>
                <div class="stat-label">Critical</div>
              </div>
              <div class="report-stat">
                <div class="stat-value">{{ reportData.avgResolutionTime }}</div>
                <div class="stat-label">Avg Resolution</div>
              </div>
              <div class="report-stat">
                <div class="stat-value">{{ reportData.slaCompliance }}%</div>
                <div class="stat-label">SLA</div>
              </div>
            </div>

            <!-- Priority Distribution -->
            <div class="report-section">
              <h4>📊 Priority Distribution</h4>
              <div class="priority-bars">
                <div class="p-bar" *ngFor="let p of reportData.priorityData">
                  <span class="p-label">{{ p.label }}</span>
                  <div class="p-track">
                    <div class="p-fill" [style.width.%]="p.percentage" [style.background]="p.color"></div>
                  </div>
                  <span class="p-count">{{ p.count }} ({{ p.percentage }}%)</span>
                </div>
              </div>
            </div>

            <!-- Department Performance -->
            <div class="report-section">
              <h4>🏢 Department Performance</h4>
              <table class="mini-table" *ngIf="reportData.departmentData?.length > 0">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total</th>
                    <th>Open</th>
                    <th>Resolved</th>
                    <th>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of reportData.departmentData">
                    <td>{{ d.name }}</td>
                    <td>{{ d.total }}</td>
                    <td><span style="color:#0066cc">{{ d.open }}</span></td>
                    <td><span style="color:#008800">{{ d.resolved }}</span></td>
                    <td>{{ d.sla }}%</td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!reportData.departmentData?.length" style="color:#888;text-align:center;">No department data available</p>
            </div>

            <!-- Recent Tickets -->
            <div class="report-section">
              <h4>🕐 Recent Tickets</h4>
              <table class="mini-table" *ngIf="reportData.recentTickets?.length > 0">
                <thead>
                  <tr>
                    <th>Ticket Code</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of reportData.recentTickets.slice(0, 10)">
                    <td><code>{{ t.ticket_number }}</code></td>
                    <td>{{ t.title }}</td>
                    <td>
                      <span class="priority-badge" [class]="t.priority">{{ t.priority }}</span>
                    </td>
                    <td>{{ t.status }}</td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!reportData.recentTickets?.length" style="color:#888;text-align:center;">No recent tickets</p>
            </div>

            <!-- ✅ Requisitions Overview -->
            <div class="report-section" *ngIf="reportData?.requisitionsData">
              <h4>📩 Requisitions Overview</h4>
              <div class="report-summary" style="grid-template-columns: repeat(5, 1fr);">
                <div class="report-stat">
                  <div class="stat-value">{{ reportData.requisitionsData.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
                <div class="report-stat" style="border-left-color: #cc6600;">
                  <div class="stat-value">{{ reportData.requisitionsData.pending }}</div>
                  <div class="stat-label">Pending</div>
                </div>
                <div class="report-stat" style="border-left-color: #0066cc;">
                  <div class="stat-value">{{ reportData.requisitionsData.approved }}</div>
                  <div class="stat-label">Approved</div>
                </div>
                <div class="report-stat resolved">
                  <div class="stat-value">{{ reportData.requisitionsData.released }}</div>
                  <div class="stat-label">Released</div>
                </div>
                <div class="report-stat" style="border-left-color: #cc6600;">
                  <div class="stat-value">{{ reportData.requisitionsData.forwarded }}</div>
                  <div class="stat-label">Forwarded</div>
                </div>
              </div>
              
              <table class="mini-table" *ngIf="reportData.requisitionsData.recent?.length > 0">
                <thead>
                  <tr>
                    <th>Req #</th>
                    <th>Request From</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of reportData.requisitionsData.recent.slice(0, 5)">
                    <td><code>{{ r.number }}</code></td>
                    <td>{{ r.requestFrom }}</td>
                    <td>
                      <span class="status-badge-sm" [ngClass]="{
                        'status-pending': r.status === 'pending',
                        'status-approved': r.status === 'approved',
                        'status-released': r.status === 'released'
                      }">{{ r.status }}</span>
                    </td>
                    <td>{{ r.date | date:'MMM d, yyyy' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ✅ Job Orders Overview -->
            <div class="report-section" *ngIf="reportData?.jobOrdersData">
              <h4>📋 Job Orders Overview</h4>
              <div class="report-summary" style="grid-template-columns: repeat(5, 1fr);">
                <div class="report-stat">
                  <div class="stat-value">{{ reportData.jobOrdersData.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
                <div class="report-stat" style="border-left-color: #cc6600;">
                  <div class="stat-value">{{ reportData.jobOrdersData.pending }}</div>
                  <div class="stat-label">Pending</div>
                </div>
                <div class="report-stat" style="border-left-color: #0066cc;">
                  <div class="stat-value">{{ reportData.jobOrdersData.assigned }}</div>
                  <div class="stat-label">Assigned</div>
                </div>
                <div class="report-stat resolved">
                  <div class="stat-value">{{ reportData.jobOrdersData.done }}</div>
                  <div class="stat-label">Done</div>
                </div>
                <div class="report-stat" style="border-left-color: #cc6600;">
                  <div class="stat-value">{{ reportData.jobOrdersData.forwarded }}</div>
                  <div class="stat-label">Forwarded</div>
                </div>
              </div>
              
              <table class="mini-table" *ngIf="reportData.jobOrdersData.recent?.length > 0">
                <thead>
                  <tr>
                    <th>JO #</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let jo of reportData.jobOrdersData.recent.slice(0, 5)">
                    <td><code>{{ jo.number }}</code></td>
                    <td>{{ jo.department }}</td>
                    <td>
                      <span class="status-badge-sm" [ngClass]="{
                        'status-pending': jo.status === 'pending',
                        'status-approved': jo.status === 'approved',
                        'status-done': jo.status === 'done',
                        'status-assigned': jo.status === 'assigned'
                      }">{{ jo.status }}</span>
                    </td>
                    <td>{{ jo.assignedNames || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }
    .report-modal-content {
      background: #fff;
      width: 95%;
      max-width: 800px;
      max-height: 85vh;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      border-radius: 0;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .report-modal-content[style*="left:"] {
      transform: none;
    }
    .report-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #0a246a;
      color: #fff;
      flex-shrink: 0;
      cursor: grab;
      user-select: none;
    }
    .report-modal-header:active {
      cursor: grabbing;
    }
    .report-modal-header h3 {
      margin: 0;
      font-size: 16px;
    }
    .modal-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .modal-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close-btn:hover {
      background: rgba(255, 0, 0, 0.5);
    }
    .btn-sm {
      padding: 4px 10px;
      font-size: 10px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      cursor: pointer;
    }
    .btn-sm:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    .report-modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .loading-state {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    .spinner {
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
    .report-period {
      text-align: center;
      padding: 6px 12px;
      background: #f0f4ff;
      border: 1px solid #d0d8f0;
      margin-bottom: 16px;
      font-size: 11px;
      color: #0a246a;
      display: inline-block;
      border-radius: 4px;
    }
    .report-period .period-icon {
      margin-right: 6px;
    }
    .report-summary {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .report-stat {
      text-align: center;
      padding: 12px 8px;
      background: #f8f9fa;
      border-left: 3px solid #0a246a;
    }
    .report-stat.open { border-left-color: #0066cc; }
    .report-stat.resolved { border-left-color: #008800; }
    .report-stat.critical { border-left-color: #cc0000; }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #333;
    }
    .stat-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .report-section {
      margin-bottom: 20px;
    }
    .report-section h4 {
      font-size: 13px;
      color: #0a246a;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
    }
    .priority-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .p-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .p-label {
      width: 70px;
      font-size: 11px;
      font-weight: 500;
      color: #050505;
    }
    .p-track {
      flex: 1;
      height: 10px;
      background: #f0f0f0;
      border-radius: 5px;
      overflow: hidden;
    }
    .p-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
    }
    .p-count {
      width: 80px;
      text-align: right;
      font-size: 10px;
      color: #888;
    }
    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .mini-table th {
      background: #f0f4f8;
      padding: 7px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #000;
      border: 1px solid #ddd;
    }
    .mini-table td {
      padding: 6px 10px;
      border: 1px solid #eee;
      color: #181717;
    }
    .mini-table code {
      font-family: monospace;
      font-size: 10px;
      background: #f5f5f5;
      padding: 2px 5px;
      border-radius: 3px;
    }
    .priority-badge {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: capitalize;
    }
      .report-modal-content {
  background: #fff;
  width: 95%;
  max-width: 800px;
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  border-radius: 0;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* ✅ When dragging, remove centering and use inline positions */
.report-modal-content.is-dragging {
  transform: none;
  margin: 0;
}
    .priority-badge.critical { background: #ffecec; color: #cc0000; }
    .priority-badge.high { background: #fff0e8; color: #cc5500; }
    .priority-badge.medium { background: #fffae8; color: #886600; }
    .priority-badge.low { background: #eeffee; color: #006600; }
    
    /* ✅ Status badges for requisitions and job orders */
    .status-badge-sm {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: capitalize;
      font-weight: 600;
    }
    .status-pending { background: #fff8e1; color: #cc6600; }
    .status-approved { background: #e8f5e9; color: #008800; }
    .status-released { background: #e8f5e9; color: #008800; }
    .status-done { background: #e8f5e9; color: #008800; }
    .status-assigned { background: #e3f2fd; color: #0066cc; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 768px) {
      .report-summary {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class ReportModalComponent {
  @Input() title: string = 'Report';
  @Input() reportData: any = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  
  @Output() closed = new EventEmitter<void>();
  @Output() printed = new EventEmitter<void>();
  @Output() retryRequest = new EventEmitter<void>();

  modalPosition = { x: 0, y: 0 };
  isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  close(): void {
    this.closed.emit();
  }

  print(): void {
    window.print();
    this.printed.emit();
  }

  retry(): void {
    this.retryRequest.emit();
  }

  startDrag(event: MouseEvent): void {
    const modal = document.getElementById('reportModal');
    if (!modal) return;

    this.isDragging = true;
    const rect = modal.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    
    this.modalPosition = { x: rect.left, y: rect.top };
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.modalPosition = {
      x: event.clientX - this.dragOffsetX,
      y: event.clientY - this.dragOffsetY
    };
  }

  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.isDragging = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    this.close();
  }
}