import { Component, OnInit, AfterViewInit, OnDestroy, HostBinding } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { WalletService } from '../../../services/wallet.service';
import { Router } from '@angular/router';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'app-verify-waiting',
  templateUrl: './verify-waiting.component.html',
  styleUrls: ['./verify-waiting.component.css']
})
export class VerifyWaitingComponent  implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  enableBTmessage = 'Enable Bluetooth to proceed';

  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;
  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;

  syncBool = false;

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly bt: BluetoothService,
    private readonly wallet: WalletService,
    private readonly navigationService: NavigationService
  ) { }

  ngOnInit() {

    this.subscriptions.push(
      this.synchronizing.subscribe((state) => {
        this.syncBool = state;
      })
    );

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        if (!this.syncBool) {
          await this.onBackClicked();
        } else {
          await this.cancelConnect();
        }
      })
    );

    this.subscriptions.push(
      this.wallet.readyEvent.subscribe(async () =>  {
        await this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-transaction'] } }]);
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.bt.enabledEvent.subscribe(async () => {
        await this.bt.ensureListening();
      }));

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.reset();
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        console.log('Connected to', this.bt.connectedDevice.getValue());
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.reset();
        await this.bt.ensureListening();
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-transaction'] } }]);
  }

  async cancelConnect() {
    await this.wallet.cancelSync();
  }
}
