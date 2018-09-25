import { Component, EventEmitter, HostBinding, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavigationService } from '../../../services/navigation.service';
import { Device, Provider, WifiConnectionData, BluetoothConnectionData } from '../../../services/primitives/device';
import { SsdpService } from '../../../services/ssdp.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { BluetoothService } from '../../../services/bluetooth.service';
import { RPCConnectionService } from '../../../services/rpc/rpc-connection.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-device-discovery',
  templateUrl: './device-discovery.component.html',
  styleUrls: ['./device-discovery.component.css']
})
export class DeviceDiscoveryComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() connected = new EventEmitter<Device>();
  @Output() cancelled = new EventEmitter<any>();

  public providerType = Provider;

  public devices = toBehaviourSubject(combineLatest([
    this.ssdp.devices.pipe(
      map(d => Array.from(d.values()))
    ),
    this.bluetooth.devices.pipe(
      map(d => Array.from(d.values()))
    )
  ]).pipe(
    map(([wifiDevices, bluetoothDevices]) => wifiDevices.concat(bluetoothDevices))
  ), []);

  public connecting = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly ssdp: SsdpService,
    private readonly bluetooth: BluetoothService,
    private readonly navigationService: NavigationService,
    private readonly notificationService: NotificationService,
    private readonly connectionService: RPCConnectionService
  ) {}

  async ngOnInit() {
    await this.startDiscovery();
  }

  async ngOnDestroy() {
    await this.ssdp.stop();
    await this.bluetooth.stop();
  }

  public cancel() {
    this.cancelled.next();
  }

  onBack() {
    this.navigationService.back();
  }

  async startDiscovery() {
    this.ssdp.reset();
    await this.ssdp.searchDevices();
    await this.bluetooth.searchDevices();
  }

  async connectTo(device: Device) {
    if (this.connecting.getValue()) {
      return;
    }

    try {
      this.connecting.next(true);

      switch (device.provider) {
        case Provider.Bluetooth:
          await this.connectionService.connectBluetooth(device.data as BluetoothConnectionData);
          break;
        case Provider.Wifi:
          await this.connectionService.connectPlain(device.data as WifiConnectionData);
          break;
      }

      this.connected.next(device);
    } catch (e) {
      console.error(e);
      this.notificationService.show('Failed to conenct to remote device');
    } finally {
      this.connecting.next(false);
    }
  }
}
