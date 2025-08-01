# Content System Migration Steps

## Current Status
I've applied a temporary fix by commenting out the new fields in the Content model. This will allow the site to function while we prepare to run the migrations properly.

## Next Steps to Complete Migration

### 1. Push changes to GitHub and Heroku
```bash
# Push to GitHub
git push origin main

# Deploy to Heroku
git push heroku main
```

### 2. Run Migrations on Heroku

First, check migration status:
```bash
heroku run npx sequelize-cli db:migrate:status
```

Then run the migrations in order:
```bash
# Expand content types
heroku run npx sequelize-cli db:migrate --name 20250802000000-expand-content-types.js

# Migrate prayers to content table
heroku run npx sequelize-cli db:migrate --name 20250802000001-migrate-prayers-to-content.js
```

### 3. Verify Migration Success

Check if prayers were migrated:
```bash
heroku run rails console
# In console:
SELECT COUNT(*) FROM content WHERE type = 'prayer';
```

### 4. Uncomment the Model Fields

After migrations are successful, uncomment:
1. In `/src/models/Content.js`:
   - The new enum types (hymn, creed, reflection, etc.)
   - The new fields (duration_minutes, artist, image_url, etc.)

2. In `/src/routes/admin.js`:
   - Uncomment the new fields in create and update endpoints

3. In `/views/pages/admin/journey-editor.ejs`:
   - Uncomment duration_minutes in prayer creation

### 5. Deploy Final Version
```bash
git add -A
git commit -m "Re-enable new Content fields after migration"
git push origin main
git push heroku main
```

## What This Migration Does

1. **Expands Content Types**: Adds new types like hymn, creed, artwork, video, etc.
2. **Adds New Fields**: Adds duration_minutes, artist, image_url, video_url, instructions, prompts
3. **Migrates Prayer Data**: Copies all prayers from the `prayers` table to the `content` table
4. **Unifies Content**: Makes all content available from a single source

## Benefits After Migration

- Prayers created in Daily Content Manager will appear in Journey Editor
- All content types can be managed from one place
- Content can be reused across different features
- Simplified content management

## Troubleshooting

If migrations fail:
1. Check Heroku logs: `heroku logs --tail`
2. Try running migrations one at a time
3. If enum type errors occur, you may need to manually update the enum in PostgreSQL:
   ```sql
   ALTER TYPE enum_content_type ADD VALUE 'hymn';
   ALTER TYPE enum_content_type ADD VALUE 'creed';
   -- etc for each new type
   ```