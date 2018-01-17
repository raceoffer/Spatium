import {AfterContentInit, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import * as PatternLock from 'PatternLock';
import * as $ from 'jquery';

@Component({
  selector: 'app-graphic-key',
  templateUrl: './graphic-key.component.html',
  styleUrls: ['./graphic-key.component.css']
})
//let pl:PatternLock = new PatternLock();

export class GraphicKeyComponent implements OnInit, AfterContentInit {

  @ViewChild('patternContainer') el: ElementRef;

  next: string = null;
  back: string = null;
  graph_key: string = null;

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

  ngOnInit() {
  }

  ngAfterContentInit(){
    const self = this;
    let lock =  new PatternLock(this.el.nativeElement,{
      mapper: function(idx){
        return (idx%9) + 1;
      },
      onDraw:function(pattern){
        console.log(pattern)
        self.graph_key = pattern;
        self.goNext();
      }
    });

    console.log(lock)

  }

  goNext(): void {
    if (this.next && this.next === 'auth') {
      this.authSevice.addFactor({
        name: 'GraphicKey',
        icon: '',
        icon_asset: 'graphic-key-big',
        value: this.graph_key.toString(),
      });
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    }
  }

}
