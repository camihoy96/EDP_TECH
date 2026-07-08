import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TicketService, Ticket } from '../../services/ticket.service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientNotificationBellComponent } from '../notification-bell/client-notification-bell.component';
import { ClientNotificationService } from '../../services/client-notification.service';
import type { ClientNotification } from '../../services/client-notification.service';
import { environment } from '../../../environments/environment';
import { AiAssistantComponent } from '../shared/ai-assistant/ai-assistant.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface ClientTicket {
  id: number;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  location: string;
  created_at: string;
  description?: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, ClientNotificationBellComponent, AiAssistantComponent],
  template: `
    <div class="app-container" (click)="closeAllMenus()">

     <!-- ── Menu Bar ────────────────────────────────────────────────── -->
<div class="menu-bar" (click)="$event.stopPropagation()">
  <div class="menu-brand">
    <span class="brand-dot"></span>
    <span class="brand-branch">{{ currentBranch?.name || 'Loading...' }}</span>
    <span class="brand-company" *ngIf="currentBranch?.company_name">({{ currentBranch.company_name }})</span>
  </div>

  <div class="menu-item" [class.open]="activeMenu === 'file'" (click)="toggleMenu('file')">
    File
    <div class="dropdown" *ngIf="activeMenu === 'file'">
      <div class="dropdown-item" (click)="newTicket()">📄 New Ticket</div>
      <div class="dropdown-item" (click)="newJobOrder()">📋 New Job Order</div>
      <div class="dropdown-item" (click)="newRequisition()">📩 New Requisition</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="exportMyData()">💾 Export My Data</div>
      <div class="dropdown-item" (click)="printPage()">🖨️ Print Page</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="logout()">🚪 Logout</div>
    </div>
  </div>

  <div class="menu-item" [class.open]="activeMenu === 'edit'" (click)="toggleMenu('edit')">
    Edit
    <div class="dropdown" *ngIf="activeMenu === 'edit'">
      <div class="dropdown-item" (click)="focusSearch()">🔍 Search Tickets</div>
      <div class="dropdown-item" (click)="searchAll()">🔎 Advanced Search</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="clearSearch()">🗑️ Clear Search</div>
      <div class="dropdown-item" (click)="clearFilters()">🔄 Clear All Filters</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="refreshData()">🔄 Refresh Data</div>
    </div>
  </div>

  <div class="menu-item" [class.open]="activeMenu === 'view'" (click)="toggleMenu('view')">
    View
    <div class="dropdown" *ngIf="activeMenu === 'view'">
      <div class="dropdown-item" (click)="toggleSidebar()">
        {{ sidebarHidden ? '📂 Show Sidebar' : '📁 Hide Sidebar' }}
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="setView('all')">
        <span *ngIf="currentView === 'all'">✔ </span>📋 All Tickets
      </div>
      <div class="dropdown-item" (click)="setView('open')">
        <span *ngIf="currentView === 'open'">✔ </span>🔓 Open Only
      </div>
      <div class="dropdown-item" (click)="setView('resolved')">
        <span *ngIf="currentView === 'resolved'">✔ </span>✅ Resolved
      </div>
      <div class="dropdown-item" (click)="setView('closed')">
        <span *ngIf="currentView === 'closed'">✔ </span>🔒 Closed
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="toggleCompactMode()">
        {{ compactMode ? '📐 Compact Off' : '📏 Compact Mode' }}
      </div>
      <div class="dropdown-item" (click)="toggleDarkMode()">
        {{ darkMode ? '☀️ Light Mode' : '🌙 Dark Mode' }}
      </div>
    </div>
  </div>

  <div class="menu-item" [class.open]="activeMenu === 'tools'" (click)="toggleMenu('tools')">
    Tools
    <div class="dropdown" *ngIf="activeMenu === 'tools'">
      <div class="dropdown-item" (click)="goTofeature()">📚 Features</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="goToMyStats()">📊 My Statistics</div>
      <div class="dropdown-item" (click)="goToCalendar()">📅 Calendar</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="goToNotifications()">🔔 Notification History</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="downloadApp()">📱 Download Mobile App</div>
      <div class="dropdown-item" (click)="checkSystemStatus()">🩺 System Status</div>
    </div>
  </div>

  <div class="menu-item" [class.open]="activeMenu === 'help'" (click)="toggleMenu('help')">
    Help
    <div class="dropdown" *ngIf="activeMenu === 'help'">
      <div class="dropdown-item" (click)="goToSlaInfo()">📋 SLA Info</div>
      <div class="dropdown-item" (click)="goToContact()">📞 Contact IT Support</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="goToFAQ()">❓ FAQ</div>
      <div class="dropdown-item" (click)="goToVideoTutorials()">🎥 Video Tutorials</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="goToAbout()">ℹ️ About Portal</div>
      <div class="dropdown-item" (click)="goToShortcuts()">⌨️ Keyboard Shortcuts</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" (click)="reportBug()">🐛 Report a Bug</div>
      <div class="dropdown-item" (click)="submitFeedback()">💬 Submit Feedback</div>
    </div>
  </div>

  <!-- Branch Address -->
  <div class="menu-item branch-address-item" *ngIf="currentBranch?.address">
    <span class="branch-address-label">📍 {{ currentBranch.address }}</span>
  </div>

  <div class="menu-bar-right">
    <span class="menu-clock">{{ currentTime }}</span>
  </div>
</div>

   <!-- ── Toolbar ─────────────────────────────────────────────────── -->
<div class="toolbar">
  <button class="toolbar-btn icon-only" (click)="toggleSidebar()" title="Toggle Sidebar">
    <!-- Hamburger menu (☰) when sidebar is HIDDEN (show this to open sidebar) -->
    <svg *ngIf="sidebarHidden" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect y="2" width="16" height="1.5" rx="0.75"/>
      <rect y="7.25" width="16" height="1.5" rx="0.75"/>
      <rect y="12.5" width="16" height="1.5" rx="0.75"/>
    </svg>
    <!-- X icon (✕) when sidebar is VISIBLE (show this to close sidebar) -->
    <svg *ngIf="!sidebarHidden" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
  
  <div class="toolbar-separator"></div>

  <button class="toolbar-btn" [class.active-btn]="isDashboardRoute" (click)="goToDashboard()">
    <span class="tbtn-icon">🏠</span> Dashboard
  </button>
  <button class="toolbar-btn" [class.active-btn]="isProfileRoute" (click)="goToProfile()">
    <span class="tbtn-icon">👤</span> Profile
  </button>
  <button class="toolbar-btn" [class.active-btn]="isTicketListRoute" (click)="setView('all'); markAllTicketsRead()">
  <span class="tbtn-icon">🎫</span>
  {{ isEDPUser() ? 'All Tickets' : 'My Tickets' }}
  <span class="tbadge" *ngIf="getNotificationCount() > 0">{{ getNotificationCount() }}</span>
</button>
  <button class="toolbar-btn primary-btn" (click)="newTicket()" *ngIf="!isEDPUser()">
  <span class="tbtn-icon">＋</span> New Ticket
</button>
  <button class="toolbar-btn" [class.active-btn]="isContactRoute" (click)="goToContact()">
  <span class="tbtn-icon">📞</span>
  {{ isEDPUser() ? 'Contact LSP IT' : 'Contact IT' }}
  <span class="tbadge" *ngIf="messageNotificationCount > 0">{{ messageNotificationCount > 99 ? '99+' : messageNotificationCount }}</span>
</button>

  <div class="toolbar-separator"></div>

  <app-client-notification-bell (viewAll)="openNotificationsModal()"></app-client-notification-bell>
  <app-ai-assistant 
    #aiAssistant 
    [context]="aiContext"
    [userPhotoUrl]="currentUser?.photo_url ? (apiUrl + currentUser.photo_url) : ''"
    [userAvatarColor]="currentUser?.avatar_color || '#4f46e5'"
    [userInitial]="currentUser?.fullname?.charAt(0)?.toUpperCase() || '?'">
  </app-ai-assistant>
  <button class="toolbar-btn ai-btn" (click)="openAIAssistant()" title="AI Assistant">
    <span>🤖</span> AI
  </button>

 <!-- Refresh Button -->
<button class="toolbar-btn refresh-btn" (click)="refreshAll()" title="Refresh Data" [disabled]="isRefreshing">
  <span class="tbtn-icon">{{ isRefreshing ? '⏳' : '🔄' }}</span>
  {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
</button>

  <div class="spacer"></div>

  <div class="user-chip">
    <div class="user-avatar-small" [style.background]="currentUser?.avatar_color || '#4f46e5'">
      <img *ngIf="currentUser?.photo_url" [src]="apiUrl + currentUser.photo_url" alt="Avatar" class="user-photo-small">
      <span *ngIf="!currentUser?.photo_url">{{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
    </div>
    <div class="user-info">
      <span class="user-name">{{ currentUser?.fullname }}</span>
      <span class="user-role">{{ currentUser?.role }}</span>
    </div>
    <button class="logout-btn" (click)="logout()">Sign out</button>
  </div>
</div>

      <!-- ── Main Layout ─────────────────────────────────────────────── -->
      <div class="main-layout">

        <!-- Sidebar -->
        <div class="sidebar" [class.sidebar-hidden]="sidebarHidden">
          <div class="sidebar-header">
            <div class="sidebar-logo">
             <div class="sidebar-logo-mark">
  <img *ngIf="systemLogoSafe" 
       [src]="systemLogoSafe" 
       alt="Logo" 
       class="sidebar-logo-image">
  <svg *ngIf="!systemLogoSafe" 
       width="20" 
       height="20" 
       viewBox="0 0 24 24" 
       fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.9)"/>
    <path d="M2 17l10 5 10-5" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/>
    <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>
  </svg>
</div>
              <div>
                <div class="sidebar-logo-title">{{ systemTitle || 'Loading...' }}</div>
                <div class="sidebar-logo-sub">{{ currentBranch?.name || 'Helpdesk Portal' }}</div>
              </div>
            </div>
          </div>

          <div class="sidebar-section-label">WORKSPACE</div>
          <div class="sidebar-menu">
            <a routerLink="/client/dashboard" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact:true}" class="sidebar-link">
              <span class="nav-icon">🏠</span>
              <span class="nav-label">Dashboard</span>
            </a>

            <a routerLink="/client/tickets" routerLinkActive="active"
            [routerLinkActiveOptions]="{exact:true}" class="sidebar-link" (click)="markAllTicketsRead()">
            <span class="nav-icon">🎫</span>
            <span class="nav-label">{{ isEDPUser() ? 'All Tickets' : 'My Tickets' }}</span>
            <span class="nav-badge" *ngIf="getNotificationCount() > 0">{{ getNotificationCount() }}</span>
          </a>

            <a routerLink="/client/tickets/new" routerLinkActive="active" class="sidebar-link" *ngIf="!isEDPUser()">
          <span class="nav-icon">➕</span>
          <span class="nav-label">New Ticket</span>
        </a>

           <a routerLink="/client/job-orders" routerLinkActive="active" class="sidebar-link" (click)="markJobOrdersAsRead()">
  <span class="nav-icon">✍️</span>
  <span class="nav-label">Job Orders</span>
  <span class="nav-badge" *ngIf="pendingJobOrdersCount > 0">{{ pendingJobOrdersCount }}</span>
</a>

           <a routerLink="/client/request" routerLinkActive="active" class="sidebar-link">
  <span class="nav-icon">📩</span>
  <span class="nav-label">Requests</span>
  <span class="nav-badge" *ngIf="requisitionsNotificationCount > 0">{{ requisitionsNotificationCount }}</span>
</a>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section-label">RESOURCES</div>

            <a routerLink="/client/knowledge-base" routerLinkActive="active" class="sidebar-link">
              <span class="nav-icon">📚</span>
              <span class="nav-label">Knowledge Base</span>
            </a>

            <a routerLink="/client/sla-info" routerLinkActive="active" class="sidebar-link">
              <span class="nav-icon">📋</span>
              <span class="nav-label">SLA Info</span>
            </a>

           <a routerLink="/client/contact" routerLinkActive="active" class="sidebar-link">
          <span class="nav-icon">📞</span>
          <span class="nav-label">{{ isEDPUser() ? 'Contact LSP IT' : 'Contact IT' }}</span>
          <span class="nav-badge" *ngIf="messageNotificationCount > 0">{{ messageNotificationCount > 99 ? '99+' : messageNotificationCount }}</span>
        </a>
          </div>

          <div class="sidebar-footer">
            <div class="connection-status">
              <div class="status-pulse"></div>
              <span>IT Support Online</span>
            </div>
          </div>
        </div>
        <!-- ── Content Area ──────────────────────────────────────────── -->
        <div class="content-area">
          <!-- Dashboard Widgets — only on /client/dashboard -->
          <div class="dashboard-widgets" *ngIf="isDashboardRoute">

            <div class="widget">
              <div class="widget-header">
                <span class="widget-icon">🎫</span>
                <span class="widget-title">Recent Tickets</span>
                <span class="widget-count">{{ myTickets.length }}</span>
              </div>
              <div class="widget-content">
                <div class="activity-item" *ngFor="let ticket of myTickets.slice(0, 5)"
                     (click)="viewTicket(ticket.id)">
                  <div class="activity-status-dot" [class]="'dot-' + ticket.status"></div>
                  <div class="activity-info">
                    <div class="activity-title">{{ ticket.title }}</div>
                    <div class="activity-meta">{{ ticket.ticket_number }} · {{ ticket.created_at | date:'MMM d, y' }}</div>
                  </div>
                  <span class="priority-badge" [class]="'pri-' + ticket.priority">{{ ticket.priority }}</span>
                </div>
                <div class="activity-empty" *ngIf="myTickets.length === 0">
                  <span>🎉</span>
                  <p>No tickets yet — everything's good!</p>
                </div>
              </div>
            </div>
            <div class="widget">
              <div class="widget-header">
                <span class="widget-icon">📊</span>
                <span class="widget-title">Status Breakdown</span>
              </div>
              <div class="widget-content">
                <div class="priority-stats">
                  <div class="priority-row" *ngFor="let stat of statusDistribution">
                    <span class="priority-label">{{ stat.label }}</span>
                    <span class="priority-count">{{ stat.count }}</span>
                    <div class="priority-track">
                      <div class="priority-fill"
                           [style.width.%]="stat.percentage"
                           [style.background]="stat.color">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="widget">
              <div class="widget-header">
                <span class="widget-icon">📢</span>
                <span class="widget-title">Announcements</span>
              </div>
              <div class="widget-content">
                <div class="announce-list">
                  <div class="announce-item" *ngFor="let a of announcements">
                    <span class="announce-badge" [class]="'ab-' + a.type">{{ a.type | uppercase }}</span>
                    <span class="announce-text">{{ a.text }}</span>
                  </div>
                  <div class="announce-viewall" (click)="goToAnnouncements()">
                    View all announcements →
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Router outlet -->
          <div class="main-content">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
      <!-- ── Bottom Status Bar ─────────────────────────────────────────── -->
<div class="bottom-status-bar">
  <div class="status-left">
    <span class="status-ready">● Ready</span>
    <span class="status-sep">|</span>
    <span>{{ currentUser?.department || 'EMPLOYEE' }}</span>
    <span class="status-sep">|</span>
    <span>{{ statusBarLabel }}</span>
    <span class="status-sep">|</span>
    <span>Reg Key: {{ registrationKey }}</span>
  </div>
  <div class="status-right">
    <span>Support Portal v2.0</span>
    <span class="status-sep">|</span>
    <span>{{ currentDate }}</span>
    <span class="status-sep">|</span>
    <span>{{ currentTime }}</span>
  </div>
</div>
    </div>

   <!-- Notifications Modal -->
<div class="modal-overlay" *ngIf="showNotificationsModal" (click)="closeNotificationsModal()">
  <div class="notif-modal" (click)="$event.stopPropagation()">
    <div class="notif-modal-header">
      <h3>🔔 My Notifications</h3>
      <div class="notif-modal-header-actions">
        <button class="notif-action-btn" *ngIf="unreadNotificationsCount > 0" (click)="markAllNotificationsRead()">
          ✓ Mark all read
        </button>
        <button class="notif-action-btn danger" *ngIf="clientNotifications.length > 0" (click)="clearAllNotifications()">
          🗑️ Clear all
        </button>
        <button class="modal-close-btn" (click)="closeNotificationsModal()">✕</button>
      </div>
    </div>
    <div class="notif-modal-body">
      <div class="clear-confirm" *ngIf="showClearConfirm">
        <span class="clear-confirm-icon">🗑️</span>
        <p class="clear-confirm-text">Clear all notifications?</p>
        <p class="clear-confirm-sub">This action cannot be undone.</p>
        <div class="clear-confirm-actions">
          <button class="btn btn-cancel" (click)="cancelClearAll()">Cancel</button>
          <button class="btn btn-delete" (click)="confirmClearAll()">Clear All</button>
        </div>
      </div>

      <div class="notif-modal-list" *ngIf="!showClearConfirm">
        <div class="notif-modal-item" *ngFor="let notif of clientNotifications" [class.unread]="!notif.read">
          <div class="notif-modal-icon">{{ getNotifIcon(notif.type) }}</div>
          <div class="notif-modal-content">
            <div class="notif-modal-title">{{ notif.title }}</div>
            <div class="notif-modal-message">{{ notif.message }}</div>
            <div class="notif-modal-meta">
              <span>{{ notif.timestamp | date:'MMM d, y h:mm a' }}</span>
              <span class="notif-ticket" *ngIf="notif.ticketNumber">#{{ notif.ticketNumber }}</span>
            </div>
          </div>
          <span class="notif-unread-dot" *ngIf="!notif.read"></span>
          <button class="notif-dismiss-btn" (click)="dismissSingleNotification(notif.id)" title="Dismiss">✕</button>
        </div>
        <div class="notif-modal-empty" *ngIf="clientNotifications.length === 0">
          <span>📭</span>
          <p>No notifications yet</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Session Expiry Warning Modal -->
<div class="modal-overlay" *ngIf="showLogoutWarning">
  <div class="logout-warning-modal" (click)="$event.stopPropagation()">
    <div class="logout-warning-header">
      <span class="warning-icon">⏰</span>
      <h3>Session Expiring Soon</h3>
    </div>
    <div class="logout-warning-body">
      <p>Your session is about to expire due to inactivity.</p>
      <div class="countdown-circle">
        <span class="countdown-number">{{ logoutCountdown }}</span>
        <span class="countdown-label">seconds</span>
      </div>
      <p class="warning-sub">You will be automatically logged out.</p>
    </div>
    <div class="logout-warning-footer">
      <button class="btn btn-primary" (click)="cancelLogout()">
        ✋ I'm Still Here
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════
       DESIGN TOKENS
    ═══════════════════════════════════════════════════ */
    :host {
      --navy:       #0d1b3e;
      --navy-mid:   #162454;
      --navy-light: #1e3163;
      --indigo:     #4f46e5;
      --indigo-lt:  #6366f1;
      --indigo-dim: rgba(79,70,229,0.12);
      --coral:      #f97316;
      --coral-dim:  rgba(249,115,22,0.12);
      --green:      #22c55e;
      --green-dim:  rgba(34,197,94,0.12);
      --sky:        #0ea5e9;
      --sky-dim:    rgba(14,165,233,0.12);
      --red:        #ef4444;
      --red-dim:    rgba(239,68,68,0.12);
      --amber:      #f59e0b;

      --bg:         #f1f5f9;
      --surface:    #ffffff;
      --surface-2:  #f8fafc;
      --border:     #e2e8f0;
      --border-md:  #cbd5e1;
      --text:       #0f172a;
      --text-mid:   #475569;
      --text-muted: #94a3b8;

      --radius-sm:  6px;
      --radius:     10px;
      --radius-lg:  14px;
      --shadow-sm:  0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
      --shadow:     0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
      --shadow-lg:  0 10px 30px rgba(0,0,0,.12), 0 4px 10px rgba(0,0,0,.06);

      --font: -apple-system, 'Segoe UI', system-ui, sans-serif;
    }

    /* ═══════════════════════════════════════════════════
       BASE
    ═══════════════════════════════════════════════════ */
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      font-family: var(--font);
      font-size: 13px;
      color: var(--text);
      overflow: hidden;
    }

    /* ═══════════════════════════════════════════════════
       MENU BAR
    ═══════════════════════════════════════════════════ */
    .menu-bar {
      background: var(--navy);
      display: flex;
      align-items: center;
      padding: 0 8px;
      height: 28px;
      position: relative;
      z-index: 200;
      flex-shrink: 0;
      gap: 2px;
    }

    .menu-brand {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px 0 4px;
      margin-right: 4px;
      border-right: 1px solid rgba(255,255,255,0.1);
      min-width: fit-content;
    }
    .brand-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--indigo-lt);
      box-shadow: 0 0 6px var(--indigo-lt);
    }
    .brand-name {
      font-size: 12px;
      font-weight: 700;
      color: white;
      letter-spacing: 0.05em;
    }
    .brand-separator {
      font-size: 12px;
      color: rgba(255,255,255,0.25);
      margin: 0 2px;
    }
    .brand-branch {
      font-size: 11px;
      font-weight: 600;
      color: rgb(255, 255, 255);
      letter-spacing: 0.03em;
    }
    .brand-company {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.73);
      font-style: italic;
      margin-left: 2px;
    }
    .branch-address-item {
      padding: 0 8px;
      margin-left: auto;
      cursor: default;
      color: rgba(255,255,255,0.4);
    }
    .branch-address-item:hover {
      background: transparent !important;
      color: rgba(255,255,255,0.4) !important;
    }
    .branch-address-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.78);
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .menu-item {
      position: relative;
      padding: 0 10px;
      cursor: pointer;
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      height: 28px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
      user-select: none;
    }
    .menu-item:hover, .menu-item.open {
      color: white;
      background: rgba(255,255,255,0.1);
    }

    .dropdown {
      position: absolute;
      top: 26px; left: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      min-width: 210px;
      z-index: 500;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: menuOpen 0.12s ease;
    }
    @keyframes menuOpen {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .dropdown-item {
      padding: 8px 16px;
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
      color: var(--text);
      transition: background 0.1s;
    }
    .dropdown-item:hover { background: var(--indigo-dim); color: var(--indigo); }
    .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

    .menu-bar-right {
      margin-left: auto;
      padding-right: 8px;
    }
    .menu-clock {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.98);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }

    /* ═══════════════════════════════════════════════════
       TOOLBAR
    ═══════════════════════════════════════════════════ */
    .toolbar {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 5px 12px;
      display: flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
      overflow-x: auto;
      min-height: 42px;
      box-shadow: var(--shadow-sm);
    }
    .sidebar-logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
    .toolbar-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      padding: 5px 10px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--text-mid);
      white-space: nowrap;
      height: 30px;
      flex-shrink: 0;
      font-family: var(--font);
      transition: all 0.15s;
    }
    .toolbar-btn:hover {
      background: var(--bg);
      border-color: var(--border-md);
      color: var(--text);
    }
    .toolbar-btn.active-btn {
      background: var(--indigo-dim);
      border-color: var(--indigo);
      color: var(--indigo);
      font-weight: 600;
    }
    .toolbar-btn.icon-only { width: 30px; padding: 0; justify-content: center; }
    .toolbar-btn.primary-btn {
      background: var(--indigo);
      border-color: var(--indigo);
      color: white;
      font-weight: 600;
    }
    .toolbar-btn.primary-btn:hover { background: var(--indigo-lt); }
    .toolbar-btn.ai-btn {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-color: transparent;
      color: white;
    }
    .toolbar-btn.ai-btn:hover { opacity: 0.9; }

    .tbtn-icon { font-size: 13px; }

    .tbadge {
      background: var(--coral);
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      line-height: 1.4;
    }

    .toolbar-separator {
      width: 1px;
      height: 18px;
      background: var(--border);
      margin: 0 4px;
      flex-shrink: 0;
    }

    /* Search */
    .search-box {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .search-icon {
      position: absolute;
      left: 9px;
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-box input {
      padding: 5px 10px 5px 30px;
      border: 1px solid var(--border-md);
      border-radius: var(--radius-sm);
      font-size: 12px;
      width: 190px;
      height: 30px;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--indigo);
      box-shadow: 0 0 0 3px var(--indigo-dim);
      background: white;
    }
    .search-box input::placeholder { color: var(--text-muted); }

    /* User chip */
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--bg);
  flex-shrink: 0;
  transition: all 0.15s;
}
.user-chip:hover {
  border-color: var(--border-md);
  box-shadow: var(--shadow-sm);
}
.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
  overflow: hidden;
}
.user-photo-small {
  width: 100%; 
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  align-items: center; 
}
.user-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  text-align: center; 
}
.user-role {
  font-size: 9px;
  font-weight: 500;
  color: #271c1c9a;
  text-transform: capitalize;
  white-space: nowrap;
 text-align: center;  
}
.logout-btn {
  background: transparent;
  border: 1px solid var(--border-md);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  cursor: pointer;
  font-size: 10px;
  color: #000000;
  font-family: var(--font);
  transition: all 0.15s;
  white-space: nowrap;
  margin-left: 2px;
}
.logout-btn:hover {
  background: var(--red-dim);
  border-color: var(--red);
  color: var(--red);
}
    .spacer { flex: 1; min-width: 8px; }

    /* ═══════════════════════════════════════════════════
       LAYOUT
    ═══════════════════════════════════════════════════ */
    .main-layout { display: flex; flex: 1; overflow: hidden; }

    /* ═══════════════════════════════════════════════════
       SIDEBAR — the signature element
    ═══════════════════════════════════════════════════ */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--navy);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.2s ease, min-width 0.2s ease, opacity 0.15s ease;
      flex-shrink: 0;
    }
    .sidebar.sidebar-hidden {
      width: 0 !important;
      min-width: 0 !important;
      opacity: 0;
      pointer-events: none;
    }

    .sidebar-header {
      padding: 16px 14px 12px;
      background: linear-gradient(180deg, rgba(79,70,229,0.25) 0%, transparent 100%);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidebar-logo-mark {
      width: 36px; height: 36px;
      background: var(--indigo);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(79,70,229,0.4);
    }
    .sidebar-logo-title {
      font-size: 14px;
      font-weight: 700;
      color: white;
      letter-spacing: 0.03em;
      text-align: center;
    }
    .sidebar-logo-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.73);
  margin-top: 1px;
  letter-spacing: 0.02em;
 text-align: center;
}

    .sidebar-section-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: rgb(255, 255, 255);
      padding: 12px 14px 4px;
      flex-shrink: 0;
    }

    .sidebar-menu { padding: 4px 8px; flex: 1; }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      text-decoration: none;
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      border-radius: var(--radius-sm);
      margin-bottom: 2px;
      transition: all 0.15s;
      position: relative;
      white-space: nowrap;
    }
    .sidebar-link:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.9);
    }
    .sidebar-link.active {
      background: var(--indigo);
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(79,70,229,0.4);
    }
    .nav-icon { font-size: 14px; flex-shrink: 0; }
    .nav-label { flex: 1; color: #ffffff; }
    .nav-badge {
      background: var(--coral);
      color: white;
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .sidebar-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 8px 8px; }

    .sidebar-footer {
      padding: 10px 14px;
      border-top: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .connection-status {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.73);
    }
    .status-pulse {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 4px var(--green); }
      50% { box-shadow: 0 0 10px var(--green); }
    }

    /* ═══════════════════════════════════════════════════
       CONTENT AREA
    ═══════════════════════════════════════════════════ */
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* Stats bar */
    .stats-bar {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 8px 20px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      overflow-x: auto;
    }
    .stat-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      min-width: 54px;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-top: 2px;
      font-weight: 600;
    }
    .stat-chip.open .stat-value   { color: var(--sky); }
    .stat-chip.resolved .stat-value { color: var(--green); }
    .stat-chip.critical .stat-value { color: var(--red); }
    .stat-divider { width: 1px; height: 28px; background: var(--border); margin: 0 4px; }
    .online-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--green);
      font-weight: 600;
      white-space: nowrap;
    }
    .online-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 5px var(--green);
    }

    /* ═══════════════════════════════════════════════════
       WIDGETS
    ═══════════════════════════════════════════════════ */
    .dashboard-widgets {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 16px;
      margin: 16px 20px 0;
      animation: widgetsIn 0.3s ease;
    }
    @keyframes widgetsIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .widget {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .widget:hover { box-shadow: var(--shadow); }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 10px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-2);
    }
    .widget-icon { font-size: 15px; }
    .widget-title {
      flex: 1;
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.01em;
    }
    .widget-count {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 8px;
      background: var(--indigo-dim);
      color: var(--indigo);
    }
    .widget-content { padding: 8px 12px; }

    /* Activity items */
    .activity-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 4px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background 0.12s;
    }
    .activity-item:last-child { border-bottom: none; }
    .activity-item:hover { background: var(--bg); }

    .activity-status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-new        { background: var(--sky); }
    .dot-assigned   { background: var(--amber); }
    .dot-in_progress { background: var(--indigo); }
    .dot-resolved   { background: var(--green); }
    .dot-closed     { background: var(--text-muted); }
    .dot-pending    { background: var(--coral); }

    .activity-info { flex: 1; min-width: 0; }
    .activity-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .activity-meta { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

    .priority-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .pri-critical { background: var(--red-dim);   color: var(--red); }
    .pri-high     { background: var(--coral-dim);  color: var(--coral); }
    .pri-medium   { background: rgba(245,158,11,0.12); color: var(--amber); }
    .pri-low      { background: var(--green-dim);  color: var(--green); }

    .activity-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: var(--text-muted);
      gap: 6px;
    }
    .activity-empty span { font-size: 28px; }
    .activity-empty p { font-size: 12px; }

    /* Status distribution */
    .priority-stats { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
    .priority-row   { display: flex; align-items: center; gap: 10px; }
    .priority-label { width: 76px; font-size: 11px; font-weight: 600; color: var(--text-mid); }
    .priority-count { width: 22px; text-align: right; font-size: 12px; font-weight: 700; color: var(--text); }
    .priority-track { flex: 1; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .priority-fill  { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

    /* Announcements */
    .announce-list { display: flex; flex-direction: column; }
    .announce-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 4px;
      border-bottom: 1px solid var(--border);
    }
    .announce-item:last-of-type { border-bottom: none; }
    .announce-badge {
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 1px;
      letter-spacing: 0.05em;
    }
    .ab-new   { background: var(--sky-dim);   color: var(--sky); }
    .ab-info  { background: var(--green-dim);  color: var(--green); }
    .ab-maint { background: rgba(245,158,11,0.12); color: var(--amber); }
    .announce-text { font-size: 11px; color: var(--text-mid); line-height: 1.4; }
    .announce-viewall {
      text-align: center;
      padding: 9px;
      font-size: 11px;
      font-weight: 600;
      color: var(--indigo);
      cursor: pointer;
      background: var(--indigo-dim);
      border-radius: var(--radius-sm);
      margin-top: 4px;
      transition: background 0.15s;
    }
    .announce-viewall:hover { background: rgba(79,70,229,0.18); }

    /* ═══════════════════════════════════════════════════
       ROUTER CONTENT
    ═══════════════════════════════════════════════════ */
    .main-content { flex: 1; overflow-y: auto; }

    /* ═══════════════════════════════════════════════════
       BOTTOM STATUS BAR
    ═══════════════════════════════════════════════════ */
    .bottom-status-bar {
      background: var(--navy);
      padding: 4px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }
    .status-left, .status-right { display: flex; gap: 10px; align-items: center; }
    .status-sep { opacity: 0.3; }
    .status-ready { color: rgba(34,197,94,0.8); }

    /* ═══════════════════════════════════════════════════
       NOTIFICATIONS MODAL
    ═══════════════════════════════════════════════════ */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(13,27,62,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .notif-modal {
      background: var(--surface);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 540px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      animation: modalIn 0.2s ease;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .notif-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: var(--navy);
      color: white;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      flex-shrink: 0;
    }
    .notif-modal-header h3 { margin: 0; font-size: 14px; font-weight: 700; }
    .notif-modal-header-actions { display: flex; align-items: center; gap: 6px; }
    .modal-close-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      transition: background 0.15s;
    }
    .modal-close-btn:hover { background: rgba(239,68,68,0.4); }
    .notif-action-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      font-size: 10px;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: var(--radius-sm);
      white-space: nowrap;
      font-family: var(--font);
      transition: background 0.15s;
    }
    .notif-action-btn:hover { background: rgba(255,255,255,0.2); }
    .notif-action-btn.danger:hover { background: rgba(239,68,68,0.4); }

    .notif-modal-body { overflow-y: auto; flex: 1; }
    .notif-modal-list { display: flex; flex-direction: column; }

    .notif-modal-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 13px 18px;
      border-bottom: 1px solid var(--border);
      transition: background 0.12s;
      position: relative;
    }
    .notif-modal-item:hover { background: var(--bg); }
    .notif-modal-item.unread { background: #f0f4ff; }
    .notif-modal-item:last-child { border-bottom: none; }

    .notif-modal-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    .notif-modal-content { flex: 1; min-width: 0; }
    .notif-modal-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
    .notif-modal-message { font-size: 11px; color: var(--text-mid); line-height: 1.4; }
    .notif-modal-meta { display: flex; gap: 10px; margin-top: 5px; font-size: 10px; color: var(--text-muted); }
    .notif-ticket {
      background: var(--indigo-dim);
      color: var(--indigo);
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
    }
    .notif-unread-dot {
      width: 7px; height: 7px;
      background: var(--red);
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .notif-dismiss-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      opacity: 0;
      transition: all 0.12s;
    }
    .notif-modal-item:hover .notif-dismiss-btn { opacity: 1; }
    .notif-dismiss-btn:hover { color: var(--red); background: var(--red-dim); }

    .notif-modal-empty {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }
    .notif-modal-empty span { font-size: 36px; display: block; margin-bottom: 8px; }
    .notif-modal-empty p { font-size: 12px; }

    /* ═══════════════════════════════════════════════════
       CLEAR CONFIRM
    ═══════════════════════════════════════════════════ */
    .clear-confirm { text-align: center; padding: 40px 20px; }
    .clear-confirm-icon { font-size: 40px; display: block; margin-bottom: 12px; }
    .clear-confirm-text { font-size: 13px; color: var(--text); margin: 0 0 6px; font-weight: 600; }
    .clear-confirm-sub { font-size: 11px; color: var(--text-muted); margin: 0 0 20px; }
    .clear-confirm-actions { display: flex; justify-content: center; gap: 8px; }

    .btn { padding: 8px 18px; border-radius: var(--radius-sm); cursor: pointer; font-size: 12px; font-family: var(--font); transition: all 0.15s; }
    .btn-cancel { background: var(--surface); color: var(--text-mid); border: 1px solid var(--border-md); }
    .btn-cancel:hover { background: var(--bg); }
    .btn-delete { background: var(--red); color: white; border: none; font-weight: 600; }
    .btn-delete:hover { background: #dc2626; }
    .btn-primary { background: var(--indigo); color: white; border: none; font-weight: 600; width: 100%; padding: 10px; font-size: 13px; }
    .btn-primary:hover { background: var(--indigo-lt); }
    /* Update the refresh button styles */
.toolbar-btn.refresh-btn {
  background: var(--surface-2);
  border-color: var(--border-md);
  color: var(--text-mid);
  transition: all 0.2s;
}
.toolbar-btn.refresh-btn:hover:not(:disabled) {
  background: var(--green-dim);
  border-color: var(--green);
  color: var(--green);
}
.toolbar-btn.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.toolbar-btn.refresh-btn .tbtn-icon {
  display: inline-block;
  transition: transform 0.3s;
}
.toolbar-btn.refresh-btn:disabled .tbtn-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
    /* ═══════════════════════════════════════════════════
       SESSION EXPIRY
    ═══════════════════════════════════════════════════ */
    .logout-warning-modal {
      background: var(--surface);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 380px;
      text-align: center;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: modalIn 0.25s ease;
    }
    .logout-warning-header {
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: white;
      padding: 24px 20px 18px;
    }
    .logout-warning-header .warning-icon { font-size: 36px; display: block; margin-bottom: 8px; }
    .logout-warning-header h3 { margin: 0; font-size: 17px; }
    .logout-warning-body { padding: 24px; }
    .logout-warning-body p { font-size: 13px; color: var(--text-mid); margin: 0 0 16px; }
    .countdown-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(249,115,22,0.08);
      border: 3px solid var(--coral);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .countdown-number { font-size: 28px; font-weight: 700; color: var(--coral); line-height: 1; }
    .countdown-label { font-size: 9px; color: var(--coral); text-transform: uppercase; letter-spacing: 0.05em; }
    .warning-sub { font-size: 11px !important; color: var(--text-muted) !important; }
    .logout-warning-footer { padding: 16px 24px; background: var(--bg); border-top: 1px solid var(--border); }

    /* ═══════════════════════════════════════════════════
       SCROLLBAR
    ═══════════════════════════════════════════════════ */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-md); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* ═══════════════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════════════ */
    @media (max-width: 900px) {
      .sidebar { width: 200px; min-width: 200px; }
      .dashboard-widgets { grid-template-columns: 1fr; margin: 10px; }
    }
    @media (max-width: 768px) {
      .menu-brand .brand-branch,
      .menu-brand .brand-company,
      .menu-brand .brand-separator {
        display: none;
      }
      .branch-address-item {
        display: none !important;
      }
    }
  `]
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  currentBranch: any = null;
  systemTitle: string = '';
  myTickets: ClientTicket[] = [];
  sidebarHidden = false;
  activeMenu: string | null = null;
  searchTerm = '';
  currentView = 'all';
  currentDate = '';
  currentTime = '';
  apiUrl = environment.apiUrl;
  showClearConfirm = false;
  registrationKey: string = 'None';
  registrationKeyCount: number = 0;
  pendingJobOrdersCount = 0;
  showSearchModal = false;
  compactMode = false;
  darkMode = false;
  systemLogoSafe: SafeUrl | null = null;
  showLogoutWarning = false;
  logoutCountdown = 60;
  allTicketsNotificationCount: number = 0;
  myTicketsNotificationCount: number = 0;
  previousTicketStates: Map<number, string> = new Map(); // ticketId -> last known status
  previousAssignedStates: Map<number, any> = new Map(); 
  private readonly CACHE_KEY = 'system_settings_cache';
  private readonly CACHE_DURATION = 30 * 60 * 1000;
  private logoutWarningTimer: any;
  private logoutCountdownInterval: any;
  pendingRequisitionsCount = 0;
  showNotificationsModal = false;
  private clockInterval: any;
  messageNotificationCount = 0;
  private messageCountInterval: any;
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  private readonly WARNING_BEFORE = 60;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000;
  private sessionCheckInterval: any;
  private tokenCheckInterval: any;
  isAuthenticated = false;
  isTokenValid = false;
  isRefreshing = false;
  // ✅ New properties for notifications
  ourOrdersUnreadCount: number = 0;
  incomingOrdersUnreadCount: number = 0;
  
  // ✅ Track which orders have been viewed/read
  readOrderIds: Set<number> = new Set<number>();
  notificationMap: Map<number, { type: 'incoming' | 'status_update', status: string }> = new Map();
  
  // ✅ Store all orders
  allOrders: any[] = [];
  clientNotifications: ClientNotification[] = [];
  private _requisitionsNotificationCount: number = 0;
  readonly announcements = [
    { type: 'new',   text: 'IT Support hours: Mon–Fri 8AM – 6PM' },
    { type: 'info',  text: 'Password resets available via self-service portal' },
    { type: 'maint', text: 'Scheduled maintenance: Saturday 2AM – 4AM' },
    { type: 'info',  text: 'New Knowledge Base articles added this week' },
  ];

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private router: Router,
    private http: HttpClient,
    private clientNotificationService: ClientNotificationService,
    private sanitizer: DomSanitizer
  ) {}

  private destroy$ = new Subject<void>();

