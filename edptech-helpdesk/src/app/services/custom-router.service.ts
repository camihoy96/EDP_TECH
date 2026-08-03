// src/app/services/custom-router.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationExtras, Event, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomRouterService {
  
  // ✅ Expose Router properties used by components
  get events(): Observable<Event> {
    return this.router.events;
  }
  
  get url(): string {
    return this.router.url;
  }

  constructor(private router: Router) {}

  navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, { 
      ...extras, 
      skipLocationChange: true,
      replaceUrl: true 
    });
  }

  navigateByUrl(url: string, extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigateByUrl(url, { 
      ...extras, 
      skipLocationChange: true, 
      replaceUrl: true 
    });
  }

  // ✅ Expose createUrlTree for guards
  createUrlTree(commands: any[], extras?: NavigationExtras): UrlTree {
    return this.router.createUrlTree(commands, extras);
  }

  serializeUrl(url: UrlTree): string {
    return this.router.serializeUrl(url);
  }
}