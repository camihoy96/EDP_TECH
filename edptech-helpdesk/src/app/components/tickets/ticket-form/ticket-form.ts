import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-form">
      <h2>Create New Ticket</h2>
      <form (ngSubmit)="onSubmit()">
        <div>
          <label>Title:</label>
          <input type="text" [(ngModel)]="ticket.title" name="title" required>
        </div>
        <div>
          <label>Description:</label>
          <textarea [(ngModel)]="ticket.description" name="description" rows="5"></textarea>
        </div>
        <div>
          <label>Priority:</label>
          <select [(ngModel)]="ticket.priority" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button type="submit">Submit</button>
        <button type="button" (click)="cancel()">Cancel</button>
      </form>
    </div>
  `,
  styles: [`
    .ticket-form { padding: 20px; max-width: 600px; }
    div { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; }
    input, textarea, select { width: 100%; padding: 8px; }
    button { margin-right: 8px; padding: 8px 16px; }
  `]
})
export class TicketFormComponent {
  ticket = { title: '', description: '', priority: 'medium' };

  constructor(private router: Router) {}

  onSubmit() {
    alert('Ticket submitted!');
    this.router.navigate(['/tickets']);
  }

  cancel() {
    this.router.navigate(['/tickets']);
  }
}