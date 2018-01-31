import { AfterViewInit, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService, Device } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit {
  enableBTmessage = 'Turn on Bluetooth to proceed';
  Label = 'Connect to a device';
  overlayClass = 'overlay invisible';

  enabled = this.bt.enabled;
  discovering = this.bt.discovering;
  synchronizing = this.wallet.synchronizing;

  devices = [];

  constructor(
    private bt: BluetoothService,
    private wallet: WalletService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  async ngOnInit() {
    await this.bt.disconnect();
    this.wallet.readyEvent.subscribe(() =>  this.ngZone.run(async () => {
      console.log(this.wallet.address.getValue());
      await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
    }));
    this.wallet.cancelledEvent.subscribe(async () => {
      await this.bt.disconnect();
    });
    this.wallet.failedEvent.subscribe(async () => {
      await this.bt.disconnect();
    });
    this.bt.connectedEvent.subscribe(() => this.ngZone.run(async () => {
      console.log('Connected to', this.bt.connectedDevice.getValue());
      await this.wallet.startSync();
      this.overlayClass = 'overlay invisible';
    }));
    this.bt.disconnectedEvent.subscribe(() => this.ngZone.run(async () => {
      console.log('Disconnected');
      await this.wallet.cancelSync();
      await this.router.navigate(['/waiting']);
    }));
    combineLatest(this.bt.discoveredDevices, this.bt.pairedDevices, (discovered, paired) => {
      const devices = paired.map(device => {
        const json = device.toJSON();
        json.paired = true;
        return json;
      });
      discovered.forEach(device => {
        for (let i = 0; i < devices.length; ++i) {
          if (devices[i].name === device.name && devices[i].address === device.address) {
            return;
          }
        }
        const json = device.toJSON();
        json.paired = false;
        devices.push(json);
      });
      return devices;
    }).subscribe(devices => this.devices = devices);
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    }
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async connectTo(name, address) {
    console.log('connect' + name + address);
    this.overlayClass = 'overlay';
    await this.bt.cancelDiscovery();
    if (!await this.bt.connect(new Device(name, address))) {
      this.overlayClass = 'overlay invisible';
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    }
  }

  async startDiscovery() {
    this.bt.startDiscovery();
  }
}
