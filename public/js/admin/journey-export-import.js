/**
 * Journey Export/Import Module
 * Handles journey export and import functionality
 */

window.JourneyEditor = window.JourneyEditor || {};
JourneyEditor.ExportImport = {};

(function(ExportImport) {
  'use strict';

  /**
   * Export journey to JSON file
   */
  ExportImport.exportJourney = async function() {
    try {
      const journeyDays = JourneyEditor.getDays();
      
      // Prepare export data
      const exportData = {
        journey: {
          title: document.getElementById('journeyTitle').value,
          description: document.getElementById('journeyDescription').value,
          duration_days: journeyDays.length,
          theme: document.getElementById('journeyTheme').value,
          is_published: document.getElementById('journeyStatus').value === 'true',
          exported_at: new Date().toISOString(),
          version: '1.0'
        },
        days: journeyDays.map(day => ({
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          content: (day.contents || []).map((content, index) => {
            const contentData = {
              type: content.content_type || content.type,
              title: content.title || content.metadata?.title || 'Untitled',
              content: content.content || content.metadata?.content || '',
              order_index: index + 1,
              duration_minutes: content.duration_minutes || 5
            };
            
            // Add type-specific fields
            if (content.biblePassage) contentData.biblePassage = content.biblePassage;
            if (content.youtubeId) contentData.youtubeId = content.youtubeId;
            if (content.artist) contentData.artist = content.artist;
            if (content.image_url) contentData.image_url = content.image_url;
            if (content.video_url) contentData.video_url = content.video_url;
            if (content.audio_url) contentData.audio_url = content.audio_url;
            if (content.instructions) contentData.instructions = content.instructions;
            if (content.prompts) contentData.prompts = content.prompts;
            if (content.theme) contentData.theme = content.theme;
            
            // Include metadata
            if (content.metadata) {
              contentData.metadata = content.metadata;
            }
            
            return contentData;
          })
        }))
      };
      
      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const filename = `journey-${exportData.journey.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      JourneyEditor.showMessage('Journey exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting journey:', error);
      JourneyEditor.showMessage('Failed to export journey: ' + error.message, 'error');
    }
  };

  /**
   * Import journey from JSON file
   * @param {File} file - File to import
   */
  ExportImport.importJourney = async function(file) {
    if (!file) {
      JourneyEditor.showMessage('Please select a file to import', 'warning');
      return;
    }
    
    if (!file.name.endsWith('.json')) {
      JourneyEditor.showMessage('Please select a valid JSON file', 'error');
      return;
    }
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate structure
      if (!data.journey || !data.days) {
        throw new Error('Invalid journey file format');
      }
      
      // Confirm import
      const confirmMsg = `Import journey "${data.journey.title}" with ${data.days.length} days? This will replace the current journey.`;
      if (!confirm(confirmMsg)) {
        return;
      }
      
      // Import journey data
      await importJourneyData(data);
      
      JourneyEditor.showMessage('Journey imported successfully!', 'success');
      
      // Reload page to show imported data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error importing journey:', error);
      JourneyEditor.showMessage('Failed to import journey: ' + error.message, 'error');
    }
  };

  /**
   * Import journey data to server
   * @param {Object} data - Journey data to import
   */
  async function importJourneyData(data) {
    // First, create or update the journey
    const journeyResponse = await fetch('/admin/api/journeys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: data.journey.title,
        description: data.journey.description,
        theme: data.journey.theme,
        is_published: false, // Always import as draft
        duration_days: data.days.length
      })
    });
    
    if (!journeyResponse.ok) {
      throw new Error('Failed to create journey');
    }
    
    const journey = await journeyResponse.json();
    const journeyId = journey.id;
    
    // Import each day
    for (const day of data.days) {
      const dayResponse = await fetch(`/admin/api/journeys/${journeyId}/days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dayNumber: day.day_number,
          title: day.title,
          description: day.description,
          contents: day.content || []
        })
      });
      
      if (!dayResponse.ok) {
        throw new Error(`Failed to import day ${day.day_number}`);
      }
    }
  }

  /**
   * Create file input for import
   */
  ExportImport.createImportButton = function() {
    // Check if import input already exists
    if (document.getElementById('journeyImportInput')) {
      return;
    }
    
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'journeyImportInput';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        ExportImport.importJourney(file);
      }
      // Reset input
      fileInput.value = '';
    });
    
    document.body.appendChild(fileInput);
    
    // Create import button if it doesn't exist
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('importButton')) {
      const importButton = document.createElement('button');
      importButton.id = 'importButton';
      importButton.className = 'btn btn-secondary';
      importButton.innerHTML = '<i class="fas fa-file-import"></i> Import';
      importButton.onclick = function() {
        fileInput.click();
      };
      
      // Insert before export button
      const exportButton = headerActions.querySelector('[onclick*="export"]');
      if (exportButton) {
        headerActions.insertBefore(importButton, exportButton);
      }
    }
  };

  /**
   * Download sample journey template
   */
  ExportImport.downloadTemplate = function() {
    const template = {
      journey: {
        title: "Sample Journey",
        description: "This is a sample journey template",
        duration_days: 3,
        theme: "general",
        is_published: false
      },
      days: [
        {
          day_number: 1,
          title: "Day 1: Beginning",
          description: "Start your journey",
          content: [
            {
              type: "scripture_reading",
              title: "Opening Scripture",
              content: "In the beginning God created the heavens and the earth.",
              biblePassage: "Genesis 1:1",
              duration_minutes: 5,
              order_index: 1
            },
            {
              type: "prayer",
              title: "Morning Prayer",
              content: "Lord, help us to begin this journey with open hearts...",
              duration_minutes: 3,
              order_index: 2
            }
          ]
        },
        {
          day_number: 2,
          title: "Day 2: Reflection",
          description: "Reflect on your path",
          content: [
            {
              type: "journaling_prompt",
              title: "Daily Reflection",
              content: "What has God shown you so far?",
              prompts: ["How do you see God working in your life?", "What are you grateful for today?"],
              duration_minutes: 10,
              order_index: 1
            }
          ]
        },
        {
          day_number: 3,
          title: "Day 3: Moving Forward",
          description: "Continue with renewed purpose",
          content: [
            {
              type: "hymn",
              title: "Amazing Grace",
              content: "Amazing grace, how sweet the sound...",
              artist: "John Newton",
              duration_minutes: 4,
              order_index: 1
            }
          ]
        }
      ]
    };
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'journey-template.json';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    JourneyEditor.showMessage('Template downloaded successfully!', 'success');
  };

  // Expose functions globally
  window.JourneyEditor.ExportImport = ExportImport;

})(JourneyEditor.ExportImport);