import { Injectable } from '@angular/core';

declare var window;
declare var cordova;
declare var Web3;
declare var DDS;
declare var bcoin;
declare var CompoundKey;


@Injectable()
export class BitcoinKeyFragmentService {
  ready = false;
  ddsKeyFilename = 'initiatorDDS.key';
  bitcoinKeyFragmentFilename = 'enc_initiator.key';
  infuraToken = 'DKG18gIcGSFXCxcpvkBm';
  aesKey = Buffer.from("57686f277320796f75722064616464793f313837333631393832373336383133f75722064616464793f3138373336313","hex");
  ddsNoData = 'No data in Decentralized Storage';
  ddsKeyNotFound = 'Bitcoin key is not found in the Decentralized Storage';
  ddsNotAvailable = 'Decentralized Storage is not available';
  localKeyNotFound = 'Bitcoin key is not found on the device';

  async generateBitcoinKeyFragment() {
    const initiatorDDSKey = await this.generateDDSKey();  // ensure DDS key saved locally
    const bitcoinKeyFragment = CompoundKey.generateKeyring();
    const encodedBitcoinKeyFragment = bcoin.utils.base58.encode(BitcoinKeyFragmentService.encrypt(bitcoinKeyFragment.getPrivateKey(), this.aesKey));
    await this.writeToFile(this.bitcoinKeyFragmentFilename, encodedBitcoinKeyFragment);
    return bitcoinKeyFragment;
  }

  async keyFromSeed(seed) {
    return CompoundKey.fromSeed(seed);
  }

  async keyringFromSeed(seed) {
    return CompoundKey.keyringFromSeed(seed);
  }

  async loadBitcoinKeyFragment() {
    /* try to get bitcoin key fragment from DDS using DDS key,
       if failed - try to get bitcoin key fragment from local file.
     */
    let initiatorDDSKey;
    let bitcoinKeyFragment;
    try {
      initiatorDDSKey = await this.loadDDSKey();
      const initiatorDDS = new DDS({
        privateKey: initiatorDDSKey,
        infuraToken: this.infuraToken
      });
      const initiatorDDSData = await initiatorDDS.read();
      if (!initiatorDDSData) {
        console.warn('No data in DDS - reading key from a local file');
        window.plugins.toast.showLongBottom(this.ddsNoData, 3000, this.ddsNoData, console.log(this.ddsNoData));
        throw new Error(this.ddsKeyNotFound);
      }
      bitcoinKeyFragment = bcoin.keyring.fromPrivate(BitcoinKeyFragmentService.decrypt(bcoin.utils.base58.decode(initiatorDDSData), this.aesKey));
      return bitcoinKeyFragment;
    }
    catch (keyError) {
      window.plugins.toast.showLongBottom(this.ddsNotAvailable, 3000, this.ddsKeyFilename, console.log(this.ddsNotAvailable));
      try {
        bitcoinKeyFragment = bcoin.keyring.fromPrivate(BitcoinKeyFragmentService.decrypt(
          bcoin.utils.base58.decode(await this.readFromFile(this.bitcoinKeyFragmentFilename)), this.aesKey));
        return bitcoinKeyFragment;
      }
      catch (fileError) {
        throw new Error(this.localKeyNotFound);
      }
    }
  }

  async getDDS() {
    const ddsKey = await this.loadDDSKey();
    return new DDS({
      privateKey: ddsKey,
      infuraToken: this.infuraToken
    });
  }

  async getEthereumAddress() {
    const dds = await this.getDDS();
    return dds.address;
  }

  async getEthereumBalance() {
    const dds = await this.getDDS();
    const balance = await dds.getBalance();
    return Web3.utils.fromWei(balance);
  }

  async loadDDSKey(): Promise<string> {
    return this.readFromFile(this.ddsKeyFilename);
  }

  async generateDDSKey(): Promise<string> {
    const web3 = new Web3();
    const initiatorDDSKey = web3.eth.accounts.create().privateKey;
    await this.writeToFile(this.ddsKeyFilename, initiatorDDSKey);
    return initiatorDDSKey;
  }

  async sendBitcoinKeyFragmentAsEthereumTransaction() {
    const dds = await this.getDDS();
    const bitcoinKeyFragment = await this.loadBitcoinKeyFragment();
    return dds.store({
      data: bcoin.utils.base58.encode(BitcoinKeyFragmentService.encrypt(bitcoinKeyFragment.getPrivateKey(),this.aesKey)),
      gasPrice: Web3.utils.toWei('5', 'gwei')
    });
  }

  async sendBitcoinKeyFragment(fragment) {
    const dds = await this.getDDS();
    return dds.store({
      data: bcoin.utils.base58.encode(BitcoinKeyFragmentService.encrypt(fragment.getPrivateKey(),this.aesKey)),
      gasPrice: Web3.utils.toWei('5', 'gwei')
    });
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

  private static decrypt (ciphertext, secret) {
    return bcoin.crypto.aes.decipher(ciphertext,secret.slice(0,32),secret.slice(32,48));
  };

  private static encrypt (buffer, secret) {
    return bcoin.crypto.aes.encipher(buffer,secret.slice(0,32),secret.slice(32,48));
  };
}
