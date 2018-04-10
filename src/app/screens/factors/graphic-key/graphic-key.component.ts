import {
  AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, NgZone, Output,
  ViewChild
} from '@angular/core';
import { FactorType } from '../../../services/auth.service';
import * as PatternLock from 'PatternLock';

declare const Buffer: any;

@Component({
  selector: 'app-graphic-key',
  templateUrl: './graphic-key.component.html',
  styleUrls: ['./graphic-key.component.css']
})

export class GraphicKeyComponent implements AfterViewInit, AfterContentInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @ViewChild('patternContainer') el: ElementRef;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  graphKey: string = null;

  lock: any = null;

  constructor(private readonly ngZone: NgZone) { }

  ngAfterViewInit() {
    this.graphKey = '';
  }

  ngAfterContentInit() {
    this.lock =  new PatternLock(this.el.nativeElement, {
      onDraw: (pattern) => this.ngZone.run(async () => {
        this.graphKey = pattern;
        await this.goNext();
      })
    });
  }

  async goNext() {
    try {
      this.onSuccess.emit({factor: FactorType.GRAPHIC_KEY, value: this.graphKey});
      /*this.busy = true;
      switch (this.next) {
        case 'auth':
          await this.authService.addAuthFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
          await this.router.navigate(['/auth']);
          break;
        case 'registration':
          await this.authService.addFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
          await this.router.navigate(['/registration']);
          break;
        case 'factornode':
          await this.authService.addFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
          await this.router.navigate(['/navigator', {outlets: {navigator: ['factornode']}}]);
          break;
      }*/
    } catch (e) {
      console.log(e);
    }
  }

}
