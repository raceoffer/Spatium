import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class NavigatorComponent implements OnInit {
  title = 'Wallet';
  isDarkTheme = false;
  navLinks = [
    {
      name: 'Pair devices',
      link: '/waiting',
      isSelected: false
    },
    {
      name: 'Save key to the Decentralized Storage',
      link: '/backup',
      isSelected: false
    },
    {
      name: 'Change wallet',
      link: '/start',
      isSelected: false
    }];

  changeTheme(): void {
    if (this.isDarkTheme) {
      this.isDarkTheme = false;
    } else {
      this.isDarkTheme = true;
    }
  }

  constructor(private readonly router: Router,
              private readonly route: ActivatedRoute) { }

  ngOnInit() {
    this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}], { relativeTo: this.route.parent });
  }

}
