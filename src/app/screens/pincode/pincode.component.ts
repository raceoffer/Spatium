import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import { KeyChainService } from '../../services/keychain.service';

declare const Utils: any;
declare const Buffer: any;
declare const window: any;

enum State {
  Create,
  Unlock,
  Factor
}

@Component({
  selector: 'app-pincode',
  host: {'class': 'child content text-center'},
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements AfterViewInit {
  pincode = '';

  next: string = null;
  back: string = null;

  stCreate = 'Create secret';
  stUnlock = 'Unlock secret';

  stateType = State;
  state: State = null;

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

  ngAfterViewInit() {
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
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
  }

  async onDeleteClicked() {
    await this.router.navigate(['/delete-secret', 'pincode']);
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  async onSubmitClicked() {
    switch (this.next) {
      case 'waiting':
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
        break;
      case 'auth':
        this.authService.addAuthFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        this.authService.addFactor(FactorType.PIN, Buffer.from(this.pincode, 'utf-8'));
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
    }
  }

}
