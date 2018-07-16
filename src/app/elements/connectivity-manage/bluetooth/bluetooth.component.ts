import { Component, OnDestroy } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { ConnectionState, State } from '../../../services/primitives/state';
import { IConnectivityManage } from '../interface/connectivity-manage';
import { BehaviorSubject, Subject } from 'rxjs';
import { requestDialog } from '../../../utils/dialog';
import { distinctUntilChanged, map, skip, take, takeUntil, filter } from 'rxjs/operators';

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
  selector: 'app-confirmation-bluetooth-manage',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../connectivity-manage.css']
})
export class BluetoothComponent extends IConnectivityManage implements OnDestroy {
  public stateType = State;
  public connectionStateType = ConnectionState;

  public connectedDevice = this.bt.connectedDevice;

  public state = this.bt.state;
  public connectionState = this.bt.connectionState;
  public listeningState = this.bt.listeningState;
  public discoveryState = this.bt.discoveryState;

  public toggled = new BehaviorSubject<boolean>(false);

  public cancelSubject = new Subject<boolean>();

  private subscriptions = [];

  constructor(private readonly bt: BluetoothService) {
    super();

    this.subscriptions.push(
      this.bt.connectionState.pipe(
        map(state => state === ConnectionState.Connected),
        distinctUntilChanged(),
        skip(1)
      ).subscribe(async (connected) => {
        if (connected) {
          await this.bt.stopListening();
        } else if (this.toggled.getValue()) {
          if (this.bt.state.getValue() === State.Started) {
            await this.bt.startListening();
          }
        }
      })
    );

    this.subscriptions.push(
      this.bt.state.pipe(
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

    await this.bt.stopListening();
    await this.bt.disconnect();
  }

  async toggle(event) {
    if (event.checked) {
      this.toggled.next(true);

      if (this.state.getValue() === State.Stopped) {
        if (!await requestDialog('The application wants to enable Bluetooth')) {
          this.toggled.next(false);
          return;
        }

        await this.bt.enable();

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

        await this.bt.startListening();

        if (!await waitForStateUntil(this.listeningState, State.Started, this.cancelSubject)) {
          this.toggled.next(false);
          return;
        }

        console.log('Done with enabling + listening protocol');
      } else if (this.state.getValue() === State.Started) {
        await this.bt.startListening();

        if (!await waitForStateUntil(this.listeningState, State.Started, this.cancelSubject)) {
          this.toggled.next(false);
          return;
        }

        console.log('Done listening protocol');
      }
    } else {
      this.toggled.next(false);
      this.cancel();
      await this.bt.stopListening();
      await this.bt.disconnect();
    }
  }

  public cancel() {
    this.cancelSubject.next(true);
  }

  async enableDiscovery() {
    await this.bt.enableDiscovery();
  }
}
