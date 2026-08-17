import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TicketService, Ticket } from '../../services/ticket.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AiAssistantComponent } from '../shared/ai-assistant/ai-assistant.component';
import { ReportModalComponent } from './report-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
 imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, AiAssistantComponent, ReportModalComponent ],
  template: `
    <div class="app-container" (click)="closeAllMenus()">

      <!-- Menu Bar -->
      <div class="menu-bar" (click)="$event.stopPropagation()">
        <div class="menu-item" (click)="toggleMenu('file')">
  File
  <div class="dropdown" *ngIf="activeMenu === 'file'">
    <div class="dropdown-item" (click)="newTicket()">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
  New Ticket
</div>
    <div class="dropdown-item" (click)="goToTickets()">🎫 View All Tickets</div>
    <div class="dropdown-item" (click)="goToKnowledgeBase()">📚 Knowledge Base</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" (click)="refreshData()">🔄 Refresh Data</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" (click)="exit()">🚪 Exit</div>
  </div>
</div>
        <div class="menu-item" (click)="toggleMenu('edit')">
          Edit
          <div class="dropdown" *ngIf="activeMenu === 'edit'">
            <div class="dropdown-item" (click)="searchTickets()">🔍 Search Tickets</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" (click)="clearFilters()">🗑️ Clear Filters</div>
            <div class="dropdown-item" (click)="refreshData()">🔄 Refresh</div>
          </div>
        </div>
        <div class="menu-item" (click)="toggleMenu('view')">
          View
          <div class="dropdown" *ngIf="activeMenu === 'view'">
            <div class="dropdown-item" (click)="toggleSidebar()">
              {{ sidebarHidden ? '📂 Show Sidebar' : '📁 Hide Sidebar' }}
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" (click)="setViewMode('list')">
              <span *ngIf="currentViewMode === 'list'">✔ </span>📋 List View
            </div>
            <div class="dropdown-item" (click)="setViewMode('grid')">
              <span *ngIf="currentViewMode === 'grid'">✔ </span>🔲 Grid View
            </div>
            <div class="dropdown-item" (click)="setViewMode('kanban')">
              <span *ngIf="currentViewMode === 'kanban'">✔ </span>📊 Kanban View
            </div>
          </div>
        </div>
        <div class="menu-item" (click)="toggleMenu('tools')">
          Tools
          <div class="dropdown" *ngIf="activeMenu === 'tools'">
           <div class="dropdown-item" (click)="goToFeatures()">💾 Features</div>
            <div class="dropdown-item" (click)="backupData()">
  💾 {{ cacheStatus === 'Exporting...' ? '⏳ Exporting Database...' : 'Backup Database' }}
</div>
            <div class="dropdown-item" (click)="restoreData()">🔄 Restore Data</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" (click)="systemHealth()">🩺 System Health Check</div>
            <div class="dropdown-item" (click)="clearCache()">🗑️ Clear Cache</div>
          </div>
        </div>
        <div class="menu-item" (click)="toggleMenu('reports')">
          Reports
          <div class="dropdown" *ngIf="activeMenu === 'reports'">
            <div class="dropdown-item" (click)="generateReport('daily')">📅 Daily Report</div>
            <div class="dropdown-item" (click)="generateReport('weekly')">📆 Weekly Report</div>
            <div class="dropdown-item" (click)="generateReport('monthly')">📊 Monthly Report</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" (click)="generateReport('sla')">⏱️ SLA Performance</div>
            <div class="dropdown-item" (click)="generateReport('agent')">👥 Agent Performance</div>
          </div>
        </div>
        <div class="menu-item" (click)="toggleMenu('cctv')">
    📹 CCTV
    <div class="dropdown" *ngIf="activeMenu === 'cctv'">
      <div class="dropdown-item" (click)="goToCCTVInfo()">📹 View CCTV Dashboard</div>
    </div>
  </div>
  
        <div class="menu-item" (click)="toggleMenu('help')">
  Help
  <div class="dropdown" *ngIf="activeMenu === 'help'">
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" (click)="goToAbout()">ℹ️ About</div>
    <div class="dropdown-item" (click)="goToDocumentation()">📖 Documentation</div>
    <div class="dropdown-item" (click)="goToShortcuts()">⌨️ Keyboard Shortcuts</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" (click)="goToUpdates()">🔄 Check for Updates</div>
    <div class="dropdown-item" (click)="goToSupport()">🆘 Support</div>
  </div>
</div>
      </div>  
      <!-- Toolbar -->
      <div class="toolbar">
       <button class="toolbar-btn" (click)="toggleSidebar()" title="Toggle Sidebar">
    <span>{{ sidebarHidden ? '☰' : '❌' }}</span>
    <span class="badge" *ngIf="(pendingJobOrdersCount + requisitionsNotificationCount) > 0">
        {{ (pendingJobOrdersCount + requisitionsNotificationCount) > 99 ? '99+' : (pendingJobOrdersCount + requisitionsNotificationCount) }}
    </span>
</button>
        <div class="toolbar-separator"></div>
        <div class="toolbar-separator"></div>
        <button class="toolbar-btn" (click)="goToDashboard()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
  Dashboard
</button>
       <button class="toolbar-btn" [class.active-btn]="isProfileRoute" (click)="goToProfile()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
  </svg>
  Profile
</button>
      <!-- All Tickets -->
<button class="toolbar-btn" routerLinkActive="active" (click)="goToTickets()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9h18M3 15h18M9 3v18"/>
  </svg>
  All Tickets
  <span class="badge" *ngIf="newTicketsCount > 0">{{ newTicketsCount }}</span>
</button>

<!-- Chat -->
<button class="toolbar-btn" (click)="goToChat()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  Chat
  <span class="badge" *ngIf="unreadMessagesCount > 0">{{ unreadMessagesCount }}</span>
</button>

<!-- Manage Users -->
<button class="toolbar-btn" routerLinkActive="active" (click)="goToUsers()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="7" r="4"/>
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
  Manage Users
</button>

<!-- Knowledge Base -->
<button class="toolbar-btn" (click)="goToKnowledgeBase()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
  Knowledge Base
</button>
        <div class="toolbar-separator"></div>
        
        <app-ai-assistant 
  #aiAssistant 
  [context]="aiContext"
  [userPhotoUrl]="currentUser?.photo_url ? (apiUrl + currentUser.photo_url) : ''"
  [userAvatarColor]="currentUser?.avatar_color || '#0a246a'"
  [userInitial]="currentUser?.fullname?.charAt(0)?.toUpperCase() || '?'">
</app-ai-assistant>
        <button class="toolbar-btn" (click)="openAIAssistant()" title="AI Assistant">
  🤖
</button>
        <app-notification-bell></app-notification-bell>
        
        <button class="quick-action-btn" (click)="refreshData()">
              <span>🔄</span> Refresh Data
            </button>
        <div class="spacer"></div>
        <div class="status-bar-info">
  <!-- User Avatar -->
  <div class="user-avatar-small" [style.background]="currentUser?.avatar_color || '#0a3a8c'">
    <img *ngIf="currentUser?.photo_url" [src]="'${environment.apiUrl}' + currentUser.photo_url" alt="Avatar" class="user-photo-small">
    <span *ngIf="!currentUser?.photo_url">{{ currentUser?.fullname?.charAt(0)?.toUpperCase() || '?' }}</span>
  </div>
  <span>{{ currentUser?.fullname }} ({{ currentUser?.role }})</span>
  <button class="logout-btn" (click)="logout()">Logout</button>
</div>
      </div>

      <!-- Main Layout -->
      <div class="main-layout">

       <!-- Sidebar -->
<div class="sidebar" [class.sidebar-hidden]="sidebarHidden">
 <div class="sidebar-header">
  <h3>{{ systemSettings?.system_title || 'EDPtech Ticketing System' }}</h3>
</div>
  <div class="sidebar-menu">
    <a routerLink="/dashboard" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
  Dashboard
</a>
   <!-- All Tickets -->
<a routerLink="/tickets" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 9h18M3 15h18M9 3v18"/>
  </svg>
  All Tickets
  <span class="badge" *ngIf="newTicketsCount > 0">{{ newTicketsCount }}</span>
</a>

<!-- Manage Job Orders -->
<a routerLink="/admin/job-orders" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
  Manage Job Orders
  <span class="badge" *ngIf="pendingJobOrdersCount > 0">{{ pendingJobOrdersCount }}</span>
</a>

<!-- Manage Requisitions -->
<a routerLink="/admin/requisitions" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
    <path d="M3 8l9 5 9-5M12 13v8"/>
  </svg>
  Manage Requisitions
  <span class="badge" *ngIf="requisitionsNotificationCount > 0">{{ requisitionsNotificationCount }}</span>
</a>
    <!-- Knowledge Base Section -->
    <div class="sidebar-divider"></div>
    <a routerLink="/knowledge-base" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
  Knowledge Base
</a>
    
    <!-- Reports Section -->
    <div class="sidebar-divider"></div>
   <a routerLink="/admin/reports" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 3v18h18"/>
    <rect x="7" y="12" width="3" height="6" rx="0.5"/>
    <rect x="12" y="8" width="3" height="10" rx="0.5"/>
    <rect x="17" y="4" width="3" height="14" rx="0.5"/>
  </svg>
  Reports
</a>
    
    <!-- Admin/Management Section (only visible to admins and agents) -->
<ng-container *ngIf="currentUser">
  <div class="sidebar-divider"></div>
  <div class="sidebar-section-title">Management</div>

  <a *ngIf="currentUser?.user_table === 'users'" routerLink="/admin/users-management" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="9" cy="7" r="4"/>
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
  User Management
</a>

  <a routerLink="/admin/registration-keys" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
  Registration Keys
</a>

 <a routerLink="/admin/departments" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"/>
  </svg>
  Org Directory
</a>

 <a routerLink="/admin/computer-monitoring" routerLinkActive="active" class="sidebar-link" style="position: relative;">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
  Computer Monitoring
  <span *ngIf="computerMonitoringNotifCount > 0" class="sidebar-notif-badge">
    {{ computerMonitoringNotifCount > 99 ? '99+' : computerMonitoringNotifCount }}
  </span>
</a>

  <a routerLink="/admin/announcements" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 11l18-8-8 18-3-7-7-3z"/>
  </svg>
  Manage Announcements
</a>
</ng-container>

<!-- System Section (admin, head/manager, supervisor) -->
<ng-container *ngIf="hasSystemAccess()">
  <div class="sidebar-divider"></div>
  <div class="sidebar-section-title">System</div>
  
  <a routerLink="/admin/settings" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
  System Settings
</a>

  <a routerLink="/admin/database" routerLinkActive="active" class="sidebar-link" *ngIf="isAdminUser()">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
  Database
</a>
 <a routerLink="/admin/logs" routerLinkActive="active" class="sidebar-link">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
  System Logs
</a>
 <a routerLink="/admin/system-health" routerLinkActive="active" class="sidebar-link" *ngIf="isAdminUser()">
  <svg class="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
  System Health
</a>
</ng-container>
  </div>
  
  <div class="sidebar-footer">
    <!-- Connection Status -->
    <div class="connection-status">
      <div class="status-light" [class.connected]="isOnline"></div>
      <span>{{ isOnline ? 'Connected' : 'Offline Mode' }}</span>
    </div>
    
    <!-- Database Connection Status -->
    <div class="connection-status" *ngIf="currentUser?.role === 'admin'">
      <div class="status-light" [class.connected]="dbConnected"></div>
      <span>{{ dbConnected ? 'DB: Connected' : 'DB: Disconnected' }}</span>
    </div>
    
    <!-- API Status -->
    <div class="connection-status" *ngIf="currentUser?.role === 'admin'">
      <div class="status-light" [class.connected]="apiOnline"></div>
      <span>{{ apiOnline ? 'API: Online' : 'API: Offline' }}</span>
    </div>
  </div>
</div>

        <!-- Content Area -->
        <div class="content-area">

        <!-- Dashboard Widgets -->
<div class="dashboard-widgets" *ngIf="isDashboardView">

  <div class="widget" *ngIf="!systemSettings?.appearanceSettings?.show_priority_widget !== false">
    <div class="widget-header">📊 Priority Distribution</div>
    <div class="widget-content">
      <div class="priority-stats">
        <div class="priority-row" *ngFor="let p of priorityLevels">
          <span class="priority-label" [class]="p.key">{{ p.label }}</span>
          <span class="priority-count">{{ getPriorityCount(p.key) }}</span>
          <div class="priority-track">
            <div class="priority-fill" [class]="p.key"
                 [style.width.%]="totalTickets > 0 ? (getPriorityCount(p.key) / totalTickets * 100) : 0">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="widget" *ngIf="!systemSettings?.appearanceSettings?.show_issues_widget !== false">
    <div class="widget-header">🔥 Top Issues</div>
    <div class="widget-content">
      <div class="issue-list">
        <div class="issue-item" *ngFor="let issue of topIssues.slice(0, 3)">
          <span class="issue-name">{{ issue.location }}</span>
          <span class="issue-count">{{ issue.count }}</span>
        </div>
        <div class="issue-item empty" *ngIf="topIssues.length === 0">
          <span class="issue-name">No open issues</span>
        </div>
      </div>
      <div class="widget-footer" *ngIf="topIssues.length > 3">
        <button class="see-more-btn" (click)="showAllIssues = !showAllIssues">
          {{ showAllIssues ? '🔼 Show Less' : '🔽 See More (' + (topIssues.length - 3) + ' more)' }}
        </button>
        <div class="issue-list" *ngIf="showAllIssues">
          <div class="issue-item" *ngFor="let issue of topIssues.slice(3)">
            <span class="issue-name">{{ issue.location }}</span>
            <span class="issue-count">{{ issue.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="widget">
    <div class="widget-header">🕐 Recent Activity</div>
    <div class="widget-content">
      <div class="activity-list">
        <div class="activity-item" *ngFor="let ticket of recentTickets.slice(0, 3)">
          <span class="activity-icon">{{ getStatusIcon(ticket.status) }}</span>
          <div class="activity-info">
            <div class="activity-title">{{ ticket.title }}</div>
            <div class="activity-meta">#{{ ticket.ticket_number }} · {{ ticket.created_at | date:'short' }}</div>
          </div>
          <span class="priority-badge" [class]="ticket.priority">{{ ticket.priority }}</span>
        </div>
        <div class="activity-item empty" *ngIf="recentTickets.length === 0">
          <div class="activity-info">
            <div class="activity-title">No recent activity</div>
          </div>
        </div>
      </div>
      <div class="widget-footer" *ngIf="recentTickets.length > 3">
        <button class="see-more-btn" (click)="showAllActivity = !showAllActivity">
          {{ showAllActivity ? '🔼 Show Less' : '🔽 See More (' + (recentTickets.length - 3) + ' more)' }}
        </button>
        <div class="activity-list" *ngIf="showAllActivity">
          <div class="activity-item" *ngFor="let ticket of recentTickets.slice(3)">
            <span class="activity-icon">{{ getStatusIcon(ticket.status) }}</span>
            <div class="activity-info">
              <div class="activity-title">{{ ticket.title }}</div>
              <div class="activity-meta">#{{ ticket.ticket_number }} · {{ ticket.created_at | date:'short' }}</div>
            </div>
            <span class="priority-badge" [class]="ticket.priority">{{ ticket.priority }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Requisitions Widget -->
<div class="widget">
  <div class="widget-header">📩 Requisitions Overview</div>
  <div class="widget-content">
    <div class="priority-stats">
      <div class="priority-row">
        <span class="priority-label" style="color:#cc6600;">Pending</span>
        <span class="priority-count">{{ pendingRequisitionsCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#cc6600;"
               [style.width.%]="allReqsTotal > 0 ? (pendingRequisitionsCount / allReqsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div class="priority-row">
        <span class="priority-label" style="color:#008800;">Received</span>
        <span class="priority-count">{{ receivedRequisitionsCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#008800;"
               [style.width.%]="allReqsTotal > 0 ? (receivedRequisitionsCount / allReqsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div class="priority-row">
        <span class="priority-label" style="color:#cc0000;">Rejected</span>
        <span class="priority-count">{{ rejectedRequisitionsCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#cc0000;"
               [style.width.%]="allReqsTotal > 0 ? (rejectedRequisitionsCount / allReqsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-top:8px;">
        <a routerLink="/admin/requisitions" style="color:#0a246a;font-size:10px;text-decoration:none;">→ View All Requisitions</a>
      </div>
    </div>
  </div>
</div>

<!-- Job Orders Widget -->
<div class="widget">
  <div class="widget-header">📋 Job Orders Overview</div>
  <div class="widget-content">
    <div class="priority-stats">
      <div class="priority-row">
        <span class="priority-label" style="color:#cc6600;">Pending</span>
        <span class="priority-count">{{ pendingJobOrdersCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#cc6600;"
               [style.width.%]="allJOsTotal > 0 ? (pendingJobOrdersCount / allJOsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div class="priority-row">
        <span class="priority-label" style="color:#008800;">Received</span>
        <span class="priority-count">{{ receivedJOsCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#008800;"
               [style.width.%]="allJOsTotal > 0 ? (receivedJOsCount / allJOsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div class="priority-row">
        <span class="priority-label" style="color:#cc0000;">Rejected</span>
        <span class="priority-count">{{ rejectedJOsCount }}</span>
        <div class="priority-track">
          <div class="priority-fill" style="background:#cc0000;"
               [style.width.%]="allJOsTotal > 0 ? (rejectedJOsCount / allJOsTotal * 100) : 0">
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-top:8px;">
        <a routerLink="/admin/job-orders" style="color:#0a246a;font-size:10px;text-decoration:none;">→ View All Job Orders</a>
      </div>
    </div>
  </div>
</div>
</div>

          <!-- Router Content -->
          <div class="main-content">
            <router-outlet></router-outlet>
          </div>

        </div>
      </div>

      <!-- Bottom Status Bar -->
<div class="bottom-status-bar">
  <div class="status-left">
    <span>Ready</span>
    <span class="status-sep">|</span>
    <span>{{ currentUser?.role | uppercase }}</span>
    <span class="status-sep">|</span>
    <span>Cache: {{ cacheStatus }}</span>
    <span class="status-sep">|</span>
    <span>Registration Key: {{ registrationKeys }}</span>
  </div>
  <span>St4nger Dev 2026</span>
  <div class="status-right">
    <span>EDPtech Helpdesk v2.1</span>
    <span class="status-sep">|</span>
    <span>{{ currentDate }}</span>
    <span class="status-sep">|</span>
    <span>{{ currentTime }}</span>
  </div>
</div>
 <!-- Report Modal -->
<app-report-modal
  [title]="reportModalTitle"
  [reportData]="reportModalData"
  [loading]="reportLoading"
  [error]="reportError"
  (closed)="closeReportModal()"
  (printed)="onReportPrinted()"
  (retryRequest)="retryLastReport()"
  *ngIf="showReportModal">
</app-report-modal>
<!-- Search Modal -->
<div class="modal-overlay" *ngIf="showSearchModal" (click)="closeSearchModal()">
  <div class="search-modal-content" id="searchModal" (click)="$event.stopPropagation()">
    <div class="search-modal-header modal-header-handle" (mousedown)="startDrag($event, 'searchModal')">
      <h3>🔍 Search Tickets</h3>
      <button class="modal-close-btn" (click)="closeSearchModal()">✕</button>
    </div>
    
    <div class="search-modal-body">
      <div class="search-modal-input-wrap">
        <span class="search-modal-icon">🔍</span>
        <input 
          type="text" 
          class="search-modal-input"
          [(ngModel)]="searchModalTerm"
          placeholder="Enter ticket code, title, or keyword..."
          (keyup.enter)="performSearch()"
        >
      </div>
      
      <div class="search-hints">
        <p class="hint-title">💡 Search Tips:</p>
        <ul>
          <li>Search by <strong>ticket code</strong> (e.g., IT-20240101-ABC123)</li>
          <li>Search by <strong>title keywords</strong></li>
          <li>Search by <strong>location</strong> or <strong>department</strong></li>
        </ul>
      </div>
      
      <div class="search-actions">
        <button class="btn" (click)="closeSearchModal()">✕ Cancel</button>
        <button class="btn btn-primary" (click)="performSearch()" [disabled]="!searchModalTerm.trim()">
          🔍 Search
        </button>
      </div>
    </div>
  </div>
</div>
<!-- Backup Database Confirmation Modal -->
<div class="modal-overlay" *ngIf="showBackupModal" (click)="cancelBackup()">
  <div class="backup-modal-content" id="backupModal" (click)="$event.stopPropagation()">
    <div class="backup-modal-header modal-header-handle" (mousedown)="startDrag($event, 'backupModal')">
      <h3>
        <span class="backup-icon">💾</span> 
        Database Backup
      </h3>
      <button class="modal-close-btn" (click)="cancelBackup()" [disabled]="backupInProgress">✕</button>
    </div>
    
    <div class="backup-modal-body">
      <!-- Warning Message -->
      <div class="backup-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <strong>Important Notice</strong>
          <p>You are about to export the entire EDPTech Helpdesk database. This operation will download a complete SQL backup file.</p>
        </div>
      </div>

      <!-- What's Included -->
      <div class="backup-details">
        <h4>📦 What will be exported:</h4>
        <ul>
          <li><span class="check-icon">✓</span> All table structures (schemas)</li>
          <li><span class="check-icon">✓</span> All stored data (records)</li>
          <li><span class="check-icon">✓</span> Indexes, keys, and constraints</li>
          <li><span class="check-icon">✓</span> Complete relational integrity</li>
        </ul>
        
        <h4>📁 Output Format:</h4>
        <ul>
          <li><span class="check-icon">✓</span> Standard SQL dump file (.sql)</li>
          <li><span class="check-icon">✓</span> Compatible with MySQL/MariaDB</li>
          <li><span class="check-icon">✓</span> Importable via phpMyAdmin or CLI</li>
        </ul>
      </div>

      <!-- Security Notice -->
      <div class="backup-security">
        <div class="security-icon">🔒</div>
        <div class="security-text">
          <strong>Security Notice:</strong>
          <p>This backup file contains sensitive data including user information, tickets, and system configurations. Store it in a secure location and delete it after restoration if not needed.</p>
        </div>
      </div>

      <!-- Progress or Error -->
      <div class="backup-progress" *ngIf="backupInProgress">
        <div class="spinner"></div>
        <p>Exporting database... Please wait.</p>
        <p class="progress-note">Do not close this window or navigate away.</p>
      </div>

      <div class="backup-error" *ngIf="backupError">
        <span>❌ {{ backupError }}</span>
      </div>
    </div>

    <div class="backup-modal-footer">
      <button class="btn btn-cancel" (click)="cancelBackup()" [disabled]="backupInProgress">
        ✕ Cancel
      </button>
      <button class="btn btn-primary" (click)="startDatabaseBackup()" [disabled]="backupInProgress">
        {{ backupInProgress ? '⏳ Exporting...' : '💾 Start Backup' }}
      </button>
    </div>
  </div>
</div>

<!-- Clear Cache Modal -->
<div class="modal-overlay" *ngIf="showClearCacheModal" (click)="closeClearCacheModal()">
  <div class="cache-modal-content" id="cacheModal" (click)="$event.stopPropagation()">
    <div class="cache-modal-header modal-header-handle" (mousedown)="startDrag($event, 'cacheModal')">
      <h3>🗑️ Clear Application Cache</h3>
      <button class="modal-close-btn" (click)="closeClearCacheModal()" [disabled]="cacheClearing">✕</button>
    </div>

    <div class="cache-modal-body">
      <div class="cache-info">
        <div class="cache-size">
          <span class="cache-icon">💾</span>
          <div>
            <strong>Current Cache Size</strong>
            <p>{{ getCacheSize() }}</p>
          </div>
        </div>
        <p class="cache-note">Select which cached data you want to clear:</p>
      </div>

      <div class="cache-options">
        <label class="cache-option" [class.selected]="cacheItems.viewMode">
          <input type="checkbox" [(ngModel)]="cacheItems.viewMode" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>📋 View Settings</strong>
            <p>List, grid, kanban view preferences</p>
          </div>
        </label>

        <label class="cache-option" [class.selected]="cacheItems.sidebarState">
          <input type="checkbox" [(ngModel)]="cacheItems.sidebarState" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>📂 Sidebar State</strong>
            <p>Sidebar open/closed preference</p>
          </div>
        </label>

        <label class="cache-option" [class.selected]="cacheItems.searchHistory">
          <input type="checkbox" [(ngModel)]="cacheItems.searchHistory" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>🔍 Search History</strong>
            <p>Recent searches and filters</p>
          </div>
        </label>

        <label class="cache-option" [class.selected]="cacheItems.formData">
          <input type="checkbox" [(ngModel)]="cacheItems.formData" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>📝 Saved Form Data</strong>
            <p>Draft tickets and form inputs</p>
          </div>
        </label>

        <label class="cache-option" [class.selected]="cacheItems.notifications">
          <input type="checkbox" [(ngModel)]="cacheItems.notifications" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>🔔 Notification Cache</strong>
            <p>Dismissed notifications history</p>
          </div>
        </label>

        <label class="cache-option" [class.selected]="cacheItems.userPreferences">
          <input type="checkbox" [(ngModel)]="cacheItems.userPreferences" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>⚙️ User Preferences</strong>
            <p>Theme, language, display settings</p>
          </div>
        </label>

        <div class="cache-divider"></div>

        <label class="cache-option danger" [class.selected]="cacheItems.allData">
          <input type="checkbox" [(ngModel)]="cacheItems.allData" [disabled]="cacheClearing">
          <div class="option-info">
            <strong>⚠️ Clear ALL Data</strong>
            <p>Everything including tokens (will require re-login)</p>
          </div>
        </label>
      </div>

      <div class="cache-select-all" (click)="selectAllCache()">
        {{ allCacheSelected() ? 'Deselect All' : 'Select All' }}
      </div>

      <!-- Progress -->
      <div class="cache-progress" *ngIf="cacheClearing">
        <div class="spinner"></div>
        <p>Clearing cache...</p>
      </div>
    </div>

    <div class="cache-modal-footer">
      <button class="btn btn-cancel" (click)="closeClearCacheModal()" [disabled]="cacheClearing">
        ✕ Cancel
      </button>
      <button class="btn btn-danger" (click)="performCacheClear()" 
              [disabled]="cacheClearing || !anyCacheSelected()">
        {{ cacheClearing ? '⏳ Clearing...' : '🗑️ Clear Selected' }}
      </button>
    </div>
  </div>
</div>
<!-- Session Expiry Warning Modal -->
<div class="modal-overlay" *ngIf="showLogoutWarning">
  <div class="logout-warning-modal" id="logoutWarningModal" (click)="$event.stopPropagation()">
    <div class="logout-warning-header modal-header-handle" (mousedown)="startDrag($event, 'logoutWarningModal')">
      <span class="warning-icon">⏰</span>
      <h3>Session Expiring</h3>
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
<!-- Logout Confirmation Modal -->
<div class="modal-overlay" *ngIf="showLogoutConfirmModal" (click)="cancelLogoutConfirm()">
  <div class="logout-confirm-modal" id="logoutConfirmModal" (click)="$event.stopPropagation()">
    <div class="logout-confirm-header modal-header-handle" (mousedown)="startDrag($event, 'logoutConfirmModal')">
      <span class="logout-confirm-icon">🚪</span>
      <h3>Confirm Logout</h3>
      <button type="button" (click)="cancelLogoutConfirm()" class="modal-close-btn">✕</button>
    </div>
    <div class="logout-confirm-body">
      <p>Are you sure you want to log out of the EDPTech Helpdesk system?</p>
      <p class="logout-confirm-sub">Any unsaved changes will be lost.</p>
    </div>
    <div class="logout-confirm-footer">
      <button class="btn btn-cancel" (click)="cancelLogoutConfirm()">
        ✋ Cancel
      </button>
      <button class="btn btn-danger" (click)="confirmLogout()">
        🚪 Logout
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .app-container{height:100vh;display:flex;flex-direction:column;background:#ece9d8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:12px;overflow:hidden}
    .menu-bar{background:#f0f0f0;border-bottom:1px solid #a0a0a0;display:flex;padding:2px 0;height:24px;position:relative;z-index:200;color:#000}
    .menu-item{position:relative;padding:2px 12px;cursor:pointer;font-size:12px;user-select:none}
    .menu-item:hover,.menu-item.open{background:#cde8f5}
    .dropdown{position:absolute;top:22px;left:0;background:#f0f0f0;border:1px solid #a0a0a0;min-width:210px;z-index:500;box-shadow:2px 2px 5px rgba(0,0,0,0.25)}
    .dropdown-item{padding:6px 28px 6px 12px;cursor:pointer;white-space:nowrap;font-size:12px}
    .dropdown-item:hover{background:#cde8f5}
    .dropdown-divider{height:1px;background:#c0c0c0;margin:3px 0}
    .toolbar{background:#f8f8f8;border-bottom:1px solid #a0a0a0;padding:4px 8px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;z-index:100}
    .toolbar-btn{background:#f0f0f0;border:1px solid #a0a0a0;padding:4px 10px;cursor:pointer;font-size:11px;display:inline-flex;align-items:center;gap:6px;color:#000}
    .toolbar-btn:hover{background:#dde8f0;border-color:#7a9fbf}
    .toolbar-btn:active{background:#cde0f0}
    .toolbar-separator{width:1px;height:20px;background:#b0b0b0;margin:0 4px}
    .sidebar-section-title{color:#000;font-size:12px;text-transform:uppercase;font-weight:bold;padding:6px 12px 2px}
    .search-box{position:relative;display:inline-block}
    .search-box input{padding:4px 8px 4px 26px;border:1px solid #a0a0a0;font-size:11px;width:200px}
    .search-box input:focus{outline:none;border-color:#0a246a}
    .search-icon{position:absolute;left:7px;top:50%;transform:translateY(-50%);font-size:11px;color:#666}
    .spacer{flex:1}
    .status-bar-info{display:flex;align-items:center;gap:10px;font-size:11px;color:#333}
    .logout-btn{background:#f0f0f0;border:1px solid #a0a0a0;border-radius:3px;padding:3px 10px;cursor:pointer;font-size:11px}
    .logout-btn:hover{background:#e0e0e0}
    .main-layout{display:flex;flex:1;overflow:hidden}
    .sidebar{width:220px;min-width:220px;background:#f8f8f8;border-right:1px solid #a0a0a0;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;transition:width 0.2s ease,min-width 0.2s ease,opacity 0.15s ease}
    .sidebar.sidebar-hidden{width:0!important;min-width:0!important;opacity:0;pointer-events:none;border-right:none}
    .sidebar-header{padding:12px;background:#0a246a;text-align:center;flex-shrink:0}
    .sidebar-header h3{margin:0;color:#fff;font-size:13px;font-weight:bold;white-space:nowrap}
    .sidebar-menu{padding:6px 0;flex:1}
    .sidebar-link{display:flex;align-items:center;gap:10px;padding:9px 12px;text-decoration:none;color:#222;font-size:12px;white-space:nowrap;overflow:hidden}
    .sidebar-link.clickable{cursor:pointer}
    .sidebar-link:hover{background:#dde8f5}
    .sidebar-link.active{background:#cde0f5;font-weight:bold;border-left:3px solid #0a246a}
    .nav-icon{font-size:13px;flex-shrink:0}
    .badge{margin-left:auto;background:#0a246a;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;flex-shrink:0}
    .sidebar-divider{height:1px;background:#d0d0d0;margin:6px 0}
    .sidebar-footer{padding:10px 12px;border-top:1px solid #c0c0c0;font-size:10px;color:#555;flex-shrink:0}
    .connection-status{display:flex;align-items:center;gap:6px}
    .status-light{width:8px;height:8px;border-radius:50%;background:#cc0000;flex-shrink:0}
    .status-light.connected{background:#008800}
    .content-area{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .info-bar{background:#f8f8f8;border-bottom:1px solid #a0a0a0;padding:6px 16px;display:flex;gap:20px;flex-wrap:wrap}
    .info-item{font-size:11px}
    .info-label{color:#666}
    .info-value{font-weight:bold;margin-left:4px}
    .info-value.open{color:#0066cc}
    .info-value.critical{color:#cc0000}
    .info-value.resolved{color:#008800}
    .info-value.percent{color:#224400}
    .status-online{color:#008800;font-weight:bold}
    .dashboard-widgets{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin:14px 16px 0 16px}
    .widget{background:#fff;border:1px solid #c0c0c0;box-shadow:1px 1px 3px rgba(0,0,0,0.08)}
    .widget-header{padding:8px 12px;background:#e8e8e8;border-bottom:1px solid #c0c0c0;color:#333;font-weight:bold;font-size:11px}
    .widget-content{padding:10px}
    .priority-stats{display:flex;flex-direction:column;gap:10px}
    .priority-row{display:flex;align-items:center;gap:8px}
    .priority-label{width:55px;font-weight:bold;font-size:10px;text-transform:capitalize}
    .priority-label.critical{color:#cc0000}
    .priority-label.high{color:#cc5500}
    .priority-label.medium{color:#886600}
    .priority-label.low{color:#006600}
    .priority-count{width:28px;text-align:right;font-weight:bold;font-size:11px;color:#333}
    .priority-track{flex:1;height:8px;background:#e8e8e8;border-radius:4px;overflow:hidden}
    .priority-fill{height:100%;border-radius:4px;transition:width 0.4s ease}
    .priority-fill.critical{background:#cc0000}
    .priority-fill.high{background:#ff6600}
    .priority-fill.medium{background:#ffaa00}
    .priority-fill.low{background:#008800}
    .issue-list{display:flex;flex-direction:column}
    .issue-item{display:flex;justify-content:space-between;padding:7px 4px;border-bottom:1px solid #eee;font-size:11px}
    .issue-item:last-child{border-bottom:none}
    .issue-item.empty{color:#999}
    .issue-name{color:#333}
    .issue-count{font-weight:bold;color:#0a246a}
    .activity-list{display:flex;flex-direction:column;gap:6px;max-height:250px;overflow-y:auto}
    .activity-item{display:flex;align-items:flex-start;gap:8px;padding:6px 4px;border-bottom:1px solid #f0f0f0}
    .activity-item.empty{color:#999;font-size:11px}
    .activity-icon{font-size:13px;flex-shrink:0;margin-top:1px}
    .activity-info{flex:1;min-width:0}
    .activity-title{font-size:11px;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .activity-meta{font-size:10px;color:#777;margin-top:2px}
    .priority-badge{font-size:9px;padding:2px 5px;border-radius:3px;text-transform:capitalize;flex-shrink:0;margin-top:2px}
    .priority-badge.critical{background:#ffecec;color:#cc0000}
    .priority-badge.high{background:#fff0e8;color:#cc5500}
    .priority-badge.medium{background:#fffae8;color:#886600}
    .priority-badge.low{background:#eeffee;color:#006600}
    .quick-actions{display:flex;gap:10px;padding:12px 16px;background:#f5f5f5;border:1px solid #d0d0d0;margin:14px 16px;flex-wrap:wrap}
    .quick-action-btn{background:#f0f0f0;border:1px solid #a0a0a0;border-radius:3px;padding:7px 14px;cursor:pointer;font-size:11px;display:inline-flex;align-items:center;gap:7px}
    .quick-action-btn:hover{background:#e0e0e0}
    .quick-action-btn.primary{background:#0a246a;color:#fff;border-color:#0a246a}
    .quick-action-btn.primary:hover{background:#1a3a8a}
    .main-content{flex:1;overflow-y:auto}
    .widget-footer{margin-top:8px;padding-top:8px;border-top:1px solid #e0e0e0;text-align:center}
    .see-more-btn{background:none;border:1px solid #c0c0c0;padding:3px 12px;cursor:pointer;font-size:10px;color:#0a3a8c;border-radius:2px}
    .ai-toolbar-icon{width:18px;height:18px;object-fit:contain;vertical-align:middle}
    .see-more-btn:hover{background:#e8f0ff;border-color:#0a3a8c}
    .popup-toast{position:fixed;bottom:20px;right:20px;z-index:9999;cursor:pointer;animation:slideIn 0.3s ease}
    .popup-content{background:#0a246a;color:#fff;padding:10px 18px;font-size:11px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:2px solid;border-color:#fff #808080 #808080 #fff}
    .popup-icon{font-size:16px}
    .popup-close{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;font-size:12px;cursor:pointer;padding:2px 6px;margin-left:8px}
    .popup-close:hover{background:rgba(255,0,0,0.5)}
    .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000;animation:fadeIn 0.2s ease}
    .report-modal-content,.search-modal-content,.backup-modal-content,.cache-modal-content{background:#fff;width:95%;box-shadow:0 20px 60px rgba(0,0,0,0.4);display:flex;flex-direction:column;border-radius:0}
    .modal-header-handle,.report-modal-header,.search-modal-header,.backup-modal-header,.cache-modal-header,.logout-warning-header{cursor:grab;user-select:none}
    .modal-header-handle:active,.report-modal-header:active,.search-modal-header:active,.backup-modal-header:active,.cache-modal-header:active,.logout-warning-header:active{cursor:grabbing}
    .report-modal-content,.search-modal-content,.backup-modal-content,.cache-modal-content,.logout-warning-modal{border-radius:0}
    .report-modal-header,.search-modal-header,.backup-modal-header,.cache-modal-header,.logout-warning-header{border-radius:0}
    .report-modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#0a246a;color:#fff;flex-shrink:0}
    .report-modal-header h3{margin:0;font-size:16px}
    .modal-actions{display:flex;gap:8px;align-items:center}
    .modal-close-btn{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:18px;cursor:pointer;width:30px;height:30px;border-radius:4px;display:flex;align-items:center;justify-content:center}
    .modal-close-btn:hover{background:rgba(255,0,0,0.5)}
    .btn-sm{padding:4px 10px;font-size:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;cursor:pointer}
    .btn-sm:hover{background:rgba(255,255,255,0.25)}
    .report-modal-body{padding:20px;overflow-y:auto;flex:1}
    .loading-state{text-align:center;padding:40px;color:#888}
    .spinner{width:40px;height:40px;border:3px solid #e0e0e0;border-top-color:#0a246a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .report-summary{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
    .report-stat{text-align:center;padding:12px 8px;background:#f8f9fa;border-left:3px solid #0a246a}
    .report-stat.open{border-left-color:#0066cc}
    .report-stat.resolved{border-left-color:#008800}
    .report-stat.critical{border-left-color:#cc0000}
    .stat-value{font-size:20px;font-weight:700;color:#333}
    .stat-label{font-size:9px;color:#888;text-transform:uppercase;margin-top:4px}
    .report-section{margin-bottom:20px}
    .report-section h4{font-size:13px;color:#0a246a;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e0e0}
    .priority-bars{display:flex;flex-direction:column;gap:8px}
    .p-bar{display:flex;align-items:center;gap:10px}
    .p-label{width:70px;font-size:11px;font-weight:500;color:#050505}
    .p-track{flex:1;height:10px;background:#f0f0f0;border-radius:5px;overflow:hidden}
    .p-fill{height:100%;border-radius:5px;transition:width 0.5s ease}
    .p-count{width:80px;text-align:right;font-size:10px;color:#888}
    .mini-table{width:100%;border-collapse:collapse;font-size:11px}
    .mini-table th{background:#f0f4f8;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#000;border:1px solid #ddd}
    .mini-table td{padding:6px 10px;border:1px solid #eee;color:#181717}
    .mini-table code{font-family:monospace;font-size:10px;background:#f5f5f5;padding:2px 5px;border-radius:3px}
    .search-modal-content{background:#fff;width:90%;max-width:550px;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:slideIn 0.3s ease}
    .search-modal-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#0a246a;color:#fff}
    .search-modal-header h3{margin:0;font-size:15px}
    .search-modal-body{padding:20px}
    .search-modal-input-wrap{position:relative;margin-bottom:16px}
    .search-modal-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px}
    .search-modal-input{width:100%;padding:12px 12px 12px 40px;border:2px solid #c0c0c0;font-size:14px;font-family:inherit;box-sizing:border-box}
    .search-modal-input:focus{outline:none;border-color:#0a246a;box-shadow:0 0 0 3px rgba(10,36,106,0.1)}
    .user-avatar-small{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:10px;flex-shrink:0;overflow:hidden;border:1px solid rgba(255,255,255,0.3)}
    .backup-modal-content{background:#fff;width:95%;max-width:550px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:modalSlideIn 0.3s ease}
    .backup-modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#0a246a;color:#fff;flex-shrink:0}
    .backup-modal-header h3{margin:0;font-size:16px;display:flex;align-items:center;gap:10px}
    .backup-icon{font-size:24px}
    .backup-modal-body{padding:20px;overflow-y:auto;flex:1}
    .backup-warning{display:flex;gap:12px;background:#fff8e0;border:1px solid #ffaa00;padding:14px;margin-bottom:16px}
    .warning-icon{font-size:24px;flex-shrink:0}
    .warning-text strong{display:block;color:#cc6600;margin-bottom:4px;font-size:13px}
    .warning-text p{margin:0;color:#886600;font-size:11px;line-height:1.5}
    .backup-details{margin-bottom:16px}
    .backup-details h4{color:#0a246a;font-size:13px;margin:12px 0 8px 0}
    .backup-details ul{list-style:none;padding:0;margin:0}
    .backup-details li{padding:4px 0;font-size:11px;color:#333;display:flex;align-items:center;gap:8px}
    .check-icon{color:#008800;font-weight:bold;flex-shrink:0}
    .backup-security{display:flex;gap:12px;background:#f0f4ff;border:1px solid #b8c8e8;padding:14px;margin-bottom:16px}
    .security-icon{font-size:24px;flex-shrink:0}
    .security-text strong{display:block;color:#0a246a;margin-bottom:4px;font-size:13px}
    .security-text p{margin:0;color:#446;font-size:11px;line-height:1.5}
    .backup-progress{text-align:center;padding:20px;background:#f8f9fa;margin-bottom:16px}
    .backup-progress .spinner{width:36px;height:36px;border:3px solid #e0e0e0;border-top-color:#0a246a;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px}
    .backup-progress p{margin:0;color:#333;font-size:12px}
    .progress-note{color:#cc6600!important;font-size:10px!important;margin-top:8px!important}
    .backup-error{background:#ffecec;border:1px solid #ff4444;padding:10px 14px;margin-bottom:16px}
    .backup-error span{color:#cc0000;font-size:11px}
    .backup-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;background:#f5f5f5;border-top:1px solid #e0e0e0;flex-shrink:0}
    .btn-cancel,.btn-primary,.btn-danger{padding:8px 20px;font-size:12px;cursor:pointer;border-radius:0}
    .btn-cancel{background:#f0f0f0;border:1px solid #c0c0c0;color:#333}
    .btn-cancel:hover:not(:disabled){background:#e0e0e0}
    .btn-cancel:disabled,.btn-primary:disabled,.btn-danger:disabled{opacity:0.5;cursor:not-allowed}
    .btn-primary{background:#0a246a;border:1px solid #0a246a;color:#fff;font-weight:600}
    .btn-primary:hover:not(:disabled){background:#0a3a8c}
    .btn-danger{background:#cc4400;border:1px solid #cc4400;color:#fff;font-weight:600}
    .btn-danger:hover:not(:disabled){background:#aa3300}
    @keyframes modalSlideIn{from{transform:scale(0.95) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
    .ai-assistant-overlay{position:fixed;bottom:80px;right:20px;z-index:3000;animation:slideUp 0.3s ease}
    .ai-assistant-panel{width:400px;height:550px;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;border:1px solid #d0d0d0}
    .ai-assistant-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(135deg,#0a246a,#1a3a8a);color:#fff}
    .ai-assistant-title{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px}
    .ai-icon{font-size:20px}
    .ai-assistant-actions{display:flex;gap:4px}
    .ai-btn-icon{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
    .ai-btn-icon:hover{background:rgba(255,255,255,0.25)}
    .ai-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;color:#333;gap:12px;background:#f8f9fa}
    .ai-message{display:flex;gap:8px;max-width:85%}
    .user-message{align-self:flex-end;flex-direction:row-reverse}
    .ai-message-style{align-self:flex-start}
    .ai-message-avatar{width:32px;height:32px;border-radius:50%;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
    .user-message .ai-message-avatar{background:#0a246a;color:#fff}
    .ai-message-content{padding:10px 14px;border-radius:12px;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
    .user-message .ai-message-content{background:#0a246a;color:#fff;border-bottom-right-radius:4px}
    .ai-message-style .ai-message-content{background:#fff;border:1px solid #e0e0e0;border-bottom-left-radius:4px}
    .ai-typing{display:flex;gap:4px;padding:4px 0}
    .ai-typing span{width:8px;height:8px;border-radius:50%;background:#999;animation:typing 1.4s infinite}
    .ai-typing span:nth-child(2){animation-delay:0.2s}
    .ai-typing span:nth-child(3){animation-delay:0.4s}
    .ai-chat-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #e0e0e0;background:#fff}
    .ai-chat-input input{flex:1;padding:10px 14px;border:1px solid #d0d0d0;border-radius:20px;font-size:13px;outline:none;font-family:inherit}
    .ai-chat-input input:focus{border-color:#0a246a;box-shadow:0 0 0 3px rgba(10,36,106,0.1)}
    .ai-chat-input input:disabled{background:#f5f5f5;cursor:not-allowed}
    .ai-chat-input button{width:40px;height:40px;border-radius:50%;background:#0a246a;color:#fff;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
    .ai-chat-input button:hover:not(:disabled){background:#1a3a8a;transform:scale(1.05)}
    .ai-chat-input button:disabled{background:#ccc;cursor:not-allowed}
    .logout-warning-modal{background:#fff;width:90%;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:modalSlideIn 0.3s ease;overflow:hidden}
    .logout-warning-header{background:linear-gradient(135deg,#cc6600,#ff8800);color:#fff;padding:20px}
    .logout-warning-header .warning-icon{font-size:40px;display:block;margin-bottom:8px}
    .logout-warning-header h3{margin:0;font-size:18px}
    .logout-warning-body{padding:24px}
    .logout-warning-body p{font-size:13px;color:#555;margin:0 0 16px 0}
    .countdown-circle{width:80px;height:80px;border-radius:50%;background:#fff3e0;border:3px solid #cc6600;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 16px}
    .countdown-number{font-size:28px;font-weight:bold;color:#cc6600;line-height:1}
    .countdown-label{font-size:10px;color:#cc6600;text-transform:uppercase}
    .warning-sub{font-size:11px!important;color:#888!important}
    .logout-warning-footer{padding:16px 24px;background:#f8f9fa;border-top:1px solid #e0e0e0}
    .logout-warning-footer .btn{width:100%;padding:10px;font-size:14px}
    @keyframes typing{0%,60%,100%{opacity:0.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:500px){.ai-assistant-panel{width:95vw;height:70vh}.ai-assistant-overlay{right:10px;bottom:60px}}
    .user-photo-small{width:100%;height:100%;object-fit:cover;border-radius:50%}
    .search-hints{background:#f8f9fa;padding:12px 16px;margin-bottom:16px}
    .hint-title{font-weight:600;font-size:11px;color:#555;margin-bottom:6px}
    .search-hints ul{margin:0;padding-left:18px;font-size:11px;color:#666}
    .search-hints li{margin-bottom:3px}
    .cache-modal-content{background:#fff;width:95%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:modalSlideIn 0.3s ease}
    .cache-modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#0a246a;color:#fff;flex-shrink:0}
    .cache-modal-header h3{margin:0;font-size:16px}
    .cache-modal-body{padding:20px;overflow-y:auto;flex:1}
    .cache-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;background:#f5f5f5;border-top:1px solid #e0e0e0;flex-shrink:0}
    .cache-info{margin-bottom:16px}
    .cache-size{display:flex;gap:12px;align-items:center;padding:12px;background:#f0f4ff;margin-bottom:8px}
    .cache-icon{font-size:24px}
    .cache-size strong{display:block;font-size:12px;color:#333}
    .cache-size p{font-size:16px;font-weight:bold;color:#0a246a;margin:2px 0 0 0}
    .cache-note{font-size:11px;color:#888;margin:0}
    .cache-options{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
    .cache-option{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid #e0e0e0;cursor:pointer}
    .cache-option.selected{background:#f0f4ff;border-color:#0a246a}
    .cache-option.danger.selected{background:#fff0f0;border-color:#cc0000}
    .cache-option input[type="checkbox"]{margin-top:3px;cursor:pointer}
    .option-info strong{display:block;font-size:12px;color:#333;margin-bottom:2px}
    .option-info p{font-size:10px;color:#888;margin:0}
    .cache-divider{height:1px;background:#e0e0e0;margin:4px 0}
    .cache-select-all{text-align:center;font-size:11px;color:#0a246a;cursor:pointer;padding:6px}
    .cache-select-all:hover{text-decoration:underline}
    .cache-progress{text-align:center;padding:16px}
    .cache-progress .spinner{margin:0 auto 8px}
    .search-actions{display:flex;justify-content:flex-end;gap:8px}
    @media(max-width:768px){.report-summary{grid-template-columns:repeat(3,1fr)}.sidebar{width:180px;min-width:180px}.search-box input{width:130px}.dashboard-widgets{grid-template-columns:1fr;margin:8px}.quick-actions{margin:8px}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
    .bottom-status-bar{background:#f0f0f0;border-top:1px solid #a0a0a0;padding:3px 10px;display:flex;justify-content:space-between;font-size:11px;color:#333}
    .status-left,.status-right{display:flex;gap:12px}
    .status-sep{color:#b0b0b0}
    ::-webkit-scrollbar{width:14px;height:14px}
    ::-webkit-scrollbar-track{background:#f0f0f0}
    ::-webkit-scrollbar-thumb{background:#c0c0c0;border:1px solid #a0a0a0}
    ::-webkit-scrollbar-thumb:hover{background:#a0a0a0}
    .sidebar-link {
  position: relative;
}
.logout-confirm-modal {
  background: #fff;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  animation: modalSlideIn 0.3s ease;
  border: 1px solid #a0a0a0;
}

.logout-confirm-header {
  background: #cc0000;
  color: #fff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logout-confirm-header h3 {
  margin: 0;
  font-size: 15px;
  flex: 1;
}

.logout-confirm-icon {
  font-size: 22px;
}

.logout-confirm-body {
  padding: 20px;
  text-align: center;
}

.logout-confirm-body p {
  font-size: 13px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.logout-confirm-sub {
  font-size: 11px !important;
  color: #888 !important;
  font-style: italic;
}

.logout-confirm-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.logout-confirm-footer .btn {
  padding: 8px 20px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 0;
  min-width: 100px;
}

.btn-danger {
  background: #cc0000;
  border: 1px solid #cc0000;
  color: #fff;
  font-weight: 600;
}

.btn-danger:hover:not(:disabled) {
  background: #aa0000;
}
.sidebar-notif-badge {
  position: absolute;
  top: 2px;
  right: 8px;
  background: #cc0000;
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
  animation: pulse-badge 2s infinite;
  z-index: 10;
}
.nav-icon-svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.sidebar-link.active .sidebar-notif-badge {
  background: #ffcc00;
  color: #333;
}
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  sidebarHidden = false;
  activeMenu: string | null = null;
  isOnline = true;
  globalSearch = '';
  currentDate = '';
  currentTime = '';
  cacheStatus = 'Active';
  showAllIssues = false;
  showAllActivity = false;
  currentViewMode = 'list';
  dbConnected = true;
  apiOnline = true;
  totalTickets = 0;
  openTickets = 0;
  criticalTickets = 0;
  resolvedToday = 0;
  slaCompliance = 98;
  newTicketsCount = 0;
  apiUrl = environment.apiUrl;
  showReportModal = false;
  computerMonitoringNotifCount = 0;
  reportModalTitle = '';
  reportModalData: any = null;
  reportLoading = false;
  registrationKeys: string = 'No keys';
  activeKeyCount: number = 0;
  registrationKeyCount: number = 0;
  showSearchModal = false;
  searchModalTerm = '';
  pendingJobOrdersCount = 0;
  pendingRequisitionsCount = 0;
  receivedRequisitionsCount = 0;
  showAIAssistant = false;
  showLogoutWarning = false;
  logoutCountdown = 60;
  private departmentMap: Map<number, string> = new Map()
  private logoutWarningTimer: any;
  private logoutCountdownInterval: any;
  private _requisitionsNotificationCount: number = 0;
  aiQuery = '';
  aiResponse = '';
  aiLoading = false;
  reportError: string | null = null;
  private lastReportType: string = '';
  aiHistory: { role: string; content: string }[] = [];
  rejectedRequisitionsCount = 0;
  allReqsTotal = 0;
  systemSettings: any = {};
  receivedJOsCount = 0;
  rejectedJOsCount = 0;
  allJOsTotal = 0;
  showBackupModal = false;
  backupInProgress = false;
  backupError: string | null = null;
  recentTickets: Ticket[] = [];
  topIssues: { location: string; count: number }[] = [];
  readonly priorityLevels = [
    { key: 'critical', label: 'Critical' },
    { key: 'high',     label: 'High'     },
    { key: 'medium',   label: 'Medium'   },
    { key: 'low',      label: 'Low'      },
  ];
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  private readonly WARNING_BEFORE = 60; // ADD THIS - was missing!
  private clockInterval: any;
  popupMessage: string | null = null;
  private popupInterval: any;
  private newTicketPopupCount: number = 0;
  shownStatusPopups = new Set<string>();
  private statusPopupTimeout: any;
  private sessionCheckInterval: any;
  private tokenCheckInterval: any;
  isAuthenticated = false;
  isTokenValid = false;
  showClearCacheModal = false;
  cacheClearing = false;
  cacheItems = {
    viewMode: true, sidebarState: true, searchHistory: true,
    formData: true, notifications: false, userPreferences: false, allData: false
  };
   readOrderIds: Set<number> = new Set<number>();
  notificationMap: Map<number, { type: 'incoming' | 'status_update', status: string }> = new Map();
  allOrders: any[] = [];
   ourOrdersUnreadCount: number = 0;
  incomingOrdersUnreadCount: number = 0;
  totalUnreadCount: number = 0;
  unreadMessagesCount = 0;
  showLogoutConfirmModal = false;
  // Dragging properties
private isDragging = false;
private dragOffsetX = 0;
private dragOffsetY = 0;
private currentDragModal: HTMLElement | null = null;
  private destroy$ = new Subject<void>();
private get seenReqNotificationIds(): Set<number> {
  const stored = localStorage.getItem('seenReqNotificationIds');
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch { return new Set(); }
  }
  return new Set();
}
  // ADD THE CONSTRUCTOR - was missing!
  constructor(
    private authService: AuthService,
    public router: Router,
    private ticketService: TicketService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {}

  @ViewChild(AiAssistantComponent) aiAssistant!: AiAssistantComponent;

  ngOnInit() {
   this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.setupSubscriptions();
     this.loadNotificationCount();
    this.verifyAuthentication();
    this.loadReadOrdersFromStorage();
    this.loadNotificationMapFromStorage();
    this.loadJobOrdersCount();
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.router.events.pipe(
  filter(event => event instanceof NavigationEnd)
).subscribe((event: any) => {
  if (event.url.includes('/admin/requisitions')) {
    this.markRequisitionNotificationsAsRead();
  }
  setInterval(() => this.loadNotificationCount(), 30000);
});
  }
checkSystemStatus() {
  // Check API connection
  this.ticketService.getTickets().subscribe({
    next: () => {
      this.apiOnline = true;
      this.isOnline = true;
    },
    error: () => {
      this.apiOnline = false;
      this.isOnline = false;
    }
  });

  this.dbConnected = this.apiOnline;
}
showStatusPopup(message: string) {
  this.popupMessage = message;
  // Auto-dismiss after 5 seconds
  if (this.statusPopupTimeout) clearTimeout(this.statusPopupTimeout);
  this.statusPopupTimeout = setTimeout(() => {
    this.popupMessage = null;
  }, 5000);
}
private set seenReqNotificationIds(ids: Set<number>) {
  localStorage.setItem('seenReqNotificationIds', JSON.stringify([...ids]));
}

// Add a method to add IDs to the set
private addSeenReqIds(ids: number[]): void {
  const current = this.seenReqNotificationIds;
  ids.forEach(id => current.add(id));
  this.seenReqNotificationIds = current;
}
// Draggable Modal Methods
startDrag(event: MouseEvent, modalId: string) {
  const target = event.currentTarget as HTMLElement;
  if (!target.closest('.modal-header-handle') && !target.closest('.report-modal-header') && 
      !target.closest('.search-modal-header') && !target.closest('.backup-modal-header') &&
      !target.closest('.cache-modal-header') && !target.closest('.logout-warning-header')) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  this.isDragging = true;
  this.currentDragModal = modal;
  
  const rect = modal.getBoundingClientRect();
  this.dragOffsetX = event.clientX - rect.left;
  this.dragOffsetY = event.clientY - rect.top;
  
  modal.style.cursor = 'grabbing';
  modal.style.transition = 'none';
  modal.style.position = 'fixed';
  modal.style.left = rect.left + 'px';
  modal.style.top = rect.top + 'px';
  modal.style.transform = 'none';
  modal.style.margin = '0';
  
  event.preventDefault();
}
loadNotificationCount() {
    // Get dismissed notifications with proper type casting
    const stored = localStorage.getItem('dismissed_computer_notifications');
    let dismissedSet: Set<string> = new Set<string>();
    
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored);
        dismissedSet = new Set<string>(parsed);
      } catch (e) {
        dismissedSet = new Set<string>();
      }
    }
    
    this.computerMonitoringNotifCount = this.getActiveNotificationCount(dismissedSet);
}
  getActiveNotificationCount(dismissedSet: Set<string>): number {
    const stored = localStorage.getItem('computer_monitoring_cache_v3');
    if (!stored) return 0;
    
    let pcs: any[] = [];
    try {
      pcs = JSON.parse(stored);
      if (!Array.isArray(pcs)) return 0;
    } catch (e) {
      return 0;
    }
    
    let count = 0;
    
    pcs.forEach((pc: any) => {
      const notifKey = `pc_${pc.id}`;
      
      // Check license expiry
      if (pc.license_expiry) {
        const days = this.getDaysRemaining(pc.license_expiry);
        if (days <= 0 && !dismissedSet.has(`${notifKey}_license_expired`)) count++;
        else if (days <= 30 && days > 0 && !dismissedSet.has(`${notifKey}_license_expiring`)) count++;
      }
      
      // Check office expiry
      if (pc.office_expiry) {
        const days = this.getDaysRemaining(pc.office_expiry);
        if (days <= 0 && !dismissedSet.has(`${notifKey}_office_expired`)) count++;
        else if (days <= 30 && days > 0 && !dismissedSet.has(`${notifKey}_office_expiring`)) count++;
      }
      
      // Check AV updates
      if (pc.av_next_update) {
        const days = this.getDaysRemaining(pc.av_next_update);
        if (days <= 0 && !dismissedSet.has(`${notifKey}_av_overdue`)) count++;
        else if (days <= 14 && days > 0 && !dismissedSet.has(`${notifKey}_av_due`)) count++;
      }
    });
    
    return count;
}
   getDaysRemaining(dateStr: string): number {
    if (!dateStr) return Infinity;
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
onDragMove(event: MouseEvent) {
  if (!this.isDragging || !this.currentDragModal) return;
  
  const x = event.clientX - this.dragOffsetX;
  const y = event.clientY - this.dragOffsetY;
  
  this.currentDragModal.style.left = x + 'px';
  this.currentDragModal.style.top = y + 'px';
}

onDragEnd() {
  if (this.currentDragModal) {
    this.currentDragModal.style.cursor = '';
    this.currentDragModal.style.transition = '';
  }
  this.isDragging = false;
  this.currentDragModal = null;
}

// ESC key handler
@HostListener('document:keydown', ['$event'])
onEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (this.showReportModal) this.closeReportModal();
    if (this.showSearchModal) this.closeSearchModal();
    if (this.showBackupModal && !this.backupInProgress) this.cancelBackup();
    if (this.showClearCacheModal && !this.cacheClearing) this.closeClearCacheModal();
    if (this.showLogoutWarning) this.cancelLogout();
    if (this.showLogoutConfirmModal) this.cancelLogoutConfirm();
  }
}
 // =============================================
  // SUBSCRIPTIONS (safe to set up immediately)
  // =============================================
  private setupSubscriptions(): void {
    // Notifications
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        const latest = notifications.find(n => n.type === 'success' && n.countInBadge && !n.read);
        if (latest && !this.shownStatusPopups.has(latest.id)) {
          this.shownStatusPopups.add(latest.id);
          this.showStatusPopup(latest.message);
        }
      });

    // User subscription
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.handleUnauthorized('User session ended');
          return;
        }
        this.currentUser = user;
        if (this.isAuthenticated) {
          this.loadRegistrationKeys();
          this.loadStats();
          this.loadDashboardData();
        }
      });

    // Restore preferences
    const savedSidebar = localStorage.getItem('sidebarHidden');
    if (savedSidebar !== null) this.sidebarHidden = savedSidebar === 'true';
    const savedView = localStorage.getItem('viewMode');
    if (savedView) this.currentViewMode = savedView;
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

   // Check if user is from the 'users' table (EDP/IT staff)
if (currentUser.user_table !== 'users') {
    this.handleUnauthorized('Access denied. EDP/IT staff only.');
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
      this.http.get<{valid: boolean; user?: any}>(`${this.apiUrl}/api/auth/verify-admin`, { headers }).subscribe({
  next: (response: any) => {
    // ✅ Check if user is from 'users' table instead of specific roles
    if (response && response.valid && response.user && response.user.user_table === 'users') {
      this.isAuthenticated = true;
      this.isTokenValid = true;
      this.initializeComponent();
      this.startSecurityTimers();
    } else {
      this.handleUnauthorized('Access denied. EDP/IT staff only.');
    }
  },
  error: (err) => {
    this.handleUnauthorized(err.status === 403 ? 
      'Access denied. Insufficient privileges.' : 'Authentication failed');
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
      queryParams: { reason: 'unauthorized', message: reason, timestamp: Date.now() }
    });
  }
  private startSecurityTimers(): void {
    this.sessionCheckInterval = setInterval(() => this.checkSessionValidity(), 60000);
    this.tokenCheckInterval = setInterval(() => this.validateToken(), 300000);
    this.resetInactivityTimer();
  }
  private checkSessionValidity(): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) { this.handleUnauthorized('Session lost'); return; }

  try {
    const tokenData = this.parseJwt(token);
    if (tokenData && tokenData.exp && tokenData.exp < Date.now() / 1000) {
      this.handleUnauthorized('Token expired'); return;
    }
    const currentUser = this.getStoredUser();
    if (currentUser?.locked_until && new Date(currentUser.locked_until).getTime() > Date.now()) {
      this.handleUnauthorized('Account is temporarily locked'); return;
    }
    // ✅ Check if user is from 'users' table instead of specific roles
    if (currentUser?.user_table !== 'users') {
      this.handleUnauthorized('Access denied. EDP/IT staff only.');
      return;
    }
  } catch (error) {
    this.handleUnauthorized('Session validation failed');
  }
}
get requisitionsNotificationCount(): number {
  // This will be updated by loadRequisitionsCount()
  return this._requisitionsNotificationCount;
}
 private validateToken(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get(`${this.apiUrl}/api/auth/validate-admin-token`, { headers }).subscribe({
      error: () => this.handleUnauthorized('Token validation failed')
    });
  }

  private parseJwt(token: string): any {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  }

  private getStoredUser(): any {
    try {
      const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch { return null; }
  }

   private clearAllSessionData(): void {
    localStorage.removeItem('token'); sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser'); sessionStorage.removeItem('currentUser');
    localStorage.removeItem('system_settings_cache');
    localStorage.removeItem('sidebarHidden'); localStorage.removeItem('clientSidebarHidden');
    localStorage.removeItem('viewMode');
    sessionStorage.clear();
  }

  private initializeComponent(): void {
     this.updateDateTime();
    this.clockInterval = setInterval(() => this.updateDateTime(), 1000);
    // Start message count polling
    this.loadUnreadMessagesCount();
    setInterval(() => this.loadUnreadMessagesCount(), 10000);
    this.loadDepartmentNames();
    this.startNewTicketPopup();
    this.loadJobOrdersCount();
    this.loadRequisitionsCount();
    this.loadSystemSettings();
    
    setInterval(() => {
      this.loadJobOrdersCount();
      this.loadRequisitionsCount();
    }, 30000);
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.handleUnauthorized('User session ended');
          return;
        }
        this.currentUser = user;
        this.loadRegistrationKeys();
        this.loadStats();
        this.loadDashboardData();
      });
    
    this.checkSystemStatus();
    
    const savedSidebar = localStorage.getItem('sidebarHidden');
    if (savedSidebar !== null) {
      this.sidebarHidden = savedSidebar === 'true';
    }
    const savedView = localStorage.getItem('viewMode');
    if (savedView) { this.currentViewMode = savedView; }
    
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        const latest = notifications.find(n => n.type === 'success' && n.countInBadge && !n.read);
        if (latest && !this.shownStatusPopups.has(latest.id)) {
          this.shownStatusPopups.add(latest.id);
          this.showStatusPopup(latest.message);
        }
      });
  }
  
get aiContext() {
  return {
    currentUser: this.currentUser,
    totalTickets: this.totalTickets,
    openTickets: this.openTickets,
    criticalTickets: this.criticalTickets,
    slaCompliance: this.slaCompliance,
    pendingJobOrdersCount: this.pendingJobOrdersCount,
    pendingRequisitionsCount: this.pendingRequisitionsCount,
  };
}
ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.popupInterval) clearInterval(this.popupInterval);
    if (this.statusPopupTimeout) clearTimeout(this.statusPopupTimeout);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.sessionCheckInterval) clearInterval(this.sessionCheckInterval);
    if (this.tokenCheckInterval) clearInterval(this.tokenCheckInterval);
    this.clearLogoutTimers();
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
  document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }
  private startNewTicketPopup() {
  // Show popup immediately, then every 10 seconds
  this.showNewTicketPopup();
  this.popupInterval = setInterval(() => this.showNewTicketPopup(), 10000);
}
loadSystemSettings() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${environment.apiUrl}/api/admin/settings`, { headers }).subscribe({
      next: (data) => {
        this.systemSettings = data || {};
        // Fallback to localStorage
        if (!data || Object.keys(data).length === 0) {
          const saved = localStorage.getItem('system_settings');
          if (saved) this.systemSettings = JSON.parse(saved);
        }
      },
      error: () => {
        const saved = localStorage.getItem('system_settings');
        if (saved) this.systemSettings = JSON.parse(saved);
      }
    });
  }
 goToCCTVInfo() {
  this.router.navigate(['/cctv-info']);
  this.activeMenu = null;
}
private showNewTicketPopup() {
  this.ticketService.getTickets().subscribe(tickets => {
    const newUnassigned = tickets.filter(t => t.status === 'new' && !t.assigned_to);
    if (newUnassigned.length > 0 && newUnassigned.length !== this.newTicketPopupCount) {
      this.newTicketPopupCount = newUnassigned.length;
      this.popupMessage = `${newUnassigned.length} new unassigned ticket(s) require attention.`;
    } else if (newUnassigned.length === 0) {
      this.popupMessage = null;
      this.newTicketPopupCount = 0;
    }
  });
}

