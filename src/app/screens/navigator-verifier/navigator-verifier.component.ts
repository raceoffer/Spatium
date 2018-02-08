import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {Router} from '@angular/router';
import {WalletService} from '../../services/wallet.service';
import {BluetoothService} from '../../services/bluetooth.service';

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit, OnDestroy {
  public navLinks = [{
    name: 'Export secret',
    link: '/secret-export'
  }, {
    name: 'Change PIN',
    link: ['/factor', { back: 'navigator-verifier' }, { outlets: { 'factor': ['pincode', { next: 'navigator-verifier' }] } }]
  }, {
    name: 'Delete secret',
    link: '/secret-delete'
  }, {
    name: 'Exit',
    link: '/start'
  }];

  private subscriptions = [];

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService,
    private readonly ngZone: NgZone
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(() => this.ngZone.run(async () => {
        await this.router.navigate(['/waiting']);
      })));
    console.log('Entered navigation');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onActivate(event) {

  }
}
