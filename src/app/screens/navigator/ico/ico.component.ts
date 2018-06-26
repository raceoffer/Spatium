import { Component, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { BluetoothService } from '../../../services/bluetooth.service';
import { CurrencyService } from '../../../services/currency.service';
import { KeyChainService} from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { Input} from '@angular/core';
import { InvestmentComponent } from './investment/investment.component';

declare const navigator: any;
declare const window: any;

@Component({
  selector: 'app-ico',
  templateUrl: './ico.component.html',
  styleUrls: ['./ico.component.css']
})

export class IcoComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public title = 'ICO';
  @ViewChild('sidenav') sidenav;

  @Input() filtredTitles: any;
  @Input() cols: any;

  constructor(public dialog: MatDialog,
              private readonly navigationService: NavigationService) {}

  ngOnInit() {

  }

  ngOnDestroy() {

  }

  public async onTileClicked(project: any) {
    console.log(project);
    const componentRef = this.navigationService.pushOverlay(InvestmentComponent);
    componentRef.instance.project = project;
  }
}