ngOnInit() {
  // First, verify authentication before loading anything
  this.verifyAuthentication();
  
  // ✅ Load notification data
  this.loadReadOrdersFromStorage();
  this.loadNotificationMapFromStorage();
  
  this.router.events.subscribe((event: any) => {
    if (event.url && event.url.includes('/client/request')) {
      this.markRequisitionNotificationsAsRead();
    }
  });
}

  // =============================================
  // AUTHENTICATION & SECURITY
  // =============================================

  private verifyAuthentication(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const currentUser = this.getStoredUser();
    
    if (!token || !currentUser) {
      this.handleUnauthorized('No valid session found');
      return;
    }

    try {
      const tokenData = this.parseJwt(token);
      const now = Date.now() / 1000;
      
      if (tokenData && tokenData.exp && tokenData.exp < now) {
        this.handleUnauthorized('Session expired');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<{valid: boolean}>(`${this.apiUrl}/api/auth/verify`, { headers }).subscribe({
        next: (response: any) => {
          if (response && response.valid) {
            this.isAuthenticated = true;
            this.isTokenValid = true;
            this.initializeComponent();
            this.startSecurityTimers();
          } else {
            this.handleUnauthorized('User not authorized');
          }
        },
        error: () => {
          this.handleUnauthorized('Authentication failed');
        }
      });
    } catch (error) {
      this.handleUnauthorized('Invalid token');
    }
  }

  private handleUnauthorized(reason: string): void {
    console.warn(`🔒 Unauthorized access attempt: ${reason}`);
    this.clearAllSessionData();
    sessionStorage.setItem('logoutReason', reason);
    sessionStorage.setItem('logoutTime', new Date().toISOString());
    this.router.navigate(['/login'], { 
      queryParams: { 
        reason: 'session_expired',
        timestamp: Date.now()
      }
    });
  }

  private startSecurityTimers(): void {
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 60000);

    this.tokenCheckInterval = setInterval(() => {
      this.validateToken();
    }, 300000);

    this.resetInactivityTimer();
  }

  private checkSessionValidity(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      this.handleUnauthorized('Session lost');
      return;
    }

    try {
      const tokenData = this.parseJwt(token);
      const now = Date.now() / 1000;
      
      if (tokenData && tokenData.exp && tokenData.exp < now) {
        this.handleUnauthorized('Token expired');
        return;
      }

      const currentUser = this.getStoredUser();
      if (currentUser?.locked_until) {
        const lockoutTime = new Date(currentUser.locked_until).getTime();
        if (lockoutTime > Date.now()) {
          this.handleUnauthorized('Account is temporarily locked');
          return;
        }
      }
    } catch (error) {
      this.handleUnauthorized('Session validation failed');
    }
  }

  private validateToken(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get(`${this.apiUrl}/api/auth/validate-token`, { headers }).subscribe({
      error: () => {
        this.handleUnauthorized('Token validation failed');
      }
    });
  }

  private parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  private getStoredUser(): any {
    try {
      const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  private clearAllSessionData(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('system_settings_cache');
    localStorage.removeItem('clientSidebarHidden');
    sessionStorage.clear();
  }

  private initializeComponent(): void {
    this.clientNotificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifs => {
        this.clientNotifications = notifs;
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.handleUnauthorized('User session ended');
          return;
        }
        this.currentUser = user;
        this.loadJobOrdersCount();
        this.loadRequisitionsCount();
        this.loadRegistrationKeys();
        this.loadMyTickets();
        this.loadUserBranch();
      });

    this.messageCountInterval = setInterval(() => this.loadMessageNotificationCount(), 10000);
    setTimeout(() => this.loadMessageNotificationCount(), 2000);

    this.updateDateTime();
    this.clockInterval = setInterval(() => this.updateDateTime(), 1000);

    const saved = localStorage.getItem('clientSidebarHidden');
    if (saved !== null) { this.sidebarHidden = saved === 'true'; }

    this.loadSystemSettings();
  }
