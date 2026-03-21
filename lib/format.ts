/**
 * Format number with Czech decimal comma instead of dot
 */
export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals).replace('.', ',');
}

/**
 * Format number for Excel (keeping dot for calculations)
 */
export function formatNumberForExcel(num: number, decimals: number = 1): number {
  return parseFloat(num.toFixed(decimals));
}
