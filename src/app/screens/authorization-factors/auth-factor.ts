import { EventEmitter } from "@angular/core";

export interface AuthFactor {
  submit: EventEmitter<any>;
  back: EventEmitter<any>;
}
