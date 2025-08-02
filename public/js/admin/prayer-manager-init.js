/**
 * Prayer Manager Initialization Module
 * Handles initialization and event binding
 */

(function() {
  'use strict';

  /**
   * Initialize the prayer management system
   */
  function initializePrayerManager() {
    console.log('Initializing Prayer Manager...');
    
    // Get initial prayer data from the page
    const prayerDataElement = document.getElementById('initialPrayerData');
    let prayers = [];
    
    if (prayerDataElement) {
      try {
        prayers = JSON.parse(prayerDataElement.textContent || '[]');
      } catch (error) {
        console.error('Error parsing initial prayer data:', error);
        prayers = [];
      }
    }
    
    // Initialize core manager with data
    PrayerManager.init(prayers);
    
    // Initialize all sub-modules
    PrayerManager.FilterManager.init();
    PrayerManager.FormManager.init();
    PrayerManager.ModalManager.init();
    
    // Bind global event listeners
    bindGlobalEvents();
    
    // Apply initial filter and sort
    PrayerManager.FilterManager.filterPrayers();
    
    console.log('Prayer Manager initialized successfully');
  }

  /**
   * Bind global event listeners
   */
  function bindGlobalEvents() {
    // Add New Prayer button
    const addButton = document.getElementById('addPrayerBtn');
    if (addButton) {
      addButton.addEventListener('click', function() {
        PrayerManager.ModalManager.openAddPrayerModal();
      });
    }
    
    // Export buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        PrayerManager.exportPrayers();
      });
    }
    
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function() {
        PrayerManager.exportPrayersCSV();
      });
    }
    
    // Import button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', function() {
        PrayerManager.showImportModal();
      });
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', function() {
        PrayerManager.FilterManager.resetFilters();
      });
    }
    
    // Prayer action buttons (using event delegation)
    const prayerList = document.getElementById('prayerList');
    if (prayerList) {
      prayerList.addEventListener('click', function(e) {
        const target = e.target.closest('button[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const prayerId = target.dataset.prayerId || target.closest('.prayer-item')?.dataset.id;
        
        if (!prayerId && action !== 'add') return;
        
        switch (action) {
          case 'edit':
            PrayerManager.ModalManager.editPrayer(prayerId);
            break;
            
          case 'preview':
            PrayerManager.ModalManager.showPreview(prayerId);
            break;
            
          case 'toggle':
            const currentStatus = target.dataset.isActive === 'true';
            PrayerManager.togglePrayerStatus(prayerId, currentStatus);
            break;
            
          case 'delete':
            PrayerManager.deletePrayer(prayerId);
            break;
        }
      });
    }
    
    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('[data-close-modal]');
    modalCloseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modalId = this.dataset.closeModal;
        switch (modalId) {
          case 'prayerModal':
            PrayerManager.ModalManager.closePrayerModal();
            break;
          case 'previewModal':
            PrayerManager.ModalManager.closePreview();
            break;
          case 'importModal':
            PrayerManager.closeImportModal();
            break;
        }
      });
    });
    
    // Import modal events
    const importFileBtn = document.getElementById('importFileBtn');
    if (importFileBtn) {
      importFileBtn.addEventListener('click', function() {
        PrayerManager.importPrayers();
      });
    }
    
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
      downloadTemplateBtn.addEventListener('click', function() {
        PrayerManager.downloadTemplate();
      });
    }
    
    // Prayer form save button (handled by FormManager)
    // Modal Manager handles keyboard shortcuts
    
    // Add tooltips to action buttons
    initializeTooltips();
  }

  /**
   * Initialize tooltips for better UX
   */
  function initializeTooltips() {
    // Add title attributes to icon buttons
    const iconButtons = document.querySelectorAll('.prayer-item button[data-action]');
    iconButtons.forEach(button => {
      if (!button.title) {
        const action = button.dataset.action;
        const titles = {
          edit: 'Edit prayer',
          preview: 'Preview prayer',
          toggle: 'Toggle active status',
          delete: 'Delete prayer'
        };
        button.title = titles[action] || action;
      }
    });
  }

  /**
   * Add prayer data attributes to items for filtering
   */
  function setupPrayerItemData() {
    const prayerItems = document.querySelectorAll('.prayer-item');
    prayerItems.forEach(item => {
      const id = item.dataset.id;
      const prayer = PrayerManager.getPrayerById(id);
      
      if (prayer) {
        item.dataset.category = prayer.category;
        item.dataset.title = prayer.title.toLowerCase();
        item.dataset.author = (prayer.author || '').toLowerCase();
        item.dataset.usage = prayer.usage_count || 0;
      }
    });
  }

  /**
   * Handle page visibility changes
   */
  function handleVisibilityChange() {
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        // Refresh data when page becomes visible again
        // This helps if prayers were edited in another tab
        const autoRefresh = localStorage.getItem('prayerManagerAutoRefresh');
        if (autoRefresh === 'true') {
          window.location.reload();
        }
      }
    });
  }

  /**
   * Setup keyboard navigation
   */
  function setupKeyboardNav() {
    let selectedIndex = -1;
    const prayerList = document.getElementById('prayerList');
    
    if (!prayerList) return;
    
    document.addEventListener('keydown', function(e) {
      // Only handle if no modal is open and not in an input
      if (document.querySelector('.modal:not(.hidden)') || 
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }
      
      const visibleItems = Array.from(prayerList.querySelectorAll('.prayer-item:not([style*="display: none"])'));
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
          highlightItem(visibleItems[selectedIndex]);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          highlightItem(visibleItems[selectedIndex]);
          break;
          
        case 'Enter':
          if (selectedIndex >= 0 && visibleItems[selectedIndex]) {
            const id = visibleItems[selectedIndex].dataset.id;
            PrayerManager.ModalManager.showPreview(id);
          }
          break;
          
        case 'e':
          if (selectedIndex >= 0 && visibleItems[selectedIndex]) {
            const id = visibleItems[selectedIndex].dataset.id;
            PrayerManager.ModalManager.editPrayer(id);
          }
          break;
      }
    });
    
    function highlightItem(item) {
      if (!item) return;
      
      // Remove previous highlight
      document.querySelectorAll('.prayer-item.keyboard-selected').forEach(el => {
        el.classList.remove('keyboard-selected');
      });
      
      // Add highlight to current item
      item.classList.add('keyboard-selected');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Add keyboard selection styles
   */
  function addKeyboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .prayer-item.keyboard-selected {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializePrayerManager();
      setupPrayerItemData();
      handleVisibilityChange();
      setupKeyboardNav();
      addKeyboardStyles();
    });
  } else {
    // DOM is already loaded
    initializePrayerManager();
    setupPrayerItemData();
    handleVisibilityChange();
    setupKeyboardNav();
    addKeyboardStyles();
  }

})();