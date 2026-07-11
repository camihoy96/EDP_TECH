import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-container">
      <!-- Header -->
      <div class="page-header">
        <h2>ℹ️ About Portal</h2>
        <p>Information about the EDPtech Helpdesk System</p>
      </div>

      <!-- Main Info Card -->
      <div class="about-card main-card">
        <div class="app-logo">🖥️</div>
        <h3>My Support Portal v2.0</h3>
        <p class="subtitle">Part of EDPtech Helpdesk System</p>
        <div class="divider"></div>
        <p class="description">
          A comprehensive helpdesk solution for managing IT support tickets, 
          requisitions, and job orders across all branches.
        </p>
      </div>

      <!-- Features Card -->
      <div class="about-card">
        <h3>✨ Features</h3>
        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon">🎫</span>
            <div>
              <strong>Ticket Management</strong>
              <p>Create, track, and manage IT support tickets with priority levels and real-time status updates.</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📩</span>
            <div>
              <strong>Requisitions</strong>
              <p>Submit and track requisition requests with multi-level approval workflow.</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📋</span>
            <div>
              <strong>Job Orders</strong>
              <p>Create and monitor job orders for maintenance, repairs, and service requests.</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <div>
              <strong>Statistics & Reports</strong>
              <p>View department statistics, SLA compliance, and performance metrics.</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔔</span>
            <div>
              <strong>Notifications</strong>
              <p>Stay updated with real-time notifications for your tickets, requisitions, and job orders.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Support Info Card -->
      <div class="about-card">
        <h3>📞 Support Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">IT Support Hotline</span>
            <span class="info-value">ext. 521</span>
          </div>
          <div class="info-item">
            <span class="info-label">Emergency Line</span>
            <span class="info-value">ext. 890</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email Support</span>
            <span class="info-value">support&#64;edptech.com</span>
          </div>
          <div class="info-item">
            <span class="info-label">Support Hours</span>
            <span class="info-value">Mon - Sun, 8AM - 7PM</span>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="about-card">
        <h3>🔗 Quick Links</h3>
        <div class="quick-links">
  <a routerLink="/client/tickets/new" class="quick-link">🎫 Create Ticket</a>
  <a routerLink="/client/tickets" class="quick-link">📋 My Tickets</a>
  <a routerLink="/client/request" class="quick-link">📩 My Requisitions</a>
  <a routerLink="/client/job-orders" class="quick-link">📋 My Job Orders</a>
  <a routerLink="/client/sla-info" class="quick-link">📊 SLA Information</a>
  <a routerLink="/client/faq" class="quick-link">❓ FAQ</a>
</div>
      </div>  
    </div>
  `,
  styles: [`
    .about-container {
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

    .about-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .about-card h3 {
      color: #0f172a;
      margin: 0 0 16px 0;
      font-size: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
    }

    /* Main Card */
    .main-card {
      text-align: center;
    }

    .app-logo {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .main-card h3 {
      border-bottom: none;
      margin-bottom: 4px;
      font-size: 18px;
      color: #0a246a;
    }

    .subtitle {
      color: #666;
      font-size: 13px;
      margin: 0 0 12px 0;
    }

    .divider {
      width: 40px;
      height: 3px;
      background: #0a246a;
      margin: 12px auto;
      border-radius: 2px;
    }

    .description {
      color: #555;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
    }

    /* Features */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .feature-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .feature-icon {
      font-size: 22px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .feature-item strong {
      display: block;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .feature-item p {
      margin: 0;
      font-size: 12px;
      color: #777;
      line-height: 1.4;
    }

    /* Support Info */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .info-value {
      font-size: 13px;
      color: #0f172a;
      font-weight: 500;
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
    }

    .quick-link:hover {
      background: #f0f4ff;
      border-color: #0a246a;
      color: #0a246a;
    }

    /* Version Card */
    .version-card {
      text-align: center;
    }

    .version-info {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .version-label {
      color: #888;
    }

    .version-value {
      color: #0f172a;
      font-weight: 600;
    }

    .copyright {
      color: #aaa;
      font-size: 11px;
      margin: 12px 0 0 0;
    }

    .back-link {
      text-align: center;
      margin-top: 8px;
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
      .info-grid {
        grid-template-columns: 1fr;
      }

      .quick-links {
        grid-template-columns: 1fr;
      }

      .about-card {
        padding: 18px;
      }
    }
  `]
})
export class ClientAboutComponent {}