import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MAT_DIALOG_DATA, MatDialog} from "@angular/material";
import {DialogFactorsComponent} from "../dialog-factors/dialog-factors.component";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  username = '';
  login = 'Log in'
  loginDisable = true;

  //из службы
  factors = [
    {
      name: 'PIN',
      icon: 'dialpad',
      value: 'kjsadhkasjd',
    },
    {
      name: 'Password',
      icon: 'keyboard',
      value: 'dlkfsjlkfsd',
    },


  ];

  constructor(private route: ActivatedRoute,
              private router: Router,
              public dialog: MatDialog) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.username = params.username;
    });
  }

  sddNewFactor(): void {
    let dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

    });
  }

  removeFactor(factor): void {

  }

}


