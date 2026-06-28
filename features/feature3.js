/**
 * Feature 3: Visual System Alert & Status Indicators
 */

/**
 * Checks a row object and returns the appropriate alert animation CSS class if applicable.
 * @param {Object} rowData - The raw telemetry row object
 * @returns {string|null} The alert CSS class name, or null if no alert is needed
 */
export function getAlertClass(rowData) {
  if (rowData.project_status === 'Failed') {
    return 'row-alert-failed';
  }
  if (Number(rowData.roi_percent) < 0) {
    return 'row-alert-negative';
  }
  return null;
}

/**
 * Applies the alert animation class to the element and removes it when the animation ends
 * to prevent DOM clutter and optimize performance.
 * @param {HTMLElement} rowEl - The DOM row element
 * @param {Object} rowData - The raw telemetry row object
 */
export function applyVisualAlert(rowEl, rowData) {
  const alertClass = getAlertClass(rowData);
  if (!alertClass) return;

  // Add the flash class
  rowEl.classList.remove('row-alert-failed', 'row-alert-negative');
  // Trigger a reflow to restart the animation if the class was already present
  void rowEl.offsetWidth; 
  rowEl.classList.add(alertClass);

  // Clean up class once animation completes to keep DOM clean
  const cleanup = () => {
    rowEl.classList.remove(alertClass);
    rowEl.removeEventListener('animationend', cleanup);
  };
  rowEl.addEventListener('animationend', cleanup);
}
