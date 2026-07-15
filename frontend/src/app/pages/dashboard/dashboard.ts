import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { marked } from 'marked';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  function?: string;
  sources?: { material_id: string; material_name: string }[];
}

interface ChatRecord {
  id: string;
  title: string;
  time: string;
  // 原始資料，點選歷史紀錄時用來重建對話內容
  materials: string[];
  function: FunctionType;
  query: string;
  answer: string;
  sources?: { material_id: string; material_name: string }[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  date: string;
  icon: string;
  vectorized?: boolean;
}

type FunctionType = 'chat' | 'summary' | 'quiz' | 'ppt';

interface QuizRecord {
  id: string;
  title: string;
  date: string;
  duration: string;
  totalScore: number;
  score: number;
  status: '已完成' | '未完成';
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  index: number;
  question: string;
  options: string[];
  answer: string;
  userAnswer: string;
  correct: boolean;
  explanation: string;
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
  chatHistory: ChatRecord[] = [];
  uploadedFiles: UploadedFile[] = [];

  // 多選教材
  selectedFileIds = new Set<string>();

  // 功能選擇
  selectedFunction: FunctionType = 'chat';

  // 頁面狀態
  activeView: 'chat' | 'upload' | 'materials' | 'profile' | 'quiz' = 'chat';

  // 測驗紀錄（歷史）
  quizRecords: QuizRecord[] = [];
  selectedQuiz: QuizRecord | null = null;
  quizDetailMode: 'list' | 'analysis' | 'questions' = 'list';

  // 互動測驗（作答中）
  activeQuizQuestions: QuizQuestion[] = [];
  quizUserAnswers: string[] = [];
  quizSubmitted = false;
  quizScore = 0;
  quizMaterialTitle = '';

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

