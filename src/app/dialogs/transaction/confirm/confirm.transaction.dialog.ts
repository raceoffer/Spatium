import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';


@Component({
  selector: 'app-send-transaction-dialog',
  templateUrl: './confirm.transaction.dialog.html',
  styleUrls: ['./confirm.transaction.dialog.css'],
})
export class ConfirmTransactionDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
  }

}

