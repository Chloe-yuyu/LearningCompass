import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  isLoggedIn = false;
  userName = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.userName = localStorage.getItem('user_name') || '';
    this.isLoggedIn = !!localStorage.getItem('user_email');
  }

  goHome() {
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
