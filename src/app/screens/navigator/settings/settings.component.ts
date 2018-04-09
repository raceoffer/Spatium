import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NavigationService } from '../../../services/navigation.service';

declare const device: any;

enum State {
  nav = 0,
  lang = 1
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  title = 'Settings';
  state = State.nav;

  navLinks = [{
    name: ' Add authentication path',
    link: 'factornode'
  }, {
    name: 'Language',
    link: 'lang',
  }];

  languages = [{
    name: 'English',
    value: 'en'
  }];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
  ) { }

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

  async onBackClicked() {
    switch (this.state) {
      case State.nav: {
        await this.router.navigate(['/navigator', { outlets: { navigator: ['wallet'] } }]);
        break;
      }
      case State.lang: {
        this.state = State.nav;
        break;
      }
    }
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  async onSettingsClick(navLink) {
    if (navLink.link === 'factornode') {
      this.authService.clearFactors();
      await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
    } else if (navLink.link === 'lang') {
      this.state = State.lang;
    }
  }

  onLanguageClick(ignored) {}
}
