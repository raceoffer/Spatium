import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {FileService} from '../../services/file.service';
import {KeyChainService} from '../../services/keychain.service';

declare const window: any;
declare const Utils: any;

enum State {
  Create,
  Unlock,
  Factor
}

@Component({
  selector: 'app-finger-print',
  host: {'class': 'child content text-center'},
  templateUrl: './finger-print.component.html',
  styleUrls: ['./finger-print.component.css']
})
export class FingerPrintComponent implements OnInit {

  next: string = null;
  back: string = null;

  stateType = State;
  state: State = null;

  pincode = '';

  stCreate = 'Create secret';
  stUnlock = 'Unlock secret';
  stFinger = 'Touch the sensor';
  isScanning = false;
  stToastErrorFinger = 'Wrong fingerprint';
  stToastErrorDecrypt = 'Secret cannot be decrypted';

  constructor(
    private readonly route: ActivatedRoute,
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

    console.log(this.state);

    this.pincode = this.authService.makeNewPIN(10);

    const self = this;

    if (this.state === State.Create) {
      if (window.plugins) {
        window.plugins.touchid.save('spatium', this.pincode, function() {
          console.log('Password saved');
          self.savePin();
        });
      }
    } else if (this.state = State.Unlock) {
      if (window.plugins) {
        window.plugins.touchid.verify('spatium', 'SPATIUM', function(password) {
          console.log('Tocuh ' + password);
        });
      }
    }
  }

  async savePin() {
    try {
      const aesKey = await Utils.deriveAesKey(Buffer.from(this.pincode, 'utf-8'));

      if (this.authService.encryptedSeed) {
        const ciphertext = Buffer.from(this.authService.encryptedSeed, 'hex');
        this.keyChain.setSeed(Utils.decrypt(ciphertext, aesKey));
      } else {
        this.keyChain.setSeed(Utils.randomBytes(64));
        this.authService.encryptedSeed = Utils.encrypt(this.keyChain.getSeed(), aesKey).toString('hex');

        await this.fs.writeFile(this.fs.safeFileName('seed'), this.authService.encryptedSeed);
      }

      await this.router.navigate(['/verify-waiting']);
    } catch (ignored) {
      this.notification.show('Authorization error');
    }
  }

  async onDeleteClicked() {
    await this.router.navigate(['/delete-secret', 'pincode']);
  }

  onScanStart() {
    this.isScanning = true;
  }

  onScanEnd() {
    this.isScanning = false;
  }

  errorFingerScan() {
    this.notification.show(this.stToastErrorFinger);
  }

  errorDecrypt() {
    this.notification.show(this.stToastErrorDecrypt);
  }

}
