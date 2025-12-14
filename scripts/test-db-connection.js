#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Tests the PostgreSQL connection before running migrations
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
  console.error('See DATABASE_SETUP.md for instructions.');
  process.exit(1);
}

async function testConnection() {
  console.log('🔌 Testing PostgreSQL database connection...\n');
  
  try {
    let connectionString = process.env.DATABASE_URL;
    
    // Enable SSL for Railway and other cloud providers
    // Railway uses proxy.rlwy.net or railway.app domains
    const isCloudProvider = connectionString.includes('railway') || 
                            connectionString.includes('rlwy.net') || 
                            connectionString.includes('amazonaws') || 
                            connectionString.includes('neon') ||
                            connectionString.includes('supabase');
    
    // Build pool config
    const poolConfig = {
      connectionString: connectionString,
      // For cloud providers, configure SSL to accept self-signed certificates
      ...(isCloudProvider && {
        ssl: {
          rejectUnauthorized: false
        }
      })
    };
    
    if (isCloudProvider) {
      console.log('   SSL enabled for cloud database connection\n');
    }
    
    const pool = new Pool(poolConfig);
    const result = await pool.query('SELECT version()');
    console.log('✅ Successfully connected to PostgreSQL!');
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}\n`);
    
    // Test if database exists and is accessible
    const dbResult = await pool.query('SELECT current_database()');
    console.log(`   Database: ${dbResult.rows[0].current_database}`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message || error);
    if (error.stack) {
      console.error('\nError details:', error.stack);
    }
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify your DATABASE_URL in .env file is correct');
    console.error('2. Check if the database exists');
    console.error('3. Verify username and password are correct');
    console.error('4. For Supabase: Make sure your project is active (not paused)');
    console.error('   - Go to https://supabase.com/dashboard');
    console.error('   - If project shows "Paused", click to wake it up');
    console.error('5. For Supabase: Try using the "Connection pooling" URL instead');
    console.error('   - Go to Settings → Database → Connection string');
    console.error('   - Use "Transaction" mode connection string (port 6543)');
    console.error('6. Ensure the database server is running\n');
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('✅ Connection test passed! You can now run: npm run db:push\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(console.error);

