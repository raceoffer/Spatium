import {
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';

import * as PatternLock from 'PatternLock';

@Component({
  selector: 'app-graphic-key',
  templateUrl: './graphic-key.component.html',
  styleUrls: ['./graphic-key.component.css']
})
export class GraphicKeyComponent implements AfterContentInit {
  @ViewChild('patternContainer') patternContainer: ElementRef;

  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  private lock: any = null;

  constructor(private readonly ngZone: NgZone) { }

  ngAfterContentInit() {
    this.lock = new PatternLock(this.patternContainer.nativeElement, {
      onDraw: pattern => this.ngZone.run(() => {
        this.submit.next(pattern);
      })
    });
  }
}
