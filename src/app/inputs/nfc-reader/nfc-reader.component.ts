import { Component, EventEmitter, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { DeviceService } from "../../services/device.service";
import { BehaviorSubject, Subject, timer } from "rxjs";
import { distinctUntilChanged, skip, filter, mapTo } from "rxjs/operators";

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;

export enum Type {
  NFC,
  NDEF,
  MIME
}

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
    private readonly ngZone: NgZone,
    private readonly deviceService: DeviceService
  ) {}

  async ngOnInit() {
    this.subscriptions.push(
      this.deviceService.resume.subscribe(async () => {
        this.enabled.next(await this.checkState());
      })
    );

    this.subscriptions.push(
      timer(100, 500).subscribe(async () => {
        this.enabled.next(await this.checkState());
      })
    );

    this.subscriptions.push(
      this.discovered.subscribe(object => this.onDiscovered(object))
    );

    this.subscriptions.push(
      this.enabledEvent.subscribe(async () => {
        await this.addTagDiscoveredListener(event => this.discovered.next({ type: Type.NFC, data: event }));
        await this.addNdefListener(event => this.discovered.next({ type: Type.NDEF, data: event }));
        await this.addMimeTypeListener(event => this.discovered.next({ type: Type.MIME, data: event }));
      })
    );

    this.subscriptions.push(
      this.disabledEvent.subscribe(async () => {
        await this.removeTagDiscoveredListener(event => this.discovered.next({ type: Type.NFC, data: event }));
        await this.removeNdefListener(event => this.discovered.next({ type: Type.NDEF, data: event }));
        await this.removeMimeTypeListener(event => this.discovered.next({ type: Type.MIME, data: event }));
      })
    );

    this.enabled.next(await this.checkState());
  }

  async ngOnDestroy() {
    this.enabled.next(false);

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async checkState() {
    return await new Promise<boolean>((resolve, reject) => nfc.enabled(
      () => resolve(true),
      () => resolve(false)
    ));
  }

  async addNdefListener(callback) {
    return await new Promise((resolve, reject) => nfc.addNdefListener(
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  async addTagDiscoveredListener(callback) {
    return await new Promise((resolve, reject) => nfc.addTagDiscoveredListener(
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  async addMimeTypeListener(callback) {
    return await new Promise((resolve, reject) => nfc.addMimeTypeListener(
      'text/pg',
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  async removeNdefListener(callback) {
    return await new Promise((resolve, reject) => nfc.removeNdefListener(
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  async removeTagDiscoveredListener(callback) {
    return await new Promise((resolve, reject) => nfc.removeTagDiscoveredListener(
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  async removeMimeTypeListener(callback) {
    return await new Promise((resolve, reject) => nfc.removeMimeTypeListener(
      'text/pg',
      event => this.ngZone.run(async () => await callback(event)),
      resolve,
      reject
    ));
  }

  changeNFCState() {
    nfc.showSettings();
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
}
