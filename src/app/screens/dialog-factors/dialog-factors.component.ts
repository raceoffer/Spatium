import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {

  factors = [
    {
      name: 'PIN',
      icon: 'dialpad',
    },
    {
      name: 'Password',
      icon: 'lock_outline',
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  toDo(): void {
    //this.dialogRef.close();
  }

}
