# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running
- Git (optional)

## Setup Steps

### 1. Install PostgreSQL (if not installed)
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE upc_database;

# Exit
\q
```

### 3. Update Environment Variables
Edit `.env` file with your PostgreSQL credentials:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/upc_database
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations
```bash
npm run migrate
```

### 6. Start the Development Server
```bash
npm run dev
```

The website will be available at http://localhost:3000

## Alternative: Using SQLite for Testing

If you want to test without PostgreSQL, you can use SQLite:

1. Install SQLite adapter:
```bash
npm install sqlite3
```

2. Update `.env`:
```
DATABASE_URL=sqlite:./database.sqlite
```

3. Update `src/config/database.js` to support SQLite (see below)

## Test Without Database

To quickly test the UI without a database:

1. Comment out database initialization in `src/server.js`
2. Run: `npm start`

## Common Issues

### Port Already in Use
Change the port in `.env`:
```
PORT=3001
```

### Database Connection Failed
1. Ensure PostgreSQL is running:
   - Windows: Check Services
   - Mac/Linux: `pg_ctl status` or `sudo service postgresql status`

2. Verify credentials:
   ```bash
   psql -U postgres -h localhost
   ```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps
1. Visit http://localhost:3000
2. Click "Register" to create an account
3. Explore the daily content section
4. Test anonymous submissions