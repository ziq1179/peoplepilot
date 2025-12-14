import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse connection string and add SSL for Railway/cloud databases
const connectionString = process.env.DATABASE_URL;
const poolConfig: any = { connectionString };

// If connecting to Railway or other cloud providers, enable SSL
// Railway uses proxy.rlwy.net or railway.app domains
if (connectionString.includes('railway') || 
    connectionString.includes('rlwy.net') || 
    connectionString.includes('amazonaws') || 
    connectionString.includes('neon') ||
    connectionString.includes('supabase')) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });
