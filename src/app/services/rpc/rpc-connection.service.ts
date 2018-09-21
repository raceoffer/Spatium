import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Client } from '../../utils/client-server/client-server';
import { PlainSocket } from '../../utils/sockets/plainsocket';
import { State } from '../../utils/sockets/socket';
import { toBehaviourSubject } from '../../utils/transformers';
import { RPCClient } from './rpc-client';
import { BluetoothSocket } from '../../utils/sockets/bluetoothsocket';

@Injectable()
export class RPCConnectionService {
  private _rpcClient = new BehaviorSubject<RPCClient>(null);

  public state = toBehaviourSubject(this._rpcClient.pipe(
    switchMap((rpcClient) => rpcClient ? rpcClient.state : of(State.Closed))
  ), State.Closed);

  public get rpcClient(): RPCClient {
    return this._rpcClient.getValue();
  }

  public async connectPlain(host: string, port: number): Promise<void> {
    await this.disconnect();

    const rpcClient = new RPCClient(new Client(new PlainSocket({ host, port })));

    this._rpcClient.next(rpcClient);

    await rpcClient.open();
  }

  public async disconnect(): Promise<void> {
    if (this.rpcClient) {
      await this.rpcClient.close();
    }
  }
}
