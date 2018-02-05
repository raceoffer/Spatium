import { Component, Input, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { AuthService, FactorType } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import { KeyChainService } from '../../services/keychain.service';

declare const Utils: any;
declare const Buffer: any;
declare const window: any;

@Component({
  selector: 'app-pincode',
  host: {'class': 'child'},
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements AfterViewInit {
  pincode = '';

  next: string = null;
  back: string = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authSevice: AuthService,
    private readonly walletService: WalletService,
    private readonly fs: FileService,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService
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
    this.pincode = '';
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  async onSubmitClicked() {
    if (this.next && this.next === 'waiting') {
      const aesKey = await Utils.deriveAesKey(Buffer.from(this.pincode, 'utf-8'));

      try {
        if (this.authSevice.encryptedSeed) {
          const ciphertext = Buffer.from(this.authSevice.encryptedSeed, 'hex');
          this.keyChain.seed = Utils.decrypt(ciphertext, aesKey);
          this.walletService.secret = this.keyChain.getBitcoinSecret(0);
        } else {
          this.keyChain.seed = Utils.randomBytes(64);
          this.walletService.secret = this.keyChain.getBitcoinSecret(0);
          this.authSevice.encryptedSeed = Utils.encrypt(this.keyChain.seed, aesKey).toString('hex');

          await this.fs.writeFile(this.fs.safeFileName('seed'), this.authSevice.encryptedSeed);
        }

        await this.router.navigate(['/verifyTransaction']);
      } catch (ignored) {
        this.notification.show('Authorization error');
      }
    } else if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else if (this.next && this.next === 'registration') {
      this.authSevice.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/registration']);
      });
    }
  }

}
