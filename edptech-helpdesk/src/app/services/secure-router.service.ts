import { Injectable } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SecureRouterService {
  
  // ✅ FIX: Use 'as const' and type properly
  private readonly PUBLIC_CODES: { [key: string]: string } = {
    'dashboard': '/client/dashboard',
    'tickets': '/client/tickets',
    'tickets-new': '/client/tickets/new',
    'profile': '/client/profile',
    'job-orders': '/client/job-orders',
    'job-orders-new': '/client/job-orders/new',
    'requests': '/client/request',
    'requests-new': '/client/request/new',
    'knowledge': '/client/knowledge-base',
    'contact': '/client/contact',
    'sla': '/client/sla-info',
    'about': '/client/about',
    'shortcuts': '/client/shortcuts',
    'features': '/client/features',
    'announcements': '/client/announcements',
    'department-stats': '/client/department-stats',
    'system-status': '/client/system-status',
    'faq': '/client/faq',
    'feedback': '/client/feedback',
    'chat': '/client/chat',
    'calendar': '/client/calendar',
    'admin-dashboard': '/dashboard',
    'admin-users': '/admin/users-management',
    'admin-settings': '/admin/settings',
    'admin-reports': '/admin/reports',
  };

  constructor(
    private router: Router,
    private location: Location
  ) {
    // Listen for navigation and mask URL
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (!event.url.includes('/login') && !event.url.includes('/signup')) {
        setTimeout(() => {
          this.location.replaceState('/login');
        }, 50);
      }
    });
  }

  navigate(code: string, params?: any): void {
    // ✅ FIX: Safe index access
    const route = this.PUBLIC_CODES[code] || this.PUBLIC_CODES['dashboard'];
    
    if (!this.PUBLIC_CODES[code]) {
      console.warn(`⚠️ Unknown route code: ${code}, using dashboard`);
    }
    
    const queryParams = params || {};
    let finalRoute = route;
    
    if (params?.id) {
      finalRoute = `${route}/${params.id}`;
      delete queryParams.id;
    }
    if (params?.action === 'new') {
      finalRoute = `${route}/new`;
      delete queryParams.action;
    }
    
    console.log(`🔒 Secure navigate: "${code}" → "${finalRoute}"`);
    
    this.router.navigate([finalRoute], { 
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
    }).then(() => {
      setTimeout(() => {
        this.location.replaceState('/login');
      }, 50);
    });
  }

  getCurrentCode(): string {
    const url = this.router.url;
    for (const code of Object.keys(this.PUBLIC_CODES)) {
      const route = this.PUBLIC_CODES[code];
      if (route && route.length > 1 && url.startsWith(route)) {
        return code;
      }
    }
    return 'dashboard';
  }

  navigateToRoute(route: string, queryParams?: any): void {
    this.router.navigate([route], { queryParams }).then(() => {
      if (route !== '/login' && route !== '/signup') {
        setTimeout(() => {
          this.location.replaceState('/login');
        }, 50);
      }
    });
  }
}