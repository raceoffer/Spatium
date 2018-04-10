import {Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import {AuthService} from "../../services/auth.service";

declare const device: any;

@Component({
  selector: 'app-factor',
  templateUrl: './factor-parent.component.html',
  styleUrls: ['./factor-parent.component.css']
})
export class FactorParentComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  private subscriptions = [];

  next: string = null;
  back: string = null;
  isBlack = true;
  label = '';
  stCreate = 'Create secret';
  stUnlock = 'Unlock secret';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
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

    if (this.back && this.back === 'factornode') {
      this.isBlack = false;
    }

    if (this.back && this.back === 'start') {
      if (this.authService.encryptedSeed === null) {
        this.label = this.stCreate;
      } else {
        this.label = this.stUnlock;
      }
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
