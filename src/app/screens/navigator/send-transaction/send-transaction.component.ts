import { OnInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { WalletService } from '../../../services/wallet.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrencyWallet } from '../../../services/wallet/currencywallet';
import { Coin } from '../../../services/keychain.service';
import { Observable } from 'rxjs/Observable';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const bcoin: any;

enum Phase {
  Creation,
  Confirmation,
  Sending
}

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements OnInit, OnDestroy {
  public phaseType = Phase; // for template

  public receiver = new FormControl();
  public amount = new FormControl();
  public amountUsd = this.amount.valueChanges.map(value => value * this.rateBtcUsd);

  accountPh = 'Account';
  receiverPh = 'Recipient';

  titile = 'Send transaction';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stCancel = 'Cancel';
  stTransfer = 'Transfer';
  stSend = 'Send';

  selected = '';

  rateBtcUsd = 15000;

  coin: Coin = null;

  public currencyWallet: CurrencyWallet;

  public walletAddress: Observable<string>;
  public balanceBtcConfirmed: Observable<number>;
  public balanceBtcUnconfirmed: Observable<number>;
  public balanceUsdConfirmed: Observable<number>;
  public balanceUsdUnconfirmed: Observable<number>;
  public validatorObserver: Observable<boolean>;

  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private subscriptions = [];

  constructor(
    private readonly walletService: WalletService,
    private readonly notification: NotificationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        this.coin = Number(params['coin']) as Coin;

        this.currencyWallet = this.walletService.currencyWallets.get(this.coin);

        this.subscriptions.push(
          this.currencyWallet.rejectedEvent.subscribe(async () => {
            await this.rejected();
          }));

        this.subscriptions.push(
          this.currencyWallet.signedEvent.subscribe(async () => {
            await this.finalaized();
          }));

        this.walletAddress = this.currencyWallet.address;
        this.balanceBtcUnconfirmed = this.currencyWallet.balance.map(balance => balance.unconfirmed);
        this.balanceBtcConfirmed = this.currencyWallet.balance.map(balance => balance.confirmed);
        this.balanceUsdUnconfirmed = this.balanceBtcUnconfirmed.map(balance => balance * this.rateBtcUsd);
        this.balanceUsdConfirmed = this.balanceBtcConfirmed.map(balance => balance * this.rateBtcUsd);

        this.validatorObserver = combineLatest(
          this.balanceBtcUnconfirmed,
          this.amount.valueChanges,
          this.receiver.valueChanges,
          (balance, amount, receiver) => {
            return balance > amount && amount > 0 && receiver.length > 0;
          });

        this.subscriptions.push(
          this.walletAddress.subscribe(address => {
            this.selected = address;
          })
        );
      }));

    this.subscriptions.push(
      this.phase.map(phase => phase === Phase.Creation).subscribe((creation) => {
        if (creation) {
          this.receiver.enable();
          this.amount.enable();
          this.receiver.setValue('');
          this.amount.setValue(0);
        } else {
          this.receiver.disable();
          this.amount.disable();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBack() {
    if (this.phase.getValue() === Phase.Confirmation) {
      await this.currencyWallet.rejectTransaction();
    }
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', this.coin] } }]);
  }

  // Pressed start signature
  async startSigning() {
    const tx = await this.currencyWallet.createTransaction(this.receiver.value, this.amount.value);
    if (tx) {
      this.phase.next(Phase.Confirmation);
      await this.currencyWallet.requestTransactionVerify(tx);
    }
  }

  async cancelTransaction() {
    this.phase.next(Phase.Creation);

    await this.currencyWallet.rejectTransaction();
  }

  async sendTransaction() {
    this.phase.next(Phase.Creation);

    try {
      await this.currencyWallet.verifySignature();
      await this.currencyWallet.pushTransaction();

      this.notification.show('The transaction was successfully sent');
    } catch (e) {
      console.log(e);
      this.notification.show('Error sending transaction');
    }
  }

  async skipSending() {
    this.phase.next(Phase.Creation);
  }

  // Received rejection
  async rejected() {
    this.phase.next(Phase.Creation);
  }

  // Received a ready signature
  async finalaized() {
    this.phase.next(Phase.Sending);
  }
}

