import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {

  private apiUrl = 'http://34.170.236.64:8081/api/auth/logout';

  constructor(private router: Router, private http: HttpClient) { }

  logout(): void {
    const token = localStorage.getItem('jwtToken');

    let params = new HttpParams();
    if (token) {
      params = params.set('token', token);
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    this.http.get(this.apiUrl, { params, headers, responseType: 'text' }).pipe(
      catchError((error) => {
        console.error('Backend logout error:', error);
        return throwError(() => new Error(error));
      })
    )
    .subscribe(() => {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('username');
      localStorage.removeItem('chatHistory');
      this.router.navigate(['/']);
    });
  }
}