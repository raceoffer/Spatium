import {
  Component, ComponentFactoryResolver, ComponentRef, HostBinding, Inject, OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { FACTOR_PARENT_DIALOG_DATA } from './factor-parent-overlay.tokens';
import { FactorParentOverlayRef } from './factor-parent-overlay-ref';
import { QrWriterComponent } from '../../screens/factors/qr-writer/qr-writer.component';
import { NfcWriterComponent } from '../../screens/factors/nfc-writer/nfc-writer.component';


@Component({
  selector: 'app-dynamic-content',
  templateUrl: './factor-parent-overlay.component.html',
  styleUrls: ['./factor-parent-overlay.component.css'],
})
export class FactorParentOverlayComponent implements OnInit, OnDestroy  {
  @HostBinding('class') classes = 'toolbars-component';

  @ViewChild('container', { read: ViewContainerRef })
  viewContainerRef: ViewContainerRef;

  private componentRef: ComponentRef<{}>;

  isColored = false;
  isShadowed = false;
  label = '';

  constructor(public dialogRef: FactorParentOverlayRef,
              @Inject(FACTOR_PARENT_DIALOG_DATA) public config: any,
              private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (this.config.isColored) {
      this.isColored = this.config.isColored;
    }

    if (this.config.isShadowed) {
      this.isShadowed = this.config.isShadowed;
    }

    this.label = this.config.label;

    if (this.config.content) {
      const factory = this.componentFactoryResolver.resolveComponentFactory(this.config.content);
      this.componentRef = this.viewContainerRef.createComponent(factory);

      const instance = this.componentRef.instance;

      instance['onSuccess'].subscribe((result) => {
        this.dialogRef.onAddFactor.emit(result);
      });

      if (this.config.content === QrWriterComponent || this.config.content === NfcWriterComponent) {
          instance['value'] = this.dialogRef.value;
      }

      console.log(instance);

    }
  }

  async onBackClicked() {
    this.dialogRef.onBackClicked.emit();
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

}
