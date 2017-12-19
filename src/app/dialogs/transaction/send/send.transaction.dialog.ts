import {Component} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';



@Component({
  selector: 'app-send-transaction-dialog',
  templateUrl: './send.transaction.dialog.html',
  styleUrls: ['./send.transaction.dialog.css'],
})
export class SendTransactionDialogComponent {
  sumFormControl = new FormControl('', [Validators.required]);
  addressFormControl = new FormControl('', [Validators.required]);

}
