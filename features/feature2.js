/**
 * Feature 2: Financial & Numeric Value Sanitation
 */

/**
 * Formats a numeric value into a USD currency string with commas and no decimal places.
 * @param {number|string} value - The raw value to format
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return '$' + Math.round(num).toLocaleString('en-US');
}

/**
 * Formats an integer or float with thousand separators.
 * @param {number|string} value - The raw value to format
 * @returns {string} The formatted number string
 */
export function formatNumber(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Clamps percentages between -9999.99% and 9999.99% and rounds to exactly 2 decimal places.
 * @param {number|string} value - The raw percentage to format
 * @returns {string} The formatted percentage string
 */
export function formatPercent(value) {
  let num = Number(value);
  if (isNaN(num)) return '0.00%';
  // Clamping to avoid UI overlaps and raw string overflow
  num = Math.max(-9999.99, Math.min(9999.99, num));
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
}
