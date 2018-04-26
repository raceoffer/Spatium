import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { KeyChainService } from '../../services/keychain.service';
import { NotificationService } from '../../services/notification.service';

declare const CryptoCore: any;
declare const Buffer: any;
declare const window: any;

@Component({
  selector: 'app-verify-entry',
  templateUrl: './confirmation-entry.component.html',
  styleUrls: ['./confirmation-entry.component.css']
})
export class ConfirmationEntryComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component';

  hasTouchId: boolean;
  isCreate = true;
  busy = false;
  back: string = null;
  label: string = null;
  stCreate = 'Create secret';
  stUnlock = 'Unlock secret';

  constructor(private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly authService: AuthService,
              private readonly fs: FileService,
              private readonly notification: NotificationService,
              private readonly keyChain: KeyChainService) {
    this.route.params.subscribe(params => {
      if (params['back']) {
        this.back = params['back'];
      }

      if (this.authService.encryptedSeed === null) {
        this.label = this.stCreate;
        this.isCreate = true;
      } else {
        this.label = this.stUnlock;
        this.isCreate = false;
      }
    });
  }

  ngOnInit() {
  }

  async setHasTouchId(value: boolean) {
    this.hasTouchId = value;
  }

  async onSuccess(result) {
    try {
      const pincode = result.value;
      this.busy = true;

      const aesKey = await CryptoCore.Utils.deriveAesKey(Buffer.from(pincode, 'utf-8'));

      if (this.authService.encryptedSeed) {
        const ciphertext = Buffer.from(this.authService.encryptedSeed, 'hex');
        this.keyChain.setSeed(await CryptoCore.Utils.decrypt(ciphertext, aesKey));

        await this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['verify-waiting']}}]);
      } else {
        if (this.hasTouchId) {
          try {
            if (await this.saveTouchPassword(pincode)) {
              console.log('Password saved ' + pincode);
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
    finally {
      this.busy = false;
    }
  }

  async savePin(aesKey) {
    this.keyChain.setSeed(await CryptoCore.Utils.randomBytes(64));
    this.authService.encryptedSeed = (await CryptoCore.Utils.encrypt(this.keyChain.getSeed(), aesKey)).toString('hex');

    await this.fs.writeFile(this.fs.safeFileName('seed'), this.authService.encryptedSeed);

    await this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['verify-waiting']}}]);
  }

  async saveTouchPassword(pincode) {
    console.log('qwe');
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', pincode, success, error);
    });
  }

  async onBackClicked() {
    await this.router.navigate(['/' + this.back]);
  }
}
