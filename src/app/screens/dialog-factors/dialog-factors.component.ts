import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isAuth = data.isFirst;

    if (this.isAuth) {
      this.factors = this.authSevice.getAuthFactors();
    } else {
      this.factors = this.authSevice.getAllAvailableFactors();
    }

    this.back = data.back;
    this.next = data.next;
  }

  async goTo(factor) {
    this.dialogRef.close();

    switch (this.back) {
      case 'factornode':
        await this.router.navigate([
          '/navigator',
          {
            outlets: {
              navigator: [
                'factor',
                {
                  back: this.back
                },
                {
                  outlets: {
                    factor: [
                      factor.link, {
                        next: this.next,
                        isAuth: this.isAuth
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]);
        break;
      default:
        await this.router.navigate([
          '/factor',
          { back: this.back },
          { outlets: { 'factor': [factor.link, { next: this.next, isAuth: this.isAuth }] } }
        ]);
    }
  }
}
