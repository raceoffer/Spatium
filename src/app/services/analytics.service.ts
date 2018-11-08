import { Injectable } from '@angular/core';
import { Utils } from 'crypto-core-async';
import { DeviceService, Platform } from '../services/device.service';
import { KeyChainService } from '../services/keychain.service';
import { WorkerService } from '../services/worker.service';
import { deriveAesKey } from 'crypto-core-async/lib/utils';

declare const window: any;

export enum View {
  WelcomeScreen                 = 'Welcome screen',
  WelcomeSeries                 = 'Welcome series',

  RegistrationWalletMode        = 'Registration — wallet mode',
  RegistrationConfirmationMode  = 'Registration — confirmation mode',
  RegistrationBackup            = 'Registration — backup',

  AuthWalletMode                = 'Auth — wallet mode',
  AuthConfirmationMode          = 'Auth — confirmation mode',

  Wallet                        = 'Wallet',
  DeviceDiscovery               = 'Device discovery',
  SettingsWalletMode            = 'Settings - wallet mode',
  AddAuthPath                   = 'Add authorization path',
  AddToken                      = 'Add token',
  Currency                      = 'Currency',
  CurrencySettings              = 'Currency settings',
  SendTransaction               = 'SendTransaction',

  Verifier                      = 'Advertise confirmation device',
  ChangePincode                 = 'Change pincode',
  SettingsConfirmationMode      = 'Settings — confirmation mode',
  VerifyTransaction             = 'Verify transaction',
  SecretImport                  = 'Secret — import',
  SecretExport                  = 'Secret — export',
  DeleteSecret                  = 'Secret — delete',

  Feedback                      = 'Feedback'
}

export enum Event {
  CompleteTutorial,
  CompleteRegistration
}

class EventInfo {

  private _category: string;
  private _androidAction: string;
  private _iosAction: string;

  constructor(category: string, androidAction: string, iosAction: string) {
    this._category = category;
    this._androidAction = androidAction;
    this._iosAction = iosAction;
  }

  public get category(): string {
    return this._category;
  }
  
  public get androidAction(): string {
    return this._androidAction;
  }
  
  public get iosAction(): string {
    return this._iosAction;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private googleAnalytics: any;
  private branch: any;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly keyChainService: KeyChainService,
    private readonly workerService: WorkerService,
  ){
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    this.googleAnalytics = window.ga;
    this.branch = window.Branch;

    try {
      await this.googleAnalytics.startTrackerWithId('UA-128241563-1');
    } catch{
      e => console.log('Error starting GoogleAnalytics', e)
      return;
    };

    console.log('Google analytics is ready now');

    this.googleAnalytics.setAllowIDFACollection(true);

    this.googleAnalytics.getVar(
      '&cid',
      cid => this.branch.setRequestMetadata("$google_analytics_client_id", cid),
      e => console.log('Unable to get cid from GoogleAnalytics', e)
    );

    this.keyChainService.seedEvent.subscribe(async seed => await this.setUserId(seed));
  }

  private async setUserId(seed) {
    if (!seed)
      return;
      
    const seedHash = await Utils.sha256(seed);
    const userId = await deriveAesKey(Buffer.from(seedHash, 'utf-8'), this.workerService.worker);
    this.googleAnalytics.setUserId(userId.toString('hex'));
  }

  public trackView(view: View, postfix: string = null) {
    const viewTitle = postfix ? view + " " + postfix : view;
    console.log('View', viewTitle);
    this.googleAnalytics.trackView(viewTitle, undefined, undefined, () => {},
      e => console.log("Trackview error", e)
    );
  }

  private events: Map<Event,EventInfo> = new Map([
    [Event.CompleteTutorial, new EventInfo(
      'CompleteTutorial', 
      'BRANCH_STANDARD_EVENT.COMPLETE_TUTORIAL',
      'BranchStandardEventCompleteTutorial')],
    [Event.CompleteRegistration, new EventInfo(
      'CompleteRegistration', 
      'BRANCH_STANDARD_EVENT.COMPLETE_REGISTRATION',
      'BranchStandardEventCompleteRegistration')],
  ]);

  public async trackEvent(event: Event, action = 'success') {
    if (!this.events.has(event)) {
      throw new Error('Illigal argument exception');
    }

    let info = this.events.get(event);
    this.googleAnalytics.trackEvent(info.category, action, undefined, undefined, () => {},
      e => console.log("Trackevent error", e)
    );
    
    let branchAction;
    switch (this.deviceService.platform) {
      case Platform.Android:
        branchAction = info.androidAction;
        break;
      case Platform.IOS:
        branchAction = info.iosAction;
        break;
    }

    try {
      await this.branch.userCompletedAction(branchAction);
    } catch { e => console.log('Error during registration of Branch event', e) }
  }
}

