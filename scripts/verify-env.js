#!/usr/bin/env node

/**
 * Verify .env file and connection string format
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Checking .env configuration...\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;

console.log('✅ DATABASE_URL is set');
console.log(`   Length: ${dbUrl.length} characters`);

// Check if it's using internal Railway hostname
if (dbUrl.includes('railway.internal')) {
  console.error('\n❌ ERROR: You are using Railway\'s INTERNAL connection string!');
  console.error('   This only works from within Railway\'s network, not from your local machine.\n');
  console.error('   Solution:');
  console.error('   1. In Railway, go to your PostgreSQL service');
  console.error('   2. Click the "Variables" tab');
  console.error('   3. Look for "DATABASE_PUBLIC_URL" (not DATABASE_URL)');
  console.error('   4. Copy that value and use it in your .env file\n');
  console.error('   If DATABASE_PUBLIC_URL is not available:');
  console.error('   - The connection string should use a public hostname like:');
  console.error('     containers-us-west-xxx.railway.app');
  console.error('   - NOT: postgres.railway.internal\n');
  process.exit(1);
}

// Check connection string format
if (!dbUrl.startsWith('postgresql://')) {
  console.error('\n❌ ERROR: Connection string should start with "postgresql://"');
  process.exit(1);
}

// Extract parts (without showing password)
try {
  const url = new URL(dbUrl);
  console.log(`\n✅ Connection string format looks correct:`);
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432 (default)'}`);
  console.log(`   Database: ${url.pathname.slice(1)}`);
  console.log(`   Has password: ${url.password ? 'Yes' : 'No'}`);
  
  // Check if it's a public Railway hostname
  if (url.hostname.includes('railway.app') || url.hostname.includes('railway.tech')) {
    console.log(`\n✅ Using public Railway hostname (good for local connections)`);
  }
  
} catch (error) {
  console.error('\n❌ ERROR: Invalid connection string format');
  console.error(`   ${error.message}`);
  process.exit(1);
}

console.log('\n✅ .env file looks good!');
console.log('   You can now run: npm run db:test\n');



