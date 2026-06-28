/**
 * Feature 10: Multi-Field Fuzzy Search Engine
 */

export class FuzzySearch {
  constructor() {
    this.targetFields = ['project_name', 'company_id', 'implementation_partner', 'country'];
  }

  /**
   * Pre-computes search strings on a dataset to maximize search performance.
   * Concatenates search fields into a single field on each row object.
   * @param {Array<Object>} data 
   */
  prepareData(data) {
    data.forEach(row => {
      if (row._searchCache) return;
      row._searchCache = this.targetFields
        .map(f => (row[f] ? String(row[f]).toLowerCase() : ''))
        .join(' ');
    });
  }

  /**
   * Filters a dataset based on fuzzy search terms.
   * All terms in the query must be found in the row's combined fields, but can be in any order.
   * @param {Array<Object>} data - The dataset to search
   * @param {string} query - The search input value
   * @returns {Array<Object>} The filtered matching dataset
   */
  search(data, query) {
    if (!query) return data;

    // Split query by spaces and clean empty elements
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.trim().length > 0);

    if (terms.length === 0) return data;

    // Pre-cache search fields if not already done
    this.prepareData(data);

    return data.filter(row => {
      // Every term in the query must match at least one target field
      return terms.every(term => row._searchCache.includes(term));
    });
  }
}
