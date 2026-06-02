import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Navbar } from '../../shared/navbar';
import { Sidenav } from '../../shared/sidenav';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule, Navbar, Sidenav],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  selectedFile: File | null = null;
  loading = false;
  uploadSuccess = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadSuccess = false;
  }

  upload() {
    if (!this.selectedFile) {
      this.snackBar.open('請先選擇檔案', '關閉', { duration: 3000 });
      return;
    }
    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('user_email', localStorage.getItem('user_email') || '');

    this.http.post<any>('http://localhost:5000/material/upload', formData)
      .subscribe({
        next: () => {
          this.loading = false;
          this.uploadSuccess = true;
          this.snackBar.open('✅ 上傳成功！', '關閉', { duration: 3000 });
          setTimeout(() => this.router.navigate(['/materials']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.error?.error || '上傳失敗', '關閉', { duration: 3000 });
        }
      });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
