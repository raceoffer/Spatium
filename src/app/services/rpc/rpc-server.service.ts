import { Injectable } from '@angular/core';
import {
  EcdsaInitialCommitment,
  EcdsaInitialDecommitment,
  EcdsaResponseCommitment,
  EcdsaResponseDecommitment,
  EddsaCommitment,
  EddsaDecommitment,
  Marshal,
  Utils
} from 'crypto-core-async';
import { Root } from 'protobufjs';
import { DeviceService } from '../device.service';
import { VerifierService } from '../verifier.service';

import * as abi from './rpc-protocol.json';
import { Server } from '../../utils/client-server/client-server';
import { PlainServerSocket } from '../../utils/sockets/plainserversocket';
import { distinctUntilChanged, skip, filter } from 'rxjs/operators';
import { State, Socket } from '../../utils/sockets/socket';
import { KeyChainService } from '../keychain.service';
import { uuidFrom } from '../../utils/uuid';

@Injectable()
export class RPCServerService {
  private root: Root;
  private RpcCall: any;
  private RpcService: any;

  private api = {
    verifierService: this._verifierService,
    deviceService: this._deviceService,
    keyChainService: this._keyChainService,

    async Capabilities() {
      const appInfo: any = await this.deviceService.appInfo();
      const deviceInfo: any = await this.deviceService.deviceInfo();
      const version = appInfo.version.match(/^(\d+)\.(\d+)\.(\d+)(\.\d+)?$/);
      return {
        deviceInfo: {
          id: deviceInfo.uuid,
          displayName: deviceInfo.model,
          appVersionMajor: version[1],
          appVersionMinor: version[2],
          appVersionPatch: version[3]
        },
        supportedProtocolVersions: [1]
      };
    },
    async Handshake(request) {
      return {
        existing: await this.verifierService.registerSession(request.sessionId, request.deviceInfo),
        peerId: uuidFrom(await Utils.sha256(this.keyChainService.seed))
      };
    },
    async ClearSession(request) {
      return {
        existing: await this.verifierService.clearSession(request.sessionId)
      };
    },
    async SyncStatus(request) {
      return {
        statuses: await this.verifierService.syncStatus(request.sessionId)
      };
    },
    async SyncState(request) {
      return {
        state: await this.verifierService.syncState(request.sessionId, request.currencyId)
      };
    },

    async StartEcdsaSync(request) {
      const initialData = await this.verifierService.startEcdsaSync(
        request.sessionId,
        request.currencyId,
        EcdsaInitialCommitment.fromJSON(request.initialCommitment)
      );

      return {
        initialData: initialData.toJSON()
      };
    },
    async EcdsaSyncReveal(request) {
      const challengeCommitment = await this.verifierService.ecdsaSyncReveal(
        request.sessionId,
        request.currencyId,
        EcdsaInitialDecommitment.fromJSON(request.initialDecommitment)
      );

      return {
        challengeCommitment: challengeCommitment.toJSON()
      };
    },
    async EcdsaSyncResponse(request) {
      const challengeDecommitment = await this.verifierService.ecdsaSyncResponse(
        request.sessionId,
        request.currencyId,
        EcdsaResponseCommitment.fromJSON(request.responseCommitment)
      );

      return {
        challengeDecommitment: challengeDecommitment.toJSON()
      };
    },
    async EcdsaSyncFinalize(request) {
      await this.verifierService.ecdsaSyncFinalize(
        request.sessionId,
        request.currencyId,
        EcdsaResponseDecommitment.fromJSON(request.responseDecommitment)
      );

      return {};
    },

    async StartEcdsaSign(request) {
      const entropyData = await this.verifierService.startEcdsaSign(
        request.sessionId,
        request.currencyId,
        request.tokenId,
        request.signSessionId,
        new Buffer(request.transactionBytes),
        Marshal.decode(request.entropyCommitmentBytes)
      );

      return {
        entropyDataBytes: Marshal.encode(entropyData)
      };
    },
    async EcdsaSignFinalize(request) {
      const partialSignature = await this.verifierService.ecdsaSignFinalize(
        request.sessionId,
        request.currencyId,
        request.signSessionId,
        Marshal.decode(request.entropyDecommitmentBytes)
      );

      return {
        partialSignatureBytes: Marshal.encode(partialSignature)
      };
    },

    async StartEddsaSync(request) {
      const data = await this.verifierService.startEddsaSync(
        request.sessionId,
        request.currencyId,
        EddsaCommitment.fromJSON(request.commitment)
      );

      return {
        data: data.toJSON()
      };
    },
    async EddsaSyncFinalize(request) {
      await this.verifierService.eddsaSyncFinalize(
        request.sessionId,
        request.currencyId,
        EddsaDecommitment.fromJSON(request.decommitment)
      );

      return {};
    },

    async StartEddsaSign(request) {
      const entropyData = await this.verifierService.startEddsaSign(
        request.sessionId,
        request.currencyId,
        request.tokenId,
        request.signSessionId,
        new Buffer(request.transactionBytes),
        Marshal.decode(request.entropyCommitmentBytes)
      );

      return {
        entropyDataBytes: Marshal.encode(entropyData)
      };
    },
    async EddsaSignFinalize(request) {
      const partialSignature = await this.verifierService.eddsaSignFinalize(
        request.sessionId,
        request.currencyId,
        request.signSessionId,
        Marshal.decode(request.entropyDecommitmentBytes)
      );

      return {
        partialSignatureBytes: Marshal.encode(partialSignature)
      };
    }
  };

  private _plainServerSocket: PlainServerSocket = null;
  private _servers = new Set<Server>();

  constructor(
    private readonly _deviceService: DeviceService,
    private readonly _verifierService: VerifierService,
    private readonly _keyChainService: KeyChainService
  ) {
    this.root = Root.fromJSON(abi as any);
    this.RpcCall = this.root.lookupType('RpcCall');
    this.RpcService = this.root.lookup('RpcService');

    this._deviceService.deviceReady().then(() => {
      this._plainServerSocket = new PlainServerSocket();
      this._plainServerSocket.opened.subscribe(async (socket: Socket) => {
        const server = new Server(socket);

        socket.state.pipe(
          distinctUntilChanged(),
          skip(1),
          filter(state => [State.Closing, State.Closed].includes(state))
        ).subscribe(() => {
          this._servers.delete(server);
        });

        server.setRequestHandler(async (data) => {
          return await this.handleRequest(data);
        });

        this._servers.add(server);
      });
    });
  }

  public async handleRequest(data: Buffer): Promise<Buffer> {
    const rpcCall = this.RpcCall.decode(data);

    const requestTypeName = this.RpcService.methods[rpcCall.method].requestType;
    const responseTypeName = this.RpcService.methods[rpcCall.method].responseType;

    const RequestType = this.root.lookupType(requestTypeName);
    const ResponseType = this.root.lookupType(responseTypeName);

    const request = RequestType.decode(rpcCall.data);

    console.log(request);

    if (Object.keys(this.api).includes(rpcCall.method)) {
      const response = await this.api[rpcCall.method](request);

      return new Buffer(ResponseType.encode(response).finish());
    } else {
      throw new Error('Method not supported');
    }
  }

  public async start(iface: string, port: number): Promise<void> {
    return await this._plainServerSocket.start(iface, port);
  }

  public async stop(): Promise<void> {
    for (const server of Array.from(this._servers.values())) {
      await server.close();
    }

    this._servers.clear();

    return await this._plainServerSocket.stop();
  }
}
