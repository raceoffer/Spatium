import {Injectable} from '@angular/core';


@Injectable()
export class AuthService {
  login: string;
  qr: string;
  nfc: string;
  factors: AuthService.Factor[] = [];
  available: AuthService.AvailableFactor[] = [];

  encryptedSeed: string = null;

  constructor() {
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.PIN, 'PIN', AuthService.FactorIcon.PIN,
      AuthService.FactorIconAsset.PIN, AuthService.FactorLink.PIN, 'auth', 'auth'));
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.PASSWORD, 'Password', AuthService.FactorIcon.PASSWORD,
      AuthService.FactorIconAsset.PASSWORD, AuthService.FactorLink.PASSWORD, 'auth', 'auth'));
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.FILE, 'File', AuthService.FactorIcon.FILE,
      AuthService.FactorIconAsset.FILE, AuthService.FactorLink.FILE, 'auth', 'auth'));
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.GRAPHIC_KEY, 'Graphic key', AuthService.FactorIcon.GRAPHIC_KEY,
      AuthService.FactorIconAsset.GRAPHIC_KEY, AuthService.FactorLink.GRAPHIC_KEY, 'auth', 'auth'));
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.QR, 'QR', AuthService.FactorIcon.QR,
      AuthService.FactorIconAsset.QR, AuthService.FactorLink.QR, 'auth', 'auth'));
    this.available.push(new AuthService.AvailableFactor(AuthService.FactorType.NFC, 'NFC', AuthService.FactorIcon.NFC,
      AuthService.FactorIconAsset.NFC, AuthService.FactorLink.NFC, 'auth', 'auth'));
  }

  getAllAvailableFactors(){
    return this.available;
  }

  addFactor(type, value) {
    switch (type) {
      case AuthService.FactorType.PIN: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.PIN, AuthService.FactorIcon.PIN, AuthService.FactorIconAsset.PIN, value));
        break;
      }
      case AuthService.FactorType.PASSWORD: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.PASSWORD, AuthService.FactorIcon.PASSWORD, AuthService.FactorIconAsset.PASSWORD, value));
        break;
      }
      case AuthService.FactorType.FILE: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.FILE, AuthService.FactorIcon.FILE, AuthService.FactorIconAsset.FILE, value));
        break;
      }
      case AuthService.FactorType.GRAPHIC_KEY: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.GRAPHIC_KEY, AuthService.FactorIcon.GRAPHIC_KEY, AuthService.FactorIconAsset.GRAPHIC_KEY, value));
        break;
      }
      case AuthService.FactorType.QR: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.QR, AuthService.FactorIcon.QR, AuthService.FactorIconAsset.QR, value));
        break;
      }
      case AuthService.FactorType.NFC: {
        this.factors.push(new AuthService.Factor(AuthService.FactorType.NFC, AuthService.FactorIcon.NFC, AuthService.FactorIconAsset.NFC, value));
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

export namespace AuthService {
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
    NFC = 'wifi'
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
    next: string;
    back: string;

    constructor(type, name, icon, icon_asset, link, next, back){
      this.type = type;
      this.name = name;
      this.icon = icon;
      this.icon_asset = icon_asset;
      this.link = link;
      this.next = next;
      this.back = back;
    }
  }

  export class Factor {
    type: FactorType;
    icon: string;
    icon_asset: string;
    value: string;

    constructor(type, icon, asset, value) {
      this.type = type;
      this.icon = icon;
      this.icon_asset = asset;
      this.value = value;
    }
  }
}
