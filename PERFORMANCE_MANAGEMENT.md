# Performance Management System Documentation

## Overview

The HRIS Portal includes a comprehensive performance management system that supports the complete employee performance cycle from goal setting through self-assessments to manager reviews. The system features competency-based evaluations, progress tracking, and integrated goal management.

## System Features

### 1. Performance Reviews
- **Access**: Managers and HR roles
- **Location**: Performance → Performance Reviews
- **Features**:
  - Create detailed performance reviews for employees
  - Five-category competency rating system (1-5 scale)
  - Review period tracking (start/end dates)
  - Overall rating calculation
  - Manager comments and feedback
  - Status workflow management
  - Filter reviews by status

### 2. Performance Goals
- **Access**: All employees (create their own), Managers (approve and create for team)
- **Location**: Performance → Goals
- **Features**:
  - Create and track performance goals
  - Three categories: Individual, Team, Company
  - Progress tracking with visual sliders (0-100%)
  - Target date setting
  - Status tracking (not started, in progress, completed, missed)
  - Goal approval workflow
  - Link goals to performance reviews
  - Filter by status and category

### 3. Employee Self-Assessment
- **Access**: All employees
- **Location**: Performance → Self-Assessment
- **Features**:
  - Complete self-evaluations for assigned reviews
  - Self-rating on five competency categories
  - Overall self-rating submission
  - Achievements and development areas documentation
  - Automatically finds pending reviews
  - Updates review status to 'in_progress'

### 4. My Performance Dashboard
- **Access**: All employees
- **Location**: Employee Self-Service → My Performance
- **Features**:
  - Unified view of all performance data
  - Display all performance reviews with status
  - Show all assigned goals with progress
  - Quick access to pending self-assessments
  - Visual status indicators and progress bars
  - Empty states for new employees

## User Workflows

### Employee: Completing Self-Assessment

1. Navigate to **Performance → Self-Assessment**
2. System automatically finds reviews assigned to you with status 'self_assessment'
3. Review the review period and manager information
4. Rate yourself on five competencies (1-5 scale):
   - Technical Skills
   - Communication
   - Leadership
   - Teamwork
   - Problem Solving
5. Enter **Overall Self-Rating** (1-5)
6. Write your **Self-Assessment** narrative
7. Document your **Achievements**
8. Identify **Areas for Development**
9. Click **Submit Self-Assessment**
10. Review status updates to 'in_progress'
11. Manager will now complete their assessment

### Employee: Creating and Tracking Goals

1. Navigate to **Performance → Goals**
2. Click **Create Goal** button
3. Fill in goal details:
   - Title (e.g., "Improve TypeScript proficiency")
   - Description (detailed explanation)
   - Category (Individual, Team, or Company)
   - Target Date
   - Initial Progress (0-100%)
4. Click **Create Goal**
5. Goal enters "not_started" or "in_progress" status
6. Update progress regularly using the progress slider
7. Link goals to performance reviews if applicable
8. Mark complete when achieved

### Manager/HR: Creating Performance Review

1. Navigate to **Performance → Performance Reviews**
2. Click **New Review** button
3. Select the **Employee** to review
4. Select yourself as **Reviewer**
5. Set **Review Period Start** and **End** dates
6. Leave competency ratings empty initially (employee will self-assess first)
7. Add any initial **Goals** for the review period
8. Click **Save**
9. Review is created with status 'draft'
10. Optionally change status to 'self_assessment' to notify employee

### Manager/HR: Finalizing Performance Review

1. Navigate to **Performance → Performance Reviews**
2. Filter by **In Progress** to see reviews with completed self-assessments
3. Click on a review to view/edit
4. Review employee's self-assessment and self-ratings
5. Rate employee on five competencies (using sliders):
   - Technical Skills Rating (1-5)
   - Communication Rating (1-5)
   - Leadership Rating (1-5)
   - Teamwork Rating (1-5)
   - Problem Solving Rating (1-5)
