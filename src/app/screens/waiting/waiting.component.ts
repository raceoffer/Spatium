import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService, Device } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { NavigationService } from '../../services/navigation.service';

declare const device: any;
@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit, OnDestroy {
  enableBTmessage = 'Turn on Bluetooth to proceed';
  Label = 'Connect to a device';
  overlayClass = 'overlay invisible';

  enabled = this.bt.enabled;
  discovering = this.bt.discovering;
  synchronizing = this.wallet.synchronizing;

  syncBool = false;

  private subscriptions = [];

  devices = [];

  constructor(
    private bt: BluetoothService,
    private wallet: WalletService,
    private router: Router,
    private readonly navigationService: NavigationService
  ) {  }

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
        await this.router.navigate(['/navigator', { outlets: { 'navigator': ['wallet'] } }]);
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
      this.bt.connectedEvent.subscribe(async () => {
        console.log('Connected to', this.bt.connectedDevice.getValue());
        await this.wallet.startSync();
        this.overlayClass = 'overlay invisible';
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.cancelSync();
        this.overlayClass = 'overlay invisible';
      }));

    this.subscriptions.push(
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
      }).subscribe(devices => this.devices = devices));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
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
    }
  }

  async startDiscovery() {
    await this.bt.startDiscovery();
  }

  async onBackClicked() {
    await this.router.navigate(['/start']);
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  async cancelConnect() {
    await this.wallet.cancelSync();
  }
}
