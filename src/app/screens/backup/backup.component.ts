import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit {

  ethereumAddress = 'hgasdjhksjadhsagdyawh';
  ethereumBalance = '10';
  comission = '20';
  syncState = 0;
  enough = false;
  syncDHIState = false;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  changeSyncState(): void {
    switch (this.syncState){
      case 0: {
        this.syncState = 1;
        break;
      }
      case 1: {
        this.syncState = 2;
        break;
      }
      case 2: {
        this.syncState = 0;
        this.enough = true;
        this.ethereumBalance = '50';
        break;
      }
    }
  }

  syncDHI():void {
    this.syncDHIState = !this.syncDHIState;

  }


}

