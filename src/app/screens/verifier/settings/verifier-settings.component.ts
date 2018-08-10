import { Component, OnInit, HostBinding } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { StorageService } from '../../../services/storage.service';
import { checkAvailable } from '../../../utils/fingerprint';

@Component({
  selector: 'app-verifier-settings',
  templateUrl: './verifier-settings.component.html',
  styleUrls: ['./verifier-settings.component.css']
})
export class SettingsComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public fingerprintEnabled = true;
  public fingerprintAvailable = true;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly storage: StorageService
  ) {}

  async ngOnInit() {
    this.fingerprintAvailable = await checkAvailable();
    if (this.fingerprintAvailable) {
      const stored = await this.storage.getValue('fingerprint.enabled');
      if (stored !== null) {
        this.fingerprintEnabled = stored as boolean;
      }
    } else {
      this.fingerprintEnabled = false;
    }
  }

  onBack() {
    this.navigationService.back();
  }

  async onFingerprintChanged(change: any) {
    await this.storage.setValue('fingerprint.enabled', change.checked);
  }
}
