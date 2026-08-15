import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    
    console.log('🛡️ AuthGuard - Checking access for:', state.url);
    
    // ✅ Allow login page
    if (state.url.includes('/login')) {
      return true;
    }
    
    // ✅ Allow signup and auth callback
    if (state.url.includes('/signup') || state.url.includes('/auth/callback')) {
      return true;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    console.log('   Token exists:', !!token);
    console.log('   User exists:', !!userStr);
    
    // ✅ No token = redirect to login
    if (!token || !userStr) {
      console.warn('⚠️ No session found');
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url, reason: 'no_session' }
      });
    }
    
    // ✅ Quick client-side expiry check
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('⚠️ Token expired');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
        return this.router.createUrlTree(['/login'], {
          queryParams: { reason: 'token_expired' }
        });
      }
      
      // ✅ Token looks valid - ALLOW ACCESS
      console.log('✅ Token valid, allowing access');
      return true;
      
    } catch (e) {
      console.error('❌ Token parse error:', e);
      return this.router.createUrlTree(['/login'], {
        queryParams: { reason: 'invalid_token' }
      });
    }
  }
}