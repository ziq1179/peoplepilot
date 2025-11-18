# HRIS Portal

## Overview

This is a comprehensive Human Resource Information System (HRIS) Portal built as a full-stack web application. The system provides end-to-end HR management capabilities including employee management, leave tracking, payroll processing, performance reviews, and document management. It features a modern React frontend with a Node.js/Express backend, PostgreSQL database integration via Drizzle ORM, and Replit authentication for secure access control.

The application serves multiple user roles (admin, HR, manager, employee) with role-based access controls and provides both administrative functionality and employee self-service features through an intuitive dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and building
- **UI Framework**: Radix UI components with Tailwind CSS for styling and shadcn/ui component library
- **Routing**: Wouter for client-side routing with protected routes based on authentication status
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Forms**: React Hook Form with Zod validation schemas for type-safe form handling
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js strategy
- **Session Management**: Express sessions with PostgreSQL session store for persistence
- **Database Access**: Drizzle ORM for type-safe database operations and schema management

### Database Design
- **Database**: PostgreSQL with Neon serverless driver for connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema definitions
- **Core Entities**: 
  - Users (authentication and profile data)
  - Employees (HR data with department/position relationships)
  - Departments and Positions (organizational structure)
  - Leave Management (requests, types, balances)
  - Payroll Records (salary, deductions, taxes)
  - Performance Reviews (ratings, goals, feedback)
  - Document Management (file storage and categorization)

### Authentication & Authorization
- **Provider**: Custom username/password authentication with Passport.js local strategy
- **Password Security**: Scrypt hashing algorithm for secure password storage
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role-Based Access**: Four-tier role system (admin, hr, manager, employee) with secure defaults
- **Route Protection**: Server-side middleware and client-side guards for secured endpoints
- **Security Features**: 
  - New users default to 'employee' role (prevents privilege escalation)
  - Passwords never exposed to client (stripped from API responses)
  - Duplicate username/email handling with proper error messages

### Development & Deployment
- **Build System**: Vite for frontend bundling with esbuild for backend compilation
- **Development**: Hot module replacement and runtime error overlay for enhanced DX
- **Environment**: Replit-optimized with cartographer plugin for development analytics

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment-based configuration for connection strings

### Authentication Services
- **Replit Authentication**: OpenID Connect provider for user authentication
- **Session Storage**: PostgreSQL-based session persistence with connect-pg-simple

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible React components for complex UI patterns
- **Lucide React**: Icon library for consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### Development Tools
- **Replit Platform**: Integrated development environment with runtime error monitoring
- **TypeScript**: Static type checking for enhanced code reliability
- **Drizzle Studio**: Database management and migration tooling

## Recent Changes

### Leave Management System (November 2024)
**Complete Leave Workflow Implementation:**
- Built full end-to-end leave management system with request submission, approval workflow, and balance tracking
- Three main pages: Request Leave, My Leave Requests, and Leave Approvals

**Leave Request Submission:**
- Employee request form with real-time balance display
- Business days calculation between start and end dates
- Balance validation before submission
- Automatic leave type selection with color-coded badges
- Reason field for leave justification

**Leave Approvals:**
- Manager/HR approval interface with pending request queue
- Approve/reject actions with mandatory reviewer comments
- Automatic balance deduction upon approval
- Real-time status updates and notifications
- Cache invalidation for instant UI refresh

**Leave Balance Tracking:**
- Per-employee balances for each leave type by year
- Balance initialization API for new employees
- Automatic balance updates on request approval
- Real-time balance display: allocated, used, remaining
- Support for balance carry-forward policies

**Leave Policy Configuration:**
- Leave Types management page for admin/HR roles
- Full CRUD operations for leave type policies
- 6 default leave types with realistic allowances:
  - Annual Leave: 20 days (carry forward enabled)
  - Sick Leave: 10 days
  - Personal Leave: 5 days
  - Maternity Leave: 90 days
  - Paternity Leave: 14 days
  - Compassionate Leave: 7 days
- Color-coded leave types for visual identification

**API Endpoints:**
- POST /api/leave/balances/initialize/:employeeId - Initialize balances
- GET /api/leave/balances - Get balances (with filters)
- POST /api/leave/requests - Submit leave request
- PUT /api/leave/requests/:id/approve - Approve request
- PUT /api/leave/requests/:id/reject - Reject request
- GET /api/employees/by-user/:userId - Lookup employee by user ID

**Bug Fixes:**
- Fixed apiRequest parameter order throughout codebase (method, url, data)
- Added missing GET /api/employees/by-user/:userId route for employee lookup
- Fixed missing insertLeaveTypeSchema import in routes
- Resolved dialog opening issue with DialogTrigger component

**Testing:**
- E2E tested complete workflow with Playwright (35 test steps)
- Validated: registration → employee creation → balance init → request → approval
- Confirmed balance updates and status transitions work correctly

