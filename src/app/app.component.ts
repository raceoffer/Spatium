import { Component, OnInit } from '@angular/core';

//declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  isDarkTheme = false;
  navLinks = [
    {
      name: 'Вход',
      link: '/entry',
      isSelected: true
    },
    {
    name: 'Кошелек',
    link: '/wallet',
    isSelected: false
  },
    {
      name: 'ICO',
      link: '/ico',
      isSelected: false
    },
    {
      name: 'Портфельное инвестирование',
      link: '/portfolio_investment',
      isSelected: false
    },
    {
      name: 'Верификация',
      link: '/verification',
      isSelected: false
    },
    {
      name: 'Настройки',
      link: '/options',
      isSelected: false
    }];

  changeTheme(): void {
    if (this.isDarkTheme) {
      this.isDarkTheme = false;
    } else {
      this.isDarkTheme = true;
    }
  }

  //platform = cordova.platformId;

  ngOnInit() {
    /*
  	this.message = cordova.platformVersion;
  	document.addEventListener("deviceready", () => {
      console.log('Using Cordova plugins with Angular. Cordova version: ' + cordova.platformVersion)
    }, false)*/
  }

}
