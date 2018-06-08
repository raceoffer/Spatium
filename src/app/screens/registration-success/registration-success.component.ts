import { Component, EventEmitter, HostBinding, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  private subscriptions = [];

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onSubmit() {
    this.submit.next();
  }

  onBack() {
    this.back.next();
  }
}
