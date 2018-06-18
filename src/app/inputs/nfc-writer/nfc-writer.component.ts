import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeviceService } from "../../services/device.service";
import { BehaviorSubject, Subject, timer } from "rxjs";
import { distinctUntilChanged, filter, mapTo, skip } from "rxjs/operators";
import {
  addMimeTypeListener, addNdefListener, addTagDiscoveredListener, changeNFCState, checkState, removeMimeTypeListener,
  removeNdefListener,
  removeTagDiscoveredListener,
  Type, write
} from "../../utils/nfc";
import { NotificationService } from "../../services/notification.service";

declare const navigator: any;

@Component({
  selector: 'app-nfc-writer',
  templateUrl: './nfc-writer.component.html',
  styleUrls: ['./nfc-writer.component.css']
})
export class NfcWriterComponent implements OnInit {
  @Input() public value: any = null;
  @Output() public saved = new EventEmitter<any>();

  public enabled = new BehaviorSubject<boolean>(false);
  public enabledChanged = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public discovered: Subject<any> = new Subject<any>();

  private subscriptions = [];

  constructor(
    private readonly deviceService: DeviceService,
    private readonly notification: NotificationService
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
      this.discovered.subscribe(async object => await this.onDiscovered(object))
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

  async onDiscovered(ignored) {
    const payload = Array.from(this.value);

    try {
      await write(payload);
    } catch (ignored) {
      this.notification.show('Failed to write an NFC tag');
    }

    this.saved.next(this.value);

    navigator.vibrate(100);
  }

  async ngOnDestroy() {
    this.enabled.next(false);

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public toggleNfc() {
    changeNFCState();
  }
}
