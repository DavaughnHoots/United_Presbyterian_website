-- Add multimedia columns to content table
-- Run this on Heroku PostgreSQL database

-- Add new columns if they don't exist
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS artist VARCHAR(255);

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS video_url VARCHAR(255);

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS audio_url VARCHAR(255);

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS instructions TEXT;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS prompts TEXT[];

-- Update the type enum to include new content types
-- First, check current types with: SELECT unnest(enum_range(NULL::enum_content_type));
-- If the new types aren't there, you'll need to recreate the enum

-- Option 1: If you can drop and recreate the column (data loss warning!)
-- ALTER TABLE content ALTER COLUMN type TYPE VARCHAR(255);
-- DROP TYPE IF EXISTS enum_content_type;
-- CREATE TYPE enum_content_type AS ENUM (
--   'reading', 'prayer', 'music', 'question',
--   'hymn', 'creed', 'reflection', 'scripture_reading',
--   'artwork', 'video', 'journaling_prompt', 'guided_prayer',
--   'breathing_exercise'
-- );
-- ALTER TABLE content ALTER COLUMN type TYPE enum_content_type USING type::enum_content_type;

-- Option 2: Add new enum values (safer, if your PostgreSQL version supports it)
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'scripture_reading';
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'artwork';
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'journaling_prompt';
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'guided_prayer';
ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'breathing_exercise';