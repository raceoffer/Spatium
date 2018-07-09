import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Device } from '../primitives/device';
import { ConnectionState, State } from '../primitives/state';

export interface IConnectionProvider {

  toggled: BehaviorSubject<boolean>;

  // module state
  state: BehaviorSubject<State>;

  enabling: BehaviorSubject<boolean>;
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

  // service state
  listeningState: BehaviorSubject<State>;
  stopped: BehaviorSubject<boolean>;
  starting: BehaviorSubject<boolean>;
  stopping: BehaviorSubject<boolean>;
  listening: BehaviorSubject<boolean>;
  listeningChanged: Observable<any>;
  listeningStartedEvent: Observable<any>;
  listeningStoppedEvent: Observable<any>;

  discovering: BehaviorSubject<boolean>;
  discoveringChanged: Observable<any>;
  discoveryStartedEvent: Observable<any>;
  discoveryFinishedEvent: Observable<any>;

  discoverable: BehaviorSubject<boolean>;
  discoverableChanged: Observable<boolean>;
  discoverableStartedEvent: Observable<any>;
  discoverableFinishedEvent: Observable<any>;

  devices: BehaviorSubject<Map<string, Device>>;
  devicesChanged: Observable<Map<string, Device>>;
  connectedDevices: BehaviorSubject<Array<Device>>;

  message: Subject<any>;

  toggleProvider(): void;

  startListening(): void;

  stopListening(): void;

  stopServiceListening(): void;

  searchDevices(duration: number): void;

  connect(connectTo: any): void ;

  disconnect(): void;

  send(message: any): void;

  enableDiscovery(): void;

}
