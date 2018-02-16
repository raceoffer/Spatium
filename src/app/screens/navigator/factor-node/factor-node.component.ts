import {
  AfterViewInit, animate, ChangeDetectorRef, Component, ElementRef, OnInit, sequence, style, transition,
  trigger, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../../dialog-factors/dialog-factors.component';
import { Coin, KeyChainService } from '../../../services/keychain.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import * as $ from 'jquery';

declare const Utils: any;

@Component({
  selector: 'app-factor-node',
  animations: [
    trigger('anim', [
      transition('* => void', [
        style({ height: '*', opacity: '1', transform: 'translateX(0)'} ),
        sequence([
          animate('.5s ease', style({ height: '*', opacity: '.2', transform: 'translateX(60px)' })),
          animate('.1s ease', style({ height: '*', opacity: 0, transform: 'translateX(60px)' }))
        ])
      ]),
    ])],
  templateUrl: './factor-node.component.html',
  styleUrls: ['./factor-node.component.css']
})
export class FactorNodeComponent implements OnInit, AfterViewInit {

  title = 'Adding authentication path';
  factors = [];

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(
    public  dialog: MatDialog,
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly authSevice: AuthService
  ) { }

  ngOnInit() {
    this.factors = this.authSevice.factors;

    $('#factor-container').scroll(function () {

      if ($(this).scrollTop() > 0) {
        $('#top-scroller').fadeIn();
      } else {
        $('#top-scroller').fadeOut();
      }

      if ($(this).scrollTop() <  ($(this)[0].scrollHeight - $(this).height()) ) {
        $('#bottom-scroller').fadeIn();
      } else {
        $('#bottom-scroller').fadeOut();
      }
    });
  }

  ngAfterViewInit() {

    this.checkOverflow(this.factorContainer);
    this.goBottom();

    this.changeDetectorRef.detectChanges();
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
  }

  goTop() {
    $('#factor-container').animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    const container = $('#factor-container');
    container.animate({scrollTop: container.height()}, 500, 'swing');
  }

  addNewFactor() {
    const isFirst = this.factors.length === 0;
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'factornode', next: 'factornode', isFirst: isFirst }
    });
  }

  async removeFactor(factor) {
    this.authSevice.rmFactorWithChildren(factor);
    this.factors = this.authSevice.factors;
    this.changeDetectorRef.detectChanges();

    this.sleep(650).then(function() {
      this.checkOverflow(this.factorContainer);
    }.bind(this));
  }

  async sleep(ms: number) {
    await this._sleep(ms);
  }

  _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onSaveClicked() {
    const factors = this.factors.map(factor => factor.toBuffer()).reverse();
    const tree = factors.reduce((rest, factor) => {
      const node = {
        factor: factor
      };
      if (rest) {
        node['children'] = [ rest ];
      }
      return node;
    }, null);

    this.authSevice.clearFactors();
    this.authSevice.password = '';
    this.factors = [];

    this.authSevice.encryptedTreeData = Utils.packTree(tree, node => node.factor, this.keychain.seed);
    this.authSevice.ethereumSecret = this.keychain.getCoinSecret(Coin.ETH, 0);

    await this.router.navigate(['/navigator', { outlets: { navigator: ['backup', 'factor-node'] } }]);
  }

  async onBackClick() {
    await this.router.navigate(['/navigator', { outlets: { navigator: ['settings'] } }]);
  }
}
