import { ComponentRef, Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceService } from './device.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Injectable()
export class NavigationService {
  private backSubject: Subject<any> = new Subject<any>();
  private overlayStack: Array<[ OverlayRef, any ]> = [];

  private backEventSubject: Subject<any> = new Subject<any>();

  public backEvent = this.backEventSubject.asObservable();

  constructor(
    private readonly ngZone: NgZone,
    private readonly device: DeviceService,
    private readonly overlay: Overlay
  ) {
    this.device.deviceReady().then(() => {
      document.addEventListener('backbutton', e => this.ngZone.run(() => {
        this.backSubject.next();
      }), false);
    });

    this.backSubject.subscribe(() => {
      if (this.overlayCount > 0) {
        this.cancelOverlay();
      } else {
        this.backEventSubject.next();
      }
    });
  }

  public back() {
    this.backSubject.next();
  }

  public get overlayCount() {
    return this.overlayStack.length;
  }

  public clearOverlayStack() {
    while (this.overlayCount > 0) {
      this.popOverlay();
    }
  }

  public pushOverlay(ComponentType, fullscreen = true): ComponentRef<typeof ComponentType> {
    const config = new OverlayConfig();

    if (fullscreen) {
      config.height = '100%';
      config.width = '100%';
    } else {
      config.hasBackdrop = true;
      config.positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
    }

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal<typeof ComponentType>(ComponentType);
    const componentRef = overlayRef.attach(portal);

    overlayRef.backdropClick().subscribe(() => {
      this.cancelOverlay();
    });

    this.overlayStack.push([ overlayRef, componentRef ]);

    return componentRef;
  }

  public acceptOverlay() {
    return this.popOverlay(false);
  }

  public cancelOverlay() {
    return this.popOverlay(true);
  }

  public popOverlay(cancel: boolean = false): void {
    if (this.overlayStack.length > 0) {
      const [ overlayRef, componentRef ] = this.overlayStack.pop();
      if (cancel) {
        try {
          componentRef.instance.cancel();
        } catch (ignored) {}
      }
      overlayRef.dispose();
    }
  }
}
