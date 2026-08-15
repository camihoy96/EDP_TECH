import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    
    const allowedTable = route.data?.['allowedTable'];
    
    // ✅ If no specific table restriction, allow access
    if (!allowedTable) {
      console.log('✅ No table restriction, allowing access');
      return true;
    }
    
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      console.warn('⚠️ No user found, redirecting to login');
      return this.router.createUrlTree(['/login']);
    }
    
    // ✅ Check which table the user belongs to
    // Users from 'users' table have 'id' and 'username' (admin/IT)
    // Users from 'new_user' table have 'id' and 'username' (client)
    const userTable = currentUser.user_table ? currentUser.user_table : 
                     (currentUser.department ? 'users' : 'new_user');
    
    console.log(`🔍 User table: ${userTable}, Required: ${allowedTable}`);
    
    // ✅ Allow access based on table
    if (userTable === allowedTable) {
      console.log('✅ Table matches, allowing access');
      // Activate route masking for allowed access
      return true;
    }
    
    // ❌ Table mismatch - redirect to appropriate dashboard
    console.warn('❌ Table mismatch, redirecting');
    
    if (allowedTable === 'new_user') {
      // If trying to access admin route, redirect to client dashboard
      return this.router.createUrlTree(['/client/dashboard']);
    } else if (allowedTable === 'users') {
      // If trying to access client route, redirect to admin dashboard
      return this.router.createUrlTree(['/dashboard']);
    }
    
    // Fallback to login
    return this.router.createUrlTree(['/login']);
  }
}