import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { packTree, randomBytes } from 'crypto-core-async/lib/utils';
import { from, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';

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
  public address = '';
  public balance = 0.0;
  public comission = null;
  public enough = false;
  public gasPrice: number = this.dds.toWei('5', 'gwei');
  public syncStateType = SyncState;
  public syncState: SyncState = SyncState.Ready;
  public saving = false;
  public ready = false;
  @Input() public isManual = false;
  @Input() public id: any = null;
  @Input() public data: any = null;
  @Input() public login: any = null;
  @Input() public factors: any = null;
  @Output() setSeed: EventEmitter<any> = new EventEmitter<any>();
  @Output() success: EventEmitter<any> = new EventEmitter<any>();
  private subscriptions = [];
  private account: DDSAccount = null;

  constructor(private readonly dds: DDSService,
              private readonly authService: AuthService,
              private readonly notification: NotificationService,
              private readonly navigationService: NavigationService,
              private readonly workerService: WorkerService) {}

  async ngOnInit() {
    try {
      if (!this.isManual) {
        await this.getView(this.id, this.data);
      } else {
        await this.packData();
      }
    } finally {
      this.ready = true;
    }
  }

  async getView(id, data) {
    this.account = await this.dds.getStoreAccount(id);
    this.address = this.account.address;
    this.comission = parseFloat(this.dds.fromWei((this.gasPrice * await this.account.estimateGas(id, data)).toString(), 'ether'));
    await this.updateBalance();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBack() {
    this.navigationService.back();
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
      catchError(ignored => {
        console.log(ignored);
        return of(false);
      })
    ).subscribe(async (success) => {
      if (!success) {
        this.saving = false;
        this.notification.show('Failed to upload the secret');
        return;
      }

      this.success.emit();
    });
  }

  async packData() {
    const seed = await randomBytes(64, this.workerService.worker);
    this.setSeed.emit(seed);

    const packed = [];
    for (const factor of this.factors) {
      packed.push(await this.authService.pack(factor.type, factor.value));
    }

    const reversed = packed.reverse();

    const tree = reversed.reduce((rest, factor) => {
      const node = {
        factor: factor
      };
      if (rest) {
        node['children'] = [rest];
      }
      return node;
    }, null);

    const id = await this.authService.toId(this.login.toLowerCase());
    const data = await packTree(tree, seed, this.workerService.worker);

    await this.getView(id, data);
  }
}
