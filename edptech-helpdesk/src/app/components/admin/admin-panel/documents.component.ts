import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-documentation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="doc-page">
      <div class="page-header">
        <h1>📖 Documentation</h1>
      </div>

      <!-- Quick Navigation -->
      <div class="doc-nav">
        <a (click)="scrollTo('getting-started')">Getting Started</a>
        <a (click)="scrollTo('tickets')">Tickets</a>
        <a (click)="scrollTo('reports')">Reports</a>
        <a (click)="scrollTo('users')">Users</a>
        <a (click)="scrollTo('monitoring')">Monitoring</a>
        <a (click)="scrollTo('ai')">AI Assistant</a>
        <a (click)="scrollTo('shortcuts')">Shortcuts</a>
      </div>

      <div class="doc-content">
        <!-- Getting Started -->
        <div class="doc-card" id="getting-started">
          <h2>🚀 Getting Started</h2>
          <p>Welcome to EDPtech Helpdesk! This comprehensive guide will help you navigate and utilize all features of the system effectively.</p>
          
          <h3>First Time Login</h3>
          <ol>
            <li>Open your browser and navigate to the system URL provided by your administrator</li>
            <li>Enter your username and password on the login page</li>
            <li>If you're a new user, you'll need a valid registration key from your administrator</li>
            <li>Upon first login, you'll be directed to your dashboard</li>
          </ol>

          <h3>Interface Overview</h3>
          <ul>
            <li><strong>Menu Bar:</strong> Top navigation with File, Edit, View, Tools, Reports, CCTV, and Help menus</li>
            <li><strong>Toolbar:</strong> Quick access buttons for common actions</li>
            <li><strong>Sidebar:</strong> Navigation links to all system modules</li>
            <li><strong>Content Area:</strong> Main workspace where pages and tickets are displayed</li>
            <li><strong>Status Bar:</strong> Bottom bar showing system status, time, and user info</li>
          </ul>
        </div>

        <!-- Ticket Management -->
        <div class="doc-card" id="tickets">
          <h2>🎫 Ticket Management</h2>
          
          <h3>Creating a Ticket</h3>
          <ol>
            <li>Click <strong>File → New Ticket</strong> or press <strong>Ctrl+N</strong></li>
            <li>Fill in the required fields:
              <ul>
                <li><strong>Title:</strong> Brief description of the issue</li>
                <li><strong>Description:</strong> Detailed explanation of the problem</li>
                <li><strong>Priority:</strong> Critical, High, Medium, or Low</li>
                <li><strong>Location/Department:</strong> Where the issue occurred</li>
                <li><strong>Category:</strong> Type of issue (Hardware, Software, Network, etc.)</li>
              </ul>
            </li>
            <li>Attach any relevant files or screenshots</li>
            <li>Click <strong>Submit</strong> to create the ticket</li>
          </ol>

          <h3>Managing Tickets</h3>
          <ul>
            <li><strong>View All Tickets:</strong> Navigate to Tickets section in the sidebar</li>
            <li><strong>Search:</strong> Use the search bar to find tickets by code, title, or keyword</li>
            <li><strong>Filter:</strong> Filter by status, priority, location, or date</li>
            <li><strong>Assign:</strong> Admins and agents can assign tickets to team members</li>
            <li><strong>Update Status:</strong> Change ticket status as work progresses</li>
            <li><strong>Add Comments:</strong> Communicate with team members and clients on tickets</li>
          </ul>

          <h3>Ticket Status Flow</h3>
          <div class="status-flow">
            <span class="flow-step new">New</span> →
            <span class="flow-step assigned">Assigned</span> →
            <span class="flow-step progress">In Progress</span> →
            <span class="flow-step pending">Pending</span> →
            <span class="flow-step resolved">Resolved</span> →
            <span class="flow-step closed">Closed</span>
          </div>
        </div>

        <!-- Reports -->
        <div class="doc-card" id="reports">
          <h2>📊 Reports & Analytics</h2>
          
          <h3>Available Reports</h3>
          <ul>
            <li><strong>Daily Report:</strong> Summary of today's ticket activity</li>
            <li><strong>Weekly Report:</strong> Last 7 days performance overview</li>
            <li><strong>Monthly Report:</strong> 30-day comprehensive analysis</li>
            <li><strong>SLA Performance:</strong> Service Level Agreement compliance metrics</li>
            <li><strong>Agent Performance:</strong> Individual agent productivity statistics</li>
          </ul>

          <h3>Generating Reports</h3>
          <ol>
            <li>Click <strong>Reports</strong> in the menu bar</li>
            <li>Select the desired report type</li>
            <li>The report modal will display with charts and data</li>
            <li>Use the <strong>Print</strong> button to print or save as PDF</li>
          </ol>
        </div>

        <!-- User Management -->
        <div class="doc-card" id="users">
          <h2>👥 User & Department Management</h2>
          
          <h3>Managing Users (Admin Only)</h3>
          <ul>
            <li>Navigate to <strong>Sidebar → User Management</strong></li>
            <li>View all registered users with their roles and departments</li>
            <li>Add new users, edit existing profiles, or deactivate accounts</li>
            <li>Assign roles: Admin, Agent, or Client</li>
          </ul>

          <h3>Departments</h3>
          <ul>
            <li>Navigate to <strong>Admin → Departments</strong></li>
            <li>Create and manage organizational departments</li>
            <li>Assign department roles and permissions</li>
          </ul>

          <h3>Registration Keys</h3>
          <ul>
            <li>Navigate to <strong>Admin → Registration Keys</strong></li>
            <li>Generate new keys for user registration</li>
            <li>Track used and active keys</li>
            <li>Keys can be set to expire for temporary access</li>
          </ul>
        </div>

        <!-- Computer Monitoring -->
        <div class="doc-card" id="monitoring">
          <h2>💻 Computer Network Monitoring</h2>
          
          <h3>Overview</h3>
          <p>The Computer Monitoring module automatically discovers and tracks devices on your network, providing detailed information about each device.</p>

          <h3>Features</h3>
          <ul>
            <li><strong>Network Scanning:</strong> Automatically discovers devices using ARP and nmap</li>
            <li><strong>Device Details:</strong> Computer name, IP address, MAC address, vendor</li>
            <li><strong>OS Detection:</strong> Identifies Windows, Linux, and other operating systems</li>
            <li><strong>Port Scanning:</strong> Detects open ports and running services</li>
            <li><strong>License Tracking:</strong> Monitors Microsoft Windows license status and expiry</li>
          </ul>

          <h3>How to Use</h3>
          <ol>
            <li>Navigate to <strong>Sidebar → Computer Monitoring</strong></li>
            <li>Click <strong>Scan Network</strong> to discover devices</li>
            <li>View device statistics by type, OS, and vendor</li>
            <li>Click on individual devices for detailed information</li>
          </ol>
        </div>

        <!-- AI Assistant -->
        <div class="doc-card" id="ai">
          <h2>🤖 AI-Powered Assistant</h2>
          
          <h3>About the AI Assistant</h3>
          <p>The EDPtech AI Assistant is powered by Google Gemini 2.5 Flash, providing intelligent responses to your questions about the system and technical issues.</p>

          <h3>How to Access</h3>
          <ol>
            <li>Click <strong>Help → AI Assistant</strong> in the menu bar</li>
            <li>The chat panel will open in the bottom-right corner</li>
            <li>Type your question and press Enter</li>
            <li>The AI will respond with helpful information</li>
          </ol>

          <h3>What You Can Ask</h3>
          <ul>
            <li>How to create and manage tickets</li>
            <li>System feature explanations</li>
            <li>Technical troubleshooting guidance</li>
            <li>Report generation assistance</li>
            <li>General IT support questions</li>
          </ul>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="doc-card" id="shortcuts">
          <h2>⌨️ Keyboard Shortcuts</h2>
          
          <table class="shortcut-table">
            <thead>
              <tr><th>Shortcut</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr><td class="key">Ctrl + N</td><td>Create New Ticket</td></tr>
              <tr><td class="key">F5</td><td>Refresh Data</td></tr>
              <tr><td class="key">Esc</td><td>Close Menus / Modals</td></tr>
              <tr><td class="key">Enter</td><td>Search (in search box)</td></tr>
              <tr><td class="key">Ctrl + F</td><td>Focus Search</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Need Help -->
        <div class="doc-card help-card">
          <h2>📞 Need More Help?</h2>
          <div class="help-grid">
            <div class="help-item">
              <span>🌐</span>
              <strong>Online Docs</strong>
              <a href="https://edptech.com/docs" target="_blank">edptech.com/docs</a>
            </div>
            <div class="help-item">
              <span>📧</span>
              <strong>Email</strong>
              <a href="mailto:support&#64;edptech.com">support&#64;edptech.com</a>
            </div>
            <div class="help-item">
              <span>📞</span>
              <strong>Phone</strong>
              <p>Mon–Fri 8AM–5PM</p>
            </div>
            <div class="help-item">
              <span>🤖</span>
              <strong>AI Assistant</strong>
              <p>Available 24/7 in-app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doc-page { padding: 20px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; color: #0a246a; font-size: 22px; }
    .back-link { color: #0a246a; text-decoration: none; font-size: 12px; }
    .back-link:hover { text-decoration: underline; }

    /* Quick Nav */
    .doc-nav {
      display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 20px;
      background: white; border: 1px solid #c0c0c0; border-radius: 6px; padding: 8px 12px;
    }
    .doc-nav a {
      padding: 4px 12px; cursor: pointer; font-size: 11px; color: #0a246a;
      border-radius: 3px; text-decoration: none;
    }
    .doc-nav a:hover { background: #e8f0ff; }

    .doc-content { display: grid; gap: 16px; }

    .doc-card {
      background: white; border: 1px solid #c0c0c0; padding: 24px; border-radius: 8px;
    }
    .doc-card h2 { margin: 0 0 16px 0; color: #0a246a; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .doc-card h3 { margin: 16px 0 8px 0; color: #333; font-size: 14px; }
    .doc-card p { font-size: 12px; color: #444; line-height: 1.6; margin: 0 0 8px 0; }
    ul, ol { margin: 0 0 12px 0; padding-left: 20px; }
    li { padding: 3px 0; font-size: 12px; color: #444; line-height: 1.5; }
    li strong { color: #333; }
    a { color: #0a246a; }

    /* Status Flow */
    .status-flow {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 11px;
    }
    .flow-step { padding: 4px 10px; border-radius: 4px; font-weight: bold; color: white; }
    .flow-step.new { background: #2196f3; }
    .flow-step.assigned { background: #ff9800; }
    .flow-step.progress { background: #886600; }
    .flow-step.pending { background: #ffaa00; color: #333; }
    .flow-step.resolved { background: #008800; }
    .flow-step.closed { background: #999; }

    /* Shortcut Table */
    .shortcut-table { width: 100%; border-collapse: collapse; }
    .shortcut-table th { background: #f0f4f8; padding: 8px 12px; text-align: left; font-size: 11px; color: #555; border: 1px solid #ddd; }
    .shortcut-table td { padding: 8px 12px; font-size: 12px; border: 1px solid #eee; color: #333; }
    .key { font-family: monospace; background: #f0f4ff; color: #0f1013; padding: 2px 8px; border-radius: 3px; font-weight: bold; }

    /* Help Card */
    .help-card { background: #f8f9fa; }
    .help-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .help-item { text-align: center; padding: 12px; }
    .help-item span { font-size: 24px; display: block; margin-bottom: 8px; }
    .help-item strong { display: block; font-size: 12px; color: #333; margin-bottom: 4px; }
    .help-item p, .help-item a { font-size: 11px; color: #666; margin: 0; }

    @media (max-width: 600px) {
      .help-grid { grid-template-columns: 1fr 1fr; }
      .status-flow { font-size: 9px; gap: 4px; }
    }
  `]
})
export class AdminDocumentationComponent {
  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}