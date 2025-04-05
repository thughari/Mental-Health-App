import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

interface LoginResponse {
    jwtToken: string;
    user: any;
}

interface AuthData {
    username?: string;
    password?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const authData: AuthData = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.http.post<LoginResponse>('http://34.170.236.64:8081/api/auth/login', authData)
        .subscribe(
          (response: LoginResponse) => {
            this.isLoading = false;
            const jwtToken = response.jwtToken;
            const user = response.user;
            if (jwtToken) {
              localStorage.setItem('jwtToken', jwtToken);
              localStorage.setItem('username', JSON.stringify(user.username));

              this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
              this.router.navigate(['/dashboard']);
            } else {
              this.snackBar.open('Login failed: JWT token not received', 'Close', { duration: 5000 });
            }
          },
          (error) => {
            this.isLoading = false;
            console.error('Login error:', error);
            this.snackBar.open(error.error.message || 'Login failed', 'Close', { duration: 5000 });
          }
        );
    }
  }

      togglePasswordVisibility() {
        this.hidePassword = !this.hidePassword;
    }

    onPasswordBlur() {
        const password = this.loginForm.get('password')?.value;
        const confirmPasswordControl = this.loginForm.get('confirmPassword');
        const confirmPassword = confirmPasswordControl?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            confirmPasswordControl.setValue(password);
            confirmPasswordControl.updateValueAndValidity();
        }
    }
}