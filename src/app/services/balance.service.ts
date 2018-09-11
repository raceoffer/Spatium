import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { waitFiorPromise, waitForSubject } from '../utils/transformers';

export class Balance {
  constructor(
    public confirmed: any,
    public unconfirmed: any
  ) {}
}

export enum BalanceStatus {
  None = 0,
  Loading,
  Error
}

@Injectable()
export class BalanceService {
  private _watchers = new Map<string, {
    id: string,
    balanceSubject: BehaviorSubject<Balance>,
    statusSubject: BehaviorSubject<BalanceStatus>,
    wallet: any
  }>();

  private _stop = false;
  private _updating = new BehaviorSubject<boolean>(false);
  private _cancelSubject = new Subject<any>();

  private _watcherQueue = new Array<string>();

  public registerWatcher(id: string, wallet: any): {
    id: string,
    balanceSubject: BehaviorSubject<Balance>,
    statusSubject: BehaviorSubject<BalanceStatus>,
    wallet: any
  } {
    this._watchers.set(id, {
      id,
      balanceSubject: new BehaviorSubject<Balance>(null),
      statusSubject: new BehaviorSubject<BalanceStatus>(BalanceStatus.None),
      wallet
    });

    return this._watchers.get(id);
  }

  public hasWatcher(id: string): boolean {
    return this._watchers.has(id);
  }

  public watcher(id: string): {
    id: string,
    balanceSubject: BehaviorSubject<Balance>,
    statusSubject: BehaviorSubject<BalanceStatus>,
    wallet: any
  } {
    return this._watchers.get(id);
  }

  private async updateTask() {
    try {
      while (!this._stop) {
        this._watcherQueue = Array.from(this._watchers.keys());

        while (this._watcherQueue.length > 0 && !this._stop) {
          const watcher = this._watchers.get(this._watcherQueue[0]);
          this._watcherQueue.splice(0, 1);

          watcher.statusSubject.next(BalanceStatus.Loading);

          try {
            const balance = await waitFiorPromise<any>(watcher.wallet.getBalance(), this._cancelSubject);
            if (balance) {
              watcher.balanceSubject.next(new Balance(
                balance.confirmed,
                balance.unconfirmed
              ));
            }
            watcher.statusSubject.next(BalanceStatus.None);
          } catch (e) {
            watcher.statusSubject.next(BalanceStatus.Error);
            console.error(e);
          }

          await timer(200).toPromise();
        }

        await timer(1000).toPromise();
      }
    } catch (e) {
      throw e;
    } finally {
      this._updating.next(false);
    }
  }

  public async start(): Promise<void> {
    if (this._updating.getValue()) {
      throw new Error('Already updating');
    }

    this._updating.next(true);
    this._stop = false;

    timer(10).subscribe(() => this.updateTask());
  }

  public forceCurrency(id: string): void {
    if (this._watcherQueue.includes(id)) {
      this._watcherQueue.splice(this._watcherQueue.indexOf(id), 1);
    }
    this._watcherQueue.unshift(id);
  }

  public async stop(): Promise<void> {
    if (!this._updating.getValue()) {
      throw new Error('Not updating');
    }

    this._stop = true;
    this._cancelSubject.next();

    await waitForSubject(this._updating, false);
  }

  public async reset(): Promise<void> {
    if (this._updating.getValue()) {
      await this.stop();
    }

    this._watchers.clear();
  }
}
