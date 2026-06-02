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

  chatHistory: ChatRecord[] = [
    { id: '1', title: '機器學習基礎概念整理', time: '今天 14:30' },
    { id: '2', title: '資料結構練習題生成', time: '昨天 10:15' },
    { id: '3', title: '作業系統重點摘要', time: '3天前' },
  ];

  uploadedFiles: UploadedFile[] = [
    { id: '1', name: '機器學習.pdf', size: '2.4 MB', date: '今天', icon: '📕' },
    { id: '2', name: '資料結構筆記.docx', size: '1.1 MB', date: '昨天', icon: '📘' },
    { id: '3', name: '作業系統.pdf', size: '5.6 MB', date: '3天前', icon: '📕' },
  ];

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
    this.http.get<any[]>(`http://localhost:5000/material/list?user_email=${email}`).subscribe({
      next: (files) => {
        if (files?.length) {
          this.uploadedFiles = files.map(f => ({
            id: f.id || f.file_id,
            name: f.filename || f.name,
            size: f.size ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : '--',
            date: f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString('zh-TW') : '--',
            icon: f.filename?.endsWith('.pdf') ? '📕' : '📘'
          }));
        }
      },
      error: () => {} // 使用預設假資料
    });
  }

  newChat() {
    this.messages = [];
    this.activeChatId = '';
    this.currentFile = null;
    this.inputText = '';
  }

  loadChat(id: string) {
    this.activeChatId = id;
    // 實際串接 API 時從後端載入歷史訊息
  }

  selectFile(file: UploadedFile) {
    this.currentFile = file;
    this.snackBar.open(`已選擇「${file.name}」，可開始提問`, '關閉', { duration: 2000 });
  }

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

    this.http.post<any>('http://localhost:5000/chat', body).subscribe({
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
