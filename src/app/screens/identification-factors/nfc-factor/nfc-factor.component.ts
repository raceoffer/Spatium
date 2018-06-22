import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from "rxjs/index";
import { NavigationService } from "../../../services/navigation.service";
import { NotificationService } from "../../../services/notification.service";
import { AuthService, IdFactor } from "../../../services/auth.service";
import { DDSService } from "../../../services/dds.service";
import { WorkerService } from "../../../services/worker.service";

import { packLogin } from 'crypto-core-async/lib/utils';

declare const Buffer: any;

@Component({
  selector: 'app-nfc-factor',
  templateUrl: './nfc-factor.component.html',
  styleUrls: ['./nfc-factor.component.css']
})
export class NfcFactorComponent implements OnInit {
  @HostBinding('class') classes = 'factor-component';

  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  public busy = new BehaviorSubject<boolean>(false);

  public savedOnce = false;

  public randomLogin: string = null;
  public nfcData: any = null;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly ddsService: DDSService,
    private readonly workerService: WorkerService
  ) {}

  async ngOnInit() {
    this.randomLogin = await this.generateNewLogin();
    this.nfcData = await packLogin(this.randomLogin, this.workerService.worker);
  }

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  public onSaved(ignored) {
    this.savedOnce = true;
    this.notification.show('The identifier was successfully written to the NFC tag');
  }

  public onSubmit() {
    this.submit.next({
      type: IdFactor.NFC,
      value: this.randomLogin
    });
  }

  async generateNewLogin() {
    try {
      this.busy.next(true);

      let login = null;
      do {
        login = this.authService.makeNewLogin(10);
      } while (await this.ddsService.exists(
        await this.authService.toId(login)
      ));

      return login;
    } finally {
      this.busy.next(false);
    }
  }
}
