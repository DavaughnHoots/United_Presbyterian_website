/**
 * Content Filter Manager Module
 * Handles filtering and sorting functionality
 */

window.ContentLibrary = window.ContentLibrary || {};
ContentLibrary.FilterManager = {};

(function(FilterManager) {
  'use strict';

  /**
   * Apply filters to content
   */
  FilterManager.filterContent = function() {
    const typeFilter = document.getElementById('typeFilter').value;
    const themeFilter = document.getElementById('themeFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Update filter state
    ContentLibrary.updateFilters({
      type: typeFilter,
      theme: themeFilter,
      status: statusFilter,
      sortBy: sortBy
    });
    
    const contentItems = document.querySelectorAll('.content-item');
    let visibleCount = 0;
    
    contentItems.forEach(item => {
      const type = item.dataset.type;
      const theme = (item.dataset.theme || '').toLowerCase();
      const status = item.dataset.status;
      
      let show = true;
      
      if (typeFilter && type !== typeFilter) show = false;
      if (themeFilter && !theme.includes(themeFilter)) show = false;
      if (statusFilter && status !== statusFilter) show = false;
      
      item.style.display = show ? 'block' : 'none';
      if (show) visibleCount++;
    });
    
    // Show/hide empty state
    updateEmptyState(visibleCount);
    
    // Apply sorting if needed
    if (sortBy && sortBy !== 'recent') {
      sortContent(sortBy);
    }
  };

  /**
   * Sort content by specified criteria
   * @param {string} sortBy - Sort criteria
   */
  function sortContent(sortBy) {
    const contentList = document.getElementById('contentList');
    if (!contentList) return;
    
    const items = Array.from(contentList.querySelectorAll('.content-item:not([style*="display: none"])'));
    const allContent = ContentLibrary.getAllContent();
    
    items.sort((a, b) => {
      const aId = a.querySelector('[onclick*="editContent"]').getAttribute('onclick').match(/editContent\('([^']+)'\)/)[1];
      const bId = b.querySelector('[onclick*="editContent"]').getAttribute('onclick').match(/editContent\('([^']+)'\)/)[1];
      
      const aContent = allContent.find(c => c.id === aId);
      const bContent = allContent.find(c => c.id === bId);
      
      switch (sortBy) {
        case 'usage':
          return (bContent.usageCount || 0) - (aContent.usageCount || 0);
        case 'title':
          return aContent.title.localeCompare(bContent.title);
        default:
          return 0;
      }
    });
    
    // Re-append sorted items
    items.forEach(item => contentList.appendChild(item));
  }

  /**
   * Update empty state display
   * @param {number} visibleCount - Number of visible items
   */
  function updateEmptyState(visibleCount) {
    let emptyState = document.getElementById('contentEmptyState');
    
    if (visibleCount === 0) {
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.id = 'contentEmptyState';
        emptyState.className = 'module-card text-center py-12';
        emptyState.innerHTML = `
          <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No content matches your filters.</p>
          <button onclick="ContentLibrary.FilterManager.resetFilters()" class="btn btn-sm btn-secondary mt-4">
            Reset Filters
          </button>
        `;
        document.getElementById('contentList').appendChild(emptyState);
      }
      emptyState.style.display = 'block';
    } else if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  /**
   * Reset all filters
   */
  FilterManager.resetFilters = function() {
    document.getElementById('typeFilter').value = '';
    document.getElementById('themeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('sortBy').value = 'recent';
    
    FilterManager.filterContent();
  };

  /**
   * Initialize filter event listeners
   */
  FilterManager.init = function() {
    // Add event listeners to filter controls
    const filterElements = ['typeFilter', 'themeFilter', 'statusFilter', 'sortBy'];
    
    filterElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'SELECT') {
          element.addEventListener('change', FilterManager.filterContent);
        } else {
          element.addEventListener('keyup', debounce(FilterManager.filterContent, 300));
        }
      }
    });
  };

  /**
   * Debounce function for text input
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get filter statistics
   * @returns {Object} Filter statistics
   */
  FilterManager.getFilterStats = function() {
    const allContent = ContentLibrary.getAllContent();
    const stats = {
      types: {},
      themes: new Set(),
      activeCount: 0,
      inactiveCount: 0
    };
    
    allContent.forEach(item => {
      // Count by type
      stats.types[item.type] = (stats.types[item.type] || 0) + 1;
      
      // Collect themes
      if (item.theme) {
        stats.themes.add(item.theme);
      }
      
      // Count by status
      if (item.isActive) {
        stats.activeCount++;
      } else {
        stats.inactiveCount++;
      }
    });
    
    stats.themes = Array.from(stats.themes).sort();
    return stats;
  };

  /**
   * Export filtered content as CSV
   */
  FilterManager.exportFilteredContent = function() {
    const visibleItems = document.querySelectorAll('.content-item:not([style*="display: none"])');
    const allContent = ContentLibrary.getAllContent();
    
    // Build CSV content
    let csv = 'Type,Title,Theme,Status,Usage Count,Last Used\n';
    
    visibleItems.forEach(item => {
      const id = item.querySelector('[onclick*="editContent"]').getAttribute('onclick').match(/editContent\('([^']+)'\)/)[1];
      const content = allContent.find(c => c.id === id);
      
      if (content) {
        csv += `"${content.type}","${content.title}","${content.theme || ''}","${content.isActive ? 'Active' : 'Inactive'}","${content.usageCount || 0}","${content.lastUsedDate || ''}"\n`;
      }
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-library-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    ContentLibrary.showMessage('Content exported successfully!', 'success');
  };

  // Expose FilterManager
  window.ContentLibrary.FilterManager = FilterManager;

})(ContentLibrary.FilterManager);