/**
 * Prayer Form Manager Module
 * Handles form operations and validation
 */

window.PrayerManager = window.PrayerManager || {};
PrayerManager.FormManager = {};

(function(FormManager) {
  'use strict';

  /**
   * Save prayer from form
   * @param {Event} event - Form submit event
   */
  FormManager.savePrayer = async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      title: formData.get('title'),
      category: formData.get('category'),
      author: formData.get('author'),
      content: formData.get('content'),
      audio_url: formData.get('audio_url'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : [],
      is_active: formData.has('is_active')
    };
    
    // Add ID if editing
    const id = formData.get('id');
    if (id) {
      data.id = id;
    }
    
    // Validate form
    if (!FormManager.validateForm(data)) {
      return;
    }
    
    const success = await PrayerManager.savePrayer(data);
    
    if (success) {
      PrayerManager.ModalManager.closePrayerModal();
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Validate form data
   * @param {Object} data - Form data
   * @returns {boolean} Is form valid
   */
  FormManager.validateForm = function(data) {
    // Check required fields
    if (!data.title || !data.title.trim()) {
      PrayerManager.showMessage('Prayer title is required', 'error');
      return false;
    }
    
    if (!data.category) {
      PrayerManager.showMessage('Please select a category', 'error');
      return false;
    }
    
    if (!data.content || !data.content.trim()) {
      PrayerManager.showMessage('Prayer text is required', 'error');
      return false;
    }
    
    // Validate audio URL if provided
    if (data.audio_url && !isValidUrl(data.audio_url)) {
      PrayerManager.showMessage('Invalid audio URL format', 'error');
      return false;
    }
    
    return true;
  };

  /**
   * Populate form for editing
   * @param {Object} prayer - Prayer to edit
   */
  FormManager.populateForm = function(prayer) {
    if (!prayer) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Prayer';
    document.getElementById('prayerId').value = prayer.id;
    document.getElementById('prayerTitle').value = prayer.title;
    document.getElementById('prayerCategory').value = prayer.category;
    document.getElementById('prayerAuthor').value = prayer.author || '';
    document.getElementById('prayerContent').value = prayer.content;
    document.getElementById('prayerAudioUrl').value = prayer.audio_url || '';
    document.getElementById('prayerTags').value = prayer.tags ? prayer.tags.join(', ') : '';
    document.getElementById('prayerIsActive').checked = prayer.is_active;
  };

  /**
   * Reset form to defaults
   */
  FormManager.resetForm = function() {
    document.getElementById('modalTitle').textContent = 'Add New Prayer';
    document.getElementById('prayerForm').reset();
    document.getElementById('prayerId').value = '';
    document.getElementById('prayerIsActive').checked = true;
  };

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize form event listeners
   */
  FormManager.init = function() {
    const form = document.getElementById('prayerForm');
    if (!form) return;
    
    // Form submit handler
    form.addEventListener('submit', function(e) {
      FormManager.savePrayer(e);
    });
    
    // Tag input enhancement
    const tagInput = document.getElementById('prayerTags');
    if (tagInput) {
      tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const value = this.value.trim();
          if (value && !value.endsWith(',')) {
            this.value = value + ', ';
          }
        }
      });
    }
    
    // Audio URL validation feedback
    const audioInput = document.getElementById('prayerAudioUrl');
    if (audioInput) {
      audioInput.addEventListener('blur', function() {
        if (this.value && !isValidUrl(this.value)) {
          this.classList.add('border-red-500');
          this.nextElementSibling.textContent = 'Please enter a valid URL';
          this.nextElementSibling.classList.add('text-red-500');
        } else {
          this.classList.remove('border-red-500');
          this.nextElementSibling.textContent = 'URL to audio recording of this prayer';
          this.nextElementSibling.classList.remove('text-red-500');
        }
      });
    }
    
    // Character counter for content
    const contentTextarea = document.getElementById('prayerContent');
    if (contentTextarea) {
      const counter = document.createElement('div');
      counter.className = 'text-sm text-gray-500 mt-1';
      counter.textContent = '0 characters';
      contentTextarea.parentNode.appendChild(counter);
      
      contentTextarea.addEventListener('input', function() {
        counter.textContent = `${this.value.length} characters`;
      });
    }
    
    // Category helper text
    const categorySelect = document.getElementById('prayerCategory');
    if (categorySelect) {
      const helperText = document.createElement('small');
      helperText.className = 'text-gray-500 mt-1 block';
      categorySelect.parentNode.appendChild(helperText);
      
      categorySelect.addEventListener('change', function() {
        const helpers = {
          morning: 'Prayers for the start of the day',
          evening: 'Prayers for the end of the day',
          meal: 'Blessings before or after meals',
          healing: 'Prayers for physical or spiritual healing',
          thanksgiving: 'Prayers of gratitude and praise',
          confession: 'Prayers acknowledging sins and seeking forgiveness',
          intercession: 'Prayers on behalf of others',
          traditional: 'Classic prayers from liturgical traditions',
          seasonal: 'Prayers for specific seasons or holidays',
          other: 'General or miscellaneous prayers'
        };
        
        helperText.textContent = helpers[this.value] || '';
      });
    }
  };

  /**
   * Create prayer template
   * @param {string} type - Template type
   * @returns {Object} Prayer template
   */
  FormManager.getTemplate = function(type) {
    const templates = {
      morning: {
        title: 'Morning Prayer',
        content: 'Heavenly Father,\n\nThank you for this new day...',
        tags: ['morning', 'daily', 'gratitude']
      },
      evening: {
        title: 'Evening Prayer',
        content: 'Lord God,\n\nAs this day comes to an end...',
        tags: ['evening', 'daily', 'rest']
      },
      meal: {
        title: 'Meal Blessing',
        content: 'Gracious God,\n\nWe thank you for this food...',
        tags: ['meal', 'blessing', 'gratitude']
      }
    };
    
    return templates[type] || null;
  };

  // Expose FormManager
  window.PrayerManager.FormManager = FormManager;

})(PrayerManager.FormManager);