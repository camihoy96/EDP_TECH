import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-detail">
      <h2>Ticket Details</h2>
      <div *ngIf="ticket">
        <p><strong>Number:</strong> {{ ticket.number }}</p>
        <p><strong>Title:</strong> {{ ticket.title }}</p>
        <p><strong>Status:</strong> {{ ticket.status }}</p>
        <p><strong>Priority:</strong> {{ ticket.priority }}</p>
        <button (click)="goBack()">Back</button>
      </div>
    </div>
  `,
  styles: [`
    .ticket-detail { padding: 20px; }
    button { margin-top: 16px; padding: 8px 16px; }
  `]
})
export class TicketDetailComponent implements OnInit {
  ticket: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    // Load ticket details here
  }

  goBack() {
    this.router.navigate(['/tickets']);
  }
}