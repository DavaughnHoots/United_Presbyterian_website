/**
 * Content Modal Manager Module
 * Handles modal operations
 */

window.ContentLibrary = window.ContentLibrary || {};
ContentLibrary.ModalManager = {};

(function(ModalManager) {
  'use strict';

  /**
   * Open add content modal
   */
  ModalManager.openAddContentModal = function() {
    ContentLibrary.setEditingContent(null);
    ContentLibrary.FormManager.resetForm();
    
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Focus on first input
      setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]):not([disabled])');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  };

  /**
   * Close content modal
   */
  ModalManager.closeContentModal = function() {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    
    ContentLibrary.setEditingContent(null);
  };

  /**
   * Edit content
   * @param {string} id - Content ID to edit
   */
  ModalManager.editContent = function(id) {
    const content = ContentLibrary.getContentById(id);
    if (!content) {
      ContentLibrary.showMessage('Content not found', 'error');
      return;
    }
    
    ContentLibrary.setEditingContent(content);
    ContentLibrary.FormManager.populateForm(content);
    
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Focus on title input
      setTimeout(() => {
        const titleInput = document.getElementById('contentTitle');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
    }
  };

  /**
   * Toggle content status
   * @param {string} id - Content ID
   * @param {boolean} currentStatus - Current active status
   */
  ModalManager.toggleContentStatus = async function(id, currentStatus) {
    const success = await ContentLibrary.toggleContentStatus(id, currentStatus);
    if (success) {
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Delete content
   * @param {string} id - Content ID
   */
  ModalManager.deleteContent = async function(id) {
    const success = await ContentLibrary.deleteContent(id);
    if (success) {
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Initialize modal event listeners
   */
  ModalManager.init = function() {
    const modal = document.getElementById('contentModal');
    if (!modal) return;
    
    // Close on background click
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        ModalManager.closeContentModal();
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        ModalManager.closeContentModal();
      }
    });
    
    // Prevent form submission on Enter in single-line inputs
    const inputs = modal.querySelectorAll('input[type="text"], input[type="url"]');
    inputs.forEach(input => {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          
          // Move to next input
          const formElements = Array.from(modal.querySelectorAll('input, textarea, select, button'));
          const currentIndex = formElements.indexOf(this);
          if (currentIndex > -1 && currentIndex < formElements.length - 1) {
            const nextElement = formElements[currentIndex + 1];
            if (nextElement && !nextElement.disabled) {
              nextElement.focus();
            }
          }
        }
      });
    });
  };

  /**
   * Show content preview in modal
   * @param {string} contentId - Content ID to preview
   */
  ModalManager.showPreview = function(contentId) {
    const content = ContentLibrary.getContentById(contentId);
    if (!content) return;
    
    // Create preview modal if it doesn't exist
    let previewModal = document.getElementById('contentPreviewModal');
    if (!previewModal) {
      previewModal = createPreviewModal();
      document.body.appendChild(previewModal);
    }
    
    // Populate preview content
    populatePreview(previewModal, content);
    
    // Show modal
    previewModal.style.display = 'flex';
  };

  /**
   * Create preview modal element
   * @returns {HTMLElement} Preview modal
   */
  function createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'contentPreviewModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div class="p-6 border-b">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold">Content Preview</h2>
              <button onclick="ContentLibrary.ModalManager.closePreview()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          <div id="previewContent" class="p-6 overflow-y-auto" style="max-height: calc(90vh - 120px);">
            <!-- Preview content will be inserted here -->
          </div>
        </div>
      </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        ModalManager.closePreview();
      }
    });
    
    return modal;
  }

  /**
   * Populate preview modal with content
   * @param {HTMLElement} modal - Preview modal element
   * @param {Object} content - Content to preview
   */
  function populatePreview(modal, content) {
    const container = modal.querySelector('#previewContent');
    if (!container) return;
    
    let html = `
      <div class="content-preview">
        <div class="mb-4">
          <span class="content-type-badge ${content.type}">
            <i class="fas ${getContentIcon(content.type)} mr-1"></i>
            ${content.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
          ${content.theme ? `<span class="ml-2 text-sm text-gray-600">Theme: ${content.theme}</span>` : ''}
        </div>
        
        <h3 class="text-xl font-semibold mb-2">${content.title}</h3>
        
        ${content.biblePassage ? `<p class="text-sm text-gray-600 mb-2"><i class="fas fa-bible mr-1"></i>${content.biblePassage}</p>` : ''}
        ${content.artist ? `<p class="text-sm text-gray-600 mb-2"><i class="fas fa-user mr-1"></i>${content.artist}</p>` : ''}
        
        <div class="prose max-w-none">
          ${content.content ? `<p>${content.content.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
    `;
    
    // Add media previews
    if (content.image_url) {
      html += `<div class="mt-4"><img src="${content.image_url}" alt="Content image" class="max-w-full rounded"></div>`;
    }
    
    if (content.video_url || content.youtubeId) {
      html += `<div class="mt-4"><p class="text-sm text-gray-600"><i class="fas fa-video mr-1"></i>Video content included</p></div>`;
    }
    
    if (content.audio_url) {
      html += `<div class="mt-4"><p class="text-sm text-gray-600"><i class="fas fa-headphones mr-1"></i>Audio content included</p></div>`;
    }
    
    if (content.prompts && content.prompts.length > 0) {
      html += `
        <div class="mt-4">
          <h4 class="font-semibold mb-2">Prompts:</h4>
          <ul class="list-disc list-inside">
            ${content.prompts.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    html += `
        <div class="mt-6 pt-4 border-t text-sm text-gray-500">
          <p><i class="fas fa-clock mr-1"></i>Duration: ${content.duration_minutes || 5} minutes</p>
          <p><i class="fas fa-chart-bar mr-1"></i>Used ${content.usageCount || 0} times</p>
          ${content.lastUsedDate ? `<p><i class="fas fa-calendar mr-1"></i>Last used: ${new Date(content.lastUsedDate).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }

  /**
   * Get icon for content type
   * @param {string} type - Content type
   * @returns {string} Font Awesome icon class
   */
  function getContentIcon(type) {
    const icons = {
      'scripture_reading': 'fa-book-bible',
      'prayer': 'fa-praying-hands',
      'hymn': 'fa-music',
      'journaling_prompt': 'fa-pencil-alt',
      'guided_prayer': 'fa-headphones',
      'reflection': 'fa-pen',
      'artwork': 'fa-image',
      'video': 'fa-video',
      'creed': 'fa-scroll'
    };
    
    return icons[type] || 'fa-file';
  }

  /**
   * Close preview modal
   */
  ModalManager.closePreview = function() {
    const modal = document.getElementById('contentPreviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  // Expose ModalManager
  window.ContentLibrary.ModalManager = ModalManager;

})(ContentLibrary.ModalManager);