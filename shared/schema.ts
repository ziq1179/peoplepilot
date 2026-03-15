import { sql } from 'drizzle-orm';
import { 
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('employee'), // 'admin', 'hr', 'manager', 'employee'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company
export const company = pgTable("company", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  legalName: varchar("legal_name"),
  registrationNumber: varchar("registration_number"),
  taxId: varchar("tax_id"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country"),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  managerId: varchar("manager_id").references(() => employees.id),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").references(() => departments.id),
  teamLeadId: varchar("team_lead_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sub Teams
export const subTeams = pgTable("sub_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  subTeamLeadId: varchar("sub_team_lead_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Positions
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").references(() => departments.id),
  minSalary: decimal("min_salary", { precision: 10, scale: 2 }),
  maxSalary: decimal("max_salary", { precision: 10, scale: 2 }),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeId: varchar("employee_id").unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").unique().notNull(),
  phone: varchar("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  hireDate: date("hire_date").notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  positionId: varchar("position_id").references(() => positions.id),
  managerId: varchar("manager_id").references(() => employees.id),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  status: varchar("status").notNull().default('active'), // 'active', 'inactive', 'terminated', 'on_leave'
  profilePicture: varchar("profile_picture"),
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  date: date("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakDuration: integer("break_duration").default(0), // in minutes
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }),
  status: varchar("status").notNull().default('present'), // 'present', 'absent', 'late', 'half_day', 'on_leave'
  notes: text("notes"),
  location: varchar("location"), // for remote/office tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_attendance_employee_date").on(table.employeeId, table.date),
  index("idx_attendance_date").on(table.date),
]);

// Timesheets
export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  totalHours: decimal("total_hours", { precision: 6, scale: 2 }),
  regularHours: decimal("regular_hours", { precision: 6, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 6, scale: 2 }),
  status: varchar("status").notNull().default('draft'), // 'draft', 'submitted', 'approved', 'rejected'
  submittedAt: timestamp("submitted_at"),
  approvedBy: varchar("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_timesheet_employee_week").on(table.employeeId, table.weekStartDate),
]);

// Onboarding Templates
export const onboardingTemplates = pgTable("onboarding_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").references(() => departments.id),
  positionId: varchar("position_id").references(() => positions.id),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Onboarding Checklist Items (Template)
export const onboardingChecklistItems = pgTable("onboarding_checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => onboardingTemplates.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'document', 'task', 'training', 'setup', 'other'
  isRequired: boolean("is_required").default(true),
  order: integer("order").default(0),
  assignedTo: varchar("assigned_to").references(() => employees.id), // HR, Manager, IT, etc.
  dueDays: integer("due_days"), // Days from start date
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee Onboarding Records
export const employeeOnboarding = pgTable("employee_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  templateId: varchar("template_id").references(() => onboardingTemplates.id),
  startDate: date("start_date").notNull(),
  expectedCompletionDate: date("expected_completion_date"),
  actualCompletionDate: date("actual_completion_date"),
  status: varchar("status").notNull().default('in_progress'), // 'not_started', 'in_progress', 'completed', 'on_hold'
  assignedTo: varchar("assigned_to").references(() => employees.id), // HR person managing onboarding
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_employee").on(table.employeeId),
  index("idx_onboarding_status").on(table.status),
]);

// Onboarding Tasks (Instance)
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onboardingId: varchar("onboarding_id").references(() => employeeOnboarding.id).notNull(),
  checklistItemId: varchar("checklist_item_id").references(() => onboardingChecklistItems.id),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
  assignedTo: varchar("assigned_to").references(() => employees.id),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  completedBy: varchar("completed_by").references(() => employees.id),
  notes: text("notes"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_task_onboarding").on(table.onboardingId),
  index("idx_onboarding_task_status").on(table.status),
]);

