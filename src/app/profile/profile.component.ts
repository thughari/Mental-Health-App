import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UserService } from '../user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpClient

// Define Frontend Interfaces
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

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    profileForm: FormGroup;
    isLoading = false;
    isEditing = false;
    userProfile: UserDTO | undefined;
    suggestedRoutine: string | null = null;
    routineLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private userService: UserService,
        private snackBar: MatSnackBar,
        private http: HttpClient,
        private ngZone: NgZone
    ) {
        this.profileForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
             username: ['', Validators.required]
        });
    }

    loadingText: string = "Loading routine from spider server";
dotCount = 0;

    ngOnInit(): void {
        this.loadUserProfile();
        this.animateLoadingText();
    }

    animateLoadingText() {
        setInterval(() => {
          this.dotCount = (this.dotCount + 1) % 4; // Cycles through 0, 1, 2, 3
          this.loadingText = "Loading routine from spider server" + ".".repeat(this.dotCount);
        }, 500);
      }

    loadUserProfile(): void {
        this.isLoading = true;
        this.userService.getUserProfile()
            .pipe(
                catchError(this.handleError)
            )
            .subscribe(
                (profile: UserDTO) => {
                    console.log('Loaded profile:', profile);
                    this.userProfile = profile;
                    this.profileForm.patchValue({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        email: profile.email,
                        username: profile.username
                    });
                    this.isLoading = false;
                },
                (error) => {
                    console.error('Error loading profile:', error);
                    this.isLoading = false;
                }
            );
    }

    enableEditMode(): void {
        this.isEditing = true;
    }

  onSubmit(): void {
        if (this.profileForm.valid) {
            this.isLoading = true;

            const updatedProfile: UserUpdateDTO = {
                firstName: this.profileForm.value.firstName,
                lastName: this.profileForm.value.lastName,
                email: this.profileForm.value.email,
                 username: this.profileForm.value.username
            };

            this.userService.updateUserProfile(updatedProfile.username , updatedProfile)
                .pipe(
                    catchError(this.handleError)
                )
                .subscribe(
                    () => {
                        console.log('Profile updated successfully');
                        this.isEditing = false;
                         localStorage.setItem('user', JSON.stringify({
                            email: this.profileForm.value.email,
                            firstName: this.profileForm.value.firstName,
                            lastName: this.profileForm.value.lastName,
                               username : this.profileForm.value.username
                        }))

                        this.loadUserProfile(); // Refresh the profile
                        this.isLoading = false;
                          this.snackBar.open('Profile Updated Successfully', 'Close', { duration: 3000 });
                          this.router.navigate(['/dashboard']); //To change username
                    },
                    (error) => {
                        console.error('Error updating profile:', error);
                        this.isLoading = false;
                         this.snackBar.open(error.error.message || 'Error at Updating profile, make it again', 'Close', { duration: 5000 });
                    }
                );
            this.isEditing = false;
        }
    }


     generateSuggestedRoutine(): void {
        this.routineLoading = true;
        this.suggestedRoutine = ''; // Clear any existing routine

        const token = localStorage.getItem('jwtToken');
        fetch('http://localhost:8081/api/chat/routine', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'suggest me a routine' })
        }).then(response => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = ''; // Buffer to store incomplete data

            const processStream = (): void => {
                reader?.read().then(({ value, done }) => {
                    if (done) {
                        console.log('Stream completed.');
                        this.ngZone.run(() => {
                            this.routineLoading = false;
                        }); // Stop loading on completion
                        return;
                    }

                    // Decode the chunk and append it to the buffer
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Process complete messages in the buffer
                    let eventSeparatorIndex;
                    while ((eventSeparatorIndex = buffer.indexOf('\n\n')) !== -1) {
                        const message = buffer.substring(0, eventSeparatorIndex).trim();
                        buffer = buffer.substring(eventSeparatorIndex + 2); // Remove processed message from buffer

                        // Process the JSON message
                        if (message.startsWith('data:')) {
                            const jsonData = message.substring(5).trim(); // Remove "data:" prefix
                            try {
                                const json = JSON.parse(jsonData);
                                this.ngZone.run(() => {
                                    this.suggestedRoutine += json.response; // Append the response to the routine
                                });
                            } catch (error) {
                                console.error('Error parsing JSON:', error);
                            }
                        }
                    }

                    processStream(); // Continue reading the stream
                });
            };

            processStream(); // Start the stream
        }).catch(error => {
            console.error('Error during streaming:', error);
            this.routineLoading = false;
        });
    }

    private handleError(error: any) {
        console.error('An error occurred', error);
        return throwError(() => new Error(error)); // Return an observable with a user-facing error message.
    }
}