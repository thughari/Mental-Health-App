import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request)
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401) { // Check for Unauthorized status
                        console.error('JWT expired or invalid - logging out', error);
                        localStorage.removeItem('jwtToken');  // Clear token
                        localStorage.removeItem('user');      // Clear user data
                        this.router.navigate(['/login']);        // Redirect to login
                    }
                    return throwError(() => error);  // Re-throw the error
                })
            );
    }
}