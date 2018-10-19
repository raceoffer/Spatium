import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HistoryEntry } from '../screens/navigator/currency/currency.component';

export class TransactionWatcher {
  id: string;
  cachedTransactions: BehaviorSubject<HistoryBlock> = new BehaviorSubject<HistoryBlock>(new HistoryBlock([]));
  loadingTransactions: BehaviorSubject<HistoryBlock> = new BehaviorSubject<HistoryBlock>(new HistoryBlock([]));
  wallet: any;

  isLoadingLastTransactions = new BehaviorSubject<boolean>(false);
  isUpdatingTransactions = new BehaviorSubject<boolean>(false);
  isLoadingMoreTransactions = new BehaviorSubject<boolean>(false);
  private page = 1;

  constructor(id: string, wallet: any) {
    this.id = id;
    this.wallet = wallet;
  }

  hasTransactions(): boolean {
    return this.cachedTransactions.getValue().entries.length > 0;
  }

  hasIntersectionAndConcat(entries: Array<HistoryEntry>) {
    if (entries.length === 0) {
      this.isLoadingMoreTransactions.next(false);
      return true;
    }

    const tempBlock = new HistoryBlock(entries);
    const hasIntersections = this.hasIntersection(tempBlock);

    if (hasIntersections || (this.cachedTransactions.getValue().entries.length === 0)) {
      this.cachedTransactions.next(this.cachedTransactions.getValue().concatBlocks(tempBlock));
      this.cachedTransactions.next(this.cachedTransactions.getValue().concatBlocks(this.loadingTransactions.getValue()));
      this.loadingTransactions.next(new HistoryBlock([]));
    } else {
      if (tempBlock.startTime < this.cachedTransactions.getValue().endTime) {
        if (this.isLoadingMoreTransactions.getValue()) {
          this.cachedTransactions.next(this.cachedTransactions.getValue().concatBlocks(tempBlock));
          this.cachedTransactions.next(this.cachedTransactions.getValue().concatBlocks(this.loadingTransactions.getValue()));
          this.loadingTransactions.next(new HistoryBlock([]));
          this.isLoadingMoreTransactions.next(false);
        }
      } else {
        this.loadingTransactions.next(this.loadingTransactions.getValue().concatBlocks(tempBlock));
      }
    }

    return hasIntersections;
  }

  hasIntersection(tempBlock: HistoryBlock) {
    const ct = this.cachedTransactions.getValue();

    return (tempBlock.startTime >= ct.startTime && tempBlock.endTime <= ct.startTime) ||
      (tempBlock.startTime >= ct.endTime && tempBlock.endTime <= ct.endTime);
  }

  async loadLastPageTransactions() {
    this.isLoadingLastTransactions.next(true);

    try {
      this.hasIntersectionAndConcat(await this.getTransactions());
    }
    finally {
      this.isLoadingLastTransactions.next(false);
    }
  }

  async updateTransactions() {
    if (this.isUpdatingTransactions.getValue()) {
      return;
    }

    this.isUpdatingTransactions.next(true);

    this.page = 1;
    let intersection = false;

    try {
      while (!intersection) {
        intersection = this.hasIntersectionAndConcat(await this.getTransactions());
      }

      if (this.isLoadingMoreTransactions.getValue()) {
        while (this.isLoadingMoreTransactions.getValue()) {
          this.hasIntersectionAndConcat(await this.getTransactions());
        }
      }

      // todo: updating unconfirmed transactions
    } finally {
      this.isUpdatingTransactions.next(false);
    }
  }

  async loadMoreTransactions() {
    this.isLoadingMoreTransactions.next(true);

    await this.updateTransactions();
  }

  async getTransactions() {
    try {
      const wallet = this.wallet.wallet.getValue();

      const transactionsJSON = await wallet.getTransactions(this.page++);
      return transactionsJSON.map(tx => HistoryEntry.fromJSON(tx));
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  concatBlocks(block: HistoryBlock, block2: HistoryBlock): HistoryBlock {
    let temp = new HistoryBlock([]);
    temp = temp.concatBlocks(block);
    temp = temp.concatBlocks(block2);

    return temp;
  }

}

export class HistoryBlock {
  startTime = 0;
  endTime = 0;
  entries: Array<HistoryEntry> = [];

  constructor(entries: Array<HistoryEntry>) {
    if (entries.length > 0) {
      this.entries = entries.sort((a, b) => b.time - a.time);
      this.startTime = this.entries[0].time;
      this.endTime = this.entries[this.entries.length - 1].time;
    }
  }

  concatBlocks(block: HistoryBlock): HistoryBlock {
    // todo added per one
    if (this.entries.length > 0) {
      this.entries = this.entries
        .filter((value) => (value.time > block.startTime) || (value.time < block.endTime))
        .concat(block.entries)
        .sort((a, b) => b.time - a.time);
    } else {
      if (block.entries.length > 0) {
        this.entries = this.entries
          .concat(block.entries)
          .sort((a, b) => b.time - a.time);
      }
    }

    if (this.entries.length > 0) {
      this.startTime = this.entries[0].time;
      this.endTime = this.entries[this.entries.length - 1].time;
    }

    return this;
  }

  sort() {
    this.entries = this.entries.sort((a, b) => b.time - a.time);
  }
}

@Injectable()
export class TransactionService {
  private _watchers = new Map<string, TransactionWatcher>();

  constructor() { }

  public registerWatcher(id: string, wallet: any): TransactionWatcher {
    this._watchers.set(id, new TransactionWatcher(id, wallet));

    return this._watchers.get(id);
  }

  public hasWatcher(id: string): boolean {
    return this._watchers.has(id);
  }

  public watcher(id: string): TransactionWatcher {
    return this._watchers.get(id);
  }

  public async reset(): Promise<void> {
    this._watchers.clear();
  }
}
