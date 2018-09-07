import { Injectable } from '@angular/core';
import ipfsAPI from 'ipfs-api';

declare const window;

export class File {
  path: string;
  content: Buffer;

  constructor(path: string, content: Buffer) {
    this.path = path;
    this.content = content;
  }

  static fromJSON(json) {
    return new File(json.path, json.content);
  }
}

export class FileInfo {
  path: string;
  hash: string;
  size: number;

  constructor(path: string, hash: string, size: number) {
    this.path = path;
    this.hash = hash;
    this.size = size;
  }

  static fromJSON(json) {
    return new FileInfo(json.path, json.hash, json.size);
  }
}

@Injectable()

export class IpfsService {
  private host: string = '185.219.80.169';
  private port: string = '5001';

  private ipfs: any = ipfsAPI(this.host, this.port, {protocol: 'http'});

  constructor() {}

  public async add(files: File[]) {
    const res = await this.ipfs.add(files, { recursive: true });
    return res.map(file => FileInfo.fromJSON(file));
  }

  public async get(cid: any) {
    const files = await this.ipfs.files.get(cid);
    return files.map(file => File.fromJSON(file));
  }
}
