import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {
  @HostBinding('class') classes = 'box';
  stConnect = 'Synchronizing an account';

  progress = this.wallet.syncProgress;
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();
  private subscriptions = [];

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
