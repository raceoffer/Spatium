import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DDSService } from "../../services/dds.service";
import { NavigationService } from '../../services/navigation.service';
import { LoggerService } from '../../services/logger.service';
import { FeedbackData, FeedbackDataFile } from '../../data/feedback-data';
import { FileInfo } from '../../data/file-info';

declare const cordova: any;
declare const window: any;
declare const hockeyapp: any;

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
  screenshotsPreview: FileInfo[] = [];
  maximumScreenshots: number = 2;
  sendLogs = true;

  private subscriptions = [];

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly route: ActivatedRoute,
              private readonly dds: DDSService,
              private readonly navigationService: NavigationService,
              private readonly loggerService: LoggerService) { }

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

  get canUploadFile(): boolean {
    return this.screenshotsPreview.length < this.maximumScreenshots;
  }

  onUploadFileClick(event) {
    console.log(event);

    if (event.srcElement.files && event.srcElement.files[0]) {
      const reader = new FileReader();
      const file: File = event.srcElement.files[0];

      reader.onload = (e) => {
        console.log(e.target);
        console.log('file:', );
        const fileInfo: FileInfo = new FileInfo(file, (<FileReader>e.target).result);
        this.screenshotsPreview.push(fileInfo);
        console.log(this.screenshotsPreview);
      };

      reader.readAsDataURL(event.srcElement.files[0]);
    }
  }

  async onSendClicked() {
    const feedbackData = new FeedbackData();
    feedbackData.email = this.email;
    feedbackData.text = this.description;

    if (this.sendLogs) {
      const data: string = await this.loggerService.getLogData();
      const blob: Blob = new Blob([data], {type: 'text/plain'});
      const name: string = this.loggerService.logFileName;
      feedbackData.logFile = new FeedbackDataFile(blob, name);
    }

    for (const screen of this.screenshotsPreview) {
      feedbackData.attachments.push(screen.file);
    }

    hockeyapp.sendFeedback(feedbackData, (ok) => {
      console.log('send success:', ok);
    }, (e) => {
      console.log('send error:', e);
    });
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