6. Enter **Overall Rating** (1-5)
7. Document **Achievements** (what they accomplished)
8. Identify **Areas for Improvement**
9. Add **Manager Comments**
10. Set **Goals** for next period
11. Update status to 'completed'
12. Click **Save Review**

### Manager: Approving Goals

1. Navigate to **Performance → Goals**
2. Filter by status or category to find employee goals
3. Review goal details and feasibility
4. Edit the goal to mark yourself as **Approved By**
5. Set **Approved At** timestamp
6. Goal is now officially approved

## Technical Architecture

### Database Schema

**performance_reviews** - Performance review records
- id (primary key, UUID)
- employeeId (foreign key → employees)
- reviewerId (foreign key → employees)
- reviewPeriodStart (date)
- reviewPeriodEnd (date)
- overallRating (integer, 1-5)
- technicalSkillsRating (integer, 1-5)
- communicationRating (integer, 1-5)
- leadershipRating (integer, 1-5)
- teamworkRating (integer, 1-5)
- problemSolvingRating (integer, 1-5)
- selfAssessment (text)
- selfRating (integer, 1-5)
- goals (text)
- achievements (text)
- areasForImprovement (text)
- comments (text)
- status (varchar: 'draft', 'self_assessment', 'in_progress', 'completed')
- submittedAt (timestamp)
- completedAt (timestamp)
- createdAt (timestamp)
- updatedAt (timestamp)

**performance_goals** - Goal tracking
- id (primary key, UUID)
- employeeId (foreign key → employees)
- title (varchar)
- description (text)
- category (varchar: 'individual', 'team', 'company')
- targetDate (date)
- progress (integer, 0-100)
- status (varchar: 'not_started', 'in_progress', 'completed', 'missed')
- linkedReviewId (foreign key → performance_reviews, optional)
- createdBy (foreign key → employees)
- approvedBy (foreign key → employees, optional)
- approvedAt (timestamp)
- completedAt (timestamp)
- createdAt (timestamp)
- updatedAt (timestamp)

### API Endpoints

**Performance Reviews**
- `GET /api/performance/reviews` - List all reviews (supports ?status=draft|in_progress|completed filter)
- `POST /api/performance/reviews` - Create new performance review
- `GET /api/performance/reviews/:id` - Get specific review details
- `PUT /api/performance/reviews/:id` - Update review (self-assessment or manager finalization)
- `DELETE /api/performance/reviews/:id` - Delete review

**Performance Goals**
- `GET /api/performance/goals` - List all goals (supports ?status and ?category filters)
- `POST /api/performance/goals` - Create new goal
- `GET /api/performance/goals/:id` - Get specific goal details
- `PUT /api/performance/goals/:id` - Update goal (progress, status, approval)
- `DELETE /api/performance/goals/:id` - Delete goal

**Employees**
- `GET /api/employees/by-user/:userId` - Get employee record by user ID

### Frontend Components

**Pages:**
- `Performance.tsx` - Performance reviews list and creation (manager/HR view)
- `Goals.tsx` - Goals management (all users)
- `SelfAssessment.tsx` - Employee self-evaluation interface
- `MyPerformance.tsx` - Employee performance dashboard

**Key Features:**
- Real-time form validation with Zod schemas
- TanStack Query for data fetching and caching
- Automatic cache invalidation on mutations
- Slider components for ratings and progress
- Color-coded status badges
- Responsive dialogs for forms
- Empty states for new users

## Competency Rating System

The system uses a standardized 1-5 rating scale for all competencies:

### Rating Scale
- **1 - Needs Improvement**: Performance below expectations, requires significant development
- **2 - Developing**: Showing progress but not yet meeting full expectations
- **3 - Meets Expectations**: Solid performance, meeting role requirements
- **4 - Exceeds Expectations**: Consistently performs above role requirements
- **5 - Outstanding**: Exceptional performance, role model for others

### Five Core Competencies

1. **Technical Skills**
   - Job-specific technical knowledge
   - Tool and technology proficiency
   - Quality of technical output

