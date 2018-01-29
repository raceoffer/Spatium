import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BluetoothService, Device} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit {
  enableBTmessage = 'Turn on Bluetooth to proceed';
  Label = 'Connect to device';
  overlayClass = 'overlay invisible';

  enabled = this.bt.enabled;
  discovering = this.bt.discovering;
  devices = this.bt.discoveredDevices;

  constructor(
    private bt: BluetoothService,
    private wallet: WalletService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  async ngOnInit() {
    await this.bt.disconnect();
    this.wallet.onFinish.subscribe(() =>  this.ngZone.run(async () => {
      console.log(this.wallet.address.getValue());
      await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
    }));
    this.wallet.onCancelled.subscribe(() => this.ngZone.run(async () => {
      await this.router.navigate(['/waiting']);
    }));
    this.wallet.onFailed.subscribe(() => this.ngZone.run(async () => {
      await this.router.navigate(['/waiting']);
    }));
    this.bt.disabledEvent.subscribe(() => this.ngZone.run(async () => {
      await this.router.navigate(['/waiting']);
      await this.wallet.cancelSync();
    }));
    this.bt.enabledEvent.subscribe(() => this.ngZone.run(async () => {
      await this.bt.startDiscovery();
    }));
    this.bt.connectedEvent.subscribe(() => this.ngZone.run(async () => {
      console.log('Connected to', this.bt.connectedDevice.getValue());
      await this.wallet.startSync();
      this.router.navigate(['/connect'], {queryParams: {name: '', address: ''}});
    }));
    this.bt.disconnectedEvent.subscribe(() => this.ngZone.run(async () => {
      await this.router.navigate(['/waiting']);
      await this.wallet.cancelSync();
    }));
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.startDiscovery();
    }
  }

  async changeBtState() {
    await this.bt.requestEnable();
  }

  async connectTo(name, address) {
    console.log('connect' + name + address);
    this.overlayClass = 'overlay';
    if (!await this.bt.connect(new Device(name, address))) {
      this.overlayClass = 'overlay invisible';
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    }
  }
}