dismissPopup(event?: MouseEvent) {
  if (event) event.stopPropagation();
  this.popupMessage = null;
}

autoLogout() {
    this.showLogoutWarning = true;
    this.startLogoutCountdown();
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
startInactivityTimer() { this.resetInactivityTimer(); }
resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.logoutWarningTimer) clearTimeout(this.logoutWarningTimer);
    this.inactivityTimer = setTimeout(() => {
      this.showLogoutWarning = true;
      this.startLogoutCountdown();
    }, this.INACTIVITY_TIMEOUT - 60000);
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
// Add this method
openAIAssistant() {
  this.activeMenu = null;
  this.aiAssistant?.open();
}

// Add this method
sendAIQuery() {
  if (!this.aiQuery.trim()) return;
  
  const userQuery = this.aiQuery.trim();
  this.aiHistory.push({ role: 'user', content: userQuery });
  this.aiQuery = '';
  this.aiLoading = true;
  
  // Build context with real system data
  const context = {
    currentUser: this.currentUser,
    totalTickets: this.totalTickets,
    openTickets: this.openTickets,
    criticalTickets: this.criticalTickets,
    slaCompliance: this.slaCompliance,
    resolvedToday: this.resolvedToday,
    topIssues: this.topIssues,
    pendingJobOrdersCount: this.pendingJobOrdersCount,
    pendingRequisitionsCount: this.pendingRequisitionsCount,
    systemSettings: this.systemSettings
  };
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Call backend AI endpoint (powered by Gemini!)
  this.http.post<any>(`${environment.aiApiUrl}/api/ai/assistant`, 
    { query: userQuery, context: context }, 
    { headers }
  ).subscribe({
    next: (response) => {
      if (response.success && response.answer) {
        this.aiHistory.push({
          role: 'assistant',
          content: response.answer
        });
      } else {
        const localAnswer = this.getLocalAIResponse(userQuery);
        this.aiHistory.push({
          role: 'assistant',
          content: localAnswer
        });
      }
      this.aiLoading = false;
      this.scrollAIChat();
    },
    error: (err) => {
      console.error('AI Assistant error:', err);
      const localAnswer = this.getLocalAIResponse(userQuery);
      this.aiHistory.push({
        role: 'assistant',
        content: localAnswer
      });
      this.aiLoading = false;
      this.scrollAIChat();
    }
  });
}

