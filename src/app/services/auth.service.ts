import {Injectable} from '@angular/core';

@Injectable()
export class AuthService {
  enabled = false;

  login: string;
  factors: Factors[];


  constructor() {}


}

enum FactorType {PIN, Password}

export class Factors {
  type: FactorType;
  value: string;
  icon: string;

  constructor( type: FactorType, value: string, icon: string ) {
    this.type = type;
    this.value = value;
    this.icon = icon;
  }

}
