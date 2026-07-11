import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-client-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="feedback-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>💬 Submit Feedback</h2>
          <p>We value your opinion! Help us improve the helpdesk system.</p>
        </div>
      </div>

      <!-- Success State -->
      <div class="success-card" *ngIf="submitted">
        <div class="success-icon">✅</div>
        <h3>Thank You for Your Feedback!</h3>
        <p>Your feedback has been submitted successfully. We appreciate your input and will use it to improve our services.</p>
        <div class="success-actions">
          <button class="btn-secondary" (click)="resetForm()">Submit Another</button>
          <a routerLink="/client/dashboard" class="btn-primary">Back to Dashboard</a>
        </div>
      </div>

      <!-- Feedback Form -->
      <div class="feedback-form" *ngIf="!submitted">
        <!-- Rating Section -->
        <div class="form-card">
          <h3>⭐ Overall Rating</h3>
          <p>How would you rate your experience with the helpdesk system?</p>
          <div class="rating-stars">
            <span 
              *ngFor="let star of stars; let i = index"
              class="star" 
              [class.active]="i < feedback.rating"
              (click)="setRating(i + 1)"
              (mouseenter)="hoverRating = i + 1"
              (mouseleave)="hoverRating = 0">
              {{ (hoverRating || feedback.rating) > i ? '⭐' : '☆' }}
            </span>
          </div>
          <div class="rating-label" *ngIf="feedback.rating > 0">
            {{ ratingLabels[feedback.rating - 1] }}
          </div>
        </div>

        <!-- Category -->
        <div class="form-card">
          <h3>📂 Feedback Category</h3>
          <div class="category-grid">
            <div 
              class="category-item" 
              *ngFor="let cat of categories"
              [class.selected]="feedback.category === cat.value"
              (click)="feedback.category = cat.value">
              <span class="category-icon">{{ cat.icon }}</span>
              <span class="category-label">{{ cat.label }}</span>
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="form-card">
          <h3>✏️ Subject</h3>
          <input 
            type="text" 
            [(ngModel)]="feedback.subject" 
            placeholder="Brief summary of your feedback"
            class="form-input"
            maxlength="150"
          />
        </div>

        <!-- Message -->
        <div class="form-card">
          <h3>💭 Your Feedback</h3>
          <textarea 
            [(ngModel)]="feedback.message" 
            placeholder="Tell us what you think... What's working well? What could be improved? Any features you'd like to see?"
            class="form-textarea"
            rows="5"
            maxlength="2000"
          ></textarea>
          <div class="char-count">{{ feedback.message.length }}/2000</div>
        </div>

        <!-- Quick Feedback Options -->
        <div class="form-card">
          <h3>👍 What do you like most?</h3>
          <div class="tag-grid">
            <span 
              *ngFor="let tag of likeTags"
              class="tag" 
              [class.selected]="feedback.likes.includes(tag)"
              (click)="toggleTag('likes', tag)">
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="form-card">
          <h3>🔧 What needs improvement?</h3>
          <div class="tag-grid">
            <span 
              *ngFor="let tag of improveTags"
              class="tag" 
              [class.selected]="feedback.improvements.includes(tag)"
              (click)="toggleTag('improvements', tag)">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Contact Permission -->
        <div class="form-card">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="feedback.contactOk" />
            <span>It's okay to contact me about this feedback if needed</span>
          </label>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="error">
          ⚠️ {{ error }}
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button 
            class="btn-submit" 
            (click)="submitFeedback()"
            [disabled]="isSubmitting || !isValid()">
            {{ isSubmitting ? 'Submitting...' : '📤 Submit Feedback' }}
          </button>
          <button class="btn-cancel" (click)="resetForm()">Reset</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-container {
      padding: 20px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
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

    .back-link {
      color: #0a246a;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    /* Success Card */
    .success-card {
      text-align: center;
      background: white;
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 40px 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .success-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }

    .success-card h3 {
      color: #166534;
      margin: 0 0 8px 0;
      font-size: 20px;
    }

    .success-card p {
      color: #555;
      font-size: 13px;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }

    .success-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-secondary {
      background: #f0f0f0;
      border: 1px solid #d0d0d0;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-primary {
      background: #0a246a;
      color: white;
      padding: 10px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: #0d2f8a;
    }

    /* Form Cards */
    .form-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .form-card h3 {
      color: #0f172a;
      margin: 0 0 8px 0;
      font-size: 14px;
    }

    .form-card p {
      color: #888;
      font-size: 12px;
      margin: 0 0 12px 0;
    }

    /* Rating Stars */
    .rating-stars {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 8px;
    }

    .star {
      font-size: 36px;
      cursor: pointer;
      transition: transform 0.15s;
      user-select: none;
    }

    .star:hover {
      transform: scale(1.15);
    }

    .star.active {
      animation: pop 0.2s ease;
    }

    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .rating-label {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #0a246a;
    }

    /* Category Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .category-item:hover {
      border-color: #b0b0b0;
      background: #fafafa;
    }

    .category-item.selected {
      border-color: #0a246a;
      background: #f0f4ff;
    }

    .category-icon {
      font-size: 24px;
    }

    .category-label {
      font-size: 11px;
      font-weight: 600;
      color: #555;
      text-align: center;
    }

    /* Form Inputs */
    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10, 36, 106, 0.1);
    }

    .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
      resize: vertical;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-textarea:focus {
      border-color: #0a246a;
      box-shadow: 0 0 0 2px rgba(10, 36, 106, 0.1);
    }

    .char-count {
      text-align: right;
      font-size: 11px;
      color: #aaa;
      margin-top: 4px;
    }

    /* Tags */
    .tag-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      padding: 8px 16px;
      border: 1px solid #d0d0d0;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }

    .tag:hover {
      border-color: #b0b0b0;
      background: #f8f8f8;
    }

    .tag.selected {
      background: #0a246a;
      color: white;
      border-color: #0a246a;
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #555;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    /* Error */
    .error-message {
      background: #fff5f5;
      color: #cc0000;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
      border: 1px solid #fcc;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-submit {
      background: #0a246a;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      background: #0d2f8a;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: #f0f0f0;
      border: 1px solid #d0d0d0;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    @media (max-width: 500px) {
      .category-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .rating-stars .star {
        font-size: 28px;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn-submit, .btn-cancel {
        width: 100%;
      }
    }
  `]
})
export class ClientFeedbackComponent {
  submitted = false;
  isSubmitting = false;
  error: string | null = null;
  hoverRating = 0;

  feedback = {
    rating: 0,
    category: '',
    subject: '',
    message: '',
    likes: [] as string[],
    improvements: [] as string[],
    contactOk: false
  };

  stars = [1, 2, 3, 4, 5];

  ratingLabels = [
    'Very Dissatisfied 😞',
    'Dissatisfied 😕',
    'Neutral 😐',
    'Satisfied 😊',
    'Very Satisfied 🤩'
  ];

  categories = [
    { value: 'usability', label: 'Usability', icon: '🖱️' },
    { value: 'features', label: 'Features', icon: '⭐' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'support', label: 'Support', icon: '🤝' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'other', label: 'Other', icon: '💡' }
  ];

  likeTags = [
    'Easy to use', 'Fast response', 'Clean design', 
    'Ticket tracking', 'Notifications', 'Mobile friendly',
    'Quick resolution', 'Helpful staff'
  ];

  improveTags = [
    'Loading speed', 'More features', 'Better mobile app',
    'Email notifications', 'Search function', 'User interface',
    'Response time', 'Documentation'
  ];

  constructor(private http: HttpClient, private router: Router) {}

  setRating(rating: number) {
    this.feedback.rating = rating;
  }

  toggleTag(type: 'likes' | 'improvements', tag: string) {
    const arr = this.feedback[type];
    const index = arr.indexOf(tag);
    if (index > -1) {
      arr.splice(index, 1);
    } else {
      arr.push(tag);
    }
  }

  isValid(): boolean {
    return this.feedback.rating > 0 && 
           this.feedback.category !== '' && 
           this.feedback.message.trim().length >= 10;
  }

  submitFeedback() {
    if (!this.isValid() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.error = null;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.post(`${environment.apiUrl}/api/feedback`, this.feedback, { headers })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Error submitting feedback:', err);
          this.error = 'Failed to submit feedback. Please try again.';
          this.isSubmitting = false;
        }
      });
  }

  resetForm() {
    this.feedback = {
      rating: 0,
      category: '',
      subject: '',
      message: '',
      likes: [],
      improvements: [],
      contactOk: false
    };
    this.submitted = false;
    this.error = null;
    this.hoverRating = 0;
  }
}