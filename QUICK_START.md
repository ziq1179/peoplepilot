# Quick Start Guide

Get PeoplePilot up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- MS SQL Server (local or Azure)

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
In SQL Server Management Studio:
```sql
CREATE DATABASE PeoplePilot;
```

### 3. Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env and set:
# - DATABASE_URL (your SQL Server connection string)
# - SESSION_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 4. Test Connection
```bash
npm run db:setup
```

### 5. Create Tables
```bash
npm run db:push
```

### 6. Start Server
```bash
npm run dev
```

### 7. Access Application
Open: http://localhost:5000

### 8. Create Admin User
1. Register a new user
2. Update role in database:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your-username';
```

## That's It! 🎉

For detailed setup instructions, see `SETUP_GUIDE.md`

