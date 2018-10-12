import { Socket, State } from './socket';

declare const cordova: any;

export interface Address {
  address: string;
}

export interface ConnectedSocket {
  socket: any;
}

export function isAddress(options: Address | ConnectedSocket): options is Address {
  return (options as Address).address !== undefined;
}

export function isConnectedSocket(options: Address | ConnectedSocket): options is ConnectedSocket {
  return (options as ConnectedSocket).socket !== undefined;
}

export class BluetoothSocket extends Socket {
  private socket: any;
  private address: string;

  public constructor(options: Address | ConnectedSocket) {
    super();

    if (isAddress(options)) {
      this.socket = new cordova.plugins.bluetooth.BluetoothSocket();
      this.address = options.address;
    } else {
      this.socket = options.socket;
      this.address = null;
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
    if (!this.address) {
      throw new Error('The socket does not support connecting');
    }

    if (this.state.getValue() !== State.Closed) {
      throw new Error('Failed to open a busy socket');
    }

    this.state.next(State.Opening);

    try {
      await this.socket.openAsync(this.address);
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
