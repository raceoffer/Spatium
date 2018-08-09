import { Component, OnInit } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { setValue } from '../../utils/storage';

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent implements OnInit {

  items = [
    {
      description: 'Choose the <b>Wallet mode</b> to manage your crypto assets. Device in this mode is used as a main device.',
      image: 'assets/images/assistent-slides/2.png'
    },
    {
      description: 'Choose the <b>Confirmation mode</b> to authorize all your transactions.',
      image: 'assets/images/assistent-slides/3.png'
    },
    {
      description: 'If you already have an account, please sign in by entering your username and a set of the authorization factors.',
      image: 'assets/images/assistent-slides/4.png'
    },
    {
      description: 'If you are a new user, please sign up by entering your desired username or generating a random one.',
      image: 'assets/images/assistent-slides/5.png'
    },
    {
      description: 'Afterwards, create a password for you account.',
      image: 'assets/images/assistent-slides/6.png'
    },
    {
      description: 'By clicking on <b>Advanced security</b> you can protect your wallet with several authorization factors you choose instead of a simple password.',
      image: 'assets/images/assistent-slides/7.png'
    },
    {
      description: 'The authorization path you create might include such authorization factors as Password, PIN, Graphic key, QR code etc.',
      image: 'assets/images/assistent-slides/8.png'
    },
    {
      description: 'Please note that apart from authorization factors themselves the order of factors also matters.',
      image: 'assets/images/assistent-slides/9.png'
    },
    {
      description: 'You can create a transaction on your main device by entering the recipient and the amount you’d like to transfer.',
      image: 'assets/images/assistent-slides/10.png'
    },
    {
      description: 'As soon as you click on <b>Sign transaction</b>, it is sent to the device in <b>Confirmation mode</b> for authorizing.',
      image: 'assets/images/assistent-slides/11.png'
    },
    {
      description: 'There you can either confirm or decline the transaction, which cannot be signed without participation of both devices.',
      image: 'assets/images/assistent-slides/12.png'
    },
  ]

  constructor(private readonly navigationService: NavigationService) { }

  ngOnInit() {
  }

  async onBack() {
    setValue('presentation.viewed', true);
    this.navigationService.back();
  }
}
