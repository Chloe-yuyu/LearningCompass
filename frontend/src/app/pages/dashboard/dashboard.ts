import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface ChatRecord {
  id: string;
  title: string;
  time: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  date: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, MatSnackBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;

  userName = '';
  inputText = '';
  messages: Message[] = [];
  isLoading = false;
  activeChatId = '';
  currentFile: UploadedFile | null = null;

  chatHistory: ChatRecord[] = [];
  uploadedFiles: UploadedFile[] = [];

  // 頁面狀態
  showUploadView = false;
  showMaterialsView = false;

  // 上傳
  pendingUploadFile: File | null = null;
  uploadLoading = false;

  // 使用者選單
  showUserMenu = false;

  suggestions = [
    '📋 幫我整理這份教材的重點',
    '✏️ 根據教材出 10 題練習題',
    '📊 分析這份教材的難度',
    '📑 生成投影片大綱',
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('user_name') || localStorage.getItem('user_email') || '同學';
    this.loadFiles();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // ── 教材載入（登入後從後端取得） ──
  loadFiles() {
    const email = localStorage.getItem('user_email');
    if (!email) return;

    this.http.get<any>(`http://localhost:5000/material/list?user_email=${encodeURIComponent(email)}`).subscribe({
      next: (res) => {
        const files = Array.isArray(res) ? res : (res.materials || []);
        this.uploadedFiles = files.map((f: any) => ({
          id: f.id || f._id || '',
          name: f.original_filename || f.filename || f.name || '未命名',
          size: f.size ? `${(f.size / 1024).toFixed(0)} KB` : '--',
          date: f.created_at ? new Date(f.created_at).toLocaleDateString('zh-TW') : '--',
          icon: (f.original_filename || f.filename || '').toLowerCase().endsWith('.pdf') ? '📕' : '📘'
        }));
      },
      error: () => {}
    });
  }

  // ── 使用者選單 ──
  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  closeMenus(event: Event) {
    this.showUserMenu = false;
  }

  goProfile() {
    this.showUserMenu = false;
    this.router.navigate(['/profile']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ── 聊天操作 ──
  newChat() {
    this.messages = [];
    this.activeChatId = '';
    this.currentFile = null;
    this.inputText = '';
    this.showUploadView = false;
    this.showMaterialsView = false;
  }

  loadChat(id: string) {
    this.activeChatId = id;
    this.showUploadView = false;
    this.showMaterialsView = false;
  }

  selectFile(file: UploadedFile) {
    this.currentFile = file;
    this.showUploadView = false;
    this.showMaterialsView = false;
    this.snackBar.open(`已選擇「${file.name}」，可開始提問`, '關閉', { duration: 2000 });
  }

  selectFileAndBack(file: UploadedFile) {
    this.selectFile(file);
  }

  backToChat() {
    this.showUploadView = false;
    this.showMaterialsView = false;
    this.pendingUploadFile = null;
  }

  // ── 我的教材頁面 ──
  openMaterialsView() {
    this.showMaterialsView = true;
    this.showUploadView = false;
  }

  deleteFile(file: UploadedFile) {
    if (!confirm(`確定要刪除「${file.name}」嗎？`)) return;

    const email = localStorage.getItem('user_email') || '';
    this.http.delete<any>(`http://localhost:5000/material/delete/${file.id}?user_email=${encodeURIComponent(email)}`).subscribe({
      next: () => {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== file.id);
        if (this.currentFile?.id === file.id) this.currentFile = null;
        this.snackBar.open(`已刪除「${file.name}」`, '關閉', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('刪除失敗，請稍後再試', '關閉', { duration: 3000 });
      }
    });
  }

  // ── 內嵌上傳 ──
  openUploadView() {
    this.showUploadView = true;
    this.showMaterialsView = false;
    this.pendingUploadFile = null;
  }

  closeUploadView() {
    this.showUploadView = false;
    this.pendingUploadFile = null;
  }

  onUploadFileSelected(event: any) {
    this.pendingUploadFile = event.target.files[0] || null;
  }

  onDropFile(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.pendingUploadFile = file;
  }

  uploadFile() {
    if (!this.pendingUploadFile) return;
    this.uploadLoading = true;

    const formData = new FormData();
    formData.append('file', this.pendingUploadFile);
    formData.append('user_email', localStorage.getItem('user_email') || '');

    this.http.post<any>('http://localhost:5000/material/upload', formData).subscribe({
      next: () => {
        this.uploadLoading = false;
        this.snackBar.open('✅ 上傳成功！', '關閉', { duration: 3000 });
        this.pendingUploadFile = null;
        this.showUploadView = false;
        this.loadFiles();
      },
      error: (err) => {
        this.uploadLoading = false;
        this.snackBar.open(err.error?.error || '上傳失敗，請稍後再試', '關閉', { duration: 3000 });
      }
    });
  }

  // ── 發送訊息 ──
  sendSuggestion(text: string) {
    this.inputText = text;
    this.sendMessage();
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: text, time: now });
    this.inputText = '';
    this.isLoading = true;

    const email = localStorage.getItem('user_email') || '';
    const body: any = { question: text, user_email: email };
    if (this.currentFile) body.file_id = this.currentFile.id;

    this.http.post<any>('http://localhost:5000/chat/', body).subscribe({
      next: (res) => {
        const replyTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ role: 'assistant', content: res.answer || res.reply || '已收到您的問題，正在處理中...', time: replyTime });
        this.isLoading = false;
      },
      error: () => {
        const replyTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ role: 'assistant', content: '目前無法連線到伺服器，請稍後再試。', time: replyTime });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
