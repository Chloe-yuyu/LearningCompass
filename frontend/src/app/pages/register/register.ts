import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  successMsg = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  register() {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.snackBar.open('請填寫所有欄位', '關閉', { duration: 3000 });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackBar.open('兩次密碼不一致', '關閉', { duration: 3000 });
      return;
    }

    if (this.password.length < 6) {
      this.snackBar.open('密碼至少需要 6 個字元', '關閉', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.http.post<any>('http://localhost:5000/register/register_user', {
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = '註冊成功！即將跳轉到登入頁面...';
        this.snackBar.open('✅ 註冊成功！', '關閉', { duration: 3000 });
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.error || '註冊失敗', '關閉', { duration: 3000 });
      }
    });
  }
}
