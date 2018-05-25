import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DDSService } from "../../services/dds.service";
import { NavigationService } from '../../services/navigation.service';

declare const cordova: any;
declare const window: any;

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  title = 'Feedback';
  stContact = 'Enter your email:';
  stProblem = 'Describe your problem:';
  stAppLogs = 'Add app logs';
  stScreenshots = 'Add screenshots:';
  back = null;
  contactInfo = '';
  cols = 1;
  screenshotsPreview = [];
  sendLogs = false;

  private subscriptions = [];

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly route: ActivatedRoute,
              private readonly dds: DDSService,
              private readonly navigationService: NavigationService) { }

  private _email = '';

  get email() {
    return this._email;
  }

  set email(newEmail) {
    this._email = newEmail;
  }

  private _description = '';

  get description() {
    return this._description;
  }

  set description(newDescription) {
    this._description = newDescription;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.route.params.subscribe((params: Params) => {
      if (params['back']) {
        this.back = params['back'];
      }
    });

    this.onResize();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  paste() {
    cordova.plugins.clipboard.paste(text => this.ngZone.run(() => {
      if (text !== '') {
        this.contactInfo = text;
      }
    }), e => console.log(e));
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  removeScreenshot(screen) {
    this.screenshotsPreview.splice(this.screenshotsPreview.indexOf(screen), 1);
  }

  onUploadFileClick(event) {
    console.log(event);

    if (event.srcElement.files && event.srcElement.files[0]) {
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log(e.target);
        const file: FileInfo = new FileInfo(event.srcElement.files[0], (<FileReader>e.target).result);
        this.screenshotsPreview.push(file);
        console.log(this.screenshotsPreview);
      };

      reader.readAsDataURL(event.srcElement.files[0]);
    }
  }

  onSendClicked() {
    let formData = new FormData();
    formData.append('email', this.email);
    formData.append('description', this.description);

    if (this.sendLogs) {
      /*for (const log of this.filelogs) {
        formData.append('log[]', log, log.name);
      }*/
    }

    formData.append('log[]', 'log content', 'log name');
    formData.append('log[]', 'log content 2', 'log name 2');

    for (const screen of this.screenshotsPreview) {
      const file = screen.bolb;
      formData.append('screenshot[]', file, file.name);
    }

    console.log(formData.getAll('email'));
    console.log(formData.getAll('description'));
    console.log(formData.getAll('screenshot[]'));

    this.dds.sponsorFeedback(formData);

  }

  async onBackClicked() {
    switch (this.back) {
      case 'main':
        await this.router.navigate(['/navigator', {outlets: {'navigator': ['waiting']}}]);
        break;
      case 'second':
        await  this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['main']}}]);
        break;
    }
  }

}

export class FileInfo {
  bolb: any;
  src: string;

  constructor(bolb, src) {
    this.bolb = bolb;
    this.src = src;
  }
}
