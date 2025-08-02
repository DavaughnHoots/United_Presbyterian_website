/**
 * Prayer Filter Manager Module
 * Handles filtering and sorting functionality
 */

window.PrayerManager = window.PrayerManager || {};
PrayerManager.FilterManager = {};

(function(FilterManager) {
  'use strict';

  /**
   * Apply filters to prayers
   */
  FilterManager.filterPrayers = function() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    const authorFilter = document.getElementById('authorFilter').value.toLowerCase();
    
    // Update filter state
    PrayerManager.updateFilters({
      category: categoryFilter,
      search: searchFilter,
      author: authorFilter
    });
    
    const prayerItems = document.querySelectorAll('.prayer-item');
    let visibleCount = 0;
    let visibleItems = [];
    
    prayerItems.forEach(item => {
      const category = item.dataset.category;
      const title = item.dataset.title;
      const author = item.dataset.author;
      
      let show = true;
      
      if (categoryFilter && category !== categoryFilter) show = false;
      if (searchFilter && !title.includes(searchFilter)) show = false;
      if (authorFilter && !author.includes(authorFilter)) show = false;
      
      item.style.display = show ? 'block' : 'none';
      if (show) {
        visibleCount++;
        visibleItems.push(item);
      }
    });
    
    // Update empty state
    updateEmptyState(visibleCount);
    
    // Update stats
    const allPrayers = PrayerManager.getAllPrayers();
    const filteredPrayers = allPrayers.filter(prayer => {
      let match = true;
      if (categoryFilter && prayer.category !== categoryFilter) match = false;
      if (searchFilter && !prayer.title.toLowerCase().includes(searchFilter)) match = false;
      if (authorFilter && !(prayer.author || '').toLowerCase().includes(authorFilter)) match = false;
      return match;
    });
    
    PrayerManager.updateFilteredStats(filteredPrayers);
    
    // Apply current sort
    const sortBy = document.getElementById('sortBy').value;
    if (sortBy) {
      FilterManager.sortPrayers();
    }
  };

  /**
   * Sort prayers by specified criteria
   */
  FilterManager.sortPrayers = function() {
    const sortBy = document.getElementById('sortBy').value;
    const prayerList = document.getElementById('prayerList');
    if (!prayerList) return;
    
    // Get visible items
    const items = Array.from(prayerList.querySelectorAll('.prayer-item:not([style*="display: none"])'));
    
    items.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.dataset.title.localeCompare(b.dataset.title);
          
        case 'category':
          const catA = a.dataset.category;
          const catB = b.dataset.category;
          if (catA !== catB) return catA.localeCompare(catB);
          return a.dataset.title.localeCompare(b.dataset.title);
          
        case 'author':
          const authA = a.dataset.author || '';
          const authB = b.dataset.author || '';
          if (authA !== authB) return authA.localeCompare(authB);
          return a.dataset.title.localeCompare(b.dataset.title);
          
        case 'recent':
          // Reverse order (newest first)
          return items.indexOf(b) - items.indexOf(a);
          
        case 'usage':
          // Sort by usage count (would need to add data-usage attribute)
          const usageA = parseInt(a.dataset.usage || '0');
          const usageB = parseInt(b.dataset.usage || '0');
          return usageB - usageA;
          
        default:
          return 0;
      }
    });
    
    // Re-append sorted items
    items.forEach(item => prayerList.appendChild(item));
  };

  /**
   * Reset all filters
   */
  FilterManager.resetFilters = function() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('searchFilter').value = '';
    document.getElementById('authorFilter').value = '';
    document.getElementById('sortBy').value = 'title';
    
    FilterManager.filterPrayers();
  };

  /**
   * Update empty state display
   * @param {number} visibleCount - Number of visible items
   */
  function updateEmptyState(visibleCount) {
    const emptyState = document.getElementById('emptyState');
    const prayerList = document.getElementById('prayerList');
    
    if (visibleCount === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (prayerList) prayerList.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (prayerList) prayerList.style.display = 'block';
    }
  }

  /**
   * Get unique authors from prayers
   * @returns {Array} List of unique authors
   */
  FilterManager.getUniqueAuthors = function() {
    const prayers = PrayerManager.getAllPrayers();
    const authors = new Set();
    
    prayers.forEach(prayer => {
      if (prayer.author) {
        authors.add(prayer.author);
      }
    });
    
    return Array.from(authors).sort();
  };

  /**
   * Get category statistics
   * @returns {Object} Category counts
   */
  FilterManager.getCategoryStats = function() {
    const prayers = PrayerManager.getAllPrayers();
    const stats = {};
    
    prayers.forEach(prayer => {
      stats[prayer.category] = (stats[prayer.category] || 0) + 1;
    });
    
    return stats;
  };

  /**
   * Initialize filter event listeners
   */
  FilterManager.init = function() {
    // Add event listeners to filter controls
    const filterElements = ['categoryFilter', 'searchFilter', 'authorFilter'];
    
    filterElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'SELECT') {
          element.addEventListener('change', FilterManager.filterPrayers);
        } else {
          element.addEventListener('keyup', debounce(FilterManager.filterPrayers, 300));
        }
      }
    });
    
    // Sort by listener
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      sortBy.addEventListener('change', FilterManager.sortPrayers);
    }
    
    // Add author autocomplete
    setupAuthorAutocomplete();
  };

  /**
   * Set up author autocomplete
   */
  function setupAuthorAutocomplete() {
    const authorInput = document.getElementById('authorFilter');
    if (!authorInput) return;
    
    const authors = FilterManager.getUniqueAuthors();
    if (authors.length === 0) return;
    
    // Create datalist for autocomplete
    const datalist = document.createElement('datalist');
    datalist.id = 'authorList';
    
    authors.forEach(author => {
      const option = document.createElement('option');
      option.value = author;
      datalist.appendChild(option);
    });
    
    document.body.appendChild(datalist);
    authorInput.setAttribute('list', 'authorList');
  }

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

  // Expose FilterManager
  window.PrayerManager.FilterManager = FilterManager;

})(PrayerManager.FilterManager);