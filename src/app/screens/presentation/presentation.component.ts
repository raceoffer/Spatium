import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../../services/navigation.service';

declare const NativeStorage: any;

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent implements OnInit {

  items = [
    { title: 'Bitcoin',
      image: 'assets/images/drawable/currency/bitcoin.svg',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam turpis lectus, imperdiet eget laoreet luctus, laoreet id lorem. Mauris maximus tincidunt velit, vitae eleifend velit semper id.'
    },
    { title: 'Ethereum',
      image: 'assets/images/drawable/currency/ethereum.svg',
      description: 'Phasellus sed pretium leo. Etiam facilisis sollicitudin felis, suscipit facilisis elit tristique quis. Aliquam erat volutpat. Sed eget viverra arcu.'
    },
    { title: 'Litecoin',
      image: 'assets/images/drawable/currency/litecoin.svg',
      description: 'Fusce mauris urna, viverra nec nisi at, pretium semper leo. Vivamus lobortis in odio id egestas.'
    },
  ]

  constructor(private readonly navigationService: NavigationService) { }

  ngOnInit() {
  }

  async onBack() {
    NativeStorage.setItem('presentation', 'viewed');
    this.navigationService.back();
  }
}
