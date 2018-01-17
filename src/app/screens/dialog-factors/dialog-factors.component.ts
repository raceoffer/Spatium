import {Component, Inject, NgZone} from '@angular/core';
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
    },
    {
      name: 'File',
      icon: 'insert_drive_file',
      link: '/file-upload',
      next: 'auth',
      back: 'auth'
    },
    {
      name: 'Graphic key',
      icon: '',
      icon_asset: 'graphic-key',
      link: '/graphic-key',
      next: 'auth',
      back: 'auth'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogFactorsComponent>,
    private router: Router,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  goTo(factor): void {
    this.dialogRef.close();

    this.ngZone.run(() => {
      this.router.navigate([factor.link, { next: factor.next, back: factor.back }]);
    });

  }

}
