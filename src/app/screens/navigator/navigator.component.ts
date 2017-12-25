import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit {
  isDarkTheme = false;
  navLinks = [
    {
      name: 'Кошелек',
      link: ['/navigator', {outlets: {'navigator': ['wallet']}}],
      isSelected: true
    },
    {
      name: 'ICO',
      link: ['/navigator', {outlets: {'navigator': ['ico']}}],
      isSelected: false
    },
    {
      name: 'Портфельное инвестирование',
      link: ['/navigator', {outlets: {'navigator': ['portfolio_investment']}}],
      isSelected: false
    },
    {
      name: 'Верификация',
      link: ['/navigator', {outlets: {'navigator': ['verification']}}],
      isSelected: false
    },
    {
      name: 'Настройки',
      link: ['/navigator', {outlets: {'navigator': ['options']}}],
      isSelected: false
    },
    {
      name: 'Вход',
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
