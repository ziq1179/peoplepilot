#!/usr/bin/env node

/**
 * Check if PostgreSQL is installed on Windows
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking PostgreSQL installation...\n');

// Check common installation paths
const commonPaths = [
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\psql.exe',
];

let psqlPath = null;
let version = null;

// Check if psql is in PATH
try {
  const output = execSync('psql --version', { encoding: 'utf8', stdio: 'pipe' });
  version = output.trim();
  console.log('✅ PostgreSQL found in PATH');
  console.log(`   ${version}\n`);
  psqlPath = 'psql';
} catch (error) {
  // Not in PATH, check common installation paths
  for (const testPath of commonPaths) {
    if (fs.existsSync(testPath)) {
      psqlPath = testPath;
      try {
        const output = execSync(`"${testPath}" --version`, { encoding: 'utf8', stdio: 'pipe' });
        version = output.trim();
        console.log('✅ PostgreSQL found at:');
        console.log(`   ${testPath}`);
        console.log(`   ${version}\n`);
        break;
      } catch (e) {
        // Continue searching
      }
    }
  }
}

if (!psqlPath) {
  console.log('❌ PostgreSQL not found!\n');
  console.log('Please install PostgreSQL:');
  console.log('1. Download from: https://www.postgresql.org/download/windows/');
  console.log('2. Run the installer');
  console.log('3. Remember the password you set during installation\n');
  console.log('See POSTGRESQL_INSTALL_WINDOWS.md for detailed instructions.\n');
  process.exit(1);
}

// Check if PostgreSQL service is running
console.log('🔍 Checking if PostgreSQL service is running...\n');
try {
  const services = execSync('sc query postgresql*', { encoding: 'utf8', stdio: 'pipe' });
  if (services.includes('RUNNING')) {
    console.log('✅ PostgreSQL service is running\n');
  } else {
    console.log('⚠️  PostgreSQL service may not be running');
    console.log('   To start it: services.msc → Find postgresql service → Start\n');
  }
} catch (error) {
  console.log('⚠️  Could not check service status');
  console.log('   You can check manually: services.msc\n');
}

// Check if database exists
console.log('📋 Next steps:\n');
console.log('1. Create database:');
console.log('   psql -U postgres');
console.log('   CREATE DATABASE peoplepilot;');
console.log('   \\q\n');
console.log('2. Update .env file with:');
console.log('   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/peoplepilot\n');
console.log('3. Test connection:');
console.log('   npm run db:test\n');
console.log('4. Create tables:');
console.log('   npm run db:push\n');


