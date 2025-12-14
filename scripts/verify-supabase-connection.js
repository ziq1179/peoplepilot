#!/usr/bin/env node

/**
 * Verify Supabase Connection String Format
 * Helps diagnose connection issues with Supabase
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log('🔍 Verifying Supabase connection string...\n');

// Check if it's a Supabase connection
if (!connectionString.includes('supabase.co')) {
  console.log('⚠️  This doesn\'t appear to be a Supabase connection string');
  console.log('   Expected hostname format: db.xxxxx.supabase.co\n');
}

// Parse connection string
try {
  const url = new URL(connectionString);
  
  console.log('✅ Connection string format is valid\n');
  console.log('Connection Details:');
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username}`);
  console.log(`   Hostname: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432 (default)'}`);
  console.log(`   Database: ${url.pathname.slice(1) || 'postgres'}`);
  console.log(`   Has Password: ${url.password ? 'Yes ✅' : 'No ❌'}`);
  console.log(`   Password Length: ${url.password ? url.password.length : 0} characters`);
  
  // Check for common issues
  console.log('\n🔍 Checking for common issues...\n');
  
  let hasIssues = false;
  
  // Check password
  if (!url.password || url.password.length === 0) {
    console.log('❌ Issue: No password found in connection string');
    console.log('   Make sure you replaced [YOUR-PASSWORD] with your actual password');
    hasIssues = true;
  }
  
  if (url.password && url.password.includes('[') && url.password.includes(']')) {
    console.log('❌ Issue: Password still contains brackets [YOUR-PASSWORD]');
    console.log('   Replace [YOUR-PASSWORD] with your actual database password');
    hasIssues = true;
  }
  
  // Check hostname format
  if (!url.hostname.includes('supabase.co')) {
    console.log('⚠️  Warning: Hostname doesn\'t match Supabase format');
    console.log('   Expected: db.xxxxx.supabase.co');
    console.log(`   Got: ${url.hostname}`);
    hasIssues = true;
  }
  
  // Check SSL parameters
  if (!url.searchParams.has('sslmode')) {
    console.log('ℹ️  Info: No sslmode parameter (will be added automatically)');
  }
  
  if (!hasIssues) {
    console.log('✅ Connection string looks good!\n');
    console.log('If you\'re still getting connection errors:');
    console.log('1. Make sure your Supabase project is fully provisioned (check dashboard)');
    console.log('2. If project is paused (free tier), wake it up in the Supabase dashboard');
    console.log('3. Verify the hostname matches what\'s shown in Supabase Settings → Database');
    console.log('4. Double-check your database password is correct\n');
  } else {
    console.log('\n⚠️  Please fix the issues above and try again\n');
  }
  
} catch (error) {
  console.error('❌ Invalid connection string format:', error.message);
  console.error('\nExpected format:');
  console.error('postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres\n');
  process.exit(1);
}

