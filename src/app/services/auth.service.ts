import {Injectable} from '@angular/core';

declare const Utils: any;
declare const Buffer: any;

@Injectable()
export class AuthService {
  login: string;
  qr: string;
  nfc: string;
  factors: Factor[] = [];
  reg_factors: Factor[] = [];
  available: AvailableFactor[] = [];

  encryptedSeed: string = null;

  ethereumSecret: any = null;
  encryptedTreeData: any = null;
  remoteEncryptedTrees: Array<any> = [];

  static toId(name: string): string {
    return Utils.sha256(Buffer.from(name, 'utf-8')).toString('hex');
  }

  constructor() {
    this.available.push(new AvailableFactor(FactorType.PIN, 'PIN', FactorIcon.PIN,
      FactorIconAsset.PIN, FactorLink.PIN));
    this.available.push(new AvailableFactor(FactorType.PASSWORD, 'Password', FactorIcon.PASSWORD,
      FactorIconAsset.PASSWORD, FactorLink.PASSWORD));
    this.available.push(new AvailableFactor(FactorType.FILE, 'File', FactorIcon.FILE,
      FactorIconAsset.FILE, FactorLink.FILE));
    this.available.push(new AvailableFactor(FactorType.GRAPHIC_KEY, 'Graphic key', FactorIcon.GRAPHIC_KEY,
      FactorIconAsset.GRAPHIC_KEY, FactorLink.GRAPHIC_KEY));
    this.available.push(new AvailableFactor(FactorType.QR, 'QR', FactorIcon.QR,
      FactorIconAsset.QR, FactorLink.QR));
    this.available.push(new AvailableFactor(FactorType.NFC, 'NFC', FactorIcon.NFC,
      FactorIconAsset.NFC, FactorLink.NFC));
  }

  getAllAvailableFactors() {
    return this.available;
  }

  addFactor(type, value) {
    switch (type) {
      case FactorType.PIN: {
        this.factors.push(new Factor(FactorType.PIN, FactorIcon.PIN, FactorIconAsset.PIN, value));
        break;
      }
      case FactorType.PASSWORD: {
        this.factors.push(new Factor(FactorType.PASSWORD, FactorIcon.PASSWORD, FactorIconAsset.PASSWORD, value));
        break;
      }
      case FactorType.FILE: {
        this.factors.push(new Factor(FactorType.FILE, FactorIcon.FILE, FactorIconAsset.FILE, value));
        break;
      }
      case FactorType.GRAPHIC_KEY: {
        this.factors.push(new Factor(FactorType.GRAPHIC_KEY, FactorIcon.GRAPHIC_KEY, FactorIconAsset.GRAPHIC_KEY, value));
        break;
      }
      case FactorType.QR: {
        this.factors.push(new Factor(FactorType.QR, FactorIcon.QR, FactorIconAsset.QR, value));
        break;
      }
      case FactorType.NFC: {
        this.factors.push(new Factor(FactorType.NFC, FactorIcon.NFC, FactorIconAsset.NFC, value));
        break;
      }
    }
  }

  rmFactor(factor) {
    this.factors.splice(this.factors.indexOf(factor), 1);
  }

  clearFactors() {
    this.factors = [];
  }
}

  export enum FactorType {
    PIN,
    PASSWORD,
    FILE,
    GRAPHIC_KEY,
    QR,
    NFC
  }

  export enum FactorIcon {
    PIN = 'dialpad',
    PASSWORD = 'keyboard',
    FILE = 'insert_drive_file',
    GRAPHIC_KEY = '',
    QR = '',
    NFC = 'nfc'
  }

  export enum FactorIconAsset {
    PIN = '',
    PASSWORD = '',
    FILE = '',
    GRAPHIC_KEY = 'graphic-key',
    QR = 'qr-code',
    NFC = ''
  }

  export enum FactorLink {
    PIN = 'pincode',
    PASSWORD = 'password',
    FILE = 'file-upload',
    GRAPHIC_KEY = 'graphic-key',
    QR = 'qr-code',
    NFC = 'nfc'
  }

  export class AvailableFactor {
    type: FactorType;
    name: string;
    icon: string;
    icon_asset: string;
    link: string;

    constructor(type, name, icon, icon_asset, link) {
      this.type = type;
      this.name = name;
      this.icon = icon;
      this.icon_asset = icon_asset;
      this.link = link;
    }
  }

  export class Factor {
    type: FactorType;
    icon: string;
    icon_asset: string;
    value: any;

    constructor(type, icon, asset, value) {
      this.type = type;
      this.icon = icon;
      this.icon_asset = asset;
      this.value = value;
    }

    public toBuffer() {
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(this.type, 0);

      return Utils.sha256(Buffer.concat([prefix, this.value]));
    }
  }

