import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceService } from './device.service';

export enum Position {
  Fullscreen,
  Center,
  Left
}

@Injectable()
export class NavigationService {
  private backSubject: Subject<any> = new Subject<any>();
  private overlayStack: Array<[OverlayRef, any]> = [];

  private backEventSubject: Subject<any> = new Subject<any>();

  public backEvent = this.backEventSubject.asObservable();

  constructor(private readonly ngZone: NgZone,
              private readonly device: DeviceService,
              private readonly overlay: Overlay) {
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

  public get overlayCount() {
    return this.overlayStack.length;
  }

  public back() {
    this.backSubject.next();
  }

  public clearOverlayStack() {
    while (this.overlayCount > 0) {
      this.popOverlay();
    }
  }

  public pushOverlay(ComponentType, position = Position.Fullscreen): ComponentRef<typeof ComponentType> {
    const config = new OverlayConfig();

    switch (position) {
      case Position.Fullscreen:
        config.height = '100%';
        config.width = '100%';
        break;
      case Position.Center:
        config.hasBackdrop = true;
        config.positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
        break;
      case Position.Left:
        config.hasBackdrop = true;
        config.height = '100%';
        config.positionStrategy = this.overlay.position().global().left();
        break;
    }

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal<typeof ComponentType>(ComponentType);
    const componentRef = overlayRef.attach(portal);

    overlayRef.backdropClick().subscribe(() => {
      this.cancelOverlay();
    });

    const elements: any = document.getElementsByClassName('cdk-overlay-container');
    elements[0].style.cssText += ';-webkit-transform: rotateZ(0deg) !important';
    elements[0].style.cssText += ';-webkit-transform: none !important';

    this.overlayStack.push([overlayRef, componentRef]);

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
      const [overlayRef, componentRef] = this.overlayStack.pop();
      if (cancel) {
        try {
          componentRef.instance.cancel();
        } catch (ignored) {
        }
      }
      overlayRef.dispose();
    }
  }
}
