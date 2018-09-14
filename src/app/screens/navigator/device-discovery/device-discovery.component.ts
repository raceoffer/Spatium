import { Component, EventEmitter, HostBinding, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavigationService } from '../../../services/navigation.service';
import { Device } from '../../../services/primitives/device';
import { SsdpService } from '../../../services/ssdp.service';
import { toBehaviourSubject } from '../../../utils/transformers';

@Component({
  selector: 'app-device-discovery',
  templateUrl: './device-discovery.component.html',
  styleUrls: ['./device-discovery.component.css']
})
export class DeviceDiscoveryComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() selected = new EventEmitter<Device>();

  public devices: BehaviorSubject<Device[]> = toBehaviourSubject(this.ssdp.devices.pipe(
      map(d => Array.from(d.values()))
  ), []);

  constructor(
    private readonly ssdp: SsdpService,
    private readonly navigationService: NavigationService
  ) { }

  async ngOnInit() {
    await this.startDiscovery();
  }

  async ngOnDestroy() {
    await this.ssdp.stop();
  }

  onBack() {
    this.navigationService.back();
  }

  async startDiscovery() {
    this.ssdp.reset();
    await this.ssdp.searchDevices();
  }

  connectTo(device: Device) {
    this.selected.next(device);
  }
}