// Onboarding Documents
export const onboardingDocuments = pgTable("onboarding_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onboardingId: varchar("onboarding_id").references(() => employeeOnboarding.id).notNull(),
  taskId: varchar("task_id").references(() => onboardingTasks.id),
  documentType: varchar("document_type").notNull(), // 'contract', 'id', 'certificate', 'form', 'other'
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploadedBy: varchar("uploaded_by").references(() => employees.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedBy: varchar("verified_by").references(() => employees.id),
  verifiedAt: timestamp("verified_at"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'verified', 'rejected'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_doc_onboarding").on(table.onboardingId),
]);

// Leave Types
export const leaveTypes = pgTable("leave_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  daysAllowed: integer("days_allowed").notNull(),
  carryForward: boolean("carry_forward").default(false),
  color: varchar("color").default('#3b82f6'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leave Requests
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  leaveTypeId: varchar("leave_type_id").references(() => leaveTypes.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysRequested: integer("days_requested").notNull(),
  reason: text("reason"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by").references(() => employees.id),
  approvalDate: timestamp("approval_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Balances
export const leaveBalances = pgTable("leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  leaveTypeId: varchar("leave_type_id").references(() => leaveTypes.id).notNull(),
  year: integer("year").notNull(),
  allocated: integer("allocated").notNull(),
  used: integer("used").default(0),
  remaining: integer("remaining").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  payPeriodStart: date("pay_period_start").notNull(),
  payPeriodEnd: date("pay_period_end").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default('0'),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default('0'),
  taxes: decimal("taxes", { precision: 10, scale: 2 }).default('0'),
  netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default('draft'), // 'draft', 'processed', 'paid'
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance Reviews
export const performanceReviews = pgTable("performance_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => employees.id).notNull(),
  reviewPeriodStart: date("review_period_start").notNull(),
  reviewPeriodEnd: date("review_period_end").notNull(),
  overallRating: integer("overall_rating"), // 1-5 scale
  
  // Competency Ratings (1-5 scale)
  technicalSkillsRating: integer("technical_skills_rating"),
  communicationRating: integer("communication_rating"),
  leadershipRating: integer("leadership_rating"),
  teamworkRating: integer("teamwork_rating"),
  problemSolvingRating: integer("problem_solving_rating"),
  
  // Self-assessment (completed by employee)
  selfAssessment: text("self_assessment"),
  selfRating: integer("self_rating"), // Employee's own overall rating
  
  goals: text("goals"),
  achievements: text("achievements"),
  areasForImprovement: text("areas_for_improvement"),
  comments: text("comments"),
  status: varchar("status").notNull().default('draft'), // 'draft', 'self_assessment', 'in_progress', 'completed'
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance Goals
export const performanceGoals = pgTable("performance_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default('individual'), // 'individual', 'team', 'company'
  targetDate: date("target_date"),
  progress: integer("progress").default(0), // 0-100%
  status: varchar("status").notNull().default('not_started'), // 'not_started', 'in_progress', 'completed', 'missed'
  linkedReviewId: varchar("linked_review_id").references(() => performanceReviews.id),
  createdBy: varchar("created_by").references(() => employees.id).notNull(),
  approvedBy: varchar("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  name: varchar("name").notNull(),
  description: text("description"),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: varchar("file_path").notNull(),
  category: varchar("category").notNull(), // 'contract', 'policy', 'personal', 'payroll', 'performance'
  isConfidential: boolean("is_confidential").default(false),
  uploadedBy: varchar("uploaded_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recruitment - Job Postings
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  positionId: varchar("position_id").references(() => positions.id),
  location: varchar("location"),
  employmentType: varchar("employment_type").notNull().default('full-time'), // 'full-time', 'part-time', 'contract', 'internship'
  salaryMin: decimal("salary_min", { precision: 10, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 10, scale: 2 }),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  qualifications: text("qualifications"),
  benefits: text("benefits"),
  status: varchar("status").notNull().default('draft'), // 'draft', 'open', 'closed', 'on-hold'
  openings: integer("openings").default(1),
  applicationDeadline: date("application_deadline"),
  postedBy: varchar("posted_by").references(() => employees.id),
  postedAt: timestamp("posted_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recruitment - Applications
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: varchar("job_posting_id").references(() => jobPostings.id).notNull(),
  candidateName: varchar("candidate_name").notNull(),
  candidateEmail: varchar("candidate_email").notNull(),
  candidatePhone: varchar("candidate_phone", { length: 50 }),
  resumeUrl: varchar("resume_url"),
  coverLetter: text("cover_letter"),
  linkedinUrl: varchar("linkedin_url"),
  portfolioUrl: varchar("portfolio_url"),
  yearsOfExperience: integer("years_of_experience"),
  currentCompany: varchar("current_company"),
  currentPosition: varchar("current_position"),
  expectedSalary: decimal("expected_salary", { precision: 10, scale: 2 }),
  noticePeriod: varchar("notice_period"),
  status: varchar("status").notNull().default('new'), // 'new', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'
  rating: integer("rating"), // 1-5 scale
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  assignedTo: varchar("assigned_to").references(() => employees.id), // HR or hiring manager
  screenedBy: varchar("screened_by").references(() => employees.id),
  screenedAt: timestamp("screened_at"),
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recruitment - Interviews
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => applications.id).notNull(),
  interviewType: varchar("interview_type").notNull(), // 'phone', 'video', 'in-person', 'technical', 'hr', 'final'
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(60), // minutes
  location: varchar("location"), // physical location or video link
  interviewerId: varchar("interviewer_id").references(() => employees.id),
  additionalInterviewers: text("additional_interviewers"), // comma-separated employee IDs or names
  status: varchar("status").notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled', 'no-show'
  feedback: text("feedback"),
  technicalRating: integer("technical_rating"), // 1-5
  communicationRating: integer("communication_rating"), // 1-5
  cultureFitRating: integer("culture_fit_rating"), // 1-5
  overallRating: integer("overall_rating"), // 1-5
  recommendation: varchar("recommendation"), // 'strong-hire', 'hire', 'maybe', 'no-hire'
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const departmentRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  positions: many(positions),
  teams: many(teams),
  manager: one(employees, {
    fields: [departments.managerId],
    references: [employees.id],
  }),
}));

export const teamRelations = relations(teams, ({ many, one }) => ({
  department: one(departments, {
    fields: [teams.departmentId],
    references: [departments.id],
  }),
  teamLead: one(employees, {
    fields: [teams.teamLeadId],
    references: [employees.id],
  }),
  subTeams: many(subTeams),
}));

export const subTeamRelations = relations(subTeams, ({ one }) => ({
  team: one(teams, {
    fields: [subTeams.teamId],
    references: [teams.id],
  }),
  subTeamLead: one(employees, {
    fields: [subTeams.subTeamLeadId],
    references: [employees.id],
  }),
}));

export const positionRelations = relations(positions, ({ many, one }) => ({
  employees: many(employees),
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
}));

export const employeeRelations = relations(employees, ({ many, one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
    relationName: "manager",
  }),
  directReports: many(employees, {
    relationName: "manager",
  }),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
  payrollRecords: many(payrollRecords),
  performanceReviews: many(performanceReviews),
  performanceGoals: many(performanceGoals),
  documents: many(documents),
  attendanceRecords: many(attendanceRecords),
  timesheets: many(timesheets),
  onboarding: many(employeeOnboarding),
}));

export const onboardingTemplateRelations = relations(onboardingTemplates, ({ many, one }) => ({
  department: one(departments, {
    fields: [onboardingTemplates.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [onboardingTemplates.positionId],
    references: [positions.id],
  }),
  checklistItems: many(onboardingChecklistItems),
  onboardingRecords: many(employeeOnboarding),
}));

export const onboardingChecklistItemRelations = relations(onboardingChecklistItems, ({ one }) => ({
  template: one(onboardingTemplates, {
    fields: [onboardingChecklistItems.templateId],
    references: [onboardingTemplates.id],
  }),
  assignedToEmployee: one(employees, {
    fields: [onboardingChecklistItems.assignedTo],
    references: [employees.id],
  }),
}));

export const employeeOnboardingRelations = relations(employeeOnboarding, ({ many, one }) => ({
  employee: one(employees, {
    fields: [employeeOnboarding.employeeId],
    references: [employees.id],
  }),
  template: one(onboardingTemplates, {
    fields: [employeeOnboarding.templateId],
    references: [onboardingTemplates.id],
  }),
  assignedToEmployee: one(employees, {
    fields: [employeeOnboarding.assignedTo],
    references: [employees.id],
  }),
  tasks: many(onboardingTasks),
  documents: many(onboardingDocuments),
}));

export const onboardingTaskRelations = relations(onboardingTasks, ({ one, many }) => ({
  onboarding: one(employeeOnboarding, {
    fields: [onboardingTasks.onboardingId],
    references: [employeeOnboarding.id],
  }),
  checklistItem: one(onboardingChecklistItems, {
    fields: [onboardingTasks.checklistItemId],
    references: [onboardingChecklistItems.id],
  }),
  assignedToEmployee: one(employees, {
    fields: [onboardingTasks.assignedTo],
    references: [employees.id],
  }),
  completedByEmployee: one(employees, {
    fields: [onboardingTasks.completedBy],
    references: [employees.id],
  }),
  documents: many(onboardingDocuments),
}));

export const onboardingDocumentRelations = relations(onboardingDocuments, ({ one }) => ({
  onboarding: one(employeeOnboarding, {
    fields: [onboardingDocuments.onboardingId],
    references: [employeeOnboarding.id],
  }),
  task: one(onboardingTasks, {
    fields: [onboardingDocuments.taskId],
    references: [onboardingTasks.id],
  }),
  uploadedByEmployee: one(employees, {
    fields: [onboardingDocuments.uploadedBy],
    references: [employees.id],
  }),
  verifiedByEmployee: one(employees, {
    fields: [onboardingDocuments.verifiedBy],
    references: [employees.id],
  }),
}));

export const attendanceRecordRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

export const timesheetRelations = relations(timesheets, ({ one }) => ({
  employee: one(employees, {
    fields: [timesheets.employeeId],
    references: [employees.id],
  }),
  approver: one(employees, {
    fields: [timesheets.approvedBy],
    references: [employees.id],
  }),
}));

export const leaveRequestRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approver: one(employees, {
    fields: [leaveRequests.approvedBy],
    references: [employees.id],
  }),
}));

export const leaveBalanceRelations = relations(leaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveBalances.leaveTypeId],
    references: [leaveTypes.id],
  }),
}));

