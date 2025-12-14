# Migration Summary: PostgreSQL to MS SQL Server

## Overview
This document summarizes all the changes made to migrate the PeoplePilot HRIS application from PostgreSQL to MS SQL Server and fix critical issues identified in the code review.

## Completed Changes

### 1. ✅ Fixed Duplicate useAuth Hook
- **Issue**: Two different `useAuth` implementations causing import inconsistencies
- **Fix**: 
  - Removed `client/src/hooks/useAuth.ts`
  - Updated all imports to use `@/hooks/use-auth`
  - Files updated: `Layout.tsx`, `MyProfile.tsx`, `Documents.tsx`

### 2. ✅ Database Migration to MS SQL Server

#### Schema Changes (`shared/schema.ts`)
- Migrated from `drizzle-orm/pg-core` to `drizzle-orm/mssql`
- Changed `pgTable` to `sqlTable`
- Updated data types:
  - `varchar` → `nvarchar` (for Unicode support)
  - `text` → `nvarchar(max)`
  - `jsonb` → `nvarchar(max)` (JSON stored as text)
  - `boolean` → `bit`
  - `integer` → `int`
  - `timestamp` → `datetime2`
  - `gen_random_uuid()` → `NEWID()`
  - `defaultNow()` → `GETDATE()`

#### Database Connection (`server/db.ts`)
- Replaced `@neondatabase/serverless` with `mssql` package
- Updated connection pool to use SQL Server ConnectionPool
- Added support for both URL and connection string formats
- Configured encryption and trust server certificate options

#### Drizzle Configuration (`drizzle.config.ts`)
- Changed dialect from `postgresql` to `mssql`
- Updated connection credentials parsing for SQL Server

#### Session Store (`server/storage.ts`)
- Replaced `connect-pg-simple` with `memorystore`
- Updated to use MemoryStore for session management
- Note: For production, consider implementing a custom SQL Server session store

### 3. ✅ Implemented Role-Based Access Control (RBAC)

#### New Middleware (`server/middleware/rbac.ts`)
- `isAuthenticated`: Checks if user is logged in
- `requireRole(...roles)`: Checks if user has one of the required roles
- `requireAdmin`: Requires admin role
- `requireHR`: Requires admin or HR role
- `requireManager`: Requires admin, HR, or manager role
- `requireOwnershipOrRole`: Allows access to own resources or with required role

#### Applied RBAC to Routes
- Department routes: Create/Update require HR, Delete requires Admin
- Employee routes: Create/Update require HR, Delete requires Admin
- Other routes maintain authentication requirements

### 4. ✅ Security Improvements

#### Rate Limiting (`server/middleware/security.ts`)
- `authLimiter`: 5 requests per 15 minutes for auth endpoints
- `apiLimiter`: 100 requests per 15 minutes for general API
- Applied to `/api/login` and `/api/register`

#### Input Sanitization
- `sanitizeString`: Removes HTML tags and escapes special characters
- `sanitizeObject`: Recursively sanitizes object properties
- `sanitizeBody`: Middleware to sanitize request bodies
- `sanitizeQuery`: Middleware to sanitize query parameters
- Applied to all API routes

#### Session Secret Security
- Removed hardcoded fallback secret
- Throws error in production if SESSION_SECRET is not set
- Shows warning in development

### 5. ✅ Environment Configuration

#### Created `.env.example`
- Database connection string format
- Required environment variables
- Security configuration
- Server settings

### 6. ✅ Package Dependencies Updated

#### Added
- `mssql`: SQL Server driver
- `express-rate-limit`: Rate limiting middleware
- `validator`: Input validation and sanitization

#### Removed
- `@neondatabase/serverless`: PostgreSQL driver
- `connect-pg-simple`: PostgreSQL session store

#### Updated
- `@types/mssql`: TypeScript types for mssql

## Database Connection String Formats

### URL Format
```
mssql://username:password@server:1433/database?encrypt=true
```

### Connection String Format
```
Server=server;Database=dbname;User Id=username;Password=password;Encrypt=true
```

## Next Steps

### High Priority
1. **Test Database Connection**: Verify SQL Server connection works
2. **Run Migrations**: Use `npm run db:push` to create tables
3. **Test Authentication**: Verify login/register works with new session store
4. **Test RBAC**: Verify role-based access control works correctly

### Medium Priority
1. **Split Routes File**: Break `server/routes.ts` into modular route files
2. **Add Database Transactions**: Wrap multi-table operations in transactions
3. **Implement SQL Server Session Store**: Replace MemoryStore with database-backed store for production

### Low Priority
1. **Add Comprehensive Tests**: Unit, integration, and E2E tests
2. **Add API Documentation**: Swagger/OpenAPI documentation
3. **Performance Optimization**: Add caching, optimize queries

## Breaking Changes

1. **Database**: Application now requires MS SQL Server instead of PostgreSQL
2. **Session Store**: Sessions are now stored in memory (will be lost on server restart)
3. **Environment Variables**: `DATABASE_URL` format changed to SQL Server format
4. **Role-Based Access**: Some endpoints now require specific roles

## Migration Checklist

- [x] Update schema to SQL Server syntax
- [x] Update database connection
- [x] Update Drizzle configuration
- [x] Update session store
- [x] Implement RBAC middleware
- [x] Add security middleware
- [x] Update package.json dependencies
- [x] Create .env.example
- [ ] Test database connection
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Update deployment documentation

## Notes

- The application uses MemoryStore for sessions, which is fine for development but should be replaced with a database-backed store for production
- All string inputs are now sanitized to prevent XSS attacks
- Rate limiting is applied to prevent brute force attacks
- Role-based access control ensures users can only access resources they're authorized for

## Support

For issues or questions:
1. Check the `.env.example` file for required environment variables
2. Verify SQL Server is accessible and credentials are correct
3. Check server logs for connection errors
4. Review the APPLICATION_REVIEW.md for additional context

