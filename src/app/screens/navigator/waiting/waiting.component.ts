import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { BehaviorSubject, from, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ConnectionProviderService, Provider } from '../../../services/connection-provider';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public discovering = this.connectionProviderService.discovering;
  public connecting = new BehaviorSubject<boolean>(false);
  public devices = this.connectionProviderService.combinedDevices;
  public providers = this.connectionProviderService.providers;
  public providersArray = Array.from(this.connectionProviderService.providers.values());
  @Output() connected = new EventEmitter<any>();
  private connectionCancelled = new Subject<any>();

  constructor(private readonly connectionProviderService: ConnectionProviderService,
              private readonly notification: NotificationService,
              private readonly navigationService: NavigationService) {}

  async ngOnInit() {
    await this.connectionProviderService.searchDevices();
  }

  async connectTo(device) {
    if (this.connecting.getValue()) {
      return;
    }

    try {
      this.connecting.next(true);

      await this.connectionProviderService.disconnect();
      await this.connectionProviderService.cancelDiscovery();

      await from(this.connectionProviderService.connect(device)).pipe(take(1), takeUntil(this.connectionCancelled)).toPromise();
      if (this.connectionProviderService.connected.getValue()) {
        this.connected.next();
      }
    } catch (e) {
      console.log('Connection failure:', e);
      this.notification.show('Failed to connect to ' + name);
    } finally {
      this.connecting.next(false);
    }
  }

  async startDiscovery() {
    await this.connectionProviderService.searchDevices();
  }

  async toggleProvider(provider: Provider) {
    await this.connectionProviderService.toggleProvider(provider.provider);
  }

  hasDisabled() {
    const temp = this.providersArray.filter(p => !p.service.enabled.getValue());
    if (temp.length > 0) {
      return true;
    }

    return false;
  }

  public cancel() {
    this.connectionCancelled.next();
  }

  onBack() {
    this.navigationService.back();
  }
}
