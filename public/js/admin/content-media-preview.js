/**
 * Content Media Preview Module
 * Handles media preview functionality
 */

window.ContentLibrary = window.ContentLibrary || {};
ContentLibrary.MediaPreview = {};

(function(MediaPreview) {
  'use strict';

  /**
   * Initialize media preview handlers
   */
  MediaPreview.init = function() {
    // Image URL input handler
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
      imageUrlInput.addEventListener('change', function() {
        MediaPreview.previewImage(this.value);
      });
      imageUrlInput.addEventListener('paste', function() {
        setTimeout(() => MediaPreview.previewImage(this.value), 100);
      });
    }
    
    // Video URL input handler
    const videoUrlInput = document.getElementById('videoUrl');
    if (videoUrlInput) {
      videoUrlInput.addEventListener('change', function() {
        MediaPreview.previewVideo(this.value);
      });
      videoUrlInput.addEventListener('paste', function() {
        setTimeout(() => MediaPreview.previewVideo(this.value), 100);
      });
    }
    
    // YouTube ID input handler
    const youtubeInput = document.getElementById('youtubeId');
    if (youtubeInput) {
      youtubeInput.addEventListener('change', function() {
        MediaPreview.previewYouTube(this.value);
      });
    }
  };

  /**
   * Preview image from URL
   * @param {string} url - Image URL
   */
  MediaPreview.previewImage = function(url) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    if (!url) {
      preview.innerHTML = '';
      return;
    }
    
    // Show loading state
    preview.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Loading preview...</div>';
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      preview.innerHTML = `
        <div class="mt-2">
          <img src="${url}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 4px;">
          <p class="text-sm text-green-600 mt-2"><i class="fas fa-check-circle"></i> Image loaded successfully</p>
        </div>
      `;
    };
    
    img.onerror = function() {
      preview.innerHTML = `
        <div class="text-center p-3 bg-gray-50 rounded mt-2">
          <i class="fas fa-image text-gray-400" style="font-size: 3rem;"></i>
          <p class="text-gray-500 mt-2">Unable to preview image</p>
          <p class="text-xs text-gray-400">The image will still be saved if the URL is valid</p>
        </div>
      `;
    };
    
    img.src = url;
  };

  /**
   * Preview video from URL
   * @param {string} url - Video URL
   */
  MediaPreview.previewVideo = function(url) {
    const preview = document.getElementById('videoPreview');
    if (!preview) {
      // Create preview container if it doesn't exist
      const container = document.getElementById('videoUrlField');
      if (container) {
        const div = document.createElement('div');
        div.id = 'videoPreview';
        div.className = 'mt-2';
        container.appendChild(div);
      }
      return;
    }
    
    if (!url) {
      preview.innerHTML = '';
      return;
    }
    
    const embedUrl = getVideoEmbedUrl(url);
    if (embedUrl) {
      preview.innerHTML = `
        <div class="mt-2">
          <iframe src="${embedUrl}" frameborder="0" allowfullscreen 
                  style="width: 100%; height: 300px; border-radius: 4px;"></iframe>
          <p class="text-sm text-green-600 mt-2"><i class="fas fa-check-circle"></i> Video preview loaded</p>
        </div>
      `;
    } else if (isValidVideoUrl(url)) {
      preview.innerHTML = `
        <div class="text-center p-3 bg-gray-50 rounded mt-2">
          <i class="fas fa-video text-gray-400" style="font-size: 3rem;"></i>
          <p class="text-gray-500 mt-2">Video URL recognized</p>
          <p class="text-xs text-gray-400">Preview not available for this video service</p>
        </div>
      `;
    } else {
      preview.innerHTML = `
        <div class="text-center p-3 bg-yellow-50 rounded mt-2">
          <i class="fas fa-exclamation-triangle text-yellow-500" style="font-size: 2rem;"></i>
          <p class="text-yellow-700 mt-2">Invalid video URL format</p>
          <p class="text-xs text-gray-600">Please enter a valid YouTube or Vimeo URL</p>
        </div>
      `;
    }
  };

  /**
   * Preview YouTube video from ID
   * @param {string} id - YouTube video ID
   */
  MediaPreview.previewYouTube = function(id) {
    const preview = document.getElementById('youtubePreview');
    if (!preview) {
      // Create preview container if it doesn't exist
      const container = document.getElementById('youtubeField');
      if (container) {
        const div = document.createElement('div');
        div.id = 'youtubePreview';
        div.className = 'mt-2';
        container.appendChild(div);
        MediaPreview.previewYouTube(id);
      }
      return;
    }
    
    if (!id) {
      preview.innerHTML = '';
      return;
    }
    
    if (isValidYouTubeId(id)) {
      preview.innerHTML = `
        <div class="mt-2">
          <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen 
                  style="width: 100%; height: 300px; border-radius: 4px;"></iframe>
          <p class="text-sm text-green-600 mt-2"><i class="fas fa-check-circle"></i> YouTube video found</p>
        </div>
      `;
    } else {
      preview.innerHTML = `
        <div class="text-center p-3 bg-yellow-50 rounded mt-2">
          <i class="fas fa-exclamation-triangle text-yellow-500" style="font-size: 2rem;"></i>
          <p class="text-yellow-700 mt-2">Invalid YouTube ID</p>
          <p class="text-xs text-gray-600">YouTube IDs are 11 characters long</p>
        </div>
      `;
    }
  };

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string|null} Video ID or null
   */
  MediaPreview.extractYouTubeId = function(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (let pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };

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

  /**
   * Check if URL is a valid video URL
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  function isValidVideoUrl(url) {
    const videoPatterns = [
      /youtube\.com\/watch\?v=/,
      /youtu\.be\//,
      /vimeo\.com\/\d+/,
      /\.mp4$/i,
      /\.webm$/i,
      /\.ogg$/i
    ];
    
    return videoPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if YouTube ID is valid
   * @param {string} id - YouTube ID
   * @returns {boolean}
   */
  function isValidYouTubeId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  /**
   * Create thumbnail gallery for multiple images
   * @param {Array} urls - Array of image URLs
   * @param {HTMLElement} container - Container element
   */
  MediaPreview.createImageGallery = function(urls, container) {
    if (!urls || urls.length === 0 || !container) return;
    
    const gallery = document.createElement('div');
    gallery.className = 'image-gallery grid grid-cols-3 gap-2 mt-2';
    
    urls.forEach((url, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'gallery-thumbnail relative cursor-pointer';
      thumb.innerHTML = `
        <img src="${url}" alt="Image ${index + 1}" 
             class="w-full h-24 object-cover rounded"
             onclick="ContentLibrary.MediaPreview.showFullImage('${url}')">
      `;
      gallery.appendChild(thumb);
    });
    
    container.appendChild(gallery);
  };

  /**
   * Show full-size image in modal
   * @param {string} url - Image URL
   */
  MediaPreview.showFullImage = function(url) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
    modal.onclick = function() { modal.remove(); };
    
    modal.innerHTML = `
      <img src="${url}" alt="Full size image" 
           class="max-w-full max-h-full rounded"
           onclick="event.stopPropagation()">
      <button class="absolute top-4 right-4 text-white text-3xl" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(modal);
  };

  /**
   * Extract thumbnail from video URL
   * @param {string} url - Video URL
   * @returns {string|null} Thumbnail URL or null
   */
  MediaPreview.getVideoThumbnail = function(url) {
    // YouTube
    const youtubeId = MediaPreview.extractYouTubeId(url);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    
    // Vimeo (requires API call, returning null for now)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      // Would need to make API call to get thumbnail
      return null;
    }
    
    return null;
  };

  // Expose MediaPreview
  window.ContentLibrary.MediaPreview = MediaPreview;

})(ContentLibrary.MediaPreview);