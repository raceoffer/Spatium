export function roundFloat(value: number, decimals: number = 9): number {
  return parseFloat(value.toFixed(decimals));
}
