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
        <p>Quick navigation shortcuts for faster access</p>
      </div>

      <!-- Navigation Shortcuts -->
      <div class="shortcut-section">
        <h3>🧭 Navigation</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>D</kbd></span>
            <span class="desc">Go to Dashboard</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>T</kbd></span>
            <span class="desc">Go to Tickets</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>R</kbd></span>
            <span class="desc">Go to Requisitions</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>J</kbd></span>
            <span class="desc">Go to Job Orders</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>S</kbd></span>
            <span class="desc">Go to SLA Info</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>A</kbd></span>
            <span class="desc">Go to About</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Alt</kbd> + <kbd>H</kbd></span>
            <span class="desc">Go to FAQ / Help</span>
          </div>
        </div>
      </div>

      <!-- Action Shortcuts -->
      <div class="shortcut-section">
        <h3>⚡ Quick Actions</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
            <span class="desc">Create New Ticket</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></span>
            <span class="desc">Create New Requisition</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd></span>
            <span class="desc">Create New Job Order</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Enter</kbd></span>
            <span class="desc">Search (when in search box)</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Esc</kbd></span>
            <span class="desc">Close menus / modals</span>
          </div>
        </div>
      </div>

      <!-- General Shortcuts -->
      <div class="shortcut-section">
        <h3>🖥️ General</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="keys"><kbd>F5</kbd></span>
            <span class="desc">Refresh current page</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Ctrl</kbd> + <kbd>F</kbd></span>
            <span class="desc">Find / Search on page</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Ctrl</kbd> + <kbd>P</kbd></span>
            <span class="desc">Print current page</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Tab</kbd></span>
            <span class="desc">Move to next field</span>
          </div>
          <div class="shortcut-item">
            <span class="keys"><kbd>Shift</kbd> + <kbd>Tab</kbd></span>
            <span class="desc">Move to previous field</span>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="shortcut-section">
        <h3>🔗 Quick Links</h3>
        <div class="quick-links">
          <a routerLink="/client/tickets/new" class="quick-link">🎫 Create Ticket</a>
          <a routerLink="/client/tickets" class="quick-link">📋 My Tickets</a>
          <a routerLink="/client/request" class="quick-link">📩 My Requisitions</a>
          <a routerLink="/client/job-orders" class="quick-link">📋 My Job Orders</a>
          <a routerLink="/client/department-stats" class="quick-link">📊 Department Stats</a>
          <a routerLink="/client/system-status" class="quick-link">🩺 System Status</a>
          <a routerLink="/client/sla-info" class="quick-link">📋 SLA Information</a>
          <a routerLink="/client/faq" class="quick-link">❓ FAQ</a>
          <a routerLink="/client/about" class="quick-link">ℹ️ About</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-container {
      padding: 20px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .page-header h2 {
      color: #0a246a;
      margin: 0;
      font-size: 22px;
    }

    .page-header p {
      color: #666;
      margin: 4px 0 0 0;
      font-size: 13px;
    }

    .shortcut-section {
      margin-bottom: 20px;
    }

    .shortcut-section h3 {
      color: #0f172a;
      font-size: 14px;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: border-color 0.15s;
    }

    .shortcut-item:hover {
      border-color: #b0b0b0;
    }

    .keys {
      font-size: 12px;
      flex-shrink: 0;
    }

    kbd {
      background: #f4f4f4;
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 2px 7px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #333;
      box-shadow: 0 1px 0 #bbb;
    }

    .desc {
      font-size: 12px;
      color: #555;
      text-align: right;
    }

    /* Quick Links */
    .quick-links {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .quick-link {
      display: block;
      padding: 10px 14px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      text-decoration: none;
      color: #333;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.15s;
      text-align: center;
    }

    .quick-link:hover {
      background: #f0f4ff;
      border-color: #0a246a;
      color: #0a246a;
    }

    .back-link {
      text-align: center;
      margin-top: 20px;
    }

    .back-link a {
      color: #0a246a;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .back-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 500px) {
      .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .desc {
        text-align: left;
      }

      .quick-links {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClientShortcutsComponent {}