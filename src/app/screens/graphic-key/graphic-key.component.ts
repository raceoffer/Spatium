import {AfterContentInit, AfterViewInit, Component, ElementRef, NgZone, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService, FactorType} from '../../services/auth.service';
import * as PatternLock from 'PatternLock';

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
  _graphKey: string = null;

  constructor(private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone,
              private authSevice: AuthService) {
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
    this._graphKey = '';
  }

  ngAfterContentInit() {
    const lock =  new PatternLock(this.el.nativeElement, {
      onDraw: function(pattern){
        console.log(pattern);
        this._graphKey = pattern;
        this.goNext();
      }.bind(this)
    });

    console.log(lock);
  }

  goNext(): void {
    if (this.next && this.next === 'auth') {

      this.authSevice.addFactor( FactorType.GRAPHIC_KEY, this._graphKey.toString());
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    }
  }

}
