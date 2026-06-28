/**
 * Feature 6: Operator Workspace Layout Persistence
 */

export class LayoutPersistence {
  constructor() {
    this.storageKey = 'rpa_monitor_layout_settings';
    this.settings = {};
  }

  /**
   * Initializes toggles and restores saved panel visibility configurations.
   * @param {Array<Object>} config - Array of objects containing toggleId, panelId, and optional defaultVisible
   */
  init(config) {
    this.config = config;
    this.loadSettings();

    this.config.forEach(item => {
      const toggleBtn = document.getElementById(item.toggleId);
      const panel = document.getElementById(item.panelId);

      if (!panel) return;

      // Determine initial visibility (localStorage -> config default -> true)
      let isVisible = true;
      if (this.settings[item.panelId] !== undefined) {
        isVisible = this.settings[item.panelId];
      } else if (item.defaultVisible !== undefined) {
        isVisible = item.defaultVisible;
      }

      this.setPanelVisibility(panel, toggleBtn, isVisible);

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const nowVisible = !panel.classList.contains('panel-hidden');
          this.setPanelVisibility(panel, toggleBtn, !nowVisible);
          this.settings[item.panelId] = !nowVisible;
          this.saveSettings();
        });
      }
    });
  }

  /**
   * Sets visibility states on a panel and updates styling of toggle buttons.
   */
  setPanelVisibility(panel, toggleBtn, isVisible) {
    if (isVisible) {
      panel.classList.remove('panel-hidden');
      if (toggleBtn) {
        toggleBtn.classList.add('toggle-active');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    } else {
      panel.classList.add('panel-hidden');
      if (toggleBtn) {
        toggleBtn.classList.remove('toggle-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }
    
    // Dispatch window resize event so that virtual scroll grids recalculate heights if necessary
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Saves settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save layout settings to localStorage:', e);
    }
  }

  /**
   * Loads settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.settings = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load layout settings from localStorage:', e);
      this.settings = {};
    }
  }
}
