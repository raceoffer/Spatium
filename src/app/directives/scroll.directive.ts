import { Directive, HostListener, EventEmitter, Output } from "@angular/core";

@Directive({
  selector: "[scroll-directive]"
})
export class ScrollDirective {

  // Event output the current scroll percentage
  @Output() onScroll = new EventEmitter<number>();

  // Holds the current percent value
  percentValue: number = 0;

  // Event listener for scroll event on the specific ui element
  @HostListener("scroll", ["$event"])
  onListenerTriggered(event: UIEvent): void {

    // Calculate the scroll percentage
    const percent = Math.round((event.srcElement.scrollTop / (event.srcElement.scrollHeight - event.srcElement.clientHeight)) * 100);

    // Compare the new with old and only raise the event if values change
    if(this.percentValue !== percent){

      // Update the percent value
      this.percentValue = percent;

      // Emit the event
      this.onScroll.emit(percent);
    }
  }
}
