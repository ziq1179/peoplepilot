#!/usr/bin/env node

/**
 * Add SESSION_SECRET to .env file if it doesn't exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');

// Generate a secure session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

try {
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Check if SESSION_SECRET already exists
  if (envContent.includes('SESSION_SECRET=')) {
    console.log('✅ SESSION_SECRET already exists in .env file');
    process.exit(0);
  }
  
  // Add SESSION_SECRET to .env file
  const newLine = envContent.endsWith('\n') ? '' : '\n';
  const sessionSecretLine = `${newLine}SESSION_SECRET=${sessionSecret}\n`;
  
  fs.appendFileSync(envPath, sessionSecretLine, 'utf-8');
  
  console.log('✅ Added SESSION_SECRET to .env file');
  console.log('   Generated secure session secret');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  console.error('\nPlease manually add this line to your .env file:');
  console.error(`SESSION_SECRET=${sessionSecret}`);
  process.exit(1);
}

