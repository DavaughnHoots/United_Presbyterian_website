/**
 * Journey Content Library Module
 * Handles content search and selection from library
 */

window.JourneyEditor = window.JourneyEditor || {};
JourneyEditor.ContentLibrary = {};

(function(ContentLibrary) {
  'use strict';

  // Private variables
  let searchTimers = {};

  /**
   * Search content by type
   * @param {string} type - Content type to search
   * @param {Event} event - Optional event from search input
   */
  ContentLibrary.searchContent = async function(type, event) {
    // Get search term
    let searchTerm = '';
    if (event && event.target) {
      searchTerm = event.target.value;
    } else {
      // Try to find the search input for this type
      const searchInput = document.querySelector(`#${type}Tab .search-bar input`);
      if (searchInput) {
        searchTerm = searchInput.value;
      }
    }
    
    // Clear existing timer for this type
    if (searchTimers[type]) {
      clearTimeout(searchTimers[type]);
    }
    
    // Show loading state
    const listEl = document.getElementById(type + 'List');
    if (!listEl) return;
    
    // Only show loading for initial searches or after a delay
    if (!searchTerm || searchTerm.length === 0) {
      listEl.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
    
    // Debounce search
    searchTimers[type] = setTimeout(async () => {
      try {
        // Map type for API
        const apiType = mapTypeForAPI(type);
        
        const response = await fetch(`/admin/api/content/unified/search?type=${apiType}&q=${encodeURIComponent(searchTerm)}`);
        const items = await response.json();
        
        renderContentList(type, items);
      } catch (error) {
        console.error('Error searching content:', error);
        listEl.innerHTML = '<p class="text-danger text-center py-4">Error loading content</p>';
      }
    }, 300); // 300ms debounce
  };

  /**
   * Render content list
   * @param {string} type - Content type
   * @param {Array} items - Content items
   */
  function renderContentList(type, items) {
    const listEl = document.getElementById(type + 'List');
    if (!listEl) return;
    
    if (!items || items.length === 0) {
      listEl.innerHTML = '<p class="text-muted text-center py-4">No items found</p>';
      return;
    }
    
    listEl.innerHTML = items.map(item => {
      // Extract metadata
      const author = item.artist || item.metadata?.author || '';
      let preview = '';
      
      // Generate preview based on content type
      if (item.content) {
        preview = item.content.substring(0, 150) + (item.content.length > 150 ? '...' : '');
      } else if (item.prompts && Array.isArray(item.prompts)) {
        preview = item.prompts[0] || '';
      } else if (item.instructions) {
        preview = item.instructions.substring(0, 150) + (item.instructions.length > 150 ? '...' : '');
      }
      
      // Escape quotes in JSON for onclick
      const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
      
      return `
        <div class="content-list-item" onclick="JourneyEditor.ContentPicker.selectLibraryContent(${itemJson})">
          <h5>${escapeHtml(item.title)}</h5>
          ${author ? `<small class="text-muted">${escapeHtml(author)}</small>` : ''}
          ${preview ? `<p class="text-muted mb-0">${escapeHtml(preview)}</p>` : ''}
          <div class="mt-1">
            ${item.theme ? `<span class="badge badge-info badge-sm">${escapeHtml(item.theme)}</span>` : ''}
            ${item.duration_minutes ? `<span class="badge badge-secondary badge-sm">${item.duration_minutes} min</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Map frontend type to API type
   * @param {string} type - Frontend type
   * @returns {string} API type
   */
  function mapTypeForAPI(type) {
    const mapping = {
      'journaling': 'journaling_prompt',  // Legacy mapping
      'journaling_prompt': 'journaling_prompt',
      'scripture_reading': 'scripture_reading',
      'guided_prayer': 'guided_prayer',
      'prayer': 'prayer',
      'hymn': 'hymn',
      'artwork': 'artwork',
      'video': 'video',
      'reflection': 'reflection'
    };
    
    return mapping[type] || type;
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

  /**
   * Preview media content
   * @param {string} type - Media type (artwork, video)
   * @param {string} url - Media URL
   * @param {string} containerId - Container element ID
   */
  ContentLibrary.previewMedia = function(type, url, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !url) return;
    
    if (type === 'artwork') {
      previewArtwork(url, container);
    } else if (type === 'video') {
      previewVideo(url, container);
    }
  };

  /**
   * Preview artwork
   * @param {string} url - Image URL
   * @param {HTMLElement} container - Container element
   */
  function previewArtwork(url, container) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      container.innerHTML = `<img src="${url}" alt="Artwork preview" style="max-width: 100%; max-height: 300px;">`;
    };
    
    img.onerror = function() {
      container.innerHTML = `
        <div class="text-center p-3">
          <i class="fas fa-image text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2">Unable to preview image</p>
          <small class="text-muted">The image will still be saved.</small>
        </div>
      `;
    };
    
    img.src = url;
  }

  /**
   * Preview video
   * @param {string} url - Video URL
   * @param {HTMLElement} container - Container element
   */
  function previewVideo(url, container) {
    const embedUrl = getVideoEmbedUrl(url);
    
    if (embedUrl) {
      container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width: 100%; height: 300px;"></iframe>`;
    } else {
      container.innerHTML = '<p class="text-muted">Video preview not available. URL will be saved.</p>';
    }
  }

  /**
   * Get embeddable URL for video
   * @param {string} url - Original video URL
   * @returns {string|null} Embeddable URL or null
   */
  function getVideoEmbedUrl(url) {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
  }

  // Initialize search on page load for all content types
  ContentLibrary.initializeSearches = function() {
    const contentTypes = [
      'prayer', 'hymn', 'scripture_reading', 'artwork', 
      'video', 'journaling_prompt', 'guided_prayer', 'reflection'
    ];
    
    contentTypes.forEach(type => {
      // Only search if the tab exists
      const listEl = document.getElementById(type + 'List');
      if (listEl) {
        ContentLibrary.searchContent(type);
      }
    });
  };

  // Expose functions globally
  window.JourneyEditor.ContentLibrary = ContentLibrary;

})(JourneyEditor.ContentLibrary);