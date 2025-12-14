#!/usr/bin/env node

/**
 * List all users in the database
 * Usage: node scripts/list-users.js
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

async function listUsers() {
  console.log('👥 Listing all users...\n');
  
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
    
    // Get all users
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY username'
    );
    
    if (result.rows.length === 0) {
      console.log('📭 No users found in the database.');
      console.log('\n💡 To create a user:');
      console.log('   1. Go to http://localhost:3000/auth');
      console.log('   2. Click "Register"');
      console.log('   3. Create an account\n');
    } else {
      console.log(`✅ Found ${result.rows.length} user(s):\n`);
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│ Username          │ Email              │ Name              │ Role      │');
      console.log('├─────────────────────────────────────────────────────────────────────────────┤');
      
      result.rows.forEach((user) => {
        const username = (user.username || '').padEnd(18);
        const email = (user.email || 'N/A').padEnd(19);
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
        const namePadded = name.padEnd(18);
        const role = (user.role || 'employee').padEnd(9);
        
        console.log(`│ ${username} │ ${email} │ ${namePadded} │ ${role} │`);
      });
      
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log('\n💡 To make a user an admin, run:');
      console.log('   node scripts/make-admin.js <username>\n');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nError details:', error.stack);
    }
    process.exit(1);
  }
}

listUsers();

