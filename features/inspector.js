/**
 * Feature Extension: Isolated Relational Project Inspector using HTML5 Dialog
 */

import { formatCurrency, formatNumber, formatPercent } from './feature2.js';

export class InspectorPanel {
  constructor() {
    this.dialogEl = null;
  }

  /**
   * Initializes the dialog element reference and hooks the close button
   * @param {string} dialogId - The ID of the HTML5 dialog element
   */
  init(dialogId) {
    this.dialogEl = document.getElementById(dialogId);
    if (!this.dialogEl) {
      console.warn(`[InspectorPanel] Dialog element with ID "${dialogId}" not found.`);
      return;
    }

    // Close on click outside modal content (backdrop click handler)
    this.dialogEl.addEventListener('click', (e) => {
      const rect = this.dialogEl.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        this.close();
      }
    });
  }

  /**
   * Renders the attributes beautifully and displays the dialog
   * @param {Object} rowData 
   */
  open(rowData) {
    if (!this.dialogEl) return;

    const isAi = rowData.ai_enabled === 'Yes';
    const isCloud = rowData.cloud_deployment === 'Yes';
    const statusClass = String(rowData.project_status).toLowerCase();

    // Render inner content matching style.css layout classes
    this.dialogEl.innerHTML = `
      <div class="inspector-modal-content">
        <div class="inspector-header">
          <div class="header-main">
            <span class="header-icon">🔍</span>
            <div class="header-titles">
              <h3 class="inspector-title" id="inspector-dialog-title">PROJECT RELATIONAL METADATA</h3>
              <span class="inspector-subtitle">PROJECT ID: ${rowData.project_id || 'N/A'}</span>
            </div>
          </div>
          <button class="inspector-close-btn" id="btn-close-inspector" aria-label="Close Inspector">&times;</button>
        </div>
        
        <div class="inspector-body">
          <!-- Section 1: Core Identification -->
          <div class="inspector-section">
            <h4 class="inspector-section-title">Core Identification</h4>
            <div class="inspector-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Project Name</span>
                <span class="meta-value text-value text-cyan">${rowData.project_name || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Company ID</span>
                <span class="meta-value">${rowData.company_id || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">System Status</span>
                <span class="meta-value">
                  <span class="status-badge status-badge-${statusClass}">
                    ${String(rowData.project_status || 'N/A').toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Section 2: Financial Metrics -->
          <div class="inspector-section">
            <h4 class="inspector-section-title">Financial Metrics & Savings</h4>
            <div class="inspector-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Project Budget</span>
                <span class="meta-value">${formatCurrency(rowData.budget_usd)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Annual Savings</span>
                <span class="meta-value text-emerald">${formatCurrency(rowData.annual_savings_usd)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ROI Percentage</span>
                <span class="meta-value ${Number(rowData.roi_percent) >= 0 ? 'text-emerald' : 'text-rose'}">
                  ${formatPercent(rowData.roi_percent)}
                </span>
              </div>
            </div>
          </div>

          <!-- Section 3: Operations & Environment -->
          <div class="inspector-section">
            <h4 class="inspector-section-title">Operations & Environment</h4>
            <div class="inspector-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Robots Deployed</span>
                <span class="meta-value text-emerald">${formatNumber(rowData.robots_deployed)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Employee Hours Saved</span>
                <span class="meta-value">${formatNumber(rowData.employee_hours_saved)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Department</span>
                <span class="meta-value">${rowData.department || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Section 4: Categorical Relations -->
          <div class="inspector-section">
            <h4 class="inspector-section-title">Categorical Relations</h4>
            <div class="inspector-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Automation Type</span>
                <span class="meta-value">${rowData.automation_type || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Implementation Partner</span>
                <span class="meta-value">${rowData.implementation_partner || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Target Region / Country</span>
                <span class="meta-value">${rowData.country || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Target Industry</span>
                <span class="meta-value">${rowData.industry || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Section 5: Technology Specs -->
          <div class="inspector-section">
            <h4 class="inspector-section-title">Technology Specification</h4>
            <div class="inspector-meta-grid">
              <div class="meta-item">
                <span class="meta-label">AI Enabled Featureset</span>
                <span class="meta-value">
                  <span class="boolean-pill ${isAi ? 'pill-yes' : 'pill-no'}">
                    ${rowData.ai_enabled || 'No'}
                  </span>
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Cloud Deployment</span>
                <span class="meta-value">
                  <span class="boolean-pill ${isCloud ? 'pill-yes' : 'pill-no'}">
                    ${rowData.cloud_deployment || 'No'}
                  </span>
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Start / Completion</span>
                <span class="meta-value">${rowData.start_date || 'N/A'} ${rowData.completion_date ? '→ ' + rowData.completion_date : '(Active)'}</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    `;

    // Hook the close button click
    const closeBtn = this.dialogEl.querySelector('#btn-close-inspector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Call native showModal method
    this.dialogEl.showModal();
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the dialog
   */
  close() {
    if (!this.dialogEl) return;
    this.dialogEl.close();
    document.body.style.overflow = '';
  }
}
