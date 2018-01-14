import {Injectable} from '@angular/core';

@Injectable()
export class AuthService {
  login: string;
  factors: any;

  constructor() {
    this.factors = [];
  }

  addFactor(factor) {
    this.factors.push(factor);
  }

  rmFactor(factor) {
    this.factors.splice(this.factors.indexOf(factor), 1);
  }

  clearFactors() {
    this.factors = [];
  }
}
