import { Component, HostBinding, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { wallet as NeoWallet } from '@cityofzion/neon-js';
import BN from 'bn.js';
import * as CashAddr from 'cashaddrjs';
import { Marshal, Utils } from 'crypto-core-async';
import isNumber from 'lodash/isNumber';
import NEM from 'nem-sdk';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, tap } from 'rxjs/operators';
import * as WalletAddressValidator from 'wallet-address-validator';
import { BalanceService, BalanceStatus } from '../../../services/balance.service';
import { Cryptosystem, CurrencyId, CurrencyInfo, CurrencyInfoService } from '../../../services/currencyinfo.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { FeeLevel, PriceService } from '../../../services/price.service';
import { RPCConnectionService } from '../../../services/rpc/rpc-connection.service';
import { EcdsaCurrency, EddsaCurrency, SyncService } from '../../../services/sync.service';
import { CurrecnyModelType, CurrencyModel, SyncState, Wallet } from '../../../services/wallet/wallet';
import { WorkerService } from '../../../services/worker.service';
import { isNetworkError } from '../../../utils/client-server/client-server';
import { toBehaviourSubject, waitFiorPromise } from '../../../utils/transformers';
import { uuidFrom } from '../../../utils/uuid';
import { DeviceDiscoveryComponent } from '../device-discovery/device-discovery.component';
import { AmountValidator, validateNumber } from '../../../validators/validators';
import { BigNumber } from 'bignumber.js';

declare const cordova: any;

enum Phase {
  Creation,
  Confirmation,
  Sending
}

