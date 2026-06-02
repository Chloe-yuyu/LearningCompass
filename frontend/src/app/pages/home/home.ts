import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private sections: HTMLElement[] = [];
  private currentIndex = 0;
  private container!: HTMLElement;

  ngOnInit() {
    setTimeout(() => {
      this.container = document.querySelector('.home-page') as HTMLElement;
      this.sections = Array.from(
        document.querySelectorAll('.snap-section')
      ) as HTMLElement[];
    }, 100);
  }

  goHome() {
    this.currentIndex = 0;
    this.scrollToSection(this.sections[0]);
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const idx = this.sections.findIndex(s => s.contains(el) || s === el);
    if (idx !== -1) {
      this.currentIndex = idx;
      this.scrollToSection(this.sections[idx]);
    }
  }

  private scrollToSection(section?: HTMLElement) {
    if (!section || !this.container) return;

    this.container.scrollTo({
      top: section.offsetTop,
      behavior: 'smooth'
    });
  }
}
