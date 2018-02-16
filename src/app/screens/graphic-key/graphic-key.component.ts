import { AfterContentInit, AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import * as PatternLock from 'PatternLock';

declare const Buffer: any;

@Component({
  selector: 'app-graphic-key',
  host: {'class': 'child content text-center'},
  templateUrl: './graphic-key.component.html',
  styleUrls: ['./graphic-key.component.css']
})

export class GraphicKeyComponent implements AfterViewInit, AfterContentInit {
  @ViewChild('patternContainer') el: ElementRef;

  next: string = null;
  back: string = null;
  graphKey: string = null;

  lock: any = null;

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
    switch (this.next) {
      case 'auth':
        this.authService.addAuthFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        this.authService.addFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
    }
  }

}
