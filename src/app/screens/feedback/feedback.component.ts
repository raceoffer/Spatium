import { Component, HostBinding, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DDSService } from "../../services/dds.service";
import { NavigationService } from '../../services/navigation.service';
import { LoggerService } from '../../services/logger.service';
import { FeedbackData, FeedbackDataFile } from '../../data/feedback-data';
import { FileInfo } from '../../data/file-info';
import { NotificationService } from '../../services/notification.service';
import { FormControl, Validators } from '@angular/forms';

declare const cordova: any;
declare const window: any;
declare const hockeyapp: any;

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';
  title = 'Feedback';
  stContact = 'Enter your email:';
  stProblem = 'Describe your problem:';
  stAppLogs = 'Add app logs';
  stScreenshots = 'Add screenshots:';
  contactInfo = '';
  cols = 1;
  screenshotsPreview: FileInfo[] = [];
  maximumScreenshots: number = 2;
  sendLogs = true;
  sending = false;
  email = new FormControl('', [Validators.required, Validators.email]);
  description = new FormControl('', [Validators.required]);

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly route: ActivatedRoute,
              private readonly dds: DDSService,
              private readonly navigationService: NavigationService,
              private readonly loggerService: LoggerService,
              private readonly notificationService: NotificationService) { }


  ngOnInit() {
    this.onResize();
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

  get feedbackValid(): boolean {
    return this.email.valid && this.description.valid;
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
    this.sending = true;
    const feedbackData = new FeedbackData();
    feedbackData.email = this.email.value;
    feedbackData.text = this.description.value;

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
      this.sending = false;
      this.notificationService.show('Thank you for the feedback');
      this.navigationService.back();
    }, (e) => {
      console.log('send error:', e);
      this.sending = false;
      this.notificationService.show('Failed to send the feedback');
    });
  }

  onBackClicked() {
    this.navigationService.back();
  }

  getEmailErrorMessage(): string {
    return this.email.hasError('required') ? 'You must enter an email' :
      this.email.hasError('email') ? 'Not a valid email' :
        '';
  }

  getDescriptionErrorMessage(): string {
    return this.description.hasError('required') ? 'You must enter a description' : '';
  }
}
