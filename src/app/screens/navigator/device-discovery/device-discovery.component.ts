import { Component, EventEmitter, HostBinding, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavigationService } from '../../../services/navigation.service';
import { Device, Provider } from '../../../services/primitives/device';
import { SsdpService } from '../../../services/ssdp.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { BluetoothService } from '../../../services/bluetooth.service';

@Component({
  selector: 'app-device-discovery',
  templateUrl: './device-discovery.component.html',
  styleUrls: ['./device-discovery.component.css']
})
export class DeviceDiscoveryComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() selected = new EventEmitter<Device>();
  @Output() cancelled = new EventEmitter<any>();

  public providerType = Provider;

  public devices: BehaviorSubject<Device[]> = toBehaviourSubject(combineLatest([
    this.ssdp.devices.pipe(
      map(d => Array.from(d.values()))
    ),
    this.bluetooth.devices.pipe(
      map(d => Array.from(d.values()))
    )
  ]).pipe(
    map(([wifiDevices, bluetoothDevices]) => wifiDevices.concat(bluetoothDevices))
  ), []);

  constructor(
    private readonly ssdp: SsdpService,
    private readonly bluetooth: BluetoothService,
    private readonly navigationService: NavigationService
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

  connectTo(device: Device) {
    this.selected.next(device);
  }

  getConnectedIcon(device) {
    switch (device.provider) {
      case Provider.Bluetooth:
        return 'bluetooth';
      case Provider.Wifi:
        return 'wifi';
    }
  }
}