2. **Communication**
   - Clarity in verbal and written communication
   - Active listening skills
   - Information sharing and collaboration

3. **Leadership**
   - Initiative and ownership
   - Mentoring and guiding others
   - Decision-making ability

4. **Teamwork**
   - Collaboration with colleagues
   - Support for team goals
   - Conflict resolution

5. **Problem Solving**
   - Analytical thinking
   - Creative solutions
   - Handling complex challenges

## Business Rules

### Performance Review Workflow

**Status Transitions:**
1. **Draft** → Manager creates review, sets period
2. **Self-Assessment** → Employee completes self-evaluation
3. **In Progress** → Manager finalizes ratings and feedback
4. **Completed** → Review is finalized and archived

**Validation Rules:**
- Review period end date must be after start date
- Competency ratings must be 1-5 (if provided)
- Self-assessment can only be submitted by the employee being reviewed
- Manager finalization requires reviewer to be different from employee (no self-reviews)

### Goal Management

**Status Transitions:**
- **Not Started** → Goal created but work hasn't begun
- **In Progress** → Actively working on goal
- **Completed** → Goal achieved successfully
- **Missed** → Target date passed without completion

**Validation Rules:**
- Progress must be 0-100%
- Target date should be in the future (for new goals)
- Employee can create individual goals
- Managers can create team/company goals
- Goals can be linked to specific reviews

## Common Tasks

### Setting Up Performance Review Cycle

**Quarterly/Annual Review Process:**
1. Manager creates reviews for all team members
2. Set review period (e.g., Q1 2025: Jan 1 - Mar 31)
3. Update status to 'self_assessment'
4. Employees complete self-assessments
5. Managers review self-assessments and finalize ratings
6. Schedule 1-on-1 meetings to discuss results
7. Create goals for next review period

### Goal Setting Best Practices

**SMART Goals Framework:**
- **S**pecific: Clearly defined objective
- **M**easurable: Quantifiable progress (0-100%)
- **A**chievable: Realistic and attainable
- **R**elevant: Aligned with role and company objectives
- **T**ime-bound: Target date specified

### Tracking Employee Development

1. Review **My Performance** dashboard regularly
2. Update goal progress weekly/monthly
3. Document achievements as they happen
4. Identify skill gaps early
5. Request manager feedback proactively
6. Link goals to development areas from reviews

### Managing Team Performance (Manager)

1. Create consistent review schedules
2. Provide regular feedback (not just during reviews)
3. Approve employee goals promptly
4. Track team goal progress
5. Use competency ratings to identify training needs
6. Document specific examples in comments

## Troubleshooting

### "No pending reviews found" in Self-Assessment
- Ensure your manager has created a review for you
- Check that review status is 'self_assessment' (not 'draft')
- Verify you're logged in with the correct employee account
- Confirm your user account is linked to an employee record

### Cannot submit self-assessment
- Ensure all required fields are filled (self-rating, self-assessment)
- Check that competency ratings are between 1-5
- Verify you're the employee assigned to the review
- Check browser console for validation errors

### Goals not appearing
- Verify you're filtering correctly (status/category)
- Check that goals are created for your employee record
- Ensure you have proper role permissions
- Refresh the page to reload data

### Review creation fails
- Verify employee exists in the system
- Ensure review period dates are valid (end > start)
- Check that reviewer is a valid employee
- Confirm you have manager or HR role

## Performance Review Templates

### Example Self-Assessment

**Self-Assessment Narrative:**
```
During this review period, I focused on improving my TypeScript skills
and contributing to the team's migration to microservices architecture.
I successfully delivered 3 major features on schedule and mentored 2
junior developers on React best practices.
```

**Achievements:**
```
- Led migration of authentication system to TypeScript (100% type coverage)
- Reduced API response time by 40% through query optimization
- Presented at monthly tech talk on performance optimization
- Mentored 2 junior developers, both received positive feedback
```

