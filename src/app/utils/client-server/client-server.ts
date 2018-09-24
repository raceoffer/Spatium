import { Reader, Root } from 'protobufjs';
import { timer } from 'rxjs';
import { distinctUntilChanged, filter, skip } from 'rxjs/operators';
import uuid from 'uuid/v4';
import { Socket, State } from '../sockets/socket';
import { waitFiorPromise } from '../transformers';
import { abi } from './protocol';

export enum ErrorCode {
  None = 0,
  BadRequest = 1,
  NotListening = 2,
  RuntimeError = 3
}

export class NetworkError extends Error {}

export class Client {
  private root: Root;

  private Request: any;
  private Response: any;
  private Error: any;

  private requestQueue = [];
  private responseAccumulator = Buffer.alloc(0);

  public state = this.socket.state;

  public defaultTimeout = 10000;
  public defaultRetries = 1;

  private disconnected = this.state.pipe(
    distinctUntilChanged(),
    skip(1),
    filter(state => [State.Closing, State.Closed].includes(state))
  );

  private static bufferUUID(): Buffer {
    const uuidArray = [];
    uuid(undefined, uuidArray);
    return Buffer.from(uuidArray);
  }

  public constructor (private socket: Socket) {
    this.root = Root.fromJSON(abi);

    this.Request = this.root.lookupType('Request');
    this.Response = this.root.lookupType('Response');
    this.Error = this.root.lookupType('Error');

    this.socket.data.subscribe(async (data) => {
      await this.handleData(data);
    });

    this.disconnected.subscribe(() => {
      this.handleDisconnect();
    });
  }

  public async request(
    data: Buffer,
    timeout: number = this.defaultTimeout,
    retries: number = this.defaultRetries
  ): Promise<Buffer> {
    const id = Client.bufferUUID();

    const message = new Buffer(this.Request.encodeDelimited({
      id: id,
      data: data
    }).finish());

    let response = null;
    let tries = 0;
    let needsReconnect = false;
    do {
      tries++;

      // try reconnect first
      if (this.socket.state.getValue() !== State.Opened || needsReconnect) {
        try {
          await this.socket.open();
        } catch (ignored) {
          throw new NetworkError('Request failed: Failed to restore connection');
        }
      }

      // case one: write failes immediately
      try {
        this.socket.write(message);
      } catch (e) {
        needsReconnect = true;
        continue;
      }

      response = await waitFiorPromise(new Promise((resolve: (buffer: Buffer) => void, reject: (error: Error) => void) => {
        this.requestQueue.push({ id, resolve, reject });
      }), timeout > 0 ? timer(timeout) : undefined);

      // case two: request failes by timeout
      if (!response) {
        needsReconnect = true;
      }
    } while (!response && tries < retries + 1);

    if (!response) {
      throw new NetworkError('Request failed: Maximum retries reached');
    }

    return response;
  }

  public async open(): Promise<void> {
    return await this.socket.open();
  }

  public async close(): Promise<void> {
    return await this.socket.close();
  }

  private async handleData(data: Buffer): Promise<void> {
    this.responseAccumulator = Buffer.concat([this.responseAccumulator, data]);

    const reader = Reader.create(this.responseAccumulator);

    const packets = [];
    let lastPos = 0;

    try {
      // noinspection InfiniteLoopJS
      while (true) {
        const packet = reader.bytes();
        lastPos = reader.pos;
        packets.push(packet);
      }
    } catch (ignored) {}

    this.responseAccumulator = this.responseAccumulator.slice(lastPos);

    for (let i = 0; i < packets.length; ++i) {
      const packet: any = this.Response.decode(packets[i]);

      await this.handleResponse(packet);
    }
  }

  private async handleResponse(response: any): Promise<void> {
    const id = new Buffer(response.id);
    const error = response.error as ErrorCode;
    const data = new Buffer(response.data);

    const requestIndex = this.requestQueue.findIndex(entry => entry.id.equals(id));

    const resolve = this.requestQueue[requestIndex].resolve;
    const reject = this.requestQueue[requestIndex].reject;

    this.requestQueue.splice(requestIndex, 1);

    if (error === ErrorCode.None) {
      resolve(data);
    } else {
      reject(new Error('Request failed: ' + this.decodeError(data)));
    }
  }

  private decodeError(data: Buffer): string {
    const error: any = this.Error.decode(data);
    return error.message;
  }

  private handleDisconnect(): void {
    this.requestQueue.forEach(entry => {
      entry.reject(new Error('Request failed: Peer disconnected'));
    });
    this.requestQueue = [];
    this.responseAccumulator = Buffer.alloc(0);
  }
}

export class Server {
  private root: Root;

  private Request: any;
  private Response: any;
  private Error: any;

  private responseAccumulator = Buffer.alloc(0);

  private requestHandler: (data: Buffer) => Promise<Buffer> = null;

  public state = this.socket.state;

  private disconnected = this.state.pipe(
    distinctUntilChanged(),
    skip(1),
    filter(state => [State.Closing, State.Closed].includes(state))
  );

  public constructor (private socket: Socket) {
    this.root = Root.fromJSON(abi);

    this.Request = this.root.lookupType('Request');
    this.Response = this.root.lookupType('Response');
    this.Error = this.root.lookupType('Error');

    this.socket.data.subscribe(async (data) => {
      await this.handleData(data);
    });

    this.disconnected.subscribe(() => {
      this.handleDisconnect();
    });
  }

  public setRequestHandler(handler: (data: Buffer) => Promise<Buffer>): void {
    this.requestHandler = handler;
  }

  public async close(): Promise<void> {
    return await this.socket.close();
  }

  private async handleData(data: Buffer): Promise<void> {
    this.responseAccumulator = Buffer.concat([this.responseAccumulator, data]);

    const reader = Reader.create(this.responseAccumulator);

    const packets = [];
    let lastPos = 0;

    try {
      // noinspection InfiniteLoopJS
      while (true) {
        const packet = reader.bytes();
        lastPos = reader.pos;
        packets.push(packet);
      }
    } catch (ignored) {}

    this.responseAccumulator = this.responseAccumulator.slice(lastPos);

    for (let i = 0; i < packets.length; ++i) {
      try {
        const request = this.Request.decode(packets[i]);

        await this.handleRequest(request);
      } catch (ignored) {} // Suddenly, if we cannot decode the packet, we cannot send a proper response
    }
  }

  private async handleRequest(request: any): Promise<void> {
    const id = new Buffer(request.id);
    const data = new Buffer(request.data);

    if (this.requestHandler) {
      try {
        const response = await this.requestHandler(data);
        await this.respond(id, ErrorCode.None, response);
      } catch (e) {
        await this.respond(id, ErrorCode.RuntimeError, this.encodeError(e.message ? e.message : e.toString()));
      }
    } else {
      await this.respond(id, ErrorCode.NotListening, this.encodeError('The server is not ready for communication'));
    }
  }

  private encodeError(message: string): Buffer {
    return new Buffer(this.Error.encode({
      message: message
    }).finish());
  }

  private async respond(id: Buffer, error: ErrorCode, data: Buffer): Promise<void> {
    const message = new Buffer(this.Response.encodeDelimited({
      id: id,
      error: error,
      data: data
    }).finish());

    await this.socket.write(message);
  }

  private handleDisconnect(): void {
    this.responseAccumulator = Buffer.alloc(0);
  }
}
