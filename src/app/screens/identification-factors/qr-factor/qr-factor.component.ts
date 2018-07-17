import { Component, Output, EventEmitter, HostBinding, OnInit } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";
import { AuthService, IdFactor } from "../../../services/auth.service";
import { NotificationService } from "../../../services/notification.service";
import { BehaviorSubject } from "rxjs/index";
import { DDSService } from "../../../services/dds.service";
import { WorkerService } from "../../../services/worker.service";
import { DeviceService, Platform } from "../../../services/device.service";

import { packLogin } from 'crypto-core-async/lib/utils';

@Component({
  selector: 'app-qr-factor',
  templateUrl: './qr-factor.component.html',
  styleUrls: ['./qr-factor.component.css']
})
export class QrFactorComponent implements OnInit {
  @HostBinding('class') classes = 'factor-component';

  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  public busy = new BehaviorSubject<boolean>(false);

  public randomLogin: string = null;
  public qrData: string = null;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly ddsService: DDSService,
    private readonly workerService: WorkerService,
    private readonly device: DeviceService,
  ) {}

  async ngOnInit() {
    this.randomLogin = await this.generateNewLogin();
    this.qrData = (await packLogin(this.randomLogin, this.workerService.worker)).toString('hex');
  }

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  public onSaved(ignored) {
    if (this.device.platform === Platform.Windows) {
      this.notification.show('The QR image was saved to the pictures gallery');
    }
    else {
      this.notification.show('The QR image was saved to the local storage');
    }
  }

  public onSubmit() {
    this.submit.next({
      type: IdFactor.QR,
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
