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
- **Provider**: Replit OIDC with automatic user provisioning
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role-Based Access**: Four-tier role system (admin, hr, manager, employee)
- **Route Protection**: Server-side middleware and client-side guards for secured endpoints

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