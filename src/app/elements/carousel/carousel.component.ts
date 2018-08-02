import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Input, OnDestroy,
  OnInit,
  Output,
  QueryList
} from '@angular/core';
import { NgTouch } from 'angular-touch';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CarouselItemDirective } from '../../directives/carousel-item.directive';
import { NavigationService } from '../../services/navigation.service';
import { toBehaviourSubject } from '../../utils/transformers';

@Directive({
  selector: '.carousel-item'
})

export class CarouselItemElement {
}

@Component({
  selector: 'carousel',
  exportAs: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @ContentChildren(CarouselItemDirective) items: QueryList<CarouselItemDirective>;
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  currentSlide = new BehaviorSubject<number>(0);
  isFirst: BehaviorSubject<boolean> = toBehaviourSubject(this.currentSlide.pipe(map(currentSlide => currentSlide === 0)), false);
  isLast: BehaviorSubject<boolean> = toBehaviourSubject(this.currentSlide.pipe(map((currentSlide) => ((currentSlide !== 0) && (currentSlide + 1 === this.items.length)))), false);
  private subscriptions = [];

  constructor(private el: ElementRef, private readonly navigationService: NavigationService) { }

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
    this.setNewSlide((this.currentSlide.getValue() + 1) % this.items.length, 'next');
  }

  prev() {
    if (this.currentSlide.getValue() === 0) {
      return;
    }
    this.setNewSlide((this.currentSlide.getValue() - 1) % this.items.length, 'prev');
  }

  skip() {
    this.close.emit();
  }

  public setNewSlide(newSlide: number, direction: string): void {
    const currentSlide = this.el.nativeElement.querySelector(`[data-slide="${this.currentSlide.getValue()}"]`);
    const nextSlide = this.el.nativeElement.querySelector(`[data-slide="${newSlide}"]`);

    this.animate(currentSlide, nextSlide, direction);

    this.currentSlide.next(newSlide);
  }

  private animate(currentSlide: HTMLElement, nextSlide: HTMLElement, direction: string): void {
    currentSlide.className = nextSlide.className = 'carousel-item';
    this.toggleClass(`carousel-item--hidden-slide-${direction}`, currentSlide);
    this.toggleClass(`carousel-item--show-slide-${direction}`, nextSlide);
  }

  private toggleClass(className: string, ...elements): void {
    elements.forEach((element) => {
      element.classList.toggle(className);
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
