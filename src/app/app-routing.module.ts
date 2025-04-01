import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { ChatComponent } from './chat/chat.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Default redirection to 'login'
  { path: 'login', component: LoginComponent , canActivate: [AuthGuard]}, // Login page
  { path: 'register', component: RegisterComponent , canActivate: [AuthGuard]}, // Register page
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] }, // Protected route
  { path: '**', redirectTo: 'login' } // Wildcard route to handle undefined paths
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }