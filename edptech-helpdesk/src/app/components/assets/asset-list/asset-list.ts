import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="asset-list">
      <h2>Asset Management</h2>
      <div class="assets-table">
        <table>
          <thead>
            <tr><th>Asset Tag</th><th>Name</th><th>Type</th><th>Status</th><th>Location</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let asset of assets">
              <td>{{ asset.tag }}</td>
              <td>{{ asset.name }}</td>
              <td>{{ asset.type }}</td>
              <td>{{ asset.status }}</td>
              <td>{{ asset.location }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .asset-list { padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  `]
})
export class AssetListComponent {
  assets = [
    { tag: 'PC-001', name: 'Dell OptiPlex', type: 'Desktop', status: 'Active', location: 'Floor 3' },
    { tag: 'NB-001', name: 'Lenovo ThinkPad', type: 'Laptop', status: 'Active', location: 'HR Dept' }
  ];
}