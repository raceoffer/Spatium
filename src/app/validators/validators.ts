import { FormControl } from '@angular/forms';

export function validateNumber(c: FormControl) {
  return c.value !== null ? null : {
    validateNumber: {
      valid: false
    }
  };
}
