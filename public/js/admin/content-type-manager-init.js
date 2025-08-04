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
    
    if (fieldName === 'locations') {
      // Special handling for locations
      const div = document.createElement('div');
      div.className = 'border p-3 rounded-lg mb-2';
      div.innerHTML = `
        <input type="text" placeholder="Location name" class="w-full px-3 py-2 border rounded-lg mb-2" data-field="name">
        <textarea placeholder="Description" class="w-full px-3 py-2 border rounded-lg mb-2" rows="2" data-field="description"></textarea>
        <input type="text" placeholder="Coordinates (optional)" class="w-full px-3 py-2 border rounded-lg" data-field="coordinates">
      `;
      container.appendChild(div);
    } else {
      // Regular array item
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'w-full px-3 py-2 border rounded-lg';
      input.placeholder = 'Enter item...';
      const wrapper = document.createElement('div');
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    }
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
          
        case 'generate-ai-prompt':
          generateAIPrompt();
          break;
          
        case 'copy-ai-prompt':
          copyAIPrompt();
          break;
          
        case 'ai-generate':
          generateAIContent();
          break;
          
        case 'ai-edit':
          editAIGeneratedJSON();
          break;
          
        case 'ai-import':
          importAIGeneratedContent();
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
    
    // Handle Interactive Map
    if (contentType.dbType === 'interactive_map' && item.map_url) {
      html += `<div class="mt-4"><iframe src="${item.map_url}" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
      
      if (item.metadata) {
        if (item.metadata.region || item.metadata.biblical_period || item.metadata.biblical_events) {
          html += '<div class="mt-4 space-y-2">';
          if (item.metadata.region) {
            html += `<p><strong>Region:</strong> ${item.metadata.region}</p>`;
          }
          if (item.metadata.biblical_period) {
            html += `<p><strong>Biblical Period:</strong> ${item.metadata.biblical_period}</p>`;
          }
          if (item.metadata.biblical_events) {
            html += `<p><strong>Biblical Events:</strong> ${item.metadata.biblical_events}</p>`;
          }
          html += '</div>';
        }
        
        if (item.metadata.locations && item.metadata.locations.length > 0) {
          html += '<div class="mt-4"><h4 class="font-semibold mb-2">Locations:</h4><ul class="space-y-2">';
          item.metadata.locations.forEach(location => {
            if (typeof location === 'object') {
              html += `<li><strong>${location.name}</strong>: ${location.description}`;
              if (location.coordinates) {
                html += ` <em>(${location.coordinates})</em>`;
              }
              html += '</li>';
            } else {
              html += `<li>${location}</li>`;
            }
          });
          html += '</ul></div>';
        }
      }
    }
    
    // Handle Historical Context
    if (contentType.dbType === 'historical_context' && item.metadata) {
      html += '<div class="mt-4 space-y-2">';
      if (item.metadata.time_period) {
        html += `<p><strong>Time Period:</strong> ${item.metadata.time_period}</p>`;
      }
      if (item.metadata.location) {
        html += `<p><strong>Location:</strong> ${item.metadata.location}</p>`;
      }
      if (item.metadata.figure) {
        html += `<p><strong>Historical Figure:</strong> ${item.metadata.figure}</p>`;
      }
      if (item.metadata.related_hymn) {
        html += `<p><strong>Related Hymn:</strong> ${item.metadata.related_hymn}</p>`;
      }
      if (item.metadata.biblical_reference) {
        html += `<p><strong>Biblical Reference:</strong> ${item.metadata.biblical_reference}</p>`;
      }
      html += '</div>';
      
      if (item.metadata.questions && item.metadata.questions.length > 0) {
        html += '<div class="mt-4"><h4 class="font-semibold mb-2">Reflection Questions:</h4><ol class="list-decimal list-inside space-y-2">';
        item.metadata.questions.forEach(question => {
          html += `<li>${question}</li>`;
        });
        html += '</ol></div>';
      }
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
    
    console.log('Editing item:', item);
    console.log('Content type:', contentType);
    
    // Set modal title
    document.getElementById('modalTitle').textContent = `Edit ${contentType.name}`;
    
    // Populate form fields
    document.getElementById('itemId').value = item.id;
    
    // Populate dynamic fields
    Object.entries(contentType.fields).forEach(([fieldName, field]) => {
      const element = document.getElementById(fieldName);
      if (element) {
        console.log(`Processing field ${fieldName}:`, field);
        console.log(`Element found: ${element.tagName}, type: ${element.type || 'N/A'}`);
        console.log(`Field metadata flag: ${field.metadata}`);
        console.log(`Item value: ${item[fieldName]}`);
        console.log(`Item metadata value: ${item.metadata ? item.metadata[fieldName] : 'No metadata'}`);
        
        if (field.type === 'array') {
          // Handle array fields - populate existing values
          let arrayData = null;
          
          // Check if this is a metadata field
          if (field.metadata && item.metadata && item.metadata[fieldName]) {
            arrayData = item.metadata[fieldName];
          } else if (item[fieldName]) {
            arrayData = item[fieldName];
          }
          
          if (arrayData && Array.isArray(arrayData)) {
            const container = document.getElementById(`${fieldName}Container`);
            if (container) {
              container.innerHTML = ''; // Clear existing
              arrayData.forEach(value => {
                if (fieldName === 'locations' && typeof value === 'object') {
                  // Special handling for locations objects
                  const div = document.createElement('div');
                  div.className = 'border p-3 rounded-lg mb-2';
                  div.innerHTML = `
                    <input type="text" placeholder="Location name" value="${value.name || ''}" class="w-full px-3 py-2 border rounded-lg mb-2" data-field="name">
                    <textarea placeholder="Description" class="w-full px-3 py-2 border rounded-lg mb-2" rows="2" data-field="description">${value.description || ''}</textarea>
                    <input type="text" placeholder="Coordinates (optional)" value="${value.coordinates || ''}" class="w-full px-3 py-2 border rounded-lg" data-field="coordinates">
                  `;
                  container.appendChild(div);
                } else {
                  // Regular string array items
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.className = 'w-full px-3 py-2 border rounded-lg mb-2';
                  input.value = typeof value === 'object' ? JSON.stringify(value) : value;
                  const wrapper = document.createElement('div');
                  wrapper.appendChild(input);
                  container.appendChild(wrapper);
                }
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
          if (fieldName === 'locations') {
            // Special handling for locations - each location is in a div with multiple inputs
            container.querySelectorAll('div.border').forEach(locationDiv => {
              const location = {};
              const nameInput = locationDiv.querySelector('[data-field="name"]');
              const descInput = locationDiv.querySelector('[data-field="description"]');
              const coordInput = locationDiv.querySelector('[data-field="coordinates"]');
              
              if (nameInput && nameInput.value.trim()) {
                location.name = nameInput.value.trim();
                if (descInput) location.description = descInput.value.trim();
                if (coordInput && coordInput.value.trim()) location.coordinates = coordInput.value.trim();
                arrayItems.push(location);
              }
            });
          } else {
            // Regular array items
            container.querySelectorAll('input, textarea').forEach(input => {
              if (input.value.trim()) {
                arrayItems.push(input.value.trim());
              }
            });
          }
        }
        
        // Store in metadata if it's a metadata field
        if (field.metadata) {
          itemData.metadata[fieldName] = arrayItems;
        } else {
          itemData[fieldName] = arrayItems;
        }
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
      'example': 'exampleContent',
      'ai-assist': 'aiAssistContent'
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
   * Generate AI prompt with URL and example JSON
   */
  function generateAIPrompt() {
    const urlInput = document.getElementById('aiPromptUrl');
    const promptContainer = document.getElementById('aiPromptContainer');
    const promptText = document.getElementById('aiPromptText');
    const exampleElement = document.getElementById('exampleTemplate');
    
    if (!urlInput || !promptContainer || !promptText || !exampleElement) return;
    
    const url = urlInput.value.trim();
    if (!url) {
      ContentTypeManager.showToast('Please enter a URL first', 'error');
      return;
    }
    
    // Generate the prompt
    const prompt = `I need you to change the following information ${url} & put it in the following JSON format:\n\n${exampleElement.textContent}`;
    
    // Display the prompt
    promptText.value = prompt;
    promptContainer.classList.remove('hidden');
    
    // Auto-select the text for easy copying
    promptText.select();
  }

  /**
   * Copy AI prompt to clipboard
   */
  function copyAIPrompt() {
    const promptText = document.getElementById('aiPromptText');
    if (!promptText) return;
    
    navigator.clipboard.writeText(promptText.value).then(() => {
      ContentTypeManager.showToast('AI prompt copied to clipboard!');
    }).catch(() => {
      ContentTypeManager.showToast('Failed to copy prompt', 'error');
    });
  }

  /**
   * Generate content using AI
   */
  async function generateAIContent() {
    const input = document.getElementById('aiInput');
    const loading = document.getElementById('aiLoading');
    const resultContainer = document.getElementById('aiResultContainer');
    const errorDiv = document.getElementById('aiError');
    const errorMessage = document.getElementById('aiErrorMessage');
    const contentType = ContentTypeManager.getContentType();
    
    if (!input || !input.value.trim()) {
      ContentTypeManager.showToast('Please describe the content you want to create', 'error');
      return;
    }
    
    // Check if input contains YouTube URL
    const youtubeUrlMatch = input.value.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/[^\s]+)/);
    if (youtubeUrlMatch) {
      loading.innerHTML = `
        <div class="flex items-center justify-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Fetching YouTube video information...</span>
        </div>
      `;
    }
    
    // Reset state
    resultContainer.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loading.classList.remove('hidden');
    
    try {
      // Get the example template to help AI understand the format
      const exampleElement = document.getElementById('exampleTemplate');
      const exampleJSON = exampleElement ? exampleElement.textContent : '';
      
      const response = await fetch(`/admin/api/content/${contentType.dbType}/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.value.trim(),
          contentType: contentType,
          exampleJSON: exampleJSON
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }
      
      // Display the generated JSON
      document.getElementById('aiGeneratedJson').textContent = JSON.stringify(data.content, null, 2);
      resultContainer.classList.remove('hidden');
      
      // Store for later use
      window.aiGeneratedContent = data.content;
      
    } catch (error) {
      console.error('AI generation error:', error);
      errorMessage.textContent = error.message || 'Failed to generate content. Please try again.';
      errorDiv.classList.remove('hidden');
    } finally {
      // Reset loading state
      loading.innerHTML = `
        <div class="flex items-center justify-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">AI is generating your content...</span>
        </div>
      `;
      loading.classList.add('hidden');
    }
  }

  /**
   * Edit AI generated JSON
   */
  function editAIGeneratedJSON() {
    const jsonTab = document.getElementById('jsonImportTab');
    const jsonInput = document.getElementById('jsonInput');
    
    if (window.aiGeneratedContent && jsonInput) {
      // Switch to JSON tab
      showImportTab('json');
      
      // Populate the JSON input with the generated content
      jsonInput.value = JSON.stringify(window.aiGeneratedContent, null, 2);
      
      ContentTypeManager.showToast('You can now edit the generated JSON');
    }
  }

  /**
   * Import AI generated content
   */
  async function importAIGeneratedContent() {
    if (!window.aiGeneratedContent) {
      ContentTypeManager.showToast('No AI generated content to import', 'error');
      return;
    }
    
    try {
      // Create a fake file object for the existing import function
      const items = Array.isArray(window.aiGeneratedContent) ? window.aiGeneratedContent : [window.aiGeneratedContent];
      const blob = new Blob([JSON.stringify(items)], { type: 'application/json' });
      const file = new File([blob], 'ai-generated.json', { type: 'application/json' });
      
      // Use existing import function
      if (window.ContentTypeManager._importItems) {
        await window.ContentTypeManager._importItems(file);
        window.ContentTypeManager.closeImportModal();
        
        // Clear the AI generated content
        window.aiGeneratedContent = null;
      }
    } catch (error) {
      ContentTypeManager.showToast('Failed to import content: ' + error.message, 'error');
    }
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