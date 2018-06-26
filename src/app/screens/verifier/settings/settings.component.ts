import {Component, OnInit, HostBinding, NgZone} from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from "../../../services/navigation.service";

declare const NativeStorage: any;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @HostBinding('class') classes = 'overlay-background';

  title = 'Settings';
  hasTouchId: boolean;


  constructor(private readonly router: Router,
              private readonly ngzone: NgZone,
              private readonly navigationService: NavigationService) {
  }

  ngOnInit() {
    NativeStorage.getItem("hasTouchID", (value) => this.getSuccess(value), (error) => this.getError(error));
  }

  getSuccess = function(value) {
    console.log(value);
    this.ngzone.run(async () => {
      this.hasTouchId = value;
    });
  };

  getError = function(error) {
    console.log(error);
    this.ngzone.run(async () => {
      this.hasTouchId = true;
    });
  };

  onBack() {
      this.navigationService.back();
  }

  changedTouchId() {
    NativeStorage.setItem("hasTouchID", this.hasTouchId);
  }
}
