import { Component, Input, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;
declare const Buffer: any;
declare const window: any;

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements AfterViewInit {
  _pincode = '';

  next: string = null;
  back: string = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authSevice: AuthService,
    private readonly walletService: WalletService,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  ngAfterViewInit() {
    this._pincode = '';
  }

  get Pincode() {
    return this._pincode;
  }

  @Input()
  set Pincode(newPin) {
    this._pincode = newPin;
  }

  onAddClicked(symbol) {
    this._pincode = this._pincode + symbol;
  }

  onBackspaceClicked() {
    this._pincode = this._pincode.substr(0, this._pincode.length - 1);
  }

  async onSubmitClicked() {
    if (this.next && this.next === 'waiting') {
      const aesKey = await Utils.deriveAesKey(Buffer.from(this._pincode, 'utf-8'));

      try {
        if (this.authSevice.encryptedSeed) {
          const ciphertext = Buffer.from(this.authSevice.encryptedSeed, 'hex');
          this.walletService.seed = Utils.decrypt(ciphertext, aesKey);
        } else {
          this.walletService.seed = Utils.randomBytes(64);
          this.authSevice.encryptedSeed = Utils.encrypt(this.walletService.seed, aesKey).toString('hex');

          await this.fs.writeFile(this.fs.safeFileName('seed'), this.authSevice.encryptedSeed);
        }

        console.log(this.walletService.seed.toString('hex'));

        await this.router.navigate(['/verifyTransaction']);
      } catch (e) {
        this.notification.show('Authorization error');
      }
    } else if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(AuthService.FactorType.PIN, this._pincode.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    }
  }

}
