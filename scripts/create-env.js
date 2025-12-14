#!/usr/bin/env node

/**
 * Create .env file from template
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

// Generate a random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

const envContent = `# Database Configuration
# IMPORTANT: Update this with your actual SQL Server connection details
# Format: mssql://username:password@server:1433/database?encrypt=true
# Or: Server=server;Database=dbname;User Id=username;Password=password;Encrypt=true
DATABASE_URL=mssql://sa:YourPassword@localhost:1433/PeoplePilot?encrypt=true

# Session Secret (auto-generated)
SESSION_SECRET=${sessionSecret}

# Server Configuration
NODE_ENV=development
PORT=5000
`;

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('   If you want to recreate it, delete .env first.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
  console.log('⚠️  IMPORTANT: Update DATABASE_URL with your actual SQL Server connection details!');
  console.log('   Edit .env and set your database connection string.');
}

