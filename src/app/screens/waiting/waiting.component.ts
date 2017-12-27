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
  Label = 'Подключение устройства';
  connect = 'Подключиться';
  disabledBT = true;
  overlayClass = 'overlay invisible';

  devices = [];

  constructor(private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
              private ngZone: NgZone) {
  }

  ngOnInit() {
    this.wallet.resetRemote();
    this.wallet.onStatus.subscribe((status) => {
      console.log(status);
    });
    this.wallet.onFinish.subscribe(() => {
      console.log(this.wallet.address);
      this.ngZone.run(() => {
        this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      });
    });
    this.bt.onConnected.subscribe(() => {
      this.wallet.startSync();
      this.ngZone.run(() => {
        this.router.navigate(['/connect'], {queryParams: {name: '', address: ''}});
      });
    });
    this.bt.onDisconnected.subscribe(() => {
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
    console.log('connect'+name+address);
    this.overlayClass = 'overlay';
    try {
      await this.bt.connect({
        name: name,
        address: address
      });
    } catch (e) {
      console.log('connect', e);
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
