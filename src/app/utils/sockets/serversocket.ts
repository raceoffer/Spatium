import { BehaviorSubject, Subject } from 'rxjs';
import { Socket } from './socket';

export enum State {
  Stopped,
  Starting,
  Started,
  Stopping
}

export abstract class ServerSocket {
  public state  = new BehaviorSubject<State>(State.Stopped);
  public opened = new Subject<Socket>();

  public abstract async stop(): Promise<void>;
}
