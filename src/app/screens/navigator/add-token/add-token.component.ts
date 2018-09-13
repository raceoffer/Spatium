import { Component, EventEmitter, HostBinding, NgZone, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DeviceService, Platform } from '../../../services/device.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';

declare const cordova: any;

@Component({
  selector: 'app-add-token',
  templateUrl: './add-token.component.html',
  styleUrls: ['./add-token.component.css']
})
export class AddTokenComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() public createdEvent = new EventEmitter<any>();

  title = 'Add a new token';

  public nameField = new FormControl('', Validators.required);
  public addressField = new FormControl('', Validators.compose([Validators.required, Validators.pattern('^(0x){1}[0-9a-fA-F]{40}$')]));
  public tickerField = new FormControl('', Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(9)]));
  public decimalsField = new FormControl();
  public tokenForm = new FormGroup({
    name: this.nameField,
    ticker: this.tickerField,
    address: this.addressField,
    decimals: this.decimalsField
  });

  public receiverFocused = false;
  public disable = false;
  public validReceiver: BehaviorSubject<boolean> = null;

  isSaving = false;

  constructor(private readonly ngZone: NgZone,
              private readonly deviceService: DeviceService,
              private readonly navigationService: NavigationService,
              private readonly keyChainService: KeyChainService) { }

  ngOnInit() {}

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
    // const token = new TokenEntry(
    //   null,
    //   this.nameField.value,
    //   this.tickerField.value,
    //   this.addressField.value,
    //   null,
    //   this.decimalsField.value);

    // await this.keyChainService.addCustomToken(token);
    // this.createdEvent.emit(token);
  }

}
