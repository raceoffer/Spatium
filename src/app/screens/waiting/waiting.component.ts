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
  enabledBT = this.bt.enabled;
  overlayClass = 'overlay invisible';

  devices = [];

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
    this.bt.enabled.filter(enabled => !enabled).subscribe(() => this.ngZone.run(async () => {
      await this.wallet.cancelSync();
      await this.router.navigate(['/waiting']);
    }));
    this.bt.enabled.filter(enabled => enabled).subscribe(() => this.ngZone.run(async () => {
      await this.bt.startDiscovery();
    }));
    this.bt.onDiscoveryFinished.subscribe((device) => this.ngZone.run(async () => {
      console.log('Finished discovery');
    }));
    this.bt.devices.subscribe(devices => this.ngZone.run(() => this.devices = devices));
  }

  async ngAfterViewInit() {
    await this.bt.requestEnable();
  }

  async changeBtState() {
    await this.bt.requestEnable();
  }

  async connectTo(name, address) {
    console.log('connect' + name + address);
    this.overlayClass = 'overlay';
    if (await this.bt.connect(new Device(name, address))) {
      await this.wallet.startSync();
      this.ngZone.run(() => {
        this.router.navigate(['/connect'], {queryParams: {name: '', address: ''}});
      });
    } else {
      this.overlayClass = 'overlay invisible';
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    }
  }
}
