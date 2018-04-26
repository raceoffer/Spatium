import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-dialog-confirmation',
  templateUrl: './dialog-confirmation.component.html',
  styleUrls: ['./dialog-confirmation.component.css']
})
export class DialogConfirmationComponent implements OnInit {
  public onBackClicked = new EventEmitter();

  constructor(public dialogRef: MatDialogRef<DialogConfirmationComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
