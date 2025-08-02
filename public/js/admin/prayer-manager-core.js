/**
 * Prayer Manager Core Module
 * Handles main prayer management and state
 */

window.PrayerManager = window.PrayerManager || {};

(function(PrayerManager) {
  'use strict';

  // State management
  let state = {
    allPrayers: [],
    filteredPrayers: [],
    currentFilter: {
      category: '',
      search: '',
      author: '',
      sortBy: 'title'
    },
    editingPrayer: null,
    stats: {
      total: 0,
      active: 0,
      categories: new Set(),
      filtered: 0
    }
  };

  /**
   * Initialize the prayer manager
   * @param {Array} prayers - Initial prayer data
   */
  PrayerManager.init = function(prayers) {
    state.allPrayers = prayers || [];
    state.filteredPrayers = [...state.allPrayers];
    
    updateStats();
    
    console.log('Prayer Manager initialized with', state.allPrayers.length, 'prayers');
  };

  /**
   * Get all prayers
   * @returns {Array} All prayer items
   */
  PrayerManager.getAllPrayers = function() {
    return state.allPrayers;
  };

  /**
   * Get filtered prayers
   * @returns {Array} Filtered prayer items
   */
  PrayerManager.getFilteredPrayers = function() {
    return state.filteredPrayers;
  };

  /**
   * Get prayer by ID
   * @param {string} id - Prayer ID
   * @returns {Object|null} Prayer item or null
   */
  PrayerManager.getPrayerById = function(id) {
    return state.allPrayers.find(p => p.id === id) || null;
  };

  /**
   * Set editing prayer
   * @param {Object} prayer - Prayer to edit
   */
  PrayerManager.setEditingPrayer = function(prayer) {
    state.editingPrayer = prayer;
  };

  /**
   * Get editing prayer
   * @returns {Object|null} Prayer being edited
   */
  PrayerManager.getEditingPrayer = function() {
    return state.editingPrayer;
  };

  /**
   * Update filter state
   * @param {Object} filters - Filter values
   */
  PrayerManager.updateFilters = function(filters) {
    Object.assign(state.currentFilter, filters);
  };

  /**
   * Get current filters
   * @returns {Object} Current filter state
   */
  PrayerManager.getCurrentFilters = function() {
    return state.currentFilter;
  };

  /**
   * Get statistics
   * @returns {Object} Prayer statistics
   */
  PrayerManager.getStats = function() {
    return state.stats;
  };

  /**
   * Update statistics
   */
  function updateStats() {
    state.stats.total = state.allPrayers.length;
    state.stats.active = state.allPrayers.filter(p => p.is_active).length;
    state.stats.categories = new Set(state.allPrayers.map(p => p.category));
    state.stats.filtered = state.filteredPrayers.length;
    
    // Update UI
    updateStatsDisplay();
  }

  /**
   * Update statistics display
   */
  function updateStatsDisplay() {
    const elements = {
      totalCount: document.getElementById('totalCount'),
      activeCount: document.getElementById('activeCount'),
      categoryCount: document.getElementById('categoryCount'),
      filteredCount: document.getElementById('filteredCount')
    };
    
    if (elements.totalCount) elements.totalCount.textContent = state.stats.total;
    if (elements.activeCount) elements.activeCount.textContent = state.stats.active;
    if (elements.categoryCount) elements.categoryCount.textContent = state.stats.categories.size;
    if (elements.filteredCount) elements.filteredCount.textContent = state.stats.filtered;
  }

  /**
   * Save prayer to server
   * @param {Object} data - Prayer data
   * @returns {Promise}
   */
  PrayerManager.savePrayer = async function(data) {
    const id = data.id;
    const url = id ? `/admin/api/prayers/${id}` : '/admin/api/prayers';
    const method = id ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        PrayerManager.showMessage('Prayer saved successfully!', 'success');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prayer');
      }
    } catch (error) {
      console.error('Error saving prayer:', error);
      PrayerManager.showMessage('Failed to save prayer: ' + error.message, 'error');
      return false;
    }
  };

  /**
   * Toggle prayer status
   * @param {string} id - Prayer ID
   * @param {boolean} currentStatus - Current active status
   * @returns {Promise}
   */
  PrayerManager.togglePrayerStatus = async function(id, currentStatus) {
    const prayer = PrayerManager.getPrayerById(id);
    if (!prayer) return false;
    
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this prayer?`)) {
      return false;
    }
    
    try {
      const response = await fetch(`/admin/api/prayers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prayer,
          is_active: !currentStatus
        })
      });
      
      if (response.ok) {
        PrayerManager.showMessage('Prayer status updated!', 'success');
        setTimeout(() => window.location.reload(), 1000);
        return true;
      } else {
        throw new Error('Failed to update prayer status');
      }
    } catch (error) {
      console.error('Error toggling prayer status:', error);
      PrayerManager.showMessage('Failed to update prayer status', 'error');
      return false;
    }
  };

  /**
   * Delete prayer
   * @param {string} id - Prayer ID
   * @returns {Promise}
   */
  PrayerManager.deletePrayer = async function(id) {
    if (!confirm('Are you sure you want to delete this prayer? This action cannot be undone.')) {
      return false;
    }
    
    try {
      const response = await fetch(`/admin/api/prayers/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        PrayerManager.showMessage('Prayer deleted successfully!', 'success');
        setTimeout(() => window.location.reload(), 1000);
        return true;
      } else {
        throw new Error('Failed to delete prayer');
      }
    } catch (error) {
      console.error('Error deleting prayer:', error);
      PrayerManager.showMessage('Failed to delete prayer', 'error');
      return false;
    }
  };

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, info)
   */
  PrayerManager.showMessage = function(message, type = 'info') {
    // Create and show message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type === 'error' ? 'danger' : type} prayer-message`;
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
  if (!document.getElementById('prayer-manager-animations')) {
    const style = document.createElement('style');
    style.id = 'prayer-manager-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .alert {
        padding: 1rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .alert-success {
        background-color: #d1fae5;
        color: #065f46;
      }
      .alert-danger {
        background-color: #fee2e2;
        color: #991b1b;
      }
      .alert-info {
        background-color: #dbeafe;
        color: #1e40af;
      }
    `;
    document.head.appendChild(style);
  }

  // Update stats when filtered prayers change
  PrayerManager.updateFilteredStats = function(filtered) {
    state.filteredPrayers = filtered;
    state.stats.filtered = filtered.length;
    updateStatsDisplay();
  };

})(window.PrayerManager);