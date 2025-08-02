/**
 * Prayer Export/Import Module
 * Handles prayer export and import functionality
 */

window.PrayerManager = window.PrayerManager || {};

(function(PrayerManager) {
  'use strict';

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
    
    // Reset file input
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  /**
   * Import prayers from JSON file
   */
  PrayerManager.importPrayers = async function() {
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
      const data = JSON.parse(text);
      
      // Validate structure
      if (!data.prayers || !Array.isArray(data.prayers)) {
        throw new Error('Invalid prayer file format');
      }
      
      // Confirm import
      const confirmMsg = `Import ${data.prayers.length} prayers? Duplicate titles will be skipped.`;
      if (!confirm(confirmMsg)) {
        return;
      }
      
      // Import prayers
      let imported = 0;
      let skipped = 0;
      
      for (const prayerData of data.prayers) {
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

})(window.PrayerManager);