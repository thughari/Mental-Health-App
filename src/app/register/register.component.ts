import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

interface AuthData {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
}

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    isLoading = false;
    hidePassword = true;
    usernameErrorMessage: string | null = null;  // Store the error message for username

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private http: HttpClient
    ) {
        this.registerForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatchValidator.bind(this)
        });
    }

    ngOnInit(): void {
    }

    passwordMatchValidator(formGroup: FormGroup) {
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
        if (this.registerForm.valid) {
            this.isLoading = true;

            const authData: AuthData = {
                firstName: this.registerForm.value.firstName,
                lastName: this.registerForm.value.lastName,
                username: this.registerForm.value.username,
                email: this.registerForm.value.email,
                password: this.registerForm.value.password,
                confirmPassword: this.registerForm.value.confirmPassword
            };

            this.http.post('https://35.225.18.182/api/auth/register', authData)
                .subscribe(
                    (response) => {
                        this.isLoading = false;
                        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
                        this.router.navigate(['/login']); // Redirect to login after registration
                    },
                    (error) => {
                        this.isLoading = false;
                        console.error('Registration error:', error);
                        this.usernameErrorMessage = null; // Clear any previous error message

                      if (error?.error && typeof error.error === 'string' && error.error.startsWith('User with the username')) {
                          this.registerForm.get('username')?.setErrors({ usernameExists: true });
                          this.usernameErrorMessage = error.error; // Save the full error message
                      } else {
                         this.snackBar.open(error.message || 'Registration failed', 'Close', { duration: 5000 });
                      }
                    }
                );
        }
    }

    togglePasswordVisibility() {
        this.hidePassword = !this.hidePassword;
    }

    onPasswordBlur() {
        const password = this.registerForm.get('password')?.value;
        const confirmPasswordControl = this.registerForm.get('confirmPassword');
        const confirmPassword = confirmPasswordControl?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            confirmPasswordControl.setValue(password);
            confirmPasswordControl.updateValueAndValidity();
        }
    }
}