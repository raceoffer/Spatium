import { Injectable } from '@angular/core';
import { BehaviorSubject, of, interval, NEVER } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Client } from '../../utils/client-server/client-server';
import { PlainSocket } from '../../utils/sockets/plainsocket';
import { State } from '../../utils/sockets/socket';
import { toBehaviourSubject } from '../../utils/transformers';
import { RPCClient } from './rpc-client';

export enum Method {
  PlainSocket,
  BluetoothSocket
}

@Injectable()
export class RPCConnectionService {
  private _rpcClient = new BehaviorSubject<RPCClient>(null);

  private lastConnection: {
    method: Method,
    data: {
      host: string,
      port: number
    } | {
      mac: string
    }
  } = null;

  public state = toBehaviourSubject(this._rpcClient.pipe(
    switchMap((rpcClient) => rpcClient ? rpcClient.state : of(State.Closed))
  ), State.Closed);

  private probe = this.state.pipe(
    switchMap((state) => state === State.Opened ? interval(15000) : NEVER)
  );

  public get rpcClient(): RPCClient {
    return this._rpcClient.getValue();
  }

  public constructor() {
    this.probe.subscribe(async () => {
      try {
        await this.rpcClient.heartbeat(10000);
      } catch (e) {
        console.error('Probe timeout');
        await this.rpcClient.close();
      }
    });
  }

  public async connectPlain(host: string, port: number): Promise<void> {
    await this.disconnect();

    const plainSocket = new PlainSocket();

    this._rpcClient.next(new RPCClient(new Client(plainSocket)));

    await plainSocket.open(host, port);

    this.lastConnection = {
      method: Method.PlainSocket,
      data: { host, port }
    };
  }

  public async reconnect(): Promise<void> {
    if (!this.lastConnection) {
      throw new Error('No last connection data');
    }

    switch (this.lastConnection.method) {
      case Method.PlainSocket:
        const data = this.lastConnection.data as { host: string, port: number };
        await this.connectPlain(data.host, data.port);
        break;
      case Method.BluetoothSocket:
        break;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.rpcClient) {
      await this.rpcClient.close();
    }
  }
}
