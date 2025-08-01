'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add audio_url column for audio content
    await queryInterface.addColumn('content', 'audio_url', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'video_url' // Place it after video_url
    });

    // Add example of audio content for demonstration
    await queryInterface.sequelize.query(`
      INSERT INTO content (
        id, type, title, content, audio_url, theme, tags, 
        "isActive", metadata, duration_minutes, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        'guided_prayer',
        'Psalm 23 in Hebrew and English',
        'Experience the beauty of Psalm 23 read first in its original Hebrew, then in English. Let the ancient words wash over you with their timeless message of God as our shepherd.',
        'https://example.com/psalm23-hebrew-english.mp3',
        'peace',
        ARRAY['psalm', 'hebrew', 'audio', 'scripture'],
        true,
        '{"languages": ["Hebrew", "English"], "narrator": "Presbyterian Pastor"}'::jsonb,
        5,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the audio_url column
    await queryInterface.removeColumn('content', 'audio_url');
  }
};