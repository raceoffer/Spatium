import { BehaviorSubject, Observable } from 'rxjs';
import { Device } from '../primitives/device';
import { ConnectionState, State } from '../primitives/state';

export interface IConnectionProvider {
  state: BehaviorSubject<State>;
  connectionState: BehaviorSubject<ConnectionState>;
  listeningState: BehaviorSubject<State>;

  searchState: BehaviorSubject<State>;
  discoveryState: BehaviorSubject<State>;

  devices: BehaviorSubject<Map<string, Device>>;
  connectedDevice: BehaviorSubject<Device>;

  message: Observable<string>;

  enable();
  reset();

  startListening();
  stopListening();

  searchDevices(duration: number);

  connect(to: Device);
  disconnect(): void;

  send(message: any): void;

  enableDiscovery(): void;
}
