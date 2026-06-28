/**
 * Feature 9: Multi-Column Concurrent Sorter
 */

export class MultiColumnSorter {
  constructor() {
    this.sortKeys = []; // Array of { column: string, direction: 'asc'|'desc' }
  }

  /**
   * Toggles sorting on a column.
   * If shiftKey is pressed, adds or toggles the column in the sort chain.
   * If shiftKey is not pressed, sets it as the single active sort column.
   * @param {string} column - Column name to sort
   * @param {boolean} isShiftPressed - Whether the user held shift
   */
  toggleSort(column, isShiftPressed) {
    const existingIndex = this.sortKeys.findIndex(k => k.column === column);

    if (isShiftPressed) {
      if (existingIndex > -1) {
        // Toggle direction: asc -> desc -> remove
        const currentDir = this.sortKeys[existingIndex].direction;
        if (currentDir === 'asc') {
          this.sortKeys[existingIndex].direction = 'desc';
        } else {
          this.sortKeys.splice(existingIndex, 1);
        }
      } else {
        // Add new key to the priority list
        this.sortKeys.push({ column, direction: 'asc' });
      }
    } else {
      // Single column sorting
      if (existingIndex > -1 && this.sortKeys.length === 1) {
        const currentDir = this.sortKeys[0].direction;
        if (currentDir === 'asc') {
          this.sortKeys[0].direction = 'desc';
        } else {
          this.sortKeys = [];
        }
      } else {
        this.sortKeys = [{ column, direction: 'asc' }];
      }
    }
  }

  /**
   * Sorts the data based on the current multi-column priority chain.
   * Runs highly optimized comparison checks.
   * @param {Array<Object>} data - The dataset to sort (mutates copy)
   * @returns {Array<Object>} The sorted array
   */
  sortData(data) {
    if (this.sortKeys.length === 0) return data;

    return data.sort((a, b) => {
      for (let i = 0; i < this.sortKeys.length; i++) {
        const { column, direction } = this.sortKeys[i];
        const factor = direction === 'asc' ? 1 : -1;

        let valA = a[column];
        let valB = b[column];

        // Treat identical values as equal and move to next sort criterion
        if (valA === valB) continue;

        // Missing values placement
        if (valA === undefined || valA === null) return 1 * factor;
        if (valB === undefined || valB === null) return -1 * factor;

        // Numeric checks
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * factor;
        }

        // Alphabetical checks
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return -1 * factor;
        if (strA > strB) return 1 * factor;
      }
      return 0;
    });
  }

  /**
   * Reset all sorting criteria
   */
  clear() {
    this.sortKeys = [];
  }

  /**
   * Get active configurations
   * @returns {Array<Object>}
   */
  getSortConfig() {
    return [...this.sortKeys];
  }
}
