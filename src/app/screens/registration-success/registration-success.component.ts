import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  stSuccess0 = 'You have successfully created a secure, ';
  stSuccess1 = 'personal SPATIUM account!';
  stOpenWallet = 'Open wallet';
  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly navigationService: NavigationService) { }

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

  async goWaiting() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
  }

  async onBackClicked() {
    await this.router.navigate(['/login']);
  }
}
