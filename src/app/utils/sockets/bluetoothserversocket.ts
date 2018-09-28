import { ServerSocket, State } from './serversocket';
import { State as SocketState } from './socket';
import { BluetoothSocket } from './bluetoothsocket';

declare const cordova: any;

export class BluetoothServerSocket extends ServerSocket {
  private serverSocket: any;

  public constructor() {
    super();

    this.serverSocket = new cordova.plugins.bluetooth.BluetoothServerSocket();
    this.serverSocket.onOpened = (socket: any) => {
      const bluetoothSocket = new BluetoothSocket({
        socket
      });
      bluetoothSocket.state.next(SocketState.Opened);
      this.opened.next(bluetoothSocket);
    };
    this.serverSocket.onStopped = () => {
      this.state.next(State.Stopped);
    };
  }

  public async start(): Promise<void> {
    if (this.state.getValue() !== State.Stopped) {
      throw new Error('Failed to start a busy server socket');
    }

    this.state.next(State.Starting);

    try {
      await this.serverSocket.startAsync();
      this.state.next(State.Started);
    } catch (e) {
      this.state.next(State.Stopped);
      console.error('Failed to start server socket: ' + e);
      // throw new Error('Failed to start server socket: ' + e);
    }
  }

  public async stop(): Promise<void> {
    if (this.state.getValue() === State.Stopped) {
      return;
    }

    this.state.next(State.Stopping);

    try {
      await this.serverSocket.stopAsync();
      this.state.next(State.Stopped);
    } catch (e) {
      this.state.next(State.Stopped);
      throw new Error('Failed to stop server socket: ' + e.message);
    }
  }
}