  // 功能按鈕設定
  functionButtons = [
    { id: 'chat' as FunctionType, icon: '💬', label: '問答', desc: '針對教材內容提問' },
    { id: 'summary' as FunctionType, icon: '📝', label: '筆記', desc: '生成重點筆記' },
    { id: 'quiz' as FunctionType, icon: '✏️', label: '題目', desc: '生成練習題' },
    { id: 'ppt' as FunctionType, icon: '📊', label: '投影片', desc: '生成投影片大綱' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  // Markdown 轉 HTML
  renderMarkdown(text: string): SafeHtml {
    if (!text) return '';
    const html = marked.parse(text, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit() {
    this.userEmail = localStorage.getItem('user_email') || '';
    this.userName = localStorage.getItem('user_name') || this.userEmail || '同學';
    this.loadFiles();
    this.loadChatHistory();
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
          icon: (f.original_filename || f.filename || '').toLowerCase().endsWith('.pdf') ? '📕' : '📘',
          vectorized: f.vectorized || false
        }));
      },
      error: () => {}
    });
  }

  // ── 多選教材 ──
  toggleFile(file: UploadedFile) {
    if (this.selectedFileIds.has(file.id)) {
      this.selectedFileIds.delete(file.id);
    } else {
      this.selectedFileIds.add(file.id);
      // 如果尚未向量化，自動觸發
      if (!file.vectorized) {
        this.vectorizeFile(file);
      }
    }
  }

  isFileSelected(fileId: string): boolean {
    return this.selectedFileIds.has(fileId);
  }

  removeSelectedFile(fileId: string) {
    this.selectedFileIds.delete(fileId);
  }

  get selectedFiles(): UploadedFile[] {
    return this.uploadedFiles.filter(f => this.selectedFileIds.has(f.id));
  }

  get hasSelectedFiles(): boolean {
    return this.selectedFileIds.size > 0;
  }

  // 向量化教材
  vectorizeFile(file: UploadedFile) {
    this.http.post<any>(`http://localhost:5000/material-agent/vectorize/${file.id}`, {}).subscribe({
      next: () => {
        file.vectorized = true;
        this.snackBar.open(`✅ ${file.name} 已建立索引`, '關閉', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open(`索引建立失敗：${file.name}`, '關閉', { duration: 3000 });
      }
    });
  }

  // ── 功能選擇 ──
  selectFunction(fn: FunctionType) {
    if (!this.hasSelectedFiles) {
      this.snackBar.open('請先選擇至少一份教材', '關閉', { duration: 2000 });
      return;
    }
    this.selectedFunction = fn;
  }

  // ── 視圖切換 ──
  setView(view: 'chat' | 'upload' | 'materials' | 'profile' | 'quiz') {
    this.activeView = view;
    if (view === 'profile') this.loadProfileData();
    if (view === 'upload') this.pendingUploadFile = null;
    if (view === 'quiz') { this.loadQuizRecords(); this.quizDetailMode = 'list'; this.selectedQuiz = null; }
    this.showUserMenu = false;
  }

  loadQuizRecords() {
    if (!this.userEmail) return;
    this.http.get<any>(`http://localhost:5000/quiz/list?user_email=${encodeURIComponent(this.userEmail)}`).subscribe({
      next: (res) => {
        const records = Array.isArray(res) ? res : (res.records || []);
        this.quizRecords = records.map((r: any) => ({
          id: r.id || r._id || '',
          title: r.title || r.material_name || '未命名測驗',
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : '--',
          duration: r.duration || '60 分鐘',
          totalScore: r.total_score || 100,
          score: r.score ?? 85,
          status: r.status === 'completed' ? '已完成' : '未完成',
          questions: r.questions || []
        }));
      },
      error: () => {}
    });
  }

  openQuizAnalysis(quiz: QuizRecord) {
    this.selectedQuiz = quiz;
    this.quizDetailMode = 'analysis';
  }

  openQuizQuestions(quiz: QuizRecord) {
    this.selectedQuiz = quiz;
    this.quizDetailMode = 'questions';
  }

  backToQuizList() {
    this.selectedQuiz = null;
    this.quizDetailMode = 'list';
  }

  // ── 互動測驗 ──
  parseQuizFromMessage(content: string): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    // Match blocks like: 第 1 題：...  A. ... B. ... C. ... D. ... 答案：X 解析：...
    const blocks = content.split(/(?=第\s*\d+\s*題[：:])/);
    for (const block of blocks) {
      const qMatch = block.match(/第\s*(\d+)\s*題[：:]\s*([\s\S]*?)(?=\n?[A-Da-d][.．])/);
      if (!qMatch) continue;
      const index = parseInt(qMatch[1]);
      const question = qMatch[2].trim();
      const optMatches = [...block.matchAll(/([A-Da-d])[.．]\s*([^\nA-Da-d答解]+)/g)];
      const options = optMatches.map(m => `${m[1].toUpperCase()}. ${m[2].trim()}`);
      const answerMatch = block.match(/答案[：:]\s*([A-Da-d])/i);
      const explMatch = block.match(/解析[：:]\s*([\s\S]+?)(?=第\s*\d+\s*題|$)/);
      if (!answerMatch || options.length < 2) continue;
      questions.push({
        index,
        question,
        options,
        answer: answerMatch[1].toUpperCase(),
        userAnswer: '',
        correct: false,
        explanation: explMatch ? explMatch[1].trim() : ''
      });
    }
    return questions;
  }

  startActiveQuiz(questions: QuizQuestion[]) {
    this.activeQuizQuestions = questions.map(q => ({ ...q, userAnswer: '', correct: false }));
    this.quizUserAnswers = new Array(questions.length).fill('');
    this.quizSubmitted = false;
    this.quizScore = 0;
    this.quizMaterialTitle = this.selectedFiles.map(f => f.name).join(', ') || '教材';
  }

  selectAnswer(qIndex: number, option: string) {
    if (this.quizSubmitted) return;
    const letter = option.charAt(0).toUpperCase();
    this.quizUserAnswers[qIndex] = letter;
    this.activeQuizQuestions[qIndex].userAnswer = letter;
  }

  submitQuiz() {
    let correct = 0;
    for (let i = 0; i < this.activeQuizQuestions.length; i++) {
      const q = this.activeQuizQuestions[i];
      q.userAnswer = this.quizUserAnswers[i] || '';
      q.correct = q.userAnswer === q.answer;
      if (q.correct) correct++;
    }
    this.quizScore = Math.round((correct / this.activeQuizQuestions.length) * 100);
    this.quizSubmitted = true;

    // Save to quiz records
    const now = new Date();
    const record: QuizRecord = {
      id: Date.now().toString(),
      title: this.quizMaterialTitle,
      date: now.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
      duration: '--',
      totalScore: 100,
      score: this.quizScore,
      status: '已完成',
      questions: this.activeQuizQuestions
    };
    this.quizRecords.unshift(record);

    // POST to backend
    this.http.post('http://localhost:5000/quiz/save', {
      user_email: this.userEmail,
      title: this.quizMaterialTitle,
      score: this.quizScore,
      total_score: 100,
      questions: this.activeQuizQuestions
    }).subscribe({ error: () => {} });
  }

  closeActiveQuiz() {
    this.activeQuizQuestions = [];
    this.quizSubmitted = false;
    this.quizScore = 0;
  }

  get correctCount(): number {
    return this.activeQuizQuestions.filter(q => q.correct).length;
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
    this.selectedFileIds.clear();
    this.selectedFunction = 'chat';
    this.inputText = '';
    this.activeView = 'chat';
  }

  loadChat(id: string) {
    const record = this.chatHistory.find(c => c.id === id);
    if (!record) return;

    this.activeChatId = id;
    this.activeView = 'chat';
    this.selectedFunction = record.function;

    // 根據紀錄裡的 materials 重新勾選左側教材
    this.selectedFileIds = new Set(record.materials);

    this.messages = [
      {
        role: 'user',
        content: record.query || this.getDefaultPrompt(record.function),
        time: record.time,
        function: record.function
      },
      {
        role: 'assistant',
        content: record.answer,
        time: record.time,
        sources: record.sources
      }
    ];
  }

  // 從後端載入對話歷史（填充左側「最近對話」列表）
  loadChatHistory() {
    if (!this.userEmail) return;
    const email = encodeURIComponent(this.userEmail);
    this.http.get<any>(`http://localhost:5000/sdk-agent/history?user_email=${email}`)
      .subscribe({
        next: (res) => {
          const history = res.history || [];
          this.chatHistory = history.map((h: any) => ({
            id:        h.chat_id || h.id,
            title:     (h.query && h.query.trim()) || '對話',
            time:      h.created_at ? new Date(h.created_at).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '',
            materials: h.materials || [],
            function:  h.function || 'agent',
            query:     h.query || '',
            answer:    h.answer || '',
            sources:   h.sources
          }));
        },
        error: () => {}
      });
  }

  // ── 教材刪除 ──
  deleteFile(file: UploadedFile) {
    if (!confirm(`確定要刪除「${file.name}」嗎？`)) return;
    this.http.delete<any>(`http://localhost:5000/material/delete/${file.id}?user_email=${encodeURIComponent(this.userEmail)}`).subscribe({
      next: () => {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== file.id);
        this.selectedFileIds.delete(file.id);
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
      next: (res) => {
        this.uploadLoading = false;
        this.snackBar.open('✅ 上傳成功！正在建立索引...', '關閉', { duration: 2000 });
        const newMaterialId = res.material_id || res.id;
        this.pendingUploadFile = null;
        this.activeView = 'chat';
        this.loadFiles();

        // 上傳完自動向量化
        if (newMaterialId) {
          this.http.post<any>(`http://localhost:5000/material-agent/vectorize/${newMaterialId}`, {}).subscribe({
            next: () => {
              this.snackBar.open('✅ 索引建立完成，可開始使用！', '關閉', { duration: 3000 });
              this.loadFiles();
            },
            error: () => {}
          });
        }
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

  // 取得當前功能設定
  get currentFunctionConfig() {
    return this.functionButtons.find(b => b.id === this.selectedFunction);
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (this.isLoading) return;

    if (!this.hasSelectedFiles) {
      this.snackBar.open('請先選擇至少一份教材', '關閉', { duration: 2000 });
      return;
    }

    if (!text) {
      this.snackBar.open('請輸入你想做什麼', '關閉', { duration: 2000 });
      return;
    }

    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

    this.messages.push({ role: 'user', content: text, time: now });
    this.inputText = '';
    this.isLoading = true;
    this.messages.push({ role: 'assistant', content: '正在思考中...', time: now });

    // 打新版 Main Agent API（傳全部選中的教材）
    const body: any = {
      material_ids: Array.from(this.selectedFileIds),
      message: text,
      user_email: this.userEmail
    };

    this.http.post<any>('http://localhost:5000/sdk-agent/ask', body).subscribe({
      next: (res) => {
        this.messages.pop();
        const t = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const answer = res.answer || '已收到您的問題';
        this.messages.push({
          role: 'assistant',
          content: answer,
          time: t,
          sources: res.sources
        });
        this.isLoading = false;
        this.activeChatId = res.chat_id || '';
        this.loadChatHistory();

        // Auto-detect quiz output
        if (this.selectedFunction === 'quiz') {
          const parsed = this.parseQuizFromMessage(answer);
          if (parsed.length > 0) {
            this.startActiveQuiz(parsed);
          }
        }
      },
      error: (err) => {
        this.messages.pop();
        const t = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        this.messages.push({
          role: 'assistant',
          content: err.error?.error || '目前無法連線到伺服器，請稍後再試。',
          time: t
        });
        this.isLoading = false;
      }
    });
  }

  getDefaultPrompt(fn: FunctionType): string {
    const prompts: Record<FunctionType, string> = {
      chat: '請說明教材內容',
      summary: '請幫我整理重點筆記',
      quiz: '請出 5 道練習題',
      ppt: '請生成投影片大綱'
    };
    return prompts[fn];
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
