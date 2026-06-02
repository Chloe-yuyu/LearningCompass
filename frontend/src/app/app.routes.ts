import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Upload } from './pages/upload/upload';
import { Profile } from './pages/profile/profile';
import { Materials } from './pages/materials/materials';

const authGuard = () => {
  const router = inject(Router);
  const email = localStorage.getItem('user_email');
  if (!email) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'upload', component: Upload, canActivate: [authGuard] },
  { path: 'materials', component: Materials, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] }
];
