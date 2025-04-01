import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = !!localStorage.getItem('jwtToken');

    if (!isLoggedIn) {
        if(route.routeConfig?.path == 'login' || route.routeConfig?.path == 'register' ){
            return true;
        }
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // If logged in and trying to access the auth or root route, redirect to the dashboard
    if (route.routeConfig?.path == 'login' || route.routeConfig?.path == 'register') {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true; // Allow access to other routes
  }
}