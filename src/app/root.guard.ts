// filepath: src/app/root.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RootGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const isLoggedIn = !!localStorage.getItem('jwtToken'); // Check if the user is logged in

    if (isLoggedIn) {
      this.router.navigate(['/dashboard']); // Redirect to dashboard if logged in
    } else {
      this.router.navigate(['/auth']); // Redirect to login if not logged in
    }

    return false; // Prevent direct access to the root route
  }
}