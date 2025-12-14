#!/usr/bin/env node

/**
 * Check if required tables exist in the database
 * Usage: node scripts/check-tables.js
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

async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
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
    
    // Check if departments table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    
    console.log(`✅ Found ${tableNames.length} table(s) in the database:\n`);
    tableNames.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    const requiredTables = ['users', 'departments', 'employees', 'positions', 'sessions'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing required tables:`);
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log(`\n💡 Run 'npm run db:push' to create the missing tables.\n`);
    } else {
      console.log(`\n✅ All required tables exist!\n`);
    }
    
    // Check departments table structure
    if (tableNames.includes('departments')) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'departments'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Departments table structure:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      console.log('');
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

checkTables();

