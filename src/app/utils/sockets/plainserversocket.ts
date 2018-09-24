import { ServerSocket, State } from './serversocket';
import { PlainSocket } from './plainsocket';
import { State as SocketState } from './socket';

declare const cordova: any;

export class PlainServerSocket extends ServerSocket {
  private serverSocket: any;

  public constructor() {
    super();

    this.serverSocket = new cordova.plugins.sockets.ServerSocket();
    this.serverSocket.onOpened = (socket: any) => {
      const plainSocket = new PlainSocket({
        socket
      });
      plainSocket.state.next(SocketState.Opened);
      this.opened.next(plainSocket);
    };
    this.serverSocket.onStopped = () => {
      this.state.next(State.Stopped);
    };
  }

  public async start(iface: string, port: number): Promise<void> {
    if (this.state.getValue() !== State.Stopped) {
      throw new Error('Failed to start a busy server socket');
    }

    this.state.next(State.Starting);

    try {
      await this.serverSocket.startAsync(iface, port);
      this.state.next(State.Started);
    } catch (e) {
      this.state.next(State.Stopped);
      throw new Error('Failed to start server socket: ' + e);
    }
  }

  public async stop(): Promise<void> {
    if (this.state.getValue() !== State.Stopped) {
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
