import {
  EventEmitter,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  Output
} from '@angular/core';
import { CarouselItemDirective } from './carousel-item.directive';
import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, style } from '@angular/animations';
import { NgTouch } from 'angular-touch';
import { NavigationService } from '../../services/navigation.service';

@Directive({
  selector: '.carousel-item'
})

export class CarouselItemElement {
}

@Component({
  selector: 'carousel',
  exportAs: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {
  private subscriptions = [];
  constructor(
    private builder : AnimationBuilder,
    private readonly navigationService: NavigationService
    ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async (e) => {
        await this.prev();
      })
    );
  }

  @ContentChildren(CarouselItemDirective) items : QueryList<CarouselItemDirective>;
  @ViewChildren(CarouselItemElement, { read: ElementRef }) private itemsElements : QueryList<ElementRef>;
  @ViewChild('carousel') private carousel : ElementRef;
  @Input() timing = '250ms ease-in';

  @Output() prevScreen: EventEmitter<any> = new EventEmitter<any>();
  @Output() nextScreen: EventEmitter<any> = new EventEmitter<any>();

  private player : AnimationPlayer;
  private itemWidth : number;
  private currentSlide = 0;
  carouselWrapperStyle = {}

  next() {
    if( this.currentSlide + 1 === this.items.length ) {
      this.nextScreen.emit();
      return;
    }

    this.currentSlide = (this.currentSlide + 1) % this.items.length;
    const offset = this.currentSlide * this.itemWidth;
    const animation : AnimationFactory = this.buildAnimation(offset);
    this.player = animation.create(this.carousel.nativeElement);
    this.player.play();
  }

  private buildAnimation(offset) {
    return this.builder.build([
      animate(this.timing, style({ transform: `translateX(-${offset}px)` }))
    ]);
  }

  prev() {
    if( this.currentSlide === 0 ) {
      this.prevScreen.emit();
      return;
    }

    this.currentSlide = ((this.currentSlide - 1) + this.items.length) % this.items.length;
    const offset = this.currentSlide * this.itemWidth;

    const animation : AnimationFactory = this.buildAnimation(offset);
    this.player = animation.create(this.carousel.nativeElement);
    this.player.play();
  }

  skip() {
    this.nextScreen.emit();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.itemWidth = this.itemsElements.first.nativeElement.getBoundingClientRect().width;
      this.carouselWrapperStyle = {
        width: `${this.itemWidth}px`
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
