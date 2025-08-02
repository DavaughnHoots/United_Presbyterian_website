/**
 * Journey Content Picker Module
 * Handles content selection modal and content management
 */

window.JourneyEditor = window.JourneyEditor || {};
JourneyEditor.ContentPicker = {};

(function(ContentPicker) {
  'use strict';

  // Private variables
  let currentDayForContent = null;
  let selectedContent = null;
  let currentContentTab = 'bible';
  let editingContentIndex = -1;

  /**
   * Open content picker modal
   * @param {Object} day - Day object to add content to
   */
  ContentPicker.open = function(day) {
    currentDayForContent = day;
    editingContentIndex = -1;
    
    resetContentPicker();
    
    // Load initial data
    if (JourneyEditor.BibleSelector) {
      JourneyEditor.BibleSelector.loadBibleBooks();
    }
    loadCreeds();
    
    // Show modal
    document.getElementById('contentPickerModal').style.display = 'flex';
  };

  /**
   * Edit existing content item
   * @param {number} index - Content index in day
   */
  ContentPicker.editContentItem = function(index) {
    const day = JourneyEditor.getCurrentEditingDay();
    if (!day || !day.contents || !day.contents[index]) {
      JourneyEditor.showMessage('Content not found', 'error');
      return;
    }
    
    currentDayForContent = day;
    editingContentIndex = index;
    
    const content = day.contents[index];
    
    resetContentPicker();
    
    // Set duration
    document.getElementById('contentDuration').value = content.duration_minutes || 5;
    
    // Switch to appropriate tab based on type
    const type = content.type || content.content_type;
    let tabName = mapContentTypeToTab(type);
    
    switchToTab(tabName);
    
    // Load content data based on type
    if (type === 'bible_verse' && JourneyEditor.BibleSelector) {
      JourneyEditor.BibleSelector.loadFromContentId(content.content_id);
    } else {
      // For library content, just store the selection
      selectedContent = content;
    }
    
    // Load initial data
    if (JourneyEditor.BibleSelector) {
      JourneyEditor.BibleSelector.loadBibleBooks();
    }
    loadCreeds();
    
    // Show modal
    document.getElementById('contentPickerModal').style.display = 'flex';
  };

  /**
   * Close content picker modal
   */
  ContentPicker.close = function() {
    document.getElementById('contentPickerModal').style.display = 'none';
    selectedContent = null;
    currentDayForContent = null;
    editingContentIndex = -1;
  };

  /**
   * Switch content tabs
   * @param {string} tabName - Tab to switch to
   */
  ContentPicker.switchTab = function(tabName) {
    currentContentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const clickedBtn = event.target;
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Show selected tab
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
      tabContent.style.display = 'block';
    }
    
    // Load content for the tab
    if (JourneyEditor.ContentLibrary) {
      JourneyEditor.ContentLibrary.searchContent(tabName);
    }
  };

  /**
   * Save selected content
   */
  ContentPicker.saveSelectedContent = function() {
    // Check if Bible verse is selected
    if (currentContentTab === 'bible' && JourneyEditor.BibleSelector) {
      selectedContent = JourneyEditor.BibleSelector.getSelectedContent();
    }
    
    if (!selectedContent) {
      JourneyEditor.showMessage('Please select content from the library', 'error');
      return;
    }
    
    // Add duration to content
    const duration = document.getElementById('contentDuration').value;
    const contentItem = {
      ...selectedContent,
      duration_minutes: parseInt(duration) || 5,
      order_index: editingContentIndex >= 0 ? editingContentIndex : (currentDayForContent.contents ? currentDayForContent.contents.length : 0)
    };
    
    if (!currentDayForContent.contents) {
      currentDayForContent.contents = [];
    }
    
    if (editingContentIndex >= 0) {
      // Update existing content
      currentDayForContent.contents[editingContentIndex] = contentItem;
    } else {
      // Add new content
      currentDayForContent.contents.push(contentItem);
    }
    
    // Mark as dirty and refresh display
    JourneyEditor.markDirty();
    JourneyEditor.refreshDayDisplay();
    
    // Close picker
    ContentPicker.close();
  };

  /**
   * Set selected content from library
   * @param {Object} item - Content item from library
   */
  ContentPicker.selectLibraryContent = function(item) {
    // Update selection UI
    document.querySelectorAll('.content-list-item').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Find and select the clicked element
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('selected');
    }
    
    // Store selected content
    selectedContent = {
      type: item.type,
      id: item.id,
      title: item.title,
      content: item.content,
      biblePassage: item.biblePassage,
      artist: item.artist,
      image_url: item.image_url,
      video_url: item.video_url,
      audio_url: item.audio_url,
      youtubeId: item.youtubeId,
      instructions: item.instructions,
      prompts: item.prompts,
      metadata: item.metadata || {},
      duration_minutes: item.duration_minutes || 5
    };
    
    // Update duration input
    document.getElementById('contentDuration').value = item.duration_minutes || 5;
  };

  /**
   * Reset content picker to initial state
   */
  function resetContentPicker() {
    // Clear selected content
    selectedContent = null;
    
    // Remove selected state from all items
    document.querySelectorAll('.content-list-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Reset to first tab
    currentContentTab = 'bible';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const firstTab = document.querySelector('.tab-btn');
    if (firstTab) {
      firstTab.classList.add('active');
    }
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const bibleTab = document.getElementById('bibleTab');
    if (bibleTab) {
      bibleTab.style.display = 'block';
    }
    
    // Reset duration
    document.getElementById('contentDuration').value = 5;
    
    // Reset Bible selector if available
    if (JourneyEditor.BibleSelector) {
      JourneyEditor.BibleSelector.reset();
    }
    
    // Clear all search inputs
    document.querySelectorAll('.search-bar input').forEach(input => {
      input.value = '';
    });
  }

  /**
   * Switch to a specific tab programmatically
   * @param {string} tabName - Tab to switch to
   */
  function switchToTab(tabName) {
    currentContentTab = tabName;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      // Find button by checking its text content
      const btnText = btn.textContent.toLowerCase();
      if (btnText.includes(tabName.replace('_', ' '))) {
        btn.classList.add('active');
      }
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
      tabContent.style.display = 'block';
    }
  }

  /**
   * Map content type to tab name
   * @param {string} type - Content type
   * @returns {string} Tab name
   */
  function mapContentTypeToTab(type) {
    const mapping = {
      'scripture_reading': 'scripture_reading',
      'journaling_prompt': 'journaling',
      'guided_prayer': 'guided_prayer',
      'bible_verse': 'bible',
      'prayer': 'prayer',
      'hymn': 'hymn',
      'artwork': 'artwork',
      'video': 'video',
      'reflection': 'reflection',
      'creed': 'creed'
    };
    
    return mapping[type] || type;
  }

  /**
   * Load standard creeds
   */
  function loadCreeds() {
    const creeds = [
      { id: 'apostles', title: "Apostles' Creed" },
      { id: 'nicene', title: "Nicene Creed" },
      { id: 'athanasian', title: "Athanasian Creed" }
    ];
    
    const listEl = document.getElementById('creedList');
    if (listEl) {
      listEl.innerHTML = creeds.map(creed => `
        <div class="content-list-item" onclick="JourneyEditor.ContentPicker.selectLibraryContent({type: 'creed', id: '${creed.id}', title: '${creed.title}', duration_minutes: 5})">
          <h5>${creed.title}</h5>
        </div>
      `).join('');
    }
  }

  // Expose functions globally
  window.JourneyEditor.ContentPicker = ContentPicker;

})(JourneyEditor.ContentPicker);