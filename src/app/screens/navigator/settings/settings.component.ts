import { Component, EventEmitter, HostBinding, OnDestroy, Output } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";

enum State {
  nav = 0,
  lang = 1
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  @Output() back = new EventEmitter<any>();

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

  private subscriptions = [];

  constructor(
    private readonly navigationService: NavigationService
  ) {}

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    this.back.next();
    this.navigationService.back();
  }

  onSettingsClick(navLink) {}

  onLanguageClick(ignored) {}
}
