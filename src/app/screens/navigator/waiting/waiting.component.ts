import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { combineLatest, Subject, BehaviorSubject, timer } from 'rxjs';
import { map, distinctUntilChanged, mergeMap, mapTo } from 'rxjs/operators';
import { ConnectionProviderService } from '../../../services/connection-provider';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ConnectionState, State } from '../../../services/primitives/state';
import { toBehaviourSubject, waitForSubject } from '../../../utils/transformers';
import { ProviderType } from '../../../services/interfaces/connection-provider';
import { requestDialog } from '../../../utils/dialog';
import { DeviceService, Platform } from '../../../services/device.service';

declare const cordova: any;

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
    map(([providerArray, ignored]) => providerArray.filter(provider => provider.service.deviceState.getValue() !== State.Started))
  ), []);

  public stateType = State;

  @Output() public connectedEvent = new EventEmitter<any>();

  private connectionCancelled = new Subject<any>();

  constructor(
    private readonly connectionProviderService: ConnectionProviderService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly deviceService: DeviceService
  ) {}

  async ngOnInit() {
    await timer(500).toPromise();
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
      this.notification.show('Failed to connect to ' + device.name);
    }
  }

  async startDiscovery() {
    await this.connectionProviderService.resetDevices();
    await this.connectionProviderService.searchDevices();
  }

  public cancel() {
    this.connectionCancelled.next();
  }

  public async enableProvider(provider) {
    switch (provider.provider) {
      case ProviderType.ZEROCONF:
        if (provider.service.deviceState.getValue() === State.Stopped) {
          if (this.deviceService.platform === Platform.Android) {
            if (await requestDialog('The application wants to enable Wifi')) {
              await provider.service.enable();
            }
          } else {
            this.networkSettings();
          }
        } else {
          this.networkSettings();
        }
        break;
      case ProviderType.BLUETOOTH:
        await provider.service.enable();
        break;
    }

    await waitForSubject(provider.service.deviceState, State.Started, this.connectionCancelled);

    await this.connectionProviderService.searchDevices();
  }

  networkSettings() {
    if (this.deviceService.platform === Platform.IOS) {
      cordova.plugins.diagnostic.switchToSettings();
    } else {
      cordova.plugins.diagnostic.switchToWifiSettings();
    }
  }

  onBack() {
    this.navigationService.back();
  }
}
