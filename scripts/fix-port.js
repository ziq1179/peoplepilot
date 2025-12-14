#!/usr/bin/env node

/**
 * Fix PORT in .env file - remove all PORT lines and add correct one
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const newPort = process.argv[2] || '3000';

try {
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Remove all PORT lines
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => !line.trim().startsWith('PORT='));
  
  // Add PORT at the end
  const newContent = filteredLines.join('\n') + (filteredLines[filteredLines.length - 1] ? '\n' : '') + `PORT=${newPort}\n`;
  
  fs.writeFileSync(envPath, newContent, 'utf-8');
  
  console.log(`✅ Fixed PORT in .env file - set to ${newPort}`);
  console.log('   Removed any duplicate PORT entries');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  console.error(`\nPlease manually add this line to your .env file:`);
  console.error(`PORT=${newPort}`);
  process.exit(1);
}

