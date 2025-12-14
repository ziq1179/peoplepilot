#!/usr/bin/env node

/**
 * Database Setup Script
 * This script helps set up the PostgreSQL database for PeoplePilot
 */

import pg from 'pg';
const { Pool } = pg;
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please create a .env file with your database connection string.');
  console.error('See .env.example for the format.');
  process.exit(1);
}

async function testConnection() {
  console.log('🔌 Testing PostgreSQL database connection...\n');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT version()');
    console.log('✅ Successfully connected to PostgreSQL!');
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}\n`);
    
    // Test if database exists and is accessible
    const dbResult = await pool.query('SELECT current_database()');
    console.log(`   Database: ${dbResult.rows[0].current_database}`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify your DATABASE_URL in .env file is correct');
    console.error('2. Check if the database exists');
    console.error('3. Verify username and password are correct');
    console.error('4. For cloud databases, check if your IP is whitelisted');
    console.error('5. Ensure the database server is running\n');
    return false;
  }
}

async function main() {
  console.log('🚀 PeoplePilot Database Setup\n');
  console.log('='.repeat(50));
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Setup check complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run db:push  (to create tables)');
  console.log('2. Run: npm run dev      (to start the application)');
  console.log('\n');
}

main().catch(console.error);