get requisitionsNotificationCount(): number {
  return this._requisitionsNotificationCount;
}
// ✅ Persist seen IDs to localStorage
private get seenReqNotificationIds(): Set<number> {
  const stored = localStorage.getItem('clientDash_seenReqIds');
  if (stored) {
    try { return new Set(JSON.parse(stored)); }
    catch { return new Set(); }
  }
  return new Set();
}

private set seenReqNotificationIds(ids: Set<number>) {
  localStorage.setItem('clientDash_seenReqIds', JSON.stringify([...ids]));
}

private addSeenReqIds(ids: number[]): void {
  const current = this.seenReqNotificationIds;
  ids.forEach(id => current.add(id));
  this.seenReqNotificationIds = current;
}

  // =============================================
  // INACTIVITY & AUTO LOGOUT
  // =============================================

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.logoutWarningTimer) clearTimeout(this.logoutWarningTimer);
    
    this.inactivityTimer = setTimeout(() => {
      this.showLogoutWarning = true;
      this.startLogoutCountdown();
    }, this.INACTIVITY_TIMEOUT - (this.WARNING_BEFORE * 1000));
  }

  private startLogoutCountdown(): void {
    this.logoutCountdown = this.WARNING_BEFORE;
    
    this.logoutCountdownInterval = setInterval(() => {
      this.logoutCountdown--;
      if (this.logoutCountdown <= 0) {
        this.performLogout();
      }
    }, 1000);

    this.logoutWarningTimer = setTimeout(() => {
      this.performLogout();
    }, this.WARNING_BEFORE * 1000);
  }

  performLogout() {
    this.clearLogoutTimers();
    this.showLogoutWarning = false;
    this.clearAllSessionData();
    this.authService.logout();
    sessionStorage.setItem('logoutMessage', 'Your session has expired due to inactivity. Please login again.');
    this.router.navigate(['/login']);
  }

  cancelLogout() { 
    this.clearLogoutTimers(); 
    this.showLogoutWarning = false; 
    this.resetInactivityTimer();
  }

  clearLogoutTimers() { 
    if (this.logoutWarningTimer) clearTimeout(this.logoutWarningTimer); 
    if (this.logoutCountdownInterval) clearInterval(this.logoutCountdownInterval); 
  }

  // =============================================
  // LOAD SYSTEM SETTINGS
  // =============================================
  loadSystemSettings() {
    const cached = this.getCachedSettings();
    if (cached) {
      this.applySettings(cached);
      console.log('✅ Using cached system settings');
      return;
    }

    this.http.get<any>(`${this.apiUrl}/api/public/settings`).subscribe({
      next: (data) => {
        this.cacheSettings(data);
        this.applySettings(data);
        console.log('✅ System settings loaded from API and cached');
      },
      error: (err) => {
        console.warn('Could not load system settings from public API:', err);
        const expiredCache = this.getCachedSettings(true);
        if (expiredCache) {
          this.applySettings(expiredCache);
          console.log('⚠️ Using expired cache as fallback');
        } else {
          this.systemTitle = '';
          this.systemLogoSafe = null;
        }
      }
    });
  }

  private cacheSettings(settings: any): void {
    const cacheData = {
      timestamp: Date.now(),
      data: settings
    };
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to cache settings:', e);
    }
  }

  private getCachedSettings(ignoreExpiry: boolean = false): any | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const isExpired = (Date.now() - cacheData.timestamp) > this.CACHE_DURATION;
      
      if (!isExpired || ignoreExpiry) {
        return cacheData.data;
      }
    } catch (e) {
      console.warn('Failed to read cache:', e);
    }
    return null;
  }

  private applySettings(data: any): void {
    if (data && data.general) {
      this.systemTitle = data.general.system_title || '';
    }
    
    if (data && data.logo) {
      let logoUrl = data.logo;
      if (!logoUrl.startsWith('http')) {
        logoUrl = `${this.apiUrl}${logoUrl}`;
      }
      this.systemLogoSafe = this.sanitizer.bypassSecurityTrustUrl(logoUrl);
    } else {
      this.systemLogoSafe = null;
    }
  }

  forceRefreshSettings(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.loadSystemSettings();
  }

  clearSettingsCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
  // =============================================
  // LOAD USER BRANCH
  // =============================================
  loadUserBranch() {
    if (!this.currentUser) {
      console.log('No current user found');
      return;
    }
    
    const branchId = this.currentUser.branch_id;
    
    if (!branchId) {
      console.log('No branch_id found for user, using department as fallback');
      this.currentBranch = {
        name: this.currentUser.department || 'General',
        company_name: '',
        address: ''
      };
      return;
    }

    this.http.get<any[]>(`${this.apiUrl}/api/public/branches`).subscribe({
      next: (branches) => {
        const found = branches.find((b: any) => b.id === Number(branchId));
        if (found) {
          this.currentBranch = found;
          console.log('✅ Loaded user branch from public API:', found);
        } else {
          console.log('⚠️ Branch not found in public list');
          this.currentBranch = {
            name: this.currentUser.department || 'General',
            company_name: '',
            address: ''
          };
        }
      },
      error: (err) => {
        console.error('❌ Failed to load branches from public API:', err);
        this.currentBranch = {
          name: this.currentUser.department || 'General',
          company_name: '',
          address: ''
        };
      }
    });
  }

  goToSlaInfo() { this.router.navigate(['/client/sla-info']); this.activeMenu = null; }

  loadRegistrationKeys() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { this.registrationKey = 'N/A'; return; }
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${this.apiUrl}/api/registration-keys/public`, { headers }).subscribe({
      next: (data: any) => {
        this.registrationKeyCount = data.total || 0;
        if (data.activeKey) { this.registrationKey = data.activeKey; }
        else if (data.hasKeys && !data.hasActiveKeys) { this.registrationKey = 'All used'; }
        else { this.registrationKey = 'None'; }
      },
      error: (err) => {
        console.warn('Could not load registration keys:', err);
        this.registrationKey = err.status === 401 ? 'N/A' : 'Error';
      }
    });
  }
// refresh all data
refreshAll() {
  // Set loading state
  this.isRefreshing = true;
  console.log('🔄 Refreshing all data...');
  
  // Refresh system settings (clears cache too)
  this.forceRefreshSettings();
  
  // Refresh tickets
  this.loadMyTickets();
  
  // Refresh counts
  this.loadJobOrdersCount();
  this.loadRequisitionsCount();
  this.loadMessageNotificationCount();
  this.loadRegistrationKeys();
  
  // Refresh user branch
  this.loadUserBranch();
  
  // Reset loading state after a short delay
  setTimeout(() => {
    this.isRefreshing = false;
  }, 1000);
}
  loadMessageNotificationCount() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const username = currentUser.username;
    if (!username) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${environment.apiUrl}/api/messages/unread/${username}`, { headers }).subscribe({
      next: (unread) => { this.messageNotificationCount = unread.reduce((total: number, item: any) => total + (item.count || 0), 0); },
      error: () => { this.messageNotificationCount = 0; }
    });
  }

  get unreadNotificationsCount(): number { 
  return this.clientNotifications.filter(n => !n.read).length; 
}
  goToContact() { this.router.navigate(['/client/contact']); this.activeMenu = null; }
  markAllNotificationsRead() { this.clientNotificationService.markAllAsRead(); }
  clearAllNotifications() { this.showClearConfirm = true; }
  confirmClearAll() { this.clientNotificationService.clearAll(); this.showClearConfirm = false; this.closeNotificationsModal(); }
  cancelClearAll() { this.showClearConfirm = false; }
  dismissSingleNotification(id: string) { this.clientNotificationService.dismissNotification(id); }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '🚨' };
    return icons[type] || '📢';
  }

  openNotificationsModal() { this.showNotificationsModal = true; }
  closeNotificationsModal() { this.showNotificationsModal = false; }

  @ViewChild(AiAssistantComponent) aiAssistant!: AiAssistantComponent;

  get aiContext() {
    return {
      currentUser: this.currentUser,
      openTicketsCount: this.openTicketsCount,
      resolvedTicketsCount: this.resolvedTicketsCount,
      criticalTicketsCount: this.criticalTicketsCount,
      pendingJobOrdersCount: this.pendingJobOrdersCount,
      pendingRequisitionsCount: this.pendingRequisitionsCount,
    };
  }

  openAIAssistant() { this.activeMenu = null; this.aiAssistant?.open(); }

  clearFilters() { this.searchTerm = ''; this.currentView = 'all'; this.router.navigate(['/client/tickets']); this.activeMenu = null; }
  goToKnowledgeBase() { this.router.navigate(['/client/knowledge-base']); this.activeMenu = null; }
  newJobOrder() { this.router.navigate(['/client/job-orders/new']); this.activeMenu = null; }
  newRequisition() { this.router.navigate(['/client/request/new']); this.activeMenu = null; }
  searchAll() { this.showSearchModal = true; this.activeMenu = null; }
  goToMyStats() { this.router.navigate(['/client/my-stats']); this.activeMenu = null; }
  goToCalendar() { this.router.navigate(['/client/calendar']); this.activeMenu = null; }
  goTofeature() { this.router.navigate(['/client/features']); this.activeMenu = null; }
  goToNotifications() { this.showNotificationsModal = true; this.activeMenu = null; }
  downloadApp() { alert('📱 Mobile App\n\nComing soon! Available for iOS and Android.'); this.activeMenu = null; }
  checkSystemStatus() { this.router.navigate(['/client/system-status']); this.activeMenu = null; }
  goToFAQ() { this.router.navigate(['/client/faq']); this.activeMenu = null; }
  goToVideoTutorials() { window.open('https://edptech.com/tutorials', '_blank'); this.activeMenu = null; }
  reportBug() { this.router.navigate(['/client/tickets/new'], { queryParams: { type: 'bug' } }); this.activeMenu = null; }
  submitFeedback() { this.router.navigate(['/client/feedback']); this.activeMenu = null; }

  toggleCompactMode() { this.compactMode = !this.compactMode; document.body.classList.toggle('compact-mode', this.compactMode); this.activeMenu = null; }
  toggleDarkMode() { this.darkMode = !this.darkMode; document.body.classList.toggle('dark-mode', this.darkMode); this.activeMenu = null; }

  exportMyData() {
    const data = { user: this.currentUser, tickets: this.myTickets, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edptech_my_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.activeMenu = null;
  }
// ✅ Load read orders from localStorage
loadReadOrdersFromStorage() {
  const stored = localStorage.getItem('clientReadJobOrders');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      this.readOrderIds = new Set(parsed);
    } catch (e) {
      this.readOrderIds = new Set();
    }
  }
}
// ✅ Save read orders to localStorage
saveReadOrdersToStorage() {
  localStorage.setItem('clientReadJobOrders', JSON.stringify(Array.from(this.readOrderIds)));
}
// ✅ Load notification map from localStorage
loadNotificationMapFromStorage() {
  const stored = localStorage.getItem('clientJobOrderNotifications');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      this.notificationMap = new Map(parsed);
    } catch (e) {
      this.notificationMap = new Map();
    }
  }
}
// ✅ Save notification map to localStorage
saveNotificationMapToStorage() {
  localStorage.setItem('clientJobOrderNotifications', JSON.stringify(Array.from(this.notificationMap.entries())));
}

