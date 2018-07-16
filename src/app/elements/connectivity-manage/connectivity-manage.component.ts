import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnDestroy, OnInit, Type, ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ProviderType } from '../../services/interfaces/connection-provider';
import { BluetoothComponent } from './bluetooth/bluetooth.component';
import { ZeroconfComponent } from './zeroconf/zeroconf.component';
import { IConnectivityManage } from './interface/connectivity-manage';

@Component({
  selector: 'app-connectivity-manage',
  templateUrl: './connectivity-manage.component.html',
  styleUrls: ['./connectivity-manage.component.css']
})
export class ConnectivityManageComponent implements OnInit, OnDestroy {
  private componentRef: ComponentRef<{}>;

  @Input() context: any;
  @Input() type: ProviderType;

  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;

  static getComponent(provderType: ProviderType): Type<any> {
    switch (provderType) {
      case ProviderType.BLUETOOTH:
        return BluetoothComponent;
      case ProviderType.ZEROCONF:
        return ZeroconfComponent;
    }
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    const componentType = ConnectivityManageComponent.getComponent(this.type);
    const factory = this.componentFactoryResolver.resolveComponentFactory(componentType);
    this.componentRef = this.container.createComponent(factory);
    const instance = this.componentRef.instance as IConnectivityManage;
    instance.context = this.context;
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