### Performance Management System (November 2024)
**Complete Performance Review & Goals Tracking Implementation:**
- Built comprehensive performance management module with four integrated pages
- Supports complete performance cycle: goal setting → self-assessment → manager review → tracking
- Four main pages: Performance Reviews, Goals, Self-Assessment, and My Performance Dashboard

**Performance Reviews (Manager/HR Functionality):**
- Create and manage employee performance reviews with detailed competency assessments
- Five-category competency rating system (1-5 scale with slider controls):
  - Technical Skills Rating
  - Communication Rating
  - Leadership Rating
  - Teamwork Rating
  - Problem Solving Rating
- Overall rating calculation and tracking
- Review period definition (start/end dates)
- Status workflow: draft → self_assessment → in_progress → completed
- Manager comments, goals, achievements, and improvement areas documentation
- Filter reviews by status (all, draft, in progress, completed)
- View/edit existing reviews with full edit capability

**Performance Goals Management:**
- Employee and manager goal creation and tracking
- Goal categorization: Individual, Team, or Company goals
- Progress tracking with visual slider (0-100%)
- Target date setting and monitoring
- Status tracking: not_started → in_progress → completed/missed
- Goal approval workflow (created by employee, approved by manager)
- Link goals to performance reviews
- Filter goals by status and category
- Real-time progress updates with visual indicators

**Employee Self-Assessment:**
- Employee-initiated self-evaluation interface
- Self-rating on five competency categories (matching manager review structure)
- Overall self-rating submission
- Text areas for self-assessment narrative, achievements, and development areas
- Automatically finds pending reviews assigned to logged-in employee
- Updates review status to 'in_progress' upon submission
- Real-time cache invalidation for instant status updates

**My Performance Dashboard (Employee View):**
- Unified view of employee's performance data
- Display all performance reviews with status badges
- Show all assigned goals with progress bars
- Quick access to self-assessment for pending reviews
- Performance overview with key metrics
- Visual status indicators: color-coded badges and progress bars
- Empty states for new employees with no reviews/goals yet

**Database Schema:**
- `performance_reviews` table with individual competency rating columns (not JSON)
- `performance_goals` table with progress tracking and approval workflow
- Foreign key relationships: employeeId, reviewerId, createdBy, approvedBy
- Timestamp tracking: createdAt, updatedAt, submittedAt, completedAt, approvedAt
- Status enums for workflow management

**API Endpoints:**
- GET /api/performance/reviews - List all reviews (with status filter support)
- POST /api/performance/reviews - Create new review
- GET /api/performance/reviews/:id - Get specific review
- PUT /api/performance/reviews/:id - Update review
- DELETE /api/performance/reviews/:id - Delete review
- GET /api/performance/goals - List all goals (with status/category filters)
- POST /api/performance/goals - Create new goal
- GET /api/performance/goals/:id - Get specific goal
- PUT /api/performance/goals/:id - Update goal
- DELETE /api/performance/goals/:id - Delete goal

**Bug Fixes:**
- Fixed slider default values with `?? 3` fallback to prevent undefined errors
- Fixed employeeId auto-generation using EMP0001, EMP0002 pattern when not provided
- Added missing `sql` import in server/storage.ts for UUID generation
- Fixed Radix UI SelectItem empty value error by using "all" instead of ""
- Ensured proper TypeScript types for all competency rating fields
- Fixed form validation to allow optional competency ratings

**Technical Implementation Details:**
- Individual rating columns (technicalSkillsRating, communicationRating, etc.) stored as integers (1-5 scale)
- Slider components properly handle null/undefined values with fallback defaults
- Form validation uses Zod schemas from drizzle-zod with proper type inference
- TanStack Query for efficient caching and real-time updates
- Optimistic UI updates with cache invalidation after mutations
- shadcn/ui components for consistent design: Sliders, Badges, Progress bars, Dialog forms

**Testing:**
- E2E tested all performance pages with Playwright
- Validated: All four pages load without errors
- Confirmed UI elements render correctly (buttons, forms, sliders)
- Verified navigation between performance pages works
- Tested with fresh user registration flow

### Employee Management System (October 2024)
**Authentication System Overhaul:**
- Replaced Replit OIDC with custom username/password authentication
- Implemented secure password hashing with scrypt algorithm
- Added role-based access control with employee default for security
- Created login/registration flow with session management

**Employee Form Enhancements:**
- Fixed form data loading bug (useState → useEffect)
- Added proper TypeScript types for queries
- Implemented empty field handling (converts empty strings to null for optional fields)
- Prevents PostgreSQL date parsing errors for optional date fields
- Supports both create and edit employee workflows

**Query Client Improvements:**
- Enhanced URL building to support path segments and query parameters
- Handles complex query keys: `['/api/resource', id, { param: 'value' }]`
- Properly serializes query parameters for filtered endpoints
- Fixed malformed URL generation issue that caused 404 errors

**UI Component Fixes:**
- Fixed Radix UI Select empty value errors
- Changed filter defaults from empty strings to "all" in Employees page
- Improved error messaging and form validation