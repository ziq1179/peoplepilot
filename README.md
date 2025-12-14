# PeoplePilot HRIS

A comprehensive Human Resources Information System built with React, TypeScript, Express.js, and MS SQL Server.

## Features

- 👥 **Employee Management** - Complete employee lifecycle management
- 📅 **Leave Management** - Leave requests, approvals, and balance tracking
- 💰 **Payroll** - Payroll records and processing
- 📊 **Performance Management** - Reviews, goals, and assessments
- 📄 **Document Management** - Secure document storage and access
- 🎯 **Recruitment** - Job postings, applications, and interviews
- 🔐 **Role-Based Access Control** - Admin, HR, Manager, and Employee roles
- 🔒 **Security** - Rate limiting, input sanitization, secure authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Passport.js
- **Database**: MS SQL Server with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ and npm
- MS SQL Server 2019+ (or Azure SQL Database)
- SQL Server Management Studio (optional, for database management)

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using SQL Server Management Studio

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Create a new database:
   ```sql
   CREATE DATABASE PeoplePilot;
   ```

#### Option B: Using Azure SQL Database

1. Create an Azure SQL Database in the Azure Portal
2. Note the connection string from the Azure Portal

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

**For SQL Server:**
```env
DATABASE_URL=mssql://username:password@localhost:1433/PeoplePilot?encrypt=true
```

**For Azure SQL:**
```env
DATABASE_URL=Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=PeoplePilot;Persist Security Info=False;User ID=youruser;Password=yourpassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Required Environment Variables:**
```env
DATABASE_URL=your_connection_string
SESSION_SECRET=your-secret-key-here  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NODE_ENV=development
PORT=5000
```

### 4. Test Database Connection

```bash
# Test database connection (optional)
node scripts/setup-database.js
```

### 5. Create Database Tables

```bash
# Push schema to database
npm run db:push
```

### 6. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
PeoplePilot/
├── client/              # React frontend
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utility functions
├── server/              # Express backend
│   ├── middleware/      # Custom middleware (RBAC, security)
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── auth.ts          # Authentication setup
├── shared/              # Shared code
│   └── schema.ts        # Database schema (Drizzle ORM)
└── scripts/             # Utility scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema to SQL Server

## Default Roles

The application supports four user roles:

- **admin** - Full system access
- **hr** - HR management functions
- **manager** - Team management and approvals
- **employee** - Basic employee access

New users are created with the `employee` role by default. Only admins can change user roles.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Employees
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee (HR only)
- `DELETE /api/employees/:id` - Delete employee (Admin only)

### Leave Management
- `GET /api/leave/requests` - List leave requests
- `POST /api/leave/requests` - Create leave request
- `PUT /api/leave/requests/:id/approve` - Approve leave request
- `PUT /api/leave/requests/:id/reject` - Reject leave request

See `server/routes.ts` for complete API documentation.

## Security Features

- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Sanitization** - Protects against XSS attacks
- ✅ **Role-Based Access Control** - Ensures proper authorization
- ✅ **Secure Sessions** - HTTP-only, secure cookies
- ✅ **Password Hashing** - Using scrypt with salt

## Troubleshooting

### Database Connection Issues

1. **Verify SQL Server is running**
   ```bash
   # Windows
   Get-Service MSSQLSERVER
   
   # Linux/Mac (if using Docker)
   docker ps
   ```

2. **Check connection string format**
   - Ensure it matches the format in `.env.example`
   - Verify username, password, server, and database name

3. **Firewall Settings**
   - Ensure port 1433 (or your custom port) is open
   - For Azure SQL, add your IP to firewall rules

4. **Test connection manually**
   ```bash
   node scripts/setup-database.js
   ```

### Session Issues

- Sessions are stored in memory (will be lost on server restart)
- For production, implement a database-backed session store
- Ensure `SESSION_SECRET` is set and secure

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Clear build cache: `rm -rf dist`

## Development

### Adding New Features

1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to update database
3. Add storage methods in `server/storage.ts`
4. Add routes in `server/routes.ts`
5. Create frontend components in `client/src/`

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (if configured)

## Production Deployment

1. Set `NODE_ENV=production`
2. Set a strong `SESSION_SECRET`
3. Use a production database (Azure SQL recommended)
4. Implement database-backed session store
5. Set up proper logging and monitoring
6. Configure HTTPS
7. Set up reverse proxy (nginx/Apache)

## License

MIT

## Support

For issues or questions, please check:
- `APPLICATION_REVIEW.md` - Code review and architecture details
- `MIGRATION_SUMMARY.md` - Migration from PostgreSQL to SQL Server
- `.env.example` - Environment variable reference

