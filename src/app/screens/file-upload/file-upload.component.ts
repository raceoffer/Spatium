import { AfterViewInit, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';

@Component({
  selector: 'app-file-upload',
  host: {'class': 'child content text-center'},
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})

export class FileUploadComponent implements AfterViewInit {
  uploadFile = 'Choose a file';

  next: string = null;
  back: string = null;

  file: any = null;
  reader: any = null;

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
      const arrayBufferToBuffer = require('arraybuffer-to-buffer');
      this.file = arrayBufferToBuffer(this.reader.result);

      await this.goNext();
    });

    this.reader.readAsArrayBuffer(file);
  }

  async goNext() {
    switch (this.next) {
      case 'auth':
        this.authService.addAuthFactor(FactorType.FILE, this.file);
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.FILE, this.file);
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        this.authService.addFactor(FactorType.FILE, this.file);
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
    }
  }
}
