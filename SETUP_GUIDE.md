# Setup Guide - PeoplePilot HRIS

This guide will walk you through setting up the PeoplePilot application step by step.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MS SQL Server 2019+ installed and running
- [ ] SQL Server Management Studio (optional, for database management)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and frontend dependencies
- Express.js and backend dependencies
- MS SQL Server driver
- Drizzle ORM
- Security packages (rate limiting, validator)

### Step 2: Set Up SQL Server Database

#### Option A: Local SQL Server

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Create a new database:
   ```sql
   CREATE DATABASE PeoplePilot;
   ```

#### Option B: Azure SQL Database

1. Go to Azure Portal
2. Create a new SQL Database
3. Note the connection string from the Azure Portal

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your database connection:

   **For Local SQL Server:**
   ```env
   DATABASE_URL=mssql://sa:YourPassword@localhost:1433/PeoplePilot?encrypt=true
   ```

   **For Azure SQL:**
   ```env
   DATABASE_URL=Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=PeoplePilot;Persist Security Info=False;User ID=youruser;Password=yourpassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

3. Generate a secure session secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and set it in `.env`:
   ```env
   SESSION_SECRET=your-generated-secret-here
   ```

4. Set other environment variables:
   ```env
   NODE_ENV=development
   PORT=5000
   ```

### Step 4: Test Database Connection

```bash
npm run db:setup
```

This script will:
- Test the database connection
- Verify the database exists
- Provide troubleshooting tips if there are issues

**Expected Output:**
```
🚀 PeoplePilot Database Setup
==================================================
🔌 Testing database connection...
✅ Successfully connected to SQL Server!
   Database: PeoplePilot
   Server: localhost:1433
   User: sa

📊 Checking if database exists...
✅ Database 'PeoplePilot' exists

==================================================
✅ Setup check complete!
```

### Step 5: Create Database Tables

```bash
npm run db:push
```

This will create all the necessary tables in your database:
- users
- employees
- departments
- positions
- leave_types
- leave_requests
- leave_balances
- payroll_records
- performance_reviews
- performance_goals
- documents
- job_postings
- applications
- interviews
- sessions

**Expected Output:**
```
✓ Drizzle Kit generated migrations
✓ Tables created successfully
```

### Step 6: Start the Development Server

```bash
npm run dev
```

The application should start and you should see:
```
Connected to SQL Server database
serving on port 5000
```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

## First-Time Setup: Create Admin User

1. Click on "Register" or navigate to `/auth`
2. Create your first user account
3. **Important**: The first user will have the `employee` role by default
4. To make yourself an admin, you'll need to:
   - Connect to your database
   - Run this SQL query (replace 'your-username' with your actual username):
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your-username';
   ```

## Troubleshooting

### Database Connection Issues

**Error: "Cannot connect to SQL Server"**

1. Verify SQL Server is running:
   ```bash
   # Windows PowerShell
   Get-Service MSSQLSERVER
   ```

2. Check firewall settings - ensure port 1433 is open

3. Verify connection string format in `.env`

4. For Azure SQL, ensure your IP is added to firewall rules

**Error: "Login failed for user"**

1. Verify username and password are correct
2. Check if SQL Server authentication is enabled (not just Windows auth)
3. For Azure SQL, ensure the user exists and has proper permissions

**Error: "Database does not exist"**

1. Create the database manually in SQL Server Management Studio
2. Or run: `CREATE DATABASE PeoplePilot;`

### Port Already in Use

If port 5000 is already in use:

1. Change the port in `.env`:
   ```env
   PORT=3000
   ```

2. Or kill the process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:5000 | xargs kill
   ```

### Module Not Found Errors

If you see module not found errors:

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

If you see TypeScript compilation errors:

```bash
npm run check
```

This will show you all TypeScript errors that need to be fixed.

## Verification Checklist

After setup, verify everything works:

- [ ] Database connection successful
- [ ] Tables created in database
- [ ] Server starts without errors
- [ ] Can access application in browser
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Dashboard loads correctly

## Next Steps

Once setup is complete:

1. **Create Admin User**: Update your user role to 'admin' in the database
2. **Create Departments**: Add departments through the UI
3. **Create Positions**: Add positions for each department
4. **Add Employees**: Start adding employees to the system
5. **Configure Leave Types**: Set up leave types (Vacation, Sick, etc.)

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong, unique `SESSION_SECRET`
3. Use Azure SQL Database or a managed SQL Server instance
4. Implement database-backed session store (replace MemoryStore)
5. Set up HTTPS
6. Configure proper logging and monitoring
7. Set up backup and recovery procedures

## Getting Help

If you encounter issues:

1. Check the `README.md` for general information
2. Review `APPLICATION_REVIEW.md` for architecture details
3. Check `MIGRATION_SUMMARY.md` for migration information
4. Review server logs for error messages
5. Check database connection and permissions

## Common Commands Reference

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Create/update database tables
npm run db:setup         # Test database connection

# Code Quality
npm run check            # Type check TypeScript
```

---

**Congratulations!** You've successfully set up PeoplePilot HRIS. 🎉

