/**
 * Main Application Orchestrator (app.js)
 */

import { KpiDashboard } from './features/feature1.js';
import { formatCurrency, formatNumber } from './features/feature2.js';
import { applyVisualAlert } from './features/feature3.js';
import { PipelineBuffer } from './features/feature5.js';
import { LayoutPersistence } from './features/feature6.js';
import { CategoricalFilters } from './features/feature7.js';
import { VirtualGrid } from './features/feature8.js';
import { MultiColumnSorter } from './features/feature9.js';
import { FuzzySearch } from './features/feature10.js';
import { InspectorPanel } from './features/inspector.js';

class App {
  constructor() {
    this.masterData = [];
    this.masterDataMap = new Map();
    this.filteredData = [];

    // Feature instances
    this.kpi = new KpiDashboard();
    this.buffer = new PipelineBuffer();
    this.layout = new LayoutPersistence();
    this.filters = new CategoricalFilters();
    this.grid = new VirtualGrid();
    this.sorter = new MultiColumnSorter();
    this.searcher = new FuzzySearch();
    this.inspector = new InspectorPanel();

    this.isSystemEngaged = false;
  }

  /**
   * Main setup
   */
  async init() {
    // 1. Initialize Layout Persistence (Feature 6)
    this.layout.init([
      { toggleId: 'toggle-panel-grid', panelId: 'panel-grid-window', defaultVisible: true },
      { toggleId: 'toggle-panel-analytics', panelId: 'panel-analytics-window', defaultVisible: true },
      { toggleId: 'toggle-panel-infra', panelId: 'panel-infra-window', defaultVisible: true }
    ]);

    // 2. Fetch and parse baseline CSV data
    const csvData = await this.loadCSV('./automation_projects.csv');
    this.masterData = csvData;
    this.masterData.forEach(row => {
      this.masterDataMap.set(row.internal_uid, row);
    });

    // Prepare search index cache (Feature 10)
    this.searcher.prepareData(this.masterData);

    // 3. Initialize UI Components
    this.kpi.init('kpi-container');
    this.grid.init('grid-viewport', (column, isShift) => this.handleSort(column, isShift));

    // Initialize inspector panel overlay
    this.inspector.init('telemetry-row-inspector');

    // Register row click event on grid (active only when stream is paused)
    this.grid.onRowClick((rowData) => {
      if (this.buffer.isPaused) {
        this.inspector.open(rowData);
      }
    });

    // Initialize dropdown filters (Feature 7)
    this.filters.init('filters-container', this.masterData, (activeFilters) => {
      this.applyFiltersAndSearch();
    });

    // Initialize Play/Pause buffer (Feature 5)
    this.buffer.init('btn-toggle-stream', 'stream-status-overlay');
    this.buffer.onFlush((backlog) => {
      this.processIncomingBatch(backlog);
    });

    // Setup Fuzzy Search input listener (Feature 10)
    const searchInput = document.getElementById('search-query-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.applyFiltersAndSearch();
      });
    }

    // Setup Export CSV button listener
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSnapshotToCSV());
    }

    // Set initial grid data
    this.applyFiltersAndSearch();

    // Render Department Analytics chart (Initial render)
    this.updateAnalyticsChart();

    // Redraw chart dynamically on size changes (tab switching, window resizing) using ResizeObserver
    let lastChartWidth = 0;
    const chartContainer = document.getElementById('analytics-chart-container');
    if (chartContainer) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0 && Math.abs(width - lastChartWidth) > 2) {
            lastChartWidth = width;
            this.updateAnalyticsChart();
          }
        }
      });
      resizeObserver.observe(chartContainer);
    }

    // Force redraw when the tab becomes active/visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateAnalyticsChart();
      }
    });

    // Hook to Engage button
    const engageBtn = document.getElementById('btn-engage-system');
    if (engageBtn) {
      engageBtn.addEventListener('click', () => this.engageSystem());
    }
  }

  /**
   * Visual transition from slow-motion showcase disassembly to active terminal
   */
  engageSystem() {
    if (this.isSystemEngaged) return;
    this.isSystemEngaged = true;

    // Fade out 3D showcase
    const introOverlay = document.getElementById('intro-showcase-overlay');
    if (introOverlay) {
      introOverlay.classList.add('fade-out');
    }

    // Transition dashboard panels to active state (assemble disassembled parts)
    document.body.classList.remove('intro-mode');

    // Progressive redraws during the 2.8s 3D panel assembly transition to adapt to changing bounds
    [100, 400, 800, 1200, 1800, 2400, 3000].forEach(delay => {
      setTimeout(() => {
        this.updateAnalyticsChart();
        if (this.grid) {
          this.grid.renderViewport(true); // Force redraw grid viewport to pick up correct clientHeight
        }
      }, delay);
    });

    // Launch official hackathon telemetry simulation firehose
    console.log("🚀 [System Orchestrator] Triggering dataStream initializeRpaStream...");
    window.initializeRpaStream((incomingBatch) => {
      if (this.buffer.handleIncoming(incomingBatch)) {
        // If live, process immediately
        this.processIncomingBatch(incomingBatch);
      }
    }, './automation_projects.csv');
  }

  /**
   * Processes a batch of telemetry updates from dataStream.js
   * @param {Array<Object>} batch - Updated telemetry rows
   */
  processIncomingBatch(batch) {
    let batchRobotsSum = 0;
    let batchSavingsSum = 0;
    const updatedMap = new Map();

    batch.forEach(updatedRow => {
      // Find row in master cache
      const existing = this.masterDataMap.get(updatedRow.internal_uid);
      if (existing) {
        // Update values in master cache
        existing.annual_savings_usd = updatedRow.annual_savings_usd;
        existing.robots_deployed = updatedRow.robots_deployed;
        existing.employee_hours_saved = updatedRow.employee_hours_saved;
        existing.roi_percent = updatedRow.roi_percent;
        existing.project_status = updatedRow.project_status;

        // Re-generate search cache for mutated values if name or country changed
        existing._searchCache = null; 

        // Update local analytics aggregates
        batchRobotsSum += updatedRow.robots_deployed;
        batchSavingsSum += updatedRow.annual_savings_usd;

        updatedMap.set(updatedRow.internal_uid, existing);
      }
    });

    // Update KPI dashboard cumulative trackers (Feature 1)
    this.kpi.update(batch.length, batchRobotsSum, batchSavingsSum);

    // Prepare search index cache on updated rows
    this.searcher.prepareData(this.masterData);

    // Refresh layout, re-apply filters and sorting, and update virtual grid
    this.applyFiltersAndSearch(updatedMap);
    
    // Refresh Department Analytics Chart
    this.updateAnalyticsChart();
  }

  /**
   * Applies filters, search, and sorting, then updates the virtualized grid viewport.
   * @param {Map} updatedMap - Map of updated rows in this tick
   */
  applyFiltersAndSearch(updatedMap = null) {
    let result = [...this.masterData];

    // 1. Apply multi-choice categorical filters (Feature 7)
    result = this.filters.filterData(result);

    // 2. Apply fuzzy search keywords (Feature 10)
    const searchQuery = document.getElementById('search-query-input')?.value || '';
    result = this.searcher.search(result, searchQuery);

    // 3. Apply multi-column concurrent sorting (Feature 9)
    result = this.sorter.sortData(result);

    this.filteredData = result;

    // Set dataset in virtual grid (Feature 8)
    this.grid.setData(this.filteredData);

    // If updates arrived and rows are currently visible, flash warning hues (Feature 3)
    if (updatedMap && updatedMap.size > 0) {
      this.grid.updateRowDataDirectly(updatedMap);
    }

    // Update dynamic row statistics and active filter counts below the filters panel
    const statsEl = document.getElementById('filter-stats-display');
    if (statsEl) {
      const activeFiltersCount = Object.values(this.filters.filters)
        .reduce((sum, set) => sum + (set.size > 0 ? 1 : 0), 0);
      
      const filterText = activeFiltersCount === 1 ? '1 filter active' : `${activeFiltersCount} filters active`;
      
      statsEl.innerHTML = `Showing <strong>${formatNumber(this.filteredData.length)}</strong> of <strong>${formatNumber(this.masterData.length)}</strong> rows &middot; <span style="color: ${activeFiltersCount > 0 ? 'var(--cyan-neon)' : '#64748b'};">${filterText}</span>`;
    }
  }

  /**
   * Handles sorting column toggle on grid headers (Feature 4 & 9)
   */
  handleSort(column, isShift) {
    this.sorter.toggleSort(column, isShift);
    this.grid.updateSortIndicators(this.sorter.getSortConfig());
    this.applyFiltersAndSearch();
  }

  /**
   * Dynamically compiles and renders top department analytics as an SVG horizontal bar chart
   */
  updateAnalyticsChart() {
    const chartContainer = document.getElementById('analytics-chart-container');
    if (!chartContainer) return;

    // Aggregate active view pool details by department
    const deptAggregates = {};
    this.filteredData.forEach(row => {
      const dept = row.department || 'Unknown';
      if (!deptAggregates[dept]) {
        deptAggregates[dept] = 0;
      }
      deptAggregates[dept] += row.robots_deployed;
    });

    // Sort departments by robots deployed
    const sortedDepts = Object.entries(deptAggregates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Take top 5

    if (sortedDepts.length === 0) {
      chartContainer.innerHTML = `<div class="chart-empty" style="font-family: var(--font-mono); font-size: 0.8rem; color: #475569; text-align: center; width: 100%;">NO COMPATIBLE TELEMETRY DATA</div>`;
      return;
    }

    const maxVal = Math.max(...sortedDepts.map(d => d[1]), 1);

    // Calculate dynamic widths based on the actual container clientWidth
    const containerWidth = chartContainer.clientWidth || 400;
    const labelWidth = Math.max(120, Math.min(220, containerWidth * 0.35));
    const valueWidth = 60;
    const padding = 30; // Left & right spacing
    const maxBarWidth = Math.max(80, containerWidth - labelWidth - valueWidth - padding);

    const rowHeight = 36;
    const svgHeight = sortedDepts.length * rowHeight;

    const svgContent = sortedDepts.map(([dept, val], idx) => {
      const y = idx * rowHeight;
      const pct = val / maxVal;
      const displayWidth = Math.max(4, pct * maxBarWidth);
      
      // Cyber neon shades depending on rank
      let barColor = 'var(--cyan-neon)';
      if (idx === 0) barColor = '#06b6d4'; // Cyber Cyan
      else if (idx === 1) barColor = '#3b82f6'; // Bright Blue
      else if (idx === 2) barColor = '#10b981'; // Emerald Green
      else if (idx === 3) barColor = '#f59e0b'; // Amber Orange
      else barColor = '#a855f7'; // Purple Tech

      // Truncate labels based on labelWidth
      let deptLabel = dept.toUpperCase();
      const maxCharCount = Math.floor(labelWidth / 8);
      if (deptLabel.length > maxCharCount) {
        deptLabel = deptLabel.substring(0, maxCharCount - 2) + '..';
      }

      const barStart = labelWidth + 10;
      const valStart = containerWidth - 10;

      return `
        <g class="chart-row">
          <!-- Department Label (Left column) -->
          <text x="10" y="${y + 18}" fill="#64748b" font-size="11" font-family="var(--font-mono)" text-anchor="start" dominant-baseline="middle">${deptLabel}</text>
          
          <!-- Bar Track (Center column) -->
          <rect x="${barStart}" y="${y + 12}" width="${maxBarWidth}" height="12" rx="6" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"></rect>
          
          <!-- Glowing Bar Fill -->
          <rect class="chart-fill" x="${barStart}" y="${y + 12}" width="${displayWidth}" height="12" rx="6" fill="${barColor}" filter="drop-shadow(0 0 6px ${barColor}88)" style="transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></rect>
          
          <!-- Numerical Value (Right column) -->
          <text x="${valStart}" y="${y + 18}" fill="#ffffff" font-size="12" font-family="var(--font-mono)" font-weight="700" text-anchor="end" dominant-baseline="middle">${formatNumber(val)}</text>
        </g>
      `;
    }).join('');

    chartContainer.innerHTML = `
      <svg width="${containerWidth}" height="${svgHeight}" style="overflow: visible; display: block;">
        ${svgContent}
      </svg>
    `;
  }

  /**
   * Standard CSV parsing utility
   */
  async loadCSV(url) {
    console.log(`📡 [App] Fetching CSV baseline...`);
    const response = await fetch(url);
    const csvText = await response.text();
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split('\t').length > lines[0].split(',').length 
      ? lines[0].split('\t').map(h => h.trim()) 
      : lines[0].split(',').map(h => h.trim());
    
    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(','); 
      
      if (values.length === headers.length) {
        let rowObject = { internal_uid: `uid-row-${i}` };
        
        headers.forEach((header, index) => {
          let val = values[index].trim();
          if (['robots_deployed', 'budget_usd', 'annual_savings_usd', 'employee_hours_saved'].includes(header)) {
            rowObject[header] = parseInt(val, 10) || 0;
          } else if (header === 'roi_percent') {
            rowObject[header] = parseFloat(val) || 0.00;
          } else {
            rowObject[header] = val;
          }
        });
        parsedData.push(rowObject);
      }
    }
    console.log(`✅ [App] Parsed ${parsedData.length} baseline records.`);
    return parsedData;
  }

  /**
   * Export the active sorted & filtered data to a downloadable CSV client-side.
   * Runs inside a setTimeout to prevent freezing the UI.
   */
  exportSnapshotToCSV() {
    const dataToExport = [...this.filteredData];
    if (dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Set export button to visual loading state
    const exportBtn = document.getElementById('btn-export-csv');
    let originalText = "";
    if (exportBtn) {
      originalText = exportBtn.innerHTML;
      exportBtn.innerHTML = `<span class="icon">⌛</span> EXPORTING...`;
      exportBtn.disabled = true;
    }

    setTimeout(() => {
      try {
        // Get all headers from master data keys, ignoring internal keys starting with "_" or "internal_uid"
        const ignoredKeys = new Set(['internal_uid']);
        const keys = Object.keys(dataToExport[0]).filter(k => !k.startsWith('_') && !ignoredKeys.has(k));

        const csvRows = [];
        
        // Add header row
        csvRows.push(keys.map(k => `"${k.toUpperCase().replace(/_/g, ' ')}"`).join(','));

        // Add data rows
        dataToExport.forEach(row => {
          const values = keys.map(key => {
            const val = row[key];
            const escaped = String(val === undefined || val === null ? '' : val).replace(/"/g, '""');
            return `"${escaped}"`;
          });
          csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `rpa_telemetry_snapshot_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("CSV Export Error:", err);
        alert("Failed to export telemetry data.");
      } finally {
        if (exportBtn) {
          exportBtn.innerHTML = originalText;
          exportBtn.disabled = false;
        }
      }
    }, 50); // Async slice to keep rendering main loop unblocked
  }
}

// Instantiate and start app on page load
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(err => {
    console.error("❌ Application Crash:", err);
  });
});
