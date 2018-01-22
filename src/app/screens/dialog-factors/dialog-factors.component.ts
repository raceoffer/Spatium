import {Component, Inject, NgZone} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import {AuthService} from "../../services/auth.service";


@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {
  factors: any;

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    private authSevice: AuthService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    console.log(this.authSevice.getAllAvailableFactors());
    this.factors = this.authSevice.getAllAvailableFactors();
  }


  goTo(factor): void {
    this.dialogRef.close();

    this.ngZone.run(async () => {
      await this.router.navigate([factor.link, { next: factor.next, back: factor.back }]);
    });
  }

}
