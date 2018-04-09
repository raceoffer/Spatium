import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

declare const device: any;

@Component({
  selector: 'app-factor',
  templateUrl: './factor-parent.component.html',
  styleUrls: ['./factor-parent.component.css']
})
export class FactorParentComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  next: string = null;
  back: string = null;
  isBlack = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly navigationService: NavigationService
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

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  async onBackClicked() {
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
