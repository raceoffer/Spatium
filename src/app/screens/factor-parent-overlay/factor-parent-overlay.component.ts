import {
  Component, ComponentFactoryResolver, ComponentRef, EventEmitter, HostBinding, Inject, Input, OnDestroy, OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {NavigationService} from '../../services/navigation.service';
import {FACTOR_PARENT_DIALOG_DATA} from './factor-parent-overlay.tokens';
import {FactorParentOverlayRef} from './factor-parent-overlay-ref';

@Component({
  selector: 'app-dynamic-content',
  templateUrl: './factor-parent-overlay.component.html',
  styleUrls: ['./factor-parent-overlay.component.css']
})
export class FactorParentOverlayComponent implements OnInit, OnDestroy  {
  @HostBinding('class') classes = 'toolbars-component';

  @ViewChild('container', { read: ViewContainerRef })
  viewContainerRef: ViewContainerRef;

  private componentRef: ComponentRef<{}>;

  private subscriptions = [];

  next: string = null;
  back: string = null;
  isBlack = true;
  label = '';

  constructor(public dialogRef: FactorParentOverlayRef,
              @Inject(FACTOR_PARENT_DIALOG_DATA) public content: any,
              private componentFactoryResolver: ComponentFactoryResolver,
              private navigationService: NavigationService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    if (this.content) {
      const factory = this.componentFactoryResolver.resolveComponentFactory(this.content);
      this.componentRef = this.viewContainerRef.createComponent(factory);

      const instance = this.componentRef.instance;

      instance['onSuccess'].subscribe((result) => {
        this.dialogRef.onAddFactor.emit(result);
      });

    }
  }

  async onBackClicked() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

}
