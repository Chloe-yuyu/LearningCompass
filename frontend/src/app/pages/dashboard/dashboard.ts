import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Navbar } from '../../shared/navbar';
import { Sidenav } from '../../shared/sidenav';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule, Navbar, Sidenav],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  selectedFile: File | null = null;
  loading = false;
  uploadSuccess = false;

  formats = [
    { icon: '📕', name: 'PDF', ext: '.pdf', bg: '#ffe4e4', bd: '#fca5a5' },
    { icon: '📘', name: 'Word', ext: '.doc, .docx', bg: '#dbeafe', bd: '#93c5fd' },
    { icon: '📝', name: 'TXT', ext: '.txt', bg: '#f3f4f6', bd: '#d1d5db' },
    { icon: '🟣', name: 'Markdown', ext: '.md', bg: '#f5e6ff', bd: '#dbb4fe' }
  ];

  benefits = [
    { icon: '📋', title: 'AI 整理重點', desc: '快速掌握核心概念' },
    { icon: '✏️', title: '生成測驗', desc: '自動生成練習題目' },
    { icon: '📊', title: '學習分析', desc: '分析學習成效' },
    { icon: '📁', title: '整合教材', desc: '建立個人知識庫' }
  ];

  tips = [
    { title: '建議使用清晰的教材', desc: '內容清晰有助於 AI 更準確地分析' },
    { title: '單一檔案不超過 100MB', desc: '若檔案過大，建議分段上傳' },
    { title: '支援多種格式', desc: 'PDF、Word、TXT 等常見格式' },
    { title: '教材將自動處理', desc: '上傳後系統將自動分析並整理重點' }
  ];

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadSuccess = false;
  }

  upload() {
    if (!this.selectedFile) { this.snackBar.open('請先選擇檔案', '關閉', { duration: 3000 }); return; }
    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('user_email', localStorage.getItem('user_email') || '');
    this.http.post<any>('http://localhost:5000/material/upload', formData).subscribe({
      next: () => { this.loading = false; this.uploadSuccess = true; this.snackBar.open('✅ 上傳成功！', '關閉', { duration: 3000 }); setTimeout(() => this.router.navigate(['/materials']), 1500); },
      error: (err) => { this.loading = false; this.snackBar.open(err.error?.error || '上傳失敗', '關閉', { duration: 3000 }); }
    });
  }
}
