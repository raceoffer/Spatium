import { Injectable } from '@angular/core';

declare const window;
declare const cordova;
declare const Web3;
declare const DDS;
declare const bcoin;
declare const CompoundKey: any;

@Injectable()
export class BitcoinKeyFragmentService {
  ready = false;
  ddsKeyFilename = 'dds.key';
  partialKeyFilename = 'partial.key';

  infuraToken = 'DKG18gIcGSFXCxcpvkBm';
  aesKey = Buffer.from('57686f277320796f75722064616464793f313837333631393832373336383133f75722064616464793f3138373336313', 'hex');

  ddsNoData = 'No data in Decentralized Storage';
  ddsKeyNotFound = 'Bitcoin key is not found in the Decentralized Storage';
  ddsNotAvailable = 'Decentralized Storage is not available';
  localKeyNotFound = 'Bitcoin key is not found on the device';

  dds: any = null;

  async ensureReady() {
    if (!this.dds) {
      let ddsKey = null;
      try {
        ddsKey = await this.loadDDSKey();
      } catch (e) { }

      if (!ddsKey) {
        ddsKey = this.generateDDSKey();

        window.plugins.toast.showLongBottom(
          'Generated a new DDS key',
          3000,
          'Generated a new DDS key',
          console.log('Generated a new DDS key')
        );
      }

      try {
        await this.saveDDSKey(ddsKey);
      } catch (e) {
        window.plugins.toast.showLongBottom(
          'Failed to save DDS key locally',
          3000,
          'Failed to save DDS key locally',
          console.log('Failed to save DDS key locally')
        );
      }

      this.dds = new DDS({
        privateKey: ddsKey,
        infuraToken: this.infuraToken
      });
    }
  }

  async getEthereumAddress() {
    return this.dds.address;
  }

  async getEthereumBalance() {
    const balance = await this.dds.getBalance();
    return Web3.utils.fromWei(balance);
  }

  async loadDDSKey(): Promise<string> {
    return this.readFromFile(this.ddsKeyFilename);
  }

  generateDDSKey() {
    const web3 = new Web3();
    return web3.eth.accounts.create().privateKey;
  }

  async saveDDSKey(ddsKey) {
    await this.writeToFile(this.ddsKeyFilename, ddsKey);
  }

  async sendBitcoinKeyFragment(fragment) {
    // return this.dds.store({
    //   data: bcoin.utils.base58.encode(BitcoinKeyFragmentService.encrypt(fragment.getPrivateKey(), this.aesKey)),
    //   gasPrice: Web3.utils.toWei('5', 'gwei')
    // });
  }

  async removeFile(filename: string): Promise<any> {
    await this.ensureDeviceReady();
    return new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.remove(resolve);
        }, reject);
      });
    });
  }

  private async writeToFile(filename, text) {
    return new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, { create: true }, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const data = new Blob([text], {type: 'text/plain'});
            fileWriter.write(data);
            resolve();
          });
        });
      });
    });
  }

  private async readFromFile(filename): Promise<string> {
    await this.ensureDeviceReady();
    return new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.file(file => {
            const reader = new FileReader();
            reader.onloadend = (e: any) => {
              const initiatorDDSKey = e.target.result;
              resolve(initiatorDDSKey);
            };
            reader.readAsText(file);
          });
        }, reject);
      });
    });
  }

  private ensureDeviceReady(): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.ready) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }
}