**Areas for Development:**
```
- Improve system design skills for large-scale applications
- Learn Kubernetes for container orchestration
- Strengthen project management capabilities
- Develop better estimation skills for complex tasks
```

### Example Manager Comments

**Positive Review:**
```
[Employee] has consistently exceeded expectations this quarter. Their
technical contributions to the TypeScript migration were outstanding,
and their mentoring of junior team members demonstrates strong leadership
potential. Areas for growth include system design and project management,
which we'll focus on next quarter through targeted training.
```

**Constructive Review:**
```
[Employee] is developing well in their role but needs to focus on
communication and collaboration. Technical skills are solid, but missed
deadlines on 2 projects due to unclear requirements and insufficient
proactive communication. Recommend weekly 1-on-1s and clearer task
documentation to improve in these areas.
```

## Reporting and Analytics

### Available Metrics (Future Enhancement)
- Average competency ratings by department
- Goal completion rates
- Performance trends over time
- Self-rating vs. manager rating comparisons
- Top performers identification
- Development area patterns

### Export Capabilities (Future Enhancement)
- Export review as PDF
- Goal progress reports
- Team performance summaries
- Historical review data

## Integration with Other Modules

### Employee Management
- Reviews linked to employee records
- Automatic employee lookup by user ID
- Department-based reporting (future)

### Goal Linkage
- Goals can be linked to specific reviews
- Review goals inform next period's objectives
- Continuous performance improvement cycle

## Future Enhancements

Potential improvements for the performance management system:

1. **360-Degree Feedback**: Collect feedback from peers, subordinates, and stakeholders
2. **Review Templates**: Pre-defined review structures for different roles
3. **Email Notifications**: Automated reminders for pending self-assessments and reviews
4. **Performance Trends**: Historical performance data visualization
5. **Development Plans**: Structured individual development planning (IDP)
6. **Calibration Sessions**: Manager alignment meetings for rating consistency
7. **Goal Libraries**: Pre-defined goal templates by role/department
8. **Review Scheduling**: Automatic review cycle creation
9. **Mobile Access**: Native mobile app for goal tracking
10. **Analytics Dashboard**: Team and organization performance insights
11. **Skill Matrix**: Track competencies across the organization
12. **Succession Planning**: Identify high-potential employees
13. **PDF Export**: Generate formal review documents
14. **Review Signatures**: Digital approval workflow
15. **Performance Improvement Plans (PIP)**: Structured underperformance management

## Best Practices

### For Employees
- Complete self-assessments thoughtfully and honestly
- Update goal progress regularly (at least monthly)
- Document achievements throughout the period
- Seek feedback proactively, not just during reviews
- Create SMART goals aligned with career development
- Review previous feedback before starting new cycle

### For Managers
- Provide timely, specific, and actionable feedback
- Use the 1-5 scale consistently across all team members
- Document specific examples to support ratings
- Balance positive feedback with constructive criticism
- Approve employee goals within 1 week of creation
- Conduct review discussions face-to-face
- Align individual goals with team/company objectives

### For HR
- Ensure all employees have annual reviews
- Monitor review completion rates
- Provide manager training on effective reviews
- Maintain rating calibration across departments
- Track performance trends for talent decisions
- Ensure fairness and consistency in the process

## Support

For technical issues or questions about the performance management system:
- Review this documentation
- Check the main HRIS Portal documentation (replit.md)
- Check the workflow guide (PERFORMANCE_WORKFLOW_GUIDE.md)
- Contact your system administrator
- Review the codebase in the following key files:
  - `shared/schema.ts` - Database schema definitions
  - `server/routes.ts` - API endpoint implementations
  - `server/storage.ts` - Database operations
  - `client/src/pages/Performance.tsx` - Manager review interface
  - `client/src/pages/Goals.tsx` - Goal management interface
  - `client/src/pages/SelfAssessment.tsx` - Employee self-assessment
  - `client/src/pages/MyPerformance.tsx` - Employee dashboard
