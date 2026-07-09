import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'ticket' | 'job_order' | 'requisition' | 'leave' | 'holiday' | 'moon_phase';
  status?: string;
  ticketNumber?: string;
  jobOrderNumber?: string;
  requisitionNumber?: string;
  color: string;
}

interface MoonPhase {
  date: Date;
  phase: 'new' | 'first_quarter' | 'full' | 'last_quarter';
  emoji: string;
  label: string;
}

@Component({
  selector: 'app-client-calendar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" 
           (click)="$event.stopPropagation()"
           [style.transform]="'translate(' + modalPosition.x + 'px, ' + modalPosition.y + 'px)'"
           (mousedown)="onMouseDown($event)">
        
        <!-- Header - Draggable with Branch & Company -->
        <div class="modal-header" 
             (mousedown)="onHeaderMouseDown($event)"
             style="cursor: grab;">
          <div class="header-left">
            <div class="header-branch">
              <span class="branch-icon">🏢</span>
              <span class="branch-name">{{ currentBranch?.name || 'Branch' }}</span>
              <span class="company-name" *ngIf="currentBranch?.company_name">({{ currentBranch.company_name }})</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="nav-btn" (click)="previousMonth()">◀</button>
            <button class="nav-btn" (click)="today()">Today</button>
            <button class="nav-btn" (click)="nextMonth()">▶</button>
            <button class="close-btn" (click)="close.emit()">✕</button>
          </div>
        </div>

        <!-- Month/Year Title -->
        <div class="month-title">
          <span class="month-name">{{ currentMonthName }}</span>
          <span class="year-name">{{ currentYear }}</span>
        </div>

        <!-- Legend -->
        <div class="legend-bar">
          <div class="legend-item">
            <span class="legend-dot ticket-dot"></span>
            <span>Tickets</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot job-dot"></span>
            <span>Job Orders</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot req-dot"></span>
            <span>Requisitions</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot leave-dot"></span>
            <span>Leave</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot moon-dot"></span>
            <span>Moon Phase</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot holiday-dot"></span>
            <span>Holiday</span>
          </div>
        </div>

        <!-- Weekday Headers - Starting Monday -->
        <div class="weekday-header">
          <div class="weekday" *ngFor="let day of weekDays">{{ day }}</div>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <div 
            class="calendar-day" 
            *ngFor="let day of calendarDays"
            [class.empty]="!day.date"
            [class.today]="day.isToday"
            [class.weekend]="day.isWeekend"
            [class.other-month]="!day.isCurrentMonth"
            [class.has-holiday]="day.holidayName"
            (click)="day.date && selectDay(day)"
          >
            <span class="day-number">{{ day.dayNumber }}</span>
            <!-- Holiday Name -->
            <div class="holiday-name-label" *ngIf="day.holidayName" [title]="day.holidayName">
              <span class="holiday-label">{{ day.holidayName }}</span>
            </div>
            <!-- Moon Phase Emoji with Tooltip -->
            <div class="moon-phase" *ngIf="day.moonPhase" [title]="day.moonPhase.label">
              <span class="moon-emoji">{{ day.moonPhase.emoji }}</span>
            </div>
            <div class="day-events">
              <div 
                class="event-dot" 
                *ngFor="let event of day.events.slice(0, 2)"
                [style.background]="event.color"
                [title]="event.title"
              ></div>
            </div>
            <div class="event-count" *ngIf="day.events.length > 2">+{{ day.events.length - 2 }}</div>
          </div>
        </div>

        <!-- Bottom Bar: Previous Month (Left) | Holidays (Center) | Next Month (Right) -->
        <div class="bottom-bar">
          <div class="bottom-left" (click)="previousMonth()">
            <span class="nav-arrow">◀</span>
            <div class="month-preview">
              <span class="nav-month">{{ previousMonthName }}</span>
              <span class="month-days">{{ previousMonthDays }} days</span>
            </div>
          </div>
          
          <div class="bottom-center">
            <div class="holidays-container">
              <div class="holidays-header" *ngIf="holidays.length > 0">
                <span>🎉 {{ holidays.length }} Holiday{{ holidays.length > 1 ? 's' : '' }}</span>
              </div>
              <div class="holidays-header" *ngIf="holidays.length === 0">
                <span>📅 No holidays this month</span>
              </div>
              <div class="holiday-list" *ngIf="holidays.length > 0">
                <div class="holiday-item" *ngFor="let holiday of holidays">
                  <span class="holiday-date">{{ holiday.startDate | date:'MMM d' }}</span>
                  <span class="holiday-name">{{ holiday.title }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bottom-right" (click)="nextMonth()">
            <div class="month-preview">
              <span class="nav-month">{{ nextMonthName }}</span>
              <span class="month-days">{{ nextMonthDays }} days</span>
            </div>
            <span class="nav-arrow">▶</span>
          </div>
        </div>

        <!-- Event List for Selected Day -->
        <div class="event-list" *ngIf="selectedDayEvents.length > 0">
          <div class="event-list-header">
            <span>📋 Events for {{ selectedDate | date:'MMMM d, yyyy' }}</span>
          </div>
          <div class="event-list-body">
            <div 
              class="event-item" 
              *ngFor="let event of selectedDayEvents"
              (click)="navigateToEvent(event)"
            >
              <div class="event-color-bar" [style.background]="event.color"></div>
              <div class="event-info">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-meta">
                  <span class="event-type" [class]="'type-' + event.type">
                    {{ event.type | titlecase }}
                  </span>
                  <span class="event-status" *ngIf="event.status">{{ event.status }}</span>
                  <span class="event-id" *ngIf="event.ticketNumber">#{{ event.ticketNumber }}</span>
                  <span class="event-id" *ngIf="event.jobOrderNumber">#{{ event.jobOrderNumber }}</span>
                  <span class="event-id" *ngIf="event.requisitionNumber">#{{ event.requisitionNumber }}</span>
                </div>
              </div>
              <button class="event-view-btn" title="View details">👁️</button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      animation: fadeIn 0.2s ease;
    }

    .modal-content {
      background: white;
      border: 2px solid #808080;
      box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4);
      width: 90%;
      max-width: 850px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      transition: none;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      background: #0a246a;
      color: white;
      flex-shrink: 0;
      user-select: none;
    }

    .modal-header:active {
      cursor: grabbing;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .header-branch {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .branch-icon {
      font-size: 14px;
    }

    .branch-name {
      font-weight: 600;
    }

    .company-name {
      opacity: 0.8;
      font-style: italic;
      font-size: 11px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      transition: background 0.15s;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 8px;
      transition: background 0.15s;
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.5);
    }

    .month-title {
      text-align: center;
      padding: 4px 0;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      flex-shrink: 0;
    }

    .month-name {
      color: #0a246a;
    }

    .year-name {
      color: #64748b;
      margin-left: 4px;
    }

    .legend-bar {
      display: flex;
      gap: 10px;
      padding: 3px 12px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      flex-wrap: wrap;
      flex-shrink: 0;
      font-size: 9px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #333;
    }

    .legend-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-dot.ticket-dot { background: #3b82f6; }
    .legend-dot.job-dot { background: #22c55e; }
    .legend-dot.req-dot { background: #f59e0b; }
    .legend-dot.leave-dot { background: #8b5cf6; }
    .legend-dot.moon-dot { background: #6366f1; }
    .legend-dot.holiday-dot { background: #ef4444; }

    .weekday-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f1f5f9;
      border-bottom: 1px solid #ddd;
      flex-shrink: 0;
    }

    .weekday {
      padding: 3px 4px;
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #ddd;
      flex: 1;
      min-height: 250px;
    }

    .calendar-day {
      background: white;
      min-height: 55px;
      padding: 2px 4px;
      cursor: pointer;
      position: relative;
      transition: background 0.15s;
    }

    .calendar-day:hover {
      background: #f8fafc;
    }

    .calendar-day.empty {
      background: #f8f9fa;
      cursor: default;
    }

    .calendar-day.other-month .day-number {
      opacity: 0.3;
    }

    .calendar-day.today {
      background: #eef2ff;
    }

    .calendar-day.today .day-number {
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      padding: 1px 5px;
    }

    .calendar-day.weekend .day-number {
      color: #ef4444;
    }

    .calendar-day.has-holiday {
      background: #fef2f2;
      border: 1px solid #fca5a5;
    }

    .day-number {
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
      padding: 1px 4px;
      display: inline-block;
    }

    .holiday-name-label {
      position: absolute;
      bottom: 2px;
      left: 2px;
      right: 2px;
      font-size: 7px;
      font-weight: 700;
      color: #dc2626;
      background: rgba(254, 242, 242, 0.9);
      padding: 1px 3px;
      border-radius: 2px;
      border: 1px solid #fca5a5;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: calc(100% - 4px);
      cursor: help;
    }

    .moon-phase {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 11px;
      cursor: help;
    }

    .moon-phase:hover {
      transform: scale(1.2);
      transition: transform 0.2s;
    }

    .day-events {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 2px;
    }

    .event-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
      cursor: help;
    }

    .event-dot:hover {
      transform: scale(1.5);
      transition: transform 0.2s;
    }

    .event-count {
      font-size: 7px;
      color: #94a3b8;
      font-weight: 700;
      margin-top: 2px;
    }

    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      padding: 6px 12px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      flex-shrink: 0;
      min-height: 50px;
      gap: 8px;
    }

    .bottom-left, .bottom-right {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 10px;
      border: 1px solid transparent;
      transition: all 0.15s;
      min-width: 100px;
      flex-shrink: 0;
    }

    .bottom-left:hover, .bottom-right:hover {
      background: #e8e8e8;
      border-color: #a0a0a0;
    }

    .month-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .nav-arrow {
      font-size: 14px;
      color: #0a246a;
      font-weight: 700;
    }

    .nav-month {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
    }

    .month-days {
      font-size: 9px;
      color: #94a3b8;
    }

    .bottom-center {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 0;
      padding: 0 8px;
    }

    .holidays-container {
      width: 100%;
      max-height: 80px;
      overflow-y: auto;
      text-align: center;
    }

    .holidays-header {
      font-weight: 600;
      color: #0a246a;
      font-size: 11px;
      padding-bottom: 2px;
      border-bottom: 1px dashed #ddd;
      margin-bottom: 2px;
    }

    .holiday-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
      align-items: center;
    }

    .holiday-item {
      display: flex;
      gap: 8px;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 2px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }

    .holiday-date {
      font-weight: 700;
      color: #dc2626;
    }

    .holiday-name {
      color: #1f2937;
    }

    .event-list {
      border-top: 1px solid #ddd;
      max-height: 120px;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .event-list-header {
      padding: 4px 12px;
      background: #f8f9fa;
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
      border-bottom: 1px solid #ddd;
    }

    .event-list-body {
      padding: 2px 0;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 12px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f1f5f9;
    }

    .event-item:hover {
      background: #f1f5f9;
    }

    .event-color-bar {
      width: 3px;
      height: 20px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-title {
      font-size: 11px;
      font-weight: 500;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-meta {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 1px;
    }

    .event-type {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .event-type.type-ticket { background: #dbeafe; color: #2563eb; }
    .event-type.type-job_order { background: #dcfce7; color: #16a34a; }
    .event-type.type-requisition { background: #fef3c7; color: #d97706; }
    .event-type.type-leave { background: #ede9fe; color: #7c3aed; }
    .event-type.type-holiday { background: #fce4ec; color: #dc2626; }
    .event-type.type-moon_phase { background: #e0e7ff; color: #4f46e5; }

    .event-status {
      font-size: 8px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 2px;
      background: #f1f5f9;
      color: #64748b;
    }

    .event-id {
      font-size: 8px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 2px;
      background: #f1f5f9;
      color: #0f172a;
      font-family: monospace;
    }

    .event-view-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 2px;
      color: #94a3b8;
      transition: background 0.15s, color 0.15s;
    }

    .event-view-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .loading-state {
      text-align: center;
      padding: 30px;
      color: #94a3b8;
    }

    .loading-state .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 10px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .holidays-container::-webkit-scrollbar { width: 3px; }
    .holidays-container::-webkit-scrollbar-track { background: #f1f5f9; }
    .holidays-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    .event-list::-webkit-scrollbar { width: 4px; }
    .event-list::-webkit-scrollbar-track { background: #f1f5f9; }
    .event-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    @media (max-width: 600px) {
      .modal-content {
        width: 95%;
        max-height: 95vh;
      }

      .calendar-day {
        min-height: 45px;
        padding: 2px 3px;
      }

      .day-number {
        font-size: 9px;
      }

      .moon-phase {
        font-size: 9px;
        top: 1px;
        right: 2px;
      }

      .event-dot {
        width: 4px;
        height: 4px;
      }

      .holiday-name-label {
        font-size: 6px;
        padding: 1px 2px;
      }

      .bottom-bar {
        font-size: 9px;
        padding: 4px 6px;
        flex-wrap: nowrap;
        gap: 4px;
        min-height: 40px;
      }

      .bottom-left, .bottom-right {
        padding: 2px 6px;
        min-width: 60px;
      }

      .nav-month {
        font-size: 10px;
      }

      .month-days {
        font-size: 7px;
      }

      .holiday-item {
        font-size: 8px;
        padding: 1px 4px;
        max-width: 100%;
      }

      .header-branch {
        font-size: 9px;
      }

      .modal-header {
        padding: 4px 8px;
      }

      .nav-btn {
        font-size: 9px;
        padding: 1px 6px;
      }

      .legend-bar {
        font-size: 8px;
        gap: 6px;
        padding: 2px 8px;
      }

      .holidays-header {
        font-size: 9px;
      }

      .bottom-center {
        padding: 0 4px;
      }

      .holidays-container {
        max-height: 60px;
      }
    }
  `]
})
export class ClientCalendarModalComponent implements OnInit, OnDestroy {
  @Input() userId?: number;
  @Output() close = new EventEmitter<void>();

  currentDate = new Date();
  currentYear = 0;
  currentMonth = 0;
  currentMonthName = '';
  previousMonthName = '';
  nextMonthName = '';
  previousMonthDays = 0;
  nextMonthDays = 0;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  selectedDate: Date | null = null;
  selectedDayEvents: any[] = [];
  isLoading = false;
  allEvents: CalendarEvent[] = [];
  holidays: CalendarEvent[] = [];
  currentBranch: any = null;

  // Complete Moon phases for 2026
  moonPhases: MoonPhase[] = [
    // January 2026
    { date: new Date(2026, 0, 3), phase: 'new', emoji: '🌑', label: 'New Moon' },
    { date: new Date(2026, 0, 10), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 0, 18), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 0, 26), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    // February 2026
    { date: new Date(2026, 1, 1), phase: 'new', emoji: '🌑', label: 'New Moon' },
    { date: new Date(2026, 1, 9), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 1, 17), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 1, 24), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    // March 2026
    { date: new Date(2026, 2, 3), phase: 'new', emoji: '🌑', label: 'New Moon' },
    { date: new Date(2026, 2, 10), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 2, 18), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 2, 26), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    // April 2026
    { date: new Date(2026, 3, 1), phase: 'new', emoji: '🌑', label: 'New Moon' },
    { date: new Date(2026, 3, 8), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 3, 16), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 3, 24), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    // May 2026
    { date: new Date(2026, 4, 1), phase: 'new', emoji: '🌑', label: 'New Moon' },
    { date: new Date(2026, 4, 8), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 4, 16), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 4, 23), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 4, 30), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // June 2026
    { date: new Date(2026, 5, 6), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 5, 14), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 5, 21), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 5, 29), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // July 2026
    { date: new Date(2026, 6, 6), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 6, 14), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 6, 21), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 6, 28), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // August 2026
    { date: new Date(2026, 7, 5), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 7, 12), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 7, 19), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 7, 27), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // September 2026
    { date: new Date(2026, 8, 4), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 8, 11), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 8, 18), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 8, 25), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // October 2026
    { date: new Date(2026, 9, 3), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 9, 11), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 9, 17), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 9, 24), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // November 2026
    { date: new Date(2026, 10, 2), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 10, 10), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 10, 16), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 10, 23), phase: 'new', emoji: '🌑', label: 'New Moon' },
    // December 2026
    { date: new Date(2026, 11, 1), phase: 'first_quarter', emoji: '🌓', label: 'First Quarter' },
    { date: new Date(2026, 11, 9), phase: 'full', emoji: '🌕', label: 'Full Moon' },
    { date: new Date(2026, 11, 16), phase: 'last_quarter', emoji: '🌗', label: 'Last Quarter' },
    { date: new Date(2026, 11, 23), phase: 'new', emoji: '🌑', label: 'New Moon' },
  ];

  // Philippine Legal Holidays 2026
  legalHolidays = [
    { date: new Date(2026, 0, 1), title: 'New Year\'s Day' },
    { date: new Date(2026, 3, 9), title: 'Araw ng Kagitingan' },
    { date: new Date(2026, 3, 10), title: 'Maundy Thursday' },
    { date: new Date(2026, 3, 11), title: 'Good Friday' },
    { date: new Date(2026, 4, 1), title: 'Labor Day' },
    { date: new Date(2026, 5, 12), title: 'Independence Day' },
    { date: new Date(2026, 5, 30), title: 'Eid\'l Adha' },
    { date: new Date(2026, 7, 21), title: 'Ninoy Aquino Day' },
    { date: new Date(2026, 7, 31), title: 'National Heroes Day' },
    { date: new Date(2026, 10, 2), title: 'All Saints\' Day' },
    { date: new Date(2026, 10, 30), title: 'Bonifacio Day' },
    { date: new Date(2026, 11, 8), title: 'Feast of Immaculate Conception' },
    { date: new Date(2026, 11, 25), title: 'Christmas Day' },
    { date: new Date(2026, 11, 30), title: 'Rizal Day' },
  ];

  // Dragging properties
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  modalPosition = { x: 0, y: 0 };
  private dragTarget: HTMLElement | null = null;

  private eventColors = {
    ticket: '#3b82f6',
    job_order: '#22c55e',
    requisition: '#f59e0b',
    leave: '#8b5cf6',
    holiday: '#ef4444',
    moon_phase: '#6366f1'
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    this.updateMonthNames();
    this.selectedDate = new Date(this.currentDate);
    this.loadBranchInfo();
    this.loadEvents();
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  // ─── BRANCH INFO ───

  loadBranchInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const branchId = currentUser.branch_id;
    
    if (branchId) {
      this.http.get<any[]>(`${environment.apiUrl}/api/public/branches`).subscribe({
        next: (branches) => {
          const found = branches.find((b: any) => b.id === Number(branchId));
          if (found) {
            this.currentBranch = found;
          }
        },
        error: () => {
          this.currentBranch = { name: 'Branch', company_name: '' };
        }
      });
    } else {
      this.currentBranch = { name: 'Branch', company_name: '' };
    }
  }

  // ─── MONTH NAMES ───

  updateMonthNames() {
    this.currentMonthName = new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' });
    
    const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
    const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
    this.previousMonthName = new Date(prevYear, prevMonth).toLocaleString('default', { month: 'short' });
    this.previousMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
    const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
    this.nextMonthName = new Date(nextYear, nextMonth).toLocaleString('default', { month: 'short' });
    this.nextMonthDays = new Date(nextYear, nextMonth + 1, 0).getDate();
  }

  // ─── DRAGGING METHODS ───

  onHeaderMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStartX = event.clientX - this.modalPosition.x;
    this.dragStartY = event.clientY - this.modalPosition.y;
    this.dragTarget = event.currentTarget as HTMLElement;
    this.dragTarget.style.cursor = 'grabbing';
    event.preventDefault();

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.nav-btn') || target.closest('.close-btn') || target.closest('.event-item') ||
        target.closest('.bottom-left') || target.closest('.bottom-right')) {
      return;
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.modalPosition.x = event.clientX - this.dragStartX;
    this.modalPosition.y = event.clientY - this.dragStartY;
  }

  onMouseUp() {
    if (this.isDragging && this.dragTarget) {
      this.dragTarget.style.cursor = 'grab';
    }
    this.isDragging = false;
    this.dragTarget = null;
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  // ─── CALENDAR METHODS ───

  loadEvents() {
    this.isLoading = true;
    this.allEvents = [];
    this.holidays = [];
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Add moon phases
    this.moonPhases.forEach(mp => {
      this.allEvents.push({
        id: Date.now() + Math.random(),
        title: mp.label,
        description: mp.phase,
        startDate: mp.date.toISOString(),
        endDate: mp.date.toISOString(),
        type: 'moon_phase' as const,
        color: this.eventColors.moon_phase
      });
    });

    // Add legal holidays for the current month
    this.legalHolidays.forEach(holiday => {
      const holidayMonth = holiday.date.getMonth();
      if (holidayMonth === this.currentMonth) {
        this.holidays.push({
          id: Date.now() + Math.random(),
          title: holiday.title,
          description: 'Legal Holiday',
          startDate: holiday.date.toISOString(),
          endDate: holiday.date.toISOString(),
          type: 'holiday' as const,
          color: this.eventColors.holiday
        });
      }
      // Add to all events
      this.allEvents.push({
        id: Date.now() + Math.random(),
        title: holiday.title,
        description: 'Legal Holiday',
        startDate: holiday.date.toISOString(),
        endDate: holiday.date.toISOString(),
        type: 'holiday' as const,
        color: this.eventColors.holiday
      });
    });

    // Fetch tickets
    this.http.get<any[]>(`${environment.apiUrl}/api/tickets/my`, { headers }).subscribe({
      next: (tickets) => {
        const ticketEvents = tickets.map(t => ({
          id: t.id,
          title: t.title || 'Ticket',
          description: t.description,
          startDate: t.created_at,
          endDate: t.created_at,
          type: 'ticket' as const,
          status: t.status,
          ticketNumber: t.ticket_number,
          color: this.eventColors.ticket
        }));
        this.allEvents.push(...ticketEvents);

        // Fetch job orders
        this.http.get<any[]>(`${environment.apiUrl}/api/job-orders/my`, { headers }).subscribe({
          next: (jobOrders) => {
            const jobEvents = jobOrders.map(j => ({
              id: j.id,
              title: j.job_order_for || 'Job Order',
              description: j.particulars,
              startDate: j.date,
              endDate: j.date,
              type: 'job_order' as const,
              status: j.status,
              jobOrderNumber: j.job_order_number,
              color: this.eventColors.job_order
            }));
            this.allEvents.push(...jobEvents);

            // Fetch requisitions
            this.http.get<any[]>(`${environment.apiUrl}/api/requisitions/my`, { headers }).subscribe({
              next: (requisitions) => {
                const reqEvents = requisitions.map(r => ({
                  id: r.id,
                  title: r.particulars || 'Requisition',
                  description: r.remarks,
                  startDate: r.date,
                  endDate: r.date,
                  type: 'requisition' as const,
                  status: r.status,
                  requisitionNumber: r.requisition_number,
                  color: this.eventColors.requisition
                }));
                this.allEvents.push(...reqEvents);

                // Load leave entries
                this.loadLeaveEntries();

                // Build calendar
                this.buildCalendar();
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
                this.buildCalendar();
              }
            });
          },
          error: () => {
            this.isLoading = false;
            this.buildCalendar();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.buildCalendar();
      }
    });
  }

  loadLeaveEntries() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.leaveEntries) {
      try {
        const leaves = JSON.parse(currentUser.leaveEntries);
        if (Array.isArray(leaves) && leaves.length > 0) {
          const leaveEvents = leaves
            .filter((l: any) => l.status === 'approved')
            .map((l: any) => ({
              id: Date.now() + Math.random(),
              title: l.reason || 'Leave',
              description: l.reason || 'Approved leave',
              startDate: l.date,
              endDate: l.date,
              type: 'leave' as const,
              status: 'approved',
              color: this.eventColors.leave
            }));
          this.allEvents.push(...leaveEvents);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  buildCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    // For Sunday-first layout, use getDay() directly (Sunday = 0)
    let startDayOfWeek = firstDay.getDay();
    
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.calendarDays = [];

    // Previous month days to fill first row
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(this.currentYear, this.currentMonth - 1, prevMonthLastDay - i);
        date.setHours(0, 0, 0, 0);
        this.calendarDays.push({
            date: date,
            dayNumber: prevMonthLastDay - i,
            isToday: false,
            isWeekend: false,
            isCurrentMonth: false,
            events: [],
            moonPhase: null,
            holidayName: null
        });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      date.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayEvents = this.allEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === date.getTime();
      });

      const moonPhase = this.moonPhases.find(mp => {
        const mpDate = new Date(mp.date);
        mpDate.setHours(0, 0, 0, 0);
        return mpDate.getTime() === date.getTime();
      });

      const holiday = this.legalHolidays.find(h => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === date.getTime();
      });

      this.calendarDays.push({
        date: date,
        dayNumber: day,
        isToday: isToday,
        isWeekend: isWeekend,
        isCurrentMonth: true,
        events: dayEvents,
        moonPhase: moonPhase ? { ...moonPhase } : null,
        holidayName: holiday ? holiday.title : null
      });
    }

    // Fill remaining days with next month
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      date.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        date: date,
        dayNumber: day,
        isToday: false,
        isWeekend: false,
        isCurrentMonth: false,
        events: [],
        moonPhase: null,
        holidayName: null
      });
    }

    if (!this.selectedDate) {
      this.selectedDate = new Date(today);
      this.selectDayByDate(today);
    } else {
      this.selectDayByDate(this.selectedDate);
    }
  }

  selectDay(day: any) {
    if (!day.date) return;
    this.selectedDate = day.date;
    this.selectDayByDate(day.date);
  }

  selectDayByDate(date: Date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    this.selectedDayEvents = this.allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === targetDate.getTime();
    });
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.updateMonthNames();
    this.buildCalendar();
    this.loadEvents();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.updateMonthNames();
    this.buildCalendar();
    this.loadEvents();
  }

  today() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.updateMonthNames();
    this.selectedDate = new Date(today);
    this.buildCalendar();
  }

  navigateToEvent(event: CalendarEvent) {
    if (event.type === 'ticket' && event.id) {
      this.router.navigate(['/client/tickets', event.id]);
      this.close.emit();
    } else if (event.type === 'job_order' && event.id) {
      this.router.navigate(['/client/job-orders'], { queryParams: { id: event.id } });
      this.close.emit();
    } else if (event.type === 'requisition' && event.id) {
      this.router.navigate(['/client/request']);
      this.close.emit();
    } else {
      this.close.emit();
    }
  }
}