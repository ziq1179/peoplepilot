# Leave Management System Documentation

## Overview

The HRIS Portal includes a comprehensive leave management system that handles the complete workflow from employee leave requests through manager/HR approvals, with automatic balance tracking and deductions.

## System Features

### 1. Leave Types Configuration
- **Access**: Admin and HR roles only
- **Location**: Settings → Leave Types
- **Features**:
  - Create, edit, and delete leave type policies
  - Configure leave allowances (days per year)
  - Set color codes for visual identification
  - Enable/disable carry-forward for unused balances
  - Set active/inactive status

### 2. Leave Balances
- **Automatic Initialization**: Balances are created when a new employee joins
- **Per Employee, Per Year**: Each employee has separate balances for each leave type and year
- **Real-time Tracking**: 
  - Allocated days (from leave type policy)
  - Used days (approved leave requests)
  - Remaining days (allocated - used)

### 3. Leave Request Submission
- **Access**: All employees
- **Location**: Request Leave (main menu)
- **Features**:
  - Select leave type from dropdown
  - Pick start and end dates with calendar picker
  - Automatic business days calculation
  - Real-time balance validation
  - Optional reason field
  - Balance display sidebar shows current balances

### 4. My Leave Requests
- **Access**: All employees
- **Location**: Employee Self-Service → My Leave Requests
- **Features**:
  - View all personal leave requests
  - Status badges (Pending, Approved, Rejected)
  - Request details: dates, days, reason
  - Reviewer comments (when approved/rejected)
  - Filter by status
  - Sorted by submission date (newest first)

### 5. Leave Approvals
- **Access**: Managers and HR roles only
- **Location**: Leave Approvals (main menu)
- **Features**:
  - View all pending leave requests
  - Employee information display
  - Leave type and date details
  - Approve/Reject actions
  - Mandatory reviewer comments
  - Automatic balance updates on approval

## User Workflows

### Employee: Requesting Leave

1. Navigate to **Request Leave**
2. Review your current leave balances in the sidebar
3. Select the **Leave Type** you want to request
4. Choose **Start Date** and **End Date**
5. System automatically calculates business days
6. Check that you have sufficient balance
7. Enter a **Reason** (optional but recommended)
8. Click **Submit Request**
9. Request enters "Pending" status
10. View request status in **My Leave Requests**

### Manager/HR: Approving Leave

1. Navigate to **Leave Approvals**
2. Review pending requests in the queue
3. Click **Approve** or **Reject** on a request
4. Enter **Review Comments** (mandatory)
5. Click **Confirm** to finalize
6. System automatically:
   - Updates request status
   - Deducts days from balance (if approved)
   - Notifies employee via status update

### Admin/HR: Managing Leave Types

1. Navigate to **Settings → Leave Types**
2. Click **Add Leave Type** to create new policy
3. Fill in:
   - Name (e.g., "Annual Leave")
   - Code (e.g., "AL")
   - Default allowance days
   - Color (for visual identification)
   - Carry forward option
4. Click **Create Leave Type**
5. Edit or delete existing types as needed

### HR: Initializing Employee Balances

When a new employee is created:
1. Create the employee profile first
2. Initialize their leave balances via API:
   ```
   POST /api/leave/balances/initialize/:employeeId
   Body: { year: 2025 }
   ```
3. System creates balance records for all active leave types
4. Employee can now request leave

## Technical Architecture

### Database Schema

**leave_types** - Leave policy definitions
- id (primary key)
- name (e.g., "Annual Leave")
- code (e.g., "AL")
- defaultDays (allowance per year)
- color (hex color code)
- carryForward (boolean)
- isActive (boolean)

**leave_balances** - Employee leave tracking
- id (primary key)
- employeeId (foreign key → employees)
- leaveTypeId (foreign key → leave_types)
- year (e.g., 2025)
- allocatedDays (from leave type)
- usedDays (from approved requests)
- remainingDays (calculated: allocated - used)

**leave_requests** - Leave submissions
- id (primary key)
- employeeId (foreign key → employees)
- leaveTypeId (foreign key → leave_types)
- startDate
- endDate
- daysRequested (business days)
- reason (optional text)
- status (pending | approved | rejected)
- reviewedBy (user ID of approver)
- reviewedAt (timestamp)
- reviewComments (from approver)

### API Endpoints

**Leave Types**
- `GET /api/leave/types` - List all leave types
- `POST /api/leave/types` - Create new leave type (admin/HR)
- `PUT /api/leave/types/:id` - Update leave type (admin/HR)
- `DELETE /api/leave/types/:id` - Delete leave type (admin/HR)

**Leave Balances**
- `GET /api/leave/balances` - Get balances (filterable by employee, year, leave type)
- `POST /api/leave/balances/initialize/:employeeId` - Initialize balances for employee

