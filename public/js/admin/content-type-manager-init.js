/**
 * Content Type Manager Initialization
 * Simple initialization for content type management
 */

(function() {
  'use strict';

  /**
   * Initialize when DOM is ready
   */
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
    
    // Set up event listeners using delegation
    setupEventListeners();
    
    console.log(`Content Type Manager initialized for ${contentType.name}`);
  });

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Item action buttons
    const itemList = document.getElementById('itemList');
    if (itemList) {
      itemList.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const itemId = button.dataset.itemId;
        
        switch (action) {
          case 'preview':
            showPreview(itemId);
            break;
            
          case 'edit':
            editItem(itemId);
            break;
            
          case 'toggle':
            const isActive = button.dataset.isActive === 'true';
            ContentTypeManager.toggleItemStatus(itemId, isActive);
            break;
            
          case 'delete':
            ContentTypeManager.deleteItem(itemId);
            break;
        }
      });
    }
    
    // Form submission
    const form = document.getElementById('contentForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
      });
    }
    
    // Filter and sort handlers
    const filters = ['categoryFilter', 'searchFilter', 'seasonFilter', 'authorFilter', 'themeFilter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', filterItems);
        element.addEventListener('keyup', filterItems);
      }
    });
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      sortBy.addEventListener('change', sortItems);
    }
    
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
          // Handle array fields later
        } else {
          element.value = item[fieldName] || '';
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

  // Expose functions globally for onclick handlers
  window.ContentTypeManager = window.ContentTypeManager || {};
  window.ContentTypeManager.ModalManager = {
    openAddModal: function() {
      document.getElementById('modalTitle').textContent = `Add New ${ContentTypeManager.getContentType().name}`;
      document.getElementById('contentForm').reset();
      document.getElementById('itemId').value = '';
      document.getElementById('contentModal').classList.remove('hidden');
    },
    closeModal: function() {
      document.getElementById('contentModal').classList.add('hidden');
    },
    closePreview: function() {
      document.getElementById('previewModal').classList.add('hidden');
    }
  };
  
  window.ContentTypeManager.FilterManager = {
    filterItems: filterItems,
    sortItems: sortItems,
    resetFilters: function() {
      document.getElementById('searchFilter').value = '';
      document.getElementById('categoryFilter').value = '';
      const seasonFilter = document.getElementById('seasonFilter');
      if (seasonFilter) seasonFilter.value = '';
      const authorFilter = document.getElementById('authorFilter');
      if (authorFilter) authorFilter.value = '';
      const themeFilter = document.getElementById('themeFilter');
      if (themeFilter) themeFilter.value = '';
      filterItems();
    }
  };
  
  window.ContentTypeManager.FormManager = {
    saveItem: saveItem,
    addArrayItem: function(fieldName) {
      const container = document.getElementById(`${fieldName}Container`);
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'w-full px-3 py-2 border rounded-lg';
      input.placeholder = 'Enter item...';
      const wrapper = document.createElement('div');
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    }
  };
  
  window.ContentTypeManager.showImportModal = function() {
    document.getElementById('importModal').classList.remove('hidden');
  };
  
  window.ContentTypeManager.closeImportModal = function() {
    document.getElementById('importModal').classList.add('hidden');
  };
  
  window.ContentTypeManager.importItems = function() {
    const fileInput = document.getElementById('importFile');
    if (fileInput.files.length > 0) {
      ContentTypeManager.importItems(fileInput.files[0]);
      window.ContentTypeManager.closeImportModal();
    }
  };
  
  window.ContentTypeManager.exportItems = function() {
    ContentTypeManager.exportItems();
  };

})();