export const payrollRecordRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [payrollRecords.employeeId],
    references: [employees.id],
  }),
}));

export const performanceReviewRelations = relations(performanceReviews, ({ one, many }) => ({
  employee: one(employees, {
    fields: [performanceReviews.employeeId],
    references: [employees.id],
  }),
  reviewer: one(employees, {
    fields: [performanceReviews.reviewerId],
    references: [employees.id],
  }),
  goals: many(performanceGoals),
}));

export const performanceGoalRelations = relations(performanceGoals, ({ one }) => ({
  employee: one(employees, {
    fields: [performanceGoals.employeeId],
    references: [employees.id],
  }),
  createdBy: one(employees, {
    fields: [performanceGoals.createdBy],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [performanceGoals.approvedBy],
    references: [employees.id],
  }),
  linkedReview: one(performanceReviews, {
    fields: [performanceGoals.linkedReviewId],
    references: [performanceReviews.id],
  }),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  employee: one(employees, {
    fields: [documents.employeeId],
    references: [employees.id],
  }),
  uploadedBy: one(employees, {
    fields: [documents.uploadedBy],
    references: [employees.id],
  }),
}));

export const jobPostingRelations = relations(jobPostings, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobPostings.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [jobPostings.positionId],
    references: [positions.id],
  }),
  postedBy: one(employees, {
    fields: [jobPostings.postedBy],
    references: [employees.id],
  }),
  applications: many(applications),
}));

