import { AfterViewInit, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';

@Component({
  selector: 'app-file-upload',
  host: {'class': 'child'},
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})

export class FileUploadComponent implements AfterViewInit {
  uploadFile = 'Choose a file';

  next: string = null;
  back: string = null;

  file: any = null;

  constructor(
    private readonly router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private authSevice: AuthService
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
    const reader = new FileReader();
    const self = this;

    reader.onloadend = function () {
      const arrayBufferToBuffer = require('arraybuffer-to-buffer');
      self.file = arrayBufferToBuffer(reader.result);

      self.goNext();
    };

    reader.readAsArrayBuffer(file);
  }

  goNext(): void {
    if (this.next && this.next === 'auth') {
      this.authSevice.addFactor( FactorType.FILE, this.file);
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    } else if (this.next && this.next === 'registration') {
      this.authSevice.addFactor( FactorType.FILE, this.file);
      this.ngZone.run(() => {
        this.router.navigate(['/registration']);
      });
    }
  }
}
