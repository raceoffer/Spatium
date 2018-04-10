import {AfterViewInit, Component, HostBinding, NgZone} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../../services/auth.service';

declare const Buffer: any;

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements AfterViewInit {
  @HostBinding('class') classes = 'content factor-content text-center';
  uploadFile = 'Choose a file';

  next: string = null;
  back: string = null;

  file: any = null;
  reader: any = null;

  busy = false;

  constructor(
    private readonly router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private authService: AuthService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  ngAfterViewInit() {
    this.file = '';
  }

  onUploadFileClick(event) {
    event.preventDefault();

    this.readFile(event.srcElement.files[0]);
  }

  readFile (file) {
    this.reader = new FileReader();

    this.reader.onloadend = () => this.ngZone.run(async () => {
      this.file = new Buffer(this.reader.result);

      await this.goNext();
    });

    this.reader.readAsArrayBuffer(file);
  }

  async goNext() {
    try {
      this.busy = true;
      switch (this.next) {
        case 'auth':
          await this.authService.addAuthFactor(FactorType.FILE, this.file);
          await this.router.navigate(['/auth']);
          break;
        case 'registration':
          await this.authService.addFactor(FactorType.FILE, this.file);
          await this.router.navigate(['/registration']);
          break;
        case 'factornode':
          await this.authService.addFactor(FactorType.FILE, this.file);
          await this.router.navigate(['/navigator', {outlets: {navigator: ['factornode']}}]);
          break;
      }
    } finally {
      this.busy = false;
    }
  }
}
