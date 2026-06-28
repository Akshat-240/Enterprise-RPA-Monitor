/**
 * Feature 4: Single-Column Telemetry Sorter
 */

/**
 * Sorts a data array by a single column in a given direction (asc/desc).
 * Supports both numeric and string values.
 * @param {Array<Object>} data - The dataset to sort
 * @param {string} column - The property key to sort by
 * @param {'asc'|'desc'} direction - The direction to sort
 * @returns {Array<Object>} The sorted array (mutates or returns a copy)
 */
export function sortSingleColumn(data, column, direction) {
  if (!column) return data;

  const factor = direction === 'asc' ? 1 : -1;

  return data.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // Handle null or undefined values
    if (valA === undefined || valA === null) return 1 * factor;
    if (valB === undefined || valB === null) return -1 * factor;

    // Handle numeric comparisons
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * factor;
    }

    // Fallback to string comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return -1 * factor;
    if (strA > strB) return 1 * factor;
    return 0;
  });
}
