import {
  users,
  company,
  departments,
  teams,
  subTeams,
  positions,
  employees,
  attendanceRecords,
  timesheets,
  onboardingTemplates,
  onboardingChecklistItems,
  employeeOnboarding,
  onboardingTasks,
  onboardingDocuments,
  leaveTypes,
  leaveRequests,
  leaveBalances,
  payrollRecords,
  performanceReviews,
  performanceGoals,
  documents,
  jobPostings,
  applications,
  interviews,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Department,
  type InsertDepartment,
  type Team,
  type InsertTeam,
  type SubTeam,
  type InsertSubTeam,
  type Position,
  type InsertPosition,
  type Employee,
  type InsertEmployee,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Timesheet,
  type InsertTimesheet,
  type OnboardingTemplate,
  type InsertOnboardingTemplate,
  type OnboardingChecklistItem,
  type InsertOnboardingChecklistItem,
  type EmployeeOnboarding,
  type InsertEmployeeOnboarding,
  type OnboardingTask,
  type InsertOnboardingTask,
  type OnboardingDocument,
  type InsertOnboardingDocument,
  type LeaveType,
  type InsertLeaveType,
  type LeaveRequest,
  type InsertLeaveRequest,
  type LeaveBalance,
  type InsertLeaveBalance,
  type PayrollRecord,
  type InsertPayrollRecord,
  type PerformanceReview,
  type InsertPerformanceReview,
  type PerformanceGoal,
  type InsertPerformanceGoal,
  type Document,
  type InsertDocument,
  type JobPosting,
  type InsertJobPosting,
  type Application,
  type InsertApplication,
  type Interview,
  type InsertInterview,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or, count, sql } from "drizzle-orm";
import { calculatePayroll } from "./lib/payroll-calc";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);


