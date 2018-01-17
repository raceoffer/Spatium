import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {

  uploadFile = 'Choose a file';

  next: string = null;
  back: string = null;

  _fileHash:string = null;

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

  ngOnInit() {
  }

  onUploadFileClick() :void{
    this._fileHash = 'lkasjdksajdlaskdj';
    this.goNext();
  }

  goNext(): void {
    this.authSevice.addFactor({
      name: 'File',
      icon: 'insert_drive_file',
      value: this._fileHash.toString(),
    });
    this.ngZone.run(() => {
      this.router.navigate(['/auth']);
    });
  }

}
