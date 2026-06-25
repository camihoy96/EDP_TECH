import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
export interface User {
  id: number;
  username: string;
  fullname: string;
  role: string;
  department: string;
  email: string;
  avatar_color: string;
  photo_url?: string;
  birthdate?: string;
  workDays?: string;
  dayOff?: string;
  workStart?: string;
  workEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
  user_table?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
     private notificationService: NotificationService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

 login(username: string, password: string): Observable<any> {
  console.log('🔐 AuthService - Calling backend login API for:', username);
  
  return this.http.post(`${this.apiUrl}/auth/login`, { username, password }).pipe(
    tap((response: any) => {
      console.log('✅ AuthService - Backend login response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.token && this.isBrowser) {
        console.log('💾 AuthService - Saving to localStorage:');
        console.log('   token:', response.token.substring(0, 20) + '...');
        console.log('   user:', JSON.stringify(response.user, null, 2));
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        // ✅ MOVE THIS HERE - inside the success block
        this.notificationService.updateCurrentUser(response.user.id, response.user.fullname);
        
        console.log('✅ AuthService - User saved and BehaviorSubject updated');
      } else {
        console.error('❌ AuthService - Invalid response structure:', response);
      }
    }),
    catchError((error) => {
      console.error('❌ AuthService - Backend login error:', error);
      console.error('   Status:', error.status);
      console.error('   Message:', error.error?.message);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      return throwError(() => error);
    })
  );
}
  signup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/client')) {
      this.router.navigate(['/client/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    if (this.isBrowser) {
      return !!this.getToken();
    }
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string | string[]): boolean {
  const user = this.getCurrentUser();
  if (!user) return false;
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}
  
  isClient(): boolean {
  const user = this.getCurrentUser();
  return user?.role === 'user';
}

isAdminOrTechnician(): boolean {
  const user = this.getCurrentUser();
  return user?.role === 'admin' || user?.role === 'Technician';
}

// Keep this for backward compatibility if needed
isAdminOrAgent(): boolean {
  const user = this.getCurrentUser();
  return user?.role === 'admin' || user?.role === 'Technician';
}

canAccessDashboard(): boolean {
  const user = this.getCurrentUser();
  if (!user) return false;
  return ['admin', 'Technician'].includes(user.role);
}

  // Add this method to auth.service.ts
validateKey(key: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/validate-key`, { key_code: key });
}
}