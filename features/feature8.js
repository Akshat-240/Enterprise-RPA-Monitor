/**
 * Feature 8: High-Frequency Virtualized DOM Grid
 */

import { formatCurrency, formatNumber, formatPercent } from './feature2.js';
import { getAlertClass } from './feature3.js';

export class VirtualGrid {
  constructor() {
    this.viewportEl = null;
    this.spacerEl = null;
    this.contentEl = null;

    this.data = []; // Current active (filtered, searched, sorted) dataset
    this.rowHeight = 42; // Fixed height in pixels per row
    this.visibleCount = 0;
    this.recycledRows = []; // Fixed pool of DOM elements
    this.startIndex = -1;

    // Col templates
    this.columns = [
      { key: 'project_id', label: 'PROJECT ID', width: 110 },
      { key: 'company_id', label: 'COMPANY', width: 100 },
      { key: 'project_name', label: 'PROJECT NAME', width: 220 },
      { key: 'project_status', label: 'STATUS', width: 110, align: 'center' },
      { key: 'automation_type', label: 'AUTOMATION TYPE', width: 180 },
      { key: 'robots_deployed', label: 'ROBOTS', width: 90, align: 'right' },
      { key: 'budget_usd', label: 'BUDGET', width: 130, align: 'right', format: formatCurrency },
      { key: 'annual_savings_usd', label: 'ANNUAL SAVINGS', width: 150, align: 'right', format: formatCurrency },
      { key: 'roi_percent', label: 'ROI', width: 100, align: 'right', format: formatPercent },
      { key: 'department', label: 'DEPARTMENT', width: 180 },
      { key: 'implementation_partner', label: 'PARTNER', width: 160 },
      { key: 'country', label: 'COUNTRY', width: 130 },
      { key: 'industry', label: 'INDUSTRY', width: 200 },
      { key: 'employee_hours_saved', label: 'HOURS SAVED', width: 130, align: 'right', format: formatNumber }
    ];

    this.onRowClickCallback = null;
  }

