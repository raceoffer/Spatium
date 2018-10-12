import { BehaviorSubject, Subject } from 'rxjs';

export enum State {
  Closed,
  Opening,
  Opened,
  Closing
}

export abstract class Socket {
  public state = new BehaviorSubject<State>(State.Closed);
  public data  = new Subject<Buffer>();

  public abstract async open(): Promise<void>;
  public abstract async write(data: Buffer): Promise<void>;
  public abstract async close(): Promise<void>;
}
