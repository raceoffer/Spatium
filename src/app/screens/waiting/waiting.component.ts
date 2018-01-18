import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit {
  enableBTmessage = 'Turn on Bluetooth to proceed';
  Label = 'Device paring';
  disabledBT = true;
  overlayClass = 'overlay invisible';

  devices = [];

  constructor(private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
              private ngZone: NgZone) {
  }

  async ngOnInit() {
    this.wallet.resetRemote();
    await this.bt.disconnect();
    this.wallet.onFinish.subscribe(() => {
      console.log(this.wallet.address);
      this.ngZone.run(() => {
        this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      });
    });
    this.wallet.onCancelled.subscribe(() => {
      this.wallet.resetRemote();
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    });
    this.wallet.onFailed.subscribe(() => {
      this.wallet.resetRemote();
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    });
    this.bt.onDisconnected.subscribe(() => {
      this.wallet.cancelSync();
      this.wallet.resetRemote();
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    });
  }

  async ngAfterViewInit() {
    await this.changeBtState();
  }

  async changeBtState() {
    this.disabledBT = !await this.bt.ensureEnabled();
    this.devices = await this.bt.getDevices();
    await this.bt.ensureListening();
  }

  async toDo(name, address) {
    console.log('connect' + name + address);
    this.overlayClass = 'overlay';
    if (await this.bt.connect({
      name: name,
      address: address
    })) {
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

  async sddNewDevice() {
    await this.bt.openSettings();
    await this.changeBtState();
  }

}
