#!/usr/bin/env node

/**
 * Reset a user's password
 * Usage: node scripts/reset-password.js <username> <new-password>
 */

import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('❌ ERROR: Username and password are required!');
  console.error('Usage: node scripts/reset-password.js <username> <new-password>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('❌ ERROR: Password must be at least 6 characters long!');
  process.exit(1);
}

async function resetPassword() {
  console.log('🔐 Resetting password...\n');
  
  try {
    const connectionString = process.env.DATABASE_URL;
    const poolConfig = {
      connectionString: connectionString,
      ...(connectionString.includes('supabase') || 
          connectionString.includes('railway') || 
          connectionString.includes('rlwy.net') || 
          connectionString.includes('amazonaws') || 
          connectionString.includes('neon') ? {
        ssl: { rejectUnauthorized: false }
      } : {})
    };
    
    const pool = new Pool(poolConfig);
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`❌ User "${username}" not found!`);
      console.error('\nAvailable users:');
      const allUsers = await pool.query('SELECT username, role FROM users ORDER BY username');
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`);
      });
      await pool.end();
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE username = $2',
      [hashedPassword, username]
    );
    
    console.log(`✅ Successfully reset password for user "${username}"!`);
    console.log(`\n   User: ${user.username} (${user.role})`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n   The user can now log in with the new password.`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nError details:', error.stack);
    }
    process.exit(1);
  }
}

resetPassword();

