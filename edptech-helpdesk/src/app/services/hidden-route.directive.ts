// src/app/directives/hidden-route.directive.ts
import { Directive, Input, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CustomRouterService } from './custom-router.service';

@Directive({
  selector: '[hiddenRoute]',
  standalone: true  // Add this line
})
export class HiddenRouteDirective {
  @Input('hiddenRoute') route: string | string[] = '';

  constructor(private router: CustomRouterService) {}

  @HostListener('click')
  onClick() {
    const commands = Array.isArray(this.route) ? this.route : [this.route];
    this.router.navigate(commands, { skipLocationChange: true, replaceUrl: true });
  }
}