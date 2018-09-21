import { Root } from 'protobufjs';
import { Client } from '../../utils/client-server/client-server';

import * as abi from './rpc-protocol.json';

export class RPCClient {
  private root: Root;
  private RpcCall: any;
  private RpcService: any;

  private rpcService: any;

  public state = this.client.state;

  private _api: any;

  constructor(private client: Client) {
    this.root = Root.fromJSON(abi as any);
    this.RpcCall = this.root.lookupType('RpcCall');
    this.RpcService = this.root.lookup('RpcService');

    this._api = Object.keys(this.RpcService.methods).reduce((api, method) => {
      const methodName = method.charAt(0).toLowerCase() + method.slice(1);
      api[methodName] = async (data: any, timeout?: number) => {
        return await this.prcProxy(method, data, timeout);
      };
      return api;
    }, {});
  }

  public get api(): any {
    return this._api;
  }

  private async prcProxy(method: string, data: any, timeout?: number) {
    const requestTypeName = this.RpcService.methods[method].requestType;
    const responseTypeName = this.RpcService.methods[method].responseType;

    const RequestType = this.root.lookupType(requestTypeName);
    const ResponseType = this.root.lookupType(responseTypeName);

    const requestBytes = RequestType.encode(data).finish();

    const rpcCall = new Buffer(this.RpcCall.encode({
      method: method,
      data: requestBytes
    }).finish());

    const resultBytes = await this.client.request(rpcCall, timeout);

    return ResponseType.decode(resultBytes);
  }

  public async request(method: string, data: any): Promise<any> {
    return await this.rpcService[method](data);
  }

  public async probe(timeout: number): Promise<void> {
    await this.client.request(Buffer.alloc(0), timeout);
  }

  public async close(): Promise<void> {
    return await this.client.close();
  }
}
