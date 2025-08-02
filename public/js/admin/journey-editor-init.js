/**
 * Journey Editor Initialization Module
 * Handles initialization and event binding
 */

window.JourneyEditor = window.JourneyEditor || {};

(function(JourneyEditor) {
  'use strict';

  /**
   * Initialize the journey editor when DOM is ready
   */
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Journey Editor: Initializing...');
    
    // Check if we're on the journey editor page
    const editorContainer = document.querySelector('.journey-editor');
    if (!editorContainer) {
      console.log('Journey Editor: Not on editor page, skipping initialization');
      return;
    }
    
    // Initialize core functionality
    initializeEventListeners();
    
    // Create import button
    if (JourneyEditor.ExportImport) {
      JourneyEditor.ExportImport.createImportButton();
    }
    
    // Initialize content library searches
    if (JourneyEditor.ContentLibrary) {
      // Delay initialization to ensure DOM is ready
      setTimeout(() => {
        JourneyEditor.ContentLibrary.initializeSearches();
      }, 100);
    }
    
    // Verify all functions are available
    verifyFunctions();
    
    console.log('Journey Editor: Initialization complete');
  });

  /**
   * Initialize all event listeners
   */
  function initializeEventListeners() {
    // Save button
    const saveBtn = document.querySelector('[onclick*="saveJourney"]');
    if (saveBtn) {
      saveBtn.onclick = function() {
        JourneyEditor.saveJourney();
      };
    }
    
    // Add day button
    const addDayBtn = document.querySelector('[onclick*="addDay"]');
    if (addDayBtn) {
      addDayBtn.onclick = function() {
        JourneyEditor.addDay();
      };
    }
    
    // Export button
    const exportBtn = document.querySelector('[onclick*="exportJourney"]');
    if (exportBtn) {
      exportBtn.onclick = function() {
        JourneyEditor.ExportImport.exportJourney();
      };
    }
    
    // Edit day buttons
    document.querySelectorAll('[onclick*="editDay"]').forEach(btn => {
      const dayId = extractDayId(btn.getAttribute('onclick'));
      if (dayId) {
        btn.onclick = function() {
          JourneyEditor.editDay(dayId);
        };
      }
    });
    
    // Delete day buttons
    document.querySelectorAll('[onclick*="deleteDay"]').forEach(btn => {
      const onclick = btn.getAttribute('onclick');
      const match = onclick.match(/deleteDay\('([^']+)',\s*(\d+)\)/);
      if (match) {
        const dayId = match[1];
        const dayNumber = match[2];
        btn.onclick = function() {
          JourneyEditor.deleteDay(dayId, dayNumber);
        };
      }
    });
    
    // Modal close buttons
    document.querySelectorAll('[onclick*="closeDayModal"]').forEach(btn => {
      btn.onclick = function() {
        JourneyEditor.closeDayModal();
      };
    });
    
    document.querySelectorAll('[onclick*="closeContentPicker"]').forEach(btn => {
      btn.onclick = function() {
        JourneyEditor.ContentPicker.close();
      };
    });
    
    // Save day changes button
    const saveDayBtn = document.querySelector('[onclick*="saveDayChanges"]');
    if (saveDayBtn) {
      saveDayBtn.onclick = function() {
        JourneyEditor.saveDayChanges();
      };
    }
    
    // Add content button
    const addContentBtn = document.querySelector('[onclick*="addContentItem"]');
    if (addContentBtn) {
      addContentBtn.onclick = function() {
        JourneyEditor.addContentItem();
      };
    }
    
    // Save selected content button
    const saveContentBtn = document.querySelector('[onclick*="saveSelectedContent"]');
    if (saveContentBtn) {
      saveContentBtn.onclick = function() {
        JourneyEditor.ContentPicker.saveSelectedContent();
      };
    }
    
    // Bible selector events
    const bibleBook = document.getElementById('bibleBook');
    if (bibleBook) {
      bibleBook.onchange = function() {
        JourneyEditor.BibleSelector.loadChapters();
      };
    }
    
    const bibleChapter = document.getElementById('bibleChapter');
    if (bibleChapter) {
      bibleChapter.onchange = function() {
        JourneyEditor.BibleSelector.loadVerses();
      };
    }
    
    // Content tab buttons
    document.querySelectorAll('[onclick*="switchContentTab"]').forEach(btn => {
      const tabName = extractTabName(btn.getAttribute('onclick'));
      if (tabName) {
        btn.onclick = function() {
          JourneyEditor.ContentPicker.switchTab(tabName);
        };
      }
    });
    
    // Search inputs
    document.querySelectorAll('.search-bar input[onkeyup*="searchContent"]').forEach(input => {
      const type = extractContentType(input.getAttribute('onkeyup'));
      if (type) {
        input.onkeyup = function(event) {
          JourneyEditor.ContentLibrary.searchContent(type, event);
        };
      }
    });
    
    // Modal background click to close
    const dayModal = document.getElementById('dayModal');
    if (dayModal) {
      dayModal.addEventListener('click', function(e) {
        if (e.target === this) {
          JourneyEditor.closeDayModal();
        }
      });
    }
    
    const contentModal = document.getElementById('contentPickerModal');
    if (contentModal) {
      contentModal.addEventListener('click', function(e) {
        if (e.target === this) {
          JourneyEditor.ContentPicker.close();
        }
      });
    }
  }

  /**
   * Extract day ID from onclick attribute
   * @param {string} onclick - Onclick attribute value
   * @returns {string|null} Day ID or null
   */
  function extractDayId(onclick) {
    if (!onclick) return null;
    const match = onclick.match(/editDay\('([^']+)'\)/);
    return match ? match[1] : null;
  }

  /**
   * Extract tab name from onclick attribute
   * @param {string} onclick - Onclick attribute value
   * @returns {string|null} Tab name or null
   */
  function extractTabName(onclick) {
    if (!onclick) return null;
    const match = onclick.match(/switchContentTab\('([^']+)'\)/);
    return match ? match[1] : null;
  }

  /**
   * Extract content type from onkeyup attribute
   * @param {string} onkeyup - Onkeyup attribute value
   * @returns {string|null} Content type or null
   */
  function extractContentType(onkeyup) {
    if (!onkeyup) return null;
    const match = onkeyup.match(/searchContent\('([^']+)'\)/);
    return match ? match[1] : null;
  }

  /**
   * Verify all required functions are available
   */
  function verifyFunctions() {
    const requiredFunctions = [
      'JourneyEditor.init',
      'JourneyEditor.saveJourney',
      'JourneyEditor.addDay',
      'JourneyEditor.editDay',
      'JourneyEditor.deleteDay',
      'JourneyEditor.closeDayModal',
      'JourneyEditor.saveDayChanges',
      'JourneyEditor.addContentItem',
      'JourneyEditor.removeContentItem',
      'JourneyEditor.ContentPicker.open',
      'JourneyEditor.ContentPicker.close',
      'JourneyEditor.ContentPicker.switchTab',
      'JourneyEditor.ContentPicker.saveSelectedContent',
      'JourneyEditor.ContentPicker.selectLibraryContent',
      'JourneyEditor.BibleSelector.loadBibleBooks',
      'JourneyEditor.BibleSelector.loadChapters',
      'JourneyEditor.BibleSelector.loadVerses',
      'JourneyEditor.ContentLibrary.searchContent',
      'JourneyEditor.ExportImport.exportJourney'
    ];
    
    let allAvailable = true;
    
    requiredFunctions.forEach(funcPath => {
      const parts = funcPath.split('.');
      let obj = window;
      
      for (let part of parts) {
        if (!obj || !obj[part]) {
          console.error(`Journey Editor: Missing function ${funcPath}`);
          allAvailable = false;
          break;
        }
        obj = obj[part];
      }
    });
    
    if (allAvailable) {
      console.log('Journey Editor: All required functions are available');
    } else {
      console.error('Journey Editor: Some functions are missing!');
    }
    
    return allAvailable;
  }

  // Make functions globally available for onclick handlers
  window.editDay = JourneyEditor.editDay;
  window.deleteDay = JourneyEditor.deleteDay;
  window.addDay = JourneyEditor.addDay;
  window.saveJourney = JourneyEditor.saveJourney;
  window.exportJourney = JourneyEditor.ExportImport ? JourneyEditor.ExportImport.exportJourney : null;
  window.closeDayModal = JourneyEditor.closeDayModal;
  window.saveDayChanges = JourneyEditor.saveDayChanges;
  window.addContentItem = JourneyEditor.addContentItem;
  window.saveSelectedContent = JourneyEditor.ContentPicker ? JourneyEditor.ContentPicker.saveSelectedContent : null;
  window.closeContentPicker = JourneyEditor.ContentPicker ? JourneyEditor.ContentPicker.close : null;
  window.switchContentTab = JourneyEditor.ContentPicker ? JourneyEditor.ContentPicker.switchTab : null;
  window.searchContent = JourneyEditor.ContentLibrary ? JourneyEditor.ContentLibrary.searchContent : null;
  window.loadChapters = JourneyEditor.BibleSelector ? JourneyEditor.BibleSelector.loadChapters : null;
  window.loadVerses = JourneyEditor.BibleSelector ? JourneyEditor.BibleSelector.loadVerses : null;
  window.removeContentItem = JourneyEditor.removeContentItem;
  window.selectLibraryContent = JourneyEditor.ContentPicker ? JourneyEditor.ContentPicker.selectLibraryContent : null;

})(window.JourneyEditor);