/**
 * Prayer Modal Manager Module
 * Handles modal operations
 */

window.PrayerManager = window.PrayerManager || {};
PrayerManager.ModalManager = {};

(function(ModalManager) {
  'use strict';

  /**
   * Open add prayer modal
   */
  ModalManager.openAddPrayerModal = function() {
    PrayerManager.setEditingPrayer(null);
    PrayerManager.FormManager.resetForm();
    
    const modal = document.getElementById('prayerModal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Focus on first input
      setTimeout(() => {
        const firstInput = document.getElementById('prayerTitle');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  };

  /**
   * Close prayer modal
   */
  ModalManager.closePrayerModal = function() {
    const modal = document.getElementById('prayerModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    
    PrayerManager.setEditingPrayer(null);
  };

  /**
   * Edit prayer
   * @param {string} id - Prayer ID to edit
   */
  ModalManager.editPrayer = function(id) {
    const prayer = PrayerManager.getPrayerById(id);
    if (!prayer) {
      PrayerManager.showMessage('Prayer not found', 'error');
      return;
    }
    
    PrayerManager.setEditingPrayer(prayer);
    PrayerManager.FormManager.populateForm(prayer);
    
    const modal = document.getElementById('prayerModal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Focus on title input
      setTimeout(() => {
        const titleInput = document.getElementById('prayerTitle');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
    }
  };

  /**
   * Show prayer preview
   * @param {string} id - Prayer ID to preview
   */
  ModalManager.showPreview = function(id) {
    const prayer = PrayerManager.getPrayerById(id);
    if (!prayer) {
      PrayerManager.showMessage('Prayer not found', 'error');
      return;
    }
    
    const previewContent = document.getElementById('previewContent');
    if (!previewContent) return;
    
    // Build preview HTML
    let html = `
      <div class="prayer-preview">
        <div class="mb-4">
          <span class="category-badge category-${prayer.category}">
            <i class="fas ${getCategoryIcon(prayer.category)} mr-1"></i>
            ${prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}
          </span>
          ${!prayer.is_active ? '<span class="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Inactive</span>' : ''}
        </div>
        
        <h3 class="text-2xl font-semibold mb-2">${escapeHtml(prayer.title)}</h3>
        
        ${prayer.author ? `<p class="text-gray-600 mb-4"><i class="fas fa-user mr-2"></i>${escapeHtml(prayer.author)}</p>` : ''}
        
        <div class="prayer-text prose max-w-none">
          ${escapeHtml(prayer.content).replace(/\n/g, '<br>')}
        </div>
    `;
    
    if (prayer.audio_url) {
      html += `
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-700 mb-2">
            <i class="fas fa-headphones mr-2"></i>Audio Recording Available
          </p>
          <audio controls class="w-full">
            <source src="${prayer.audio_url}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
    }
    
    if (prayer.tags && prayer.tags.length > 0) {
      html += `
        <div class="mt-6">
          <p class="text-sm font-semibold mb-2">Tags:</p>
          ${prayer.tags.map(tag => `
            <span class="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-2 mb-1">
              ${escapeHtml(tag)}
            </span>
          `).join('')}
        </div>
      `;
    }
    
    if (prayer.usage_count > 0) {
      html += `
        <div class="mt-6 pt-4 border-t text-sm text-gray-500">
          <p><i class="fas fa-chart-bar mr-2"></i>Used ${prayer.usage_count} times</p>
          ${prayer.lastUsedDate ? `<p><i class="fas fa-calendar mr-2"></i>Last used: ${new Date(prayer.lastUsedDate).toLocaleDateString()}</p>` : ''}
        </div>
      `;
    }
    
    html += '</div>';
    
    previewContent.innerHTML = html;
    
    // Show modal
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  /**
   * Close preview modal
   */
  ModalManager.closePreview = function() {
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  /**
   * Initialize modal event listeners
   */
  ModalManager.init = function() {
    // Prayer modal background click
    const prayerModal = document.getElementById('prayerModal');
    if (prayerModal) {
      prayerModal.addEventListener('click', function(e) {
        if (e.target === this) {
          ModalManager.closePrayerModal();
        }
      });
    }
    
    // Preview modal background click
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
      previewModal.addEventListener('click', function(e) {
        if (e.target === this) {
          ModalManager.closePreview();
        }
      });
    }
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (!prayerModal.classList.contains('hidden')) {
          ModalManager.closePrayerModal();
        }
        if (!previewModal.classList.contains('hidden')) {
          ModalManager.closePreview();
        }
      }
    });
    
    // Quick actions with keyboard
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + K to add new prayer
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        ModalManager.openAddPrayerModal();
      }
    });
  };

  /**
   * Get icon for category
   * @param {string} category - Prayer category
   * @returns {string} Font Awesome icon class
   */
  function getCategoryIcon(category) {
    const icons = {
      morning: 'fa-sun',
      evening: 'fa-moon',
      meal: 'fa-utensils',
      healing: 'fa-hand-holding-heart',
      thanksgiving: 'fa-hands',
      confession: 'fa-heart',
      intercession: 'fa-pray',
      traditional: 'fa-church',
      seasonal: 'fa-calendar-alt',
      other: 'fa-praying-hands'
    };
    return icons[category] || 'fa-praying-hands';
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Expose ModalManager
  window.PrayerManager.ModalManager = ModalManager;

})(PrayerManager.ModalManager);