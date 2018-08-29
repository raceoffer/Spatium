import { Injectable } from '@angular/core';
import { Root } from 'protobufjs';

import { abi } from './protocol';
import { DeviceService } from '../device.service';

@Injectable()
export class RPCServerService {
  private root: Root;
  private RpcCall: any;
  private RpcService: any;

  private api = {
    Capabilities: async () => {
      const appInfo: any = await this.deviceService.appInfo();
      const version = appInfo.version.match(/^(\d+)\.(\d+)\.(\d+)(\.\d+)?$/);
      return {
        appVersionMajor: version[1],
        appVersionMinor: version[2],
        appVersionPatch: version[3],
        supportedProtocolVersions: [1]
      };
    },
    Handshake: function (request) {
      return {
        known: new Buffer(request.sessionId).equals(Buffer.from('ffffaadd', 'hex')),
        sessionId: Buffer.from('ffaadd00', 'hex')
      };
    }
  };

  constructor(private readonly deviceService: DeviceService) {
    this.root = Root.fromJSON(abi);
    this.RpcCall = this.root.lookupType('RpcCall');
    this.RpcService = this.root.lookup('RpcService');
  }

  public async handleRequest(data: Buffer): Promise<Buffer> {
    const rpcCall = this.RpcCall.decode(data);

    const requestTypeName = this.RpcService.methods[rpcCall.method].requestType;
    const responseTypeName = this.RpcService.methods[rpcCall.method].responseType;

    const RequestType = this.root.lookupType(requestTypeName);
    const ResponseType = this.root.lookupType(responseTypeName);

    const request = RequestType.decode(rpcCall.data);

    if (Object.keys(this.api).includes(rpcCall.method)) {
      const response = await this.api[rpcCall.method](request);

      return new Buffer(ResponseType.encode(response).finish());
    } else {
      throw new Error('Method not supported');
    }
  }
}
