# Quick Database Setup - PostgreSQL

## 🚀 Fastest Way: Use Neon (Free Cloud Database)

### Step 1: Create Free Database (2 minutes)

1. Go to **https://neon.tech**
2. Click "Sign Up" (free account)
3. Click "Create Project"
4. Choose a project name (e.g., "PeoplePilot")
5. Select a region close to you
6. Click "Create Project"

### Step 2: Get Connection String

1. After project creation, you'll see a connection string like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
2. Copy this connection string

### Step 3: Update .env File

1. Open the `.env` file in the project root
2. Replace the `DATABASE_URL` line with your Neon connection string:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Save the file

### Step 4: Test Connection

```bash
npm run db:test
```

You should see: ✅ Successfully connected to PostgreSQL!

### Step 5: Create Tables

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### Step 6: Start Application

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

---

## Alternative: Other Free PostgreSQL Options

### Supabase
- Go to https://supabase.com
- Create account and project
- Get connection string from Settings > Database

### Railway
- Go to https://railway.app
- Create account
- Add PostgreSQL database
- Get connection string from database settings

---

## Local PostgreSQL (If You Want to Install)

1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Create database:
   ```sql
   CREATE DATABASE peoplepilot;
   ```
5. Update .env:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/peoplepilot
   ```

---

## Need Help?

- Check `DATABASE_SETUP.md` for detailed instructions
- Run `npm run db:test` to verify your connection
- Make sure your `.env` file has the correct `DATABASE_URL`

