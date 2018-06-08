import { Directive, Attribute  } from '@angular/core';
import { Validator, NG_VALIDATORS, FormControl } from '@angular/forms';

@Directive({
  selector: '[equal-to]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: EqualToDirective,
      multi: true
    }
  ]
})
export class EqualToDirective implements Validator {
  constructor(
    @Attribute('equal-to') public equalTo: string,
    @Attribute('equal-reverse') public equalReverse: string,
  ) {}

  get reverse() {
    if (!this.equalReverse)
      return false;

    return this.equalReverse === 'true';
  }

  validate(c: FormControl): { [key: string]: any } {
    const e = c.root.get(this.equalTo);

    console.log(this.equalTo, c.value, e);

    if (e && c.value !== e.value && !this.reverse) {
      return {
        equal: false
      }
    }

    if (e && c.value === e.value && this.reverse) {
      delete e.errors['equal'];
      if (!Object.keys(e.errors).length) {
        e.setErrors(null);
      }
    }

    if (e && c.value !== e.value && this.reverse) {
      e.setErrors({ 'equal': true });
    }

    return null;
  }
}
