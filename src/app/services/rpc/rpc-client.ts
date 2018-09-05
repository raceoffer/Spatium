import { Root } from 'protobufjs';
import { Client } from '../../utils/client-server/client-server';

import * as abi from './rpc-protocol.json';

export class RPCClient {
  private root: Root;
  private RpcCall: any;
  private RpcService: any;

  private rpcService: any;

  private _api: any;

  constructor(private client: Client) {
    this.root = Root.fromJSON(abi as any);
    this.RpcCall = this.root.lookupType('RpcCall');
    this.RpcService = this.root.lookup('RpcService');

    this.rpcService = this.RpcService.create((m, d, c) => this.rpcProxy(m, d, c));

    this._api = Object.keys(this.RpcService.methods).reduce((api, method) => {
      const methodName = method.charAt(0).toLowerCase() + method.slice(1);
      api[methodName] = (data: any) => {
        return this.rpcService[methodName](data);
      };
      return api;
    }, {});
  }

  public get api(): any {
    return this._api;
  }

  private async rpcProxy(method, data, callback) {
    const rpcCall = new Buffer(this.RpcCall.encode({
      method: method.name,
      data: data
    }).finish());

    try {
      const result = await this.client.request(rpcCall);
      callback(null, result);
    } catch (e) {
      callback(e);
    }
  }

  public async request(method: string, data: any): Promise<any> {
    return await this.rpcService[method](data);
  }
}
