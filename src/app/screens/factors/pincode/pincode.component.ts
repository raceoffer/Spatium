import {Component, OnInit, NgZone, HostBinding} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../../services/auth.service';
import { FileService } from '../../../services/file.service';
import { NotificationService } from '../../../services/notification.service';
import { KeyChainService } from '../../../services/keychain.service';

declare const CryptoCore: any;
declare const Buffer: any;
declare const window: any;

enum State {
  Create,
  Unlock,
  Factor
}

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements OnInit {
  @HostBinding('class') classes = 'content factor-content text-center';
  pincode = '';
  _pincode = '';

  next: string = null;
  back: string = null;

  stCreate = 'Create secret';
  stUnlock = 'Unlock secret';

  stateType = State;
  state: State = null;

  hasTouch = false;
  hasTouchId = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly authService: AuthService,
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

  ngOnInit() {
    if (this.next && this.next === 'waiting') {
      if (this.authService.encryptedSeed === null) {
        this.state = State.Create;
      } else {
        this.state = State.Unlock;
      }
    } else {
      this.state = State.Factor;
    }

    this.pincode = '';
    this._pincode = '';

    if (window.plugins) {
      window.plugins.touchid.isAvailable(() => {
        this.hasTouchId = true;
        if (this.state === State.Unlock) {
          window.plugins.touchid.has('spatium', () => {
            console.log('Touch ID avaialble and Password key available');
            this.hasTouch = true;
          }, () => {
            console.log('Touch ID available but no Password Key available');
          });
        }
      }, () => {
        console.log('no touch id');
      });
    }
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
    this._pincode = this.pincode;
  }

  async onDeleteClicked() {
    await this.router.navigate(['/delete-secret', 'pincode']);
  }

  async onImportClicked() {
    await this.router.navigate(['/secret-import']);
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
    this._pincode = this.pincode;
  }

  onFingerClicked() {
    if (window.plugins) {
      window.plugins.touchid.verify('spatium', 'Unlock Spatium secret', async (password) => {
        console.log('Tocuh ' + password);
        this._pincode = password;
        this.ngZone.run( async () => {
          await this.onNext();
        });
      });
    }
  }

  async onSubmitClicked() {
    this._pincode = this.pincode;
    await this.onNext();
  }

  saveTouchPassword() {
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', this._pincode, success, error);
    });
  }

  async onNext() {
    switch (this.next) {
      case 'waiting':
        try {
          const aesKey = await CryptoCore.Utils.deriveAesKey(Buffer.from(this._pincode, 'utf-8'));

          if (this.authService.encryptedSeed) {
            const ciphertext = Buffer.from(this.authService.encryptedSeed, 'hex');
            this.keyChain.setSeed(CryptoCore.Utils.decrypt(ciphertext, aesKey));

            await this.router.navigate(['/verify-waiting']);
          } else {
            if (this.hasTouchId) {
                try {
                  if (await this.saveTouchPassword()) {
                    console.log('Password saved ' + this._pincode);
                    await this.savePin(aesKey);
                  }
                } catch (e) {
                  console.log(e);
                }
            } else {
              await this.savePin(aesKey);
            }
          }
        } catch (ignored) {
          this.notification.show('Authorization error');
        }
        break;
      case 'auth':
        this.authService.addAuthFactor(FactorType.PIN, Buffer.from(this._pincode, 'utf-8'));
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.PIN, Buffer.from(this._pincode, 'utf-8'));
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        this.authService.addFactor(FactorType.PIN, Buffer.from(this._pincode, 'utf-8'));
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
    }
  }

  async savePin(aesKey) {
    this.keyChain.setSeed(CryptoCore.Utils.randomBytes(64));
    this.authService.encryptedSeed = CryptoCore.Utils.encrypt(this.keyChain.getSeed(), aesKey).toString('hex');

    await this.fs.writeFile(this.fs.safeFileName('seed'), this.authService.encryptedSeed);

    console.log('hgfghkkk');
    await this.router.navigate(['/verify-waiting']);
  }

}
