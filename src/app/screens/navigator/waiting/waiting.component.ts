import { AfterViewInit, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { BluetoothService, Device } from '../../../services/bluetooth.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';

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
  connectedDevice = this.bt.connectedDevice;
  devices = [];
  nextConnected = false;
  private subscriptions = [];

  constructor(public dialog: MatDialog,
              private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
              private readonly navigationService: NavigationService) { }

  ngOnInit() {

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        this.wallet.sendSessionKey(false);
        await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
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
    this.bt.disconnect();
    console.log('connect' + name + address);
    this.Label = 'Connecting to ' + name;
    this.connected = true;
    await this.bt.cancelDiscovery();
    if (!await this.bt.connect(new Device(name, address))) {
      this.connected = false;
      this.Label = this.stLabel;
    }
  }

  async startDiscovery() {
    await this.bt.startDiscovery();
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
  }
}
