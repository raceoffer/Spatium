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
  public serverReady = this.zeroconf.serverReady;

  public globalConnectionState = this.connectionProvider.connectionState;

  public toggled = new BehaviorSubject<boolean>(false);

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
      ).subscribe(() => {
        this.cancel();
        this.toggled.next(false);
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

    try {
      await this.zeroconf.stopServer();
    } catch (ignored) {}

    try {
      await this.zeroconf.disconnect();
    } catch (ignored) {}
  }

  async toggle(event) {
    if (event.checked) {
      this.toggled.next(true);

      if (this.deviceState.getValue() === State.Stopped) {
        if (!await requestDialog('The application wants to enable Bluetooth')) {
          this.toggled.next(false);
          return;
        }

        if (this.deviceService.platform !== Platform.IOS) {
          await this.zeroconf.enable();
        }

        // Well, now sit down and listen to daddy:
        // - Right after we've initiated enabling of the BT
        // - We start listening to state changes, waiting for State.Started
        // - That lasts up until we receive the necessary event or this.cancelSubject emits,
        // - Telling us that we should abort the process
        // - If so, the awaited promise resolves with 'false', which is otherwise impossible due to 'filter'
        // - So, here's the story, thank you for your attention
        if (!await waitForSubject(this.deviceState, State.Started, this.cancelSubject)) {
          this.toggled.next(false);
          return;
        }
      }

      if (this.connectionProvider.connectionState.getValue() === ConnectionState.None) {
        await this.zeroconf.startListening();
      }
    } else {
      this.toggled.next(false);

      this.cancel();

      try {
        await this.zeroconf.stopListening();
      } catch (ignored) {}

      try {
        await this.zeroconf.disconnect();
      } catch (ignored) {}
    }
  }

  public cancel() {
    this.cancelSubject.next(true);
  }

  networkSettings() {
    if (this.deviceService.platform === Platform.IOS) {
      cordova.plugins.diagnostic.switchToSettings();
    } else {
      cordova.plugins.diagnostic.switchToWifiSettings();
    }
  }
}
