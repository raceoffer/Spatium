import { BehaviorSubject, Observable } from 'rxjs';
import { Device } from '../primitives/device';
import { ConnectionState, State } from '../primitives/state';

export enum ProviderType {
  BLUETOOTH,
  ZEROCONF
}

export interface IConnectionProvider {
  deviceState: BehaviorSubject<State>;

  connectionState: BehaviorSubject<ConnectionState>;

  serverState: BehaviorSubject<State>;
  listeningState: BehaviorSubject<State>;
  serverReady: BehaviorSubject<State>;

  searchState: BehaviorSubject<State>;
  discoveryState: BehaviorSubject<State>;

  devices: BehaviorSubject<Map<string, Device>>;
  connectedDevice: BehaviorSubject<Device>;

  message: Observable<string>;

  enable();
  reset();

  startServer();
  stopServer();

  startListening();
  stopListening();

  searchDevices(duration: number);

  connect(to: Device);
  disconnect(): void;

  send(message: any): void;

  enableDiscovery(): void;
}
