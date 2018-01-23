import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare const window: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent {
  constructor(private router: Router, private readonly authService: AuthService) { }

  async onOpenClicked() {
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    try {
      this.authService.encryptedSecret = await new Promise<string>((resolve, reject) => {
        window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
          fs.root.getFile('verifierSecret.store', {create: false}, fileEntry => {
            fileEntry.file(file => {
              const reader = new FileReader();
              reader.onloadend = (e: any) => {
                const initiatorDDSKey = e.target.result;
                resolve(initiatorDDSKey);
              };
              reader.readAsText(file);
            });
          }, reject);
        });
      });
    } catch (e) {
      this.authService.encryptedSecret = null;
    }

    await this.router.navigate(['/pincode', { next: 'waiting', back: 'start' }]);
  }
}
