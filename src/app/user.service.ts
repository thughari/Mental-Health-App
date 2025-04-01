import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define Frontend Interfaces (align with Backend DTOs)
interface UserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface UserUpdateDTO {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8081/api/user'; // Define root URL

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'  // Explicitly set Content-Type
    });
  }

  getUserProfile(): Observable<UserDTO> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserDTO>(`${this.apiUrl}/get`, { headers });
  }

  updateUserProfile(username: string, userUpdateDTO: UserUpdateDTO): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/profile/${username}`, userUpdateDTO, { headers });
  }
   httpget(url: string, headers: HttpHeaders): Observable<any>{
        return this.http.get(url, { headers })
    }

     httpput(url: string, payload : any , headers: HttpHeaders): Observable<any>{
          return this.http.put(url, payload ,{ headers });
      }
}