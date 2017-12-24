import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-creating-result',
  templateUrl: './creating-result.component.html',
  styleUrls: ['./creating-result.component.css']
})
export class CreatingResultComponent implements OnInit {

  ethereumAddress = 'hgasdjhksjadhsagdyawh';
  ethereumBalance = '300';


  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  syncDHI(): void {
    //here getting last sync balance

    this.openBalanceDialog();
  }

  openBalanceDialog(): void {
    let dialogRef = this.dialog.open(BalanceDialogComponent, {
      width: '300px',
      data: {
        ethereumAddress: this.ethereumAddress,
        ethereumBalance: this.ethereumBalance,
        comission: '20'
      }
    });



    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}

@Component({
  selector: 'app-balance-dialog',
  templateUrl: './balance.dialog.html',
})
export class BalanceDialogComponent {

  syncState = 0;
  enough = false;

  constructor(public dialogRef: MatDialogRef<BalanceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  changeSyncState(): void {
    switch (this.syncState){
      case 0: {
        this.syncState = 1;
        break;
      }
      case 1: {
        this.syncState = 2;
        break;
      }
      case 2: {
        this.syncState = 0;
        this.enough = true;
        break;
      }
    }
  }

}
