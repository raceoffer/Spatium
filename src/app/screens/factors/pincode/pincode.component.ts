import { Component, OnInit, NgZone, HostBinding, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FactorType } from '../../../services/auth.service';

declare const CryptoCore: any;
declare const Buffer: any;
declare const window: any;
declare const device: any;

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements OnInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() busy = false;
  @Input() isCreate = false;
  @Input() isFactor = true;

  @Output() hasTouchId: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  pincode = '';
  hasTouch = false;

  constructor(
    private readonly ngZone: NgZone,
    private readonly router: Router
  ) { }

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
          console.log('no touch id');
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
        this.ngZone.run( async () => {
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
      /*switch (this.next) {
        case 'waiting':
          await this.onNext.emit(this.pincode);
          break;
        case 'auth':
          await this.authService.addAuthFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
          await this.router.navigate(['/auth']);
          break;
        case 'registration':
          await this.authService.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
          await this.router.navigate(['/registration']);
          break;
        case 'factornode':
          await this.authService.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
          await this.router.navigate(['/navigator', {outlets: {navigator: ['factornode']}}]);
          break;
      }*/
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}
