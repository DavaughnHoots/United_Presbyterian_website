-- Sample 5-Day Journey: "Finding Peace in Troubled Times"
-- This demonstrates how to use our existing content types to create a rich journey experience

-- First, create the journey
INSERT INTO journeys (id, title, description, duration_days, theme, is_published, created_by, "createdAt", "updatedAt")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Finding Peace in Troubled Times',
  'A 5-day journey to discover God''s peace in the midst of life''s storms. Through scripture, prayer, reflection, and creative activities, you''ll explore how to find stability and become a peacemaker.',
  5,
  'peace',
  true,
  (SELECT id FROM users WHERE "isAdmin" = true LIMIT 1),
  NOW(),
  NOW()
);

-- Create the 5 days
INSERT INTO journey_days (id, journey_id, day_number, title, description, "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 1, 
   'Recognizing the Storm', 
   'Today we acknowledge our anxieties and recognize God''s presence in the midst of our storms.',
   NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 2, 
   'The Anchor of Faith', 
   'Finding stability in God''s promises when everything around us feels uncertain.',
   NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 3, 
   'Voices of Comfort', 
   'Learning from others who found peace in difficult times.',
   NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 4, 
   'Creation Speaks Peace', 
   'Finding God''s peace reflected in the beauty of creation.',
   NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 5, 
   'Sharing the Peace', 
   'Becoming peacemakers in our communities and world.',
   NOW(), NOW());

-- DAY 1 CONTENT: Recognizing the Storm

