/**
 * Feature 5: The Pipeline Buffer Control (Pause/Play)
 */

export class PipelineBuffer {
  constructor() {
    this.isPaused = false;
    this.backlog = [];
    this.statusEl = null;
    this.indicatorEl = null;
  }

  /**
   * Initializes the DOM elements for pipeline controls
   * @param {string} buttonId - The Play/Pause button ID
   * @param {string} indicatorId - The Status overlay indicator ID
   */
  init(buttonId, indicatorId) {
    this.statusEl = document.getElementById(buttonId);
    this.indicatorEl = document.getElementById(indicatorId);

    if (this.statusEl) {
      this.statusEl.addEventListener('click', () => this.toggle());
    }
    this.updateUI();
  }

  /**
   * Toggles the play/pause state of the pipeline
   */
  toggle() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Pauses UI updates and routes incoming streams to backlog
   */
  pause() {
    this.isPaused = true;
    this.updateUI();
  }

  /**
   * Resumes UI updates and flushes the backlog
   */
  resume() {
    this.isPaused = false;
    this.updateUI();
    if (this.onFlushCallback && this.backlog.length > 0) {
      // Send accumulated rows to main cache
      const accumulated = [...this.backlog];
      this.backlog = [];
      this.onFlushCallback(accumulated);
    }
    this.updateUI();
  }

  /**
   * Set callback for flushing backlog rows
   * @param {Function} callback 
   */
  onFlush(callback) {
    this.onFlushCallback = callback;
  }

  /**
   * Pushes incoming data batch. If paused, stores in backlog.
   * @param {Array<Object>} batch - Incoming row batch
   * @returns {boolean} True if processed live, false if buffered
   */
  handleIncoming(batch) {
    if (this.isPaused) {
      this.backlog.push(...batch);
      this.updateUI();
      return false; // Buffered
    }
    return true; // Live
  }

  /**
   * Updates Play/Pause button and live status overlay HUD elements
   */
  updateUI() {
    if (this.statusEl) {
      this.statusEl.innerHTML = this.isPaused 
        ? `<span class="icon">▶</span> RESUME STREAM` 
        : `<span class="icon">⏸</span> PAUSE STREAM`;
      
      if (this.isPaused) {
        this.statusEl.classList.add('paused-btn');
      } else {
        this.statusEl.classList.remove('paused-btn');
      }
    }

    // Toggle pulse active animations on the KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      if (this.isPaused) {
        card.classList.remove('pulse-active');
      } else {
        card.classList.add('pulse-active');
      }
    });

    if (this.indicatorEl) {
      if (this.isPaused) {
        this.indicatorEl.className = 'status-overlay status-paused';
        this.indicatorEl.innerHTML = `
          <span class="blip blink-amber"></span>
          <span class="status-text">BUFFERING DATA: <strong>${this.backlog.length}</strong> updates queued</span>
        `;
      } else {
        this.indicatorEl.className = 'status-overlay status-live';
        this.indicatorEl.innerHTML = `
          <span class="blip blink-green"></span>
          <span class="status-text">SYSTEM ONLINE (LIVE FEED)</span>
        `;
      }
    }
  }

  /**
   * Gets the current backlog count
   * @returns {number}
   */
  getBacklogCount() {
    return this.backlog.length;
  }
}
