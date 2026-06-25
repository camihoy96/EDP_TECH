import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>🆘 Support Center</h1>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-btn primary" (click)="createTicket()">
          <span>🎫</span> Create Support Ticket
        </button>
        <button class="action-btn" (click)="openAI()">
          <span>🤖</span> Ask AI Assistant
        </button>
        <button class="action-btn" (click)="scrollTo('contact')">
          <span>📞</span> Contact Us
        </button>
      </div>

      <div class="content">
        <!-- Contact Information -->
        <div class="card contact-card" id="contact">
          <h2>📞 Contact Information</h2>
          <div class="contact-grid">
            <div class="contact-item">
              <span class="c-icon">📧</span>
              <div>
                <strong>Email Support</strong>
                <p>support&#64;edptech.com</p>
                <span class="response-time">Response: Within 4 hours</span>
              </div>
            </div>
            <div class="contact-item">
              <span class="c-icon">📞</span>
              <div>
                <strong>Phone Support</strong>
                <p>Monday – Friday, 8AM – 5PM</p>
                <span class="response-time">Available during business hours</span>
              </div>
            </div>
            <div class="contact-item">
              <span class="c-icon">🆘</span>
              <div>
                <strong>Emergency Hotline</strong>
                <p>ext. 521 (24/7)</p>
                <span class="response-time emergency">For critical system outages only</span>
              </div>
            </div>
            <div class="contact-item">
              <span class="c-icon">💬</span>
              <div>
                <strong>Live Chat</strong>
                <p>Available in-app for all users</p>
                <span class="response-time">Click 💬 in the toolbar</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ / Common Issues -->
        <div class="card">
          <h2>❓ Frequently Asked Questions</h2>
          
          <div class="faq-list">
            <div class="faq-item" *ngFor="let faq of faqs; let i = index">
              <div class="faq-question" (click)="toggleFaq(i)" [class.open]="faq.open">
                <span class="faq-arrow">{{ faq.open ? '▼' : '▶' }}</span>
                <span>{{ faq.question }}</span>
              </div>
              <div class="faq-answer" *ngIf="faq.open">
                <p>{{ faq.answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Troubleshooting Guide -->
        <div class="card">
          <h2>🔧 Troubleshooting Guide</h2>
          
          <div class="troubleshoot-item">
            <h3>🖥️ Application Not Loading</h3>
            <ol>
              <li>Check your internet connection</li>
              <li>Clear browser cache and cookies</li>
              <li>Try accessing from a different browser</li>
              <li>Verify the server is running (contact admin if unsure)</li>
            </ol>
          </div>

          <div class="troubleshoot-item">
            <h3>🤖 AI Assistant Not Responding</h3>
            <ol>
              <li>Ensure the backend server on <strong>port 5000</strong> is running</li>
              <li>Verify Gemini API key is configured in <code>.env</code> file</li>
              <li>Check that <code>google-generativeai</code> package is installed</li>
              <li>Run: <code>pip install google-generativeai</code> if missing</li>
            </ol>
          </div>

          <div class="troubleshoot-item">
            <h3>🗄️ Database Connection Error</h3>
            <ol>
              <li>Verify MySQL/MariaDB service is running on <strong>port 3307</strong></li>
              <li>Check database credentials in <code>.env</code> file</li>
              <li>Ensure the <code>edptech_helpdesk</code> database exists</li>
              <li>Restart MySQL service if needed</li>
            </ol>
          </div>

          <div class="troubleshoot-item">
            <h3>💻 Computer Monitoring Not Scanning</h3>
            <ol>
              <li>Verify <strong>nmap</strong> is installed on the server</li>
              <li>Check network range configuration in <code>computer_monitor.py</code></li>
              <li>Run the scan manually to check for errors</li>
              <li>Ensure firewall allows ARP and ping requests</li>
            </ol>
          </div>

          <div class="troubleshoot-item">
            <h3>🔑 Can't Login / Registration Key Issues</h3>
            <ol>
              <li>Verify your registration key is still active (check status bar)</li>
              <li>Contact your administrator for a new key if expired</li>
              <li>Ensure caps lock is off when entering credentials</li>
              <li>Try resetting your password via the administrator</li>
            </ol>
          </div>
        </div>

        <!-- Resources -->
        <div class="card">
          <h2>📚 Helpful Resources</h2>
          <div class="resources-grid">
            <a routerLink="/admin/documentation" class="resource-item">
              <span class="r-icon">📖</span>
              <strong>Documentation</strong>
              <p>Complete system guide</p>
            </a>
            <a routerLink="/admin/shortcuts" class="resource-item">
              <span class="r-icon">⌨️</span>
              <strong>Keyboard Shortcuts</strong>
              <p>Boost your productivity</p>
            </a>
            <a routerLink="/admin/about" class="resource-item">
              <span class="r-icon">ℹ️</span>
              <strong>About System</strong>
              <p>Version & technical info</p>
            </a>
            <a routerLink="/knowledge-base" class="resource-item">
              <span class="r-icon">📚</span>
              <strong>Knowledge Base</strong>
              <p>Self-service articles</p>
            </a>
          </div>
        </div>

        <!-- Submit Ticket Card -->
        <div class="card ticket-card">
          <h2>🎫 Still Need Help?</h2>
          <p>If you couldn't find a solution above, submit a support ticket and our team will assist you.</p>
          <button class="submit-ticket-btn" (click)="createTicket()">
            🎫 Create Support Ticket
          </button>
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

    /* Quick Actions */
    .quick-actions { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .action-btn {
      display: flex; align-items: center; gap: 6px; padding: 10px 18px;
      border: 1px solid #c0c0c0; border-radius: 6px; cursor: pointer;
      font-size: 12px; font-family: inherit; background: white; color: #333;
    }
    .action-btn:hover { background: #f0f4ff; border-color: #0a246a; }
    .action-btn.primary { background: #0a246a; color: white; border-color: #0a246a; }
    .action-btn.primary:hover { background: #1a3a8a; }
    .action-btn span { font-size: 16px; }

    .content { display: grid; gap: 16px; }

    .card { background: white; border: 1px solid #c0c0c0; padding: 24px; border-radius: 8px; }
    .card h2 { margin: 0 0 16px 0; color: #0a246a; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .card p { font-size: 12px; color: #555; margin: 0 0 8px 0; }

    /* Contact */
    .contact-card { background: linear-gradient(135deg, #f8f9ff, #fff); }
    .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
    .contact-item { display: flex; gap: 14px; padding: 14px; background: #f8f9fa; border-radius: 8px; }
    .c-icon { font-size: 28px; flex-shrink: 0; }
    .contact-item strong { display: block; font-size: 13px; color: #333; margin-bottom: 4px; }
    .contact-item p { font-size: 12px; color: #0a246a; font-weight: bold; margin: 0 0 4px 0; }
    .response-time { font-size: 10px; color: #888; }
    .response-time.emergency { color: #cc0000; font-weight: bold; }

    /* FAQ */
    .faq-list { display: flex; flex-direction: column; gap: 2px; }
    .faq-item { border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
    .faq-question {
      padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: #333; background: #fafafa; user-select: none;
    }
    .faq-question:hover { background: #f0f4ff; }
    .faq-question.open { background: #e8f0ff; font-weight: bold; color: #0a246a; }
    .faq-arrow { font-size: 10px; color: #888; flex-shrink: 0; }
    .faq-answer { padding: 14px 16px 14px 38px; background: white; }
    .faq-answer p { font-size: 12px; color: #555; line-height: 1.6; margin: 0; }

    /* Troubleshooting */
    .troubleshoot-item { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
    .troubleshoot-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .troubleshoot-item h3 { font-size: 14px; color: #333; margin: 0 0 8px 0; }
    .troubleshoot-item ol { margin: 0; padding-left: 20px; }
    .troubleshoot-item li { font-size: 12px; color: #555; padding: 3px 0; line-height: 1.5; }
    .troubleshoot-item code { background: #f0f4ff; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #0a246a; }
    .troubleshoot-item strong { color: #333; }

    /* Resources */
    .resources-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
    .resource-item {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 16px; background: #f8f9fa; border-radius: 8px; text-decoration: none;
      border: 1px solid #e8e8e8; transition: all 0.2s;
    }
    .resource-item:hover { background: #e8f0ff; border-color: #0a246a; transform: translateY(-2px); }
    .r-icon { font-size: 28px; margin-bottom: 8px; }
    .resource-item strong { font-size: 12px; color: #333; margin-bottom: 4px; }
    .resource-item p { font-size: 10px; color: #888; margin: 0; }

    /* Ticket Card */
    .ticket-card { text-align: center; background: #fffdf5; border-color: #e8d88a; }
    .submit-ticket-btn {
      padding: 12px 28px; background: #0a246a; color: white; border: none;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-family: inherit;
      margin-top: 12px;
    }
    .submit-ticket-btn:hover { background: #1a3a8a; }

    @media (max-width: 600px) {
      .contact-grid { grid-template-columns: 1fr; }
      .resources-grid { grid-template-columns: 1fr 1fr; }
      .quick-actions { flex-direction: column; }
    }
  `]
})
export class AdminSupportComponent {
  faqs = [
    {
      question: 'How do I create a new ticket?',
      answer: 'Click File → New Ticket in the menu bar, or press Ctrl+N on your keyboard. Fill in the title, description, priority, location, and category, then click Submit.',
      open: false
    },
    {
      question: 'How do I check my ticket status?',
      answer: 'Navigate to Tickets in the sidebar to view all your tickets. Open tickets show in the list with their current status. You can also use the search bar to find specific tickets by code or title.',
      open: false
    },
    {
      question: 'What do the different priority levels mean?',
      answer: 'Critical: System down or major outage (respond within 1 hour). High: Significant impact on work (respond within 4 hours). Medium: Moderate impact (respond within 8 hours). Low: Minor issue or request (respond within 24 hours).',
      open: false
    },
    {
      question: 'How do I reset my password?',
      answer: 'Contact your system administrator or IT support team for a password reset. For security reasons, self-service password reset is available through the administrator.',
      open: false
    },
    {
      question: 'How does the AI Assistant work?',
      answer: 'The AI Assistant is powered by Google Gemini 2.5 Flash. It can answer questions about the system, help with troubleshooting, and provide technical guidance. Access it via Help → AI Assistant in the menu bar.',
      open: false
    },
    {
      question: 'How often is the network scanned for devices?',
      answer: 'Network scanning can be triggered manually from the Computer Monitoring page. The initial scan runs when the server starts. You can click "Scan Network" anytime to update the device list.',
      open: false
    }
  ];

  constructor(private router: Router) {}

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  createTicket() {
    this.router.navigate(['/tickets/new']);
  }

  openAI() {
    // Navigate back to dashboard and trigger AI
    this.router.navigate(['/dashboard']).then(() => {
      setTimeout(() => {
        const event = new CustomEvent('open-ai-assistant');
        window.dispatchEvent(event);
      }, 500);
    });
  }

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}