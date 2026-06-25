import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-shortcuts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="shortcuts-container">
      <div class="page-header">
        <h2>⌨️ Keyboard Shortcuts</h2>
      </div>
      <div class="shortcuts-list">
        <div class="shortcut-item">
          <span class="keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
          <span class="desc">New Ticket</span>
        </div>
        <div class="shortcut-item">
          <span class="keys"><kbd>Enter</kbd></span>
          <span class="desc">Search (in search box)</span>
        </div>
        <div class="shortcut-item">
          <span class="keys"><kbd>F5</kbd></span>
          <span class="desc">Refresh</span>
        </div>
        <div class="shortcut-item">
          <span class="keys"><kbd>Esc</kbd></span>
          <span class="desc">Close menus</span>
        </div>
      </div>
      <div class="back-link">
        <a routerLink="/client/dashboard">← Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-container { padding: 20px; max-width: 500px; margin: 0 auto; }
    .page-header { text-align: center; margin-bottom: 20px; }
    .page-header h2 { color: #0a246a; margin: 0; }
    .shortcuts-list { display: flex; flex-direction: column; gap: 8px; }
    .shortcut-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border: 1px solid #c0c0c0; border-radius: 6px; }
    .keys { font-size: 12px; }
    kbd { background: #eee; border: 1px solid #aaa; border-radius: 3px; padding: 2px 6px; font-size: 11px; font-family: monospace; }
    .desc { font-size: 12px; color: #555; }
    .back-link { text-align: center; margin-top: 20px; }
    .back-link a { color: #0a246a; text-decoration: none; }
  `]
})
export class ClientShortcutsComponent {}