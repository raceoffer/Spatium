import { Component, Input, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
              private authSevice: AuthService,
              private walletService: WalletService) {
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
        if (this.authSevice.encryptedSecret) {
          const ciphertext = Buffer.from(this.authSevice.encryptedSecret, 'hex');
          this.walletService.verifierSecret = Utils.decrypt(ciphertext, aesKey);
        } else {
          this.walletService.verifierSecret = Utils.randomBytes(32);
          this.authSevice.encryptedSecret = Utils.encrypt(this.walletService.verifierSecret, aesKey).toString('hex');

          await new Promise((resolve, reject) => {
            window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
              fs.root.getFile('verifierSecret.store', { create: true }, fileEntry => {
                fileEntry.createWriter(fileWriter => {
                  const tdata = new Blob([this.authSevice.encryptedSecret], {type: 'text/plain'});
                  fileWriter.write(tdata);
                  resolve();
                });
              });
            });
          });
        }

        await this.router.navigate(['/verifyTransaction']);
      } catch (e) {
        console.log('Pincode auth failed');
      }
    } else if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(AuthService.FactorType.PIN, this._pincode.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    }
  }

}
