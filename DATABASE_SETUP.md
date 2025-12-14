# PostgreSQL Database Setup Guide

## Quick Setup Options

### Option A: Local PostgreSQL (If you have it installed)

1. **Create Database:**
   ```sql
   CREATE DATABASE peoplepilot;
   ```

2. **Update .env file:**
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/peoplepilot
   ```

### Option B: Free Cloud PostgreSQL (Recommended - Easiest)

#### Using Neon (Free Tier)
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string
5. Update `.env` file with the connection string

#### Using Supabase (Free Tier)
1. Go to https://supabase.com
2. Sign up and create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update `.env` file

#### Using Railway (Free Tier)
1. Go to https://railway.app
2. Sign up and create a new PostgreSQL database
3. Copy the connection string
4. Update `.env` file

## After Database Setup

1. **Run migrations:**
   ```bash
   npm run db:push
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open http://localhost:5000 in your browser

## Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:mypassword@localhost:5432/peoplepilot
```

