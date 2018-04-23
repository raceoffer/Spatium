import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';

declare const device: any;

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  toolbarClass = 'mat-toolbar mat-primary mat-toolbar-multiple-rows header-toolbar';
  SHADOW = ' shadow';
  MONOCHROME = ' color-custom-dark';

  @Input() isColored: false;
  @Input() isShadowed: false;
  @Input() label: string;

  @Output() backClicked: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
    if (!this.isColored) {
      this.toolbarClass = this.toolbarClass.concat(this.MONOCHROME);
    }
    if (this.isShadowed) {
      this.toolbarClass = this.toolbarClass.concat(this.SHADOW);
    }
  }

  async onBackClicked() {
    this.backClicked.emit();
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

}
