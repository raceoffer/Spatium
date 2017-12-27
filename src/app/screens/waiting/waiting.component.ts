import {AfterViewInit, Component, OnInit} from '@angular/core';
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
              private router: Router) {}

  ngOnInit() {
    this.wallet.onFinish = () => {
      console.log(this.wallet.address);
      this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}, queryParams: { isSecond: false }}]);
    };
    this.bt.onConnected.subscribe( () => {
      this.wallet.setKeyFragment(this.wallet.generateFragment());
      this.wallet.startSync();
    });
    this.bt.onDisconnected.subscribe(() => {
      this.router.navigate(['/waiting']);
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

  goWallet(): void{
    this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
}

}
