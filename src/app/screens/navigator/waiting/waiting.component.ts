import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Subject } from 'rxjs';
import { BluetoothService, Device } from '../../../services/bluetooth.service';
import { NavigationService } from '../../../services/navigation.service';
import { map, take, takeUntil } from "rxjs/operators";
import { NotificationService } from "../../../services/notification.service";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public enabled = this.bt.enabled;
  public discovering = this.bt.discovering;
  public connectedDevice = this.bt.connectedDevice;
  public connecting = new BehaviorSubject<boolean>(false);

  private cancel = new Subject<any>();

  @Output() connected = new EventEmitter<Device>();

  public devices = combineLatest([
      this.bt.discoveredDevices,
      this.bt.pairedDevices
    ]).pipe(
      map(([ discovered, paired ]) => {
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
      })
    );

  constructor(
    private readonly bt: BluetoothService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly auth: AuthService,
  ) {}

  async ngOnInit() {
    if (!this.enabled.getValue()) {
      await this.bt.requestEnable();
    }
  }

  async connectTo(name, address) {
    if (this.connecting.getValue()) {
      return;
    }

    try {
      this.connecting.next(true);

      await this.bt.disconnect();
      await this.bt.cancelDiscovery();

      const device = new Device(name, address);

      const result = await from(this.bt.connect(device)).pipe(take(1), takeUntil(this.cancel)).toPromise();
      if (typeof result === 'undefined') {
        // assume cancelled
      } else if(!result) {
        throw new Error('Conenction error');
      } else {
        this.connected.next(device)
      }
    } catch (ignored) {
      this.notification.show('Failed to connect to ' + name);
    } finally {
      this.connecting.next(false);
    }
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async startDiscovery() {
    await this.bt.startDiscovery();
  }

  onBack() {
    this.cancel.next(true);
    this.auth.theUserHasDeclinedSyncronization = true;
    this.navigationService.back();
  }
}
