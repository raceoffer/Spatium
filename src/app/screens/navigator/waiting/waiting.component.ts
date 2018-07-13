import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { from, Subject } from 'rxjs';
import { take, takeUntil, map, distinctUntilChanged } from 'rxjs/operators';
import { ConnectionProviderService, Provider } from '../../../services/connection-provider';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ConnectionState, State } from '../../../services/primitives/state';
import { toBehaviourSubject } from '../../../utils/transformers';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public discovering = toBehaviourSubject(this.connectionProviderService.searchState.pipe(
    map(state => state !== State.Stopped),
    distinctUntilChanged()
  ), false);

  public connecting = toBehaviourSubject(this.connectionProviderService.connectionState.pipe(
    map(state => state === ConnectionState.Connecting),
    distinctUntilChanged()
  ), false);

  public connected = toBehaviourSubject(this.connectionProviderService.connectionState.pipe(
    map(state => state === ConnectionState.Connected),
    distinctUntilChanged()
  ), false);

  public devices = this.connectionProviderService.devices;

  public providers = this.connectionProviderService.providers;

  public providersArray = toBehaviourSubject(this.connectionProviderService.providers.pipe(
    map(providers => Array.from(providers.values()))
  ), []);

  @Output() public connectedEvent = new EventEmitter<any>();

  private connectionCancelled = new Subject<any>();

  constructor(
    private readonly connectionProviderService: ConnectionProviderService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService
  ) {}

  async ngOnInit() {
    await this.connectionProviderService.searchDevices();
  }

  async connectTo(device) {
    if (this.connecting.getValue()) {
      return;
    }

    try {
      await this.connectionProviderService.disconnect();

      await from(this.connectionProviderService.connect(device)).pipe(take(1), takeUntil(this.connectionCancelled)).toPromise();

      if (this.connected.getValue()) {
        this.connectedEvent.next();
      }
    } catch (e) {
      console.log('Connection failure:', e);
      this.notification.show('Failed to connect to ' + name);
    }
  }

  async startDiscovery() {
    await this.connectionProviderService.searchDevices();
  }

  async toggleProvider(provider: Provider) {
    // await this.connectionProviderService.toggleProvider(provider.provider);
  }

  public cancel() {
    this.connectionCancelled.next();
  }

  onBack() {
    this.navigationService.back();
  }
}
