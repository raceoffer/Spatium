import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export function toBehaviourSubject<T>(observable: Observable<T>, def: T): BehaviorSubject<T> {
  const subject = new BehaviorSubject<T>(def);

  observable.subscribe(subject);

  return subject;
}
