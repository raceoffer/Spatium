import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { ConnectivityService } from '../../../services/connectivity.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';

declare const navigator: any;

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public stLabel = 'Connect to a device';

  public discovering = this.connectivityService.discovering;
  public connected = this.connectivityService.connected;
  public devices = this.connectivityService.devices.map(devices => devices.values());
  public ready = this.wallet.ready;

  private subscriptions = [];

  constructor(public dialog: MatDialog,
              private connectivityService: ConnectivityService,
              private wallet: WalletService,
              private router: Router,
              private readonly navigationService: NavigationService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.connectivityService.connectedEvent.subscribe(async () => {
        this.wallet.startSync();
        await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async connectTo(ip) {
    if (this.ready.getValue()) {
      await this.openDialog(ip);
    } else {
      await this.connectivityService.connect(ip);
    }
  }

  async startDiscovery() {
    await this.connectivityService.searchDevices(5 * 1000);
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
  }

  async cancelConnect() {
    await this.openDialog(null);
  }

  async openDialog(ip: string) {
    navigator.notification.confirm(
      'Cancel synchronization',
      buttonIndex => {
        if (buttonIndex === 1) { // yes
          this.connectivityService.disconnect();

          if (ip != null) {
            this.connectivityService.connect(ip);
          }
        }
      },
      '',
      ['YES', 'NO']
    );
  }
}