export const applicationRelations = relations(applications, ({ one, many }) => ({
  jobPosting: one(jobPostings, {
    fields: [applications.jobPostingId],
    references: [jobPostings.id],
  }),
  assignedTo: one(employees, {
    fields: [applications.assignedTo],
    references: [employees.id],
  }),
  screenedBy: one(employees, {
    fields: [applications.screenedBy],
    references: [employees.id],
  }),
  interviews: many(interviews),
}));

export const interviewRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
  interviewer: one(employees, {
    fields: [interviews.interviewerId],
    references: [employees.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(company).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubTeamSchema = createInsertSchema(subTeams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingTemplateSchema = createInsertSchema(onboardingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingChecklistItemSchema = createInsertSchema(onboardingChecklistItems).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeOnboardingSchema = createInsertSchema(employeeOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingDocumentSchema = createInsertSchema(onboardingDocuments).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceGoalSchema = createInsertSchema(performanceGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Company = typeof company.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Position = typeof positions.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type SubTeam = typeof subTeams.$inferSelect;
export type InsertSubTeam = z.infer<typeof insertSubTeamSchema>;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;
export type OnboardingChecklistItem = typeof onboardingChecklistItems.$inferSelect;
export type InsertOnboardingChecklistItem = z.infer<typeof insertOnboardingChecklistItemSchema>;
export type EmployeeOnboarding = typeof employeeOnboarding.$inferSelect;
export type InsertEmployeeOnboarding = z.infer<typeof insertEmployeeOnboardingSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingDocument = typeof onboardingDocuments.$inferSelect;
export type InsertOnboardingDocument = z.infer<typeof insertOnboardingDocumentSchema>;
export type LeaveType = typeof leaveTypes.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceGoal = typeof performanceGoals.$inferSelect;
export type InsertPerformanceGoal = z.infer<typeof insertPerformanceGoalSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
