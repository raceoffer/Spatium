import { Component } from '@angular/core';

@Component({
  selector: 'wallet-screen',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css', '../../app.component.css']
})
export class WalletScreen {
    bcAddress = 'qkwehj2i389823y3h2kjlisdsf83';
    bcBalance = '0.342';
    balanceSyncStatus = 'sync_disabled';
    ethereumAddress = 'skadjhakslfjasiu9837490328';
    ethereumBalance = '9329.00';
    isSync = false;
    
    syncBalance(element){
        this.isSync = !this.isSync;
        if (!this.isSync){
            this.balanceSyncStatus = 'sync_disabled';
        } else {
            this.balanceSyncStatus = 'sync';
        }
    }
}