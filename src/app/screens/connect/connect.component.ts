import {Component, EventEmitter, Output} from '@angular/core';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent {
  stConnect = 'Synchronizing an account';
  cancelLabel = 'Cancel';

  progress = this.wallet.syncProgress;

  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();

  constructor(private wallet: WalletService) {}

  async cancelSync() {
    this.cancel.emit();
  }
}