  /**
   * Initializes the virtual grid
   * @param {string} viewportId - The container with overflow scroll
   * @param {Function} onHeaderClick - Sorting trigger header callback
   */
  init(viewportId, onHeaderClick) {
    this.viewportEl = document.getElementById(viewportId);
    if (!this.viewportEl) return;

    // Clear and build internal container components
    this.viewportEl.innerHTML = `
      <div class="grid-header-sticky" id="grid-header-container" style="overflow: hidden; width: 100%;">
        <div class="grid-header-cells-wrapper" id="grid-header-row" style="display: flex; transition: none;"></div>
      </div>
      <div class="grid-scroll-container" id="grid-scroll-box">
        <div class="grid-spacer" id="grid-spacer-element"></div>
        <div class="grid-recycled-content" id="grid-content-element"></div>
      </div>
    `;

    this.spacerEl = document.getElementById('grid-spacer-element');
    this.contentEl = document.getElementById('grid-content-element');
    this.scrollBoxEl = document.getElementById('grid-scroll-box');

    this.renderHeader(onHeaderClick);

    // Calculate count of rows needed based on viewport
    const viewportHeight = this.viewportEl.clientHeight || 450;
    this.visibleCount = Math.ceil(viewportHeight / this.rowHeight) + 4; // Add buffer rows

    this.createRowPool();

    // Hook scroll listener
    this.scrollBoxEl.addEventListener('scroll', () => {
      this.renderViewport();
      
      const headerRow = document.getElementById('grid-header-row');
      if (headerRow) {
        headerRow.style.transform = `translateX(-${this.scrollBoxEl.scrollLeft}px)`;
      }
    });

    // Hook row click listener
    this.scrollBoxEl.addEventListener('click', (e) => {
      const rowEl = e.target.closest('.grid-row-recycled');
      if (!rowEl) return;
      const uid = rowEl.getAttribute('data-uid');
      if (!uid) return;
      const rowData = this.data.find(d => d.internal_uid === uid);
      if (rowData && this.onRowClickCallback) {
        this.onRowClickCallback(rowData);
      }
    });

    // Handle resize and tab visibility switching to ensure rows populate correctly
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const vHeight = entry.contentRect.height;
        if (vHeight > 0) {
          const newVisibleCount = Math.ceil(vHeight / this.rowHeight) + 4;
          if (newVisibleCount > this.visibleCount) {
            this.visibleCount = newVisibleCount;
            this.createRowPool();
          }
          this.renderViewport(true); // Force redraw
        }
      }
    });
    resizeObserver.observe(this.viewportEl);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const vHeight = this.viewportEl.clientHeight;
        if (vHeight > 0) {
          const newVisibleCount = Math.ceil(vHeight / this.rowHeight) + 4;
          if (newVisibleCount > this.visibleCount) {
            this.visibleCount = newVisibleCount;
            this.createRowPool();
          }
          this.renderViewport(true); // Force redraw
        }
      }
    });
  }

  /**
   * Registers a callback for when a row is clicked
   * @param {Function} callback
   */
  onRowClick(callback) {
    this.onRowClickCallback = callback;
  }

  /**
   * Creates/expands the DOM elements row pool
   */
  createRowPool() {
    // If we need more rows, create them
    const currentCount = this.recycledRows.length;
    if (this.visibleCount <= currentCount) return;

    for (let i = currentCount; i < this.visibleCount; i++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'grid-row-recycled';
      rowEl.style.height = `${this.rowHeight}px`;
      
      // Populate row cells structure
      rowEl.innerHTML = this.columns.map(col => {
        const alignClass = col.align ? `align-${col.align}` : '';
        const monoClass = ['project_id', 'company_id'].includes(col.key) ? 'grid-cell-mono' : '';
        return `
          <div class="grid-cell ${alignClass} ${monoClass}" style="width: ${col.width}px; min-width: ${col.width}px;">
            <span class="cell-text"></span>
          </div>
        `;
      }).join('');

      this.contentEl.appendChild(rowEl);
      this.recycledRows.push(rowEl);
    }
  }

  /**
   * Renders the grid column headers
   */
  renderHeader(onHeaderClick) {
    const headerRow = document.getElementById('grid-header-row');
    if (!headerRow) return;

    headerRow.innerHTML = this.columns.map(col => {
      const isSortable = ['budget_usd', 'roi_percent', 'employee_hours_saved', 'project_name', 'industry'].includes(col.key);
      const sortableClass = isSortable ? 'sortable-header' : '';
      const alignClass = col.align ? `align-${col.align}` : '';

      return `
        <div class="grid-header-cell ${sortableClass} ${alignClass}" 
             data-key="${col.key}" 
             style="width: ${col.width}px; min-width: ${col.width}px;">
          <span>${col.label}</span>
          <span class="sort-icon-indicator" id="sort-indicator-${col.key}"></span>
        </div>
      `;
    }).join('');

    // Attach click listeners to sortable columns
    headerRow.querySelectorAll('.sortable-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const key = header.getAttribute('data-key');
        const isShift = e.shiftKey;
        if (onHeaderClick) {
          onHeaderClick(key, isShift);
        }
      });
    });
  }

  /**
   * Updates sort indicators on the UI headers.
   * @param {Array<Object>} sortConfig - The active sorting configuration (Feature 9)
   */
  updateSortIndicators(sortConfig) {
    // Clear all indicators first
    this.columns.forEach(col => {
      const indicator = document.getElementById(`sort-indicator-${col.key}`);
      if (indicator) indicator.innerHTML = '';
    });

    // Render active configurations on header cells
    sortConfig.forEach((cfg, index) => {
      const indicator = document.getElementById(`sort-indicator-${cfg.column}`);
      if (indicator) {
        const directionArrow = cfg.direction === 'asc' ? '↑' : '↓';
        const rank = index + 1;
        indicator.innerHTML = `<span class="sort-badge">${rank}${directionArrow}</span>`;
      }
    });

    // Render sort breadcrumbs strip
    const breadcrumbContainer = document.getElementById('sort-breadcrumbs-container');
    if (breadcrumbContainer) {
      if (sortConfig.length === 0) {
        breadcrumbContainer.innerHTML = '';
      } else {
        const breadcrumbsHTML = sortConfig.map((cfg, index) => {
          const col = this.columns.find(c => c.key === cfg.column);
          const label = col ? col.label : cfg.column.toUpperCase();
          const arrow = cfg.direction === 'asc' ? '↑' : '↓';
          return `<span class="sort-breadcrumb" style="font-family: var(--font-display); font-size: 0.65rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
            ${index + 1}. ${label} <span style="color: var(--cyan-neon); font-weight: bold;">${arrow}</span>
          </span>`;
        }).join('<span style="color: #475569; font-size: 0.65rem;">&gt;</span>');
        
        breadcrumbContainer.innerHTML = `
          <span style="font-family: var(--font-display); font-size: 0.65rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Sorted by:</span>
          ${breadcrumbsHTML}
        `;
      }
    }
  }

  /**
   * Sets the dataset and updates the scroll container sizes
   * @param {Array<Object>} newData 
   */
  setData(newData) {
    this.data = newData;
    
    // Update spacer element dimensions and recycled container width
    const totalHeight = this.data.length * this.rowHeight;
    const totalWidth = this.columns.reduce((sum, col) => sum + col.width, 0);

    if (this.spacerEl) {
      this.spacerEl.style.height = `${totalHeight}px`;
      this.spacerEl.style.width = `${totalWidth}px`;
    }
    if (this.contentEl) {
      this.contentEl.style.width = `${totalWidth}px`;
    }
    const headerRow = document.getElementById('grid-header-row');
    if (headerRow) {
      headerRow.style.width = `${totalWidth}px`;
    }

    // Trigger viewport redraw
    this.renderViewport(true); // Force redraw
  }

  /**
   * Renders the visible slice of data onto the recycled row pool
   */
  renderViewport(forceRedraw = false) {
    if (!this.scrollBoxEl || !this.contentEl) return;

    const scrollTop = this.scrollBoxEl.scrollTop;
    const newStartIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight));

    // Only update elements positioning if start index changes OR data gets replaced
    if (newStartIndex === this.startIndex && !forceRedraw) {
      return;
    }

    this.startIndex = newStartIndex;
    const endIndex = Math.min(this.data.length, this.startIndex + this.visibleCount);

    for (let i = 0; i < this.recycledRows.length; i++) {
      const rowEl = this.recycledRows[i];
      const dataIndex = this.startIndex + i;

      if (dataIndex < endIndex) {
        const rowData = this.data[dataIndex];
        rowEl.style.display = 'flex';
        rowEl.style.transform = `translate3d(0, ${dataIndex * this.rowHeight}px, 0)`;

        // Apply primary key dataset reference for visual events (Feature 3)
        rowEl.setAttribute('data-uid', rowData.internal_uid);

        // Flash alert check (Feature 3)
        const alertClass = getAlertClass(rowData);
        rowEl.className = 'grid-row-recycled';
        if (alertClass) {
          rowEl.classList.add(alertClass);
        }

        // Apply standard cell mutations
        const cells = rowEl.children;
        this.columns.forEach((col, colIdx) => {
          const cell = cells[colIdx];
          const textEl = cell.querySelector('.cell-text');
          const val = rowData[col.key];

          let formattedVal = val === undefined || val === null ? '-' : val;
          if (col.format) {
            formattedVal = col.format(val);
          }

          if (textEl.textContent !== String(formattedVal)) {
            textEl.textContent = formattedVal;
          }

          // Re-evaluate classes to avoid wiping layout properties
          const alignClass = col.align ? `align-${col.align}` : '';
          const monoClass = ['project_id', 'company_id'].includes(col.key) ? 'grid-cell-mono' : '';
          let specialClass = '';
          if (col.key === 'project_status') {
            specialClass = `status-col-${String(val).toLowerCase()}`;
          } else if (col.key === 'roi_percent') {
            const numVal = parseFloat(val);
            specialClass = numVal >= 0 ? 'roi-positive' : 'roi-negative';
          }
          cell.className = `grid-cell ${alignClass} ${monoClass} ${specialClass}`;
        });
      } else {
        // Hide unused recycled rows
        rowEl.style.display = 'none';
      }
    }
  }

  /**
   * Refreshes values inside the active rows dynamically under high-frequency stream updates.
   * If a row currently in view is updated, we mutate its contents immediately.
   */
  updateRowDataDirectly(updatedRowsMap) {
    if (!this.scrollBoxEl) return;
    
    for (let i = 0; i < this.recycledRows.length; i++) {
      const rowEl = this.recycledRows[i];
      if (rowEl.style.display === 'none') continue;

      const uid = rowEl.getAttribute('data-uid');
      if (updatedRowsMap.has(uid)) {
        const rowData = updatedRowsMap.get(uid);
        
        // Mutate in place
        const cells = rowEl.children;
        this.columns.forEach((col, colIdx) => {
          const cell = cells[colIdx];
          const textEl = cell.querySelector('.cell-text');
          const val = rowData[col.key];

          let formattedVal = val === undefined || val === null ? '-' : val;
          if (col.format) {
            formattedVal = col.format(val);
          }

          if (textEl.textContent !== String(formattedVal)) {
            textEl.textContent = formattedVal;
          }

          // Re-evaluate classes to avoid wiping layout properties
          const alignClass = col.align ? `align-${col.align}` : '';
          const monoClass = ['project_id', 'company_id'].includes(col.key) ? 'grid-cell-mono' : '';
          let specialClass = '';
          if (col.key === 'project_status') {
            specialClass = `status-col-${String(val).toLowerCase()}`;
          } else if (col.key === 'roi_percent') {
            const numVal = parseFloat(val);
            specialClass = numVal >= 0 ? 'roi-positive' : 'roi-negative';
          }
          cell.className = `grid-cell ${alignClass} ${monoClass} ${specialClass}`;
        });

        // Trigger flash alert (Feature 3)
        const alertClass = getAlertClass(rowData);
        rowEl.classList.remove('row-alert-failed', 'row-alert-negative');
        if (alertClass) {
          void rowEl.offsetWidth; // force layout recalculation/reflow
          rowEl.classList.add(alertClass);
        }
      }
    }
  }
}
