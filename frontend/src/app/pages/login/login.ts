import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  loading = false;
  showPassword = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.snackBar.open('請輸入帳號和密碼', '關閉', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.http.post<any>('http://localhost:5000/login/login_user', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_email', this.email);
        localStorage.setItem('user_name', res.name);
        this.snackBar.open('登入成功！', '關閉', { duration: 2000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || '帳號或密碼不正確', '關閉', { duration: 3000 });
      },
      complete: () => { this.loading = false; }
    });
  }
}
