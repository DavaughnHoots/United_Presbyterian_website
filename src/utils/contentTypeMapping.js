// Content Type Mapping Utility
// Maps legacy content types to new unified types

const TYPE_MAPPINGS = {
  // Legacy to new mappings
  'reading': 'scripture_reading',
  'music': 'hymn',
  'question': 'journaling_prompt',
  
  // Keep existing types
  'prayer': 'prayer',
  
  // New types (no mapping needed)
  'scripture_reading': 'scripture_reading',
  'hymn': 'hymn',
  'journaling_prompt': 'journaling_prompt',
  'guided_prayer': 'guided_prayer',
  'reflection': 'reflection',
  'artwork': 'artwork',
  'video': 'video',
  'creed': 'creed'
};

// Reverse mappings for backward compatibility
const REVERSE_MAPPINGS = {
  'scripture_reading': 'reading',
  'hymn': 'music',
  'journaling_prompt': 'question'
};

// Display names for content types
const TYPE_DISPLAY_NAMES = {
  'scripture_reading': 'Scripture Reading',
  'prayer': 'Prayer',
  'hymn': 'Hymn',
  'journaling_prompt': 'Journaling Prompt',
  'guided_prayer': 'Guided Prayer',
  'reflection': 'Reflection',
  'artwork': 'Artwork',
  'video': 'Video',
  'creed': 'Creed',
  // Legacy types
  'reading': 'Bible Reading',
  'music': 'Music',
  'question': 'Reflection Question'
};

// Icons for content types
const TYPE_ICONS = {
  'scripture_reading': 'fa-book-bible',
  'prayer': 'fa-praying-hands',
  'hymn': 'fa-music',
  'journaling_prompt': 'fa-pencil-alt',
  'guided_prayer': 'fa-headphones',
  'reflection': 'fa-pen',
  'artwork': 'fa-image',
  'video': 'fa-video',
  'creed': 'fa-scroll',
  // Legacy types
  'reading': 'fa-book-bible',
  'music': 'fa-music',
  'question': 'fa-question-circle'
};

/**
 * Map a legacy content type to the new unified type
 * @param {string} legacyType - The legacy content type
 * @returns {string} The new unified content type
 */
function mapLegacyType(legacyType) {
  return TYPE_MAPPINGS[legacyType] || legacyType;
}

/**
 * Get the legacy type for backward compatibility
 * @param {string} newType - The new unified content type
 * @returns {string} The legacy content type if mapping exists
 */
function getLegacyType(newType) {
  return REVERSE_MAPPINGS[newType] || newType;
}

/**
 * Get display name for a content type
 * @param {string} type - The content type
 * @returns {string} The display name
 */
function getTypeDisplayName(type) {
  return TYPE_DISPLAY_NAMES[type] || type.replace(/_/g, ' ').split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get icon class for a content type
 * @param {string} type - The content type
 * @returns {string} The Font Awesome icon class
 */
function getTypeIcon(type) {
  return TYPE_ICONS[type] || 'fa-file';
}

/**
 * Check if a type is a legacy type
 * @param {string} type - The content type
 * @returns {boolean} True if it's a legacy type
 */
function isLegacyType(type) {
  return ['reading', 'music', 'question'].includes(type);
}

/**
 * Get all available content types (new unified types)
 * @returns {string[]} Array of content types
 */
function getAllContentTypes() {
  return [
    'scripture_reading',
    'prayer',
    'hymn',
    'journaling_prompt',
    'guided_prayer',
    'reflection',
    'artwork',
    'video',
    'creed'
  ];
}

module.exports = {
  mapLegacyType,
  getLegacyType,
  getTypeDisplayName,
  getTypeIcon,
  isLegacyType,
  getAllContentTypes,
  TYPE_MAPPINGS,
  REVERSE_MAPPINGS,
  TYPE_DISPLAY_NAMES,
  TYPE_ICONS
};