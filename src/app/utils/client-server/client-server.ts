import { Reader, Root } from 'protobufjs';
import { v4 as uuid } from 'uuid';
import { distinctUntilChanged, skip, filter } from 'rxjs/operators';
import { Socket, State } from '../sockets/socket';

import { abi } from './protocol';

export enum ErrorCode {
  None = 0,
  BadRequest = 1,
  NotListening = 2,
  RuntimeError = 3
}

export class Client {
  private root: Root;
  private requestQueue = [];
  private responseAccumulator = Buffer.alloc(0);

  private static bufferUUID() {
    const uuidArray = [];
    uuid(undefined, uuidArray);
    return Buffer.from(uuidArray);
  }

  public constructor (private socket: Socket) {
    this.root = Root.fromJSON(abi);

    this.socket.data.subscribe(async (data) => {
      await this.handleData(data);
    });

    this.socket.state.pipe(
      distinctUntilChanged(),
      skip(1),
      filter(state => [State.Closing, State.Closed].includes(state))
    ).subscribe(() => {
      this.handleDisconnect();
    });
  }

  public async request(data: Buffer): Promise<Buffer> {
    const Request = this.root.lookupType('Request');

    if (this.socket.state.getValue() !== State.Opened) {
      throw new Error('Request failed: Not connected');
    }

    const id = Client.bufferUUID();

    const message = new Buffer(Request.encodeDelimited({
      id: id,
      data: data
    }).finish());

    await this.socket.write(message);

    return await new Promise((resolve: (buffer: Buffer) => void, reject: (error: Error) => void) => {
      this.requestQueue.push({ id, resolve, reject });
    });
  }

  private async handleData(data: Buffer): Promise<void> {
    const Response = this.root.lookupType('Response');

    this.responseAccumulator = Buffer.concat([this.responseAccumulator, data]);

    const reader = Reader.create(this.responseAccumulator);

    const packets = [];
    let lastPos = 0;

    try {
      while (true) {
        const packet = reader.bytes();
        lastPos = reader.pos;
        packets.push(packet);
      }
    } catch (ignored) {}

    this.responseAccumulator = this.responseAccumulator.slice(lastPos);

    for (let i = 0; i < packets.length; ++i) {
      const packet: any = Response.decode(packets[i]);

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
    const Error = this.root.lookupType('Error');
    const error: any = Error.decode(data);
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
  private responseAccumulator = Buffer.alloc(0);

  private requestHandler: (data: Buffer) => Buffer = null;

  public constructor (private socket: Socket) {
    this.root = Root.fromJSON(abi);

    this.socket.data.subscribe(async (data) => {
      await this.handleData(data);
    });

    this.socket.state.pipe(
      distinctUntilChanged(),
      skip(1),
      filter(state => [State.Closing, State.Closed].includes(state))
    ).subscribe(() => {
      this.handleDisconnect();
    });
  }

  public setRequestHandler(handler: (data: Buffer) => Buffer): void {
    this.requestHandler = handler;
  }

  private async handleData(data: Buffer): Promise<void> {
    const Request = this.root.lookupType('Request');

    this.responseAccumulator = Buffer.concat([this.responseAccumulator, data]);

    const reader = Reader.create(this.responseAccumulator);

    const packets = [];
    let lastPos = 0;

    try {
      while (true) {
        const packet = reader.bytes();
        lastPos = reader.pos;
        packets.push(packet);
      }
    } catch (ignored) {}

    this.responseAccumulator = this.responseAccumulator.slice(lastPos);

    for (let i = 0; i < packets.length; ++i) {
      try {
        const packet: any = Request.decode(packets[i]);

        await this.handleRequest(packet);
      } catch (ignored) {} // Suddenly, if we cannot decode the packet, we cannot send a proper response
    }
  }

  private async handleRequest(request: any): Promise<void> {
    const id = new Buffer(request.id);
    const data = new Buffer(request.data);
    if (this.requestHandler) {
      try {
        const response = this.requestHandler(data);
        await this.respond(id, ErrorCode.None, response);
      } catch (e) {
        await this.respond(id, ErrorCode.RuntimeError, this.encodeError(e.message ? e.message : e.toString()));
      }
    } else {
      await this.respond(id, ErrorCode.NotListening, this.encodeError('The server is not ready for communication'));
    }
  }

  private encodeError(message: string): Buffer {
    const Error = this.root.lookupType('Error');
    return new Buffer(Error.encode({
      message: message
    }).finish());
  }

  private async respond(id: Buffer, error: ErrorCode, data: Buffer): Promise<void> {
    const Response = this.root.lookupType('Response');

    const message = new Buffer(Response.encodeDelimited({
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
