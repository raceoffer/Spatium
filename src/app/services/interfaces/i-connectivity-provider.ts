import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Device } from '../primitives/device';
import { ConnectionState, State } from '../primitives/state';

export interface IConnectionProvider {

  state: BehaviorSubject<State>;

  starting: BehaviorSubject<boolean>;
  stopping: BehaviorSubject<boolean>;

  enabled: BehaviorSubject<boolean>;
  enabledChanged: Observable<boolean> ;
  enabledEvent: Observable<any>;
  disabledEvent: Observable<any>;

  connectionState: BehaviorSubject<ConnectionState>;
  connectionStateChanged: Observable<ConnectionState>;

  connected: BehaviorSubject<boolean>;
  connectedChanged: Observable<boolean>;
  connectedEvent: Observable<any>;
  disconnectedEvent: Observable<any>;

  listening: BehaviorSubject<boolean>;
  listeningChanged: Observable<any>;
  listeningStartedEvent: Observable<any>;
  listeningStoppedEvent: Observable<any>;

  discoveryState: BehaviorSubject<State>;
  discovering: BehaviorSubject<boolean>;
  discoveringChanged: Observable<any>;
  discoveryStartedEvent: Observable<any>;
  discoveryStoppedEvent: Observable<any>;

  discoverableState: BehaviorSubject<State>;
  discoverable: BehaviorSubject<boolean>;
  discoverableChanged: Observable<boolean>;
  discoverableStartedEvent: Observable<any>;
  discoverableFinishedEvent: Observable<any>;

  devices: BehaviorSubject<Map<string, Device>>;

  message: Subject<any>;
  isToggler: BehaviorSubject<boolean>;
  awaitingEnable: BehaviorSubject<boolean>;

  toggleProvider(): void;

  startListening(): void;

  stopListening(): void;

  searchDevices(duration: number): void;

  connect(connectTo: any): void ;

  disconnect(): void;

  send(message: any): void;

  enableDiscovery(): void;

}
