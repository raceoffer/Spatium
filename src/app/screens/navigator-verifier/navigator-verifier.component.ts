import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit {
  public navLinks = [{
    name: 'Export secret',
    link: ['/secret-export']
  }, {
    name: 'Change PIN',
    link: ['/factor', { back: 'navigator-verifier' }, { outlets: { 'factor': ['pincode', { next: 'navigator-verifier' }] } }]
  }, {
    name: 'Delete secret',
    link: ['/secret-delete']
  }, {
    name: 'Exit',
    link: ['/start']
  }];

  constructor(private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly bt: BluetoothService,
              private readonly wallet: WalletService) { }

  ngOnInit() {
    console.log('Entered navigation');
  }

  async onLinkClick(navLink) {
    if (navLink === this.navLinks[3]) {
      await this.wallet.reset();
      await this.bt.disconnect();
    }

    this.ngZone.run(async () => {
      await this.router.navigate(navLink.link);
    });
  }

}
