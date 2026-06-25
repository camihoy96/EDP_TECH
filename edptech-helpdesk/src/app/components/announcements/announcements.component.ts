import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Announcement {
  id: number;
  tag: 'NEW' | 'INFO' | 'MAINT' | 'URGENT';
  title: string;
  content: string;
  date: string;
  isRead: boolean;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="announcements-page">
      <div class="page-header">
        <h2>📢 Announcements Center</h2>
        <button class="mark-all-btn" (click)="markAllAsRead()">Mark all as read</button>
      </div>

      <div class="stats-summary">
        <div class="stat-box">
          <span class="stat-number">{{ announcements.length }}</span>
          <span class="stat-label">Total Announcements</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ unreadCount }}</span>
          <span class="stat-label">Unread</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ urgentCount }}</span>
          <span class="stat-label">Urgent</span>
        </div>
      </div>

      <div class="announcements-list">
        <div class="announcement-card" *ngFor="let ann of announcements" [class.unread]="!ann.isRead">
          <div class="card-header">
            <span class="ann-tag" [class]="'tag-' + ann.tag.toLowerCase()">{{ ann.tag }}</span>
            <span class="ann-date">{{ ann.date }}</span>
            <span class="read-status" *ngIf="!ann.isRead">● New</span>
          </div>
          <h3 class="ann-title">{{ ann.title }}</h3>
          <p class="ann-content">{{ ann.content }}</p>
          <div class="card-footer" *ngIf="!ann.isRead">
            <button class="mark-read-btn" (click)="markAsRead(ann.id)">✓ Mark as read</button>
          </div>
        </div>

        <div class="empty-state" *ngIf="announcements.length === 0">
          <span>📭</span>
          <p>No announcements at this time.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .announcements-page {
      padding: 20px;
      height: 100%;
      overflow-y: auto;
      background: #f5f5f5;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0a246a;
    }

    .page-header h2 {
      margin: 0;
      font-size: 16px;
      color: #0a246a;
    }

    .back-btn {
      background: #f0f0f0;
      border: 1px solid #a0a0a0;
      border-radius: 3px;
      padding: 5px 12px;
      cursor: pointer;
      font-size: 11px;
    }

    .back-btn:hover {
      background: #e0e0e0;
    }

    .mark-all-btn {
      background: #0a246a;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 5px 12px;
      cursor: pointer;
      font-size: 11px;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }

    .stat-box {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }

    .stat-number {
      font-size: 28px;
      font-weight: bold;
      color: #0a246a;
      display: block;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }

    .announcements-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .announcement-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 6px;
      padding: 16px;
      transition: all 0.2s;
    }

    .announcement-card.unread {
      background: #e8f0fe;
      border-left: 4px solid #0a246a;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .ann-tag {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .tag-new { background: #0a3a8c; color: white; }
    .tag-info { background: #0066cc; color: white; }
    .tag-maint { background: #cc6600; color: white; }
    .tag-urgent { background: #cc0000; color: white; }

    .ann-date {
      font-size: 10px;
      color: #666;
    }

    .read-status {
      font-size: 9px;
      color: #0a246a;
      font-weight: bold;
    }

    .ann-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }

    .ann-content {
      margin: 0;
      font-size: 12px;
      color: #555;
      line-height: 1.5;
    }

    .card-footer {
      margin-top: 12px;
      text-align: right;
    }

    .mark-read-btn {
      background: none;
      border: none;
      color: #0a246a;
      cursor: pointer;
      font-size: 11px;
    }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: #999;
    }
  `]
})
export class AnnouncementsComponent {
  announcements: Announcement[] = [
    {
      id: 1,
      tag: 'NEW',
      title: 'IT Support Hours Extended',
      content: 'IT Support hours are now extended to 8AM – 8PM on weekdays to better serve you.',
      date: '2024-04-15',
      isRead: false
    },
    {
      id: 2,
      tag: 'INFO',
      title: 'New Self-Service Portal Features',
      content: 'You can now reset your password and request software installations directly from this portal.',
      date: '2024-04-14',
      isRead: false
    },
    {
      id: 3,
      tag: 'MAINT',
      title: 'Scheduled System Maintenance',
      content: 'The IT systems will undergo maintenance on Saturday, April 20 from 2AM to 4AM. Expect brief downtime.',
      date: '2024-04-13',
      isRead: true
    },
    {
      id: 4,
      tag: 'URGENT',
      title: 'Security Update Required',
      content: 'Please ensure your antivirus software is up to date. Contact IT if you need assistance.',
      date: '2024-04-12',
      isRead: false
    }
  ];

  constructor(private router: Router) {}

  get unreadCount(): number {
    return this.announcements.filter(a => !a.isRead).length;
  }
  get urgentCount(): number {
  return this.announcements.filter(a => a.tag === 'URGENT').length;
}
  goBack() {
    this.router.navigate(['/client/dashboard']);
  }

  markAsRead(id: number) {
    const announcement = this.announcements.find(a => a.id === id);
    if (announcement) {
      announcement.isRead = true;
    }
  }

  markAllAsRead() {
    this.announcements.forEach(a => a.isRead = true);
  }
}