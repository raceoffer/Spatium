import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
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

  devices = [];

  constructor(private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
              private ngZone: NgZone ) {}

  ngOnInit() {
    this.wallet.resetRemote();
    this.wallet.onFinish.subscribe(() => {
      console.log(this.wallet.address);
      this.ngZone.run(() => {
        this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      });
    });
    this.bt.onConnected.subscribe( () => {
      this.wallet.setKeyFragment(this.wallet.generateFragment());
      this.wallet.startSync();
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

  toDo(name, address): void {
    this.router.navigate(['/connect'], { queryParams: { name: name, address: address } });
  }

  async sddNewDevice() {
    await this.bt.openSettings();
    await this.changeBtState();
  }

}
