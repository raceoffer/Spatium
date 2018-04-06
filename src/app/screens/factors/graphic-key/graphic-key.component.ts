import {AfterContentInit, AfterViewInit, Component, ElementRef, HostBinding, NgZone, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../../services/auth.service';
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

  next: string = null;
  back: string = null;
  graphKey: string = null;

  lock: any = null;

  busy = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

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
      this.busy = true;
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
      }
    } finally {
      this.busy = false;
    }
  }

}
