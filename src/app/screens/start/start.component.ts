import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { }

  async onOpenClicked() {
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    try {
      this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName('seed'));
    } catch (e) {
      this.authService.encryptedSeed = null;
      this.notification.show('No stored seed found');
    }

    await this.router.navigate(['/factor', { back: 'start' }, {outlets: {'factor': ['pincode', {next: 'waiting'}]}}]);
  }

  async onNextClicked() {
    await this.router.navigate(['/registration', { login: 'kasuhddskajdaskdaskldj' }]);
  }
}
