import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CreateComponent } from '../create/create.component';
import { SignInComponent } from '../sign-in/sign-in.component';
import { ImportComponent } from '../import/import.component';
import { ExportComponent } from '../export/export.component';
import { DeleteComponent } from '../delete/delete.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

enum Mode {
  Create,
  SignIn
}

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit, OnDestroy {
  public navLinks = [{
    name: 'Create',
    link: null,
    subroute: 'create',
    allowedModes: [Mode.Create]
  }, {
    name: 'Sign in',
    link: null,
    subroute: 'sign_in',
    allowedModes: [Mode.SignIn]
  }, {
    name: 'Import',
    link: null,
    subroute: 'import',
    allowedModes: [Mode.Create]
  }, {
    name: 'Export',
    link: null,
    subroute: 'export',
    allowedModes: [Mode.SignIn]
  }, {
    name: 'Delete',
    link: null,
    subroute: 'delete',
    allowedModes: [Mode.SignIn]
  }, {
    name: 'Exit',
    link: '/start',
    subroute: null,
    allowedModes: [Mode.SignIn, Mode.Create]
  }];

  public mode = Mode.Create;
  public currentSubroute = new BehaviorSubject<string>(null);
  public title = this.currentSubroute.map(subroute =>
    this.navLinks.reduce((prev, curr) => {
      console.log(curr.subroute, prev, subroute);
      if (curr.subroute === subroute) {
        return curr;
      } else {
        return prev;
      }
    }, null).name
  );

  private subscriptions = [];

  constructor(
    private readonly auth: AuthService
  ) { }

  ngOnInit() {
    this.mode = this.auth.encryptedSeed ? Mode.SignIn : Mode.Create;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onActivate(event) {
    if (event instanceof CreateComponent) {
      this.currentSubroute.next('create');
    } else if (event instanceof SignInComponent) {
      this.currentSubroute.next('sign_in');
    } if (event instanceof ImportComponent) {
      this.currentSubroute.next('import');
    } if (event instanceof ExportComponent) {
      this.currentSubroute.next('export');
    } if (event instanceof DeleteComponent) {
      this.currentSubroute.next('delete');
    }
  }
}