enum Fee {
  Manual,
  Normal,
  Economy
}

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.scss']
})
export class SendTransactionComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public phaseType = Phase; // for template
  public stateType = SyncState;
  public balanceStatusType = BalanceStatus;

  public receiverField = new FormControl();

  public amountField = new FormControl('');
  public amountUsdField = new FormControl('', validateNumber);

  public feeType: any = Fee;

  public feeTypeField = new FormControl();

  public feeField = new FormControl('', validateNumber);
  public feeUsdField = new FormControl('', validateNumber);
  public feePriceField = new FormControl('', validateNumber);
  public feePriceUsdField = new FormControl('', validateNumber);

  public subtractFeeField = new FormControl();

  // Well, that's stupid, but it seems that there's no way
  // to get if the input is focused out of FormControl
  // So, he's some boilerplate stuff:

  public receiverFocused = false;
  public amountFocused = false;
  public amountUsdFocused = false;
  public feeFocused = false;
  public feeUsdFocused = false;
  public feePriceFocused = false;
  public feePriceUsdFocused = false;
  public disable = false;

  @Input() public model: CurrencyModel = null;
  @Input() public balanceUnconfirmed: BehaviorSubject<BigNumber>;
  public parentModel: CurrencyModel;

  public wallet: Wallet;
  public parentWallet: Wallet;
  public synchronizing = this.syncService.synchronizing;

  public allowFeeConfiguration = false;
  public fixedaddress: string = null;

  public receiver: BehaviorSubject<string> = null;
  public amount: BehaviorSubject<BN> = null;
  public fee: BehaviorSubject<BN> = null;
  public feePrice: BehaviorSubject<BN> = null;
  public estimatedSize: BehaviorSubject<number> = null;

  public subtractFee: BehaviorSubject<boolean> = null;

  public sufficientBalance: BehaviorSubject<boolean> = null;
  public sufficientValue: BehaviorSubject<boolean> = null;
  public validReceiver: BehaviorSubject<boolean> = null;
  public requiredFilled: BehaviorSubject<boolean> = null;
  public valid: BehaviorSubject<boolean> = null;

  public sizeEstimated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private signSessionId: string = null;
  private signed: any = null;

  private cancelSubject = new Subject<void>();
  private isSendAll = false;
  private subscriptions = [];

  constructor(
    private readonly ngZone: NgZone,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly syncService: SyncService,
    private readonly balanceService: BalanceService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly priceService: PriceService,
    private readonly workerService: WorkerService,
    private readonly keyChainService: KeyChainService,
    private readonly connectionService: RPCConnectionService
  ) {
    this.navigationService.backEvent.subscribe(() => this.cancelTransaction());
  }

  public static verifyAddress(address: string, currencyInfo: CurrencyInfo, network: string): boolean {
    const verify = () => {
      if ([CurrencyId.NemTest, CurrencyId.Nem].includes(currencyInfo.id)) {
        if (NEM.model.address.isValid(address)) {
          const networkId = currencyInfo.walletType.networkId(network);
          const isFromNetwork = NEM.model.address.isFromNetwork(address, networkId);
          return isFromNetwork;
        }
        return false;
      }

      if ([CurrencyId.NeoTest, CurrencyId.Neo].includes(currencyInfo.id)) {
        return NeoWallet.isAddress(address);
      }

      return WalletAddressValidator.validate(
        address,
        currencyInfo.ticker,
        network === 'main' ? 'prod' : 'testnet'
      );
    };
    if ([CurrencyId.BitcoinCash, CurrencyId.BitcoinCashTest].includes(currencyInfo.id)) {
      try {
        CashAddr.decode(address);
        return true;
      } catch (ignored) {
        return verify();
      }
    } else {
      return verify();
    }
  }

  async ngOnInit() {
    this.amountField = new FormControl('', [Validators.required, AmountValidator.getValidator(this.model)]);

    this.parentModel = CurrencyModel.fromCoin(this.model.currencyInfo);

    this.wallet = new Wallet(
      this.model,
      this.syncService,
      this.balanceService,
      this.currencyInfoService
    );

    this.parentWallet = new Wallet(
      this.parentModel,
      this.syncService,
      this.balanceService,
      this.currencyInfoService
    );

    this.allowFeeConfiguration = ![CurrencyId.Nem, CurrencyId.NemTest].includes(this.model.currencyInfo.id);

    this.estimatedSize = toBehaviourSubject(
      combineLatest([
        this.wallet.balanceUnconfirmed.pipe(distinctUntilChanged()),
        this.wallet.wallet
      ]).pipe(
        mergeMap(async ([balance, wallet]) => {
          if (balance === null || balance.eq(new BN())) {
            return 1;
          }

          const size = await wallet.estimateTransaction(
            wallet.address,
            balance.div(new BN(2))
          );

          this.sizeEstimated.next(true);

          return size;
        })
      ), 1);

    this.receiver = new BehaviorSubject<string>('');
    this.amount = new BehaviorSubject<BN>(new BN());
    this.feePrice = new BehaviorSubject<BN>(new BN(this.priceService.feePrice(this.model.currencyInfo.id, FeeLevel.Normal)));
    this.fee = new BehaviorSubject<BN>(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
    this.subtractFee = new BehaviorSubject<boolean>(false);

    this.sufficientBalance = toBehaviourSubject(combineLatest([
      this.wallet.balanceUnconfirmed,
      this.parentWallet.balanceUnconfirmed,
      this.amount,
      this.fee,
      this.subtractFee
    ]).pipe(
      map(([balance, parentBalance, amount, fee, subtractFee]) => {
        if (balance === null || balance.eq(new BN())) {
          return false;
        }
        if (amount.gt(new BN())) {
          if (this.model.type === CurrecnyModelType.Coin) {
            if (!subtractFee) {
              return balance.gte(amount.add(fee));
            } else {
              return balance.gte(amount);
            }
          } else {
            return balance.gte(amount) && parentBalance.gte(fee);
          }
        } else {
          return true;
        }
      })
    ), false);

    this.sufficientValue = toBehaviourSubject(combineLatest([
      this.amount,
      this.fee,
      this.subtractFee
    ]).pipe(
      map(([amount, fee, subtractFee]) => {
        if (amount.gt(new BN())) {
          if (this.model.type === CurrecnyModelType.Coin) {
            if (subtractFee) {
              return amount.gte(fee);
            } else {
              return true;
            }
          } else {
            return true;
          }
        } else {
          return false;
        }
      })
    ), false);

    this.validReceiver = toBehaviourSubject(this.receiver.pipe(
      map((address) => {
        return SendTransactionComponent.verifyAddress(address, this.model.currencyInfo, this.model.currencyInfo.network);
      })
    ), false);

    this.requiredFilled = toBehaviourSubject(combineLatest([
      this.receiver,
      this.amount
    ]).pipe(
      map(([receiver, amount]) => {
        return receiver && receiver.length > 0 && amount > 0;
      })
    ), false);

    this.valid = toBehaviourSubject(combineLatest([
      this.sufficientBalance,
      this.sufficientValue,
      this.validReceiver,
      this.requiredFilled
    ]).pipe(
      map(([sufficientBalance, sufficientValue, validReceiver, requiredFilled]) => {
        return sufficientBalance && sufficientValue && validReceiver && requiredFilled;
      })
    ), false);

    this.subscriptions.push(combineLatest([
      this.amount.pipe(distinctUntilChanged()),
      this.wallet.wallet
    ]).subscribe(([value, wallet]) => {
      if (!wallet) {
        return;
      }
      if (!this.amountFocused) {
        this.amountField.setValue(
          wallet.fromInternal(value).toFixed(),
          {emitEvent: false}
        );
      }
      if (!this.amountUsdFocused) {
        this.amountUsdField.setValue(
          wallet.fromInternal(value).times(this.priceService.price(this.model.ticker) || 1).toFixed(),
          {emitEvent: false}
        );
      }
    }));

    this.subscriptions.push(
      this.receiver.pipe(distinctUntilChanged()).subscribe(value => {
        if (!this.receiverFocused) {
          this.receiverField.setValue(value, {emitEvent: false});
        }
      })
    );

    this.subscriptions.push(
      this.receiverField.valueChanges.pipe(distinctUntilChanged()).subscribe((value: string) => {
        this.receiver.next(value);
      })
    );

    this.subscriptions.push(combineLatest([
      this.fee.pipe(distinctUntilChanged()),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWallet]) => {
      if (!wallet) {
        return;
      }
      if (!this.feeFocused) {
        if (this.model.type === CurrecnyModelType.Token) {
          this.feeField.setValue(
            parentWallet.fromInternal(value).toFixed(),
            {emitEvent: false}
          );
        } else {
          this.feeField.setValue(
            wallet.fromInternal(value).toFixed(),
            {emitEvent: false}
          );
        }
      }
      if (!this.feeUsdFocused) {
        if (this.model.type === CurrecnyModelType.Token) {
          this.feeUsdField.setValue(
            parentWallet.fromInternal(value).times(this.priceService.price(this.parentModel.ticker) || 1).toFixed(),
            {emitEvent: false}
          );
        } else {
          this.feeUsdField.setValue(
            wallet.fromInternal(value).times(this.priceService.price(this.model.ticker) || 1).toFixed(),
            {emitEvent: false});
        }
      }
    }));

    this.subscriptions.push(combineLatest([
      this.feePrice.pipe(distinctUntilChanged()),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWallet]) => {
      if (!wallet) {
        return;
      }
      if (!this.feePriceFocused) {
        if (this.model.type === CurrecnyModelType.Token) {
          this.feePriceField.setValue(
            parentWallet.fromInternal(value).toFixed(),
            {emitEvent: false});
        } else {
          this.feePriceField.setValue(
            wallet.fromInternal(value).toFixed(),
            {emitEvent: false});
        }
      }
      if (!this.feePriceUsdFocused) {
        if (this.model.type === CurrecnyModelType.Token) {
          this.feePriceUsdField.setValue(
            parentWallet.fromInternal(value).times(this.priceService.price(this.parentModel.ticker) || 1).toFixed(),
            {emitEvent: false}
          );
        } else {
          this.feePriceUsdField.setValue(
            wallet.fromInternal(value).times(this.priceService.price(this.model.ticker) || 1).toFixed(),
            {emitEvent: false}
          );
        }
      }
    }));

    this.subscriptions.push(combineLatest([
      this.amountField.valueChanges.pipe(
        filter((value) => {
          return this.isSendAll ? (new BigNumber(value) != null) : isNumber(value) ;
        }),
        distinctUntilChanged()
      ),
      this.wallet.wallet
    ]).subscribe(([value, wallet]) => {
      if (!wallet) {
        return;
      }
      this.amount.next(wallet.toInternal(new BigNumber(value)));
    }));

    this.subscriptions.push(combineLatest([
      this.amountUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ),
      this.wallet.wallet
    ]).subscribe(([value, wallet]) => {
      if (!wallet) {
        return;
      }
      this.amount.next(wallet.toInternal(new BigNumber(value).div(this.priceService.price(this.model.ticker) || 1)));
    }));

    this.subscriptions.push(combineLatest([
      this.feeField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWalet]) => {
      if (!wallet) {
        return;
      }
      if (this.feeFocused) {
        let fee = null;
        if (this.model.type === CurrecnyModelType.Token) {
          fee = parentWalet.toInternal(new BigNumber(value));
        } else {
          fee = wallet.toInternal(new BigNumber(value));
        }
        this.fee.next(fee);
        this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
      }
    }));

    this.subscriptions.push(combineLatest([
      this.feeUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWalet]) => {
      if (!wallet) {
        return;
      }
      if (this.feeUsdFocused) {
        let fee = null;
        if (this.model.type === CurrecnyModelType.Token) {
          fee = parentWalet.toInternal(new BigNumber(value).div(this.priceService.price(this.parentModel.ticker) || 1));
        } else {
          fee = wallet.toInternal(new BigNumber(value).div(this.priceService.price(this.model.ticker) || 1));
        }
        this.fee.next(fee);
        this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
      }
    }));

    this.subscriptions.push(combineLatest([
      this.feePriceField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWalet]) => {
      if (!wallet) {
        return;
      }
      if (this.feePriceFocused) {
        let feePrice = null;
        if (this.model.type === CurrecnyModelType.Token) {
          feePrice = parentWalet.toInternal(new BigNumber(value));
        } else {
          feePrice = wallet.toInternal(new BigNumber(value));
        }
        this.feePrice.next(feePrice);
        this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
      }
    }));

    this.subscriptions.push(combineLatest([
      this.feePriceUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ),
      this.wallet.wallet,
      this.parentWallet.wallet
    ]).subscribe(([value, wallet, parentWalet]) => {
      if (!wallet) {
        return;
      }
      if (this.feePriceUsdFocused) {
        let feePrice = null;
        if (this.model.type === CurrecnyModelType.Token) {
          feePrice = parentWalet.toInternal(new BigNumber(value).div(this.priceService.price(this.parentModel.ticker) || 1));
        } else {
          feePrice = wallet.toInternal(new BigNumber(value).div(this.priceService.price(this.model.ticker) || 1));
        }
        this.feePrice.next(feePrice);
        this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
      }
    }));

    this.subscriptions.push(
      this.estimatedSize.pipe(distinctUntilChanged()).subscribe(value => {
        this.fee.next(new BN(value).mul(this.feePrice.getValue()));
      })
    );

    this.subscriptions.push(
      this.subtractFeeField.valueChanges.pipe(distinctUntilChanged()).subscribe((value: boolean) => {
        this.subtractFee.next(value);
      })
    );

    this.subscriptions.push(
      this.phase.pipe(
        map(phase => phase === Phase.Creation)
      ).subscribe((creation) => {
        if (creation) {
          this.disable = false;
          this.receiverField.enable();
          this.amountField.enable();
          this.amountUsdField.enable();
          this.feeTypeField.enable();
          this.feeField.enable();
          this.feeUsdField.enable();
          this.feePriceField.enable();
          this.feePriceUsdField.enable();
        } else {
          this.disable = true;
          this.receiverField.disable();
          this.amountField.disable();
          this.amountUsdField.disable();
          this.feeTypeField.disable();
          this.feeField.disable();
          this.feeUsdField.disable();
          this.feePriceField.disable();
          this.feePriceUsdField.disable();
        }
      })
    );

    this.subscriptions.push(
      this.feeTypeField.valueChanges.subscribe(value => {
        switch (value) {
          case Fee.Normal:
            this.feePrice.next(new BN(this.priceService.feePrice(this.model.currencyInfo.id, FeeLevel.Normal)));
            this.fee.next(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
            break;
          case Fee.Economy:
            this.feePrice.next(new BN(this.priceService.feePrice(this.model.currencyInfo.id, FeeLevel.Low)));
            this.fee.next(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
            break;
        }
      })
    );

    this.feeTypeField.setValue(Fee.Normal);
    if (this.model.type === CurrecnyModelType.Token) {
      this.subtractFeeField.disable();
    } else {
      this.subtractFeeField.enable();
    }

    if (this.fixedaddress) {
      this.receiverField.setValue(this.fixedaddress);
      this.receiverField.disable();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.cancelTransaction();
  }

  async onBack() {
    this.navigationService.back();
  }

  public async openDiscoveryOverlay() {
    const componentRef = this.navigationService.pushOverlay(DeviceDiscoveryComponent);
    componentRef.instance.connected.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.startSigning();
    });
  }

  async startSigning() {
    this.phase.next(Phase.Confirmation);

    this.signed = null;

    try {
      const syncStateResponse = await waitFiorPromise<any>(this.connectionService.rpcClient.api.syncState({
        sessionId: this.keyChainService.sessionId,
        currencyId: this.model.currencyInfo.id
      }), this.cancelSubject);
      console.log(syncStateResponse);
      if (!syncStateResponse) {
        return;
      }

      if (syncStateResponse.state !== SyncState.Finalized) {
        this.syncService.sync(
          this.keyChainService.sessionId,
          this.keyChainService.paillierPublicKey,
          this.keyChainService.paillierSecretKey,
          this.connectionService.rpcClient,
          this.model.currencyInfo.id
        );

        this.notification.show(
          'The requested currency is not synchronized. Please wait for it to be resynced'
        );
        return;
      }

      const receiver = this.receiver.getValue();
      const value = this.subtractFee.getValue() ? this.amount.getValue().sub(this.fee.getValue()) : this.amount.getValue();
      // temporarily allow NEM to choose fee itself
      const fee = this.allowFeeConfiguration ? this.fee.getValue() : undefined;

      const currency = this.wallet.currency.getValue();
      const currencyInfo = this.currencyInfoService.currencyInfo(currency.id);

      switch (currencyInfo.cryptosystem) {
        case Cryptosystem.Ecdsa:
          this.signed = await this.signEcdsa(receiver, value, fee);
          break;
        case Cryptosystem.Eddsa:
          this.signed = await this.signEddsa(receiver, value, fee);
          break;
      }
    } catch (error) {
      if (isNetworkError(error)) {
        await this.openDiscoveryOverlay();
        console.error(error);
        this.notification.show('Failed to restore connection automatically. Please select a device');
      } else {
        console.error(error);
        this.notification.show('Failed to sign a transaction');
      }
    } finally {
      if (!this.signed) {
        this.phase.next(Phase.Creation);
      } else {
        this.phase.next(Phase.Sending);
      }
    }
  }

  public async signEcdsa(receiver: string, value: BN, fee?: BN) {
    const currency = this.wallet.currency.getValue() as EcdsaCurrency;
    const wallet = this.wallet.wallet.getValue();

    console.log(await currency.compoundPublic());

    console.log(wallet.address);

    const tx = await wallet.prepareTransaction(
      await this.model.currencyInfo.transactionType.create(this.workerService.worker),
      receiver,
      value,
      fee
    );

    const distributedSignSession = await tx.startSignSession(currency.distributedKey);

    const entropyCommitment = await distributedSignSession.createEntropyCommitment();

    const transactionBytes = await tx.toBytes();

    const txId = await Utils.randomBytes(32);

    this.signSessionId = uuidFrom(txId);

    const startSignResponse = await waitFiorPromise<any>(this.connectionService.rpcClient.api.startEcdsaSign({
      sessionId: this.keyChainService.sessionId,
      currencyId: currency.id,
      signSessionId: this.signSessionId,
      transactionBytes,
      entropyCommitmentBytes: Marshal.encode(entropyCommitment)
    }, -1), this.cancelSubject);
    console.log(startSignResponse);
    if (!startSignResponse) {
      return null;
    }

    const entropyData = Marshal.decode(startSignResponse.entropyDataBytes);

    const entropyDecommitment = await distributedSignSession.processEntropyData(entropyData);

    const signFinalizeResponse = await waitFiorPromise<any>(this.connectionService.rpcClient.api.ecdsaSignFinalize({
      sessionId: this.keyChainService.sessionId,
      currencyId: currency.id,
      signSessionId: this.signSessionId,
      entropyDecommitmentBytes: Marshal.encode(entropyDecommitment)
    }), this.cancelSubject);
    console.log(signFinalizeResponse);
    if (!signFinalizeResponse) {
      return null;
    }

    this.signSessionId = null;

    const partialSignature = Marshal.decode(signFinalizeResponse.partialSignatureBytes);

    const signature = await distributedSignSession.finalizeSignature(partialSignature);

    await tx.applySignature(signature);

    return tx;
  }

  public async signEddsa(receiver: string, value: BN, fee?: BN) {
    const currency = this.wallet.currency.getValue() as EddsaCurrency;
    const wallet = this.wallet.wallet.getValue();

    console.log(await currency.compoundPublic());

    console.log(wallet.address);

    const tx = await wallet.prepareTransaction(
      await this.model.currencyInfo.transactionType.create(this.workerService.worker),
      receiver,
      value,
      fee
    );

    const distributedSignSession = await tx.startSignSession(currency.distributedKey);

    const entropyCommitment = await distributedSignSession.createEntropyCommitment();

    const transactionBytes = await tx.toBytes();

    const txId = await Utils.randomBytes(32);

    this.signSessionId = uuidFrom(txId);

    const startSignResponse = await waitFiorPromise<any>(this.connectionService.rpcClient.api.startEddsaSign({
      sessionId: this.keyChainService.sessionId,
      currencyId: currency.id,
      signSessionId: this.signSessionId,
      transactionBytes,
      entropyCommitmentBytes: Marshal.encode(entropyCommitment)
    }, -1), this.cancelSubject);
    console.log(startSignResponse);
    if (!startSignResponse) {
      return null;
    }

    const entropyData = Marshal.decode(startSignResponse.entropyDataBytes);

    const entropyDecommitment = await distributedSignSession.processEntropyData(entropyData);

    const signFinalizeResponse = await waitFiorPromise<any>(this.connectionService.rpcClient.api.eddsaSignFinalize({
      sessionId: this.keyChainService.sessionId,
      currencyId: currency.id,
      signSessionId: this.signSessionId,
      entropyDecommitmentBytes: Marshal.encode(entropyDecommitment)
    }), this.cancelSubject);
    console.log(signFinalizeResponse);
    if (!signFinalizeResponse) {
      return null;
    }

    this.signSessionId = null;

    const partialSignature = Marshal.decode(signFinalizeResponse.partialSignatureBytes);

    const signature = await distributedSignSession.finalizeSignature(partialSignature);

    await tx.applySignature(signature);

    return tx;
  }

  async cancelTransaction() {
    this.cancelSubject.next();

    if (this.signSessionId) {
      const currency = this.wallet.currency.getValue();
      this.connectionService.rpcClient.api.cancelSign({
        sessionId: this.keyChainService.sessionId,
        currencyId: currency.id,
        signSessionId: this.signSessionId
      });
    }  
  }

  async sendTransaction() {
    this.phase.next(Phase.Creation);

    try {
      const wallet = this.wallet.wallet.getValue();

      if (!await this.signed.verify()) {
        throw new Error('Invalid signature');
      }

      const raw = await this.signed.toRaw();

      await wallet.sendSignedTransaction(raw);

      this.navigationService.back();

      this.notification.show('The transaction was successfully sent');
    } catch (e) {
      console.log(e);
      this.notification.show('Error sending transaction');
    }
  }

  paste() {
    cordova.plugins.clipboard.paste(text => this.ngZone.run(() => {
      if (text !== '') {
        this.receiverField.setValue(text, {emitEvent: true});
      }
    }), e => console.log(e));
  }

  copy() {
    cordova.plugins.clipboard.copy(this.wallet.address.getValue());
  }

  sendAll() {
    this.isSendAll = true;
    this.amountField.setValue(
      this.balanceUnconfirmed.getValue().toFixed(),
      {emitEvent: true});
    this.isSendAll = false;
  }

  // more boilerplate stuff for focus tracking

  setReceiverFocused(focused: boolean): void {
    this.receiverFocused = focused;
  }

  setAmountFocused(focused: boolean): void {
    this.amountFocused = focused;
  }

  setAmountUsdFocused(focused: boolean): void {
    this.amountUsdFocused = focused;
  }

  setFeeFocused(focused: boolean): void {
    this.feeFocused = focused;
  }

  setFeeUsdFocused(focused: boolean): void {
    this.feeUsdFocused = focused;
  }

  setFeePriceFocused(focused: boolean): void {
    this.feePriceFocused = focused;
  }

  setFeePriceUsdFocused(focused: boolean): void {
    this.feePriceUsdFocused = focused;
  }
}
