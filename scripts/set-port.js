#!/usr/bin/env node

/**
 * Set PORT in .env file
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
  
  // Check if PORT already exists and update it, or add it
  if (envContent.includes('PORT=')) {
    // Replace existing PORT line
    envContent = envContent.replace(/^PORT=.*$/m, `PORT=${newPort}`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log(`✅ Updated PORT to ${newPort} in .env file`);
  } else {
    // Add PORT to .env file
    const newLine = envContent.endsWith('\n') ? '' : '\n';
    const portLine = `${newLine}PORT=${newPort}\n`;
    fs.appendFileSync(envPath, portLine, 'utf-8');
    console.log(`✅ Added PORT=${newPort} to .env file`);
  }
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  console.error(`\nPlease manually add this line to your .env file:`);
  console.error(`PORT=${newPort}`);
  process.exit(1);
}

