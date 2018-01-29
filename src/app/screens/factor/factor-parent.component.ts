import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-factor',
  templateUrl: './factor-parent.component.html',
  styleUrls: ['./factor-parent.component.css']
})
export class FactorParentComponent implements OnInit {

  next: string = null;
  back: string = null;


  constructor(private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone) {
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

}
