import { ComponentRef, Injectable, Injector } from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { FactorParentOverlayRef } from './factor-parent-overlay-ref';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { FactorParentOverlayComponent } from './factor-parent-overlay.component';
import { FACTOR_PARENT_DIALOG_DATA } from './factor-parent-overlay.tokens';


interface FactorParentOverlayConfig {
  isColored?: boolean;
  isShadowed?: boolean;
  label?: string;
  content?: any;
}

const DEFAULT_CONFIG: FactorParentOverlayConfig = {
  isColored: false,
  isShadowed: false,
  label: '',
  content: null
};

@Injectable()
export class FactorParentOverlayService {

  constructor(private injector: Injector,
              private overlay: Overlay) { }

  open(config: FactorParentOverlayConfig = {}) {

    // Override default configuration
    const dialogConfig = {...DEFAULT_CONFIG, ...config};

    // Returns an OverlayRef which is a PortalHost
    const overlayRef = this.createOverlay(dialogConfig);

    // Instantiate remote control
    const dialogRef = new FactorParentOverlayRef(overlayRef);

    const overlayComponent = this.attachDialogContainer(overlayRef, dialogConfig, dialogRef);

    overlayRef.backdropClick().subscribe(_ => dialogRef.close());

    return dialogRef;
  }

  private createOverlay(config: FactorParentOverlayConfig) {
    const overlayConfig = this.getOverlayConfig(config);
    return this.overlay.create(overlayConfig);
  }

  private getOverlayConfig(config: FactorParentOverlayConfig): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayConfig = new OverlayConfig({
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });

    return overlayConfig;
  }

  private attachDialogContainer(overlayRef: OverlayRef, config: FactorParentOverlayConfig, dialogRef: FactorParentOverlayRef) {
    const injector = this.createInjector(config, dialogRef);

    const containerPortal = new ComponentPortal(FactorParentOverlayComponent, null, injector);
    const containerRef: ComponentRef<FactorParentOverlayComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private createInjector(config: FactorParentOverlayConfig, dialogRef: FactorParentOverlayRef): PortalInjector {
    const injectionTokens = new WeakMap();

    injectionTokens.set(FactorParentOverlayRef, dialogRef);
    injectionTokens.set(FACTOR_PARENT_DIALOG_DATA, config);

    return new PortalInjector(this.injector, injectionTokens);
  }

}
