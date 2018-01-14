import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {Router} from "@angular/router";


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
      link: '/pincode',
      next: 'auth',
      back: 'auth'
    },
    {
      name: 'Password',
      icon: 'keyboard',
      link: '/password',
      next: 'auth',
      back: 'auth'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  goTo(factor): void {
    this.dialogRef.close();
    this.router.navigate([factor.link, { next: factor.next, back: factor.back }]);
  }

}