**Leave Requests**
- `GET /api/leave/requests` - List requests (filterable by employee, status)
- `POST /api/leave/requests` - Submit new leave request
- `PUT /api/leave/requests/:id/approve` - Approve request (manager/HR)
- `PUT /api/leave/requests/:id/reject` - Reject request (manager/HR)

**Employees**
- `GET /api/employees/by-user/:userId` - Get employee by user ID (used for linking)

### Frontend Components

**Pages:**
- `LeaveTypes.tsx` - Admin configuration page
- `LeaveRequest.tsx` - Employee request submission form
- `MyLeaveRequests.tsx` - Employee request history
- `LeaveApprovals.tsx` - Manager/HR approval interface

**Key Features:**
- Real-time form validation with Zod schemas
- TanStack Query for data fetching and caching
- Automatic cache invalidation on mutations
- Business day calculation using date-fns
- Color-coded status badges
- Responsive dialogs for approvals

## Default Leave Types

The system comes pre-configured with 6 standard leave types:

1. **Annual Leave** - 20 days, carry forward enabled
2. **Sick Leave** - 10 days
3. **Personal Leave** - 5 days
4. **Maternity Leave** - 90 days
5. **Paternity Leave** - 14 days
6. **Compassionate Leave** - 7 days

These can be customized or additional types can be added based on your organization's policies.

## Business Rules

### Leave Request Validation
- Employee must have an active employee profile
- Employee must have initialized balances for the current year
- Requested days cannot exceed remaining balance
- Start date cannot be after end date
- At least 1 business day must be requested

### Approval Workflow
- Only managers and HR can approve/reject requests
- Reviewer comments are mandatory
- Approved requests automatically deduct days from balance
- Rejected requests do not affect balance
- Status transitions are: Pending → Approved/Rejected (final states)

### Balance Management
- Balances are year-specific (e.g., 2025 balances separate from 2026)
- Used days increment only when request is approved
- Remaining days = Allocated days - Used days
- Carry-forward balances must be manually adjusted (if enabled)

## Common Tasks

### Adding a New Leave Type
1. Go to Settings → Leave Types
2. Click "Add Leave Type"
3. Configure name, code, allowance, and settings
4. Save and activate
5. Note: Existing employee balances won't auto-update; initialize new balances if needed

### Handling Employee Transfers
If an employee changes departments/managers:
1. Update employee record with new department
2. Leave balances remain unchanged
3. New manager can now approve their requests

### Year-End Balance Rollover
For leave types with carry-forward enabled:
1. Run balance initialization for new year
2. Manually adjust allocated days to include carried-over balance
3. Document the carry-over in internal records

### Bulk Balance Initialization
To initialize balances for multiple employees:
```javascript
// Example: Initialize for all active employees
const employees = await fetch('/api/employees?status=active');
for (const employee of employees) {
  await fetch(`/api/leave/balances/initialize/${employee.id}`, {
    method: 'POST',
    body: JSON.stringify({ year: 2025 })
  });
}
```

## Troubleshooting

### "Employee profile not found" error
- Ensure the user has an associated employee record
- Check that `userId` field links employee to user account
- Verify employee status is "active"

### Balance not updating after approval
- Check browser console for cache invalidation errors
- Verify PUT /api/leave/requests/:id/approve returned 200
- Refresh the page to force data reload
- Check database `leave_balances` table for `usedDays` update

### Request submission fails
- Verify leave balances are initialized for the current year
- Check that requested days don't exceed remaining balance
- Ensure dates are in correct format (YYYY-MM-DD)
- Verify employee has active status

### Approval button not visible
- Confirm user has manager or HR role
- Check that request status is "pending"
- Verify user is not approving their own request (if such validation exists)

## Future Enhancements

Potential improvements for the leave management system:

1. **Email Notifications**: Notify employees when requests are approved/rejected
2. **Calendar Integration**: View team leave on a shared calendar
3. **Conflict Detection**: Warn managers of staffing conflicts
4. **Public Holidays**: Exclude public holidays from business day calculations
5. **Half-Day Requests**: Allow requests for 0.5 day increments
6. **Attachment Support**: Upload medical certificates for sick leave
7. **Delegation**: Allow managers to delegate approval authority
8. **Reporting**: Generate leave utilization reports
9. **Mobile App**: Native mobile app for on-the-go requests
10. **Auto-Approval Rules**: Configure auto-approval for certain scenarios

## Support

For technical issues or questions about the leave management system:
- Review this documentation
- Check the main HRIS Portal documentation (replit.md)
- Contact your system administrator
- Review the codebase in the following key files:
  - `shared/schema.ts` - Database schema definitions
  - `server/routes.ts` - API endpoint implementations
  - `server/storage.ts` - Database operations
  - `client/src/pages/LeaveRequest.tsx` - Request form
  - `client/src/pages/LeaveApprovals.tsx` - Approval interface
