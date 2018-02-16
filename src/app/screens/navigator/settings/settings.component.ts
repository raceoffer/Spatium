import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

enum State {
  nav = 0,
  lang = 1
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

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
    private readonly authService: AuthService
  ) { }

  ngOnInit() { }

  async onBackClick() {
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
