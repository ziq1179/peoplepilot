#!/usr/bin/env node

/**
 * Make a user an admin
 * Usage: node scripts/make-admin.js <username>
 */

import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const username = process.argv[2];

if (!username) {
  console.error('❌ ERROR: Username is required!');
  console.error('Usage: node scripts/make-admin.js <username>');
  process.exit(1);
}

async function makeAdmin() {
  console.log('🔧 Making user an admin...\n');
  
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
    
    if (user.role === 'admin') {
      console.log(`✅ User "${username}" is already an admin!`);
      await pool.end();
      process.exit(0);
    }
    
    // Update user role to admin
    await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE username = $2',
      ['admin', username]
    );
    
    console.log(`✅ Successfully updated user "${username}" to admin role!`);
    console.log(`\n   Previous role: ${user.role}`);
    console.log(`   New role: admin`);
    console.log(`\n   Please log out and log back in to see the admin menu.`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();

