/**
 * Content Library Core Module
 * Handles main content management and state
 */

window.ContentLibrary = window.ContentLibrary || {};

(function(ContentLibrary) {
  'use strict';

  // State management
  let state = {
    allContent: [],
    filteredContent: [],
    currentFilter: {
      type: '',
      theme: '',
      status: '',
      sortBy: 'recent'
    },
    editingContent: null
  };

  /**
   * Initialize the content library
   * @param {Array} content - Initial content data
   */
  ContentLibrary.init = function(content) {
    state.allContent = content || [];
    state.filteredContent = [...state.allContent];
    
    console.log('Content Library initialized with', state.allContent.length, 'items');
  };

  /**
   * Get all content
   * @returns {Array} All content items
   */
  ContentLibrary.getAllContent = function() {
    return state.allContent;
  };

  /**
   * Get filtered content
   * @returns {Array} Filtered content items
   */
  ContentLibrary.getFilteredContent = function() {
    return state.filteredContent;
  };

  /**
   * Get content by ID
   * @param {string} id - Content ID
   * @returns {Object|null} Content item or null
   */
  ContentLibrary.getContentById = function(id) {
    return state.allContent.find(c => c.id === id) || null;
  };

  /**
   * Set editing content
   * @param {Object} content - Content to edit
   */
  ContentLibrary.setEditingContent = function(content) {
    state.editingContent = content;
  };

  /**
   * Get editing content
   * @returns {Object|null} Content being edited
   */
  ContentLibrary.getEditingContent = function() {
    return state.editingContent;
  };

  /**
   * Update filter state
   * @param {Object} filters - Filter values
   */
  ContentLibrary.updateFilters = function(filters) {
    Object.assign(state.currentFilter, filters);
  };

  /**
   * Get current filters
   * @returns {Object} Current filter state
   */
  ContentLibrary.getCurrentFilters = function() {
    return state.currentFilter;
  };

  /**
   * Save content to server
   * @param {Object} data - Content data
   * @returns {Promise}
   */
  ContentLibrary.saveContent = async function(data) {
    const id = data.id;
    const url = id ? `/admin/api/content/${id}` : '/admin/api/content';
    const method = id ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        ContentLibrary.showMessage('Content saved successfully!', 'success');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      ContentLibrary.showMessage('Failed to save content: ' + error.message, 'error');
      return false;
    }
  };

  /**
   * Toggle content status
   * @param {string} id - Content ID
   * @param {boolean} currentStatus - Current active status
   * @returns {Promise}
   */
  ContentLibrary.toggleContentStatus = async function(id, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this content?`)) {
      return false;
    }
    
    try {
      const response = await fetch(`/admin/api/content/${id}/toggle`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        ContentLibrary.showMessage('Content status updated!', 'success');
        return true;
      } else {
        throw new Error('Failed to update content status');
      }
    } catch (error) {
      console.error('Error toggling content status:', error);
      ContentLibrary.showMessage('Failed to update content status', 'error');
      return false;
    }
  };

  /**
   * Delete content
   * @param {string} id - Content ID
   * @returns {Promise}
   */
  ContentLibrary.deleteContent = async function(id) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return false;
    }
    
    try {
      const response = await fetch(`/admin/api/content/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        ContentLibrary.showMessage('Content deleted successfully!', 'success');
        return true;
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      ContentLibrary.showMessage('Failed to delete content', 'error');
      return false;
    }
  };

  /**
   * Show a message to the user
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, info)
   */
  ContentLibrary.showMessage = function(message, type = 'info') {
    // Create and show message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type === 'error' ? 'danger' : type} content-message`;
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
  if (!document.getElementById('content-library-animations')) {
    const style = document.createElement('style');
    style.id = 'content-library-animations';
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

})(window.ContentLibrary);