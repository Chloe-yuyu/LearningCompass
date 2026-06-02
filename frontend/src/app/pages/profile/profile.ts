import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Navbar } from '../../shared/navbar';
import { Sidenav } from '../../shared/sidenav';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule, Navbar, Sidenav],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  userName = '';
  userEmail = '';
  school = '';
  department = '';
  bio = '';
  saving = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('user_name') || '';
    this.userEmail = localStorage.getItem('user_email') || '';
    this.school = localStorage.getItem('user_school') || '';
    this.department = localStorage.getItem('user_department') || '';
    this.bio = localStorage.getItem('user_bio') || '';
  }

  save() {
    this.saving = true;
    localStorage.setItem('user_name', this.userName);
    localStorage.setItem('user_school', this.school);
    localStorage.setItem('user_department', this.department);
    localStorage.setItem('user_bio', this.bio);

    setTimeout(() => {
      this.saving = false;
      this.snackBar.open('✅ 資料已儲存', '關閉', { duration: 3000 });
    }, 500);
  }

  cancel() {
    this.ngOnInit();
    this.snackBar.open('已取消變更', '關閉', { duration: 2000 });
  }

  deleteAccount() {
    if (confirm('確定要刪除帳號嗎？此操作無法復原！')) {
      this.snackBar.open('請聯絡管理員刪除帳號', '關閉', { duration: 4000 });
    }
  }
}
