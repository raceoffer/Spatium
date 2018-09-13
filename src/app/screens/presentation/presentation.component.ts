import { Component, EventEmitter } from '@angular/core';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent {
  public path = 'assets/images/assistent-slides/' + ((this.deviceService.platform === Platform.IOS) ? 'ios/' : 'android/');

  public items = [
    {
      description: 'Choose the <b>Wallet mode</b> to manage your crypto assets. Device in this mode is used as a main device.',
      image: this.path + '2.png'
    },
    {
      description: 'Choose the <b>Confirmation mode</b> to authorize all your transactions.',
      image: this.path + '3.png'
    },
    {
      description: 'If you already have an account, please sign in by entering your username and a set of the authorization factors.',
      image: this.path + '4.png'
    },
    {
      description: 'If you are a new user, please sign up by entering your desired username or generating a random one.',
      image: this.path + '5.png'
    },
    {
      description: 'Afterwards, create a password for you account.',
      image: this.path + '6.png'
    },
    {
      // tslint:disable-next-line:max-line-length
      description: 'By clicking on <b>Advanced security</b> you can protect your wallet with several authorization factors you choose instead of a simple password.',
      image: this.path + '7.png'
    },
    {
      description: 'The authorization path you create might include such authorization factors as Password, PIN, Graphic key, QR code etc.',
      image: this.path + '8.png'
    },
    {
      description: 'Please note that apart from authorization factors themselves the order of factors also matters.',
      image: this.path + '9.png'
    },
    {
      description: 'You can create a transaction on your main device by entering the recipient and the amount you’d like to transfer.',
      image: this.path + '10.png'
    },
    {
      description: 'As soon as you click on <b>Sign transaction</b>, it is sent to the device in <b>Confirmation mode</b> for authorizing.',
      image: this.path + '11.png'
    },
    {
      description: 'There you can either confirm or decline the transaction, which cannot be signed without participation of both devices.',
      image: this.path + '12.png'
    },
  ];

  public finished = new EventEmitter<any>();
  public skipped = new EventEmitter<any>();
  public cancelled = new EventEmitter<any>();

  constructor(
    private readonly navigationService: NavigationService,
    private readonly deviceService: DeviceService
  ) { }

  public cancel() {
    this.cancelled.next();
  }

  public finish() {
    this.finished.next();
  }

  public skip() {
    this.skipped.next();
  }
}
