import { Component, OnDestroy } from '@angular/core';
import { ZeroconfService } from '../../../services/zeroconf.service';
import { IConnectivityManage } from '../interface/connectivity-manage';
import { ConnectionState, State } from '../../../services/primitives/state';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, skip, take, takeUntil } from 'rxjs/operators';
import { requestDialog } from '../../../utils/dialog';
import { DeviceService, Platform } from '../../../services/device.service';

declare const cordova: any;

async function waitForStateUntil(subject: BehaviorSubject<State>, state: State, cancelSubject: Subject<boolean>) {
  return  await subject.pipe(
    map(s => s === state),
    distinctUntilChanged(),
    skip(1),
    filter(s => s),
    take(1),
    takeUntil(cancelSubject)
  ).toPromise();
}

@Component({
  selector: 'app-confirmation-zeroconf-manage',
  templateUrl: './zeroconf.component.html',
  styleUrls: ['./zeroconf.component.css', '../connectivity-manage.css']
})
export class ZeroconfComponent extends IConnectivityManage implements OnDestroy {
  public stateType = State;
  public connectionStateType = ConnectionState;

  public connectedDevice = this.zeroconf.connectedDevice;

  public state = this.zeroconf.state;
  public connectionState = this.zeroconf.connectionState;
  public listeningState = this.zeroconf.listeningState;

  public toggled = new BehaviorSubject<boolean>(false);

  public cancelSubject = new Subject<boolean>();

  private subscriptions = [];

  constructor(
    private readonly zeroconf: ZeroconfService,
    private readonly deviceService: DeviceService
  ) {
    super();

    this.subscriptions.push(
      this.zeroconf.connectionState.pipe(
        map(state => state === ConnectionState.Connected),
        distinctUntilChanged(),
        skip(1)
      ).subscribe(async (connected) => {
        if (!connected && this.toggled.getValue()) {
          if (this.zeroconf.state.getValue() === State.Started) {
            await this.zeroconf.startListening();
          }
        }
      })
    );

    this.subscriptions.push(
      this.zeroconf.state.pipe(
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

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.cancel();

    try {
      await this.zeroconf.stopListening();
    } catch (ignored) {}

    try {
      await this.zeroconf.disconnect();
    } catch (ignored) {}
  }

  async toggle(event) {
    if (event.checked) {
      this.toggled.next(true);

      if (this.state.getValue() === State.Stopped) {
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
        if (!await waitForStateUntil(this.state, State.Started, this.cancelSubject)) {
          this.toggled.next(false);
          return;
        }
      }

      await this.zeroconf.startListening();

      if (!await waitForStateUntil(this.listeningState, State.Started, this.cancelSubject)) {
        this.toggled.next(false);
        return;
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
