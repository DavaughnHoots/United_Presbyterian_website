/**
 * Content Library Initialization Module
 * Handles initialization and event binding
 */

window.ContentLibrary = window.ContentLibrary || {};

(function(ContentLibrary) {
  'use strict';

  /**
   * Initialize the content library when DOM is ready
   */
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Content Library: Initializing...');
    
    // Check if we're on the content library page
    const contentList = document.getElementById('contentList');
    if (!contentList) {
      console.log('Content Library: Not on content page, skipping initialization');
      return;
    }
    
    // Initialize all modules
    initializeModules();
    
    // Set up global functions for onclick handlers
    setupGlobalFunctions();
    
    // Verify all functions are available
    verifyFunctions();
    
    console.log('Content Library: Initialization complete');
  });

  /**
   * Initialize all content library modules
   */
  function initializeModules() {
    // Initialize filter manager
    if (ContentLibrary.FilterManager) {
      ContentLibrary.FilterManager.init();
    }
    
    // Initialize form manager
    if (ContentLibrary.FormManager) {
      ContentLibrary.FormManager.init();
    }
    
    // Initialize modal manager
    if (ContentLibrary.ModalManager) {
      ContentLibrary.ModalManager.init();
    }
    
    // Initialize media preview
    if (ContentLibrary.MediaPreview) {
      ContentLibrary.MediaPreview.init();
    }
    
    // Add export button if not exists
    addExportButton();
    
    // Add preview functionality to content items
    addPreviewButtons();
  }

  /**
   * Set up global functions for onclick handlers
   */
  function setupGlobalFunctions() {
    // Core functions
    window.filterContent = ContentLibrary.FilterManager ? ContentLibrary.FilterManager.filterContent : null;
    window.resetFilters = ContentLibrary.FilterManager ? ContentLibrary.FilterManager.resetFilters : null;
    
    // Form functions
    window.openAddContentModal = ContentLibrary.ModalManager ? ContentLibrary.ModalManager.openAddContentModal : null;
    window.closeContentModal = ContentLibrary.ModalManager ? ContentLibrary.ModalManager.closeContentModal : null;
    window.editContent = ContentLibrary.ModalManager ? ContentLibrary.ModalManager.editContent : null;
    window.saveContent = ContentLibrary.FormManager ? ContentLibrary.FormManager.saveContent : null;
    window.updateFormFields = ContentLibrary.FormManager ? ContentLibrary.FormManager.updateFormFields : null;
    
    // Action functions
    window.toggleContentStatus = ContentLibrary.ModalManager ? ContentLibrary.ModalManager.toggleContentStatus : null;
    window.deleteContent = ContentLibrary.ModalManager ? ContentLibrary.ModalManager.deleteContent : null;
    
    // Media preview functions
    window.previewImage = ContentLibrary.MediaPreview ? ContentLibrary.MediaPreview.previewImage : null;
    window.previewVideo = ContentLibrary.MediaPreview ? ContentLibrary.MediaPreview.previewVideo : null;
  }

  /**
   * Add export button to the page
   */
  function addExportButton() {
    const headerActions = document.querySelector('.mb-8.flex.justify-between');
    if (!headerActions || document.getElementById('exportContentBtn')) return;
    
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportContentBtn';
    exportBtn.className = 'btn-secondary ml-2';
    exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export';
    exportBtn.onclick = function() {
      if (ContentLibrary.FilterManager) {
        ContentLibrary.FilterManager.exportFilteredContent();
      }
    };
    
    const actionsDiv = headerActions.querySelector('div:last-child') || headerActions;
    actionsDiv.appendChild(exportBtn);
  }

  /**
   * Add preview buttons to content items
   */
  function addPreviewButtons() {
    const contentItems = document.querySelectorAll('.content-item');
    
    contentItems.forEach(item => {
      const actionsDiv = item.querySelector('.ml-4.flex');
      if (!actionsDiv || actionsDiv.querySelector('.preview-btn')) return;
      
      // Extract content ID from edit button
      const editBtn = actionsDiv.querySelector('[onclick*="editContent"]');
      if (!editBtn) return;
      
      const onclick = editBtn.getAttribute('onclick');
      const match = onclick.match(/editContent\('([^']+)'\)/);
      if (!match) return;
      
      const contentId = match[1];
      
      // Create preview button
      const previewBtn = document.createElement('button');
      previewBtn.className = 'preview-btn text-indigo-600 hover:bg-indigo-50 p-2 rounded mr-2';
      previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
      previewBtn.title = 'Preview';
      previewBtn.onclick = function() {
        if (ContentLibrary.ModalManager) {
          ContentLibrary.ModalManager.showPreview(contentId);
        }
      };
      
      // Insert before edit button
      actionsDiv.insertBefore(previewBtn, editBtn);
    });
  }

  /**
   * Verify all required functions are available
   */
  function verifyFunctions() {
    const requiredFunctions = [
      'ContentLibrary.init',
      'ContentLibrary.getAllContent',
      'ContentLibrary.saveContent',
      'ContentLibrary.deleteContent',
      'ContentLibrary.toggleContentStatus',
      'ContentLibrary.FilterManager.filterContent',
      'ContentLibrary.FilterManager.resetFilters',
      'ContentLibrary.FormManager.updateFormFields',
      'ContentLibrary.FormManager.saveContent',
      'ContentLibrary.ModalManager.openAddContentModal',
      'ContentLibrary.ModalManager.closeContentModal',
      'ContentLibrary.ModalManager.editContent',
      'ContentLibrary.MediaPreview.previewImage',
      'ContentLibrary.MediaPreview.previewVideo'
    ];
    
    let allAvailable = true;
    
    requiredFunctions.forEach(funcPath => {
      const parts = funcPath.split('.');
      let obj = window;
      
      for (let part of parts) {
        if (!obj || !obj[part]) {
          console.error(`Content Library: Missing function ${funcPath}`);
          allAvailable = false;
          break;
        }
        obj = obj[part];
      }
    });
    
    if (allAvailable) {
      console.log('Content Library: All required functions are available');
    } else {
      console.error('Content Library: Some functions are missing!');
    }
    
    return allAvailable;
  }

  /**
   * Add keyboard shortcuts
   */
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to open add content modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (ContentLibrary.ModalManager) {
        ContentLibrary.ModalManager.openAddContentModal();
      }
    }
    
    // Ctrl/Cmd + F to focus on theme filter
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      const themeFilter = document.getElementById('themeFilter');
      if (themeFilter) {
        e.preventDefault();
        themeFilter.focus();
        themeFilter.select();
      }
    }
  });

})(window.ContentLibrary);