import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';


@Component({
  selector: 'app-wallet-screen',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css', '../../app.component.css']
})
export class WalletScreenComponent {
  bcBalance = "0.2348";
  bcAddress = 'qkwehj2i389823y3h2kjlisdsf83';
  balanceBackupStatus = 'backup';
  ethereumAddress = 'skadjhakslfjasiu9837490328';
  ethereumBalance = '9329.00';
  isSync = false;
  spinnerClass = 'invisible backup-spinner'

  constructor(public dialog: MatDialog) {
  }

  syncBalance(element) {
    //here getting last sync balance

    this.openDialog();
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(BackupBalanceDialogComponent, {
      width: '300px',
      data: {
        ethereumAddress: this.ethereumAddress,
        ethereumBalance: this.ethereumBalance,
        comission: "20",
        spinnerClass: this.spinnerClass}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result){
        this.spinnerClass = "backup-spinner";
      } else {
        this.spinnerClass = "invisible backup-spinner";
      }
    });
  }
}

@Component({
  selector: 'app-backup-balance-dialog',
  templateUrl: './backup.balance.dialog.html',
})
export class BackupBalanceDialogComponent {

  constructor(public dialogRef: MatDialogRef<BackupBalanceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }


}
