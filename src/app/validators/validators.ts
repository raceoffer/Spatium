import { FormControl } from '@angular/forms';
import { BigNumber } from 'bignumber.js';

export function validateNumber(c: FormControl) {
  return new BigNumber(c.value).toString() !== c.toString() ? null : {
    validateNumber: {
      valid: false
    }
  };
}
