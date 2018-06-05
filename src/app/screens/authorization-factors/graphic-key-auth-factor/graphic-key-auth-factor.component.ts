import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';
import * as PatternLock from 'PatternLock';
import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-graphic-key-auth-factor',
  templateUrl: './graphic-key-auth-factor.component.html',
  styleUrls: ['./graphic-key-auth-factor.component.css']
})
export class GraphicKeyAuthFactorComponent implements AfterViewInit, AfterContentInit {
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
    this.lock = new PatternLock(this.el.nativeElement, {
      onDraw: (pattern) => this.ngZone.run(async () => {
        this.graphKey = pattern;
        await this.goNext();
      })
    });
  }

  async goNext() {
    this.onSuccess.emit({factor: FactorType.GRAPHIC_KEY, value: this.graphKey});
  }

}
