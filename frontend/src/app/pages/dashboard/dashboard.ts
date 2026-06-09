import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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

  // 上傳教材（內嵌畫面）
  showUploadView = false;
  pendingUploadFile: File | null = null;
  uploadLoading = false;

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

  loadFiles() {
    const email = localStorage.getItem('user_email');
    if (!email) return;

    this.http.get<any>(`http://localhost:5000/material/list?user_email=${encodeURIComponent(email)}`).subscribe({
      next: (res) => {
        const files = res.materials || [];
        this.uploadedFiles = files.map((f: any) => ({
          id: f.id || f._id,
          name: f.original_filename || f.name || '未命名',
          size: '--',
          date: f.created_at ? new Date(f.created_at).toLocaleDateString('zh-TW') : '--',
          icon: (f.original_filename || '').endsWith('.pdf') ? '📕' : '📘'
        }));
      },
      error: () => {}
    });
  }

  newChat() {
    this.messages = [];
    this.activeChatId = '';
    this.currentFile = null;
    this.inputText = '';
    this.showUploadView = false;
  }

  loadChat(id: string) {
    this.activeChatId = id;
    this.showUploadView = false;
  }

  selectFile(file: UploadedFile) {
    this.currentFile = file;
    this.showUploadView = false;
    this.snackBar.open(`已選擇「${file.name}」，可開始提問`, '關閉', { duration: 2000 });
  }

  // ── 內嵌上傳畫面 ──
  openUploadView() {
    this.showUploadView = true;
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
        this.loadFiles(); // 重新載入教材列表
      },
      error: (err) => {
        this.uploadLoading = false;
        this.snackBar.open(err.error?.error || '上傳失敗，請稍後再試', '關閉', { duration: 3000 });
      }
    });
  }

  // ── 聊天 ──
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
