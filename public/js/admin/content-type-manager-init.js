/**
 * Content Type Manager Initialization
 * Simple initialization for content type management
 */

// Set up global object and methods immediately
window.ContentTypeManager = window.ContentTypeManager || {};

// Modal Manager - available immediately
window.ContentTypeManager.ModalManager = {
  openAddModal: function() {
    const contentType = window.ContentTypeManager.getContentType ? window.ContentTypeManager.getContentType() : null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle && contentType) {
      modalTitle.textContent = `Add New ${contentType.name}`;
    }
    const form = document.getElementById('contentForm');
    if (form) form.reset();
    const itemId = document.getElementById('itemId');
    if (itemId) itemId.value = '';
    const modal = document.getElementById('contentModal');
    if (modal) modal.classList.remove('hidden');
  },
  closeModal: function() {
    const modal = document.getElementById('contentModal');
    if (modal) modal.classList.add('hidden');
  },
  closePreview: function() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.classList.add('hidden');
  }
};

// Filter Manager - available immediately
window.ContentTypeManager.FilterManager = {
  filterItems: function() {
    // Will be overridden after initialization
    console.log('Filter items called before initialization');
  },
  sortItems: function() {
    // Will be overridden after initialization
    console.log('Sort items called before initialization');
  },
  resetFilters: function() {
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter) searchFilter.value = '';
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.value = '';
    const seasonFilter = document.getElementById('seasonFilter');
    if (seasonFilter) seasonFilter.value = '';
    const authorFilter = document.getElementById('authorFilter');
    if (authorFilter) authorFilter.value = '';
    const themeFilter = document.getElementById('themeFilter');
    if (themeFilter) themeFilter.value = '';
    // Try to call filter if available
    if (window.ContentTypeManager.FilterManager._filterItems) {
      window.ContentTypeManager.FilterManager._filterItems();
    }
  }
};

// Form Manager - available immediately
window.ContentTypeManager.FormManager = {
  saveItem: function(event) {
    if (event) event.preventDefault();
    if (window.ContentTypeManager.FormManager._saveItem) {
      window.ContentTypeManager.FormManager._saveItem();
    }
  },
  addArrayItem: function(fieldName) {
    const container = document.getElementById(`${fieldName}Container`);
    if (!container) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full px-3 py-2 border rounded-lg';
    input.placeholder = 'Enter item...';
    const wrapper = document.createElement('div');
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  }
};

// Import/Export functions - available immediately
window.ContentTypeManager.showImportModal = function() {
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.remove('hidden');
};

window.ContentTypeManager.closeImportModal = function() {
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.add('hidden');
};

window.ContentTypeManager.importItems = function() {
  const fileInput = document.getElementById('importFile');
  if (fileInput && fileInput.files.length > 0 && window.ContentTypeManager._importItems) {
    window.ContentTypeManager._importItems(fileInput.files[0]);
    window.ContentTypeManager.closeImportModal();
  }
};

window.ContentTypeManager.exportItems = function() {
  if (window.ContentTypeManager._exportItems) {
    window.ContentTypeManager._exportItems();
  }
};