private getLocalAIResponse(query: string): string {
  return `⚠️ Unable to connect to AI service. Please ensure:
• The backend server is running on port 5000
• Gemini API key is configured in .env
• Run: pip install google-generativeai

Try again or contact support at support@edptech.com.`;
}

private scrollAIChat() {
  setTimeout(() => {
    const chatContainer = document.querySelector('.ai-chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, 100);
}
@HostListener('document:mousemove')
@HostListener('document:keydown')
@HostListener('document:click')
@HostListener('document:scroll')
@HostListener('document:touchstart')
onUserActivity() {
  this.resetInactivityTimer();
}
  // ── HostListener for keyboard shortcuts ──────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      this.newTicket();
    }
    if (event.key === 'F5') {
      event.preventDefault();
      this.refreshData();
    }
    if (event.key === 'Escape') {
      this.closeAllMenus();
    }
  }

  updateDateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString();
    this.currentTime = now.toLocaleTimeString();
  }

  get isDashboardView(): boolean {
  const url = this.router.url;
  // Check if we're on any dashboard-related route
  return url === '/dashboard' || 
         url === '/' || 
         url === '' || 
         url.startsWith('/dashboard');
}

  // ── Toggle sidebar — persisted ────────────────
  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
    localStorage.setItem('sidebarHidden', String(this.sidebarHidden));
    this.activeMenu = null;
  }

  // ── Menu toggle — closes others ───────────────
  toggleMenu(menu: string) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  closeAllMenus() {
    this.activeMenu = null;
  }
   loadNotificationMapFromStorage() {
    const stored = localStorage.getItem('jobOrderNotifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.notificationMap = new Map(parsed);
      } catch (e) {
        this.notificationMap = new Map();
      }
    }
  }
  // ✅ Load read orders from localStorage
  loadReadOrdersFromStorage() {
    const stored = localStorage.getItem('readJobOrders');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.readOrderIds = new Set(parsed);
      } catch (e) {
        this.readOrderIds = new Set();
      }
    }
  }
