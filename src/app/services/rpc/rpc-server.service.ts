import { Injectable } from '@angular/core';
import { Root } from 'protobufjs';

import { abi } from './protocol';
import { DeviceService } from '../device.service';
import { VerifierService } from '../verifier.service';

import { PedersenParameters, PedersenCommitment, SchnorrProof, Convert } from 'crypto-core-async';

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
    RegisterSession: async (request) => {
      return {
        existing: await this.verifierService.registerSession(new Buffer(request.sessionId))
      };
    },
    ClearSession: async (request) => {
      return {
        existing: await this.verifierService.clearSession(new Buffer(request.sessionId))
      };
    },
    SyncStatus: async (request) => {
      return {
        statuses: await this.verifierService.syncStatus(new Buffer(request.sessionId))
      };
    },
    StartSync: async (request) => {
      const r = await this.verifierService.startSync(
        new Buffer(request.sessionId),
        request.currencyId, {
          params: PedersenParameters.fromJSON(request.params),
          i: PedersenCommitment.fromJSON(request.i)
        }
      );

      return {
        Q: Convert.encodePoint(r.Q),
        proof: r.proof.toJSON()
      };
    }
  };

  constructor(
    private readonly deviceService: DeviceService,
    private readonly verifierService: VerifierService
  ) {
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
