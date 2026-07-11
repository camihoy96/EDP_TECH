import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  expanded: boolean;
}

@Component({
  selector: 'app-client-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="faq-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>❓ Frequently Asked Questions</h2>
          <p>Find answers to common questions about our helpdesk system</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              placeholder="🔍 Search FAQs..."
              (input)="filterFaqs()"
            />
          </div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'all'"
          (click)="selectCategory('all')">
          All
        </button>
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'tickets'"
          (click)="selectCategory('tickets')">
          🎫 Tickets
        </button>
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'requisitions'"
          (click)="selectCategory('requisitions')">
          📩 Requisitions
        </button>
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'joborders'"
          (click)="selectCategory('joborders')">
          📋 Job Orders
        </button>
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'account'"
          (click)="selectCategory('account')">
          👤 Account
        </button>
        <button 
          class="cat-btn" 
          [class.active]="selectedCategory === 'general'"
          (click)="selectCategory('general')">
          ℹ️ General
        </button>
      </div>

      <!-- FAQ List -->
      <div class="faq-list">
        <div 
          class="faq-item" 
          *ngFor="let faq of filteredFaqs; let i = index"
          [class.expanded]="faq.expanded">
          <div class="faq-question" (click)="toggleFaq(i)">
            <span class="faq-icon">{{ faq.expanded ? '−' : '+' }}</span>
            <span class="faq-text">{{ faq.question }}</span>
            <span class="faq-category-badge">{{ faq.category }}</span>
          </div>
          <div class="faq-answer" *ngIf="faq.expanded">
            <p [innerHTML]="faq.answer"></p>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div class="no-results" *ngIf="filteredFaqs.length === 0">
        <span>🔍</span>
        <p>No FAQs found matching your search.</p>
        <button class="clear-btn" (click)="searchTerm = ''; filterFaqs()">Clear Search</button>
      </div>

      <!-- Still Need Help -->
      <div class="help-section">
        <h3>💬 Still Need Help?</h3>
        <p>If you couldn't find the answer you're looking for, please create a support ticket.</p>
        <a routerLink="/client/tickets/new" class="create-ticket-btn">Create Support Ticket</a>
      </div>
    </div>
  `,
  styles: [`
    .faq-container {
      padding: 20px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-box input {
      padding: 10px 16px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 13px;
      width: 250px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-box input:focus {
      border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10, 36, 106, 0.1);
    }

    .back-link {
      color: #0a246a;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    /* Category Tabs */
    .category-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }

    .cat-btn {
      padding: 8px 16px;
      border: 1px solid #d0d0d0;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
    }

    .cat-btn:hover {
      background: #f0f4ff;
      color: #0a246a;
      border-color: #0a246a;
    }

    .cat-btn.active {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
    }

    /* FAQ List */
    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .faq-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .faq-item:hover {
      border-color: #b0b0b0;
    }

    .faq-item.expanded {
      border-color: #0a246a;
      box-shadow: 0 2px 8px rgba(10, 36, 106, 0.08);
    }

    .faq-question {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;
    }

    .faq-icon {
      font-size: 18px;
      font-weight: 700;
      color: #0a246a;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .faq-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
    }

    .faq-category-badge {
      font-size: 10px;
      padding: 4px 10px;
      background: #f0f4ff;
      color: #0a246a;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .faq-answer {
      padding: 0 20px 16px 56px;
      animation: slideDown 0.2s ease;
    }

    .faq-answer p {
      margin: 0;
      font-size: 13px;
      color: #555;
      line-height: 1.7;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* No Results */
    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }

    .no-results span {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
    }

    .no-results p {
      font-size: 14px;
      margin: 0 0 16px 0;
    }

    .clear-btn {
      background: #f0f0f0;
      border: 1px solid #d0d0d0;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .clear-btn:hover {
      background: #e0e0e0;
    }

    /* Help Section */
    .help-section {
      margin-top: 32px;
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, #f0f4ff, #e8eeff);
      border-radius: 12px;
      border: 1px solid #d0d8f0;
    }

    .help-section h3 {
      margin: 0 0 8px 0;
      color: #0a246a;
      font-size: 16px;
    }

    .help-section p {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 13px;
    }

    .create-ticket-btn {
      display: inline-block;
      background: #0a246a;
      color: white;
      padding: 10px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .create-ticket-btn:hover {
      background: #0d2f8a;
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .search-box input {
        width: 100%;
      }

      .category-tabs {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 8px;
      }

      .cat-btn {
        white-space: nowrap;
        font-size: 11px;
        padding: 6px 12px;
      }

      .faq-question {
        padding: 14px 16px;
      }

      .faq-answer {
        padding: 0 16px 14px 48px;
      }
    }
  `]
})
export class ClientFaqComponent {
  searchTerm = '';
  selectedCategory = 'all';

  faqs: FaqItem[] = [
    // Tickets
    {
      question: 'How do I create a new support ticket?',
      answer: 'To create a new ticket, go to <strong>Tickets</strong> from the sidebar menu and click the <strong>"Create Ticket"</strong> button. Fill in the title, description, select the priority level, and choose the department. Click <strong>Submit</strong> to create your ticket. You will receive a confirmation with your ticket number.',
      category: 'tickets',
      expanded: false
    },
    {
      question: 'What do the different ticket statuses mean?',
      answer: '<strong>New</strong> - Your ticket has been created but not yet assigned.<br><strong>Assigned</strong> - A technician has been assigned to your ticket.<br><strong>In Progress</strong> - The technician is actively working on your issue.<br><strong>Pending</strong> - Waiting for additional information or third-party action.<br><strong>Resolved</strong> - The issue has been fixed.<br><strong>Closed</strong> - The ticket has been finalized and archived.',
      category: 'tickets',
      expanded: false
    },
    {
      question: 'How do I check the status of my ticket?',
      answer: 'Go to <strong>Tickets</strong> from the sidebar and select <strong>"My Tickets"</strong>. You will see a list of all your submitted tickets with their current status. Click on any ticket to view detailed information, updates, and comments from technicians.',
      category: 'tickets',
      expanded: false
    },
    {
      question: 'What priority should I choose for my ticket?',
      answer: '<strong>Critical</strong> - System down, security breach, or major outage affecting multiple users.<br><strong>High</strong> - Single user unable to work, critical application issue.<br><strong>Medium</strong> - Non-critical issue with a workaround available.<br><strong>Low</strong> - General inquiry, minor enhancement request, or cosmetic issue.',
      category: 'tickets',
      expanded: false
    },
    {
      question: 'How long does it take to resolve a ticket?',
      answer: 'Resolution time depends on the priority level:<br><strong>Critical:</strong> 1-2 minutes<br><strong>High:</strong> 2-3 minutes<br><strong>Medium:</strong> 4-5 minutes<br><strong>Low:</strong> 5-10 minutes<br><br>These are target times. Actual resolution may vary based on issue complexity.',
      category: 'tickets',
      expanded: false
    },
    {
      question: 'Can I add comments or updates to my existing ticket?',
      answer: 'Yes! Open your ticket and scroll down to the <strong>Comments</strong> section. Type your message and click <strong>Add Comment</strong>. This helps keep all communication related to the issue in one place.',
      category: 'tickets',
      expanded: false
    },

    // Requisitions
    {
      question: 'How do I submit a requisition request?',
      answer: 'Navigate to <strong>Requisitions</strong> from the sidebar and click <strong>"Create Requisition"</strong>. Fill in the request details including the items needed, department, and any remarks. After submission, it will go through the approval process.',
      category: 'requisitions',
      expanded: false
    },
    {
      question: 'What is the approval process for requisitions?',
      answer: 'Once you submit a requisition, it goes to your department head for <strong>approval</strong>. After approval, it moves to <strong>release</strong> where the items are prepared. You will be notified at each stage of the process.',
      category: 'requisitions',
      expanded: false
    },
    {
      question: 'How do I know if my requisition was approved?',
      answer: 'You can check the status of your requisition by going to <strong>Requisitions > My Requisitions</strong>. The status will show as <strong>Pending</strong>, <strong>Approved</strong>, <strong>Released</strong>, or <strong>Rejected</strong>. You will also receive notifications for status changes.',
      category: 'requisitions',
      expanded: false
    },
    {
      question: 'What does "Forwarded" status mean on my requisition?',
      answer: 'A "Forwarded" status means your requisition has been sent to another branch or department for processing. This usually happens when the requested items or services need to be handled by a different location.',
      category: 'requisitions',
      expanded: false
    },

    // Job Orders
    {
      question: 'How do I create a job order?',
      answer: 'Go to <strong>Job Orders</strong> from the sidebar and click <strong>"Create Job Order"</strong>. Fill in the details including the company (if applicable), department, particulars of the job, and date needed. Submit the form to create your job order.',
      category: 'joborders',
      expanded: false
    },
    {
      question: 'What is the difference between a ticket and a job order?',
      answer: '<strong>Tickets</strong> are for IT support issues (software problems, hardware issues, system access, etc.).<br><strong>Job Orders</strong> are for service requests that require work to be performed (repairs, installations, maintenance tasks, etc.).',
      category: 'joborders',
      expanded: false
    },
    {
      question: 'How do I track my job order progress?',
      answer: 'Visit <strong>Job Orders > My Job Orders</strong> to see all your submitted job orders. Each job order shows its current status: <strong>Pending</strong>, <strong>Approved/Received</strong>, <strong>Assigned</strong>, <strong>In Progress</strong>, or <strong>Done</strong>.',
      category: 'joborders',
      expanded: false
    },

    // Account
    {
      question: 'How do I update my profile information?',
      answer: 'Click on your profile icon in the top-right corner and select <strong>Profile</strong>. From there, you can update your contact information, change your password, and manage your notification preferences.',
      category: 'account',
      expanded: false
    },
    {
      question: 'I forgot my password. How do I reset it?',
      answer: 'On the login page, click the <strong>"Forgot Password?"</strong> link. Enter your email address and you will receive a password reset link. Follow the instructions in the email to create a new password.',
      category: 'account',
      expanded: false
    },
    {
      question: 'How do I enable notifications?',
      answer: 'Notifications are enabled by default. You can manage your notification preferences by going to your <strong>Profile</strong> settings. You can choose to receive notifications for ticket updates, requisition status changes, and job order progress.',
      category: 'account',
      expanded: false
    },

    // General
    {
      question: 'What are the IT support hours?',
      answer: 'IT support is available <strong>Monday through Sunday</strong> from <strong>8:00 AM to 7:00 PM</strong>. For emergencies outside these hours, please contact the emergency line at <strong>ext. 890</strong>.',
      category: 'general',
      expanded: false
    },
    {
      question: 'How do I contact IT support directly?',
      answer: 'You can reach IT support through:<br>📞 <strong>Hotline:</strong> ext. 521<br>🚨 <strong>Emergency:</strong> ext. 890<br>📧 <strong>Email:</strong> support&#64;edptech.com<br><br>Or simply create a ticket through the helpdesk system for the fastest response.',
      category: 'general',
      expanded: false
    },
    {
      question: 'Can I access the helpdesk from my mobile device?',
      answer: 'Yes! The helpdesk system is fully responsive and works on smartphones and tablets. Simply open your browser and navigate to the helpdesk URL. You can create tickets, check statuses, and receive notifications on the go.',
      category: 'general',
      expanded: false
    },
    {
      question: 'How do I view system status and announcements?',
      answer: 'Click on <strong>System Status</strong> from the user menu dropdown. This page shows real-time status of all services (API, Database, Email, Storage), current system metrics, and any recent incidents or maintenance announcements.',
      category: 'general',
      expanded: false
    }
  ];

  filteredFaqs: FaqItem[] = [];

  constructor() {
    this.filterFaqs();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterFaqs();
  }

  filterFaqs() {
    let filtered = this.faqs;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(f => 
        f.question.toLowerCase().includes(term) || 
        f.answer.toLowerCase().includes(term)
      );
    }

    this.filteredFaqs = filtered;
  }

  toggleFaq(index: number) {
    // Find the actual FAQ item in the main array
    const faq = this.filteredFaqs[index];
    const mainFaq = this.faqs.find(f => f.question === faq.question);
    if (mainFaq) {
      mainFaq.expanded = !mainFaq.expanded;
      faq.expanded = mainFaq.expanded;
    }
  }
}