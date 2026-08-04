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

  constructor(
    private router: Router,
    private location: Location
  ) {}

  activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.isInitialLoad = true;
    this.setupRouteMasking();
  }

  deactivate(): void {
    this.isActive = false;
  }

  private setupRouteMasking(): void {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (!this.isActive) return;
      
      if (event.url === '/login' || event.urlAfterRedirects === '/login') {
        return;
      }

      if (this.isInitialLoad) {
        this.isInitialLoad = false;
        return;
      }

      if (!this.navigationInProgress) {
        setTimeout(() => {
          this.location.replaceState('/login');
        }, 50);
      }
    });
  }

  navigateTo(route: string, queryParams?: any): void {
    this.navigationInProgress = true;
    
    this.router.navigate([route], { 
      queryParams,
      skipLocationChange: false
    }).then(() => {
      if (this.isActive) {
        setTimeout(() => {
          this.location.replaceState('/login');
          this.navigationInProgress = false;
        }, 100);
      }
    });
  }
}