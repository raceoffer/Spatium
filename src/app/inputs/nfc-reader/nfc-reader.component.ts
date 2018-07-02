import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { DeviceService } from "../../services/device.service";
import { BehaviorSubject, Subject, timer } from "rxjs";
import { distinctUntilChanged, skip, filter, mapTo } from "rxjs/operators";
import {
  addMimeTypeListener,
  addNdefListener,
  addTagDiscoveredListener, changeNFCState,
  checkState,
  removeMimeTypeListener,
  removeNdefListener,
  removeTagDiscoveredListener,
  Type
} from "../../utils/nfc";

declare const navigator: any;

@Component({
  selector: 'app-nfc-reader',
  templateUrl: './nfc-reader.component.html',
  styleUrls: ['./nfc-reader.component.css']
})
export class NfcReaderComponent implements OnInit, OnDestroy {
  @Output() scanned: EventEmitter<any> = new EventEmitter<any>();

  public enabled = new BehaviorSubject<boolean>(false);
  public enabledChanged = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public discovered: Subject<any> = new Subject<any>();

  private subscriptions = [];

  constructor(
    private readonly deviceService: DeviceService
  ) {}

  async ngOnInit() {
    this.subscriptions.push(
      this.deviceService.resume.subscribe(async () => {
        this.enabled.next(await checkState());
      })
    );

    this.subscriptions.push(
      timer(100, 500).subscribe(async () => {
        this.enabled.next(await checkState());
      })
    );

    this.subscriptions.push(
      this.discovered.subscribe(object => this.onDiscovered(object))
    );

    this.subscriptions.push(
      this.enabledEvent.subscribe(async () => {
        await addTagDiscoveredListener(event => this.discovered.next({ type: Type.NFC, data: event }));
        await addNdefListener(event => this.discovered.next({ type: Type.NDEF, data: event }));
        await addMimeTypeListener(event => this.discovered.next({ type: Type.MIME, data: event }));
      })
    );

    this.subscriptions.push(
      this.disabledEvent.subscribe(async () => {
        await removeTagDiscoveredListener(event => this.discovered.next({ type: Type.NFC, data: event }));
        await removeNdefListener(event => this.discovered.next({ type: Type.NDEF, data: event }));
        await removeMimeTypeListener(event => this.discovered.next({ type: Type.MIME, data: event }));
      })
    );

    this.enabled.next(await checkState());
  }

  async ngOnDestroy() {
    this.enabled.next(false);

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onDiscovered(event: any) {
    navigator.vibrate(100);

    const tag = event.data.tag;

    // BB7 has different names, copy to Android names
    if (tag.serialNumber) {
      tag.id = tag.serialNumber;
      tag.isWritable = !tag.isLocked;
      tag.canMakeReadOnly = tag.isLockable;
    }

    let payload = null;
    if (tag.ndefMessage && tag.ndefMessage.length > 0) {
      payload = Buffer.from(tag.ndefMessage[0].payload)
    }

    const result = {
      type: event.type,
      id: tag.id,
      payload: payload
    };

    this.scanned.emit(result)
  }

  public toggleNfc() {
    changeNFCState();
  }
}
