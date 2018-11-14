import { Component, OnInit, HostBinding } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { SettingsService } from '../../../services/settings.service';
import { checkAvailable } from '../../../utils/fingerprint';
import { AnalyticsService, View } from '../../../services/analytics.service';

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
    private readonly settings: SettingsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async ngOnInit() {
    this.analyticsService.trackView(View.SettingsConfirmationMode);

    this.fingerprintAvailable = await checkAvailable();
    if (this.fingerprintAvailable) {
      const stored = await this.settings.fingerprintEnabled();
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
    await this.settings.setFingerprintEnabled(change.checked);
  }
}