// ✅ Update notification counts
updateNotificationCounts() {
  // 📤 Our Job Orders: Count orders with status updates
  const ourOrders = this.getAllOurOrders();
  this.ourOrdersUnreadCount = ourOrders.filter(o => {
    return this.notificationMap.has(o.id) && 
           this.notificationMap.get(o.id)?.type === 'status_update';
  }).length;
  
  // 📥 J.O. Request Management: Count new/forwarded orders
  const incomingOrders = this.getAllIncomingOrders();
  this.incomingOrdersUnreadCount = incomingOrders.filter(o => {
    return this.notificationMap.has(o.id) && 
           this.notificationMap.get(o.id)?.type === 'incoming';
  }).length;
  
  // ✅ Total unread count for the sidebar badge
  this.pendingJobOrdersCount = this.ourOrdersUnreadCount + this.incomingOrdersUnreadCount;
}
// ✅ Get all orders for "Our Job Orders" view
getAllOurOrders(): any[] {
  const userBranchId = Number(this.currentUser?.branch_id);
  const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
  const userId = Number(this.currentUser?.id);
  
  return this.allOrders.filter(jo => {
    const submittedById = Number(jo.submitted_by);
    const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
    const forwardedToDeptId = Number(jo.forwarded_to_department_id);
    const orderBranchId = Number(jo.branch_id);
    const orderDeptId = Number(jo.department_id || jo.dept_id);
    
    // ❌ EXCLUDE: Forwarded TO us FROM another department (this is incoming)
    if (jo.is_forwarded && 
        forwardedToBranchId === userBranchId && 
        forwardedToDeptId === userDeptId &&
        !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
      return false;
    }
    
    // ❌ EXCLUDE: Non-forwarded order destined for our department but NOT created by us
    if (!jo.is_forwarded && 
        orderBranchId === userBranchId && 
        orderDeptId === userDeptId && 
        submittedById !== userId) {
      return false;
    }
    
    return true;
  });
}
getAllIncomingOrders(): any[] {
  const userBranchId = Number(this.currentUser?.branch_id);
  const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
  const userId = Number(this.currentUser?.id);
  
  return this.allOrders.filter(jo => {
    const submittedById = Number(jo.submitted_by);
    const orderBranchId = Number(jo.branch_id);
    const orderDeptId = Number(jo.department_id || jo.dept_id);
    const forwardedToBranchId = Number(jo.forwarded_to_branch_id);
    const forwardedToDeptId = Number(jo.forwarded_to_department_id);
    
    // ✅ Forwarded TO us from another department
    if (jo.is_forwarded && 
        forwardedToBranchId === userBranchId && 
        forwardedToDeptId === userDeptId &&
        !(orderBranchId === userBranchId && orderDeptId === userDeptId)) {
      return true;
    }
    
    // ✅ Non-forwarded order destined for our department but NOT created by us
    if (!jo.is_forwarded && 
        orderBranchId === userBranchId && 
        orderDeptId === userDeptId && 
        submittedById !== userId) {
      return true;
    }
    
    return false;
  });
}
// ✅ Check for new or forwarded orders
checkForNewOrders() {
  const userBranchId = Number(this.currentUser?.branch_id);
  const userDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
  const userId = Number(this.currentUser?.id);
  
  this.allOrders.forEach(o => {
    // Skip if already has a notification or is already read
    if (this.notificationMap.has(o.id) || this.readOrderIds.has(o.id)) return;
    
    const submittedById = Number(o.submitted_by);
    const orderBranchId = Number(o.branch_id);
    const orderDeptId = Number(o.department_id || o.dept_id);
    const forwardedToBranchId = Number(o.forwarded_to_branch_id);
    const forwardedToDeptId = Number(o.forwarded_to_department_id);
    
    const isForUs = (orderBranchId === userBranchId && orderDeptId === userDeptId);
    const isForwardedToUs = o.is_forwarded && 
                           (forwardedToBranchId === userBranchId && forwardedToDeptId === userDeptId);
    const isFromOthers = submittedById !== userId;
    
    // ✅ Check for incoming notifications (new or forwarded orders)
    if ((isForUs || isForwardedToUs) && isFromOthers) {
      this.notificationMap.set(o.id, { type: 'incoming', status: '' });
      this.saveNotificationMapToStorage();
    }
    
    // ✅ Check for status updates (for Our Job Orders)
    const isStatusUpdate = o.status && ['approved', 'assigned', 'forwarded', 'done'].includes(o.status);
    if (isStatusUpdate && (o.is_forwarded && o.forwarded_by_name === this.currentUser?.fullname)) {
      if (!this.notificationMap.has(o.id)) {
        this.notificationMap.set(o.id, { type: 'status_update', status: o.status });
        this.saveNotificationMapToStorage();
      }
    }
  });
}
 loadJobOrdersCount() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
    next: (data) => {
      this.allOrders = Array.isArray(data) ? data : [];
      
      // ✅ Check for new notifications
      this.checkForNewOrders();
      
      // ✅ Update notification counts
      this.updateNotificationCounts();
    },
    error: () => {
      this.pendingJobOrdersCount = 0;
    }
  });
}
// ✅ Mark all job orders as read when clicking the link
markJobOrdersAsRead() {
  // Mark all orders in both views as read
  const ourOrders = this.getAllOurOrders();
  const incomingOrders = this.getAllIncomingOrders();
  const allOrders = [...ourOrders, ...incomingOrders];
  
  allOrders.forEach(order => {
    if (order.id) {
      this.readOrderIds.add(order.id);
      if (this.notificationMap.has(order.id)) {
        this.notificationMap.delete(order.id);
      }
    }
  });
  
  this.saveReadOrdersToStorage();
  this.saveNotificationMapToStorage();
  this.updateNotificationCounts();
}
  goToAbout() { this.router.navigate(['/client/about']); this.activeMenu = null; }
  goToShortcuts() { this.router.navigate(['/client/shortcuts']); this.activeMenu = null; }

 loadRequisitionsCount() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
      next: (data) => { 
        const reqs = Array.isArray(data) ? data : [];
        
        // Keep pending count for widget if needed
        this.pendingRequisitionsCount = reqs.filter(r => (r.status || 'pending') === 'pending').length;
        
        // Get current user info
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userBranchId = currentUser?.branch_id;
        const userDeptId = currentUser?.department_id;
        const userId = currentUser?.id;
        
        // ✅ Calculate notification count (exclude seen IDs)
        const seenIds = this.seenReqNotificationIds;
        
        this._requisitionsNotificationCount = reqs.filter(r => {
          // Skip if already seen
          if (seenIds.has(r.id)) return false;
          
          const creatorBranch = r.creator_branch_id;
          const creatorDept = r.creator_dept_id;
          const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
          
          const isIncoming = 
            (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) ||
            (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept);
          
          if (!isIncoming) return false;
          
          // 1. New pending requests
          if (r.status === 'pending') return true;
          // 2. Forwarded requests on process
          if (r.is_forwarded && r.forwarded_status === 'processing') return true;
          // 3. Forwarded requests released by recipient
          if (r.is_forwarded && r.forwarded_status === 'released') return true;
          
          return false;
        }).length;
      },
      error: () => { 
        this.pendingRequisitionsCount = 0; 
        this._requisitionsNotificationCount = 0;
      }
    });
}
markRequisitionNotificationsAsRead(): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
    next: (data) => {
      const reqs = Array.isArray(data) ? data : [];
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userBranchId = currentUser?.branch_id;
      const userDeptId = currentUser?.department_id;
      const userId = currentUser?.id;
      
      const idsToMark: number[] = [];
      
      reqs.forEach(r => {
        const creatorBranch = r.creator_branch_id;
        const creatorDept = r.creator_dept_id;
        const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
        
        const isIncoming = 
          (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) ||
          (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept);
        
        if (isIncoming) {
          idsToMark.push(r.id);
        }
      });
      
      this.addSeenReqIds(idsToMark);
      this._requisitionsNotificationCount = 0;
    },
    error: () => {}
  });
}
getNotificationCount(): number {
  if (this.isEDPUser()) {
    return this.allTicketsNotificationCount;
  }
  return this.myTicketsNotificationCount;
}

