import {AfterContentInit, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import * as PatternLock from '../../../assets/js/patternLock.js';
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

    let qqq =  new PatternLock(this.el.nativeElement,{
      matrix:[3,3],
      radius:10,
      margin:35,
      mapper: function(idx){
        console.log((idx%9) + 1);
      }
    });

    console.log(qqq)

  }

  goNext(): void {
    if (this.next && this.next === 'auth') {
      this.authSevice.addFactor({
        name: 'Password',
        icon: 'keyboard',
        value: '',
      });
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    }
  }

}
