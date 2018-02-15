import {AfterContentInit, AfterViewInit, Component, ElementRef, NgZone, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService, FactorType} from '../../services/auth.service';
import * as PatternLock from 'PatternLock';

declare const Buffer: any;

@Component({
  selector: 'app-graphic-key',
  host: {'class': 'child'},
  templateUrl: './graphic-key.component.html',
  styleUrls: ['./graphic-key.component.css']
})

export class GraphicKeyComponent implements AfterViewInit, AfterContentInit {
  @ViewChild('patternContainer') el: ElementRef;

  next: string = null;
  back: string = null;
  graphKey: string = null;

  constructor(private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone,
              private authService: AuthService) {
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
    const lock =  new PatternLock(this.el.nativeElement, {
      onDraw: function(pattern){
        console.log(pattern);
        this.graphKey = pattern;
        this.goNext();
      }.bind(this)
    });

    console.log(lock);
  }

  goNext(): void {
    if (this.next && this.next === 'auth') {
      this.authService.addAuthFactor( FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    } else if (this.next && this.next === 'registration') {
      this.authService.addFactor( FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));
      this.ngZone.run(() => {
        this.router.navigate(['/registration']);
      });
    } else if (this.next && this.next === 'factornode') {
      this.authService.addFactor(FactorType.GRAPHIC_KEY, Buffer.from(this.graphKey, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/factornode']);
      });
    }
  }

}
