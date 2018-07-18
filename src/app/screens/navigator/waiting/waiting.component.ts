import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { combineLatest, Subject, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, mergeMap, mapTo } from 'rxjs/operators';
import { ConnectionProviderService } from '../../../services/connection-provider';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ConnectionState, State } from '../../../services/primitives/state';
import { toBehaviourSubject, waitForSubject } from '../../../utils/transformers';

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

  public providerStateChange = this.providersArray.pipe(
    map(providers => providers.map(provider => provider.service.deviceState)),
    mergeMap(providerStates => combineLatest(providerStates as Array<BehaviorSubject<State>>)),
    distinctUntilChanged(),
    mapTo(null)
  );

  public disabledProviders = toBehaviourSubject(combineLatest([
    this.providersArray,
    this.providerStateChange
  ]).pipe(
    map(([providerArray, ignored]) => providerArray.filter(provider => provider.service.deviceState.getValue() === State.Stopped))
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
      await this.connectionProviderService.connect(device);

      if (await waitForSubject(this.connectionProviderService.connectionState, ConnectionState.Connected, this.connectionCancelled)) {
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

  public cancel() {
    this.connectionCancelled.next();
  }

  public async enableProvider(provider) {
    await provider.service.enable();

    await waitForSubject(provider.service.deviceState, State.Started);

    await this.connectionProviderService.searchDevices();
  }

  onBack() {
    this.navigationService.back();
  }
}
