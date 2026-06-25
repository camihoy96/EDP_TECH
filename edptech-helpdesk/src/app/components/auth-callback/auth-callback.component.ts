// D:\EDP_TECH\edptech-helpdesk\src\app\components\auth-callback\auth-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#080c12;color:white;font-family:sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">✅</div>
        <h2>Login Successful!</h2>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userStr = params['user'];
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Save to localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          // Redirect based on role
          setTimeout(() => {
            if (user.role === 'user' || user.user_table === 'new_user') {
              this.router.navigate(['/client/dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 1500);
        } catch (e) {
          console.error('Failed to parse user data:', e);
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}