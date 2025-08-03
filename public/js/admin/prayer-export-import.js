/**
 * Prayer Export/Import Module
 * Handles prayer export and import functionality
 */

window.PrayerManager = window.PrayerManager || {};

(function(PrayerManager) {
  'use strict';
  
  console.log('Prayer Export/Import module loading...');
  
  try {

  /**
   * Export prayers to JSON file
   */
  PrayerManager.exportPrayers = function() {
    const prayers = PrayerManager.getFilteredPrayers();
    
    if (prayers.length === 0) {
      PrayerManager.showMessage('No prayers to export', 'warning');
      return;
    }
    
    // Prepare export data
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      prayer_count: prayers.length,
      prayers: prayers.map(prayer => ({
        title: prayer.title,
        category: prayer.category,
        author: prayer.author,
        content: prayer.content,
        audio_url: prayer.audio_url,
        tags: prayer.tags,
        bible_references: prayer.bible_references || [],
        metadata: prayer.metadata || {},
        is_active: prayer.is_active
      }))
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    link.download = `prayers-export-${date}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    PrayerManager.showMessage(`Exported ${prayers.length} prayers successfully!`, 'success');
  };

  /**
   * Export prayers as CSV
   */
  PrayerManager.exportPrayersCSV = function() {
    const prayers = PrayerManager.getFilteredPrayers();
    
    if (prayers.length === 0) {
      PrayerManager.showMessage('No prayers to export', 'warning');
      return;
    }
    
    // Build CSV content
    let csv = 'Title,Category,Author,Content,Tags,Active,Audio Available\n';
    
    prayers.forEach(prayer => {
      const row = [
        `"${prayer.title.replace(/"/g, '""')}"`,
        prayer.category,
        `"${(prayer.author || '').replace(/"/g, '""')}"`,
        `"${prayer.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(prayer.tags || []).join(', ')}"`,
        prayer.is_active ? 'Yes' : 'No',
        prayer.audio_url ? 'Yes' : 'No'
      ];
      csv += row.join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prayers-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    PrayerManager.showMessage(`Exported ${prayers.length} prayers as CSV!`, 'success');
  };

  /**
   * Show import modal
   */
  PrayerManager.showImportModal = function() {
    const modal = document.getElementById('importModal');
    if (modal) {
      modal.classList.remove('hidden');
      // Initialize tabs
      PrayerManager.initImportTabs();
      
      // Debug: Check if all elements exist
      console.log('Import modal opened');
      console.log('File tab:', modal.querySelector('#fileImportContent'));
      console.log('JSON tab:', modal.querySelector('#jsonImportContent'));
      console.log('Example tab:', modal.querySelector('#exampleContent'));
    } else {
      console.error('Import modal not found');
    }
  };

  /**
   * Close import modal
   */
  PrayerManager.closeImportModal = function() {
    const modal = document.getElementById('importModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    
    // Reset inputs
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
      fileInput.value = '';
    }
    
    const jsonInput = document.getElementById('jsonInput');
    if (jsonInput) {
      jsonInput.value = '';
    }
    
    const validation = document.getElementById('jsonValidation');
    if (validation) {
      validation.textContent = '';
      validation.className = 'text-sm';
    }
  };

  /**
   * Initialize import modal tabs
   */
  PrayerManager.initImportTabs = function() {
    const modal = document.getElementById('importModal');
    if (!modal) return;
    
    // Remove any existing listeners by using event delegation
    const tabContainer = modal.querySelector('.flex.border-b');
    if (!tabContainer) return;
    
    // Remove any existing click handler
    if (tabContainer._tabHandler) {
      tabContainer.removeEventListener('click', tabContainer._tabHandler);
    }
    
    // Create new handler
    tabContainer._tabHandler = function(e) {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      
      const targetTab = tab.getAttribute('data-tab');
      console.log('Tab clicked:', targetTab);
      
      // Update tab buttons within the modal only
      modal.querySelectorAll('[data-tab]').forEach(t => {
        t.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        t.classList.add('text-gray-600');
      });
      tab.classList.remove('text-gray-600');
      tab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      
      // Update content within the modal only
      modal.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const targetContent = modal.querySelector('#' + targetTab + 'ImportContent');
      if (targetContent) {
        targetContent.classList.remove('hidden');
        console.log('Showing content:', targetTab + 'ImportContent');
      } else {
        console.error('Content not found:', targetTab + 'ImportContent');
      }
    };
    
    // Add the handler
    tabContainer.addEventListener('click', tabContainer._tabHandler);
    console.log('Prayer import tabs initialized');
  };

  /**
   * Validate JSON input
   */
  PrayerManager.validateJSON = function() {
    const modal = document.getElementById('importModal');
    if (!modal) return;
    
    const jsonInput = modal.querySelector('#jsonInput');
    const validation = modal.querySelector('#jsonValidation');
    
    if (!jsonInput || !validation) return;
    
    try {
      const data = JSON.parse(jsonInput.value);
      
      // Check if it's valid prayer data
      if (Array.isArray(data)) {
        validation.textContent = `✓ Valid JSON with ${data.length} prayers`;
        validation.className = 'text-sm text-green-600';
      } else if (data && typeof data === 'object') {
        validation.textContent = '✓ Valid JSON with 1 prayer';
        validation.className = 'text-sm text-green-600';
      } else {
        throw new Error('Invalid prayer data format');
      }
    } catch (error) {
      validation.textContent = '✗ Invalid JSON: ' + error.message;
      validation.className = 'text-sm text-red-600';
    }
  };

  /**
   * Copy example template
   */
  PrayerManager.copyExample = function() {
    const modal = document.getElementById('importModal');
    if (!modal) return;
    
    const exampleTemplate = modal.querySelector('#exampleTemplate');
    if (!exampleTemplate) {
      console.error('Example template not found');
      return;
    }
    
    const text = exampleTemplate.textContent;
    
    // Fallback for older browsers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        PrayerManager.showMessage('Example copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Clipboard error:', err);
        PrayerManager.showMessage('Failed to copy example', 'error');
      });
    } else {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        PrayerManager.showMessage('Example copied to clipboard!', 'success');
      } catch (err) {
        console.error('Copy error:', err);
        PrayerManager.showMessage('Failed to copy example', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  /**
   * Import prayers from JSON file or text
   */
  PrayerManager.importPrayers = async function() {
    let data;
    
    // Check which tab is active
    const modal = document.getElementById('importModal');
    if (!modal) {
      PrayerManager.showMessage('Import modal not found', 'error');
      return;
    }
    
    const fileTab = modal.querySelector('#fileImportContent');
    const isFileTabActive = fileTab && !fileTab.classList.contains('hidden');
    
    console.log('Import called, file tab active:', isFileTabActive);
    
    if (isFileTabActive) {
      // Import from file
      const fileInput = document.getElementById('importFile');
      const file = fileInput?.files[0];
      
      if (!file) {
        PrayerManager.showMessage('Please select a file to import', 'warning');
        return;
      }
      
      if (!file.name.endsWith('.json')) {
        PrayerManager.showMessage('Please select a valid JSON file', 'error');
        return;
      }
      
      try {
        const text = await file.text();
        data = JSON.parse(text);
      } catch (error) {
        PrayerManager.showMessage('Failed to read file: ' + error.message, 'error');
        return;
      }
    } else {
      // Import from JSON input
      const jsonInput = modal.querySelector('#jsonInput');
      if (!jsonInput || !jsonInput.value.trim()) {
        PrayerManager.showMessage('Please paste JSON data to import', 'warning');
        return;
      }
      
      try {
        data = JSON.parse(jsonInput.value);
      } catch (error) {
        PrayerManager.showMessage('Invalid JSON: ' + error.message, 'error');
        return;
      }
    }
    
    // Normalize data structure
    let prayers;
    if (Array.isArray(data)) {
      prayers = data;
    } else if (data.prayers && Array.isArray(data.prayers)) {
      prayers = data.prayers;
    } else if (data && typeof data === 'object' && data.title) {
      prayers = [data]; // Single prayer object
    } else {
      PrayerManager.showMessage('Invalid prayer data format', 'error');
      return;
    }
    
    if (prayers.length === 0) {
      PrayerManager.showMessage('No prayers found in import data', 'warning');
      return;
    }
    
    // Confirm import
    const confirmMsg = `Import ${prayers.length} prayers? Duplicate titles will be skipped.`;
    if (!confirm(confirmMsg)) {
      return;
    }
    
    // Import prayers
    let imported = 0;
    let skipped = 0;
    
    for (const prayerData of prayers) {
      try {
        // Validate required fields
        if (!prayerData.title || !prayerData.category || !prayerData.content) {
          skipped++;
          continue;
        }
        
        // Check if prayer with same title exists
        const existing = PrayerManager.getAllPrayers().find(p => 
          p.title.toLowerCase() === prayerData.title.toLowerCase()
        );
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Create prayer
        const response = await fetch('/admin/api/prayers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: prayerData.title,
            category: prayerData.category,
            author: prayerData.author || '',
            content: prayerData.content,
            audio_url: prayerData.audio_url || '',
            tags: prayerData.tags || [],
            bible_references: prayerData.bible_references || [],
            metadata: prayerData.metadata || {},
            is_active: prayerData.is_active !== false
          })
        });
        
        if (response.ok) {
          imported++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('Error importing prayer:', error);
        skipped++;
      }
    }
    
    PrayerManager.showMessage(
      `Import complete! Imported: ${imported}, Skipped: ${skipped}`,
      imported > 0 ? 'success' : 'warning'
    );
    
    if (imported > 0) {
      PrayerManager.closeImportModal();
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (error) {
    console.error('Error importing prayers:', error);
    PrayerManager.showMessage('Failed to import prayers: ' + error.message, 'error');
  }
  };

  /**
   * Download sample import template
   */
  PrayerManager.downloadTemplate = function() {
    const template = {
      version: '1.0',
      description: 'Prayer import template file',
      prayers: [
        {
          title: 'Morning Prayer Example',
          category: 'morning',
          author: 'Traditional',
          content: 'Lord, we thank you for this new day...',
          audio_url: '',
          tags: ['morning', 'daily', 'gratitude'],
          is_active: true
        },
        {
          title: 'Evening Prayer Example',
          category: 'evening',
          author: 'Book of Common Prayer',
          content: 'Gracious God, as night falls...',
          audio_url: '',
          tags: ['evening', 'rest', 'peace'],
          is_active: true
        }
      ]
    };
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prayer-import-template.json';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    PrayerManager.showMessage('Template downloaded successfully!', 'success');
  };

  /**
   * Export prayers for specific category
   * @param {string} category - Category to export
   */
  PrayerManager.exportCategory = function(category) {
    const prayers = PrayerManager.getAllPrayers().filter(p => p.category === category);
    
    if (prayers.length === 0) {
      PrayerManager.showMessage(`No ${category} prayers to export`, 'warning');
      return;
    }
    
    // Temporarily update filtered prayers
    const originalFiltered = PrayerManager.getFilteredPrayers();
    PrayerManager.updateFilteredStats(prayers);
    
    // Export
    PrayerManager.exportPrayers();
    
    // Restore original filtered
    PrayerManager.updateFilteredStats(originalFiltered);
  };

  console.log('Prayer Export/Import module loaded successfully');
  
  // Verify functions are attached
  console.log('showImportModal:', typeof PrayerManager.showImportModal);
  console.log('exportPrayers:', typeof PrayerManager.exportPrayers);
  
  } catch (error) {
    console.error('Error loading Prayer Export/Import module:', error);
    console.error('Stack trace:', error.stack);
  }

})(window.PrayerManager);