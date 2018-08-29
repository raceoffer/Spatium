import { Injectable } from '@angular/core';
import { Root } from 'protobufjs';

import { abi } from './protocol';

const Api = {
  Capabilities: function (request) {
    if (request.token !== 'ahsgdfahsgdf') {
      throw new Error('Invalid token');
    }

    return {
      appVersionMajor: 0,
      appVersionMinor: 16,
      appVersionPatch: 16,
      supportedProtocolVersions: [1, 2, 3]
    };
  },
  Handshake: function (request) {
    return {
      known: new Buffer(request.sessionId).equals(Buffer.from('ffffaadd', 'hex')),
      sessionId: Buffer.from('ffaadd00', 'hex')
    };
  }
};

@Injectable()
export class RPCServerService {
  private root: Root;
  private RpcCall: any;
  private RpcService: any;

  constructor() {
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

    if (Object.keys(Api).includes(rpcCall.method)) {
      const response = await Api[rpcCall.method](request);

      return new Buffer(ResponseType.encode(response).finish());
    } else {
      throw new Error('Method not supported');
    }
  }
}
