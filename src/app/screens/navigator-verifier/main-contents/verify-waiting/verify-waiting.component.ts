import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService } from '../../../../services/bluetooth.service';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';
import { WalletService } from '../../../../services/wallet.service';

@Component({
  selector: 'app-verify-waiting',
  templateUrl: './verify-waiting.component.html',
  styleUrls: ['./verify-waiting.component.css']
})
export class VerifyWaitingComponent implements OnInit, AfterViewInit, OnDestroy {
  enableBTmessage = 'Enable Bluetooth to proceed';

  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;

  public isExitTap = false;
  private subscriptions = [];

  constructor(private readonly bt: BluetoothService,
              private readonly navigationService: NavigationService,
              private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly notification: NotificationService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
  }

  async onBackClicked() {
    if (this.isExitTap) {
      console.log('isExitTap');
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      console.log('await');
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
    }
  }

}
