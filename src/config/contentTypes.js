/**
 * Content Type Configuration
 * Defines metadata, fields, and UI configurations for each content type
 */

const contentTypes = {
  scripture_reading: {
    name: 'Scripture Reading',
    pluralName: 'Scripture Readings',
    dbType: 'scripture_reading',
    icon: 'fa-bible',
    color: 'purple',
    urlSlug: 'scripture-readings',
    description: 'Bible passages and readings',
    fields: {
      title: { required: true, label: 'Title', type: 'text', placeholder: 'e.g., The Good Samaritan' },
      biblePassage: { required: true, label: 'Bible Passage', type: 'text', placeholder: 'e.g., Luke 10:25-37' },
      content: { required: true, label: 'Scripture Text', type: 'textarea', rows: 10 },
      theme: { required: false, label: 'Theme', type: 'text', placeholder: 'e.g., Compassion, Love' },
      season: { required: false, label: 'Liturgical Season', type: 'select', options: ['Advent', 'Christmas', 'Epiphany', 'Lent', 'Easter', 'Pentecost', 'Ordinary Time'] },
      tags: { required: false, label: 'Tags', type: 'text', placeholder: 'Comma-separated tags' },
      audio_url: { required: false, label: 'Audio Recording', type: 'url', placeholder: 'https://example.com/audio.mp3' }
    },
    categories: ['Old Testament', 'New Testament', 'Psalms', 'Prophets', 'Gospels', 'Epistles', 'Other']
  },
  
  hymn: {
    name: 'Hymn',
    pluralName: 'Hymns',
    dbType: 'hymn',
    icon: 'fa-music',
    color: 'green',
    urlSlug: 'hymns',
    description: 'Hymns and spiritual songs',
    fields: {
      title: { required: true, label: 'Hymn Title', type: 'text' },
      content: { required: true, label: 'Lyrics', type: 'textarea', rows: 12 },
      artist: { required: false, label: 'Composer/Author', type: 'text' },
      hymnalNumber: { required: false, label: 'Hymnal Number', type: 'text', metadata: true },
      tune: { required: false, label: 'Tune Name', type: 'text', metadata: true },
      meter: { required: false, label: 'Meter', type: 'text', placeholder: 'e.g., 8.7.8.7', metadata: true },
      theme: { required: false, label: 'Theme', type: 'text' },
      season: { required: false, label: 'Season', type: 'select', options: ['Advent', 'Christmas', 'Epiphany', 'Lent', 'Easter', 'Pentecost', 'General'] },
      youtubeId: { required: false, label: 'YouTube Video ID', type: 'text', placeholder: 'e.g., dQw4w9WgXcQ' },
      audio_url: { required: false, label: 'Audio URL', type: 'url' },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Traditional', 'Contemporary', 'Gospel', 'Praise', 'Worship', 'Children', 'Seasonal', 'Other']
  },
  
  journaling_prompt: {
    name: 'Journaling Prompt',
    pluralName: 'Journaling Prompts',
    dbType: 'journaling_prompt',
    icon: 'fa-pen-fancy',
    color: 'blue',
    urlSlug: 'journaling-prompts',
    description: 'Reflection and journaling prompts',
    fields: {
      title: { required: true, label: 'Prompt Title', type: 'text' },
      content: { required: true, label: 'Introduction/Context', type: 'textarea', rows: 4 },
      prompts: { required: true, label: 'Journal Questions', type: 'array', placeholder: 'Add reflection questions...', metadata: false },
      theme: { required: false, label: 'Theme', type: 'text' },
      scripture_reference: { required: false, label: 'Scripture Reference', type: 'text', metadata: true },
      duration_minutes: { required: false, label: 'Suggested Duration (minutes)', type: 'number', default: 15 },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Self-Reflection', 'Gratitude', 'Prayer', 'Scripture Study', 'Life Events', 'Spiritual Growth', 'Relationships', 'Other']
  },
  
  guided_prayer: {
    name: 'Guided Prayer',
    pluralName: 'Guided Prayers',
    dbType: 'guided_prayer',
    icon: 'fa-hands',
    color: 'yellow',
    urlSlug: 'guided-prayers',
    description: 'Interactive and guided prayer experiences',
    fields: {
      title: { required: true, label: 'Prayer Title', type: 'text' },
      content: { required: true, label: 'Prayer Text', type: 'textarea', rows: 8 },
      instructions: { required: true, label: 'Instructions/Guidance', type: 'textarea', rows: 4 },
      duration_minutes: { required: true, label: 'Duration (minutes)', type: 'number', default: 10 },
      theme: { required: false, label: 'Theme', type: 'text' },
      audio_url: { required: false, label: 'Audio Guide URL', type: 'url' },
      pausePoints: { required: false, label: 'Pause Points', type: 'array', metadata: true, placeholder: 'Add moments for silent reflection...' },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Centering', 'Contemplative', 'Intercessory', 'Thanksgiving', 'Confession', 'Healing', 'Lectio Divina', 'Other']
  },
  
  reflection: {
    name: 'Reflection',
    pluralName: 'Reflections',
    dbType: 'reflection',
    icon: 'fa-lightbulb',
    color: 'orange',
    urlSlug: 'reflections',
    description: 'Spiritual reflections and meditations',
    fields: {
      title: { required: true, label: 'Reflection Title', type: 'text' },
      content: { required: true, label: 'Reflection Text', type: 'textarea', rows: 10 },
      author: { required: false, label: 'Author', type: 'text', metadata: true },
      scripture_reference: { required: false, label: 'Scripture Reference', type: 'text', metadata: true },
      theme: { required: false, label: 'Theme', type: 'text' },
      season: { required: false, label: 'Season', type: 'select', options: ['Advent', 'Christmas', 'Epiphany', 'Lent', 'Easter', 'Pentecost', 'Ordinary Time'] },
      discussion_questions: { required: false, label: 'Discussion Questions', type: 'array', metadata: true },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Daily Life', 'Faith Journey', 'Biblical', 'Seasonal', 'Social Justice', 'Personal Growth', 'Community', 'Other']
  },
  
  artwork: {
    name: 'Artwork',
    pluralName: 'Artwork',
    dbType: 'artwork',
    icon: 'fa-palette',
    color: 'pink',
    urlSlug: 'artwork',
    description: 'Sacred art and visual meditations',
    fields: {
      title: { required: true, label: 'Artwork Title', type: 'text' },
      artist: { required: true, label: 'Artist Name', type: 'text' },
      image_url: { required: true, label: 'Image URL', type: 'url' },
      content: { required: true, label: 'Description/Reflection', type: 'textarea', rows: 6 },
      medium: { required: false, label: 'Medium', type: 'text', placeholder: 'e.g., Oil on canvas', metadata: true },
      year: { required: false, label: 'Year Created', type: 'text', metadata: true },
      scripture_reference: { required: false, label: 'Related Scripture', type: 'text', metadata: true },
      theme: { required: false, label: 'Theme', type: 'text' },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Icon', 'Painting', 'Sculpture', 'Stained Glass', 'Digital Art', 'Photography', 'Calligraphy', 'Other']
  },
  
  video: {
    name: 'Video',
    pluralName: 'Videos',
    dbType: 'video',
    icon: 'fa-video',
    color: 'red',
    urlSlug: 'videos',
    description: 'Video content and visual meditations',
    fields: {
      title: { required: true, label: 'Video Title', type: 'text' },
      video_url: { required: true, label: 'Video URL', type: 'url', placeholder: 'YouTube, Vimeo, or direct link' },
      content: { required: true, label: 'Description', type: 'textarea', rows: 4 },
      duration_minutes: { required: true, label: 'Duration (minutes)', type: 'number' },
      speaker: { required: false, label: 'Speaker/Creator', type: 'text', metadata: true },
      transcript: { required: false, label: 'Transcript', type: 'textarea', rows: 8, metadata: true },
      theme: { required: false, label: 'Theme', type: 'text' },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Sermon', 'Teaching', 'Testimony', 'Worship', 'Documentary', 'Animation', 'Youth', 'Other']
  },
  
  creed: {
    name: 'Creed',
    pluralName: 'Creeds',
    dbType: 'creed',
    icon: 'fa-scroll',
    color: 'gray',
    urlSlug: 'creeds',
    description: 'Statements of faith and belief',
    fields: {
      title: { required: true, label: 'Creed Name', type: 'text' },
      content: { required: true, label: 'Creed Text', type: 'textarea', rows: 10 },
      origin: { required: false, label: 'Origin/History', type: 'textarea', rows: 3, metadata: true },
      usage: { required: false, label: 'When Used', type: 'text', placeholder: 'e.g., Sunday worship, baptisms', metadata: true },
      denomination: { required: false, label: 'Denomination', type: 'text', metadata: true },
      tags: { required: false, label: 'Tags', type: 'text' }
    },
    categories: ['Ecumenical', 'Reformed', 'Presbyterian', 'Historic', 'Contemporary', 'Liturgical', 'Personal', 'Other']
  }
};

// Helper functions
const getContentType = (dbType) => {
  return Object.values(contentTypes).find(ct => ct.dbType === dbType);
};

const getContentTypeBySlug = (slug) => {
  return Object.values(contentTypes).find(ct => ct.urlSlug === slug);
};

const getColorClass = (color) => {
  const colorMap = {
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    orange: 'text-orange-600 bg-orange-100',
    pink: 'text-pink-600 bg-pink-100',
    red: 'text-red-600 bg-red-100',
    gray: 'text-gray-600 bg-gray-100'
  };
  return colorMap[color] || colorMap.gray;
};

module.exports = {
  contentTypes,
  getContentType,
  getContentTypeBySlug,
  getColorClass
};