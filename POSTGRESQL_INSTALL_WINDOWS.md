# PostgreSQL Installation Guide for Windows

## Step 1: Download PostgreSQL

1. Go to **https://www.postgresql.org/download/windows/**
2. Click on **"Download the installer"** (it will redirect to EnterpriseDB)
3. Download the latest version (PostgreSQL 16 or 15 recommended)
4. The installer file will be named something like: `postgresql-16.x-x-windows-x64.exe`

## Step 2: Install PostgreSQL

1. **Run the installer** (right-click → Run as Administrator if needed)

2. **Installation Directory**
   - Default: `C:\Program Files\PostgreSQL\16`
   - Click **Next** (or change if you prefer)

3. **Select Components**
   - ✅ PostgreSQL Server (required)
   - ✅ pgAdmin 4 (GUI tool - recommended)
   - ✅ Stack Builder (optional - for additional tools)
   - ✅ Command Line Tools (recommended)
   - Click **Next**

4. **Data Directory**
   - Default: `C:\Program Files\PostgreSQL\16\data`
   - Click **Next**

5. **Password for PostgreSQL superuser (postgres)**
   - ⚠️ **IMPORTANT**: Remember this password! You'll need it.
   - Enter a strong password (e.g., `Postgres2024!` or create your own)
   - Write it down somewhere safe
   - Click **Next**

6. **Port**
   - Default: `5432`
   - Keep the default unless you have a conflict
   - Click **Next**

7. **Advanced Options**
   - Locale: Default locale
   - Click **Next**

8. **Pre Installation Summary**
   - Review the settings
   - Click **Next**

9. **Ready to Install**
   - Click **Next** to begin installation
   - Wait for installation to complete (may take a few minutes)

10. **Completing the PostgreSQL Setup Wizard**
    - ✅ Uncheck "Launch Stack Builder" (unless you need it)
    - Click **Finish**

## Step 3: Verify Installation

### Option A: Using Command Prompt/PowerShell

1. Open **PowerShell** or **Command Prompt**
2. Test if PostgreSQL is installed:
   ```powershell
   psql --version
   ```
   You should see something like: `psql (PostgreSQL) 16.x`

### Option B: Using pgAdmin (GUI)

1. Open **pgAdmin 4** from the Start Menu
2. It will ask for the password you set during installation
3. You should see the PostgreSQL server in the left panel

## Step 4: Create Database for PeoplePilot

### Method 1: Using pgAdmin (Easiest)

1. Open **pgAdmin 4**
2. Expand **Servers** → **PostgreSQL 16** (or your version)
3. Enter your password when prompted
4. Right-click on **Databases** → **Create** → **Database...**
5. Enter:
   - **Database name**: `peoplepilot`
   - **Owner**: `postgres` (default)
6. Click **Save**

### Method 2: Using Command Line

1. Open **PowerShell** or **Command Prompt**
2. Connect to PostgreSQL:
   ```powershell
   psql -U postgres
   ```
3. Enter your password when prompted
4. Create the database:
   ```sql
   CREATE DATABASE peoplepilot;
   ```
5. Verify it was created:
   ```sql
   \l
   ```
   You should see `peoplepilot` in the list
6. Exit:
   ```sql
   \q
   ```

## Step 5: Configure PeoplePilot Application

1. Open the `.env` file in your project root
2. Update the `DATABASE_URL` line:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/peoplepilot
   ```
   Replace `YOUR_PASSWORD` with the password you set during installation.

   Example:
   ```env
   DATABASE_URL=postgresql://postgres:Postgres2024!@localhost:5432/peoplepilot
   ```

3. Save the file

## Step 6: Test Connection

Run this command in your project directory:
```powershell
npm run db:test
```

You should see: ✅ Successfully connected to PostgreSQL!

## Step 7: Create Tables

Run the migration:
```powershell
npm run db:push
```

This will create all the necessary tables in your database.

## Step 8: Start the Application

```powershell
npm run dev
```

Your application will be available at: **http://localhost:5000**

---

## Troubleshooting

### PostgreSQL service not running

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **postgresql-x64-16** (or your version)
4. Right-click → **Start** (if stopped)

### Can't connect to database

1. Check if PostgreSQL service is running (see above)
2. Verify your password in `.env` file
3. Make sure the database `peoplepilot` exists
4. Check the port (default is 5432)

### psql command not found

1. Add PostgreSQL to your PATH:
   - Go to: `C:\Program Files\PostgreSQL\16\bin`
   - Copy this path
   - Add it to System Environment Variables → Path

2. Or use full path:
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
   ```

### Forgot PostgreSQL password

1. Open **pgAdmin 4**
2. Right-click on **PostgreSQL 16** → **Properties**
3. Go to **Connection** tab
4. You can change the password there, or reset it via Windows Services

---

## Quick Reference

- **Default User**: `postgres`
- **Default Port**: `5432`
- **Default Host**: `localhost`
- **Connection String Format**: `postgresql://username:password@host:port/database`

---

## Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgAdmin Documentation: https://www.pgadmin.org/docs/


