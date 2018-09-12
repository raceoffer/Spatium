import { BehaviorSubject, Observable } from 'rxjs';
import { Device } from '../primitives/device';
import { ConnectionState, State } from '../primitives/state';

export enum ProviderType {
  BLUETOOTH,
  ZEROCONF,
  SSDP
}

export interface IConnectionProvider {
  supported: BehaviorSubject<boolean>;

  deviceState: BehaviorSubject<State>;

  connectionState: BehaviorSubject<ConnectionState>;

  serverState: BehaviorSubject<State>;
  listeningState: BehaviorSubject<State>;
  connectableState: BehaviorSubject<State>;

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

  resetDevices();
  searchDevices(duration: number);
  cancelSearch();

  connect(to: Device);
  disconnect();

  refreshConnection();

  send(message: string);

  enableDiscovery();
}
