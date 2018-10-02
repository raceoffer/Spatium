import { FormControl } from '@angular/forms';
import isNumber from 'lodash/isNumber';

export function validateNumber(c: FormControl) {
  return isNumber(c.value) ? null : {
    validateNumber: {
      valid: false
    }
  };
}
