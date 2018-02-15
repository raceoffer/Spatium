import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-delete-secret',
  templateUrl: './delete-secret.component.html',
  styleUrls: ['./delete-secret.component.css']
})
export class DeleteSecretComponent implements OnInit {

  title = "Deleting secret";
  description = "Please confirm that you want to delete the secret from this device. Type the following word with respect to the register."
  checkPhrase = "delete";
  checkInput;
  confirmButton = "Confirm";

  constructor(
    private readonly router: Router,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { 
    this.checkPhrase = this.сapitalizeRandomChars(this.checkPhrase);
  }

  ngOnInit() {
  }

  async delete() {
    try {
      await this.fs.deleteFile(this.fs.safeFileName('seed'));
    } catch(e) {
      this.notification.show('Delete error');
      return;
    }
    this.notification.show('The secret successfully removed');
    await this.router.navigate(['/login']);
  }

  сapitalizeRandomChars(s: string){
    let len = s.length;
    let c1 = this.getRandomNumber(0, len, undefined);
    let c2 = this.getRandomNumber(0, len, c1);

    s = s.toLowerCase();
    s = this.replaceAt(s, c1, s.charAt(c1).toUpperCase());
    s = this.replaceAt(s, c2, s.charAt(c2).toUpperCase());

    return s;
  };

  getRandomNumber(min: number, max: number, exclude: number) {
    let n = Math.floor(Math.random() * (max - min) + min);
    if (!exclude || n != exclude)
      return n;
    else return this.getRandomNumber(min, max, exclude);
  }

  replaceAt(s: string, i: number, replacement: string) {
    return s.substr(0, i) + replacement + s.substr(i + replacement.length);
  }

}
