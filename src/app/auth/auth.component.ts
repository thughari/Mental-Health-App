import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

export interface LoginResponse {
    jwtToken: string;
    user: any;
}

interface AuthData {
    username?: string;        // Username for registration & actual user identifier
    email?: string;           // Email for registration only
    password?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
}

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
    authForm: FormGroup;
    isLoginMode = true;
    isLoading = false;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private http: HttpClient
    ) {
        this.authForm = this.fb.group({
            username: [''],                             // Username for registration & user identifier
            email: [''],                                // Email for registration only
            password: ['', Validators.required],
            firstName: [''],
            lastName: [''],
            confirmPassword: ['']
        }, {
            validators: this.passwordMatchValidator.bind(this)
        });
    }

    ngOnInit(): void {
        this.toggleMode();
    }

    toggleMode(): void {
        this.isLoginMode = !this.isLoginMode;
        this.authForm.reset();

        // Username (For Registration AND the actual username)
        const usernameControl = this.authForm.get('username');
        if (usernameControl) {
            usernameControl.clearValidators();
            if (!this.isLoginMode) {
                usernameControl.addValidators(Validators.required);
            }
            usernameControl.updateValueAndValidity();
        }

        // Email
        const emailControl = this.authForm.get('email');
        if (emailControl) {
            emailControl.clearValidators();
            if (!this.isLoginMode) {
                emailControl.addValidators([Validators.required, Validators.email]);
            }
            emailControl.updateValueAndValidity();
        }

        // Password
        const passwordControl = this.authForm.get('password');
        if (passwordControl) {
            passwordControl.clearValidators();
            passwordControl.addValidators(Validators.required);
            if (!this.isLoginMode) {
                passwordControl.addValidators(Validators.minLength(6));
            }
            passwordControl.updateValueAndValidity();
        }

        // Registration fields (First Name, Last Name, Confirm Password)
        if (this.isLoginMode) {
            this.authForm.get('firstName')?.clearValidators();
            this.authForm.get('lastName')?.clearValidators();
            this.authForm.get('confirmPassword')?.clearValidators();
        } else {
            this.authForm.get('firstName')?.setValidators([Validators.required]);
            this.authForm.get('lastName')?.setValidators([Validators.required]);
            this.authForm.get('confirmPassword')?.setValidators([Validators.required]);
        }

        this.authForm.get('firstName')?.updateValueAndValidity();
        this.authForm.get('lastName')?.updateValueAndValidity();
        this.authForm.get('confirmPassword')?.updateValueAndValidity();

        this.authForm.get('firstName')?.setValue('');
        this.authForm.get('lastName')?.setValue('');
        this.authForm.get('confirmPassword')?.setValue('');
        this.authForm.get('username')?.setValue('');
        this.authForm.get('email')?.setValue('');
    }

    passwordMatchValidator(formGroup: FormGroup) {
        if (this.isLoginMode) {
            return null;
        }
        const password = formGroup.get('password')?.value;
        const confirmPassword = formGroup.get('confirmPassword')?.value;
        if (password !== confirmPassword) {
            formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        } else {
            formGroup.get('confirmPassword')?.setErrors(null);
        }
        return null;
    }


    onSubmit(): void {
      if (this.authForm.valid) {
          this.isLoading = true;

          let authData: AuthData;

          let apiUrl = 'http://localhost:8081/api/auth/login';

          if (this.isLoginMode) {
              // Login: use username and password
              authData = {
                  username: this.authForm.value.username,
                  password: this.authForm.value.password
              };
          } else {
              // Registration: use all registration fields
              apiUrl = 'http://localhost:8081/api/auth/register';
              authData = {
                  username: this.authForm.value.username,
                  email: this.authForm.value.email,
                  password: this.authForm.value.password,
                  firstName: this.authForm.value.firstName,
                  lastName: this.authForm.value.lastName,
                  confirmPassword: this.authForm.value.confirmPassword
              };
          }

          this.http.post<LoginResponse>(apiUrl, authData)
              .subscribe(
                  (response: LoginResponse) => { // Cast the response to 'any' or create a specific interface
                      this.isLoading = false;

                      if (this.isLoginMode) {
                        const jwtToken = response.jwtToken;
                        const user = response.user;
                        if (jwtToken) {
                        localStorage.setItem('jwtToken', jwtToken);
                        localStorage.setItem('username', JSON.stringify(user.username));
                        console.log(user);

                        this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
                        } else {
                        this.snackBar.open('Login failed: JWT token not received', 'Close', { duration: 5000 });
                        }
                      } else {
                          this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
                      }
                      this.router.navigate(['/dashboard']);
                  },
                  (error) => {
                      this.isLoading = false;
                      console.error('Authentication error:', error);
                      this.snackBar.open(error.error.message || (this.isLoginMode ? 'Login failed' : 'Registration failed'), 'Close', { duration: 5000 });
                  }
              );
      }
  }

    togglePasswordVisibility() {
        this.hidePassword = !this.hidePassword;
    }

    onPasswordBlur() {
        const password = this.authForm.get('password')?.value;
        const confirmPasswordControl = this.authForm.get('confirmPassword');
        const confirmPassword = confirmPasswordControl?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            confirmPasswordControl.setValue(password);
            confirmPasswordControl.updateValueAndValidity();
        }
    }
}