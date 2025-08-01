# Journey Content Creation Guide

## Overview
Our unified content system supports creating rich, multimedia spiritual journeys. This guide shows how to map various content types to our system.

## Content Type Mapping

### ✅ Directly Supported Content Types

1. **Scripture Reading** (`scripture_reading`)
   - Full Bible passages with context
   - Use `biblePassage` field for reference
   - Can include study notes in `content` field

2. **Prayer** (`prayer`)
   - Traditional prayers
   - Contemporary prayers
   - Use `artist` field for author/source

3. **Guided Prayer** (`guided_prayer`)
   - Audio-guided meditations
   - Video prayer experiences
   - Use `audio_url` or `video_url` fields
   - Include transcript in `content` field

4. **Hymn** (`hymn`)
   - Traditional hymns with lyrics
   - Contemporary worship songs
   - Use `youtubeId` for music videos
   - Use `artist` for composer/author

5. **Artwork** (`artwork`)
   - Paintings, sculptures, religious art
   - Use `image_url` for artwork
   - Use `artist` for creator
   - Include reflection in `content` field

6. **Video** (`video`)
   - Teaching videos
   - Testimonies
   - Nature/worship videos
   - Use `video_url` field

7. **Journaling Prompt** (`journaling_prompt`)
   - Reflection questions
   - Writing prompts
   - Use `prompts` array for multiple questions

8. **Reflection** (`reflection`)
   - Devotional thoughts
   - Historical context
   - Poetry
   - Articles

## Creative Content Adaptations

### Historical Context → Reflection
```javascript
{
  type: 'reflection',
  title: 'The Story Behind "It Is Well"',
  content: 'Historical narrative...',
  metadata: {
    content_subtype: 'historical_context',
    related_to: 'hymn_id'
  }
}
```

### Poetry → Reflection
```javascript
{
  type: 'reflection',
  title: 'God\'s Grandeur',
  content: 'Poetry text...',
  artist: 'Gerard Manley Hopkins',
  metadata: {
    content_subtype: 'poetry',
    year: '1877'
  }
}
```

### Action Challenge → Journaling Prompt
```javascript
{
  type: 'journaling_prompt',
  title: 'Sharing Encouragement',
  content: 'Today\'s challenge: Reach out to someone who needs encouragement',
  prompts: [
    'Who comes to mind that might need encouragement?',
    'What message will you share with them?',
    'How did it feel to reach out?'
  ],
  metadata: {
    action_challenge: true,
    track_completion: true
  }
}
```

### Interactive Elements (Using Metadata)

1. **Maps**
```javascript
metadata: {
  interactive_map: {
    location: 'Sea of Galilee',
    coordinates: [32.8098, 35.5907],
    description: 'Where Jesus walked on water'
  }
}
```

2. **Photo Galleries**
```javascript
metadata: {
  gallery_images: [
    { url: 'image1.jpg', caption: 'Church in Scotland' },
    { url: 'image2.jpg', caption: 'Church in Kenya' }
  ]
}
```

3. **External Resources**
```javascript
metadata: {
  external_resources: [
    { type: 'pdf', url: 'worksheet.pdf', title: 'Reflection Worksheet' },
    { type: 'link', url: 'https://...', title: 'Further Reading' }
  ]
}
```

## Sample Journey Day Structure

```javascript
// Day 1: 5 content pieces, ~40 minutes total
1. Scripture Reading (5 min) - Matthew 8:23-27
2. Artwork (10 min) - Rembrandt's Storm painting with reflection
3. Video (5 min) - Guided breathing prayer
4. Journaling Prompt (15 min) - "What storms are you facing?"
5. Prayer (5 min) - Traditional evening prayer
```

## Best Practices

1. **Vary Content Types** - Mix different types for engagement
2. **Consider Time** - Balance short and long content
3. **Progressive Difficulty** - Start simple, build depth
4. **Action Steps** - Include practical applications
5. **Multimedia Balance** - Don't overwhelm with too much media

## Using the Metadata Field

The `metadata` field (JSONB) allows infinite extensibility:

```javascript
metadata: {
  // Grouping
  day_theme: 'Finding Peace',
  content_group: 'morning_devotion',
  
  // Enhanced features
  discussion_questions: [...],
  leader_notes: '...',
  
  // Future features
  vr_experience_id: '...',
  ar_markers: [...],
  
  // Analytics
  recommended_time: '7:00 AM',
  difficulty_level: 'beginner'
}
```

## Future Enhancements

While not yet implemented, these features can be added:

1. **User Uploads** - Photo/video responses
2. **Social Features** - Comments, sharing
3. **Progress Tracking** - Completion badges
4. **Adaptive Content** - Based on user preferences
5. **Multi-language** - Translations

## Creating Your First Journey

1. Plan your theme and daily topics
2. Gather/create content for each type
3. Upload content via Content Manager
4. Build journey in Journey Editor
5. Test with a small group
6. Launch to congregation

Remember: The goal is spiritual growth, not technical complexity. Start simple and expand based on user feedback.