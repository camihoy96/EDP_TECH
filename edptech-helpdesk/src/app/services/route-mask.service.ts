import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RouteMaskService {
  private isActive = false;
  private isInitialLoad = true;
  private navigationInProgress = false;
  private currentRealPath = '/client/dashboard';
  private defaultRoute = '/client/dashboard'; // ✅ Add a default route

  constructor(
    private router: Router,
    private location: Location
  ) {}

  activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.isInitialLoad = true;
    
    // ✅ Get the current URL or use default
    const currentUrl = this.router.url;
    this.currentRealPath = (currentUrl && currentUrl !== '/' && currentUrl !== '') 
      ? currentUrl 
      : this.defaultRoute;
    
    // ✅ Only mask if we're not already on the login page
    if (!currentUrl.includes('/login')) {
      this.maskRouteWithParam(this.currentRealPath);
    }
    
    setTimeout(() => {
      this.setupRouteMasking();
    }, 100);
  }

  deactivate(): void {
    this.isActive = false;
    // ✅ Restore the actual path
    if (this.currentRealPath && this.currentRealPath !== '/login') {
      this.location.replaceState(this.currentRealPath);
    }
  }

  private maskRouteWithParam(realPath: string): void {
    // Don't mask if it's the login page
    if (realPath === '/login' || realPath.includes('/login')) {
      return;
    }
    
    // Store the real path in a query parameter
    const maskedPath = '/';
    const currentUrl = new URL(window.location.href);
    currentUrl.pathname = maskedPath;
    currentUrl.searchParams.set('_path', encodeURIComponent(realPath));
    
    // Update the URL without triggering navigation
    window.history.replaceState({}, '', currentUrl.toString());
  }

  private setupRouteMasking(): void {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (!this.isActive) return;
      
      // ✅ Skip masking for login page
      if (event.url === '/login' || event.urlAfterRedirects === '/login') {
        return;
      }

      // ✅ Skip masking for edit/new routes
      if (event.url.includes('/edit') || event.url.includes('/new')) {
        return;
      }

      // ✅ Handle root path specially
      if (event.url === '/' || event.url === '') {
        this.currentRealPath = this.defaultRoute;
        this.router.navigateByUrl(this.defaultRoute, { replaceUrl: true });
        return;
      }

      this.currentRealPath = event.url;

      if (this.isInitialLoad) {
        this.isInitialLoad = false;
        return;
      }

      if (!this.navigationInProgress) {
        setTimeout(() => {
          this.maskRouteWithParam(this.currentRealPath);
        }, 50);
      }
    });
  }

  navigateTo(route: string, queryParams?: any): void {
    this.navigationInProgress = true;
    
    // ✅ Don't mask navigation to login
    if (route === '/login') {
      this.router.navigate([route], { queryParams });
      this.navigationInProgress = false;
      return;
    }
    
    this.router.navigate([route], { 
      queryParams,
      skipLocationChange: false
    }).then(() => {
      if (this.isActive) {
        this.currentRealPath = this.router.url;
        setTimeout(() => {
          this.maskRouteWithParam(this.currentRealPath);
          this.navigationInProgress = false;
        }, 100);
      }
    });
  }

  getRealPath(): string {
    // ✅ Try to get the real path from the URL param on page load
    const urlParams = new URLSearchParams(window.location.search);
    const storedPath = urlParams.get('_path');
    if (storedPath) {
      this.currentRealPath = decodeURIComponent(storedPath);
    }
    return this.currentRealPath;
  }

  isRouteMaskingActive(): boolean {
    return this.isActive;
  }
}