import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl } from "@angular/forms";
import { DDSService } from "../../services/dds.service";
import { AuthService } from "../../services/auth.service";

import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged, map, tap } from "rxjs/operators";

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
export class LoginComponent implements OnDestroy{
  public stateType = State;
  public state = new BehaviorSubject<State>(State.Ready);

  public loginControl = new FormControl();

  @Output() login = new EventEmitter<string>();
  @Output() busy = new EventEmitter<boolean>();

  private subscriptions = [];

  constructor(
    private readonly authService: AuthService,
    private readonly ddsService: DDSService
  ) {
    this.subscriptions.push(
      this.loginControl.valueChanges.pipe(
        map(value => value ? value : ''),
        tap(() => this.busy.next(true)),
        debounceTime(1000)
      ).subscribe(value => {
        this.busy.next(false);
        this.login.next(value)
      })
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

  async generateNewLogin() {
    try {
      this.state.next(State.Updating);
      this.busy.next(true);

      let login = null;
      do {
        login = this.authService.makeNewLogin(10);
      } while (await this.ddsService.exists(
        await this.authService.toId(login.toLowerCase())
      ));

      this.loginControl.setValue(login);

      this.state.next(State.Ready);
    } catch(e) {
      this.busy.next(false);
      this.state.next(State.Error);
    }
  }
}
