export function getValue(name: string) {
  return JSON.parse(localStorage.getItem(name));
}

export function setValue(name: string, value: any) {
  return localStorage.setItem(name, JSON.stringify(value));
}

export function removeValue(name: string) {
  return localStorage.removeItem(name);
}