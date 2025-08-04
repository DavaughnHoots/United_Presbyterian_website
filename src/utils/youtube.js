const axios = require('axios');

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
function extractYouTubeId(url) {
  if (!url) return null;
  
  // Regular expression to match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^#&?]*).*/,
    /^([^#&?]*).*/  // Just the ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  
  // Check if it's just an 11-character ID
  if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  
  return null;
}

/**
 * Format duration from ISO 8601 to minutes
 * @param {string} duration - ISO 8601 duration (e.g., PT4M35S)
 * @returns {number} - Duration in minutes
 */
function parseDuration(duration) {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return Math.round(hours * 60 + minutes + seconds / 60);
}

/**
 * Fetch video metadata from YouTube API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} - Video metadata or null if error
 */
async function fetchYouTubeMetadata(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('YouTube API key not configured');
    return null;
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
        key: apiKey
      }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      
      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        duration: parseDuration(contentDetails.duration),
        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
        tags: snippet.tags || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error.message);
    return null;
  }
}

/**
 * Extract YouTube URL from text and fetch metadata
 * @param {string} text - Text that may contain YouTube URL
 * @returns {Promise<Object|null>} - Video metadata or null
 */
async function extractAndFetchYouTubeData(text) {
  if (!text) return null;
  
  // Find YouTube URL in text
  const urlMatch = text.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/[^\s]+)/);
  if (!urlMatch) return null;
  
  const url = urlMatch[0];
  const videoId = extractYouTubeId(url);
  
  if (!videoId) return null;
  
  const metadata = await fetchYouTubeMetadata(videoId);
  if (metadata) {
    metadata.url = url;
  }
  
  return metadata;
}

module.exports = {
  extractYouTubeId,
  fetchYouTubeMetadata,
  extractAndFetchYouTubeData,
  parseDuration
};