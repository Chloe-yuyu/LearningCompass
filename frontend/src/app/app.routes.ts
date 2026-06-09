import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';

const authGuard = () => {
  const router = inject(Router);
  const email = localStorage.getItem('user_email');
  const token = localStorage.getItem('token');

  if (!email || !token) {
    router.navigate(['/login']);
    return false;
  }

  // 修復：驗證 JWT token 是否過期（解析 payload 檢查 exp）
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token 已過期，清除登入狀態並導回登入頁
      localStorage.removeItem('token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      router.navigate(['/login']);
      return false;
    }
  } catch {
    // Token 格式錯誤，視為無效
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
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
  { path: 'upload', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'materials', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'dashboard', pathMatch: 'full' }
];
