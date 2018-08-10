import { Component, HostBinding, NgZone, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DeviceService, Platform } from '../../../services/device.service';
import { KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';

declare const cordova: any;

@Component({
  selector: 'app-add-token',
  templateUrl: './add-token.component.html',
  styleUrls: ['./add-token.component.css']
})
export class AddTokenComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  title = 'Add new token';

  public nameField = new FormControl();
  public tickerField = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]);
  public addressField = new FormControl('', [Validators.required, Validators.pattern('^(0x){1}[0-9a-fA-F]{40}$')]);
  public decimalsField = new FormControl(0);

  public receiverFocused = false;
  public disable = false;
  public validReceiver: BehaviorSubject<boolean> = null;

  isSaving: boolean = false;

  constructor(private readonly ngZone: NgZone,
              private readonly deviceService: DeviceService,
              private readonly navigationService: NavigationService,
              private readonly keyChainService: KeyChainService) { }

  ngOnInit() {
  }

  onBack() {
    this.navigationService.back();
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }

  paste(field) {
    cordova.plugins.clipboard.paste(text => this.ngZone.run(() => {
      if (text !== '') {
        field.setValue(text, {emitEvent: true});
      }
    }), e => console.log(e));
  }

  setReceiverFocused(focused: boolean): void {
    this.receiverFocused = focused;
  }

  async saveNewToken() {
    const temp = new TokenEntry(
      null,
      this.nameField.value,
      this.tickerField.value,
      this.addressField.value,
      null,
      this.decimalsField.value,
      null);

    await this.keyChainService.addCustomToken(temp);

  }

}
