/**
 * Journey Editor Test Module
 * Quick test to verify all functions are available
 */

(function() {
  'use strict';
  
  window.addEventListener('DOMContentLoaded', function() {
    console.log('=== Journey Editor Function Test ===');
    
    const functions = {
      'Core': [
        'JourneyEditor.init',
        'JourneyEditor.getJourneyId',
        'JourneyEditor.getDays',
        'JourneyEditor.getDay',
        'JourneyEditor.saveJourney',
        'JourneyEditor.showMessage'
      ],
      'Day Manager': [
        'JourneyEditor.addDay',
        'JourneyEditor.editDay',
        'JourneyEditor.deleteDay',
        'JourneyEditor.closeDayModal',
        'JourneyEditor.saveDayChanges',
        'JourneyEditor.removeContentItem',
        'JourneyEditor.addContentItem'
      ],
      'Content Picker': [
        'JourneyEditor.ContentPicker.open',
        'JourneyEditor.ContentPicker.close',
        'JourneyEditor.ContentPicker.switchTab',
        'JourneyEditor.ContentPicker.saveSelectedContent',
        'JourneyEditor.ContentPicker.selectLibraryContent'
      ],
      'Bible Selector': [
        'JourneyEditor.BibleSelector.loadBibleBooks',
        'JourneyEditor.BibleSelector.loadChapters',
        'JourneyEditor.BibleSelector.loadVerses',
        'JourneyEditor.BibleSelector.loadVersePreview'
      ],
      'Content Library': [
        'JourneyEditor.ContentLibrary.searchContent',
        'JourneyEditor.ContentLibrary.previewMedia'
      ],
      'Export/Import': [
        'JourneyEditor.ExportImport.exportJourney',
        'JourneyEditor.ExportImport.importJourney'
      ]
    };
    
    let totalFunctions = 0;
    let availableFunctions = 0;
    
    Object.keys(functions).forEach(module => {
      console.log(`\n--- ${module} ---`);
      functions[module].forEach(func => {
        totalFunctions++;
        const parts = func.split('.');
        let obj = window;
        let exists = true;
        
        for (let part of parts) {
          if (!obj || !obj[part]) {
            exists = false;
            break;
          }
          obj = obj[part];
        }
        
        if (exists) {
          availableFunctions++;
          console.log('✓', func);
        } else {
          console.error('✗', func, '- NOT FOUND');
        }
      });
    });
    
    console.log(`\n=== Summary: ${availableFunctions}/${totalFunctions} functions available ===`);
    
    // Check global functions
    console.log('\n--- Global Functions (for onclick) ---');
    const globalFuncs = [
      'editDay', 'deleteDay', 'addDay', 'saveJourney', 
      'exportJourney', 'closeDayModal', 'saveDayChanges',
      'addContentItem', 'closeContentPicker', 'switchContentTab',
      'saveSelectedContent', 'removeContentItem', 'selectLibraryContent'
    ];
    
    globalFuncs.forEach(func => {
      if (typeof window[func] === 'function') {
        console.log('✓', func);
      } else {
        console.error('✗', func, '- NOT AVAILABLE GLOBALLY');
      }
    });
  });
})();