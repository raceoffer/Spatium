import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DeviceService, Platform } from '../../services/device.service';

export enum State {
  Updating,
  Ready,
  Error
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy {
  public caretClass = this.isWindows() ? 'caret-center' : '';
  public stateType = State;
  public state = new BehaviorSubject<State>(State.Ready);

  public loginControl = new FormControl(null, [
    Validators.pattern(/^[a-z0-9]+$/i)
  ]);

  public valid = new BehaviorSubject<boolean>(false);
  public delayed = new BehaviorSubject<boolean>(false);

  @Output() login = new EventEmitter<string>();

  private subscriptions = [];
  private loginGenerated = false;

  private generateLoginStream = this.loginControl.valueChanges.pipe(
    distinctUntilChanged(),
    filter(() => this.loginGenerated),
    map((value) => {
      return this.loginValueChange(value);
    }),
  );
  private manualLoginInputStream = this.loginControl.valueChanges.pipe(
    distinctUntilChanged(),
    filter(() => !this.loginGenerated),
    map((value) => {
      return this.loginValueChange(value);
    }),
    tap(() => this.delayed.next(true)),
    debounceTime(1000),
    tap(() => this.delayed.next(false)),
  );

  constructor(private readonly authService: AuthService,
              private readonly deviceService: DeviceService) {

    this.subscriptions.push(
      this.manualLoginInputStream.subscribe(value => {
        this.valid.next(this.loginControl.valid);
        this.login.next(value);
      }),

      this.generateLoginStream.subscribe(value => {
        this.loginControl.enable();
        this.loginGenerated = false;
        this.valid.next(this.loginControl.valid);
        this.login.next(value);
      }),
    );

    this.subscriptions.push(
      this.state.pipe(
        distinctUntilChanged(),
        map(state => state === State.Updating)
      ).subscribe(updating => {
        if (updating) {
          this.loginControl.disable();
        } else {
          this.loginControl.enable();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  removeFocus(event) { event.target.blur(); }

  generateNewLogin() {
    try {
      this.state.next(State.Updating);
      const login = this.authService.makeNewLogin(10);

      this.loginGenerated = true;
      this.loginControl.setValue(login);

      this.state.next(State.Ready);
    } catch (e) {
      this.state.next(State.Error);
    }
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }

  loginValueChange(value) {
    if (!value) {
      if (this.isWindows()) {
        this.caretClass = 'caret-center';
      }
      return '';
    } else {
      this.caretClass = '';
      return value;
    }
  }
}
