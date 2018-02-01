import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

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
      name: 'Wallet',
      link: '/wallet',
      isSelected: false,
      isActive: true
    },
    {
      name: 'Exchange',
      link: '',
      isSelected: false,
      isActive: false
    },
    {
      name: 'ICO',
      link: '',
      isSelected: false,
      isActive: false
    },
    {
      name: 'Portfolio Investment',
      link: '',
      isSelected: false,
      isActive: false
    },
    {
      name: 'Verification',
      link: '',
      isSelected: false,
      isActive: false
    },
    {
      name: 'Backup to Decentralized Storage',
      link: '/backup',
      isSelected: false,
      isActive: true
    },
    {
      name: 'Settings',
      link: '',
      isSelected: false,
      isActive: false
    },
    {
      name: 'Exit',
      link: '/start',
      isSelected: false,
      isActive: true
    }];

  changeTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }

  constructor(private readonly router: Router,
              private readonly route: ActivatedRoute) { }

  ngOnInit() {
    this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}], { relativeTo: this.route.parent });
  }

}
