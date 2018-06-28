import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';

import { Observable, from, of } from 'rxjs';
import { mapTo, catchError } from 'rxjs/operators';




declare const Utils: any;
declare const cordova: any;

enum SyncState {
  Ready,
  Syncing,
  Error,
}

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'overlay-background';

  private subscriptions = [];
  private account: DDSAccount = null;

  public address = '';
  public balance = 0.0;
  public comission = null;
  public enough = false;

  public gasPrice: number = this.dds.toWei('5', 'gwei');

  public syncStateType = SyncState;
  public syncState: SyncState = SyncState.Ready;

  public saving = false;

  @Input() public id: any = null;
  @Input() public data: any = null;

  @Output() success: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private readonly dds: DDSService,
    private readonly notification: NotificationService
  ) {}

  async ngOnInit() {
    this.account = await this.dds.getStoreAccount(this.id);
    this.address = this.account.address;
    this.comission = parseFloat(this.dds.fromWei((this.gasPrice * await this.account.estimateGas(this.id, this.data)).toString(), 'ether'));
    await this.updateBalance();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBack() {
    this.back.next();
  }

  async updateBalance() {
    try {
      this.syncState = SyncState.Syncing;
      this.balance = parseFloat(this.dds.fromWei((await this.account.getBalance()).toString(), 'ether'));
      this.enough = this.balance >= this.comission;
      this.syncState = SyncState.Ready;
    } catch (e) {
      this.syncState = SyncState.Error;
    }
  }

  getQrCodeText() {
      return `etherium:${this.address}?value=${this.comission}`;
  }

  copy() {
    cordova.plugins.clipboard.copy(this.address);
  }

  async save() {
    this.saving = true;
    from(this.account.store(this.id, this.data, this.gasPrice)).pipe(
      mapTo(true),
      catchError(ignored => { console.log(ignored); return of(false); })
    ).subscribe(async (success) => {
        if (!success) {
          this.saving = false;
          this.notification.show('Failed to upload the secret');
          return;
        }

        this.success.emit();
    });
  }
}
