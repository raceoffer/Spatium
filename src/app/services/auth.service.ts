import { Injectable } from '@angular/core';
import { DeviceService, Platform } from './device.service';

declare const nfc: any;
declare const cordova: any;

import { sha256, matchPassphrase } from 'crypto-core-async/lib/utils';

import { WorkerService } from "./worker.service";
import { checkNfc } from "../utils/nfc";

export enum IdFactor {
  Login,
  QR,
  NFC,
  Pincode,
}

export enum AuthFactor {
  Pincode,
  Password,
  File,
  GraphicKey,
  QR,
  NFC
}

export class Factor {
  type: IdFactor | AuthFactor;
  name: string;
  icon: string;
  icon_asset: string;

  constructor(type, name, icon, icon_asset) {
    this.type = type;
    this.name = name;
    this.icon = icon;
    this.icon_asset = icon_asset;
  }
}

@Injectable()
export class AuthService {
  public idFactors = new Map<IdFactor, Factor>();
  public authFactors = new Map<AuthFactor, Factor>();

  constructor(
    private readonly deviceService: DeviceService,
    private readonly workerService: WorkerService
  ) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    const nfcSupported = await checkNfc();
    const cameraSupported = await this.checkCamera();

    this.idFactors.set(IdFactor.Login, new Factor(
      IdFactor.Login,
      'Login',
      'text_fields',
      null
    ));

    if (cameraSupported) {
      this.idFactors.set(IdFactor.QR, new Factor(
        IdFactor.QR,
        'QR',
        null,
        'icon-custom-qr_code'
      ));
    }

    if (nfcSupported) {
      this.idFactors.set(IdFactor.NFC, new Factor(
        IdFactor.NFC,
        'NFC',
        'nfc',
        null
      ));
    }

    this.authFactors.set(AuthFactor.Password, new Factor(
      AuthFactor.Password,
      'Password',
      'keyboard',
      null
    ));

    this.authFactors.set(AuthFactor.Pincode, new Factor(
      AuthFactor.Pincode,
      'Pincode',
      'dialpad',
      null
    ));

    this.authFactors.set(AuthFactor.GraphicKey, new Factor(
      AuthFactor.GraphicKey,
      'Graphic key',
      null,
      'icon-custom-graphic_key'
    ));

    // this.authFactors.set(AuthFactor.File, new Factor(
    //   AuthFactor.File,
    //   'File',
    //   'insert_drive_file',
    //   null
    // ));

    if (cameraSupported) {
      this.authFactors.set(AuthFactor.QR, new Factor(
        AuthFactor.QR,
        'QR',
        null,
        'icon-custom-qr_code'
      ));
    }

    if (nfcSupported) {
      this.authFactors.set(AuthFactor.NFC, new Factor(
        AuthFactor.NFC,
        'NFC',
        'nfc',
        null
      ));
    }
  }

  private async checkCamera() {
    if (this.deviceService.platform === Platform.Windows) {
      try {
        return await cordova.plugins.cameraInfo.isAvailable();
      } catch(e) {
        console.log('Failed to check camera availability');
        return false;
      }
    }

    return true;
  }

  public async toId(name: string) {
    return await sha256(Buffer.from(name, 'utf-8'), this.workerService.worker);
  }

  public async pack(type: IdFactor | AuthFactor, value: Buffer) {
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(type, 0);

    return await sha256(Buffer.concat([prefix, value]), this.workerService.worker);
  }

  async tryDecryptWith(remoteEncryptedTrees, factor) {
    const currentData = remoteEncryptedTrees[remoteEncryptedTrees.length - 1];

    const matchResult = await matchPassphrase(currentData, await this.pack(factor.type, factor.value), this.workerService.worker);

    if (typeof matchResult.seed !== 'undefined') {
      return { success: true, seed: matchResult.seed };
    }

    if (matchResult.subtexts.length < 1) {
      return { success: false };
    }

    remoteEncryptedTrees.push(matchResult.subtexts);

    return { success: true };
  }

  makeNewLogin(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
}
