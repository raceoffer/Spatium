import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class NavigatorComponent implements OnInit {
  isDarkTheme = false;
  navLinks = [
    {
      name: 'Подключиться к устройству',
      link: '/waiting',
      isSelected: false
    },
    {
      name: 'Сохранить ключ в DHI',
      link: '/backup',
      isSelected: false
    },
    {
      name: 'Сменить кошелек',
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
