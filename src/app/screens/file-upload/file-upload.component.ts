import {AfterViewInit, Component, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-file-upload',
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

  onUploadFileClick() :void{
    this._file = 'lkasjdksajdlaskdj';
    this.goNext();
  }

  goNext(): void {
    this.authSevice.addFactor( AuthService.FactorType.FILE, this._file.toString());
    this.ngZone.run(() => {
      this.router.navigate(['/auth']);
    });
  }

}
