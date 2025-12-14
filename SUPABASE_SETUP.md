# Supabase Database Setup Guide

Follow these steps to set up your PostgreSQL database on Supabase.

## Step 1: Create a New Project in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in with your account

2. **Create New Project**
   - Click the **"New Project"** button (or "Create a new project")
   - Fill in the project details:
     - **Name**: `PeoplePilot` (or any name you prefer)
     - **Database Password**: Create a strong password (save this - you'll need it!)
     - **Region**: Choose the region closest to you for better performance
     - **Pricing Plan**: Select "Free" (perfect for development)

3. **Wait for Project Creation**
   - Supabase will provision your database (takes 1-2 minutes)
   - You'll see a progress indicator

## Step 2: Get Your Connection String

1. **Navigate to Database Settings**
   - In your project dashboard, click on **"Settings"** (gear icon) in the left sidebar
   - Click on **"Database"** in the settings menu

2. **Find Connection String**
   - Scroll down to the **"Connection string"** section
   - You'll see different connection string formats
   - Look for the **"URI"** tab (or "Connection pooling" → "Transaction" mode)
   - Copy the connection string that looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```

3. **Replace Password in Connection String**
   - The connection string will have `[YOUR-PASSWORD]` placeholder
   - Replace `[YOUR-PASSWORD]` with the actual password you set when creating the project
   - Example:
     ```
     postgresql://postgres:MySecurePassword123@db.xxxxx.supabase.co:5432/postgres
     ```

## Step 3: Update Your .env File

1. **Open your `.env` file** in the project root directory

2. **Update the DATABASE_URL**
   - Find the line that says `DATABASE_URL=...`
   - Replace it with your Supabase connection string:
     ```env
     DATABASE_URL=postgresql://postgres:YourPasswordHere@db.xxxxx.supabase.co:5432/postgres
     ```
   - Make sure there are no spaces around the `=` sign
   - Make sure the password is correctly inserted (no brackets)

3. **Save the file**

## Step 4: Test the Connection

Run this command to test if your connection works:

```bash
npm run db:test
```

You should see:
```
✅ Successfully connected to PostgreSQL!
   Version: PostgreSQL 15.x
   Database: postgres
```

If you see an error, check:
- Password is correct in the connection string
- No extra spaces in the `.env` file
- Connection string format is correct

## Step 5: Create Database Tables

Once the connection test passes, create all the necessary tables:

```bash
npm run db:push
```

This will create all the tables needed for the PeoplePilot application.

## Step 6: Start Your Application

```bash
npm run dev
```

Your application will be available at: **http://localhost:5000**

---

## Troubleshooting

### Connection Error: "password authentication failed"
- Double-check your password in the connection string
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password

### Connection Error: "ECONNREFUSED" or "timeout"
- Verify your connection string is correct
- Check if your Supabase project is active (not paused)
- Free tier projects pause after inactivity - wake it up in the dashboard

### SSL/TLS Errors
- Supabase requires SSL connections
- The code automatically handles SSL for Supabase connections
- If you still see SSL errors, make sure your connection string includes `?sslmode=require`

### Can't Find Connection String
- Go to: Settings → Database → Connection string
- Make sure you're looking at the "URI" format (not "JDBC" or "psql")
- Use the "Transaction" mode connection string (not "Session" mode)

---

## Next Steps

After your database is set up:
1. ✅ Test connection: `npm run db:test`
2. ✅ Create tables: `npm run db:push`
3. ✅ Start app: `npm run dev`
4. ✅ Register your first admin user at http://localhost:5000/register

