/**
 * Journey Editor Core Module
 * Handles main journey data management and state
 */

window.JourneyEditor = window.JourneyEditor || {};

(function(JourneyEditor) {
  'use strict';

  // State management
  let state = {
    journeyId: null,
    journeyData: null,
    journeyDays: [],
    isDirty: false
  };

  /**
   * Initialize the journey editor with data
   * @param {string} journeyId - Journey UUID
   * @param {Array} days - Journey days data
   */
  JourneyEditor.init = function(journeyId, days) {
    state.journeyId = journeyId;
    state.journeyDays = days || [];
    
    console.log('Journey Editor initialized:', {
      journeyId: state.journeyId,
      daysCount: state.journeyDays.length
    });
    
    // Mark as clean
    state.isDirty = false;
  };

  /**
   * Get current journey ID
   * @returns {string} Journey ID
   */
  JourneyEditor.getJourneyId = function() {
    return state.journeyId;
  };

  /**
   * Get all journey days
   * @returns {Array} Journey days
   */
  JourneyEditor.getDays = function() {
    return state.journeyDays;
  };

  /**
   * Get a specific day by ID
   * @param {string} dayId - Day ID
   * @returns {Object|null} Day object or null
   */
  JourneyEditor.getDay = function(dayId) {
    return state.journeyDays.find(d => d.id === dayId) || null;
  };

  /**
   * Update journey days
   * @param {Array} days - Updated days array
   */
  JourneyEditor.setDays = function(days) {
    state.journeyDays = days;
    state.isDirty = true;
  };

  /**
   * Mark editor as dirty (has unsaved changes)
   */
  JourneyEditor.markDirty = function() {
    state.isDirty = true;
  };

  /**
   * Check if editor has unsaved changes
   * @returns {boolean}
   */
  JourneyEditor.isDirty = function() {
    return state.isDirty;
  };

  /**
   * Save journey data to server
   * @returns {Promise}
   */
  JourneyEditor.saveJourney = async function() {
    const journeyData = {
      id: state.journeyId,
      title: document.getElementById('journeyTitle').value,
      description: document.getElementById('journeyDescription').value,
      theme: document.getElementById('journeyTheme').value,
      is_published: document.getElementById('journeyStatus').value === 'true',
      duration_days: state.journeyDays.length
    };
    
    try {
      const response = await fetch('/admin/api/journeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(journeyData)
      });
      
      if (response.ok) {
        state.isDirty = false;
        JourneyEditor.showMessage('Journey saved successfully!', 'success');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save journey');
      }
    } catch (error) {
      console.error('Error saving journey:', error);
      JourneyEditor.showMessage('Failed to save journey: ' + error.message, 'error');
      return false;
    }
  };

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, info)
   */
  JourneyEditor.showMessage = function(message, type = 'info') {
    // Create and show message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type === 'error' ? 'danger' : type} journey-message`;
    messageEl.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => messageEl.remove(), 300);
    }, 5000);
  };

  /**
   * Add CSS animations for messages
   */
  if (!document.getElementById('journey-editor-animations')) {
    const style = document.createElement('style');
    style.id = 'journey-editor-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle beforeunload to warn about unsaved changes
   */
  window.addEventListener('beforeunload', function(e) {
    if (state.isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  });

})(window.JourneyEditor);