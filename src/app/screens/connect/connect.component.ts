import {Component, EventEmitter, HostBinding, OnInit, Output} from '@angular/core';
import {WalletService} from '../../services/wallet.service';
import {NavigationService} from '../../services/navigation.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {
  @HostBinding('class') classes = 'box';
  stConnect = 'Synchronizing an account';
  cancelLabel = 'Cancel';

  progress = this.wallet.syncProgress;

  private subscriptions = [];

  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();

  constructor(private wallet: WalletService,
              private readonly navigationService: NavigationService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  async cancelSync() {
    this.cancel.emit();
  }

  async onBackClicked() {
    await this.cancelSync();
  }
}
