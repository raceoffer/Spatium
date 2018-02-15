import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import { Coin } from '../../services/keychain.service';

declare const bcoin: any;

@Component({
  selector: 'app-verify-transaction',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements OnInit, AfterViewInit, OnDestroy {
  showTransaction = false;

  address = '';
  btc;
  rateBtcUsd = 15000;
  usd;

  enableBTmessage = 'Enable Bluetooth to proceed';

  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;
  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;

  public currentCoin: Coin = null;

  public currencyWallets = this.wallet.currencyWallets;

  private subscriptions = [];

  constructor(
    private readonly bt: BluetoothService,
    private readonly wallet: WalletService
  ) { }

  async ngOnInit() {
    await this.bt.disconnect();

    this.subscriptions.push(
      this.wallet.readyEvent.subscribe(() => {
        this.currencyWallets.forEach(currencyWallet => {
          console.log(currencyWallet.address.getValue());
        });
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.bt.enabledEvent.subscribe(async () => {
        await this.bt.ensureListening();
      }));

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.reset();
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        console.log('Connected to', this.bt.connectedDevice.getValue());
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.reset();
        await this.bt.ensureListening();
      }));

    this.currencyWallets.forEach((currencyWallet, coin) => {
      this.subscriptions.push(
        currencyWallet.rejectedEvent.subscribe(() => {
          this.showTransaction = false;
        }));

      this.subscriptions.push(
        currencyWallet.verifyEvent.subscribe(async (transaction) => {
          this.currentCoin = coin;

          const outputs = transaction.totalOutputs();

          if (outputs.length < 1) {
            console.log('Received invalid transaction');
            await currencyWallet.rejectTransaction();
            return;
          }

          this.address = outputs[0].address;
          this.btc = bcoin.amount.btc(outputs[0].value);
          this.usd = this.btc * this.rateBtcUsd;
          this.showTransaction = true;

          console.log('Transaction:');
          console.log(this.address);
          console.log(this.btc);
          console.log(this.usd);
        }));
    });

    console.log('Entered verify');
  }

  async ngOnDestroy() {
    console.log('Left verify');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();

    await this.bt.disconnect();
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  async confirm() {
    this.showTransaction = false;
    await this.currencyWallets.get(this.currentCoin).acceptTransaction();
  }

  async decline() {
    this.showTransaction = false;
    await this.currencyWallets.get(this.currentCoin).rejectTransaction();
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
  }
}
