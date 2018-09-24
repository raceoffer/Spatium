import { Socket, State } from './socket';

declare const cordova: any;

export interface Address {
  host: string;
  port: number;
}

export interface ConnectedSocket {
  socket: any;
}

export function isAddress(options: Address | ConnectedSocket): options is Address {
  return (options as Address).host !== undefined;
}

export function isConnectedSocket(options: Address | ConnectedSocket): options is ConnectedSocket {
  return (options as ConnectedSocket).socket !== undefined;
}

export class PlainSocket extends Socket {
  private socket: any;
  private host: string;
  private port: number;

  public constructor(options: Address | ConnectedSocket) {
    super();

    if (isAddress(options)) {
      this.socket = new cordova.plugins.sockets.Socket();
      this.host = options.host;
      this.port = options.port;
    } else {
      this.socket = options.socket;
      this.host = null;
      this.port = null;
    }

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

  public async open(): Promise<void> {
    if (!this.host || !this.port) {
      throw new Error('The socket does not support connecting');
    }

    if (this.state.getValue() !== State.Closed) {
      await this.close();
    }

    this.state.next(State.Opening);

    try {
      await this.socket.openAsync(this.host, this.port);
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
