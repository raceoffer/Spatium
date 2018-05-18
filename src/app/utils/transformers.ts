import { Observable ,  BehaviorSubject ,  ReplaySubject } from 'rxjs';

export function toBehaviourSubject<T>(observable: Observable<T>, def: T): BehaviorSubject<T> {
  const subject = new BehaviorSubject<T>(def);

  observable.subscribe(subject);

  return subject;
}

export function toReplaySubject<T>(observable: Observable<T>, depth: number): ReplaySubject<T> {
  const subject = new ReplaySubject<T>(depth);

  observable.subscribe(subject);

  return subject;
}
