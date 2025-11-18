import {
  users,
  departments,
  positions,
  employees,
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
  type Department,
  type InsertDepartment,
  type Position,
  type InsertPosition,
  type Employee,
  type InsertEmployee,
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
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;
  
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
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeLeaveRequests: number;
    pendingReviews: number;
    totalDepartments: number;
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

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeLeaveRequests: number;
    pendingReviews: number;
    totalDepartments: number;
  }> {
    const [employeeCount] = await db.select({ count: count() }).from(employees).where(eq(employees.status, 'active'));
    const [leaveCount] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, 'pending'));
    const [reviewCount] = await db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, 'draft'));
    const [departmentCount] = await db.select({ count: count() }).from(departments);

    return {
      totalEmployees: employeeCount.count,
      activeLeaveRequests: leaveCount.count,
      pendingReviews: reviewCount.count,
      totalDepartments: departmentCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
