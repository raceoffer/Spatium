import { Component, EventEmitter, HostBinding, Input, NgZone, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FactorType } from '../../../services/auth.service';

declare const window: any;
declare const device: any;

@Component({
  selector: 'app-pincode-auth-factor',
  templateUrl: './pincode-auth-factor.component.html',
  styleUrls: ['./pincode-auth-factor.component.css']
})
export class PincodeAuthFactorComponent implements OnInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() busy = false;
  @Input() isCreate = false;
  @Input() isFactor = true;

  @Output() hasTouchId: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  pincode = '';
  hasTouch = false;

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router) { }

  ngOnInit() {
    this.pincode = '';

    if (!this.isFactor) {
      if (window.plugins) {
        window.plugins.touchid.isAvailable(() => {
          this.hasTouchId.emit(true);
          if (!this.isCreate && !this.isFactor) {
            window.plugins.touchid.has('spatium', () => {
              console.log('Touch ID avaialble and Password key available');
              this.hasTouch = true;
            }, () => {
              console.log('Touch ID available but no Password Key available');
            });
          }
        }, () => {
          this.hasTouchId.emit(false);
          console.log('Touch ID is not supported');
        });
      }
    }
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  async onDeleteClicked() {
    await this.router.navigate(['/delete-secret', 'pincode']);
  }

  async onImportClicked() {
    await this.router.navigate(['/secret-import']);
  }

  onFingerClicked() {
    if (window.plugins) {
      window.plugins.touchid.verify('spatium', 'Unlock Spatium secret', async (password) => {
        console.log('Tocuh ' + password);
        this.ngZone.run(async () => {
          this.pincode = password;
          await this.onNext();
        });
      });
    }
  }

  async onSubmitClicked() {
    await this.onNext();
  }

  async onNext() {
    this.onSuccess.emit({factor: FactorType.PIN, value: this.pincode});
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}
