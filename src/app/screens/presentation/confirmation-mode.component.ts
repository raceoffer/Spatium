import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

declare const NativeStorage: any;

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationConfirmationModeComponent implements OnInit {

  constructor(private readonly router: Router) { }

  items = [
    { title: 'Metal',
      image: 'assets/images/drawable/currency/metal.svg',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam turpis lectus, imperdiet eget laoreet luctus, laoreet id lorem. Mauris maximus tincidunt velit, vitae eleifend velit semper id.'
    },
    { title: 'Neo',
      image: 'assets/images/drawable/currency/neo.svg',
      description: 'Phasellus sed pretium leo. Etiam facilisis sollicitudin felis, suscipit facilisis elit tristique quis. Aliquam erat volutpat. Sed eget viverra arcu.'
    },
    { title: 'Nem',
      image: 'assets/images/drawable/currency/nem.svg',
      description: 'Fusce mauris urna, viverra nec nisi at, pretium semper leo. Vivamus lobortis in odio id egestas.'
    },
  ]

  ngOnInit() {
  }

  async onForward() {
    NativeStorage.setItem('startPath', '/verifier-create');
    NativeStorage.setItem('confirmationPresentation', 'viewed');
    await this.router.navigate(['/verifier-create']);
  }

  async onBack() {
    await this.router.navigate(['/start']);
  }
}
