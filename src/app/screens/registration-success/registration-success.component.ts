import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { NavigationService } from "../../services/navigation.service";

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();

  constructor(private readonly navigationService: NavigationService) {}

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  public onSubmit() {
    this.submit.next();
  }
}