-- 1. Scripture Reading: Matthew 8:23-27
INSERT INTO content (id, type, title, content, "biblePassage", theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440001',
  'scripture_reading',
  'Jesus Calms the Storm',
  'Then he got into the boat and his disciples followed him. Suddenly a furious storm came up on the lake, so that the waves swept over the boat. But Jesus was sleeping. The disciples went and woke him, saying, "Lord, save us! We''re going to drown!" He replied, "You of little faith, why are you so afraid?" Then he got up and rebuked the winds and the waves, and it was completely calm. The men were amazed and asked, "What kind of man is this? Even the winds and the waves obey him!"',
  'Matthew 8:23-27',
  'peace',
  ARRAY['storm', 'faith', 'fear', 'peace'],
  true,
  '{"day_theme": "Recognizing the Storm"}'::jsonb,
  5,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'scripture_reading',
  '650e8400-e29b-41d4-a716-446655440001',
  1,
  5,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 2. Artwork: Rembrandt's Storm
INSERT INTO content (id, type, title, content, artist, image_url, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440002',
  'artwork',
  'The Storm on the Sea of Galilee',
  'Rembrandt''s only seascape captures the dramatic moment when the disciples'' fear meets Christ''s calm authority. Notice how the light breaks through the dark storm clouds, symbolizing hope in chaos. The disciples'' faces show genuine terror, while Jesus remains serene. How does this painting reflect your own experiences of fear and faith?',
  'Rembrandt van Rijn (1633)',
  'https://upload.wikimedia.org/wikipedia/commons/f/f3/Rembrandt_Christ_in_the_Storm_on_the_Lake_of_Galilee.jpg',
  'peace',
  ARRAY['art', 'storm', 'faith', 'rembrandt'],
  true,
  '{"year": "1633", "medium": "Oil on canvas", "location": "Stolen from Isabella Stewart Gardner Museum"}'::jsonb,
  10,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'artwork',
  '650e8400-e29b-41d4-a716-446655440002',
  2,
  10,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 3. Video: Guided Breathing Prayer
INSERT INTO content (id, type, title, content, video_url, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440003',
  'video',
  '5-Minute Guided Breathing Prayer',
  'This calming breathing prayer helps you center your thoughts on God''s presence. As you breathe in, imagine breathing in God''s peace. As you breathe out, release your anxieties to Him.',
  'https://www.youtube.com/watch?v=example', -- Replace with actual video
  'peace',
  ARRAY['breathing', 'prayer', 'meditation', 'calm'],
  true,
  '{"type": "guided_meditation", "focus": "anxiety_relief"}'::jsonb,
  5,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'video',
  '650e8400-e29b-41d4-a716-446655440003',
  3,
  5,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 4. Journaling Prompt
INSERT INTO content (id, type, title, content, prompts, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440004',
  'journaling_prompt',
  'Identifying Your Storms',
  'Take time to honestly reflect on the storms in your life right now.',
  ARRAY[
    'What storms are you facing today?',
    'Which of these storms feel most overwhelming?',
    'Where do you see God in the midst of these challenges?',
    'What would it look like for Jesus to calm your storm?'
  ],
  'peace',
  ARRAY['reflection', 'storms', 'anxiety', 'faith'],
  true,
  '{"day": 1}'::jsonb,
  15,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'journaling_prompt',
  '650e8400-e29b-41d4-a716-446655440004',
  4,
  15,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 5. Evening Prayer
INSERT INTO content (id, type, title, content, artist, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440005',
  'prayer',
  'Traditional Presbyterian Prayer for Peace',
  'Almighty God, from whom all thoughts of truth and peace proceed: kindle, we pray, in the hearts of all, the true love of peace; and guide with your pure and peaceable wisdom those who take counsel for the nations of the earth; that in tranquility your kingdom may go forward, till the earth is filled with the knowledge of your love; through Jesus Christ our Lord. Amen.',
  'Book of Common Worship',
  'peace',
  ARRAY['prayer', 'traditional', 'presbyterian', 'evening'],
  true,
  '{"prayer_type": "evening", "source": "Book of Common Worship"}'::jsonb,
  3,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'prayer',
  '650e8400-e29b-41d4-a716-446655440005',
  5,
  3,
  '{}'::jsonb,
  NOW(), NOW()
);

-- DAY 2 CONTENT: The Anchor of Faith

-- 1. Scripture Reading: Hebrews 6:13-20
INSERT INTO content (id, type, title, content, "biblePassage", theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440006',
  'scripture_reading',
  'Hope as an Anchor',
  'When God made his promise to Abraham, since there was no one greater for him to swear by, he swore by himself, saying, "I will surely bless you and give you many descendants." And so after waiting patiently, Abraham received what was promised... We have this hope as an anchor for the soul, firm and secure.',
  'Hebrews 6:13-20',
  'peace',
  ARRAY['hope', 'anchor', 'promise', 'faith'],
  true,
  '{"day_theme": "The Anchor of Faith"}'::jsonb,
  5,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002',
  'scripture_reading',
  '650e8400-e29b-41d4-a716-446655440006',
  1,
  5,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 2. Hymn: It Is Well with My Soul
INSERT INTO content (id, type, title, content, "youtubeId", artist, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440007',
  'hymn',
  'It Is Well with My Soul',
  'When peace like a river attendeth my way,
When sorrows like sea billows roll;
Whatever my lot, Thou hast taught me to say,
"It is well, it is well with my soul."

It is well with my soul,
It is well, it is well with my soul.',
  'dQw4w9WgXcQ', -- Replace with actual hymn video ID
  'Horatio Spafford (1873)',
  'peace',
  ARRAY['hymn', 'traditional', 'peace', 'faith'],
  true,
  '{"story": "Written by Horatio Spafford after the tragic loss of his four daughters in a shipwreck. His faith remained unshaken.", "year": "1873"}'::jsonb,
  5,
  NOW(), NOW()
);

INSERT INTO journey_content (id, journey_day_id, content_type, content_id, order_index, duration_minutes, metadata, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002',
  'hymn',
  '650e8400-e29b-41d4-a716-446655440007',
  2,
  5,
  '{}'::jsonb,
  NOW(), NOW()
);

-- 3. Historical Context (as reflection)
INSERT INTO content (id, type, title, content, theme, tags, "isActive", metadata, duration_minutes, "createdAt", "updatedAt")
VALUES (
  '650e8400-e29b-41d4-a716-446655440008',
  'reflection',
  'The Story Behind "It Is Well"',
  'In 1873, Horatio Spafford planned a European trip with his family. Last-minute business kept him in Chicago, but he sent his wife and four daughters ahead. Their ship, the SS Ville du Havre, collided with another vessel and sank. All four daughters perished. His wife''s telegram read simply: "Saved alone."

On his voyage to meet his grieving wife, Spafford penned these immortal words as his ship passed near where his daughters died. His profound faith in the midst of unimaginable loss continues to inspire believers facing their own storms.',
  'peace',
  ARRAY['history', 'faith', 'tragedy', 'hope'],
  true,
  '{"content_type": "historical_context", "related_to": "It Is Well with My Soul"}'::jsonb,
  8,
  NOW(), NOW()
);

-- Continue with more content for Days 2-5...
-- This demonstrates the pattern for creating journey content

-- Note: For interactive elements we don't yet support (like maps, photo uploads, comments),
-- we can use the metadata field to store information and implement the UI features later:

-- Example of storing map data in metadata:
-- '{"interactive_map": {"location": "Sea of Galilee", "coordinates": [32.8098, 35.5907], "description": "Where Jesus walked on water"}}'::jsonb

-- Example of action challenge in metadata:
-- '{"action_challenge": {"task": "Text or call someone who might need encouragement", "track_completion": true}}'::jsonb