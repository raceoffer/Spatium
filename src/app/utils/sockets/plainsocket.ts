import { Socket, State } from './socket';

declare const cordova: any;

export class PlainSocket extends Socket {
  private socket: any;

  public constructor(socket?: any) {
    super();

    this.socket = socket || new cordova.plugins.sockets.Socket();
    this.socket.onData = (data) => {
      this.data.next(Buffer.from(data));
    };
    this.socket.onClose = () => {
      this.state.next(State.Closed);
    };
  }

  public async write(data: Buffer): Promise<void> {
    if (this.state.getValue() !== State.Opened) {
      throw new Error('Failed to write to a busy socket');
    }

    await this.socket.writeAsync(data);
  }

  public async open(host: string, port: number): Promise<void> {
    if (this.state.getValue() !== State.Closed) {
      throw new Error('Failed to open a busy socket');
    }

    this.state.next(State.Opening);

    try {
      await this.socket.openAsync(host, port);
      this.state.next(State.Opened);
    } catch (e) {
      this.state.next(State.Closed);
      throw new Error('Failed to open socket: ' + e);
    }
  }

  public async close(): Promise<void> {
    if (this.state.getValue() === State.Closed) {
      return;
    }

    this.state.next(State.Closing);

    try {
      await this.socket.closeAsync();
      this.state.next(State.Closed);
    } catch (e) {
      this.state.next(State.Closed);
      throw new Error('Failed to close socket: ' + e);
    }
  }
}
