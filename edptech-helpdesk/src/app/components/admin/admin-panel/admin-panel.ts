import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-panel">
      <h2>Admin Panel</h2>
      <p>Admin features coming soon...</p>
    </div>
  `,
  styles: [`
    .admin-panel { padding: 20px; }
    h2 { margin-bottom: 16px; }
  `]
})
export class AdminPanelComponent {}