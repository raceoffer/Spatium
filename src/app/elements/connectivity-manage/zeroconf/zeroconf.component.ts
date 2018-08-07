import { Component, OnDestroy, OnInit } from '@angular/core';
import { ZeroconfService } from '../../../services/zeroconf.service';
import { IConnectivityManage } from '../interface/connectivity-manage';
import { ConnectionState, State } from '../../../services/primitives/state';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, skip } from 'rxjs/operators';
import { requestDialog } from '../../../utils/dialog';
import { DeviceService, Platform } from '../../../services/device.service';
import { waitForSubject } from '../../../utils/transformers';
import { ConnectionProviderService } from '../../../services/connection-provider';

declare const cordova: any;

@Component({
  selector: 'app-confirmation-zeroconf-manage',
  templateUrl: './zeroconf.component.html',
  styleUrls: ['./zeroconf.component.css', '../connectivity-manage.css']
})
export class ZeroconfComponent extends IConnectivityManage implements OnInit, OnDestroy {
  public stateType = State;
  public connectionStateType = ConnectionState;

  public connectedDevice = this.zeroconf.connectedDevice;

  public deviceState = this.zeroconf.deviceState;
  public connectionState = this.zeroconf.connectionState;
  public listeningState = this.zeroconf.listeningState;
  public serverState = this.zeroconf.serverState;

  public connectableState = this.zeroconf.connectableState;

  public connectableStateScheduled = this.zeroconf.connectableStateScheduled;

  public globalConnectionState = this.connectionProvider.connectionState;

  public toggled = new BehaviorSubject<boolean>(false);

  public waiting = new BehaviorSubject<boolean>(false);

  public cancelSubject = new Subject<boolean>();

  private subscriptions = [];

  constructor(
    private readonly zeroconf: ZeroconfService,
    private readonly deviceService: DeviceService,
    private readonly connectionProvider: ConnectionProviderService
  ) {
    super();

    this.subscriptions.push(
      this.connectionProvider.connectionState.pipe(
        map(state => state === ConnectionState.Connected),
        distinctUntilChanged(),
        skip(1)
      ).subscribe(async (connected) => {
        if (connected) {
          await this.zeroconf.stopListening();
        } else if (this.toggled.getValue()) {
          if (this.zeroconf.deviceState.getValue() === State.Started && this.toggled.getValue()) {
            await this.zeroconf.startListening();
          }
        }
      })
    );

    this.subscriptions.push(this.zeroconf.listeningState.pipe(
      map(state => state === State.Stopped),
      distinctUntilChanged(),
      skip(1),
      filter(s => s)
    ).subscribe(async () => {
      if (
        this.toggled.getValue() &&
        this.zeroconf.deviceState.getValue() === State.Started &&
        this.connectionProvider.connectionState.getValue() === ConnectionState.None
      ) {
        await this.zeroconf.startListening();
      }
    }));

    this.subscriptions.push(
      this.zeroconf.deviceState.pipe(
        map(state => state !== State.Started),
        distinctUntilChanged(),
        skip(1),
        filter(stopped => stopped)
      ).subscribe(async () => {
        await this.toggle({ checked: false });
      })
    );
  }

  async ngOnInit() {
    await this.zeroconf.startServer();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.cancel();

    await this.zeroconf.reset();
  }

  async toggle(event) {
    if (event.checked) {
      this.toggled.next(true);
      this.waiting.next(true);

      // now try to start server once again in case it has failed o start once
      if (this.serverState.getValue() !== State.Started) {
        await this.zeroconf.startServer();
      }

      if (!await waitForSubject(this.serverState, State.Started, this.cancelSubject)) {
        this.waiting.next(false);
        this.toggled.next(false);
        return;
      }

      if (!await waitForSubject(this.deviceState, State.Started, this.cancelSubject)) {
        this.waiting.next(false);
        this.toggled.next(false);
        return;
      }

      this.waiting.next(false);

      if (this.connectionProvider.connectionState.getValue() === ConnectionState.None) {
        await this.zeroconf.startListening();
      }
    } else {
      this.toggled.next(false);

      this.cancel();

      await this.zeroconf.stopListening();
      await this.zeroconf.disconnect();
    }
  }

  public cancel() {
    this.cancelSubject.next(true);
  }

  async enableWifi() {
    if (this.deviceService.platform === Platform.Android) {
      if (await requestDialog('The application wants to enable Wifi')) {
        await this.zeroconf.enable();
      }
    } else {
      this.networkSettings();
    }
  }

  networkSettings() {
    if (this.deviceService.platform === Platform.IOS) {
        cordova.plugins.settings.open("wifi", function() {
          console.log('opened wifi settings');
      },
      function () {
          console.log('failed to open wifi settings');
      }
    );
    // cordova.plugins.diagnostic.switchToSettings();
    } else {
      cordova.plugins.diagnostic.switchToWifiSettings();
    }
  }
}
