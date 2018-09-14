import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FileService } from '../../services/file.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-verifier-auth',
  templateUrl: './verifier-auth.component.html',
  styleUrls: ['./verifier-auth.component.css']
})
export class VerifierAuthComponent implements OnInit, OnDestroy {
  public fileData = null;
  public exists = false;
  public ready = false;
  private subscriptions = [];

  constructor(
    private readonly navigationService: NavigationService,
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly fs: FileService,
    private readonly notification: NotificationService,
    private readonly settings: SettingsService,
  ) {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBack();
      })
    );
  }

  async ngOnInit() {
    const file = await this.fs.readFile(this.fs.safeFileName('seed'));
    if (file) {
      this.fileData = Buffer.from(await this.fs.readFile(this.fs.safeFileName('seed')), 'hex');
      this.exists = true;
    }
    this.ready = true;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onBack() {
    try {
      await this.settings.setStartPath(null);
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/start']);
  }

  public async onCreated(seed) {
    this.keychain.seed = seed;

    this.notification.show('The secret successfully saved');

    await this.router.navigate(['/verifier']);
  }

  public async onDecrypted(seed) {
    this.keychain.seed = seed;

    await this.router.navigate(['/verifier']);
  }

  public async onImported(seed) {
    this.keychain.seed = seed;

    this.notification.show('The secret successfully imported');

    await this.router.navigate(['/verifier']);
  }

  public async onDeleted() {
    this.notification.show('The secret successfully removed');

    await this.router.navigate(['/start']);
  }
}
