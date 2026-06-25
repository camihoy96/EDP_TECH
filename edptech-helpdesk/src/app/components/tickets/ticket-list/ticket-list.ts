import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ticket-list">
      <h2>All Tickets</h2>
      <button (click)="newTicket()">+ New Ticket</button>
      <table class="tickets-table">
        <thead>
          <tr><th>Number</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let ticket of tickets" (click)="viewTicket(ticket.id)">
            <td>{{ ticket.number }}</td>
            <td>{{ ticket.title }}</td>
            <td>{{ ticket.priority }}</td>
            <td>{{ ticket.status }}</td>
            <td>{{ ticket.created }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .ticket-list { padding: 20px; }
    button { margin-bottom: 16px; padding: 8px 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    tr { cursor: pointer; }
    tr:hover { background: #f5f5f5; }
  `]
})
export class TicketListComponent {
  tickets = [
    { id: 1, number: 'EDP-001', title: 'Email not working', priority: 'High', status: 'Open', created: '2024-01-15' },
    { id: 2, number: 'EDP-002', title: 'Printer offline', priority: 'Medium', status: 'In Progress', created: '2024-01-14' }
  ];

  constructor(private router: Router) {}

  newTicket() {
    this.router.navigate(['/tickets/new']);
  }

  viewTicket(id: number) {
    this.router.navigate(['/tickets', id]);
  }
}