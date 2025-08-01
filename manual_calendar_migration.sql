-- Manual migration for calendar fields
-- Run these commands in Heroku Postgres console

-- Add slug field for URL-friendly identifiers
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Add external URL field for reference links
ALTER TABLE events ADD COLUMN IF NOT EXISTS "externalUrl" VARCHAR(255);

-- Add categories field (JSON array) for multiple categories
ALTER TABLE events ADD COLUMN IF NOT EXISTS categories JSON DEFAULT '[]'::json;

-- Add source field to track where event came from
ALTER TABLE events ADD COLUMN IF NOT EXISTS source VARCHAR(255) DEFAULT 'user';

-- Add importId field for tracking imported events
ALTER TABLE events ADD COLUMN IF NOT EXISTS "importId" VARCHAR(255) UNIQUE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('slug', 'externalUrl', 'categories', 'source', 'importId')
ORDER BY column_name;