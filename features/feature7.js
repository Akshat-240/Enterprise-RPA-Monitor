/**
 * Feature 7: Categorical Dropdown Filters
 */

export class CategoricalFilters {
  constructor() {
    this.filters = {
      automation_type: new Set(),
      department: new Set(),
      industry: new Set()
    };
    this.containerEl = null;
    this.onChangeCallback = null;
  }

  /**
   * Initializes the filter panels.
   * @param {string} containerId - Container for filters
   * @param {Array<Object>} initialData - Baseline dataset to extract unique values from
   * @param {Function} onChange - Callback triggered when filter states change
   */
  init(containerId, initialData, onChange) {
    this.containerEl = document.getElementById(containerId);
    this.onChangeCallback = onChange;

    if (!this.containerEl) return;

    // Extract unique sorted options for each category
    const categories = {
      automation_type: new Set(),
      department: new Set(),
      industry: new Set()
    };

    initialData.forEach(row => {
      if (row.automation_type) categories.automation_type.add(row.automation_type);
      if (row.department) categories.department.add(row.department);
      if (row.industry) categories.industry.add(row.industry);
    });

    const sortedCategories = {
      automation_type: Array.from(categories.automation_type).sort(),
      department: Array.from(categories.department).sort(),
      industry: Array.from(categories.industry).sort()
    };

    this.render(sortedCategories);
    this.setupEventListeners();
  }

  /**
   * Renders the glassmorphic multi-select filters
   */
  render(sortedCategories) {
    this.containerEl.innerHTML = `
      <div class="filters-panel-wrapper">
        <div class="filter-group-header">
          <span class="filter-header-icon">🎛️</span>
          <h3>ANALYTICS SYSTEM FILTERS</h3>
          <button class="clear-all-filters-btn" id="btn-clear-all-filters">RESET ALL FILTERS</button>
        </div>
        <div class="filters-grid">
          ${Object.entries(sortedCategories).map(([key, options]) => {
            const label = key.replace('_', ' ').toUpperCase();
            return `
              <div class="filter-dropdown" data-category="${key}">
                <button class="filter-dropdown-btn" id="filter-btn-${key}">
                  <span class="btn-label">${label}</span>
                  <span class="btn-badge" id="badge-${key}">ALL</span>
                  <span class="btn-arrow">▼</span>
                </button>
                <div class="filter-dropdown-menu" id="menu-${key}">
                  <div class="menu-search-wrapper">
                    <input type="text" placeholder="Search ${label.toLowerCase()}..." class="menu-search-input" data-cat="${key}" />
                  </div>
                  <div class="menu-options-container">
                    ${options.map(option => `
                      <label class="filter-option-row">
                        <input type="checkbox" value="${option}" data-category="${key}" class="filter-checkbox" />
                        <span class="custom-checkbox"></span>
                        <span class="option-text">${option}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Sets up click listeners for opening menus, searching within menus, toggling check boxes
   */
  setupEventListeners() {
    // Toggle dropdown menus visibility
    const dropdowns = this.containerEl.querySelectorAll('.filter-dropdown');
    
    dropdowns.forEach(dd => {
      const btn = dd.querySelector('.filter-dropdown-btn');
      const menu = dd.querySelector('.filter-dropdown-menu');
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close others
        dropdowns.forEach(otherDd => {
          if (otherDd !== dd) {
            otherDd.querySelector('.filter-dropdown-menu').classList.remove('open');
          }
        });

        menu.classList.toggle('open');
      });
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-dropdown')) {
        this.containerEl.querySelectorAll('.filter-dropdown-menu').forEach(menu => {
          menu.classList.remove('open');
        });
      }
    });

    // Search filter options
    const searchInputs = this.containerEl.querySelectorAll('.menu-search-input');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cat = e.target.getAttribute('data-cat');
        const rows = this.containerEl.querySelectorAll(`.filter-option-row [data-category="${cat}"]`);
        
        rows.forEach(checkbox => {
          const row = checkbox.closest('.filter-option-row');
          const text = checkbox.value.toLowerCase();
          if (text.includes(query)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    });

    // Checkbox toggles
    const checkboxes = this.containerEl.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const cat = e.target.getAttribute('data-category');
        const val = e.target.value;

        if (e.target.checked) {
          this.filters[cat].add(val);
        } else {
          this.filters[cat].delete(val);
        }

        this.updateBadge(cat);
        this.fireChange();
      });
    });

    // Clear all filters
    const resetBtn = document.getElementById('btn-clear-all-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => {
          cb.checked = false;
        });

        Object.keys(this.filters).forEach(cat => {
          this.filters[cat].clear();
          this.updateBadge(cat);
        });

        this.fireChange();
      });
    }
  }

  /**
   * Updates display badges indicating selection counts
   */
  updateBadge(category) {
    const badge = document.getElementById(`badge-${category}`);
    if (!badge) return;

    const count = this.filters[category].size;
    if (count === 0) {
      badge.textContent = 'ALL';
      badge.classList.remove('active-badge');
    } else {
      badge.textContent = count;
      badge.classList.add('active-badge');
    }
  }

  /**
   * Fires the change callback with the active filter state
   */
  fireChange() {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.filters);
    }
  }

  /**
   * Filters a data array in real-time.
   * @param {Array<Object>} data 
   * @returns {Array<Object>} The filtered data list
   */
  filterData(data) {
    return data.filter(row => {
      for (const [category, selectedSet] of Object.entries(this.filters)) {
        if (selectedSet.size > 0) {
          const val = row[category];
          if (!selectedSet.has(val)) {
            return false;
          }
        }
      }
      return true;
    });
  }
}
