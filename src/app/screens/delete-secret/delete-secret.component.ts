import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

declare const window: any;

@Component({
  selector: 'app-delete-secret',
  templateUrl: './delete-secret.component.html',
  styleUrls: ['./delete-secret.component.css']
})
export class DeleteSecretComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() submit = new EventEmitter<any>();

  public checkPhrase = 'delete';

  public checkInput;

  public hasTouch = false;

  constructor(
    private readonly navigationService: NavigationService
  ) {
    this.checkPhrase = this.capitalizeRandomChars(this.checkPhrase);
  }

  onBack() {
    this.navigationService.back();
  }

  onDelete() {
    this.submit.next();
  }

  capitalizeRandomChars(s: string) {
    const len = s.length;
    const c1 = this.getRandomNumber(0, len, undefined);
    const c2 = this.getRandomNumber(0, len, c1);

    s = s.toLowerCase();
    s = this.replaceAt(s, c1, s.charAt(c1).toUpperCase());
    s = this.replaceAt(s, c2, s.charAt(c2).toUpperCase());

    return s;
  }

  getRandomNumber(min: number, max: number, exclude: number) {
    const n = Math.floor(Math.random() * (max - min) + min);
    if (!exclude || n != exclude) {
      return n;
    } else {
      return this.getRandomNumber(min, max, exclude);
    }
  }

  replaceAt(s: string, i: number, replacement: string) {
    return s.substr(0, i) + replacement + s.substr(i + replacement.length);
  }
}
