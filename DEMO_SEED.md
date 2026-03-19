# Demo Data for PeoplePilot

This document describes the sample data you can seed for demos and testing.

## How to Seed

Run the seed script **after** your database tables exist (`npm run db:push`):

```bash
npm run db:seed
```

**Note:** Run once on a fresh database. If demo data already exists, the script will skip. To re-seed, use a new database branch or clear the existing demo users first.

## Demo Logins

All demo users have the same password: **`demo123`**

| Username      | Role     | Description                    |
|---------------|----------|--------------------------------|
| `admin`       | Admin    | Full system access             |
| `hr.demo`     | HR       | HR management, departments     |
| `manager.demo`| Manager  | Team management, approvals     |
| `employee.demo` | Employee | Basic employee view          |
| `john.dev`    | Employee | Software engineer (reports to Mike) |
| `jane.sales`  | Employee | Sales representative          |

## What Gets Created

- **Company:** Acme Corporation
- **Departments:** Engineering, Sales, HR, Marketing, Operations
- **Positions:** Software Engineer, Senior Engineer, Sales Rep, HR Manager, etc.
- **Employees:** 6 employees linked to the demo users
- **Teams:** Backend Team (Engineering), Inside Sales
- **Leave Types:** Annual Leave (20 days), Sick Leave (10), Personal Leave (5)
- **Leave Balances:** Initialized for all employees for current year
- **Leave Requests:** 1 pending request (Emma – Annual Leave)
- **Attendance:** Sample clock-in/out for last 5 working days
- **Timesheets:** Current week drafts for 4 employees
- **Job Posting:** 1 open role (Senior Software Engineer)
- **Application:** 1 sample application
- **Performance Review:** 1 draft review (Emma)
- **Payroll:** 1 sample payroll record

## Use Cases for Demo

- **Admin:** User management, company config, all features
- **HR:** Departments, positions, leave approvals, recruitment
- **Manager:** Team view, leave approvals, performance reviews
- **Employee:** Clock in/out, leave request, timesheets, my profile