// Initialize when DOM is ready
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Content Type Manager...');
    
    // Get initial data from the page
    const contentDataElement = document.getElementById('initialContentData');
    const contentTypeElement = document.getElementById('contentTypeConfig');
    
    let items = [];
    let contentType = null;
    
    try {
      if (contentDataElement) {
        items = JSON.parse(contentDataElement.textContent || '[]');
      }
      if (contentTypeElement) {
        contentType = JSON.parse(contentTypeElement.textContent || '{}');
      }
    } catch (error) {
      console.error('Error parsing initial data:', error);
    }
    
    if (!contentType || !contentType.dbType) {
      console.error('Content type configuration missing');
      return;
    }
    
    // Initialize the manager
    ContentTypeManager.init(items, contentType);
    
    // Store references to internal functions
    window.ContentTypeManager._importItems = ContentTypeManager.importItems;
    window.ContentTypeManager._exportItems = ContentTypeManager.exportItems;
    window.ContentTypeManager.getContentType = ContentTypeManager.getContentType;
    
    // Set up event listeners using delegation
    setupEventListeners();
    
    // Set up filter and sort functions
    window.ContentTypeManager.FilterManager._filterItems = filterItems;
    window.ContentTypeManager.FilterManager.filterItems = filterItems;
    window.ContentTypeManager.FilterManager.sortItems = sortItems;
    
    // Set up save function
    window.ContentTypeManager.FormManager._saveItem = saveItem;
    
    console.log(`Content Type Manager initialized for ${contentType.name}`);
  });

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Global click handler for all data-action buttons
    document.addEventListener('click', function(e) {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      const action = button.dataset.action;
      
      switch (action) {
        case 'add-new':
          window.ContentTypeManager.ModalManager.openAddModal();
          break;
          
        case 'import':
          window.ContentTypeManager.showImportModal();
          break;
          
        case 'export':
          window.ContentTypeManager.exportItems();
          break;
          
        case 'import-confirm':
          importFromCurrentTab();
          break;
          
        case 'validate-json':
          validateJsonInput();
          break;
          
        case 'copy-example':
          copyExampleTemplate();
          break;
          
        case 'reset-filters':
          window.ContentTypeManager.FilterManager.resetFilters();
          break;
          
        case 'close-modal':
          const modalId = button.dataset.modal;
          const modal = document.getElementById(modalId);
          if (modal) modal.classList.add('hidden');
          break;
          
        case 'add-array-item':
          const fieldName = button.dataset.field;
          window.ContentTypeManager.FormManager.addArrayItem(fieldName);
          break;
          
        case 'preview':
          showPreview(button.dataset.itemId);
          break;
          
        case 'edit':
          editItem(button.dataset.itemId);
          break;
          
        case 'toggle':
          const isActive = button.dataset.isActive === 'true';
          ContentTypeManager.toggleItemStatus(button.dataset.itemId, isActive);
          break;
          
        case 'delete':
          ContentTypeManager.deleteItem(button.dataset.itemId);
          break;
      }
    });
    
    // Tab switching in import modal
    document.addEventListener('click', function(e) {
      if (e.target.matches('[data-tab]')) {
        const tab = e.target.dataset.tab;
        showImportTab(tab);
      }
    });
    
    // Form submission
    const form = document.getElementById('contentForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
      });
    }
    
    // Filter handlers using event delegation
    document.addEventListener('change', function(e) {
      if (e.target.matches('[data-filter]')) {
        filterItems();
      } else if (e.target.matches('[data-action="sort"]')) {
        sortItems();
      }
    });
    
    document.addEventListener('keyup', function(e) {
      if (e.target.matches('[data-filter]')) {
        filterItems();
      }
    });
    
    // Import file handler
    const importFile = document.getElementById('importFile');
    if (importFile) {
      importFile.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          ContentTypeManager.importItems(e.target.files[0]);
        }
      });
    }
  }

  /**
   * Show item preview
   */
  function showPreview(itemId) {
    const item = ContentTypeManager.getItemById(itemId);
    const contentType = ContentTypeManager.getContentType();
    
    if (!item) return;
    
    const modal = document.getElementById('previewModal');
    const content = document.getElementById('previewContent');
    
    // Build preview HTML based on content type
    let html = `
      <div class="space-y-4">
        <h3 class="text-2xl font-bold">${item.title}</h3>
    `;
    
    if (item.biblePassage) {
      html += `<p class="text-gray-600"><i class="fas fa-bible mr-2"></i>${item.biblePassage}</p>`;
    }
    
    if (item.author || item.artist) {
      html += `<p class="text-gray-600"><i class="fas fa-user mr-2"></i>${item.author || item.artist}</p>`;
    }
    
    if (item.category) {
      html += `<span class="inline-block px-3 py-1 bg-${contentType.color}-100 text-${contentType.color}-700 rounded-full text-sm">${item.category}</span>`;
    }
    
    if (item.content) {
      html += `<div class="prose max-w-none"><p style="white-space: pre-line;">${item.content}</p></div>`;
    }
    
    if (item.instructions) {
      html += `<div class="bg-blue-50 p-4 rounded"><h4 class="font-semibold mb-2">Instructions</h4><p>${item.instructions}</p></div>`;
    }
    
    if (item.prompts && item.prompts.length > 0) {
      html += `<div><h4 class="font-semibold mb-2">Questions/Prompts</h4><ol class="list-decimal list-inside space-y-2">`;
      item.prompts.forEach(prompt => {
        html += `<li>${prompt}</li>`;
      });
      html += `</ol></div>`;
    }
    
    if (item.video_url || item.youtubeId) {
      html += `<div class="text-center"><a href="${item.video_url || `https://youtube.com/watch?v=${item.youtubeId}`}" target="_blank" class="text-blue-600 hover:underline"><i class="fas fa-video mr-2"></i>Watch Video</a></div>`;
    }
    
    if (item.image_url) {
      html += `<div class="text-center"><img src="${item.image_url}" alt="${item.title}" class="max-w-full rounded"></div>`;
    }
    
    if (item.audio_url) {
      html += `<div class="text-center"><audio controls class="w-full"><source src="${item.audio_url}" type="audio/mpeg">Your browser does not support audio.</audio></div>`;
    }
    
    html += '</div>';
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
  }

  /**
   * Edit item
   */
  function editItem(itemId) {
    const item = ContentTypeManager.getItemById(itemId);
    const contentType = ContentTypeManager.getContentType();
    
    if (!item) return;
    
    // Set modal title
    document.getElementById('modalTitle').textContent = `Edit ${contentType.name}`;
    
    // Populate form fields
    document.getElementById('itemId').value = item.id;
    
    // Populate dynamic fields
    Object.entries(contentType.fields).forEach(([fieldName, field]) => {
      const element = document.getElementById(fieldName);
      if (element) {
        if (field.type === 'array') {
          // Handle array fields - populate existing values
          if (item[fieldName] && Array.isArray(item[fieldName])) {
            const container = document.getElementById(`${fieldName}Container`);
            if (container) {
              container.innerHTML = ''; // Clear existing
              item[fieldName].forEach(value => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'w-full px-3 py-2 border rounded-lg mb-2';
                input.value = value;
                const wrapper = document.createElement('div');
                wrapper.appendChild(input);
                container.appendChild(wrapper);
              });
            }
          }
        } else {
          // Check if it's a metadata field
          if (field.metadata && item.metadata && item.metadata[fieldName]) {
            element.value = item.metadata[fieldName];
          } else {
            element.value = item[fieldName] || '';
          }
        }
      }
    });
    
    // Set category
    const categorySelect = document.getElementById('itemCategory');
    if (categorySelect) {
      categorySelect.value = item.category || '';
    }
    
    // Set active status
    document.getElementById('itemIsActive').checked = item.is_active;
    
    // Show modal
    document.getElementById('contentModal').classList.remove('hidden');
  }

  /**
   * Save item
   */
  async function saveItem() {
    const form = document.getElementById('contentForm');
    const formData = new FormData(form);
    const contentType = ContentTypeManager.getContentType();
    
    const itemData = {
      id: formData.get('id') || undefined,
      type: contentType.dbType,
      is_active: formData.get('is_active') === 'on',
      metadata: {}
    };
    
    // Process form fields
    Object.entries(contentType.fields).forEach(([fieldName, field]) => {
      const value = formData.get(fieldName);
      
      if (field.type === 'array') {
        // Handle array fields
        const arrayItems = [];
        const container = document.getElementById(`${fieldName}Container`);
        if (container) {
          container.querySelectorAll('input, textarea').forEach(input => {
            if (input.value.trim()) {
              arrayItems.push(input.value.trim());
            }
          });
        }
        itemData[fieldName] = arrayItems;
      } else if (field.metadata) {
        // Store in metadata
        itemData.metadata[fieldName] = value || null;
      } else {
        // Regular field
        itemData[fieldName] = value || null;
      }
    });
    
    // Add category to metadata
    itemData.metadata.category = formData.get('category');
    
    try {
      await ContentTypeManager.saveItem(itemData);
      document.getElementById('contentModal').classList.add('hidden');
      form.reset();
    } catch (error) {
      // Error already handled in core
    }
  }

  /**
   * Filter items
   */
  function filterItems() {
    const searchTerm = (document.getElementById('searchFilter')?.value || '').toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const seasonFilter = document.getElementById('seasonFilter')?.value || '';
    const authorFilter = (document.getElementById('authorFilter')?.value || '').toLowerCase();
    const themeFilter = (document.getElementById('themeFilter')?.value || '').toLowerCase();
    
    const itemCards = document.querySelectorAll('.item-card');
    let visibleCount = 0;
    
    itemCards.forEach(card => {
      const title = card.dataset.title || '';
      const category = card.dataset.category || '';
      const season = card.dataset.season || '';
      const author = card.dataset.author || '';
      const theme = card.dataset.theme || '';
      
      const matchesSearch = !searchTerm || title.includes(searchTerm) || author.includes(searchTerm);
      const matchesCategory = !categoryFilter || category === categoryFilter;
      const matchesSeason = !seasonFilter || season === seasonFilter;
      const matchesAuthor = !authorFilter || author.includes(authorFilter);
      const matchesTheme = !themeFilter || theme.includes(themeFilter);
      
      if (matchesSearch && matchesCategory && matchesSeason && matchesAuthor && matchesTheme) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Update count
    document.getElementById('filteredCount').textContent = visibleCount;
    
    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    const itemList = document.getElementById('itemList');
    
    if (visibleCount === 0 && ContentTypeManager.getAllItems().length > 0) {
      itemList.style.display = 'none';
      emptyState.style.display = '';
    } else {
      itemList.style.display = '';
      emptyState.style.display = 'none';
    }
  }

  /**
   * Sort items
   */
  function sortItems() {
    const sortBy = document.getElementById('sortBy').value;
    const itemList = document.getElementById('itemList');
    const items = Array.from(itemList.querySelectorAll('.item-card'));
    
    items.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.dataset.title.localeCompare(b.dataset.title);
        case 'category':
          return (a.dataset.category || '').localeCompare(b.dataset.category || '');
        case 'author':
          return (a.dataset.author || '').localeCompare(b.dataset.author || '');
        case 'recent':
          // Assuming items are in creation order
          return items.indexOf(b) - items.indexOf(a);
        case 'usage':
          // This would need usage data
          return 0;
        default:
          return 0;
      }
    });
    
    // Reorder DOM
    items.forEach(item => itemList.appendChild(item));
  }

  /**
   * Show specific tab in import modal
   */
  function showImportTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.remove('text-gray-600');
      } else {
        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-600');
      }
    });
    
    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    const contentMap = {
      'file': 'fileImportContent',
      'json': 'jsonImportContent',
      'example': 'exampleContent'
    };
    
    const contentId = contentMap[tabName];
    if (contentId) {
      document.getElementById(contentId)?.classList.remove('hidden');
    }
  }

  /**
   * Generate example template for current content type
   */
  function generateExampleTemplate() {
    const contentType = ContentTypeManager.getContentType();
    if (!contentType) return;
    
    // Build example based on content type
    const example = {
      title: `Example ${contentType.name}`,
      content: 'This is the main content for your ' + contentType.name.toLowerCase(),
      category: contentType.categories[0].toLowerCase(),
      tags: ['example', 'template', contentType.name.toLowerCase()],
      is_active: true
    };
    
    // Add type-specific fields
    if (contentType.dbType === 'hymn') {
      example.artist = 'Composer Name';
      example.youtubeId = 'dQw4w9WgXcQ';
      example.audio_url = 'https://example.com/audio.mp3';
      example.theme = 'Praise & Worship';
      example.season = 'general';
      example.metadata = {
        composer: 'Composer Full Name',
        tune: 'Tune Name',
        meter: '8.8.8.8',
        hymnalNumber: 'GTG 123'
      };
    } else if (contentType.dbType === 'scripture_reading') {
      example.biblePassage = 'John 3:16-17';
      example.theme = 'God\'s Love';
      example.season = 'ordinary time';
    } else if (contentType.dbType === 'guided_prayer') {
      example.instructions = 'Begin by finding a quiet place...';
      example.duration_minutes = 10;
      example.prompts = ['Reflect on...', 'Consider how...', 'Pray for...'];
    } else if (contentType.dbType === 'journaling_prompt') {
      example.prompts = [
        'What are you grateful for today?',
        'How did you see God working in your life?',
        'What challenges did you face?'
      ];
      example.duration_minutes = 15;
    } else if (contentType.dbType === 'artwork') {
      example.artist = 'Artist Name';
      example.image_url = 'https://example.com/artwork.jpg';
      example.metadata = {
        medium: 'Oil on canvas',
        year: '2024',
        scripture_reference: 'Psalm 23'
      };
    } else if (contentType.dbType === 'video') {
      example.video_url = 'https://youtube.com/watch?v=example';
      example.duration_minutes = 5;
      example.metadata = {
        speaker: 'Speaker Name',
        transcript: 'Video transcript goes here...'
      };
    } else if (contentType.dbType === 'creed') {
      example.metadata = {
        origin: 'Historical origin information',
        usage: 'When this creed is typically used',
        denomination: 'Presbyterian'
      };
    } else if (contentType.dbType === 'reflection') {
      example.metadata = {
        author: 'Author Name',
        scripture_reference: 'Matthew 5:1-12',
        discussion_questions: [
          'What does this mean to you?',
          'How can you apply this?'
        ]
      };
    } else if (contentType.dbType === 'historical_context') {
      example.image_url = 'https://example.com/historical-image.jpg';
      example.theme = 'Faith & Perseverance';
      example.metadata = {
        time_period: '1873',
        location: 'Chicago, Illinois',
        figure: 'Horatio Spafford',
        related_hymn: 'It Is Well With My Soul',
        biblical_reference: 'Luke 8:22-25',
        questions: [
          'How does this historical context deepen your understanding of the hymn?',
          'What can we learn from this story about trusting God in difficult times?',
          'How might this story encourage someone facing loss today?'
        ]
      };
    } else if (contentType.dbType === 'interactive_map') {
      example.map_url = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d215489.5736121651!2d35.3547534!3d32.8191218!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151c65816c2e0f3d%3A0x54dac12b30f0c6e2!2sSea%20of%20Galilee!5e0!3m2!1sen!2sus!4v1234567890123';
      example.theme = 'Miracles of Jesus';
      example.metadata = {
        region: 'Israel/Palestine',
        biblical_period: 'New Testament',
        biblical_events: 'Jesus walks on water, Calming of the storm, Miraculous catch of fish',
        locations: [
          {
            name: 'Capernaum',
            description: 'Jesus\' base of operations during his Galilean ministry',
            coordinates: '32.8806° N, 35.5753° E'
          },
          {
            name: 'Mount of Beatitudes',
            description: 'Traditional site of the Sermon on the Mount',
            coordinates: '32.8824° N, 35.5572° E'
          },
          {
            name: 'Tabgha',
            description: 'Site of the multiplication of loaves and fishes',
            coordinates: '32.8739° N, 35.5489° E'
          }
        ]
      };
    }
    
    // Display the example
    const exampleElement = document.getElementById('exampleTemplate');
    if (exampleElement) {
      exampleElement.textContent = JSON.stringify([example], null, 2);
    }
  }

  /**
   * Validate JSON input
   */
  function validateJsonInput() {
    const jsonInput = document.getElementById('jsonInput');
    const validation = document.getElementById('jsonValidation');
    
    if (!jsonInput || !validation) return;
    
    try {
      const data = JSON.parse(jsonInput.value);
      validation.textContent = '✓ Valid JSON';
      validation.className = 'text-sm text-green-600';
      
      // Additional validation
      const items = Array.isArray(data) ? data : [data];
      if (items.length === 0) {
        throw new Error('No items found');
      }
      
      // Check for required fields
      items.forEach((item, index) => {
        if (!item.title) {
          throw new Error(`Item ${index + 1} is missing required field: title`);
        }
      });
      
      validation.textContent = `✓ Valid JSON with ${items.length} item(s)`;
    } catch (error) {
      validation.textContent = '✗ ' + error.message;
      validation.className = 'text-sm text-red-600';
    }
  }

  /**
   * Copy example template to clipboard
   */
  function copyExampleTemplate() {
    const exampleElement = document.getElementById('exampleTemplate');
    if (!exampleElement) return;
    
    navigator.clipboard.writeText(exampleElement.textContent).then(() => {
      ContentTypeManager.showToast('Example copied to clipboard!');
    }).catch(() => {
      ContentTypeManager.showToast('Failed to copy example', 'error');
    });
  }

  /**
   * Import from current active tab
   */
  function importFromCurrentTab() {
    // Check which tab is active
    const activeTab = document.querySelector('[data-tab].text-blue-600');
    if (!activeTab) return;
    
    const tabName = activeTab.dataset.tab;
    
    if (tabName === 'file') {
      // Original file import
      window.ContentTypeManager.importItems();
    } else if (tabName === 'json') {
      // Import from JSON input
      importFromJsonInput();
    }
  }

  /**
   * Import from JSON input textarea
   */
  async function importFromJsonInput() {
    const jsonInput = document.getElementById('jsonInput');
    if (!jsonInput || !jsonInput.value.trim()) {
      ContentTypeManager.showToast('Please enter JSON data', 'error');
      return;
    }
    
    try {
      const data = JSON.parse(jsonInput.value);
      const items = Array.isArray(data) ? data : [data];
      
      // Create a fake file object for the existing import function
      const blob = new Blob([JSON.stringify(items)], { type: 'application/json' });
      const file = new File([blob], 'import.json', { type: 'application/json' });
      
      // Use existing import function
      if (window.ContentTypeManager._importItems) {
        await window.ContentTypeManager._importItems(file);
        window.ContentTypeManager.closeImportModal();
      }
    } catch (error) {
      ContentTypeManager.showToast('Invalid JSON: ' + error.message, 'error');
    }
  }

  // Update the showImportModal function
  const originalShowImportModal = window.ContentTypeManager.showImportModal;
  window.ContentTypeManager.showImportModal = function() {
    originalShowImportModal();
    generateExampleTemplate();
    showImportTab('file');
  };

})();