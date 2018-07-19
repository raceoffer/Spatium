import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, style } from '@angular/animations';
import {
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { NgTouch } from 'angular-touch';
import { CarouselItemDirective } from '../../directives/carousel-item.directive';
import { NavigationService } from '../../services/navigation.service';
import { BehaviorSubject } from "rxjs/Rx";

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
  @ContentChildren(CarouselItemDirective) items: QueryList<CarouselItemDirective>;
  @Input() timing = '250ms ease-in';
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  public carouselWrapperStyle = {}

  @ViewChildren(CarouselItemElement, {read: ElementRef}) private itemsElements: QueryList<ElementRef>;
  @ViewChild('carousel') private carousel: ElementRef;
  private subscriptions = [];
  private player: AnimationPlayer;
  private itemWidth: number;
  currentSlide = new BehaviorSubject<number>(0);

  constructor(private builder: AnimationBuilder,
              private readonly navigationService: NavigationService) {
  }

  ngOnInit() {

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async (e) => {
        this.prev();
      })
    );
  }

  next() {
    if (this.currentSlide.getValue() + 1 === this.items.length) {
      this.skip();
      return;
    }

    this.currentSlide.next( (this.currentSlide.getValue() + 1) % this.items.length);
    const offset = this.currentSlide.getValue() * this.itemWidth;
    const animation: AnimationFactory = this.buildAnimation(offset);
    this.player = animation.create(this.carousel.nativeElement);
    this.player.play();
  }

  prev() {
    if (this.currentSlide.getValue() === 0) {
      return;
    }

    this.currentSlide.next(((this.currentSlide.getValue() - 1) + this.items.length) % this.items.length);
    const offset = this.currentSlide.getValue() * this.itemWidth;

    const animation: AnimationFactory = this.buildAnimation(offset);
    this.player = animation.create(this.carousel.nativeElement);
    this.player.play();
  }

  skip() {
    this.close.emit();
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

  private buildAnimation(offset) {
    return this.builder.build([
      animate(this.timing, style({transform: `translateX(-${offset}px)`}))
    ]);
  }
}