markAllTicketsRead(): void {
  if (this.isEDPUser()) {
    this.allTicketsNotificationCount = 0;
  } else {
    this.myTicketsNotificationCount = 0;
  }
}
 ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.messageCountInterval) clearInterval(this.messageCountInterval);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.sessionCheckInterval) clearInterval(this.sessionCheckInterval);
    if (this.tokenCheckInterval) clearInterval(this.tokenCheckInterval);
    this.destroy$.next();
    this.clearLogoutTimers();
    this.destroy$.complete();
  }

  get isContactRoute(): boolean { return this.router.url === '/client/contact'; }

  get isDashboardRoute(): boolean { return this.router.url === '/client/dashboard' || this.router.url === '/client'; }
  goToProfile() { this.router.navigate(['/client/profile']); }

  startInactivityTimer() { this.resetInactivityTimer(); }


  autoLogout() {
    this.showLogoutWarning = true;
    this.logoutCountdown = 60;
    this.logoutCountdownInterval = setInterval(() => {
      this.logoutCountdown--;
      if (this.logoutCountdown <= 0) { this.performLogout(); }
    }, 1000);
    this.logoutWarningTimer = setTimeout(() => { this.performLogout(); }, 60000);
  }

  get isProfileRoute(): boolean { return this.router.url === '/client/profile'; }
  get isTicketListRoute(): boolean { return this.router.url === '/client/tickets' || this.router.url.startsWith('/client/tickets?'); }
  get isNewTicketRoute(): boolean { return this.router.url === '/client/tickets/new'; }
  get statusBarLabel(): string {
  if (this.isNewTicketRoute) return 'New Ticket';
  if (this.isTicketListRoute) return this.isEDPUser() ? 'All Tickets' : 'My Tickets';
  return 'Dashboard';
}
// Add this method to the class
isEDPUser(): boolean {
  if (!this.currentUser) return false;
  const dept = (this.currentUser.department || this.currentUser.department_name || '').toLowerCase();
  const isEDP = dept === 'edp' || dept === 'it' || dept === 'edp/it' || dept === 'it/edp' ||
                dept.includes('edp') || dept.includes('it');
  return isEDP;
}
  updateDateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString();
    this.currentTime = now.toLocaleTimeString();
  }

