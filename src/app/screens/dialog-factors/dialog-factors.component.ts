import {Component, Inject, NgZone} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {
  factors: any;
  next: string = null;
  back: string = null;
  isAuth: false;

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    private authSevice: AuthService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    console.log(this.authSevice.getAllAvailableFactors());

    this.isAuth = data.isFirst;

    if (this.isAuth) {
      this.factors = this.authSevice.getAuthFactors();
    } else {
      this.factors = this.authSevice.getAllAvailableFactors();
    }

    this.back = data.back;
    this.next = data.next;
  }


  goTo(factor): void {
    this.dialogRef.close();

    this.ngZone.run(async () => {
      await this.router.navigate(['/factor', { back: this.back }, {outlets: {'factor': [factor.link, {next: this.next, isAuth: this.isAuth}]}}]);
    });
  }

}
