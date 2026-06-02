import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  private sections: HTMLElement[] = [];
  private currentIndex = 0;
  private isScrolling = false;
  private wheelHandler!: (e: WheelEvent) => void;
  private container!: HTMLElement;

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.container = document.querySelector('.home-page') as HTMLElement;
      this.sections = Array.from(
        document.querySelectorAll('.snap-section')
      ) as HTMLElement[];

      this.wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        if (this.isScrolling) return;

        const dir = e.deltaY > 0 ? 1 : -1;
        const next = this.currentIndex + dir;
        if (next < 0 || next >= this.sections.length) return;

        this.isScrolling = true;
        this.currentIndex = next;
        this.sections[next].scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { this.isScrolling = false; }, 800);
      };

      this.container?.addEventListener('wheel', this.wheelHandler, { passive: false });
    }, 100);
  }

  ngOnDestroy() {
    this.container?.removeEventListener('wheel', this.wheelHandler);
  }

  goHome() {
    this.currentIndex = 0;
    this.sections[0]?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const idx = this.sections.findIndex(s => s.contains(el) || s === el);
    if (idx !== -1) {
      this.currentIndex = idx;
      this.sections[idx].scrollIntoView({ behavior: 'smooth' });
    }
  }
}
