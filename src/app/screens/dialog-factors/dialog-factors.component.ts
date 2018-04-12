import {Component, EventEmitter, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {

  onAddFactor = new EventEmitter();

  factors: any;
  isAuth: false;
  label: '';

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    private authSevice: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isAuth = data.isAuth;

    if (data.label) {
      this.label = data.label;
    }

    if (this.isAuth) {
      this.factors = this.authSevice.getAuthFactors();
    } else {
      this.factors = this.authSevice.getAllAvailableFactors();
    }
  }

  async goTo(factor) {
    this.dialogRef.close(factor.component);
  }
}