loadMyTickets() {
  this.ticketService.tickets$
    .pipe(takeUntil(this.destroy$))
    .subscribe(tickets => {
      const currentTickets = tickets || [];
      
      // Detect changes for notifications
      this.detectTicketChanges(currentTickets);
      
      this.myTickets = currentTickets.map(t => ({
        id: t.id, 
        ticket_number: t.ticket_number, 
        title: t.title,
        status: t.status, 
        priority: t.priority,
        location: t.location || 'General',
        created_at: t.created_at, 
        description: t.description,
      }));
    });
    
  this.ticketService.fetchTickets();
}
private detectTicketChanges(tickets: any[]): void {
  if (!this.currentUser) return;
  
  const currentUserId = this.currentUser?.id;
  
  tickets.forEach(ticket => {
    const prevStatus = this.previousTicketStates.get(ticket.id);
    const prevAssignedSnapshot = this.previousAssignedStates.get(ticket.id);
    const currentAssignedSnapshot = this.getAssignedSnapshot(ticket);
    
    this.previousTicketStates.set(ticket.id, ticket.status);
    this.previousAssignedStates.set(ticket.id, currentAssignedSnapshot);
    
    const isFirstLoad = !prevStatus;
    
    // ✅ ONLY notify if current user is the TICKET CREATOR
    if (this.isCurrentUserCreator(ticket)) {
      if (isFirstLoad) return; // Don't notify on first load
      
      // Status change notification for creator
      if (prevStatus !== ticket.status && 
          ['assigned', 'in_progress', 'pending', 'resolved'].includes(ticket.status)) {
        this.myTicketsNotificationCount++;
      }
    }
    
    // ✅ ONLY notify if current user is an ASSIGNED AGENT
    if (currentAssignedSnapshot.includes(currentUserId)) {
      const wasAssigned = prevAssignedSnapshot ? 
        prevAssignedSnapshot.includes(currentUserId) : false;
      
      if (!wasAssigned && ticket.status === 'assigned') {
        // Only increment if this user was just assigned
        if (this.isEDPUser()) {
          this.allTicketsNotificationCount++;
        } else {
          this.myTicketsNotificationCount++;
        }
      }
    }
  });
}
private getAssignedSnapshot(ticket: any): number[] {
  const ids: number[] = [];
  
  // Add single assigned_to if exists
  if (ticket.assigned_to) {
    ids.push(ticket.assigned_to);
  }
  
  // Add all from assigned_users array
  const assignedUsers = ticket.assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers)) {
    assignedUsers.forEach((u: any) => {
      const id = typeof u === 'object' ? u.id : u;
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    });
  }
  
  return ids;
}
// Add this helper method
private wasCurrentUserAssigned(ticketId: number, prevAssigned: any): boolean {
  if (!prevAssigned) return false;
  
  // prevAssigned could be a single ID or undefined
  if (typeof prevAssigned === 'number') {
    return prevAssigned === this.currentUser?.id;
  }
  
  // Check if we have the previous assigned_users from the map
  // Since we only store assigned_to (single ID), compare with that
  return prevAssigned === this.currentUser?.id;
}

