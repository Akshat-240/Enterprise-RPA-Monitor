/**
 * Feature 1: High-Density KPIs Dashboard
 */

import { formatCurrency, formatNumber } from './feature2.js';

export class KpiDashboard {
  constructor() {
    this.totalRows = 0;
    this.activeRobots = 0;
    this.cumulativeSavings = 0;

    // DOM references
    this.totalRowsEl = null;
    this.activeRobotsEl = null;
    this.cumulativeSavingsEl = null;
  }

  /**
   * Initializes the KPI markup inside the target container.
   * @param {string} containerId - The ID of the container element
   */
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="kpi-card pulse-active" id="kpi-total-rows">
        <div class="kpi-glow"></div>
        <div class="kpi-header">
          <svg class="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color: var(--cyan-neon);"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span class="kpi-label">TOTAL PROCESSES STREAMED</span>
        </div>
        <div class="kpi-value" id="val-total-rows">0</div>
        <div class="kpi-subtext">Telemetry packages received & indexed</div>
      </div>
      <div class="kpi-card pulse-active" id="kpi-active-robots">
        <div class="kpi-glow"></div>
        <div class="kpi-header">
          <svg class="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color: var(--emerald-neon);"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
          <span class="kpi-label">ACTIVE ROBOTIC INSTANCES</span>
        </div>
        <div class="kpi-value" id="val-active-robots">0</div>
        <div class="kpi-subtext">Running sum of node deployments</div>
      </div>
      <div class="kpi-card pulse-active" id="kpi-cumulative-savings">
        <div class="kpi-glow"></div>
        <div class="kpi-header">
          <svg class="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color: var(--amber-neon);"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          <span class="kpi-label">GLOBAL CUMULATIVE SAVINGS</span>
        </div>
        <div class="kpi-value" id="val-cumulative-savings">$0</div>
        <div class="kpi-subtext">Aggregated financial savings</div>
      </div>
    `;

    this.totalRowsEl = document.getElementById('val-total-rows');
    this.activeRobotsEl = document.getElementById('val-active-robots');
    this.cumulativeSavingsEl = document.getElementById('val-cumulative-savings');

    // Render initial values as odometers
    this.updateOdometer(this.totalRowsEl, "0");
    this.updateOdometer(this.activeRobotsEl, "0");
    this.updateOdometer(this.cumulativeSavingsEl, "$0");
  }

  /**
   * Updates a KPI counter dynamically using a sliding digit-slot odometer animation.
   */
  updateOdometer(element, newString) {
    if (!element) return;

    let container = element.querySelector('.odo-container');
    if (!container || container.dataset.length !== String(newString.length)) {
      element.innerHTML = '';
      container = document.createElement('span');
      container.className = 'odo-container';
      container.dataset.length = String(newString.length);
      
      for (let i = 0; i < newString.length; i++) {
        const char = newString[i];
        const span = document.createElement('span');
        if (char >= '0' && char <= '9') {
          span.className = 'odo-digit-box';
          span.innerHTML = `<span class="odo-digit-strip" style="transform: translateY(0%);">
            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
          </span>`;
        } else {
          span.className = 'odo-symbol';
          span.textContent = char;
        }
        container.appendChild(span);
      }
      element.appendChild(container);
    }
    
    const strips = container.querySelectorAll('.odo-digit-strip');
    let stripIdx = 0;
    for (let i = 0; i < newString.length; i++) {
      const char = newString[i];
      if (char >= '0' && char <= '9') {
        const strip = strips[stripIdx++];
        if (strip) {
          const digit = parseInt(char, 10);
          strip.style.transform = `translateY(-${digit * 10}%)`;
        }
      } else {
        const symbolSpan = container.children[i];
        if (symbolSpan && symbolSpan.textContent !== char) {
          symbolSpan.textContent = char;
        }
      }
    }
  }

  /**
   * Updates the KPI counters based on a batch of telemetry rows.
   * @param {number} batchSize - The size of the batch
   * @param {number} batchRobotsSum - Sum of robots in the batch
   * @param {number} batchSavingsSum - Sum of savings in the batch
   */
  update(batchSize, batchRobotsSum, batchSavingsSum) {
    this.totalRows += batchSize;
    this.activeRobots += batchRobotsSum;
    this.cumulativeSavings += batchSavingsSum;

    if (this.totalRowsEl) {
      this.updateOdometer(this.totalRowsEl, formatNumber(this.totalRows));
    }
    if (this.activeRobotsEl) {
      this.updateOdometer(this.activeRobotsEl, formatNumber(this.activeRobots));
    }
    if (this.cumulativeSavingsEl) {
      this.updateOdometer(this.cumulativeSavingsEl, formatCurrency(this.cumulativeSavings));
    }
  }

  /**
   * Overwrites the values directly (e.g., when initializing cache or handling baseline)
   */
  setValues(totalRows, activeRobots, cumulativeSavings) {
    this.totalRows = totalRows;
    this.activeRobots = activeRobots;
    this.cumulativeSavings = cumulativeSavings;

    if (this.totalRowsEl) this.updateOdometer(this.totalRowsEl, formatNumber(this.totalRows));
    if (this.activeRobotsEl) this.updateOdometer(this.activeRobotsEl, formatNumber(this.activeRobots));
    if (this.cumulativeSavingsEl) this.updateOdometer(this.cumulativeSavingsEl, formatCurrency(this.cumulativeSavings));
  }
}
