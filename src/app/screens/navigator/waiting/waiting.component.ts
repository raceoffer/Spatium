import {AfterViewInit, Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService, Device } from '../../../services/bluetooth.service';
import { WalletService } from '../../../services/wallet.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { NavigationService } from '../../../services/navigation.service';
import { MatDialog } from '@angular/material';

declare const navigator: any;

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  enableBTmessage = 'Turn on Bluetooth to proceed';
  stLabel = 'Connect to a device';
  Label = this.stLabel;

  enabled = this.bt.enabled;
  discovering = this.bt.discovering;
  connected = false;
  ready = this.wallet.ready;
  connectedDevice = this.bt.connectedDevice;

  private subscriptions = [];

  devices = [];
  nextConnected = false;


  constructor(
    public dialog: MatDialog,
    private bt: BluetoothService,
    private wallet: WalletService,
    private router: Router,
    private readonly navigationService: NavigationService
  ) {  }

  ngOnInit() {

    if (this.ready.getValue()) {
      this.Label = 'Connected to ' + this.bt.connectedDevice.getValue().name;
    }

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.bt.disconnect();
        this.Label = this.stLabel;
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.bt.disconnect();
        this.Label = this.stLabel;
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        this.wallet.startSync();
        await this.router.navigate(['/navigator', { outlets: { 'navigator': ['wallet'] } }]);
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.cancelSync();
        await this.wallet.reset();
        if (!this.nextConnected) {
          this.Label = this.stLabel;
        }
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
    console.log('');
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

    if (this.ready.getValue()) {
      this.openDialog(new Device(name, address));
    } else {
      console.log('connect' + name + address);
      this.Label = 'Connecting to ' + name;
      this.connected = true;
      await this.bt.cancelDiscovery();
      if (!await this.bt.connect(new Device(name, address))) {
        this.connected = false;
        this.Label = this.stLabel;
      }
    }
  }

  async startDiscovery() {
    await this.bt.startDiscovery();
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', { outlets: { navigator: ['wallet'] } }]);
  }

  async cancelConnect() {
    this.openDialog(null);
  }

  async openDialog(device: Device) {
    navigator.notification.confirm(
      'Cancel synchronization',
      async (buttonIndex) => {
        if (buttonIndex === 1) { // yes
          await this.bt.disconnect();

          if (device != null) {
            this.nextConnected = true;
            console.log('connect' + device.name + device.address);
            this.Label = 'Connecting to ' + device.name;
            this.connected = true;
            await this.bt.cancelDiscovery();
            if (!await this.bt.connect(device)) {
              this.connected = false;
              this.Label = this.stLabel;
            }
            this.nextConnected = false;
          }
        }
      },
      '',
      ['YES', 'NO']
    );
  }
}
