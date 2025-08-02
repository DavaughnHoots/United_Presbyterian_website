/**
 * Content Form Manager Module
 * Handles form operations and field updates
 */

window.ContentLibrary = window.ContentLibrary || {};
ContentLibrary.FormManager = {};

(function(FormManager) {
  'use strict';

  // Form field configurations
  const fieldConfigs = {
    'scripture_reading': {
      fields: ['biblePassageField'],
      contentLabel: 'Scripture Text*',
      contentPlaceholder: 'Enter the scripture passage text...'
    },
    'prayer': {
      fields: ['artistField', 'durationField'],
      contentLabel: 'Prayer Text*',
      contentPlaceholder: 'Enter the prayer text...'
    },
    'guided_prayer': {
      fields: ['artistField', 'durationField', 'instructionsField', 'videoUrlField', 'audioUrlField'],
      contentLabel: 'Prayer Text*',
      contentPlaceholder: 'Enter the prayer text...'
    },
    'hymn': {
      fields: ['youtubeField', 'artistField'],
      contentLabel: 'Lyrics (Optional)',
      contentPlaceholder: 'Enter hymn lyrics or description...',
      contentRequired: false
    },
    'artwork': {
      fields: ['imageUrlField', 'artistField', 'instructionsField'],
      contentLabel: 'Reflection/Description*',
      contentPlaceholder: 'Describe the artwork and its spiritual significance...'
    },
    'video': {
      fields: ['videoUrlField', 'durationField', 'instructionsField'],
      contentLabel: 'Video Description*',
      contentPlaceholder: 'Describe the video content...'
    },
    'journaling_prompt': {
      fields: ['promptsField', 'instructionsField'],
      contentLabel: 'Main Prompt*',
      contentPlaceholder: 'Enter the main reflection question or journaling prompt...'
    },
    'reflection': {
      fields: ['instructionsField'],
      contentLabel: 'Reflection Content*',
      contentPlaceholder: 'Write your reflection...'
    },
    'creed': {
      fields: ['artistField'],
      contentLabel: 'Creed Text*',
      contentPlaceholder: 'Enter the creed text...'
    }
  };

  // Legacy type mappings
  const legacyTypeMappings = {
    'reading': 'scripture_reading',
    'music': 'hymn',
    'question': 'journaling_prompt'
  };

  /**
   * Update form fields based on content type
   */
  FormManager.updateFormFields = function() {
    const typeSelect = document.getElementById('contentType');
    if (!typeSelect) return;
    
    let type = typeSelect.value;
    
    // Map legacy types
    if (legacyTypeMappings[type]) {
      type = legacyTypeMappings[type];
    }
    
    // Hide all optional fields first
    hideAllOptionalFields();
    
    // Get configuration for this type
    const config = fieldConfigs[type];
    if (!config) {
      // Default configuration
      setContentFieldDefaults();
      return;
    }
    
    // Show relevant fields
    config.fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.style.display = 'block';
      }
    });
    
    // Update content field label and placeholder
    const contentField = document.getElementById('contentText');
    const contentLabel = contentField.previousElementSibling;
    
    contentLabel.textContent = config.contentLabel;
    contentField.placeholder = config.contentPlaceholder;
    contentField.required = config.contentRequired !== false;
  };

  /**
   * Hide all optional fields
   */
  function hideAllOptionalFields() {
    const optionalFields = [
      'biblePassageField', 'youtubeField', 'imageUrlField',
      'videoUrlField', 'audioUrlField', 'artistField',
      'instructionsField', 'promptsField', 'durationField'
    ];
    
    optionalFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.style.display = 'none';
      }
    });
  }

  /**
   * Set content field to defaults
   */
  function setContentFieldDefaults() {
    const contentField = document.getElementById('contentText');
    const contentLabel = contentField.previousElementSibling;
    
    contentField.required = true;
    contentLabel.textContent = 'Content*';
    contentField.placeholder = '';
  }

  /**
   * Save content from form
   * @param {Event} event - Form submit event
   */
  FormManager.saveContent = async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      type: formData.get('type'),
      title: formData.get('title'),
      content: formData.get('content'),
      biblePassage: formData.get('biblePassage'),
      youtubeId: formData.get('youtubeId'),
      theme: formData.get('theme'),
      season: formData.get('season'),
      tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
      isActive: formData.has('isActive'),
      image_url: formData.get('image_url'),
      video_url: formData.get('video_url'),
      audio_url: formData.get('audio_url'),
      artist: formData.get('artist'),
      instructions: formData.get('instructions'),
      prompts: formData.get('prompts') ? formData.get('prompts').split('\n').filter(p => p.trim()) : [],
      duration_minutes: parseInt(formData.get('duration_minutes')) || 5
    };
    
    // Add ID if editing
    const id = formData.get('id');
    if (id) {
      data.id = id;
    }
    
    const success = await ContentLibrary.saveContent(data);
    
    if (success) {
      ContentLibrary.ModalManager.closeContentModal();
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Populate form for editing
   * @param {Object} content - Content to edit
   */
  FormManager.populateForm = function(content) {
    if (!content) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Content';
    document.getElementById('contentId').value = content.id;
    document.getElementById('contentType').value = content.type;
    document.getElementById('contentTitle').value = content.title;
    document.getElementById('contentText').value = content.content || '';
    document.getElementById('biblePassage').value = content.biblePassage || '';
    document.getElementById('youtubeId').value = content.youtubeId || '';
    document.getElementById('contentTheme').value = content.theme || '';
    document.getElementById('contentSeason').value = content.season || '';
    document.getElementById('contentTags').value = content.tags ? content.tags.join(', ') : '';
    document.getElementById('isActive').checked = content.isActive;
    
    // Set multimedia fields
    document.getElementById('imageUrl').value = content.image_url || '';
    document.getElementById('videoUrl').value = content.video_url || '';
    document.getElementById('audioUrl').value = content.audio_url || '';
    document.getElementById('artist').value = content.artist || '';
    document.getElementById('instructions').value = content.instructions || '';
    document.getElementById('prompts').value = content.prompts ? content.prompts.join('\n') : '';
    document.getElementById('duration').value = content.duration_minutes || 5;
    
    FormManager.updateFormFields();
  };

  /**
   * Reset form to defaults
   */
  FormManager.resetForm = function() {
    document.getElementById('modalTitle').textContent = 'Add New Content';
    document.getElementById('contentForm').reset();
    document.getElementById('contentId').value = '';
    FormManager.updateFormFields();
  };

  /**
   * Validate form before submission
   * @returns {boolean} Is form valid
   */
  FormManager.validateForm = function() {
    const form = document.getElementById('contentForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    
    // Custom validations
    const type = document.getElementById('contentType').value;
    
    // Validate YouTube ID format
    if (type === 'hymn' || type === 'music') {
      const youtubeId = document.getElementById('youtubeId').value;
      if (youtubeId && !isValidYouTubeId(youtubeId)) {
        ContentLibrary.showMessage('Invalid YouTube ID format', 'error');
        return false;
      }
    }
    
    // Validate URLs
    const urlFields = ['imageUrl', 'videoUrl', 'audioUrl'];
    for (let fieldId of urlFields) {
      const field = document.getElementById(fieldId);
      if (field && field.value && !isValidUrl(field.value)) {
        ContentLibrary.showMessage(`Invalid URL in ${field.previousElementSibling.textContent}`, 'error');
        return false;
      }
    }
    
    return true;
  };

  /**
   * Check if YouTube ID is valid
   * @param {string} id - YouTube ID
   * @returns {boolean}
   */
  function isValidYouTubeId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

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
    // Content type change listener
    const typeSelect = document.getElementById('contentType');
    if (typeSelect) {
      typeSelect.addEventListener('change', FormManager.updateFormFields);
    }
    
    // Form submit listener
    const form = document.getElementById('contentForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        if (FormManager.validateForm()) {
          FormManager.saveContent(e);
        } else {
          e.preventDefault();
        }
      });
    }
    
    // Tag input enhancement
    const tagInput = document.getElementById('contentTags');
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
  };

  // Expose FormManager
  window.ContentLibrary.FormManager = FormManager;

})(ContentLibrary.FormManager);