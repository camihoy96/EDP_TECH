import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
  const requiredRole = route.data['role'];
  const user = this.authService.getCurrentUser();

  if (!user) {
    this.router.navigate(['/login']);
    return false;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check if user's exact role is in the required roles
    if (!roles.includes(user.role)) {
      // Redirect based on role
      if (user.role === 'user') {
        this.router.navigate(['/client/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return false;
    }
  }

  return true;
}
}