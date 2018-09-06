import { Injectable } from '@angular/core';
import { CurrencyInfoService } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService
  ) {}
}
