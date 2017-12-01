import {OnInit} from '@angular/core';

import bcoin from 'bcoin';

export class BcoinComponent implements OnInit{
  ngOnInit(): void {}

  test(): string {
    console.log('test');
    console.log(bcoin);
    return 'qweerg';
  }
}
