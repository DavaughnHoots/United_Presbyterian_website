#!/bin/bash

echo "Running content unification migrations..."

# Run the migrations
echo "1. Expanding Content model types..."
npx sequelize-cli db:migrate --name 20250802000000-expand-content-types.js

echo "2. Migrating prayers to content table..."
npx sequelize-cli db:migrate --name 20250802000001-migrate-prayers-to-content.js

echo "Migrations complete!"
echo ""
echo "You can now commit these changes and deploy to Heroku."
echo "The system will now use the unified Content model for all content types."