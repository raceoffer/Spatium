import {AfterViewInit, Component, Input, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService, FactorType} from "../../services/auth.service";

@Component({
  selector: 'app-file-upload',
  host: {'class':'child'},
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})

export class FileUploadComponent implements AfterViewInit {

  uploadFile = 'Choose a file';

  next: string = null;
  back: string = null;

  _file:string = null;

  constructor(private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone,
              private authSevice: AuthService) {
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
    this._file = '';
  }

  onUploadFileClick(event) {
    event.preventDefault();

    var file = event.srcElement.files[0];
    this.readFile(file);
  }

  readFile (file) {
    let chunk = file.slice(0, 32);
    let reader = new FileReader();
    const self = this;

    reader.onloadend = function () {
      const arrayBufferToHex = require('array-buffer-to-hex');
      const string = arrayBufferToHex( reader.result);
      self._file = string;

      self.goNext();
    }

    reader.readAsArrayBuffer(chunk);
  }

  goNext(): void {
    this.authSevice.addFactor( FactorType.FILE, this._file.toString());
    this.ngZone.run(() => {
      this.router.navigate(['/auth']);
    });
  }

}
