import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  toolbarClass = 'header-toolbar';
  SHADOW = ' shadow';
  MONOCHROME = ' color-custom-dark';

  @Input() isColored: boolean;
  @Input() isShadowed: boolean;
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

}
