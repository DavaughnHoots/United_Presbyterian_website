/**
 * Prayer Export/Import Module
 * Handles prayer export and import functionality
 */

window.PrayerManager = window.PrayerManager || {};

console.log('Prayer Export/Import module starting...');

(function(PrayerManager) {
  'use strict';
  
  console.log('Inside IIFE, PrayerManager:', PrayerManager);
  
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
   * Generate AI prompt with URL and example JSON
   */
  PrayerManager.generateAIPrompt = function() {
    const urlInput = document.getElementById('aiPromptUrl');
    const promptContainer = document.getElementById('aiPromptContainer');
    const promptText = document.getElementById('aiPromptText');
    const exampleTemplate = document.getElementById('exampleTemplate');
    
    if (!urlInput || !promptContainer || !promptText || !exampleTemplate) return;
    
    const url = urlInput.value.trim();
    if (!url) {
      PrayerManager.showMessage('Please enter a URL first', 'error');
      return;
    }
    
    // Generate the prompt
    const prompt = `I need you to change the following information ${url} & put it in the following JSON format:\n\n${exampleTemplate.textContent}`;
    
    // Display the prompt
    promptText.value = prompt;
    promptContainer.classList.remove('hidden');
    
    // Auto-select the text for easy copying
    promptText.select();
  };

  /**
   * Copy AI prompt to clipboard
   */
  PrayerManager.copyAIPrompt = function() {
    const promptText = document.getElementById('aiPromptText');
    if (!promptText) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText.value).then(() => {
        PrayerManager.showMessage('AI prompt copied to clipboard!', 'success');
      }).catch(() => {
        PrayerManager.showMessage('Failed to copy prompt', 'error');
      });
    } else {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = promptText.value;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        PrayerManager.showMessage('AI prompt copied to clipboard!', 'success');
      } catch (err) {
        PrayerManager.showMessage('Failed to copy prompt', 'error');
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
  };

  /**
   * Download sample import template
   */
  PrayerManager.downloadTemplate = function() {
    const template = {
      version: '1.0',
      description: 'Prayer import template file with examples for all categories',
      prayers: [
        {
          title: 'Morning Prayer of Gratitude',
          content: 'Gracious God,\nWe thank you for the gift of this new day.\nAs the sun rises, may our hearts rise to meet you.\nFill us with your Spirit and guide our steps.\nHelp us to see your presence in all we encounter today.\nIn Jesus\' name we pray,\nAmen.',
          category: 'morning',
          author: 'Traditional Presbyterian',
          tags: ['daily', 'gratitude', 'morning'],
          bible_references: ['Psalm 118:24', 'Lamentations 3:22-23'],
          metadata: {
            tradition: 'Presbyterian',
            usage: 'Daily morning devotion',
            source: 'Book of Common Worship'
          },
          audio_url: '',
          is_active: true
        },
        {
          title: 'Evening Prayer for Rest',
          content: 'Lord God,\nAs evening falls and the day comes to a close,\nwe give you thanks for your faithfulness throughout this day.\nForgive us where we have fallen short,\nand grant us peaceful rest this night.\nWatch over us and all whom we love.\nThrough Christ our Lord,\nAmen.',
          category: 'evening',
          author: 'Book of Common Prayer',
          tags: ['evening', 'rest', 'peace'],
          audio_url: '',
          is_active: true
        },
        {
          title: 'Grace Before Meals',
          content: 'Bless us, O Lord,\nand these thy gifts which we are about to receive\nfrom thy bounty, through Christ our Lord.\nAmen.',
          category: 'meal',
          author: 'Traditional',
          tags: ['blessing', 'food', 'gratitude'],
          is_active: true
        },
        {
          title: 'Prayer for Healing',
          content: 'Loving God, the comfort of all who sorrow,\nthe strength of all who suffer:\nLet your healing presence be with those who are ill.\nGrant them courage when afraid,\npatience when afflicted,\nhope when dejected,\nand when alone, assurance of the support\nof your holy people.\nWe ask this through Christ our Lord.\nAmen.',
          category: 'healing',
          author: 'Presbyterian Church (USA)',
          tags: ['healing', 'comfort', 'strength'],
          bible_references: ['James 5:14-15', 'Psalm 147:3'],
          is_active: true
        },
        {
          title: 'Prayer of Thanksgiving',
          content: 'Almighty God,\nFather of all mercies,\nwe your unworthy servants give you humble thanks\nfor all your goodness and loving-kindness\nto us and to all whom you have made.\nWe bless you for our creation, preservation,\nand all the blessings of this life;\nbut above all for your immeasurable love\nin the redemption of the world by our Lord Jesus Christ;\nfor the means of grace, and for the hope of glory.\nAmen.',
          category: 'thanksgiving',
          author: 'Book of Common Worship',
          tags: ['thanksgiving', 'gratitude', 'praise'],
          is_active: true
        },
        {
          title: 'Prayer of Confession',
          content: 'Merciful God,\nwe confess that we have sinned against you\nin thought, word, and deed,\nby what we have done,\nand by what we have left undone.\nWe have not loved you with our whole heart;\nwe have not loved our neighbors as ourselves.\nWe are truly sorry and we humbly repent.\nFor the sake of your Son Jesus Christ,\nhave mercy on us and forgive us;\nthat we may delight in your will,\nand walk in your ways,\nto the glory of your Name. Amen.',
          category: 'confession',
          author: 'Traditional Reformed',
          tags: ['confession', 'repentance', 'forgiveness'],
          is_active: true
        },
        {
          title: 'Intercessory Prayer for Others',
          content: 'God of compassion,\nwe bring before you those who suffer:\nthe sick and the dying,\nthe lonely and the bereaved,\nthe poor and the oppressed.\nComfort them in their distress,\nstrengthen them in their weakness,\nand deliver them from their troubles.\nGrant wisdom to those who care for them,\nand help us all to show your love\nthrough acts of kindness and mercy.\nThrough Jesus Christ our Lord,\nAmen.',
          category: 'intercession',
          author: 'Contemporary Presbyterian',
          tags: ['intercession', 'compassion', 'service'],
          is_active: true
        },
        {
          title: 'The Lord\'s Prayer',
          content: 'Our Father, who art in heaven,\nhallowed be thy Name,\nthy kingdom come,\nthy will be done,\non earth as it is in heaven.\nGive us this day our daily bread.\nAnd forgive us our debts,\nas we forgive our debtors.\nAnd lead us not into temptation,\nbut deliver us from evil.\nFor thine is the kingdom,\nand the power, and the glory,\nforever. Amen.',
          category: 'traditional',
          author: 'Matthew 6:9-13',
          tags: ['traditional', 'Lord\'s Prayer', 'daily'],
          bible_references: ['Matthew 6:9-13', 'Luke 11:2-4'],
          is_active: true
        },
        {
          title: 'Advent Prayer',
          content: 'Come, Lord Jesus,\nbe our guest and companion on the way.\nBless our Advent journey of preparation.\nOpen our hearts to receive you,\nopen our eyes to see you in others,\nopen our hands to serve you in all we meet.\nCome quickly, Lord Jesus,\nand make all things new.\nAmen.',
          category: 'seasonal',
          author: 'Presbyterian Advent Liturgy',
          tags: ['Advent', 'seasonal', 'preparation'],
          metadata: {
            season: 'Advent',
            usage: 'Weekly during Advent season'
          },
          is_active: true
        },
        {
          title: 'Prayer for Peace',
          content: 'God of all nations and peoples,\nwe pray for peace in our world.\nWhere there is conflict, bring reconciliation.\nWhere there is hatred, sow love.\nWhere there is violence, establish justice.\nHelp us to be instruments of your peace,\nthat all your children may live in safety and freedom.\nWe ask this in the name of the Prince of Peace,\nJesus Christ our Lord.\nAmen.',
          category: 'other',
          author: 'Presbyterian Peace Fellowship',
          tags: ['peace', 'justice', 'world'],
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

  /**
   * Generate AI content based on user input
   */
  PrayerManager.generateAIContent = async function() {
    const modal = document.getElementById('importModal');
    if (!modal) return;
    
    const aiInput = modal.querySelector('#aiInput');
    const aiLoading = modal.querySelector('#aiLoading');
    const aiResultContainer = modal.querySelector('#aiResultContainer');
    const aiGeneratedJson = modal.querySelector('#aiGeneratedJson');
    const aiError = modal.querySelector('#aiError');
    const aiErrorMessage = modal.querySelector('#aiErrorMessage');
    
    if (!aiInput || !aiInput.value.trim()) {
      PrayerManager.showMessage('Please describe the prayer you want to create', 'warning');
      return;
    }
    
    // Hide previous results/errors and show loading
    aiResultContainer.classList.add('hidden');
    aiError.classList.add('hidden');
    aiLoading.classList.remove('hidden');
    
    try {
      const response = await fetch('/admin/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiInput.value.trim(),
          contentType: 'prayer'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }
      
      // Display the generated JSON
      aiGeneratedJson.textContent = JSON.stringify(data.content, null, 2);
      aiResultContainer.classList.remove('hidden');
      
      // Store the generated content for later import
      PrayerManager._aiGeneratedContent = data.content;
      
    } catch (error) {
      console.error('AI generation error:', error);
      aiErrorMessage.textContent = error.message;
      aiError.classList.remove('hidden');
    } finally {
      aiLoading.classList.add('hidden');
    }
  };

  /**
   * Edit AI generated JSON
   */
  PrayerManager.editAIGeneratedJSON = function() {
    const modal = document.getElementById('importModal');
    if (!modal) return;
    
    const aiGeneratedJson = modal.querySelector('#aiGeneratedJson');
    const jsonInput = modal.querySelector('#jsonInput');
    const jsonTab = modal.querySelector('#jsonImportTab');
    
    if (!aiGeneratedJson || !jsonInput || !jsonTab) return;
    
    // Copy the generated JSON to the JSON input tab
    jsonInput.value = aiGeneratedJson.textContent;
    
    // Switch to JSON tab
    jsonTab.click();
  };

  /**
   * Import AI generated content
   */
  PrayerManager.importAIGeneratedContent = async function() {
    if (!PrayerManager._aiGeneratedContent) {
      PrayerManager.showMessage('No AI generated content to import', 'error');
      return;
    }
    
    // Create prayer from the generated content
    try {
      const prayerData = Array.isArray(PrayerManager._aiGeneratedContent) 
        ? PrayerManager._aiGeneratedContent[0] 
        : PrayerManager._aiGeneratedContent;
      
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
        PrayerManager.showMessage('Prayer imported successfully!', 'success');
        PrayerManager.closeImportModal();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import prayer');
      }
    } catch (error) {
      console.error('Import error:', error);
      PrayerManager.showMessage('Failed to import prayer: ' + error.message, 'error');
    }
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

// Ensure functions are available globally as a fallback
if (window.PrayerManager && !window.PrayerManager.showImportModal) {
  console.error('Functions not attached to PrayerManager, attempting manual attachment...');
  
  // Simple versions that should always work
  window.PrayerManager.showImportModal = function() {
    console.log('Fallback showImportModal called');
    const modal = document.getElementById('importModal');
    if (modal) {
      modal.classList.remove('hidden');
    } else {
      console.error('Import modal not found');
    }
  };
  
  window.PrayerManager.exportPrayers = function() {
    console.log('Fallback exportPrayers called');
    alert('Export functionality is temporarily unavailable. Please check the console for errors.');
  };
}