saveNotificationMapToStorage() {
  localStorage.setItem('jobOrderNotifications', JSON.stringify(Array.from(this.notificationMap.entries())));
}

  // ✅ Update notification counts
 updateNotificationCounts() {
  // Count unread orders for "Our Job Orders" (status updates)
  this.ourOrdersUnreadCount = this.allOrders.filter(o => {
    return this.notificationMap.has(o.id) && 
           this.notificationMap.get(o.id)?.type === 'status_update';
  }).length;
  
  // Count unread orders for "J.O. Request Management" (incoming)
  this.incomingOrdersUnreadCount = this.allOrders.filter(o => {
    return this.notificationMap.has(o.id) && 
           this.notificationMap.get(o.id)?.type === 'incoming';
  }).length;
  
  // ✅ Total unread count for the sidebar badge (combine both types)
  this.totalUnreadCount = this.ourOrdersUnreadCount + this.incomingOrdersUnreadCount;
  
  // ✅ Update pending count with the total unread count
  // This will show the badge on the sidebar link
  this.pendingJobOrdersCount = this.totalUnreadCount;
}

 loadJobOrdersCount() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).subscribe({
    next: (data) => {
      this.allOrders = Array.isArray(data) ? data : [];
      this.allJOsTotal = this.allOrders.length;
      
      // ✅ Traditional counts (for reference only - not used for badge)
      // Don't overwrite pendingJobOrdersCount here
      this.receivedJOsCount = this.allOrders.filter(o => o.status === 'approved').length;
      this.rejectedJOsCount = this.allOrders.filter(o => o.status === 'rejected').length;
      
      // ✅ Check for new notifications
      this.checkForNewNotifications();
      
      // ✅ Update notification counts (this will set pendingJobOrdersCount)
      this.updateNotificationCounts();
    },
    error: () => {
      this.totalUnreadCount = 0;
      this.pendingJobOrdersCount = 0;
    }
  });
}
checkForNewNotifications() {
  const currentUserBranchId = Number(this.currentUser?.branch_id);
  const currentUserDeptId = Number(this.currentUser?.dept_id || this.currentUser?.department_id);
  const currentUserId = Number(this.currentUser?.id);
  
  this.allOrders.forEach(o => {
    // Skip if already has a notification or is already read
    if (this.notificationMap.has(o.id) || this.readOrderIds.has(o.id)) return;
    
    const submitterBranchId = Number(o.submitter_branch_id || o.submitted_by_branch_id);
    const submitterDeptId = Number(o.submitter_dept_id || o.submitted_by_dept_id);
    const submittedById = Number(o.submitted_by);
    const orderBranchId = Number(o.branch_id);
    const orderDeptId = Number(o.department_id);
    const forwardedToBranchId = Number(o.forwarded_to_branch_id);
    const forwardedToDeptId = Number(o.forwarded_to_department_id);
    
    const isForUs = (orderBranchId === currentUserBranchId && orderDeptId === currentUserDeptId);
    const isForwardedToUs = o.is_forwarded && 
                           (forwardedToBranchId === currentUserBranchId && forwardedToDeptId === currentUserDeptId);
    const isFromOthers = !(submitterBranchId === currentUserBranchId && submitterDeptId === currentUserDeptId) && submittedById !== currentUserId;
    
    // ✅ Check for incoming notifications (new or forwarded orders)
    if ((isForUs || isForwardedToUs) && isFromOthers) {
      this.notificationMap.set(o.id, { type: 'incoming', status: '' });
      this.saveNotificationMapToStorage();
      return; // Skip status update check if already marked as incoming
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
    getBadgeCount(): number {
    return this.totalUnreadCount > 0 ? this.totalUnreadCount : 0;
  }
   hasUnreadNotifications(): boolean {
    return this.totalUnreadCount > 0;
  }

loadRequisitionsCount() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/requisitions`, { headers }).subscribe({
    next: (data) => {
      const reqs = Array.isArray(data) ? data : [];
      this.allReqsTotal = reqs.length;
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userBranchId = currentUser?.branch_id;
      const userDeptId = currentUser?.department_id;
      const userId = currentUser?.id;
      
      this.pendingRequisitionsCount = reqs.filter(r => (r.status || 'pending') === 'pending').length;
      this.receivedRequisitionsCount = reqs.filter(r => r.status === 'approved').length;
      this.rejectedRequisitionsCount = reqs.filter(r => r.status === 'rejected').length;
      
      // ✅ Use the getter which reads from localStorage
      const seenIds = this.seenReqNotificationIds;
      
      this._requisitionsNotificationCount = reqs.filter(r => {
        if (seenIds.has(r.id)) return false;
        
        const creatorBranch = r.creator_branch_id;
        const creatorDept = r.creator_dept_id;
        const isFromOurDept = (creatorBranch == userBranchId && creatorDept == userDeptId) || r.submitted_by == userId;
        
        const isIncoming = 
          (r.is_forwarded && r.forwarded_to_branch_id == userBranchId && r.forwarded_to_department_id == userDeptId && !isFromOurDept) ||
          (!r.is_forwarded && r.branch_id == userBranchId && r.department_id == userDeptId && r.submitted_by != userId && !isFromOurDept);
        
        if (!isIncoming) return false;
        
        if (r.status === 'pending') return true;
        if (r.is_forwarded && r.forwarded_status === 'processing') return true;
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
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/admin/requisitions`, { headers }).subscribe({
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
      
      // ✅ Add all current incoming IDs to the seen set (persisted to localStorage)
      this.addSeenReqIds(idsToMark);
      
      // Reset the count after marking as read
      this._requisitionsNotificationCount = 0;
    },
    error: () => {
      // Silently fail
    }
  });
}
goToRequisitions() {
  this.markRequisitionNotificationsAsRead();
  this.router.navigate(['/admin/requisitions']);
}
 setViewMode(mode: string) {
  this.currentViewMode = mode;
  localStorage.setItem('viewMode', mode);
  this.activeMenu = null;
  
  // Navigate to tickets with view mode query param
  this.router.navigate(['/tickets'], { queryParams: { view: mode } });
} 

// In loadStats and loadDashboardData, calculate assigned-to-me count
loadStats() {
  this.ticketService.getTickets().subscribe(tickets => {
    this.totalTickets = tickets.length;
    this.openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
    
    // ✅ Only count NEW unassigned tickets for the badge
    const newUnassigned = tickets.filter(t => t.status === 'new' && !t.assigned_to).length;
    
    // ✅ Separately count tickets assigned to current user
    const assignedToMe = tickets.filter(t => 
      t.assigned_to === this.currentUser?.id && 
      ['assigned', 'in_progress', 'pending'].includes(t.status)
    ).length;
    
    // Only show new unassigned count in badge
    this.newTicketsCount = newUnassigned;
    
    this.criticalTickets = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;
    this.resolvedToday = tickets.filter(t => {
      const today = new Date().toDateString();
      return t.status === 'resolved' && t.resolved_at &&
        new Date(t.resolved_at).toDateString() === today;
    }).length;
  });
}

  loadDashboardData() {
  this.ticketService.tickets$
  .pipe(takeUntil(this.destroy$))
  .subscribe(tickets => {
    this.totalTickets = tickets.length;
    this.openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
    
    // ✅ Only count NEW unassigned tickets for the badge
    const newUnassigned = tickets.filter(t => t.status === 'new' && !t.assigned_to).length;
    this.newTicketsCount = newUnassigned;
    
    this.criticalTickets = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;
    this.recentTickets = tickets.slice(0, 10);

    const locationMap = new Map<string, number>();
    tickets.forEach(t => {
      const loc = t.location || 'General';
      if (!['resolved', 'closed'].includes(t.status)) {
        locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      }
    });
    this.topIssues = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  this.ticketService.stats$
  .pipe(takeUntil(this.destroy$))
  .subscribe(stats => {
    if (stats) { this.slaCompliance = stats.slaCompliance; }
  });
}

  getPriorityCount(priority: string): number {
    let count = 0;
    this.ticketService.tickets$.subscribe(tickets => {
      count = tickets.filter(t => t.priority === priority && !['resolved', 'closed'].includes(t.status)).length;
    }).unsubscribe();
    return count;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      new: '🆕', assigned: '📌', in_progress: '⚙️',
      pending: '⏳', resolved: '✅', closed: '🔒'
    };
    return icons[status] || '📋';
  }
loadRegistrationKeys() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        this.registrationKeys = 'N/A';
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const branchId = currentUser?.branch_id;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<any[]>(`${this.apiUrl}/api/public/branches`, { headers }).subscribe({
        next: (branches) => {
            const branchList = Array.isArray(branches) ? branches : [];
            this.registrationKeyCount = branchList.length;
            this.activeKeyCount = branchList.filter((b: any) => b.is_active).length;
            
            if (branchId) {
                const userBranch = branchList.find((b: any) => b.id === branchId);
                if (userBranch?.registration_key) {
                    this.registrationKeys = userBranch.registration_key;
                } else {
                    this.registrationKeys = 'None';
                }
            } else if (branchList.length > 0) {
                this.registrationKeys = branchList[0]?.registration_key || 'None';
            } else {
                this.registrationKeys = 'None';
            }
        },
        error: (err) => {
            console.warn('Could not load branches:', err);
            if (err.status === 401) {
                this.registrationKeys = 'N/A';
            } else if (err.status === 403) {
                this.registrationKeys = 'Restricted';
            } else {
                this.registrationKeys = 'Error';
            }
        }
    });
}
  // ── Navigation ────────────────────────────────
  newTicket()        { this.router.navigate(['/tickets/new']); }
  goToTickets()      { this.router.navigate(['/tickets']); }
 goToFeatures() {
  this.router.navigate(['/features']); 
  this.activeMenu = null;
}
  goToChat() {
  this.router.navigate(['/admin/chat']);
}
  goToUsers() { this.router.navigate(['/admin/users-management']); }
  goToDashboard()    { this.router.navigate(['/dashboard']); }
  goToProfile() { 
  this.router.navigate(['/profile']); 
}

get isProfileRoute(): boolean {
  return this.router.url === '/profile';
}
goToKnowledgeBase() { 
    this.router.navigate(['/knowledge-base']);
}

  refreshData() {
  window.location.reload();
}

onGlobalSearch() {
  if (this.globalSearch.trim()) {
    this.router.navigate(['/tickets'], { queryParams: { search: this.globalSearch } });
  }
}

loadUnreadMessagesCount() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  const username = currentUser.username;
  
  if (!username) return;
  
  this.http.get<any[]>(`${environment.apiUrl}/api/messages/unread/${username}`, { headers }).subscribe({
    next: (unread) => {
      this.unreadMessagesCount = (unread || []).reduce((sum: number, item: any) => sum + (item.count || 0), 0);
    },
    error: (err) => {
      console.error('Error loading unread count:', err);
      this.unreadMessagesCount = 0;
    }
  });
}
searchTickets() {
  this.searchModalTerm = this.globalSearch || '';
  this.showSearchModal = true;
  this.activeMenu = null;
  
  // Focus the input after modal opens
  setTimeout(() => {
    const input = document.querySelector('.search-modal-input') as HTMLInputElement;
    if (input) input.focus();
  }, 100);
}

