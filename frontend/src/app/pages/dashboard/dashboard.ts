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

  // 使用者
  userName = '';
  userEmail = '';

  // 聊天
  inputText = '';
  messages: Message[] = [];
  isLoading = false;
  activeChatId = '';
  currentFile: UploadedFile | null = null;
  chatHistory: ChatRecord[] = [];
  uploadedFiles: UploadedFile[] = [];

  // 頁面狀態（四個視圖）
  activeView: 'chat' | 'upload' | 'materials' | 'profile' = 'chat';

  // 上傳
  pendingUploadFile: File | null = null;
  uploadLoading = false;

  // 使用者選單
  showUserMenu = false;

  // 個人資料編輯
  editName = '';
  editSchool = '';
  editDepartment = '';
  editBio = '';
  profileSaving = false;

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
    this.userEmail = localStorage.getItem('user_email') || '';
    this.userName = localStorage.getItem('user_name') || this.userEmail || '同學';
    this.loadFiles();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // ── 教材載入 ──
  loadFiles() {
    if (!this.userEmail) return;
    this.http.get<any>(`http://localhost:5000/material/list?user_email=${encodeURIComponent(this.userEmail)}`).subscribe({
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

  // ── 視圖切換 ──
  setView(view: 'chat' | 'upload' | 'materials' | 'profile') {
    this.activeView = view;
    if (view === 'profile') this.loadProfileData();
    if (view === 'upload') this.pendingUploadFile = null;
    this.showUserMenu = false;
  }

  backToChat() {
    this.activeView = 'chat';
    this.pendingUploadFile = null;
  }

  get showUploadView()    { return this.activeView === 'upload'; }
  get showMaterialsView() { return this.activeView === 'materials'; }
  get showProfileView()   { return this.activeView === 'profile'; }

  // ── 使用者選單 ──
  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  closeMenus() {
    this.showUserMenu = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ── 個人資料 ──
  loadProfileData() {
    this.editName       = localStorage.getItem('user_name') || '';
    this.editSchool     = localStorage.getItem('user_school') || '';
    this.editDepartment = localStorage.getItem('user_department') || '';
    this.editBio        = localStorage.getItem('user_bio') || '';
  }

  saveProfile() {
    if (!this.userEmail) return;
    this.profileSaving = true;

    this.http.post<any>('http://localhost:5000/register/update_profile', {
      email: this.userEmail,
      name: this.editName,
      school: this.editSchool,
      department: this.editDepartment,
      bio: this.editBio
    }).subscribe({
      next: () => {
        localStorage.setItem('user_name', this.editName);
        localStorage.setItem('user_school', this.editSchool);
        localStorage.setItem('user_department', this.editDepartment);
        localStorage.setItem('user_bio', this.editBio);
        this.userName = this.editName;
        this.profileSaving = false;
        this.snackBar.open('✅ 資料已儲存', '關閉', { duration: 3000 });
      },
      error: (err) => {
        this.profileSaving = false;
        this.snackBar.open(err.error?.error || '儲存失敗，請稍後再試', '關閉', { duration: 3000 });
      }
    });
  }

  cancelProfile() {
    this.loadProfileData();
    this.snackBar.open('已取消變更', '關閉', { duration: 2000 });
  }

  // ── 聊天 ──
  newChat() {
    this.messages = [];
    this.activeChatId = '';
    this.currentFile = null;
    this.inputText = '';
    this.activeView = 'chat';
  }

  loadChat(id: string) {
    this.activeChatId = id;
    this.activeView = 'chat';
  }

  selectFile(file: UploadedFile) {
    this.currentFile = file;
    this.activeView = 'chat';
    this.snackBar.open(`已選擇「${file.name}」，可開始提問`, '關閉', { duration: 2000 });
  }

  selectFileAndBack(file: UploadedFile) {
    this.selectFile(file);
  }

  // ── 教材刪除 ──
  deleteFile(file: UploadedFile) {
    if (!confirm(`確定要刪除「${file.name}」嗎？`)) return;
    this.http.delete<any>(`http://localhost:5000/material/delete/${file.id}?user_email=${encodeURIComponent(this.userEmail)}`).subscribe({
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

  // ── 上傳 ──
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
    formData.append('user_email', this.userEmail);

    this.http.post<any>('http://localhost:5000/material/upload', formData).subscribe({
      next: () => {
        this.uploadLoading = false;
        this.snackBar.open('✅ 上傳成功！', '關閉', { duration: 3000 });
        this.pendingUploadFile = null;
        this.activeView = 'chat';
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

    const body: any = { question: text, user_email: this.userEmail };
    if (this.currentFile) body.file_id = this.currentFile.id;

    this.http.post<any>('http://localhost:5000/chat/', body).subscribe({
      next: (res) => {
        const t = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ role: 'assistant', content: res.answer || res.reply || '已收到您的問題，正在處理中...', time: t });
        this.isLoading = false;
      },
      error: () => {
        const t = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ role: 'assistant', content: '目前無法連線到伺服器，請稍後再試。', time: t });
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
