import { CurrencyWallet, Status } from "./currencywallet";
import { Coin, KeyChainService } from "../keychain.service";
import { BluetoothService } from "../bluetooth.service";
import { SignSession } from "./ecdsa/signingsession";
import { SynchronizationStatus, SyncSession } from './ecdsa/syncsession';

import { CompoundKeyEcdsa } from 'crypto-core-async';

export abstract class EcdsaCurrencyWallet extends CurrencyWallet {
  public compoundKey: any = null;
  public publicKey: any = null;

  protected syncSession: SyncSession = null;
  protected signSession: SignSession = null;

  constructor(
    network: string,
    keychain: KeyChainService,
    currency: Coin,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    worker: any
  ) {
    super(network, keychain, currency, account, messageSubject, bt, worker);
  }

  public async sync(options: any) {
    this.compoundKey = await CompoundKeyEcdsa.fromOptions({
      curve: 'secp256k1',
      secret: this.keychain.getCoinSecret(this.currency, this.account),
      paillierKeys: options.paillierKeys
    }, this.worker);

    this.status.next(Status.Synchronizing);

    this.syncSession = new SyncSession(this.compoundKey, this.messageSubject, this.bt);
    this.syncSession.status.subscribe(state => {
      this.syncProgress.next(
        Math.max(Math.min(Math.round(state * 100 / (SynchronizationStatus.Finished - SynchronizationStatus.None + 1)), 100), 0)
      );
    });
    this.syncSession.canceled.subscribe(() => {
      this.status.next(Status.Cancelled);
      this.syncSession = null;
    });
    this.syncSession.failed.subscribe(() => {
      this.status.next(Status.Failed);
      this.syncSession = null;
    });

    const data = await this.syncSession.sync();

    this.syncSession = null;

    await this.finishSync(data);
  }

  public async reset() {
    this.status.next(Status.None);

    this.compoundKey = null;
    this.publicKey = null;

    await this.cancelSync();
    await this.cancelSign();

    this.address.next(null);
    this.balance.next(null);
    this.syncProgress.next(0);
  }

  public async cancelSync() {
    if (this.syncSession) {
      await this.syncSession.cancel();
      this.syncSession = null;
    }
  }

  public async cancelSign() {
    if (this.syncSession) {
      await this.syncSession.cancel();
      this.syncSession = null;
    }
  }

  public async acceptTransaction() {
    if (this.signSession) {
      await this.signSession.submitPartialSignature();
    }
  }

  public async syncDuplicate(other: CurrencyWallet) {
    const otherEcdsa = other as EcdsaCurrencyWallet;

    this.compoundKey = otherEcdsa.compoundKey;
    this.publicKey = otherEcdsa.publicKey;
  }

  public async finishSync(data) {
    await this.compoundKey.importSyncData(data);
    this.publicKey = await this.compoundKey.compoundPublic();
  }

  public async requestTransactionVerify(transaction) {
    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        tx: await transaction.toJSON(),
        coin: this.currencyCode()
      }
    }));

    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.messageSubject,
      this.bt
    );

    this.signSession.ready.subscribe(async () => {
      await this.signSession.awaitPartialSignature();
    });
    this.signSession.canceled.subscribe(async () => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(async () => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.signed.subscribe(async () => {
      this.messageSubject.next({});
      this.acceptedEvent.next();
      this.signedEvent.next();
    });

    this.signSession.sync().catch(() => {});
  }

  public async startTransactionVerify(transaction) {
    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.messageSubject,
      this.bt
    );

    this.startVerifyEvent.next();

    this.signSession.ready.subscribe(() => {
      this.verifyEvent.next(transaction);
    });
    this.signSession.canceled.subscribe(() => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(() => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });

    this.signSession.sync().catch((e) => { console.log(e); });
  }

  public async verifySignature() {
    let verify = false;

    if (this.signSession) {
      verify = await this.signSession.transaction.verify();
    }

    return verify;
  }
}
