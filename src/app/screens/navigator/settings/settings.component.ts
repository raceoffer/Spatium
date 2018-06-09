import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";
import { FactorNodeComponent } from "../factor-node/factor-node.component";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() cancelled = new EventEmitter<any>();

  navLinks = [{
    name: 'Add authentication path',
    link: 'factornode'
  }, {
    name: 'Language',
    link: 'lang',
  }];

  constructor(private readonly navigationService: NavigationService) {}

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  onSelected(navLink) {
    if (navLink.link === 'factornode') {
      const componentRef = this.navigationService.pushOverlay(FactorNodeComponent);
    }
  }
}
