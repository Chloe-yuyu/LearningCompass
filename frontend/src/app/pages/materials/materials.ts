import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Navbar } from '../../shared/navbar';
import { Sidenav } from '../../shared/sidenav';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-materials',
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule, Navbar, Sidenav],
  templateUrl: './materials.html',
  styleUrl: './materials.css'
})
export class Materials implements OnInit {
  materials: any[] = [];
  analyzingId = '';
  generatingId = '';
  isLoading = true;

  // 問教材（Claude Agent SDK）相關狀態
  askingId = '';
  askQuestion = '';
  askAnswers: { [materialId: string]: string } = {};
  isAsking = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const email = localStorage.getItem('user_email');
    if (!email) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadMaterials();
  }

  loadMaterials() {
    const email = localStorage.getItem('user_email') || '';
    this.isLoading = true;

    this.http.get<any>(`http://localhost:5000/material/list?user_email=${encodeURIComponent(email)}`)
      .subscribe({
        next: (res) => {
          this.materials = res.materials || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('載入失敗:', err);
          this.isLoading = false;
          this.snackBar.open('載入失敗', '關閉', { duration: 3000 });
        }
      });
  }

  analyze(materialId: string) {
    this.analyzingId = materialId;
    this.http.post<any>(`http://localhost:5000/agent/analyze/${materialId}`, {})
      .subscribe({
        next: () => {
          this.analyzingId = '';
          this.snackBar.open('✅ 分析完成！', '關閉', { duration: 3000 });
          this.loadMaterials();
        },
        error: (err) => {
          this.analyzingId = '';
          this.snackBar.open(err.error?.error || '分析失敗', '關閉', { duration: 3000 });
        }
      });
  }

  // 修復：改用 lastValueFrom 取代已棄用的 .toPromise()
  async generateAll(materialId: string) {
    this.generatingId = materialId;
    const results = await Promise.allSettled([
      lastValueFrom(this.http.post(`http://localhost:5000/summary/generate/${materialId}`, {})),
      lastValueFrom(this.http.post(`http://localhost:5000/quiz/generate/${materialId}`, {})),
      lastValueFrom(this.http.post(`http://localhost:5000/ppt/generate/${materialId}`, {}))
    ]);
    this.generatingId = '';
    const failed = results.filter(r => r.status === 'rejected').length;
    this.snackBar.open(
      failed === 0 ? '🎉 全部生成完成！' : `完成（${3 - failed}/3 成功）`,
      '關閉',
      { duration: 4000 }
    );
    this.loadMaterials();
  }

  deleteMaterial(materialId: string, filename: string) {
    if (!confirm(`確定要刪除「${filename}」嗎？`)) return;
    this.http.delete<any>(`http://localhost:5000/material/delete/${materialId}`)
      .subscribe({
        next: () => {
          this.snackBar.open('✅ 已刪除', '關閉', { duration: 3000 });
          this.loadMaterials();
        },
        error: () => { this.snackBar.open('刪除失敗', '關閉', { duration: 3000 }); }
      });
  }

  toggleAsk(materialId: string) {
    this.askingId = this.askingId === materialId ? '' : materialId;
    this.askQuestion = '';
  }

  submitAsk(materialId: string) {
    if (!this.askQuestion.trim()) {
      this.snackBar.open('請先輸入問題', '關閉', { duration: 2000 });
      return;
    }
    this.isAsking = true;
    this.http.post<any>(`http://localhost:5000/sdk-agent/ask`, {
      material_id: materialId,
      question: this.askQuestion
    }).subscribe({
      next: (res) => {
        this.isAsking = false;
        this.askAnswers[materialId] = res.answer || '沒有回傳結果';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isAsking = false;
        this.snackBar.open(err.error?.error || '問答失敗', '關閉', { duration: 3000 });
      }
    });
  }

  getFileIcon(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const icons: any = { pdf: '📕', docx: '📘', doc: '📘', txt: '📝', md: '📝' };
    return icons[ext || ''] || '📄';
  }

  getStatusLabel(status: string): string {
    const map: any = { uploaded: '已上傳', analyzed: '已分析', done: '已完成' };
    return map[status] || status;
  }

  getStatusBadge(status: string): string {
    const map: any = { uploaded: 'lingo-badge lingo-badge-yellow', analyzed: 'lingo-badge lingo-badge-purple', done: 'lingo-badge lingo-badge-green' };
    return map[status] || 'lingo-badge';
  }
}
