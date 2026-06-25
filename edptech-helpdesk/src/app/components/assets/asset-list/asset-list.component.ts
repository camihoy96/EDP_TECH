import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="assets-container">
      <div class="section-header">
        <div class="section-title">🖥 Asset Management</div>
        <button class="btn btn-primary btn-sm" (click)="showAddAsset = !showAddAsset">+ Add Asset</button>
      </div>

      <!-- Add Asset Form -->
      <div class="card" *ngIf="showAddAsset">
        <h3>Register New Asset</h3>
        <div class="form-grid">
          <input class="form-input" placeholder="Asset Tag" [(ngModel)]="newAsset.tag">
          <input class="form-input" placeholder="Asset Name" [(ngModel)]="newAsset.name">
          <input class="form-input" placeholder="Model" [(ngModel)]="newAsset.model">
          <input class="form-input" placeholder="Serial Number" [(ngModel)]="newAsset.serial">
          <select class="form-input" [(ngModel)]="newAsset.type">
            <option>Desktop PC</option><option>Laptop</option><option>Monitor</option>
            <option>Printer</option><option>Network Switch</option>
          </select>
          <select class="form-input" [(ngModel)]="newAsset.status">
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-success" (click)="addAsset()">Save Asset</button>
          <button class="btn btn-ghost" (click)="showAddAsset = false">Cancel</button>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="card">
        <table class="data-table">
          <thead>
            <tr><th>Asset Tag</th><th>Name</th><th>Type</th><th>Status</th><th>Location</th><th>Assigned To</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let asset of assets">
              <td><span class="asset-tag">{{ asset.tag }}</span></td>
              <td><strong>{{ asset.name }}</strong><br><small>{{ asset.model }}</small></td>
              <td>{{ asset.type }}</td>
              <td><span class="status-badge" [class]="'status-' + asset.status">{{ asset.status }}</span></td>
              <td>{{ asset.location || '—' }}</td>
              <td>{{ asset.assignedTo || '—' }}</td>
            </tr>
            <tr *ngIf="assets.length === 0">
              <td colspan="6" class="empty-cell">No assets registered yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .assets-container { padding: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-title { font-size: 18px; font-weight: 700; }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
    .btn-primary { background: linear-gradient(135deg, #4f8ef7, #7c6af7); color: white; }
    .btn-success { background: #22c55e; color: white; }
    .btn-ghost { background: #191c24; color: #e8eaf0; border: 1px solid #272b38; }
    .btn-sm { padding: 6px 14px; font-size: 12px; }
    .card { background: #111318; border: 1px solid #272b38; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .form-input {
      background: #191c24; border: 1px solid #272b38; border-radius: 8px;
      padding: 10px; color: #e8eaf0; width: 100%;
    }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px; background: #191c24; color: #8b90a4; font-size: 11px; text-transform: uppercase; }
    .data-table td { padding: 12px; border-bottom: 1px solid #272b38; }
    .asset-tag { font-family: monospace; color: #4f8ef7; background: rgba(79,142,247,.1); padding: 2px 6px; border-radius: 4px; }
    .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-active { background: rgba(34,197,94,.15); color: #4ade80; }
    .status-maintenance { background: rgba(245,158,11,.15); color: #fbbf24; }
    .status-retired { background: rgba(156,163,175,.15); color: #9ca3af; }
    .empty-cell { text-align: center; color: #8b90a4; padding: 40px; }
  `]
})
export class AssetListComponent {
  showAddAsset = false;
  assets = [
    { tag: 'PC-IT-001', name: 'Dell OptiPlex', model: '7080', type: 'Desktop PC', status: 'active', location: 'Floor 3', assignedTo: 'John Smith' },
    { tag: 'LAP-HR-001', name: 'Lenovo ThinkPad', model: 'X1 Carbon', type: 'Laptop', status: 'active', location: 'Floor 2', assignedTo: 'Alice Johnson' }
  ];
  newAsset = { tag: '', name: '', model: '', serial: '', type: 'Desktop PC', status: 'active' };

  addAsset() {
    if (this.newAsset.tag && this.newAsset.name) {
      this.assets.push({ ...this.newAsset, location: '—', assignedTo: '—' });
      this.newAsset = { tag: '', name: '', model: '', serial: '', type: 'Desktop PC', status: 'active' };
      this.showAddAsset = false;
    }
  }
}