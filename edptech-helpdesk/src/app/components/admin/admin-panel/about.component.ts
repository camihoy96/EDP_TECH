import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-page">
      <!-- Hero Section -->
      <div class="hero-card">
        <div class="hero-logo">
    <img src="assets/images/EDP.png" alt="EDPtech Logo" class="logo-img">
  </div>
        <h2>EDPtech Helpdesk System v2.0</h2>
        <p class="hero-subtitle">Enterprise IT Support Management Platform</p>
        <p class="hero-description">
          A comprehensive helpdesk solution designed to streamline IT support operations, 
          manage tickets efficiently, monitor network infrastructure, and provide 
          AI-powered assistance to both administrators and end-users.
        </p>
      </div>

      <div class="about-content">
        <!-- System Overview -->
        <div class="about-card">
          <h2>📋 System Overview</h2>
          <p>
            EDPtech Helpdesk is a full-featured IT service management (ITSM) platform 
            built with modern technologies. It provides a centralized system for managing 
            support tickets, tracking assets, monitoring network devices, and facilitating 
            communication between IT staff and end-users.
          </p>
          <p>
            The system features a dual-interface design: an <strong>Admin Dashboard</strong> for 
            IT personnel and agents, and a <strong>Client Portal</strong> for employees to submit 
            and track their support requests.
          </p>
        </div>

        <!-- Key Features -->
        <div class="about-card">
          <h2>🚀 Key Features</h2>
          <div class="features-grid">
            <div class="feature-item">
              <span class="feature-icon">🎫</span>
              <div>
                <strong>Ticket Management</strong>
                <p>Create, assign, track, and resolve support tickets with priority levels, 
                categories, and SLA tracking. Supports file attachments and comments.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <div>
                <strong>AI-Powered Assistant</strong>
                <p>Integrated Google Gemini AI assistant that provides instant help, 
                answers questions about the system, and offers technical guidance.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💻</span>
              <div>
                <strong>Network Monitoring</strong>
                <p>Automatically discover devices on your network, track hardware specs, 
                monitor license status, and identify device types and vendors.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <div>
                <strong>Reporting & Analytics</strong>
                <p>Generate daily, weekly, and monthly reports. Track SLA compliance, 
                agent performance, ticket distribution, and department metrics.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">👥</span>
              <div>
                <strong>User Management</strong>
                <p>Manage users, departments, and roles. Control access with registration 
                keys and role-based permissions for admins, agents, and clients.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📋</span>
              <div>
                <strong>Job Orders & Requisitions</strong>
                <p>Process internal job orders and requisitions with approval workflows, 
                status tracking, and notifications.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <div>
                <strong>Internal Chat</strong>
                <p>Real-time messaging between team members for quick collaboration 
                and ticket discussions.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <div>
                <strong>Knowledge Base</strong>
                <p>Create and share articles, solutions, and documentation to help 
                users resolve common issues independently.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Specs -->
        <div class="about-card">
          <h2>🔧 Technical Specifications</h2>
          <div class="tech-grid">
            <div class="tech-item">
              <span class="tech-label">Frontend</span>
              <span class="tech-value">Angular 17+ (Standalone Components)</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Backend</span>
              <span class="tech-value">Python Flask REST API</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Database</span>
              <span class="tech-value">MySQL / MariaDB</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">AI Engine</span>
              <span class="tech-value">Google Gemini 2.5 Flash</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Security</span>
              <span class="tech-value">JWT Authentication + Auto-Logout</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Network Tools</span>
              <span class="tech-value">Nmap + ARP Scanning + WMI</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Version</span>
              <span class="tech-value">2.0.0 (Build 2024.06)</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">License</span>
              <span class="tech-value">Proprietary - EDPtech</span>
            </div>
          </div>
        </div>

        <!-- User Roles -->
        <div class="about-card">
          <h2>👤 User Roles & Permissions</h2>
          <div class="roles-grid">
            <div class="role-card admin">
              <h3>🔧 Administrator</h3>
              <ul>
                <li>Full system access</li>
                <li>User & department management</li>
                <li>System configuration</li>
                <li>Database backup/restore</li>
                <li>Registration key management</li>
                <li>Access to all reports</li>
              </ul>
            </div>
            <div class="role-card agent">
              <h3>🎫 Agent / IT Support</h3>
              <ul>
                <li>Ticket management</li>
                <li>Assign & resolve tickets</li>
                <li>View reports</li>
                <li>Knowledge base management</li>
                <li>Internal chat</li>
              </ul>
            </div>
            <div class="role-card client">
              <h3>👤 Client / Employee</h3>
              <ul>
                <li>Submit support tickets</li>
                <li>Track ticket status</li>
                <li>Access knowledge base</li>
                <li>Submit job orders & requests</li>
                <li>Contact IT support</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Getting Started -->
        <div class="about-card">
          <h2>🚀 Getting Started</h2>
          <div class="steps">
            <div class="step">
              <span class="step-number">1</span>
              <div>
                <strong>Login</strong>
                <p>Access the system using your credentials. New users need a valid registration key.</p>
              </div>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <div>
                <strong>Explore the Dashboard</strong>
                <p>View system overview, recent activity, and key metrics at a glance.</p>
              </div>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <div>
                <strong>Create or View Tickets</strong>
                <p>Submit new tickets via File → New Ticket or press Ctrl+N. Track existing tickets in the Tickets section.</p>
              </div>
            </div>
            <div class="step">
              <span class="step-number">4</span>
              <div>
                <strong>Use the AI Assistant</strong>
                <p>Click Help → AI Assistant for instant help with any system feature or technical question.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Support -->
        <div class="about-card support-card">
          <h2>📞 Support & Contact</h2>
          <div class="support-grid">
            <div class="support-item">
              <span class="s-icon">📧</span>
              <strong>Email Support</strong>
              <p>support&#64;edptech.com</p>
            </div>
            <div class="support-item">
              <span class="s-icon">📞</span>
              <strong>Phone</strong>
              <p>Mon–Fri 8AM–5PM</p>
            </div>
            <div class="support-item">
              <span class="s-icon">🆘</span>
              <strong>Emergency</strong>
              <p>ext. 9911 (24/7)</p>
            </div>
            <div class="support-item">
              <span class="s-icon">🌐</span>
              <strong>Website</strong>
              <p><a href="https://edptech.com" target="_blank">edptech.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .about-page { padding: 20px; max-width: 1000px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; color: #0a246a; font-size: 22px; }
    .back-link { color: #0a246a; text-decoration: none; font-size: 12px; }
    .back-link:hover { text-decoration: underline; }
    .logo-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 16px;
  background: white;
  padding: 12px;
}
    /* Hero */
    .hero-card {
      background: linear-gradient(135deg, #0a246a, #1a3a8a);
      color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;
    }
    .hero-icon { font-size: 48px; margin-bottom: 12px; }
    .hero-card h2 { margin: 0 0 8px 0; font-size: 24px; }
    .hero-subtitle { font-size: 14px; opacity: 0.9; margin: 0 0 12px 0; }
    .hero-description { font-size: 12px; opacity: 0.8; max-width: 700px; margin: 0 auto; line-height: 1.6; }

    .about-content { display: grid; gap: 16px; }

    /* Cards */
    .about-card {
      background: white; border: 1px solid #c0c0c0; padding: 24px; border-radius: 8px;
    }
    .about-card h2 { margin: 0 0 16px 0; color: #0a246a; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .about-card p { font-size: 12px; color: #444; line-height: 1.6; margin: 0 0 8px 0; }

    /* Features Grid */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; }
    .feature-item { display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; }
    .feature-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
    .feature-item strong { display: block; font-size: 13px; color: #0a246a; margin-bottom: 4px; }
    .feature-item p { font-size: 11px; color: #555; margin: 0; line-height: 1.5; }

    /* Tech Specs */
    .tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 8px; }
    .tech-item { display: flex; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; }
    .tech-label { font-weight: bold; color: #555; min-width: 100px; font-size: 11px; }
    .tech-value { color: #333; font-size: 11px; }

    /* Roles */
    .roles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .role-card { padding: 16px; border-radius: 8px; border-left: 4px solid; color: #333; }
    .role-card.admin { background: #f0f4ff; border-color: #0a246a; }
    .role-card.agent { background: #fff8f0; border-color: #ff9800; }
    .role-card.client { background: #f0fff0; border-color: #008800; }
    .role-card h3 { margin: 0 0 8px 0; font-size: 14px; }
    .role-card ul { margin: 0; padding-left: 18px; }
    .role-card li { font-size: 11px; color: #444; padding: 2px 0; }

    /* Steps */
    .steps { display: flex; flex-direction: column; gap: 12px; }
    .step { display: flex; gap: 16px; align-items: flex-start; }
    .step-number {
      width: 32px; height: 32px; border-radius: 50%; background: #0a246a; color: white;
      display: flex; align-items: center; justify-content: center; font-weight: bold;
      font-size: 14px; flex-shrink: 0;
    }
    .step strong { display: block; color: #0a246a; font-size: 13px; margin-bottom: 2px; }
    .step p { font-size: 11px; color: #555; margin: 0; }

    /* Support */
    .support-card { background: #f8f9fa; }
    .support-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .support-item { text-align: center; padding: 12px; }
    .s-icon { font-size: 28px; display: block; margin-bottom: 8px; }
    .support-item strong { display: block; font-size: 12px; color: #333; margin-bottom: 4px; }
    .support-item p { font-size: 11px; color: #666; margin: 0; }
    .support-item a { color: #0a246a; text-decoration: none; }
    .support-item a:hover { text-decoration: underline; }

    /* Footer */
    .about-footer { text-align: center; padding: 16px; color: #888; font-size: 11px; }
    .about-footer p { margin: 0; }
    .version { color: #aaa; font-size: 10px; margin-top: 4px; }

    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr; }
      .roles-grid { grid-template-columns: 1fr; }
      .tech-grid { grid-template-columns: 1fr; }
      .support-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class AdminAboutComponent {}