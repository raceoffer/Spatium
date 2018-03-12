import {Injectable, NgZone} from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class NavigationService {
  public backEvent: Subject<any> = new Subject<any>();

  constructor(private readonly ngZone: NgZone) {
    document.addEventListener('backbutton', e => this.ngZone.run(() => this.backEvent.next(e)), false);
  }

}
