import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Factor } from "../../services/auth.service";

@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<DialogFactorsComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly factors: Array<Factor>
  ) {}

  selected(factor) {
    this.dialogRef.close(factor.type);
  }
}
