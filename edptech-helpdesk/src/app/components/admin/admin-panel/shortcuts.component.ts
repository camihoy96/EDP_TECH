import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-shortcuts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>⌨️ Keyboard Shortcuts</h1>
      </div>

      <!-- Intro -->
      <div class="intro-card">
        <p>Master these keyboard shortcuts to navigate and operate EDPtech Helpdesk more efficiently. 
           Most shortcuts work across both Admin Dashboard and Client Portal.</p>
      </div>

      <div class="content">
        <!-- General Shortcuts -->
        <div class="card">
          <h2>🔧 General Shortcuts</h2>
          <table>
            <tr><td><span class="key">Ctrl + N</span></td><td>Create New Ticket</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">F5</span></td><td>Refresh Current Page Data</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Esc</span></td><td>Close Menus, Modals, and Popups</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Enter</span></td><td>Submit Search / Confirm Action</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Ctrl + S</span></td><td>Save Current Form</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Ctrl + F</span></td><td>Focus Search Box</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Ctrl + P</span></td><td>Print Current Page</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
          </table>
        </div>

        <!-- Navigation Shortcuts -->
        <div class="card">
          <h2>🧭 Navigation Shortcuts</h2>
          <table>
            <tr><td><span class="key">Alt + D</span></td><td>Go to Dashboard</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Alt + T</span></td><td>Go to Tickets</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Alt + P</span></td><td>Go to Profile</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Alt + K</span></td><td>Go to Knowledge Base</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
            <tr><td><span class="key">Alt + R</span></td><td>Go to Reports</td><td class="badge-col"><span class="badge admin">Admin/Agent</span></td></tr>
            <tr><td><span class="key">Alt + U</span></td><td>Go to User Management</td><td class="badge-col"><span class="badge admin">Admin Only</span></td></tr>
            <tr><td><span class="key">Alt + M</span></td><td>Go to Computer Monitoring</td><td class="badge-col"><span class="badge admin">Admin Only</span></td></tr>
            <tr><td><span class="key">Alt + H</span></td><td>Open AI Assistant</td><td class="badge-col"><span class="badge both">All Users</span></td></tr>
          </table>
        </div>

        <!-- Ticket Shortcuts -->
        <div class="card">
          <h2>🎫 Ticket Management Shortcuts</h2>
          <table>
            <tr><td><span class="key">Ctrl + N</span></td><td>Create New Ticket</td></tr>
            <tr><td><span class="key">Ctrl + Enter</span></td><td>Submit Ticket / Comment</td></tr>
            <tr><td><span class="key">Ctrl + 1</span></td><td>Set Priority: Critical</td></tr>
            <tr><td><span class="key">Ctrl + 2</span></td><td>Set Priority: High</td></tr>
            <tr><td><span class="key">Ctrl + 3</span></td><td>Set Priority: Medium</td></tr>
            <tr><td><span class="key">Ctrl + 4</span></td><td>Set Priority: Low</td></tr>
          </table>
        </div>

        <!-- Sidebar & View -->
        <div class="card">
          <h2>📂 Sidebar & View Shortcuts</h2>
          <table>
            <tr><td><span class="key">Ctrl + B</span></td><td>Toggle Sidebar</td></tr>
            <tr><td><span class="key">Ctrl + Shift + L</span></td><td>Switch to List View</td></tr>
            <tr><td><span class="key">Ctrl + Shift + G</span></td><td>Switch to Grid View</td></tr>
            <tr><td><span class="key">Ctrl + Shift + K</span></td><td>Switch to Kanban View</td></tr>
          </table>
        </div>

        <!-- Mouse Tips -->
        <div class="card">
          <h2>🖱️ Mouse Actions & Tips</h2>
          <ul class="tip-list">
            <li>
              <span class="tip-icon">🖱️</span>
              <div>
                <strong>Double-click ticket</strong>
                <p>Open ticket details quickly from the list view</p>
              </div>
            </li>
            <li>
              <span class="tip-icon">🔄</span>
              <div>
                <strong>Right-click on ticket</strong>
                <p>Access quick actions menu (assign, change status, etc.)</p>
              </div>
            </li>
            <li>
              <span class="tip-icon">📌</span>
              <div>
                <strong>Click sidebar header</strong>
                <p>Collapse/expand sidebar sections</p>
              </div>
            </li>
            <li>
              <span class="tip-icon">🔍</span>
              <div>
                <strong>Click outside modals</strong>
                <p>Close any open modal or dropdown menu</p>
              </div>
            </li>
            <li>
              <span class="tip-icon">📋</span>
              <div>
                <strong>Ctrl + Click on link</strong>
                <p>Open in new tab (browser default)</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Pro Tips -->
        <div class="card tips-card">
          <h2>💡 Pro Tips</h2>
          <div class="tips-grid">
            <div class="tip">
              <span>🚀</span>
              <p><strong>Speed Tip:</strong> Use <span class="key-inline">Ctrl + N</span> then <span class="key-inline">Tab</span> to quickly fill ticket fields.</p>
            </div>
            <div class="tip">
              <span>🔍</span>
              <p><strong>Search Smart:</strong> Type ticket code directly in search bar for instant results.</p>
            </div>
            <div class="tip">
              <span>📊</span>
              <p><strong>Reports:</strong> Generate quick reports from the Reports menu without navigating away.</p>
            </div>
            <div class="tip">
              <span>🤖</span>
              <p><strong>AI Help:</strong> Press <span class="key-inline">Alt + H</span> anytime for instant AI assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 20px; max-width: 900px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; color: #0a246a; font-size: 22px; }
    .back-link { color: #0a246a; text-decoration: none; font-size: 12px; }
    .back-link:hover { text-decoration: underline; }

    .intro-card {
      background: #f0f4ff; border: 1px solid #b8c8e8; padding: 14px 18px;
      border-radius: 8px; margin-bottom: 20px;
    }
    .intro-card p { margin: 0; font-size: 12px; color: #444; line-height: 1.5; }

    .content { display: grid; gap: 16px; }

    .card { background: white; border: 1px solid #c0c0c0; padding: 20px; border-radius: 8px; }
    .card h2 { margin: 0 0 14px 0; color: #0a246a; font-size: 16px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }

    table { width: 100%; border-collapse: collapse; }
    td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; color: #333; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafbff; }

    .key {
      font-weight: bold; color: #0a246a; background: #f0f4ff;
      padding: 3px 10px; border-radius: 4px; font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11px; white-space: nowrap; border: 1px solid #d0d8f0;
    }
    .key-inline {
      font-weight: bold; color: #0a246a; background: #f0f4ff;
      padding: 1px 6px; border-radius: 3px; font-family: 'Consolas', 'Courier New', monospace;
      font-size: 10px; border: 1px solid #d0d8f0;
    }

    .badge-col { width: 100px; text-align: right; }
    .badge { font-size: 9px; padding: 2px 8px; border-radius: 10px; font-weight: bold; white-space: nowrap; }
    .badge.both { background: #e8f5e9; color: #2e7d32; }
    .badge.admin { background: #fff3e0; color: #e65100; }

    /* Tips List */
    .tip-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .tip-list li { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .tip-list li:last-child { border-bottom: none; }
    .tip-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
    .tip-list strong { display: block; font-size: 12px; color: #333; margin-bottom: 2px; }
    .tip-list p { margin: 0; font-size: 11px; color: #666; }

    /* Pro Tips */
    .tips-card { background: #fffdf5; border-color: #e8d88a; }
    .tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 12px; }
    .tip { display: flex; gap: 10px; align-items: flex-start; padding: 8px; }
    .tip span { font-size: 20px; flex-shrink: 0; }
    .tip p { margin: 0; font-size: 11px; color: #555; line-height: 1.5; }

    @media (max-width: 600px) {
      .badge-col { display: none; }
      .tips-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminShortcutsComponent {}