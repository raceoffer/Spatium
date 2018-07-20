import { Component, OnDestroy, OnInit } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { ConnectionState, State } from '../../../services/primitives/state';
import { IConnectivityManage } from '../interface/connectivity-manage';
import { BehaviorSubject, Subject } from 'rxjs';
import { requestDialog } from '../../../utils/dialog';
import { distinctUntilChanged, map, skip, filter } from 'rxjs/operators';
import { waitForSubject } from '../../../utils/transformers';
import { ConnectionProviderService } from '../../../services/connection-provider';

@Component({
  selector: 'app-confirmation-bluetooth-manage',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../connectivity-manage.css']
})
export class BluetoothComponent extends IConnectivityManage implements OnInit, OnDestroy {
  public stateType = State;
  public connectionStateType = ConnectionState;

  public connectedDevice = this.bt.connectedDevice;

  public deviceState = this.bt.deviceState;
  public connectionState = this.bt.connectionState;

  public globalConnectionState = this.connectionProvider.connectionState;

  public listeningState = this.bt.listeningState;
  public serverState = this.bt.serverState;
  public connectableState = this.bt.connectableState;

  public discoveryState = this.bt.discoveryState;

  public toggled = new BehaviorSubject<boolean>(false);
  public waiting = new BehaviorSubject<boolean>(false);

  public cancelSubject = new Subject<boolean>();

  private subscriptions = [];

  constructor(
    private readonly bt: BluetoothService,
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
          await this.bt.stopListening();
        } else if (this.toggled.getValue()) {
          if (this.bt.deviceState.getValue() === State.Started) {
            await this.bt.startListening();
          }
        }
      })
    );

    this.subscriptions.push(this.bt.listeningState.pipe(
      map(state => state === State.Stopped),
      distinctUntilChanged(),
      skip(1),
      filter(s => s)
    ).subscribe(async () => {
      if (
        this.toggled.getValue() &&
        this.bt.deviceState.getValue() === State.Started &&
        this.connectionProvider.connectionState.getValue() === ConnectionState.None
      ) {
        await this.bt.startListening();
      }
    }));

    this.subscriptions.push(
      this.bt.deviceState.pipe(
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
    await this.bt.startServer();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.cancel();

    try {
      await this.bt.stopServer();
    } catch (ignored) {}

    try {
      await this.bt.disconnect();
    } catch (ignored) {}
  }

  async toggle(event) {
    if (event.checked) {
      this.toggled.next(true);
      this.waiting.next(true);

      // Well, now sit down and listen to daddy:
      // - Right after we've initiated enabling of the BT
      // - We start listening to state changes, waiting for State.Started
      // - That lasts up until we receive the necessary event or this.cancelSubject emits,
      // - Telling us that we should abort the process
      // - If so, the awaited promise resolves with 'false', which is otherwise impossible due to 'filter'
      // - So, here's the story, thank you for your attention
      if (!await waitForSubject(this.deviceState, State.Started, this.cancelSubject)) {
        this.waiting.next(false);
        this.toggled.next(false);
        return;
      }

      this.waiting.next(false);

      if (this.connectionProvider.connectionState.getValue() === ConnectionState.None) {
        await this.bt.startListening();
      }
    } else {
      this.toggled.next(false);

      this.cancel();

      try {
        await this.bt.stopListening();
      } catch (ignored) {}

      try {
        await this.bt.disconnect();
      } catch (ignored) {}
    }
  }

  async enableBluetooth() {
    if (await requestDialog('The application wants to enable Bluetooth')) {
      await this.bt.enable();
    }
  }

  public cancel() {
    this.cancelSubject.next(true);
  }

  async enableDiscovery() {
    await this.bt.enableDiscovery();
  }
}
