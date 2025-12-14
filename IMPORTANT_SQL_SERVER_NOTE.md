# Important: SQL Server Support Issue

## Current Status

Drizzle ORM (version 0.44.7) does **not** have native SQL Server support. The `drizzle-orm/mssql` module does not exist in the current version.

## Options

### Option 1: Use PostgreSQL (Recommended for Now)
PostgreSQL is fully supported by Drizzle ORM and works perfectly. This is the quickest way to get the application running.

### Option 2: Wait for SQL Server Support
Drizzle ORM may add SQL Server support in future versions. Monitor their releases.

### Option 3: Use Raw SQL Queries
We can rewrite the storage layer to use raw SQL queries with the `mssql` package, but this would require significant refactoring.

## Recommendation

For now, let's use **PostgreSQL** to get the application running. The schema and code structure are already in place, and we can easily switch to SQL Server later when Drizzle adds support.

Would you like me to:
1. Revert to PostgreSQL so we can run the app now?
2. Create a raw SQL implementation for SQL Server (more work)?
3. Wait and check for SQL Server support updates?

