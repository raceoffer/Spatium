import { Injectable } from '@angular/core';
import { Subject } from "rxjs";
import { debounceTime, tap } from "rxjs/operators";

@Injectable()
export class ActivityService {
  private activity = new Subject<any>();

  public inactivity = this.activity.pipe(
    debounceTime(3 * 60 * 1000)
  );

  constructor() { }

  onActivity() {
    this.activity.next()
  }
}
