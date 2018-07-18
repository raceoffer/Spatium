import { Observable, BehaviorSubject, ReplaySubject, Subject, NEVER } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';

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

export async function waitForSubject<T>(subject: BehaviorSubject<T>, state: T, until?: Subject<any>) {
  return  await subject.pipe(
    map(s => s === state),
    distinctUntilChanged(),
    filter(s => s),
    take(1),
    takeUntil(until || NEVER)
  ).toPromise();
}