closeSearchModal() {
  this.showSearchModal = false;
}
performSearch() {
  if (this.searchModalTerm.trim()) {
    this.globalSearch = this.searchModalTerm.trim();
    this.showSearchModal = false;
    // Navigate to tickets page with search query
    this.router.navigate(['/tickets'], { queryParams: { search: this.globalSearch } });
  }
}
  clearFilters() {
    this.globalSearch = '';
    this.router.navigate(['/tickets']);
    this.activeMenu = null;
  }

 exportData() {
  this.activeMenu = null;
  
  const exportData = {
    exportInfo: {
      generatedBy: this.currentUser?.fullname || 'Unknown',
      generatedAt: new Date().toISOString(),
      systemVersion: 'EDPtech Helpdesk v2.0'
    },
    summary: {
      totalTickets: this.totalTickets,
      openTickets: this.openTickets,
      criticalTickets: this.criticalTickets,
      resolvedToday: this.resolvedToday,
      slaCompliance: this.slaCompliance,
      newTicketsCount: this.newTicketsCount
    },
    topIssues: this.topIssues,
    recentTickets: this.recentTickets.slice(0, 20).map(t => ({
      ticket_number: t.ticket_number,
      title: t.title,
      priority: t.priority,
      status: t.status,
      location: t.location,
      created_at: t.created_at
    }))
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edptech_report_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

printReport() {
  this.activeMenu = null;
  
  const now = new Date().toLocaleString();
  const user = this.currentUser?.fullname || 'Unknown';
  const systemTitle = this.systemSettings?.system_title || 'EDPtech Helpdesk v2.0';
  
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups for printing');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>EDPtech Helpdesk - System Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 30px; 
          color: #333;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px double #0a246a;
        }
        .header h1 { color: #0a246a; font-size: 22px; margin-bottom: 4px; }
        .header .subtitle { color: #666; font-size: 12px; }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          border: 1px solid #ddd;
          padding: 14px;
          text-align: center;
          border-radius: 6px;
        }
        .summary-card .value { font-size: 26px; font-weight: 700; color: #0a246a; }
        .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; margin-top: 4px; }
        
        .section { margin-bottom: 20px; }
        .section h3 { color: #0a246a; font-size: 14px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th {
          background: #f0f4f8;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #555;
          border: 1px solid #ddd;
        }
        td {
          padding: 7px 10px;
          border: 1px solid #eee;
          font-size: 11px;
        }
        tr:nth-child(even) td { background: #fafafa; }
        
        .badge {
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }
        .badge-critical { background: #ffecec; color: #cc0000; }
        .badge-high { background: #fff0e8; color: #cc5500; }
        .badge-medium { background: #fffae8; color: #886600; }
        .badge-low { background: #eeffee; color: #006600; }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #888;
        }
        
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${systemTitle} System Report</h1>
        <div class="subtitle">Generated by: ${user} | Date: ${now}</div>
      </div>
      
      <div class="section">
        <h3>📋 Ticket Summary</h3>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="value">${this.totalTickets}</div>
            <div class="label">Total Tickets</div>
          </div>
          <div class="summary-card">
            <div class="value">${this.openTickets}</div>
            <div class="label">Open Tickets</div>
          </div>
          <div class="summary-card">
            <div class="value">${this.criticalTickets}</div>
            <div class="label">Critical</div>
          </div>
          <div class="summary-card">
            <div class="value">${this.resolvedToday}</div>
            <div class="label">Resolved Today</div>
          </div>
          <div class="summary-card">
            <div class="value">${this.slaCompliance}%</div>
            <div class="label">SLA Compliance</div>
          </div>
          <div class="summary-card">
            <div class="value">${this.newTicketsCount}</div>
            <div class="label">New/Unassigned</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3>🔥 Top Issues by Location</h3>
        <table>
          <thead>
            <tr><th>Location</th><th>Open Tickets</th></tr>
          </thead>
          <tbody>
            ${this.topIssues.map(i => `
              <tr><td>${i.location}</td><td>${i.count}</td></tr>
            `).join('')}
            ${this.topIssues.length === 0 ? '<tr><td colspan="2">No open issues</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>🕐 Recent Tickets</h3>
        <table>
          <thead>
            <tr><th>Ticket #</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            ${this.recentTickets.slice(0, 15).map(t => `
              <tr>
                <td>${t.ticket_number}</td>
                <td>${t.title}</td>
                <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
                <td>${t.status}</td>
                <td>${new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <span>${systemTitle}</span> | Confidential | Generated: ${now}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

retryLastReport(): void {
  if (this.lastReportType) {
    this.generateReport(this.lastReportType);
  }
}

onReportPrinted(): void {
  console.log('Report printed');
}

// Update generateReport to store the type and handle errors
generateReport(type: string): void {
  this.lastReportType = type;
  this.reportError = null;
  
  const titles: Record<string, string> = {
    'daily': '📅 Daily Report',
    'weekly': '📆 Weekly Report', 
    'monthly': '📊 Monthly Report',
    'sla': '⏱️ SLA Performance',
    'agent': '👥 Agent Performance'
  };

  this.reportModalTitle = titles[type] || 'Report';
  this.reportLoading = true;
  this.showReportModal = true;
  this.activeMenu = null;

  const headers = this.getAuthHeaders();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const branchId = currentUser?.branch_id || 1;
  const departmentId = currentUser?.department_id || 1;
  
  let url = `${environment.apiUrl}/api/reports`;

  switch(type) {
    case 'daily': url += '?period=today'; break;
    case 'weekly': url += '?period=last7days'; break;
    case 'monthly': url += '?period=last30days'; break;
    case 'sla': url += '?period=last30days&type=sla'; break;
    case 'agent': url += '?period=last30days&type=agent'; break;
    default: url += '?period=last7days';
  }
  
  url += `&branch_id=${branchId}&department_id=${departmentId}`;

  // ✅ Load all data in parallel
  Promise.all([
    this.http.get<any>(url, { headers }).toPromise(),
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/requisitions`, { headers }).toPromise(),
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/job-orders`, { headers }).toPromise()
  ]).then(([reportData, requisitions, jobOrders]) => {
    this.reportModalData = {
      ...reportData,
      // ✅ Add requisitions data filtered by branch/department
      requisitionsData: this.processRequisitionsForReport(
        (Array.isArray(requisitions) ? requisitions : []).filter(r => 
          Number(r.branch_id) === branchId && Number(r.department_id) === departmentId
        )
      ),
      // ✅ Add job orders data filtered by branch/department
      jobOrdersData: this.processJobOrdersForReport(
        (Array.isArray(jobOrders) ? jobOrders : []).filter(jo => 
          Number(jo.branch_id) === branchId && Number(jo.department_id) === departmentId
        )
      )
    };
    this.reportLoading = false;
    this.reportError = null;
  }).catch((err) => {
    console.error('Failed to load report:', err);
    this.reportError = 'Failed to load report. Please check your connection and try again.';
    this.reportLoading = false;
  });
}

// ✅ Process requisitions for report display
private processRequisitionsForReport(requisitions: any[]): any {
  const now = new Date();
  const filterDate = this.getFilterDate(this.lastReportType);
  
  const filtered = filterDate ? requisitions.filter(r => new Date(r.created_at) >= filterDate) : requisitions;
  
  return {
    total: filtered.length,
    pending: filtered.filter(r => r.status === 'pending').length,
    approved: filtered.filter(r => r.status === 'approved').length,
    released: filtered.filter(r => r.status === 'released').length,
    rejected: filtered.filter(r => r.status === 'rejected').length,
    forwarded: filtered.filter(r => r.is_forwarded).length,
    recent: filtered.slice(0, 10).map(r => ({
      number: r.requisition_number,
      requestFrom: r.request_from,
      status: r.status,
      date: r.date,
      forwardedStatus: r.forwarded_status
    }))
  };
}

// ✅ Process job orders for report display
private processJobOrdersForReport(jobOrders: any[]): any {
  const now = new Date();
  const filterDate = this.getFilterDate(this.lastReportType);
  
  const filtered = filterDate ? jobOrders.filter(jo => new Date(jo.created_at) >= filterDate) : jobOrders;
  
  return {
    total: filtered.length,
    pending: filtered.filter(jo => jo.status === 'pending').length,
    approved: filtered.filter(jo => jo.status === 'approved').length,
    done: filtered.filter(jo => jo.status === 'done').length,
    assigned: filtered.filter(jo => jo.status === 'assigned').length,
    forwarded: filtered.filter(jo => jo.is_forwarded).length,
    recent: filtered.slice(0, 10).map(jo => ({
      number: jo.job_order_number,
      department: jo.department,
      status: jo.status,
      date: jo.date,
      requestedDept: jo.request_dept,
      assignedNames: jo.assigned_names
    }))
  };
}

// ✅ Helper to get filter date based on report type
private getFilterDate(type: string): Date | null {
  const now = new Date();
  switch(type) {
    case 'daily': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return null; // No date filter for SLA/Agent reports
  }
}

// ✅ Add fallback method for local report generation
private generateLocalReport(type: string, branchId: number, departmentId: number): void {
  let tickets: Ticket[] = [];
  
  this.ticketService.tickets$.pipe(takeUntil(this.destroy$)).subscribe(t => {
    tickets = t;
  }).unsubscribe();

  // ✅ Filter by branch and department
  tickets = tickets.filter(t => 
    Number(t.branch_id) === branchId && 
    Number(t.department_id) === departmentId
  );

  const now = new Date();
  let filteredTickets = tickets;
  let periodLabel = '';

  if (type === 'daily') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filteredTickets = tickets.filter(t => new Date(t.created_at) >= today);
    periodLabel = 'Today';
  } else if (type === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredTickets = tickets.filter(t => new Date(t.created_at) >= weekAgo);
    periodLabel = 'Last 7 Days';
  } else if (type === 'monthly') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredTickets = tickets.filter(t => new Date(t.created_at) >= monthAgo);
    periodLabel = 'Last 30 Days';
  } else {
    periodLabel = type === 'sla' ? 'SLA Performance' : 'Agent Performance';
  }

  this.reportModalData = {
    totalTickets: filteredTickets.length,
    openTickets: filteredTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
    resolvedTickets: filteredTickets.filter(t => t.status === 'resolved').length,
    criticalTickets: filteredTickets.filter(t => t.priority === 'critical').length,
    avgResolutionTime: 'N/A',
    slaCompliance: this.slaCompliance,
    periodLabel: `${periodLabel} (EDP/IT - Main Branch)`,
    
    priorityData: [
      { label: 'Critical', count: filteredTickets.filter(t => t.priority === 'critical').length, percentage: 0, color: '#cc0000' },
      { label: 'High', count: filteredTickets.filter(t => t.priority === 'high').length, percentage: 0, color: '#ff6600' },
      { label: 'Medium', count: filteredTickets.filter(t => t.priority === 'medium').length, percentage: 0, color: '#ffaa00' },
      { label: 'Low', count: filteredTickets.filter(t => t.priority === 'low').length, percentage: 0, color: '#008800' }
    ],
    
    departmentData: this.getLocalDepartmentData(filteredTickets),
    
    recentTickets: filteredTickets.slice(0, 10).map(t => ({
      ticket_number: t.ticket_number,
      title: t.title,
      priority: t.priority,
      status: t.status
    }))
  };

  const total = filteredTickets.length || 1;
  this.reportModalData.priorityData.forEach((p: any) => {
    p.percentage = Math.round((p.count / total) * 100);
  });
  
  this.reportLoading = false;
  this.reportError = null;
}

private getLocalDepartmentData(tickets: Ticket[]): any[] {
  const deptMap = new Map<string, { total: number; open: number; resolved: number }>();
  
  tickets.forEach(t => {
    const deptId = t.department_id || 0;
    // ✅ Use the loaded department names from API
    const dept = this.departmentMap.get(Number(deptId)) || t.location || `Dept #${deptId}`;
    
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { total: 0, open: 0, resolved: 0 });
    }
    const d = deptMap.get(dept)!;
    d.total++;
    if (t.status === 'resolved') d.resolved++;
    else if (!['resolved', 'closed'].includes(t.status)) d.open++;
  });
  
  return Array.from(deptMap.entries()).map(([name, data]) => ({
    name,
    total: data.total,
    open: data.open,
    resolved: data.resolved,
    sla: Math.round((data.resolved / (data.total || 1)) * 100)
  }));
}
private loadDepartmentNames(): void {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  
  this.http.get<any[]>(`${environment.apiUrl}/api/departments`, { headers }).subscribe({
    next: (departments) => {
      if (Array.isArray(departments)) {
        departments.forEach((dept: any) => {
          this.departmentMap.set(Number(dept.id), dept.name || 'Unknown');
        });
      }
    },
    error: () => {
      console.warn('Could not load departments for report');
    }
  });
}
closeReportModal(): void {
  this.showReportModal = false;
  this.reportModalData = null;
  this.reportError = null;
}

printReportModal() {
  window.print();
}

private getAuthHeaders(): any {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return { 'Authorization': `Bearer ${token}` };
}

//for database backup
backupData() {
  this.activeMenu = null;
  
  // Show the backup modal
  this.showBackupModal = true;
  this.backupError = null;
}

cancelBackup() {
  if (!this.backupInProgress) {
    this.showBackupModal = false;
    this.backupError = null;
  }
}

startDatabaseBackup() {
  this.backupInProgress = true;
  this.backupError = null;
  
  const originalCacheStatus = this.cacheStatus;
  this.cacheStatus = 'Exporting...';
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  this.http.get(`${environment.apiUrl}/api/admin/database/export`, { 
    headers,
    responseType: 'blob',
    observe: 'response'
  }).subscribe({
    next: (response: any) => {
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `edptech_helpdesk_backup_${new Date().toISOString().split('T')[0]}.sql`;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const blob = new Blob([response.body], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Reset states
      this.backupInProgress = false;
      this.showBackupModal = false;
      this.cacheStatus = originalCacheStatus;
      
      // Show success message
      const fileSizeKB = (blob.size / 1024).toFixed(1);
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      const sizeDisplay = blob.size > 1048576 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
      
      this.showStatusPopup(`✅ Database backup completed!\n📁 ${filename}\n📦 Size: ${sizeDisplay}`);
      
      console.log('✅ Database backup downloaded:', filename);
    },
    error: (err) => {
      console.error('❌ Backup failed:', err);
      this.backupInProgress = false;
      this.cacheStatus = originalCacheStatus;
      
      // Parse error message
      let errorMsg = 'Failed to export database. Please try again.';
      if (err.error) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorObj = JSON.parse(reader.result as string);
            this.backupError = errorObj.error || errorMsg;
          } catch {
            this.backupError = errorMsg;
          }
        };
        reader.readAsText(err.error);
      } else if (err.status === 403) {
        this.backupError = 'Access denied. Admin privileges required.';
      } else if (err.status === 0) {
        this.backupError = 'Cannot connect to server. Check if backend is running.';
      } else {
        this.backupError = `Export failed (Error ${err.status}). Please try again.`;
      }
    }
  });
}

  restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          JSON.parse(e.target.result);
          alert('Restore completed! Please refresh the page.');
        } catch {
          alert('Invalid backup file!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    this.activeMenu = null;
  }

 systemHealth() {
    this.router.navigate(['/admin/system-health']);
    this.activeMenu = null;
}

//clearCache() method
clearCache() {
  this.activeMenu = null;
  this.showClearCacheModal = true;
}

closeClearCacheModal() {
  if (!this.cacheClearing) {
    this.showClearCacheModal = false;
    this.resetCacheSelection();
  }
}

toggleCacheItem(item: string) {
  (this.cacheItems as any)[item] = !(this.cacheItems as any)[item];
}

selectAllCache() {
  const allSelected = Object.values(this.cacheItems).every(v => v);
  Object.keys(this.cacheItems).forEach(key => {
    (this.cacheItems as any)[key] = !allSelected;
  });
}

resetCacheSelection() {
  this.cacheItems = {
    viewMode: true,
    sidebarState: true,
    searchHistory: true,
    formData: true,
    notifications: false,
    userPreferences: false,
    allData: false
  };
}
hasSystemAccess(): boolean {
  if (!this.currentUser) {
    // Also check localStorage directly
    const storedUser = JSON.parse(
      localStorage.getItem('currentUser') || 
      sessionStorage.getItem('currentUser') || 
      '{}'
    );
    if (!storedUser.role) return false;
    
    const role = (storedUser.role || '').toLowerCase().trim();
    
    console.log('🔍 hasSystemAccess check - role:', role);
    
    return role === 'admin' || 
           role === 'head/manager' || 
           role === 'head manager' ||
           role === 'supervisor' || 
           role === 'branch manager';
  }
  
  const role = (this.currentUser.role || '').toLowerCase().trim();
  
  console.log('🔍 hasSystemAccess check - role:', role);
  
  return role === 'admin' || 
         role === 'head/manager' || 
         role === 'head manager' ||
         role === 'supervisor' || 
         role === 'branch manager';
}
/**
 * ✅ Check if current user is an Admin (for restricted features)
 * Only Admin users can see Database and System Health
 */
isAdminUser(): boolean {
  if (!this.currentUser) {
    const storedUser = JSON.parse(
      localStorage.getItem('currentUser') || 
      sessionStorage.getItem('currentUser') || 
      '{}'
    );
    if (!storedUser.role) return false;
    
    const role = (storedUser.role || '').toLowerCase().trim();
    return role === 'admin';
  }
  
  const role = (this.currentUser.role || '').toLowerCase().trim();
  return role === 'admin';
}
performCacheClear() {
  this.cacheClearing = true;
  this.cacheStatus = 'Clearing...';
  
  setTimeout(() => {
    // Clear selected items
    if (this.cacheItems.viewMode) {
      localStorage.removeItem('viewMode');
    }
    if (this.cacheItems.sidebarState) {
      localStorage.removeItem('sidebarHidden');
      localStorage.removeItem('clientSidebarHidden');
    }
    if (this.cacheItems.searchHistory) {
      localStorage.removeItem('recentSearches');
      localStorage.removeItem('searchFilters');
    }
    if (this.cacheItems.formData) {
      // Clear any saved form data
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('form_') || key.startsWith('draft_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    if (this.cacheItems.notifications) {
      localStorage.removeItem('dismissedNotifications');
      sessionStorage.removeItem('notificationCache');
    }
    if (this.cacheItems.userPreferences) {
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('themeSettings');
    }
    if (this.cacheItems.allData) {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    const clearedItems = Object.entries(this.cacheItems)
      .filter(([_, v]) => v)
      .map(([k]) => k.replace(/([A-Z])/g, ' $1').toLowerCase());
    
    this.cacheClearing = false;
    this.showClearCacheModal = false;
    this.cacheStatus = `Cleared: ${clearedItems.length} item(s)`;
    
    if (this.cacheItems.allData || clearedItems.length > 3) {
      setTimeout(() => {
        this.cacheStatus = 'Active';
        window.location.reload();
      }, 1500);
    } else {
      setTimeout(() => {
        this.cacheStatus = 'Active';
      }, 3000);
    }
  }, 800);
}

getCacheSize(): string {
  let size = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      size += (localStorage.getItem(key) || '').length * 2; // UTF-16
    }
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      size += (sessionStorage.getItem(key) || '').length * 2;
    }
  }
  
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

  goToAbout() {
  this.router.navigate(['/admin/about']);
  this.activeMenu = null;
}
allCacheSelected(): boolean {
  return Object.values(this.cacheItems).every(v => v);
}

anyCacheSelected(): boolean {
  return Object.values(this.cacheItems).some(v => v);
}
goToDocumentation() {
  this.router.navigate(['/admin/documentation']);
  this.activeMenu = null;
}

goToShortcuts() {
  this.router.navigate(['/admin/shortcuts']);
  this.activeMenu = null;
}

goToUpdates() {
  this.router.navigate(['/admin/updates']);
  this.activeMenu = null;
}

goToSupport() {
  this.router.navigate(['/admin/support']);
  this.activeMenu = null;
}

  exit() {
  // Show confirmation modal instead of native confirm
  this.showLogoutConfirmModal = true;
  this.activeMenu = null;
}
  logout() {
  // Show confirmation modal instead of logging out directly
  this.showLogoutConfirmModal = true;
  this.activeMenu = null;
}

// ✅ Cancel logout confirmation
cancelLogoutConfirm() {
  this.showLogoutConfirmModal = false;
}

// ✅ Confirm and proceed with logout
confirmLogout() {
  this.showLogoutConfirmModal = false;
  this.clearLogoutTimers();
  this.clearAllSessionData();
  this.authService.logout();
}
}