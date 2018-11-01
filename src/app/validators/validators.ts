import { FormControl, ValidatorFn } from '@angular/forms';
import { CurrencyId } from '../services/currencyinfo.service';
import { CurrencyModel } from '../services/wallet/wallet';

export function validateNumber(c: FormControl) {
  return c.value !== null ? null : {
    validateNumber: {
      valid: false
    }
  };
}

export class AmountValidator { 
  private static readonly _validators = new Map<CurrencyId, ValidatorFn>([
    [CurrencyId.Bitcoin, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000547) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinTest, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000547) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinCash, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000547) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.BitcoinCashTest, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000547) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Ethereum, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value);
      if (fp.length < 19) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.EthereumTest, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value);
      if (fp.length < 19) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Litecoin, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000001) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.LitecoinTest, (c: FormControl) => {
      if (!c.value || c.value === '' || c.value > 0.00000001) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Nem, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value); 
      if (c.value > 0 && fp < 7) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.NemTest, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value);
      if (c.value > 0 && fp.length < 7) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.Neo, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value);
      if (c.value > 0 && fp == 0) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }],
    [CurrencyId.NeoTest, (c: FormControl) => {
      if (!c.value || c.value === '') {
        return null;
      }
      let fp = AmountValidator.getFractionPart(c.value);
      if (c.value > 0 && fp == 0) {
        return null;
      }
      return {validateAmount: {valid: false}};
    }]
  ])

  private static getFractionPart(num) {
    return this.toFixed(num).split('.')[1] || '0';
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