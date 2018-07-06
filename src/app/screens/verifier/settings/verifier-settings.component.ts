import { Component, OnInit, HostBinding } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";
import { getValue, setValue } from "../../../utils/storage";
import { checkAvailable } from "../../../utils/fingerprint";

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
    private readonly navigationService: NavigationService) {
  }

  async ngOnInit() {
    this.fingerprintAvailable = await checkAvailable();
    if (this.fingerprintAvailable) {
      try {
        this.fingerprintEnabled = await getValue('fingerprintEnabled');
      } catch (ignored) {}
    } else {
      this.fingerprintEnabled = false;
    }
  }

  onBack() {
    this.navigationService.back();
  }

  async onFingerprintChanged(change: any) {
    await setValue('fingerprintEnabled', change.checked);
  }
}
