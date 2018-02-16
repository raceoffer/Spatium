import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-factor',
  templateUrl: './factor-parent.component.html',
  styleUrls: ['./factor-parent.component.css']
})
export class FactorParentComponent implements OnInit {
  next: string = null;
  back: string = null;
  isBlack = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });

    if (this.back && this.back === 'navigator-verifier') {
      this.isBlack = false;
    }
  }

  ngOnInit() {}

  async onBack() {
    switch (this.back) {
      case 'start':
        await this.router.navigate(['/start']);
        break;
      case 'auth':
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        await this.router.navigate(['/navigator', {outlets: {navigator: ['factornode']}}]);
        break;
    }
  }
}
