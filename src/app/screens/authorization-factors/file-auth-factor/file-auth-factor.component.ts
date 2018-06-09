import { AfterViewInit, Component, EventEmitter, HostBinding, NgZone, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';

@Component({
  selector: 'app-file-auth-factor',
  templateUrl: './file-auth-factor.component.html',
  styleUrls: ['./file-auth-factor.component.css']
})
export class FileAuthFactorComponent implements AfterViewInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  @Output() submit = new EventEmitter<any>();
  @Output() back = new EventEmitter<any>();

  uploadFile = 'Choose a file';

  file: any = null;
  reader: any = null;

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit() {
    this.file = '';
  }

  onUploadFileClick(event) {
    event.preventDefault();

    this.readFile(event.srcElement.files[0]);
  }

  readFile(file) {
    this.reader = new FileReader();

    this.reader.onloadend = () => this.ngZone.run(async () => {
      this.file = new Buffer(this.reader.result);

      await this.goNext();
    });

    this.reader.readAsArrayBuffer(file);
  }

  async goNext() {
    this.onSuccess.emit({factor: AuthFactor.File, value: this.file});
  }
}
