import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  title = 'Wallet';
  navLinks = [{
      name: 'Wallet',
      link: ['/navigator', { outlets: { navigator: ['wallet'] } }],
      isSelected: true,
      isActive: true
    }, {
      name: 'Exchange',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'ICO',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Portfolio Investment',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Verification',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Settings',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Exit',
      link: '/start',
      isSelected: false,
      isActive: true
    }];

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService,
    private readonly ngZone: NgZone
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(() => this.ngZone.run(async () => {
        await this.router.navigate(['/waiting']);
      })));
    console.log('Entered navigation');
  }

  async ngOnDestroy() {
    console.log('Left navigation');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();

    await this.bt.disconnect();
  }
}
