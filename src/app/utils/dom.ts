export function findParentElement(el: HTMLElement, tagName: string, includeCurrent: boolean = false): HTMLElement | null {
  tagName = tagName.toLowerCase();

  if (includeCurrent) {
    if (el.tagName && el.tagName.toLowerCase() == tagName) {
      return el;
    }
  }

  while (el && el.parentElement) {
    el = el.parentElement;
    if (el.tagName && el.tagName.toLowerCase() == tagName) {
      return el;
    }
  }

  return null;
}


export function isElementDisabled(element: HTMLElement): boolean {
  const disabled = element.getAttribute('disabled');
  return disabled !== null;
}