private isCurrentUserCreator(ticket: any): boolean {
  return ticket.created_by === this.currentUser?.id || 
         ticket.created_by_name === this.currentUser?.fullname;
}

private isCurrentUserAssigned(ticket: any): boolean {
  if (ticket.assigned_to === this.currentUser?.id) return true;
  const assignedUsers = ticket.assigned_users;
  if (assignedUsers && Array.isArray(assignedUsers)) {
    return assignedUsers.some((u: any) => {
      if (typeof u === 'object') return u.id === this.currentUser?.id;
      return u === this.currentUser?.id;
    });
  }
  return false;
}
 get openTicketsCount(): number { 
  const count = this.getNotificationCount();
  return count > 0 ? count : this.myTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
}
  get resolvedTicketsCount(): number { return this.myTickets.filter(t => t.status === 'resolved').length; }
  get criticalTicketsCount(): number { return this.myTickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length; }

  get statusDistribution(): { label: string; count: number; percentage: number; color: string }[] {
    const statuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
    const labels: Record<string, string> = { new: 'New', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
    const colors: Record<string, string> = { new: '#0ea5e9', assigned: '#f59e0b', in_progress: '#4f46e5', resolved: '#22c55e', closed: '#94a3b8' };
    const total = this.myTickets.length || 1;
    return statuses.map(s => ({
      label: labels[s],
      count: this.myTickets.filter(t => t.status === s).length,
      percentage: (this.myTickets.filter(t => t.status === s).length / total) * 100,
      color: colors[s],
    }));
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = { new: '🆕', assigned: '📌', in_progress: '⚙️', pending: '⏳', resolved: '✅', closed: '🔒' };
    return icons[status] || '📋';
  }

  goToDashboard() { this.router.navigate(['/client/dashboard']); }
  goToAnnouncements() { this.router.navigate(['/client/announcements']); }

  setView(view: string) {
    this.currentView = view;
    const qp = view !== 'all' ? { status: view } : {};
    this.router.navigate(['/client/tickets'], { queryParams: qp });
    this.activeMenu = null;
  }

  newTicket() { this.router.navigate(['/client/tickets/new']); this.activeMenu = null; }
  viewTicket(id: number) { this.router.navigate(['/client/tickets', id]); }
  toggleMenu(menu: string) { this.activeMenu = this.activeMenu === menu ? null : menu; }
  closeAllMenus() { this.activeMenu = null; }

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
    localStorage.setItem('clientSidebarHidden', String(this.sidebarHidden));
    this.activeMenu = null;
  }

  doSearch() { if (this.searchTerm.trim()) { this.router.navigate(['/client/tickets'], { queryParams: { search: this.searchTerm } }); } }
  clearSearch() { this.searchTerm = ''; this.router.navigate(['/client/tickets']); this.activeMenu = null; }
  focusSearch() { (document.querySelector('.search-box input') as HTMLInputElement | null)?.focus(); this.activeMenu = null; }
  refreshData() { this.loadMyTickets(); this.activeMenu = null; }
  printPage() { window.print(); this.activeMenu = null; }
  logout() { this.authService.logout(); }

  exportMyTickets() {
    const blob = new Blob([JSON.stringify(this.myTickets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_${this.currentUser?.username ?? 'user'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.activeMenu = null;
  }

  about() { alert('My Support Portal v2.0\nPart of EDPtech Helpdesk System\n\n© 2024 EDPtech. All rights reserved.'); this.activeMenu = null; }
  shortcuts() { alert('Keyboard Shortcuts\n\nCtrl+N — New Ticket\nEnter  — Search\nF5     — Refresh\nEsc    — Close menus'); this.activeMenu = null; }
  showContact() { alert('Contact IT Support\n\nEmail: support@edptech.com\nPhone: ext. 1234\nHours: Mon–Fri 8AM – 6PM\n\nEmergency: ext. 9911'); this.activeMenu = null; }
  showAlert(msg: string) { alert(msg); this.activeMenu = null; }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  @HostListener('document:scroll')
  @HostListener('document:touchstart')
  onUserActivity() { this.resetInactivityTimer(); }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'n') { event.preventDefault(); this.newTicket(); }
    if (event.key === 'F5') { event.preventDefault(); this.refreshData(); }
    if (event.key === 'Escape') { this.activeMenu = null; }
  }
}