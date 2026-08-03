import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredRole = route.data['role'];
    const allowedTable = route.data['allowedTable'];
    const user = this.authService.getCurrentUser();

    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    // ✅ Use user_table (snake_case) only - that's what the User interface has
    const userTable = (user as any).user_table || 'new_user';

    // ✅ PREVENT cross-side access based on allowedTable
    if (allowedTable === 'users' && userTable !== 'users') {
      console.warn('🚫 Client user attempted to access admin route');
      return this.router.createUrlTree(['/client/dashboard']);
    }
    
    if (allowedTable === 'new_user' && userTable !== 'new_user') {
      console.warn('🚫 Admin user attempted to access client route');
      return this.router.createUrlTree(['/dashboard']);
    }

    // ✅ Check role-based access
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!roles.includes(user.role)) {
        return this.router.createUrlTree([userTable === 'new_user' ? '/client/dashboard' : '/dashboard']);
      }
    }

    return true;
  }
}