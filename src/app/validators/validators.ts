import { FormControl, ValidatorFn } from '@angular/forms';
import { CurrencyId } from '../services/currencyinfo.service';
import { CurrencyModel } from '../services/wallet/wallet';
import isNumber from 'lodash/isNumber';

export function validateNumber(c: FormControl) {
  return c.value !== null ? null : {
    validateNumber: {
      valid: false
    }
  };
}

export class AmountValidator { 

  private static readonly BTC_MIN_VALUE = 0.00000547;
  private static readonly LTC_MIN_VALUE = 0.00000001;
  
  private static readonly ETH_MAX_SYMBOLS = 18;
  private static readonly NEM_MAX_SYMBOLS = 6;
  private static readonly NEO_MAX_SYMBOLS = 0;

  private static readonly _validators = new Map<CurrencyId, ValidatorFn>([
    [CurrencyId.Bitcoin, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.BTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.BTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinCash, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.BTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinCashTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.BTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Ethereum, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.ETH_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.EthereumTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.ETH_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Litecoin, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.LTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.LitecoinTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= AmountValidator.LTC_MIN_VALUE)
        return null;
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Nem, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value >= 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.NEM_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.NemTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value > 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.NEM_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Neo, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value > 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.NEO_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.NeoTest, (c: FormControl) => {
      if (!c.dirty)
        return null;
      if (!isNaN(c.value) && c.value > 0) {
        let fp = AmountValidator.getFractionPart(c.value);
        if (fp.length <= AmountValidator.NEO_MAX_SYMBOLS)
          return null;
      }
      return {validateAmount: {valid: false}};
    }]
  ])

  private static getFractionPart(num) {
    if (!num || isNaN(num))
      return '0';
    return this.toFixed(num).toString().split('.')[1] || '';
  }

  private static toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
  }

  public static getValidator(model: CurrencyModel): ValidatorFn {
    if (!model) {
      return null;
    }
    return this._validators.get(model.currencyInfo.id);
  }
}