// Interface for storage operations
export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<Omit<UpsertUser, 'password'>>): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
  
  // Company operations
  getCompany(): Promise<Company | null>;
  upsertCompany(company: InsertCompany): Promise<Company>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;
  
  // Team operations
  getTeams(filters?: { departmentId?: string }): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  
  // Sub-team operations
  getSubTeams(filters?: { teamId?: string }): Promise<SubTeam[]>;
  getSubTeam(id: string): Promise<SubTeam | undefined>;
  createSubTeam(subTeam: InsertSubTeam): Promise<SubTeam>;
  updateSubTeam(id: string, subTeam: Partial<InsertSubTeam>): Promise<SubTeam>;
  deleteSubTeam(id: string): Promise<void>;
  
  // Position operations
  getPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  getPositionsByDepartment(departmentId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position>;
  deletePosition(id: string): Promise<void>;
  
  // Employee operations
  getEmployees(filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
  }): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  // Attendance operations
  getAttendanceRecords(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
  }): Promise<AttendanceRecord[]>;
  getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined>;
  getTodayAttendanceRecord(employeeId: string): Promise<AttendanceRecord | undefined>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord>;
  clockIn(employeeId: string, location?: string): Promise<AttendanceRecord>;
  clockOut(employeeId: string): Promise<AttendanceRecord>;
  
  // Timesheet operations
  getTimesheets(filters?: {
    employeeId?: string;
    weekStartDate?: string;
    status?: string;
  }): Promise<Timesheet[]>;
  getTimesheet(id: string): Promise<Timesheet | undefined>;
  getTimesheetByWeek(employeeId: string, weekStartDate: string): Promise<Timesheet | undefined>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: string, timesheet: Partial<InsertTimesheet>): Promise<Timesheet>;
  submitTimesheet(id: string): Promise<Timesheet>;
  approveTimesheet(id: string, approvedBy: string): Promise<Timesheet>;
  rejectTimesheet(id: string, approvedBy: string, reason: string): Promise<Timesheet>;
  
  // Leave type operations
  getLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  updateLeaveType(id: string, leaveType: Partial<InsertLeaveType>): Promise<LeaveType>;
  deleteLeaveType(id: string): Promise<void>;
  
  // Leave request operations
  getLeaveRequests(filters?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, leaveRequest: Partial<InsertLeaveRequest>): Promise<LeaveRequest>;
  
  // Leave balance operations
  getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance>;
  initializeLeaveBalancesForEmployee(employeeId: string, year: number): Promise<void>;
  
  // Payroll operations
  getPayrollRecords(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<PayrollRecord[]>;
  createPayrollRecord(payroll: InsertPayrollRecord): Promise<PayrollRecord>;
  updatePayrollRecord(id: string, payroll: Partial<InsertPayrollRecord>): Promise<PayrollRecord>;
  generatePayrollForPeriod(
    payPeriodStart: string,
    payPeriodEnd: string,
    employeeIds?: string[]
  ): Promise<PayrollRecord[]>;
  
  // Performance review operations
  getPerformanceReviews(filters?: {
    employeeId?: string;
    reviewerId?: string;
    status?: string;
  }): Promise<PerformanceReview[]>;
  getPerformanceReview(id: string): Promise<PerformanceReview | undefined>;
  createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: string, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview>;
  
  // Performance goal operations
  getPerformanceGoals(filters?: {
    employeeId?: string;
    status?: string;
    createdBy?: string;
  }): Promise<PerformanceGoal[]>;
  getPerformanceGoal(id: string): Promise<PerformanceGoal | undefined>;
  createPerformanceGoal(goal: InsertPerformanceGoal): Promise<PerformanceGoal>;
  updatePerformanceGoal(id: string, goal: Partial<InsertPerformanceGoal>): Promise<PerformanceGoal>;
  deletePerformanceGoal(id: string): Promise<void>;
  
  // Document operations
  getDocuments(filters?: {
    employeeId?: string;
    category?: string;
  }): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Job posting operations
  getJobPostings(filters?: {
    status?: string;
    departmentId?: string;
  }): Promise<JobPosting[]>;
  getJobPosting(id: string): Promise<JobPosting | undefined>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, jobPosting: Partial<InsertJobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: string): Promise<void>;
  
  // Application operations
  getApplications(filters?: {
    jobPostingId?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application>;
  deleteApplication(id: string): Promise<void>;
  
  // Interview operations
  getInterviews(filters?: {
    applicationId?: string;
    interviewerId?: string;
    status?: string;
  }): Promise<Interview[]>;
  getInterview(id: string): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  
  // Onboarding Template operations
  getOnboardingTemplates(filters?: {
    departmentId?: string;
    positionId?: string;
    isDefault?: boolean;
  }): Promise<OnboardingTemplate[]>;
  getOnboardingTemplate(id: string): Promise<OnboardingTemplate | undefined>;
  createOnboardingTemplate(template: InsertOnboardingTemplate): Promise<OnboardingTemplate>;
  updateOnboardingTemplate(id: string, template: Partial<InsertOnboardingTemplate>): Promise<OnboardingTemplate>;
  deleteOnboardingTemplate(id: string): Promise<void>;
  
  // Onboarding Checklist Item operations
  getOnboardingChecklistItems(templateId: string): Promise<OnboardingChecklistItem[]>;
  createOnboardingChecklistItem(item: InsertOnboardingChecklistItem): Promise<OnboardingChecklistItem>;
  updateOnboardingChecklistItem(id: string, item: Partial<InsertOnboardingChecklistItem>): Promise<OnboardingChecklistItem>;
  deleteOnboardingChecklistItem(id: string): Promise<void>;
  
  // Employee Onboarding operations
  getEmployeeOnboardings(filters?: {
    employeeId?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<EmployeeOnboarding[]>;
  getEmployeeOnboarding(id: string): Promise<EmployeeOnboarding | undefined>;
  getEmployeeOnboardingByEmployee(employeeId: string): Promise<EmployeeOnboarding | undefined>;
  createEmployeeOnboarding(onboarding: InsertEmployeeOnboarding): Promise<EmployeeOnboarding>;
  updateEmployeeOnboarding(id: string, onboarding: Partial<InsertEmployeeOnboarding>): Promise<EmployeeOnboarding>;
  startEmployeeOnboarding(employeeId: string, templateId: string, assignedTo?: string): Promise<EmployeeOnboarding>;
  
  // Onboarding Task operations
  getOnboardingTasks(onboardingId: string): Promise<OnboardingTask[]>;
  getOnboardingTask(id: string): Promise<OnboardingTask | undefined>;
  createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask>;
  updateOnboardingTask(id: string, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask>;
  completeOnboardingTask(id: string, completedBy: string): Promise<OnboardingTask>;
  deleteOnboardingTask(id: string): Promise<void>;
  
  // Onboarding Document operations
  getOnboardingDocuments(onboardingId: string): Promise<OnboardingDocument[]>;
  getOnboardingDocument(id: string): Promise<OnboardingDocument | undefined>;
  createOnboardingDocument(document: InsertOnboardingDocument): Promise<OnboardingDocument>;
  updateOnboardingDocument(id: string, document: Partial<InsertOnboardingDocument>): Promise<OnboardingDocument>;
  verifyOnboardingDocument(id: string, verifiedBy: string): Promise<OnboardingDocument>;
  deleteOnboardingDocument(id: string): Promise<void>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeLeaveRequests: number;
    pendingReviews: number;
    totalDepartments: number;
    pendingLeaveRequests: Array<{ id: string; employeeName: string; type: string; days: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use existing sessions table from schema, don't create new one
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'sessions',
      createTableIfMissing: false
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<Omit<UpsertUser, 'password'>>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompany(): Promise<Company | null> {
    const [companyData] = await db.select().from(company).limit(1);
    return companyData || null;
  }

  async upsertCompany(companyData: InsertCompany): Promise<Company> {
    const existing = await this.getCompany();
    if (existing) {
      const [updated] = await db
        .update(company)
        .set({ ...companyData, updatedAt: new Date() })
        .where(eq(company.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(company).values(companyData).returning();
      return created;
    }
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department> {
    const [updatedDepartment] = await db
      .update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Team operations
  async getTeams(filters?: { departmentId?: string }): Promise<Team[]> {
    if (filters?.departmentId) {
      return await db.select().from(teams).where(eq(teams.departmentId, filters.departmentId)).orderBy(teams.name);
    }
    return await db.select().from(teams).orderBy(teams.name);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(teamData).returning();
    return newTeam;
  }

  async updateTeam(id: string, teamData: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({ ...teamData, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    if (!updatedTeam) {
      throw new Error('Team not found');
    }
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Sub-team operations
  async getSubTeams(filters?: { teamId?: string }): Promise<SubTeam[]> {
    if (filters?.teamId) {
      return await db.select().from(subTeams).where(eq(subTeams.teamId, filters.teamId)).orderBy(subTeams.name);
    }
    return await db.select().from(subTeams).orderBy(subTeams.name);
  }

  async getSubTeam(id: string): Promise<SubTeam | undefined> {
    const [subTeam] = await db.select().from(subTeams).where(eq(subTeams.id, id));
    return subTeam;
  }

  async createSubTeam(subTeamData: InsertSubTeam): Promise<SubTeam> {
    const [newSubTeam] = await db.insert(subTeams).values(subTeamData).returning();
    return newSubTeam;
  }

  async updateSubTeam(id: string, subTeamData: Partial<InsertSubTeam>): Promise<SubTeam> {
    const [updatedSubTeam] = await db
      .update(subTeams)
      .set({ ...subTeamData, updatedAt: new Date() })
      .where(eq(subTeams.id, id))
      .returning();
    if (!updatedSubTeam) {
      throw new Error('Sub-team not found');
    }
    return updatedSubTeam;
  }

  async deleteSubTeam(id: string): Promise<void> {
    await db.delete(subTeams).where(eq(subTeams.id, id));
  }

  // Position operations
  async getPositions(): Promise<Position[]> {
    return await db.select().from(positions).orderBy(positions.title);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position;
  }

  async getPositionsByDepartment(departmentId: string): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.departmentId, departmentId));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

  async updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position> {
    const [updatedPosition] = await db
      .update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition;
  }

  async deletePosition(id: string): Promise<void> {
    await db.delete(positions).where(eq(positions.id, id));
  }

  // Employee operations
  async getEmployees(filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
  }): Promise<Employee[]> {
    let query = db.select().from(employees);
    
    if (filters) {
      const conditions = [];
      
      if (filters.departmentId) {
        conditions.push(eq(employees.departmentId, filters.departmentId));
      }
      
      if (filters.status) {
        conditions.push(eq(employees.status, filters.status));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(employees.firstName, `%${filters.search}%`),
            like(employees.lastName, `%${filters.search}%`),
            like(employees.email, `%${filters.search}%`),
            like(employees.employeeId, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(employees.firstName, employees.lastName);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    // Auto-generate employeeId if not provided
    if (!employee.employeeId || employee.employeeId.trim() === '') {
      const count = await db.select({ count: sql<number>`count(*)` }).from(employees);
      const nextNumber = (count[0]?.count || 0) + 1;
      employee.employeeId = `EMP${String(nextNumber).padStart(4, '0')}`;
    }
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Attendance operations
  async getAttendanceRecords(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
  }): Promise<AttendanceRecord[]> {
    let query = db.select().from(attendanceRecords);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(attendanceRecords.employeeId, filters.employeeId));
      }
      
      if (filters.date) {
        conditions.push(eq(attendanceRecords.date, filters.date));
      }
      
      if (filters.startDate) {
        conditions.push(gte(attendanceRecords.date, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(attendanceRecords.date, filters.endDate));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(attendanceRecords.date), desc(attendanceRecords.clockIn));
  }

  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return record;
  }

  async getTodayAttendanceRecord(employeeId: string): Promise<AttendanceRecord | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, today)
      ));
    return record;
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: string, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord> {
    const [updatedRecord] = await db
      .update(attendanceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    if (!updatedRecord) {
      throw new Error('Attendance record not found');
    }
    return updatedRecord;
  }

  async clockIn(employeeId: string, location?: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Check if record exists for today
    const existing = await this.getTodayAttendanceRecord(employeeId);
    
    if (existing) {
      if (existing.clockIn) {
        throw new Error('Already clocked in today');
      }
      // Update existing record
      return await this.updateAttendanceRecord(existing.id, {
        clockIn: now,
        location: location || existing.location || null,
        status: 'present',
      });
    } else {
      // Create new record
      return await this.createAttendanceRecord({
        employeeId,
        date: today,
        clockIn: now,
        location: location || null,
        status: 'present',
      });
    }
  }

  async clockOut(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    const existing = await this.getTodayAttendanceRecord(employeeId);
    
    if (!existing || !existing.clockIn) {
      throw new Error('No clock-in record found for today');
    }
    
    if (existing.clockOut) {
      throw new Error('Already clocked out today');
    }
    
    // Calculate total hours
    const clockInTime = new Date(existing.clockIn);
    const diffMs = now.getTime() - clockInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakMinutes = existing.breakDuration || 0;
    const totalHours = Math.max(0, diffHours - (breakMinutes / 60));
    
    // Determine status based on hours worked
    let status = existing.status || 'present';
    if (totalHours < 4) {
      status = 'half_day';
    } else if (totalHours < 6) {
      status = 'half_day';
    }
    
    return await this.updateAttendanceRecord(existing.id, {
      clockOut: now,
      totalHours: totalHours.toFixed(2),
      status,
    });
  }

  async updateBreakDuration(attendanceRecordId: string, breakMinutes: number): Promise<AttendanceRecord> {
    const record = await this.getAttendanceRecord(attendanceRecordId);
    if (!record) {
      throw new Error('Attendance record not found');
    }
    
    // Recalculate total hours if clocked out
    let totalHours = record.totalHours ? parseFloat(record.totalHours) : null;
    if (record.clockIn && record.clockOut) {
      const clockInTime = new Date(record.clockIn);
      const clockOutTime = new Date(record.clockOut);
      const diffMs = clockOutTime.getTime() - clockInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      totalHours = Math.max(0, diffHours - (breakMinutes / 60));
    }
    
    return await this.updateAttendanceRecord(attendanceRecordId, {
      breakDuration: breakMinutes,
      totalHours: totalHours ? totalHours.toFixed(2) : null,
    });
  }

  async calculateOvertime(employeeId: string, weekStartDate: string): Promise<{ regularHours: number; overtimeHours: number }> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const records = await this.getAttendanceRecords({
      employeeId,
      startDate: weekStartDate,
      endDate: weekEndDate.toISOString().split('T')[0],
    });
    
    const totalHours = records.reduce((sum, record) => {
      return sum + (record.totalHours ? parseFloat(record.totalHours) : 0);
    }, 0);
    
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(0, totalHours - 40);
    
    return { regularHours, overtimeHours };
  }

  // Timesheet operations
  async getTimesheets(filters?: {
    employeeId?: string;
    weekStartDate?: string;
    status?: string;
  }): Promise<Timesheet[]> {
    let query = db.select().from(timesheets);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(timesheets.employeeId, filters.employeeId));
      }
      
      if (filters.weekStartDate) {
        conditions.push(eq(timesheets.weekStartDate, filters.weekStartDate));
      }
      
      if (filters.status) {
        conditions.push(eq(timesheets.status, filters.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(timesheets.weekStartDate));
  }

  async getTimesheet(id: string): Promise<Timesheet | undefined> {
    const [timesheet] = await db.select().from(timesheets).where(eq(timesheets.id, id));
    return timesheet;
  }

  async getTimesheetByWeek(employeeId: string, weekStartDate: string): Promise<Timesheet | undefined> {
    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(and(
        eq(timesheets.employeeId, employeeId),
        eq(timesheets.weekStartDate, weekStartDate)
      ));
    return timesheet;
  }

  async createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet> {
    // Calculate hours if not provided
    if (!timesheet.totalHours || !timesheet.regularHours || !timesheet.overtimeHours) {
      const { regularHours, overtimeHours } = await this.calculateOvertime(
        timesheet.employeeId,
        timesheet.weekStartDate
      );
      timesheet.totalHours = (regularHours + overtimeHours).toFixed(2);
      timesheet.regularHours = regularHours.toFixed(2);
      timesheet.overtimeHours = overtimeHours.toFixed(2);
    }
    
    const [newTimesheet] = await db.insert(timesheets).values(timesheet).returning();
    return newTimesheet;
  }

  async updateTimesheet(id: string, timesheet: Partial<InsertTimesheet>): Promise<Timesheet> {
    // Recalculate hours if attendance data might have changed
    const existing = await this.getTimesheet(id);
    if (existing && (!timesheet.totalHours || !timesheet.regularHours || !timesheet.overtimeHours)) {
      const { regularHours, overtimeHours } = await this.calculateOvertime(
        existing.employeeId,
        existing.weekStartDate
      );
      timesheet.totalHours = (regularHours + overtimeHours).toFixed(2);
      timesheet.regularHours = regularHours.toFixed(2);
      timesheet.overtimeHours = overtimeHours.toFixed(2);
    }
    
    const [updatedTimesheet] = await db
      .update(timesheets)
      .set({ ...timesheet, updatedAt: new Date() })
      .where(eq(timesheets.id, id))
      .returning();
    if (!updatedTimesheet) {
      throw new Error('Timesheet not found');
    }
    return updatedTimesheet;
  }

  async submitTimesheet(id: string): Promise<Timesheet> {
    return await this.updateTimesheet(id, {
      status: 'submitted',
      submittedAt: new Date(),
    });
  }

  async approveTimesheet(id: string, approvedBy: string): Promise<Timesheet> {
    return await this.updateTimesheet(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });
  }

  async rejectTimesheet(id: string, approvedBy: string, reason: string): Promise<Timesheet> {
    return await this.updateTimesheet(id, {
      status: 'rejected',
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    });
  }

  // Leave type operations
  async getLeaveTypes(): Promise<LeaveType[]> {
    return await db.select().from(leaveTypes).orderBy(leaveTypes.name);
  }

  async createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType> {
    const [newLeaveType] = await db.insert(leaveTypes).values(leaveType).returning();
    return newLeaveType;
  }

  async updateLeaveType(id: string, leaveType: Partial<InsertLeaveType>): Promise<LeaveType> {
    const [updatedLeaveType] = await db.update(leaveTypes)
      .set(leaveType)
      .where(eq(leaveTypes.id, id))
      .returning();
    return updatedLeaveType;
  }

  async deleteLeaveType(id: string): Promise<void> {
    await db.delete(leaveTypes).where(eq(leaveTypes.id, id));
  }

  // Leave request operations
  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    let query = db.select().from(leaveRequests);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(leaveRequests.employeeId, filters.employeeId));
      }
      
      if (filters.status) {
        conditions.push(eq(leaveRequests.status, filters.status));
      }
      
      if (filters.startDate) {
        conditions.push(gte(leaveRequests.startDate, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(leaveRequests.endDate, filters.endDate));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [leaveRequest] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return leaveRequest;
  }

  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newLeaveRequest] = await db.insert(leaveRequests).values(leaveRequest).returning();
    return newLeaveRequest;
  }

  async updateLeaveRequest(id: string, leaveRequest: Partial<InsertLeaveRequest>): Promise<LeaveRequest> {
    const [updatedLeaveRequest] = await db
      .update(leaveRequests)
      .set({ ...leaveRequest, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updatedLeaveRequest;
  }

  // Leave balance operations
  async getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
    let query = db.select().from(leaveBalances).where(eq(leaveBalances.employeeId, employeeId));
    
    if (year) {
      query = query.where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
    }
    
    return await query;
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const [newBalance] = await db.insert(leaveBalances).values(balance).returning();
    return newBalance;
  }

  async updateLeaveBalance(id: string, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance> {
    const [updatedBalance] = await db
      .update(leaveBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(eq(leaveBalances.id, id))
      .returning();
    return updatedBalance;
  }

  async initializeLeaveBalancesForEmployee(employeeId: string, year: number): Promise<void> {
    const allLeaveTypes = await this.getLeaveTypes();
    
    for (const leaveType of allLeaveTypes) {
      const existingBalance = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.employeeId, employeeId),
            eq(leaveBalances.leaveTypeId, leaveType.id),
            eq(leaveBalances.year, year)
          )
        );
      
      if (existingBalance.length === 0) {
        await this.createLeaveBalance({
          employeeId,
          leaveTypeId: leaveType.id,
          year,
          allocated: leaveType.daysAllowed,
          used: 0,
          remaining: leaveType.daysAllowed,
        });
      }
    }
  }

  // Payroll operations
  async getPayrollRecords(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<PayrollRecord[]> {
    let query = db.select().from(payrollRecords);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(payrollRecords.employeeId, filters.employeeId));
      }
      
      if (filters.status) {
        conditions.push(eq(payrollRecords.status, filters.status));
      }
      
      if (filters.startDate) {
        conditions.push(gte(payrollRecords.payPeriodStart, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(payrollRecords.payPeriodEnd, filters.endDate));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(payrollRecords.payPeriodEnd));
  }

  async createPayrollRecord(payroll: InsertPayrollRecord): Promise<PayrollRecord> {
    const [newPayroll] = await db.insert(payrollRecords).values(payroll).returning();
    return newPayroll;
  }

  async updatePayrollRecord(id: string, payroll: Partial<InsertPayrollRecord>): Promise<PayrollRecord> {
    const [updatedPayroll] = await db
      .update(payrollRecords)
      .set(payroll)
      .where(eq(payrollRecords.id, id))
      .returning();
    return updatedPayroll;
  }

  async generatePayrollForPeriod(
    payPeriodStart: string,
    payPeriodEnd: string,
    employeeIds?: string[]
  ): Promise<PayrollRecord[]> {
    let empList = await db.select().from(employees).where(eq(employees.status, 'active'));
    if (employeeIds?.length) {
      const idSet = new Set(employeeIds);
      empList = empList.filter((e) => idSet.has(e.id));
    }

    const periodDays = (new Date(payPeriodEnd).getTime() - new Date(payPeriodStart).getTime()) / (1000 * 60 * 60 * 24) + 1;
    const payPeriodsPerYear = periodDays <= 16 ? 24 : 26;

    const created: PayrollRecord[] = [];
    for (const emp of empList) {
      const baseSalary = emp.salary ? parseFloat(emp.salary) : 0;
      if (baseSalary <= 0) continue;

      const existing = await db.select().from(payrollRecords).where(
        and(
          eq(payrollRecords.employeeId, emp.id),
          eq(payrollRecords.payPeriodStart, payPeriodStart),
          eq(payrollRecords.payPeriodEnd, payPeriodEnd)
        )
      );
      if (existing.length > 0) continue;

      const attRecords = await this.getAttendanceRecords({
        employeeId: emp.id,
        startDate: payPeriodStart,
        endDate: payPeriodEnd,
      });
      const totalHours = attRecords.reduce((sum, r) => sum + (r.totalHours ? parseFloat(r.totalHours) : 0), 0);
      const workDays = periodDays >= 14 ? 10 : 5;
      const standardHours = workDays * 8;
      const regularHours = Math.min(totalHours, standardHours);
      const overtimeHours = Math.max(0, totalHours - standardHours);

      const result = calculatePayroll({
        baseSalaryAnnual: baseSalary,
        regularHours,
        overtimeHours,
        payPeriodsPerYear,
      });

      const [record] = await db.insert(payrollRecords).values({
        employeeId: emp.id,
        payPeriodStart,
        payPeriodEnd,
        baseSalary: result.baseSalary.toFixed(2),
        overtime: result.overtime.toFixed(2),
        bonuses: '0',
        deductions: '0',
        taxes: result.taxes.toFixed(2),
        netPay: result.netPay.toFixed(2),
        status: 'draft',
      }).returning();
      created.push(record);
    }
    return created;
  }

  // Performance review operations
  async getPerformanceReviews(filters?: {
    employeeId?: string;
    reviewerId?: string;
    status?: string;
  }): Promise<PerformanceReview[]> {
    let query = db.select().from(performanceReviews);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(performanceReviews.employeeId, filters.employeeId));
      }
      
      if (filters.reviewerId) {
        conditions.push(eq(performanceReviews.reviewerId, filters.reviewerId));
      }
      
      if (filters.status) {
        conditions.push(eq(performanceReviews.status, filters.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(performanceReviews.createdAt));
  }

  async createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview> {
    const [newReview] = await db.insert(performanceReviews).values(review).returning();
    return newReview;
  }

  async getPerformanceReview(id: string): Promise<PerformanceReview | undefined> {
    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.id, id));
    return review;
  }

  async updatePerformanceReview(id: string, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview> {
    const [updatedReview] = await db
      .update(performanceReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(performanceReviews.id, id))
      .returning();
    return updatedReview;
  }

  // Performance goal operations
  async getPerformanceGoals(filters?: {
    employeeId?: string;
    status?: string;
    createdBy?: string;
  }): Promise<PerformanceGoal[]> {
    let query = db.select().from(performanceGoals);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(performanceGoals.employeeId, filters.employeeId));
      }
      
      if (filters.status) {
        conditions.push(eq(performanceGoals.status, filters.status));
      }
      
      if (filters.createdBy) {
        conditions.push(eq(performanceGoals.createdBy, filters.createdBy));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(performanceGoals.createdAt));
  }

  async getPerformanceGoal(id: string): Promise<PerformanceGoal | undefined> {
    const [goal] = await db
      .select()
      .from(performanceGoals)
      .where(eq(performanceGoals.id, id));
    return goal;
  }

  async createPerformanceGoal(goal: InsertPerformanceGoal): Promise<PerformanceGoal> {
    const [newGoal] = await db.insert(performanceGoals).values(goal).returning();
    return newGoal;
  }

  async updatePerformanceGoal(id: string, goal: Partial<InsertPerformanceGoal>): Promise<PerformanceGoal> {
    const [updatedGoal] = await db
      .update(performanceGoals)
      .set({ ...goal, updatedAt: new Date() })
      .where(eq(performanceGoals.id, id))
      .returning();
    return updatedGoal;
  }

  async deletePerformanceGoal(id: string): Promise<void> {
    await db.delete(performanceGoals).where(eq(performanceGoals.id, id));
  }

  // Document operations
  async getDocuments(filters?: {
    employeeId?: string;
    category?: string;
  }): Promise<Document[]> {
    let query = db.select().from(documents);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(documents.employeeId, filters.employeeId));
      }
      
      if (filters.category) {
        conditions.push(eq(documents.category, filters.category));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Job posting operations
  async getJobPostings(filters?: {
    status?: string;
    departmentId?: string;
  }): Promise<JobPosting[]> {
    let query = db.select().from(jobPostings);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(jobPostings.status, filters.status));
      }
      
      if (filters.departmentId) {
        conditions.push(eq(jobPostings.departmentId, filters.departmentId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(jobPostings.createdAt));
  }

  async getJobPosting(id: string): Promise<JobPosting | undefined> {
    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id));
    return jobPosting;
  }

  async createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting> {
    const [newJobPosting] = await db.insert(jobPostings).values(jobPosting).returning();
    return newJobPosting;
  }

  async updateJobPosting(id: string, jobPosting: Partial<InsertJobPosting>): Promise<JobPosting> {
    const [updatedJobPosting] = await db
      .update(jobPostings)
      .set({ ...jobPosting, updatedAt: new Date() })
      .where(eq(jobPostings.id, id))
      .returning();
    return updatedJobPosting;
  }

  async deleteJobPosting(id: string): Promise<void> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }

  // Application operations
  async getApplications(filters?: {
    jobPostingId?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<Application[]> {
    let query = db.select().from(applications);
    
    if (filters) {
      const conditions = [];
      
      if (filters.jobPostingId) {
        conditions.push(eq(applications.jobPostingId, filters.jobPostingId));
      }
      
      if (filters.status) {
        conditions.push(eq(applications.status, filters.status));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(applications.assignedTo, filters.assignedTo));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(applications.appliedAt));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  // Interview operations
  async getInterviews(filters?: {
    applicationId?: string;
    interviewerId?: string;
    status?: string;
  }): Promise<Interview[]> {
    let query = db.select().from(interviews);
    
    if (filters) {
      const conditions = [];
      
      if (filters.applicationId) {
        conditions.push(eq(interviews.applicationId, filters.applicationId));
      }
      
      if (filters.interviewerId) {
        conditions.push(eq(interviews.interviewerId, filters.interviewerId));
      }
      
      if (filters.status) {
        conditions.push(eq(interviews.status, filters.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(interviews.scheduledDate));
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id));
    return interview;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }

  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    const [updatedInterview] = await db
      .update(interviews)
      .set({ ...interview, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview;
  }

  async deleteInterview(id: string): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  // Onboarding Template operations
  async getOnboardingTemplates(filters?: {
    departmentId?: string;
    positionId?: string;
    isDefault?: boolean;
  }): Promise<OnboardingTemplate[]> {
    let query = db.select().from(onboardingTemplates);
    
    if (filters) {
      const conditions = [];
      
      if (filters.departmentId) {
        conditions.push(eq(onboardingTemplates.departmentId, filters.departmentId));
      }
      
      if (filters.positionId) {
        conditions.push(eq(onboardingTemplates.positionId, filters.positionId));
      }
      
      if (filters.isDefault !== undefined) {
        conditions.push(eq(onboardingTemplates.isDefault, filters.isDefault));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(onboardingTemplates.name);
  }

  async getOnboardingTemplate(id: string): Promise<OnboardingTemplate | undefined> {
    const [template] = await db.select().from(onboardingTemplates).where(eq(onboardingTemplates.id, id));
    return template;
  }

  async createOnboardingTemplate(template: InsertOnboardingTemplate): Promise<OnboardingTemplate> {
    const [newTemplate] = await db.insert(onboardingTemplates).values(template).returning();
    return newTemplate;
  }

  async updateOnboardingTemplate(id: string, template: Partial<InsertOnboardingTemplate>): Promise<OnboardingTemplate> {
    const [updatedTemplate] = await db
      .update(onboardingTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(onboardingTemplates.id, id))
      .returning();
    if (!updatedTemplate) {
      throw new Error('Onboarding template not found');
    }
    return updatedTemplate;
  }

  async deleteOnboardingTemplate(id: string): Promise<void> {
    await db.delete(onboardingTemplates).where(eq(onboardingTemplates.id, id));
  }

  // Onboarding Checklist Item operations
  async getOnboardingChecklistItems(templateId: string): Promise<OnboardingChecklistItem[]> {
    return await db
      .select()
      .from(onboardingChecklistItems)
      .where(eq(onboardingChecklistItems.templateId, templateId))
      .orderBy(onboardingChecklistItems.order, onboardingChecklistItems.title);
  }

  async createOnboardingChecklistItem(item: InsertOnboardingChecklistItem): Promise<OnboardingChecklistItem> {
    const [newItem] = await db.insert(onboardingChecklistItems).values(item).returning();
    return newItem;
  }

  async updateOnboardingChecklistItem(id: string, item: Partial<InsertOnboardingChecklistItem>): Promise<OnboardingChecklistItem> {
    const [updatedItem] = await db
      .update(onboardingChecklistItems)
      .set(item)
      .where(eq(onboardingChecklistItems.id, id))
      .returning();
    if (!updatedItem) {
      throw new Error('Checklist item not found');
    }
    return updatedItem;
  }

  async deleteOnboardingChecklistItem(id: string): Promise<void> {
    await db.delete(onboardingChecklistItems).where(eq(onboardingChecklistItems.id, id));
  }

  // Employee Onboarding operations
  async getEmployeeOnboardings(filters?: {
    employeeId?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<EmployeeOnboarding[]> {
    let query = db.select().from(employeeOnboarding);
    
    if (filters) {
      const conditions = [];
      
      if (filters.employeeId) {
        conditions.push(eq(employeeOnboarding.employeeId, filters.employeeId));
      }
      
      if (filters.status) {
        conditions.push(eq(employeeOnboarding.status, filters.status));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(employeeOnboarding.assignedTo, filters.assignedTo));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(employeeOnboarding.startDate));
  }

  async getEmployeeOnboarding(id: string): Promise<EmployeeOnboarding | undefined> {
    const [onboarding] = await db.select().from(employeeOnboarding).where(eq(employeeOnboarding.id, id));
    return onboarding;
  }

  async getEmployeeOnboardingByEmployee(employeeId: string): Promise<EmployeeOnboarding | undefined> {
    const [onboarding] = await db
      .select()
      .from(employeeOnboarding)
      .where(eq(employeeOnboarding.employeeId, employeeId))
      .orderBy(desc(employeeOnboarding.startDate))
      .limit(1);
    return onboarding;
  }

  async createEmployeeOnboarding(onboarding: InsertEmployeeOnboarding): Promise<EmployeeOnboarding> {
    const [newOnboarding] = await db.insert(employeeOnboarding).values(onboarding).returning();
    return newOnboarding;
  }

  async updateEmployeeOnboarding(id: string, onboarding: Partial<InsertEmployeeOnboarding>): Promise<EmployeeOnboarding> {
    const [updatedOnboarding] = await db
      .update(employeeOnboarding)
      .set({ ...onboarding, updatedAt: new Date() })
      .where(eq(employeeOnboarding.id, id))
      .returning();
    if (!updatedOnboarding) {
      throw new Error('Employee onboarding not found');
    }
    return updatedOnboarding;
  }

  async startEmployeeOnboarding(employeeId: string, templateId: string, assignedTo?: string): Promise<EmployeeOnboarding> {
    // Get template and checklist items
    const template = await this.getOnboardingTemplate(templateId);
    if (!template) {
      throw new Error('Onboarding template not found');
    }
    
    const checklistItems = await this.getOnboardingChecklistItems(templateId);
    
    // Calculate expected completion date (default 30 days)
    const startDate = new Date();
    const expectedCompletionDate = new Date();
    expectedCompletionDate.setDate(expectedCompletionDate.getDate() + 30);
    
    // Create onboarding record
    const onboarding = await this.createEmployeeOnboarding({
      employeeId,
      templateId,
      startDate: startDate.toISOString().split('T')[0],
      expectedCompletionDate: expectedCompletionDate.toISOString().split('T')[0],
      assignedTo: assignedTo || null,
      status: 'in_progress',
    });
    
    // Create tasks from checklist items
    for (const item of checklistItems) {
      const dueDate = new Date(startDate);
      if (item.dueDays) {
        dueDate.setDate(dueDate.getDate() + item.dueDays);
      }
      
      await this.createOnboardingTask({
        onboardingId: onboarding.id,
        checklistItemId: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        assignedTo: item.assignedTo || assignedTo || null,
        dueDate: dueDate.toISOString().split('T')[0],
        order: item.order || 0,
        status: 'pending',
      });
    }
    
    return onboarding;
  }

  // Onboarding Task operations
  async getOnboardingTasks(onboardingId: string): Promise<OnboardingTask[]> {
    return await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.onboardingId, onboardingId))
      .orderBy(onboardingTasks.order, onboardingTasks.title);
  }

  async getOnboardingTask(id: string): Promise<OnboardingTask | undefined> {
    const [task] = await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, id));
    return task;
  }

  async createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask> {
    const [newTask] = await db.insert(onboardingTasks).values(task).returning();
    return newTask;
  }

  async updateOnboardingTask(id: string, task: Partial<InsertOnboardingTask>): Promise<OnboardingTask> {
    const [updatedTask] = await db
      .update(onboardingTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(onboardingTasks.id, id))
      .returning();
    if (!updatedTask) {
      throw new Error('Onboarding task not found');
    }
    return updatedTask;
  }

  async completeOnboardingTask(id: string, completedBy: string): Promise<OnboardingTask> {
    return await this.updateOnboardingTask(id, {
      status: 'completed',
      completedBy,
      completedDate: new Date().toISOString().split('T')[0],
    });
  }

  async deleteOnboardingTask(id: string): Promise<void> {
    await db.delete(onboardingTasks).where(eq(onboardingTasks.id, id));
  }

  // Onboarding Document operations
  async getOnboardingDocuments(onboardingId: string): Promise<OnboardingDocument[]> {
    return await db
      .select()
      .from(onboardingDocuments)
      .where(eq(onboardingDocuments.onboardingId, onboardingId))
      .orderBy(desc(onboardingDocuments.uploadedAt));
  }

  async getOnboardingDocument(id: string): Promise<OnboardingDocument | undefined> {
    const [document] = await db.select().from(onboardingDocuments).where(eq(onboardingDocuments.id, id));
    return document;
  }

  async createOnboardingDocument(document: InsertOnboardingDocument): Promise<OnboardingDocument> {
    const [newDocument] = await db.insert(onboardingDocuments).values(document).returning();
    return newDocument;
  }

  async updateOnboardingDocument(id: string, document: Partial<InsertOnboardingDocument>): Promise<OnboardingDocument> {
    const [updatedDocument] = await db
      .update(onboardingDocuments)
      .set(document)
      .where(eq(onboardingDocuments.id, id))
      .returning();
    if (!updatedDocument) {
      throw new Error('Onboarding document not found');
    }
    return updatedDocument;
  }

  async verifyOnboardingDocument(id: string, verifiedBy: string): Promise<OnboardingDocument> {
    return await this.updateOnboardingDocument(id, {
      status: 'verified',
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  async deleteOnboardingDocument(id: string): Promise<void> {
    await db.delete(onboardingDocuments).where(eq(onboardingDocuments.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeLeaveRequests: number;
    pendingReviews: number;
    totalDepartments: number;
    pendingLeaveRequests: Array<{ id: string; employeeName: string; type: string; days: number }>;
  }> {
    const [employeeCount] = await db.select({ count: count() }).from(employees).where(eq(employees.status, 'active'));
    const [leaveCount] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, 'pending'));
    const [reviewCount] = await db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, 'draft'));
    const [departmentCount] = await db.select({ count: count() }).from(departments);

    const pendingLeaves = await db
      .select({
        id: leaveRequests.id,
        daysRequested: leaveRequests.daysRequested,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        leaveTypeName: leaveTypes.name,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt))
      .limit(5);

    const pendingWithNames = pendingLeaves.map((l) => ({
      id: l.id,
      employeeName: [l.employeeFirstName, l.employeeLastName].filter(Boolean).join(" ") || "Unknown",
      type: l.leaveTypeName || "Leave",
      days: l.daysRequested || 0,
    }));

    return {
      totalEmployees: employeeCount.count,
      activeLeaveRequests: leaveCount.count,
      pendingReviews: reviewCount.count,
      totalDepartments: departmentCount.count,
      pendingLeaveRequests: pendingWithNames,
    };
  }
}

export const storage = new DatabaseStorage();
