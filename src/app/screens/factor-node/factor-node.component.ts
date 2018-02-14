import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DialogFactorsComponent} from "../dialog-factors/dialog-factors.component";
import {MatDialog} from "@angular/material";
import {KeyChainService} from "../../services/keychain.service";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {NotificationService} from "../../services/notification.service";
import {DDSService} from "../../services/dds.service";

@Component({
  selector: 'app-factor-node',
  templateUrl: './factor-node.component.html',
  styleUrls: ['./factor-node.component.css']
})
export class FactorNodeComponent implements OnInit {

  factors = [];

  constructor(public  dialog: MatDialog,
              private readonly router: Router,
              private readonly keychain: KeyChainService,
              private readonly changeDetectorRef: ChangeDetectorRef,
              private readonly authSevice: AuthService,
              private readonly notification: NotificationService,
              private readonly dds: DDSService) { }

  ngOnInit() {
  }

  goTop() {
    $('#factor-container').animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    const container = $('#factor-container');
    container.animate({scrollTop: container.height()}, 500, 'swing');
  }

  addNewFactor() {
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'registration', next: 'registration' }
    });
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.changeDetectorRef.detectChanges();
  }

}
