import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { isAuthenticated, requireRole, requireHR, requireAdmin, requireManager } from "./middleware/rbac";
import { authLimiter, apiLimiter, sanitizeBody } from "./middleware/security";
import { 
  insertCompanySchema,
  insertDepartmentSchema,
  insertTeamSchema,
  insertSubTeamSchema,
  insertPositionSchema,
  insertEmployeeSchema,
  insertAttendanceRecordSchema,
  insertTimesheetSchema,
  insertLeaveTypeSchema,
  insertLeaveRequestSchema,
  insertPayrollRecordSchema,
  insertPerformanceReviewSchema,
  insertPerformanceGoalSchema,
  insertDocumentSchema,
  insertJobPostingSchema,
  insertApplicationSchema,
  insertInterviewSchema
} from "@shared/schema";
import { z } from "zod";

// Authentication middleware is now imported from middleware/rbac.ts

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);
  
  // Auth setup (includes /api/register, /api/login, /api/logout, /api/user routes)
  setupAuth(app);
  
  // Apply body sanitization to all routes
  app.use('/api', sanitizeBody);

  // User management routes (Admin only)
  app.get('/api/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Validate role if provided
      const validRoles = ['admin', 'hr', 'manager', 'employee'];
      const userRole = role && validRoles.includes(role) ? role : 'employee';

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Import hashPassword from auth
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImageUrl: null,
        role: userRole,
      });

      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      // Handle database constraint violations
      if (error?.code === '23505') {
        if (error.constraint?.includes('email')) {
          return res.status(400).json({ message: "Email already exists" });
        }
        if (error.constraint?.includes('username')) {
          return res.status(400).json({ message: "Username already exists" });
        }
        return res.status(400).json({ message: "User already exists" });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role, email, firstName, lastName, profileImageUrl } = req.body;
      
      // Validate role if provided
      if (role && !['admin', 'hr', 'manager', 'employee'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

      const user = await storage.updateUser(id, updateData);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: "User not found" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting yourself
      if (req.user?.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Password reset route (Admin only)
  app.post('/api/users/:id/reset-password', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Import hashPassword from auth
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(newPassword);

      await storage.updateUserPassword(id, hashedPassword);
      
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: "User not found" });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Department routes
  app.get('/api/departments', isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      res.status(500).json({ 
        message: "Failed to fetch departments",
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  });

  app.post('/api/departments', isAuthenticated, requireHR, async (req, res) => {
    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...req.body,
        managerId: req.body.managerId && req.body.managerId.trim() !== '' ? req.body.managerId : null,
        description: req.body.description && req.body.description.trim() !== '' ? req.body.description : null,
        budget: req.body.budget && req.body.budget.trim() !== '' ? req.body.budget : null,
      };
      
      const departmentData = insertDepartmentSchema.parse(cleanedData);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      
      // Handle foreign key constraint violations
      if (error?.code === '23503') {
        if (error.constraint?.includes('manager_id')) {
          return res.status(400).json({ message: "Invalid manager selected. Please select a valid employee as manager or leave it empty." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error creating department:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      console.error("Error code:", error?.code);
      res.status(500).json({ 
        message: "Failed to create department",
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  });

  app.put('/api/departments/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert empty strings to null for optional fields
      const cleanedData: any = {};
      if (req.body.managerId !== undefined) {
        cleanedData.managerId = req.body.managerId && req.body.managerId.trim() !== '' ? req.body.managerId : null;
      }
      if (req.body.description !== undefined) {
        cleanedData.description = req.body.description && req.body.description.trim() !== '' ? req.body.description : null;
      }
      if (req.body.budget !== undefined) {
        cleanedData.budget = req.body.budget && req.body.budget.trim() !== '' ? req.body.budget : null;
      }
      if (req.body.name !== undefined) {
        cleanedData.name = req.body.name;
      }
      
      const departmentData = insertDepartmentSchema.partial().parse(cleanedData);
      const department = await storage.updateDepartment(id, departmentData);
      res.json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      
      // Handle foreign key constraint violations
      if (error?.code === '23503') {
        if (error.constraint?.includes('manager_id')) {
          return res.status(400).json({ message: "Invalid manager selected. Please select a valid employee as manager or leave it empty." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete('/api/departments/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDepartment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Position routes
  app.get('/api/positions', isAuthenticated, async (req, res) => {
    try {
      const { departmentId } = req.query;
      const positions = departmentId 
        ? await storage.getPositionsByDepartment(departmentId as string)
        : await storage.getPositions();
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.post('/api/positions', isAuthenticated, requireHR, async (req, res) => {
    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...req.body,
        departmentId: req.body.departmentId && req.body.departmentId.trim() !== '' ? req.body.departmentId : null,
        description: req.body.description && req.body.description.trim() !== '' ? req.body.description : null,
        minSalary: req.body.minSalary && req.body.minSalary.trim() !== '' ? req.body.minSalary : null,
        maxSalary: req.body.maxSalary && req.body.maxSalary.trim() !== '' ? req.body.maxSalary : null,
        requirements: req.body.requirements && req.body.requirements.trim() !== '' ? req.body.requirements : null,
      };
      
      const positionData = insertPositionSchema.parse(cleanedData);
      const position = await storage.createPosition(positionData);
      res.status(201).json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      
      // Handle foreign key constraint violations
      if (error?.code === '23503') {
        if (error.constraint?.includes('department_id')) {
          return res.status(400).json({ message: "Invalid department selected. Please select a valid department or leave it empty." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.put('/api/positions/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert empty strings to null for optional fields
      const cleanedData: any = {};
      if (req.body.title !== undefined) cleanedData.title = req.body.title;
      if (req.body.departmentId !== undefined) {
        cleanedData.departmentId = req.body.departmentId && req.body.departmentId.trim() !== '' ? req.body.departmentId : null;
      }
      if (req.body.description !== undefined) {
        cleanedData.description = req.body.description && req.body.description.trim() !== '' ? req.body.description : null;
      }
      if (req.body.minSalary !== undefined) {
        cleanedData.minSalary = req.body.minSalary && req.body.minSalary.trim() !== '' ? req.body.minSalary : null;
      }
      if (req.body.maxSalary !== undefined) {
        cleanedData.maxSalary = req.body.maxSalary && req.body.maxSalary.trim() !== '' ? req.body.maxSalary : null;
      }
      if (req.body.requirements !== undefined) {
        cleanedData.requirements = req.body.requirements && req.body.requirements.trim() !== '' ? req.body.requirements : null;
      }
      
      const positionData = insertPositionSchema.partial().parse(cleanedData);
      const position = await storage.updatePosition(id, positionData);
      res.json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      
      // Handle foreign key constraint violations
      if (error?.code === '23503') {
        if (error.constraint?.includes('department_id')) {
          return res.status(400).json({ message: "Invalid department selected. Please select a valid department or leave it empty." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error updating position:", error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  app.delete('/api/positions/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePosition(id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === '23503') {
        return res.status(400).json({ message: "Cannot delete position. It is being used by employees or job postings." });
      }
      console.error("Error deleting position:", error);
      res.status(500).json({ message: "Failed to delete position" });
    }
  });

  // Team routes
  app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const { departmentId } = req.query;
      const filters = departmentId ? { departmentId: departmentId as string } : undefined;
      const teams = await storage.getTeams(filters);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/teams', isAuthenticated, requireHR, async (req, res) => {
    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...req.body,
        departmentId: req.body.departmentId && req.body.departmentId.trim() !== '' ? req.body.departmentId : null,
        description: req.body.description && req.body.description.trim() !== '' ? req.body.description : null,
        teamLeadId: req.body.teamLeadId && req.body.teamLeadId.trim() !== '' ? req.body.teamLeadId : null,
      };
      
      const teamData = insertTeamSchema.parse(cleanedData);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      
      if (error?.code === '23503') {
        if (error.constraint?.includes('department_id')) {
          return res.status(400).json({ message: "Invalid department selected." });
        }
        if (error.constraint?.includes('team_lead_id')) {
          return res.status(400).json({ message: "Invalid team lead selected." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert empty strings to null for optional fields
      const cleanedData: any = {};
      if (req.body.name !== undefined) cleanedData.name = req.body.name;
      if (req.body.departmentId !== undefined) {
        cleanedData.departmentId = req.body.departmentId && req.body.departmentId.trim() !== '' ? req.body.departmentId : null;
      }
      if (req.body.description !== undefined) {
        cleanedData.description = req.body.description && req.body.description.trim() !== '' ? req.body.description : null;
      }
      if (req.body.teamLeadId !== undefined) {
        cleanedData.teamLeadId = req.body.teamLeadId && req.body.teamLeadId.trim() !== '' ? req.body.teamLeadId : null;
      }
      
      const teamData = insertTeamSchema.partial().parse(cleanedData);
      const team = await storage.updateTeam(id, teamData);
      res.json(team);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      
      if (error?.code === '23503') {
        if (error.constraint?.includes('department_id')) {
          return res.status(400).json({ message: "Invalid department selected." });
        }
        if (error.constraint?.includes('team_lead_id')) {
          return res.status(400).json({ message: "Invalid team lead selected." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      if (error.message === 'Team not found') {
        return res.status(404).json({ message: "Team not found" });
      }
      
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === '23503') {
        return res.status(400).json({ message: "Cannot delete team. It has sub-teams or is being used." });
      }
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Sub-team routes
  app.get('/api/sub-teams', isAuthenticated, async (req, res) => {
    try {
      const { teamId } = req.query;
      const filters = teamId ? { teamId: teamId as string } : undefined;
      const subTeams = await storage.getSubTeams(filters);
      res.json(subTeams);
    } catch (error) {
      console.error("Error fetching sub-teams:", error);
      res.status(500).json({ message: "Failed to fetch sub-teams" });
    }
  });

  app.post('/api/sub-teams', isAuthenticated, requireHR, async (req, res) => {
    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...req.body,
        description: req.body.description && req.body.description.trim() !== '' ? req.body.description : null,
        subTeamLeadId: req.body.subTeamLeadId && req.body.subTeamLeadId.trim() !== '' ? req.body.subTeamLeadId : null,
      };
      
      const subTeamData = insertSubTeamSchema.parse(cleanedData);
      const subTeam = await storage.createSubTeam(subTeamData);
      res.status(201).json(subTeam);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sub-team data", errors: error.errors });
      }
      
      if (error?.code === '23503') {
        if (error.constraint?.includes('team_id')) {
          return res.status(400).json({ message: "Invalid team selected." });
        }
        if (error.constraint?.includes('sub_team_lead_id')) {
          return res.status(400).json({ message: "Invalid sub-team lead selected." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      console.error("Error creating sub-team:", error);
      res.status(500).json({ message: "Failed to create sub-team" });
    }
  });

  app.put('/api/sub-teams/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert empty strings to null for optional fields
      const cleanedData: any = {};
      if (req.body.name !== undefined) cleanedData.name = req.body.name;
      if (req.body.teamId !== undefined) cleanedData.teamId = req.body.teamId;
      if (req.body.description !== undefined) {
        cleanedData.description = req.body.description && req.body.description.trim() !== '' ? req.body.description : null;
      }
      if (req.body.subTeamLeadId !== undefined) {
        cleanedData.subTeamLeadId = req.body.subTeamLeadId && req.body.subTeamLeadId.trim() !== '' ? req.body.subTeamLeadId : null;
      }
      
      const subTeamData = insertSubTeamSchema.partial().parse(cleanedData);
      const subTeam = await storage.updateSubTeam(id, subTeamData);
      res.json(subTeam);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sub-team data", errors: error.errors });
      }
      
      if (error?.code === '23503') {
        if (error.constraint?.includes('team_id')) {
          return res.status(400).json({ message: "Invalid team selected." });
        }
        if (error.constraint?.includes('sub_team_lead_id')) {
          return res.status(400).json({ message: "Invalid sub-team lead selected." });
        }
        return res.status(400).json({ message: "Invalid reference. Please check all selected values." });
      }
      
      if (error.message === 'Sub-team not found') {
        return res.status(404).json({ message: "Sub-team not found" });
      }
      
      console.error("Error updating sub-team:", error);
      res.status(500).json({ message: "Failed to update sub-team" });
    }
  });

  app.delete('/api/sub-teams/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubTeam(id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === '23503') {
        return res.status(400).json({ message: "Cannot delete sub-team. It is being used." });
      }
      console.error("Error deleting sub-team:", error);
      res.status(500).json({ message: "Failed to delete sub-team" });
    }
  });

  // Employee routes
  app.get('/api/employees', isAuthenticated, async (req, res) => {
    try {
      const { departmentId, status, search } = req.query;
      const filters = {
        departmentId: departmentId as string,
        status: status as string,
        search: search as string,
      };
      const employees = await storage.getEmployees(filters);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get('/api/employees/by-user/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const employee = await storage.getEmployeeByUserId(userId);
      // Return null instead of 404 - this is expected for users without employee records (e.g., admins)
      res.json(employee || null);
    } catch (error) {
      console.error("Error fetching employee by user ID:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.get('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post('/api/employees', isAuthenticated, requireHR, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Attendance routes
  app.get('/api/attendance', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, startDate, endDate, date } = req.query;
      const filters: any = {};
      if (employeeId) filters.employeeId = employeeId as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (date) filters.date = date as string;
      
      const records = await storage.getAttendanceRecords(filters);
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.get('/api/attendance/today', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(200).json(null);
      }
      
      const record = await storage.getTodayAttendanceRecord(employee.id);
      res.json(record || null);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });

  app.post('/api/attendance/clock-in', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const { location } = req.body;
      const record = await storage.clockIn(employee.id, location);
      res.status(201).json(record);
    } catch (error: any) {
      console.error("Error clocking in:", error);
      res.status(400).json({ message: error.message || "Failed to clock in" });
    }
  });

  app.post('/api/attendance/clock-out', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const record = await storage.clockOut(employee.id);
      res.json(record);
    } catch (error: any) {
      console.error("Error clocking out:", error);
      res.status(400).json({ message: error.message || "Failed to clock out" });
    }
  });

  app.get('/api/attendance/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getAttendanceRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      res.status(500).json({ message: "Failed to fetch attendance record" });
    }
  });

  app.put('/api/attendance/:id', isAuthenticated, requireHR, async (req, res) => {
    try {
      const { id } = req.params;
      const cleanedData: any = {};
      if (req.body.clockIn !== undefined) cleanedData.clockIn = req.body.clockIn;
      if (req.body.clockOut !== undefined) cleanedData.clockOut = req.body.clockOut;
      if (req.body.breakDuration !== undefined) cleanedData.breakDuration = req.body.breakDuration;
      if (req.body.status !== undefined) cleanedData.status = req.body.status;
      if (req.body.notes !== undefined) cleanedData.notes = req.body.notes;
      if (req.body.location !== undefined) cleanedData.location = req.body.location;
      
      const record = await storage.updateAttendanceRecord(id, cleanedData);
      res.json(record);
    } catch (error: any) {
      if (error.message === 'Attendance record not found') {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      console.error("Error updating attendance record:", error);
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  app.put('/api/attendance/:id/break', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { breakMinutes } = req.body;
      
      if (breakMinutes === undefined || breakMinutes < 0) {
        return res.status(400).json({ message: "Valid break duration in minutes is required" });
      }
      
      const record = await storage.updateBreakDuration(id, breakMinutes);
      res.json(record);
    } catch (error: any) {
      if (error.message === 'Attendance record not found') {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      console.error("Error updating break duration:", error);
      res.status(500).json({ message: "Failed to update break duration" });
    }
  });

  // Timesheet routes
  app.get('/api/timesheets', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, weekStartDate, status } = req.query;
      const filters: any = {};
      if (employeeId) filters.employeeId = employeeId as string;
      if (weekStartDate) filters.weekStartDate = weekStartDate as string;
      if (status) filters.status = status as string;
      
      const timesheets = await storage.getTimesheets(filters);
      res.json(timesheets);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      res.status(500).json({ message: "Failed to fetch timesheets" });
    }
  });

  app.get('/api/timesheets/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const timesheet = await storage.getTimesheet(id);
      if (!timesheet) {
        return res.status(404).json({ message: "Timesheet not found" });
      }
      res.json(timesheet);
    } catch (error) {
      console.error("Error fetching timesheet:", error);
      res.status(500).json({ message: "Failed to fetch timesheet" });
    }
  });

  app.post('/api/timesheets', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const timesheetData = insertTimesheetSchema.parse({
        ...req.body,
        employeeId: employee.id,
      });
      const timesheet = await storage.createTimesheet(timesheetData);
      res.status(201).json(timesheet);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timesheet data", errors: error.errors });
      }
      console.error("Error creating timesheet:", error);
      res.status(500).json({ message: "Failed to create timesheet" });
    }
  });

  app.put('/api/timesheets/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const timesheetData = insertTimesheetSchema.partial().parse(req.body);
      const timesheet = await storage.updateTimesheet(id, timesheetData);
      res.json(timesheet);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timesheet data", errors: error.errors });
      }
      if (error.message === 'Timesheet not found') {
        return res.status(404).json({ message: "Timesheet not found" });
      }
      console.error("Error updating timesheet:", error);
      res.status(500).json({ message: "Failed to update timesheet" });
    }
  });

  app.post('/api/timesheets/:id/submit', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const timesheet = await storage.submitTimesheet(id);
      res.json(timesheet);
    } catch (error: any) {
      if (error.message === 'Timesheet not found') {
        return res.status(404).json({ message: "Timesheet not found" });
      }
      console.error("Error submitting timesheet:", error);
      res.status(500).json({ message: "Failed to submit timesheet" });
    }
  });

  app.post('/api/timesheets/:id/approve', isAuthenticated, requireManager, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const approver = await storage.getEmployeeByUserId(user.id);
      if (!approver) {
        return res.status(404).json({ message: "Approver not found" });
      }
      
      const timesheet = await storage.approveTimesheet(id, approver.id);
      res.json(timesheet);
    } catch (error: any) {
      if (error.message === 'Timesheet not found') {
        return res.status(404).json({ message: "Timesheet not found" });
      }
      console.error("Error approving timesheet:", error);
      res.status(500).json({ message: "Failed to approve timesheet" });
    }
  });

  app.post('/api/timesheets/:id/reject', isAuthenticated, requireManager, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const approver = await storage.getEmployeeByUserId(user.id);
      if (!approver) {
        return res.status(404).json({ message: "Approver not found" });
      }
      
      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const timesheet = await storage.rejectTimesheet(id, approver.id, reason);
      res.json(timesheet);
    } catch (error: any) {
      if (error.message === 'Timesheet not found') {
        return res.status(404).json({ message: "Timesheet not found" });
      }
      console.error("Error rejecting timesheet:", error);
      res.status(500).json({ message: "Failed to reject timesheet" });
    }
  });

  // Leave routes
  app.get('/api/leave/types', isAuthenticated, async (req, res) => {
    try {
      const leaveTypes = await storage.getLeaveTypes();
      res.json(leaveTypes);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  app.post('/api/leave/types', isAuthenticated, async (req, res) => {
    try {
      const leaveTypeData = insertLeaveTypeSchema.parse(req.body);
      const leaveType = await storage.createLeaveType(leaveTypeData);
      res.status(201).json(leaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave type data", errors: error.errors });
      }
      console.error("Error creating leave type:", error);
      res.status(500).json({ message: "Failed to create leave type" });
    }
  });

  app.put('/api/leave/types/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const leaveTypeData = insertLeaveTypeSchema.partial().parse(req.body);
      const leaveType = await storage.updateLeaveType(id, leaveTypeData);
      res.json(leaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave type data", errors: error.errors });
      }
      console.error("Error updating leave type:", error);
      res.status(500).json({ message: "Failed to update leave type" });
    }
  });

  app.delete('/api/leave/types/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLeaveType(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting leave type:", error);
      res.status(500).json({ message: "Failed to delete leave type" });
    }
  });

  app.get('/api/leave/requests', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, status, startDate, endDate } = req.query;
      const filters = {
        employeeId: employeeId as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };
      const requests = await storage.getLeaveRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.post('/api/leave/requests', isAuthenticated, async (req, res) => {
    try {
      const leaveRequestData = insertLeaveRequestSchema.parse(req.body);
      const leaveRequest = await storage.createLeaveRequest(leaveRequestData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave request data", errors: error.errors });
      }
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.put('/api/leave/requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const leaveRequestData = insertLeaveRequestSchema.partial().parse(req.body);
      const leaveRequest = await storage.updateLeaveRequest(id, leaveRequestData);
      res.json(leaveRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave request data", errors: error.errors });
      }
      console.error("Error updating leave request:", error);
      res.status(500).json({ message: "Failed to update leave request" });
    }
  });

  app.get('/api/leave/balances/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year } = req.query;
      const balances = await storage.getLeaveBalances(employeeId, year ? parseInt(year as string) : undefined);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching leave balances:", error);
      res.status(500).json({ message: "Failed to fetch leave balances" });
    }
  });

  app.post('/api/leave/balances/initialize/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year } = req.body;
      const currentYear = year || new Date().getFullYear();
      await storage.initializeLeaveBalancesForEmployee(employeeId, currentYear);
      res.json({ message: "Leave balances initialized successfully" });
    } catch (error) {
      console.error("Error initializing leave balances:", error);
      res.status(500).json({ message: "Failed to initialize leave balances" });
    }
  });

  app.put('/api/leave/requests/:id/approve', isAuthenticated, requireManager, async (req, res) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = req.user as any;
      
      const leaveRequest = await storage.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      // Check if already processed
      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({ message: "Leave request has already been processed" });
      }
      
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(403).json({ message: "Employee profile not found" });
      }
      
      // Get current balance
      const balances = await storage.getLeaveBalances(leaveRequest.employeeId, new Date().getFullYear());
      const balance = balances.find(b => b.leaveTypeId === leaveRequest.leaveTypeId);
      
      if (!balance) {
        return res.status(400).json({ message: "Leave balance not found for this employee" });
      }
      
      // Check if sufficient balance
      if (balance.remaining < leaveRequest.daysRequested) {
        return res.status(400).json({ 
          message: "Insufficient leave balance",
          remaining: balance.remaining,
          requested: leaveRequest.daysRequested
        });
      }
      
      // Update leave request and balance atomically
      // Note: For true atomicity, implement database transactions
      const updatedRequest = await storage.updateLeaveRequest(id, {
        status: 'approved',
        approvedBy: employee.id,
        approvalDate: new Date(),
        comments: comments || null,
      });
      
      await storage.updateLeaveBalance(balance.id, {
        used: (balance.used || 0) + leaveRequest.daysRequested,
        remaining: balance.remaining - leaveRequest.daysRequested,
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  });

  app.put('/api/leave/requests/:id/reject', isAuthenticated, requireManager, async (req, res) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = req.user as any;
      
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(403).json({ message: "Employee profile not found" });
      }
      
      const updatedRequest = await storage.updateLeaveRequest(id, {
        status: 'rejected',
        approvedBy: employee.id,
        approvalDate: new Date(),
        comments: comments || null,
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({ message: "Failed to reject leave request" });
    }
  });

  // Payroll routes
  app.get('/api/payroll', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, startDate, endDate, status } = req.query;
      const filters = {
        employeeId: employeeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
      };
      const payrollRecords = await storage.getPayrollRecords(filters);
      res.json(payrollRecords);
    } catch (error) {
      console.error("Error fetching payroll records:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post('/api/payroll', isAuthenticated, async (req, res) => {
    try {
      const payrollData = insertPayrollRecordSchema.parse(req.body);
      const payrollRecord = await storage.createPayrollRecord(payrollData);
      res.status(201).json(payrollRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll data", errors: error.errors });
      }
      console.error("Error creating payroll record:", error);
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  // Performance review routes
  app.get('/api/performance/reviews', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, reviewerId, status } = req.query;
      const filters = {
        employeeId: employeeId as string,
        reviewerId: reviewerId as string,
        status: status as string,
      };
      const reviews = await storage.getPerformanceReviews(filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
  });

  app.post('/api/performance/reviews', isAuthenticated, async (req, res) => {
    try {
      const reviewData = insertPerformanceReviewSchema.parse(req.body);
      const review = await storage.createPerformanceReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid performance review data", errors: error.errors });
      }
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: "Failed to create performance review" });
    }
  });

  app.get('/api/performance/reviews/:id', isAuthenticated, async (req, res) => {
    try {
      const review = await storage.getPerformanceReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Performance review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error fetching performance review:", error);
      res.status(500).json({ message: "Failed to fetch performance review" });
    }
  });

  app.put('/api/performance/reviews/:id', isAuthenticated, async (req, res) => {
    try {
      const reviewData = insertPerformanceReviewSchema.partial().parse(req.body);
      const review = await storage.updatePerformanceReview(req.params.id, reviewData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid performance review data", errors: error.errors });
      }
      console.error("Error updating performance review:", error);
      res.status(500).json({ message: "Failed to update performance review" });
    }
  });

  // Performance goal routes
  app.get('/api/performance/goals', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, status, createdBy } = req.query;
      const filters = {
        employeeId: employeeId as string,
        status: status as string,
        createdBy: createdBy as string,
      };
      const goals = await storage.getPerformanceGoals(filters);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching performance goals:", error);
      res.status(500).json({ message: "Failed to fetch performance goals" });
    }
  });

  app.post('/api/performance/goals', isAuthenticated, async (req, res) => {
    try {
      const goalData = insertPerformanceGoalSchema.parse(req.body);
      const goal = await storage.createPerformanceGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      console.error("Error creating performance goal:", error);
      res.status(500).json({ message: "Failed to create performance goal" });
    }
  });

  app.get('/api/performance/goals/:id', isAuthenticated, async (req, res) => {
    try {
      const goal = await storage.getPerformanceGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error fetching performance goal:", error);
      res.status(500).json({ message: "Failed to fetch performance goal" });
    }
  });

  app.put('/api/performance/goals/:id', isAuthenticated, async (req, res) => {
    try {
      const goalData = insertPerformanceGoalSchema.partial().parse(req.body);
      const goal = await storage.updatePerformanceGoal(req.params.id, goalData);
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      console.error("Error updating performance goal:", error);
      res.status(500).json({ message: "Failed to update performance goal" });
    }
  });

  app.delete('/api/performance/goals/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePerformanceGoal(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting performance goal:", error);
      res.status(500).json({ message: "Failed to delete performance goal" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const { employeeId, category } = req.query;
      const filters = {
        employeeId: employeeId as string,
        category: category as string,
      };
      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Job Posting routes
  app.get('/api/recruitment/jobs', isAuthenticated, async (req, res) => {
    try {
      const { status, departmentId } = req.query;
      const filters = {
        status: status as string,
        departmentId: departmentId as string,
      };
      const jobs = await storage.getJobPostings(filters);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.get('/api/recruitment/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJobPosting(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job posting:", error);
      res.status(500).json({ message: "Failed to fetch job posting" });
    }
  });

  app.post('/api/recruitment/jobs', isAuthenticated, async (req, res) => {
    try {
      const jobData = insertJobPostingSchema.parse(req.body);
      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job posting data", errors: error.errors });
      }
      console.error("Error creating job posting:", error);
      res.status(500).json({ message: "Failed to create job posting" });
    }
  });

  app.put('/api/recruitment/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const jobData = insertJobPostingSchema.partial().parse(req.body);
      const job = await storage.updateJobPosting(req.params.id, jobData);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job posting data", errors: error.errors });
      }
      console.error("Error updating job posting:", error);
      res.status(500).json({ message: "Failed to update job posting" });
    }
  });

  app.delete('/api/recruitment/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJobPosting(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job posting:", error);
      res.status(500).json({ message: "Failed to delete job posting" });
    }
  });

  // Application routes
  app.get('/api/recruitment/applications', isAuthenticated, async (req, res) => {
    try {
      const { jobPostingId, status, assignedTo } = req.query;
      const filters = {
        jobPostingId: jobPostingId as string,
        status: status as string,
        assignedTo: assignedTo as string,
      };
      const applications = await storage.getApplications(filters);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/recruitment/applications/:id', isAuthenticated, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post('/api/recruitment/applications', isAuthenticated, async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const sanitizedData = {
        ...applicationData,
        expectedSalary: applicationData.expectedSalary === "" ? null : applicationData.expectedSalary,
        rating: applicationData.rating === "" ? null : applicationData.rating,
        yearsOfExperience: applicationData.yearsOfExperience === "" ? null : applicationData.yearsOfExperience,
      };
      const application = await storage.createApplication(sanitizedData as any);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put('/api/recruitment/applications/:id', isAuthenticated, async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(req.params.id, applicationData);
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete('/api/recruitment/applications/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteApplication(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Interview routes
  app.get('/api/recruitment/interviews', isAuthenticated, async (req, res) => {
    try {
      const { applicationId, interviewerId, status } = req.query;
      const filters = {
        applicationId: applicationId as string,
        interviewerId: interviewerId as string,
        status: status as string,
      };
      const interviews = await storage.getInterviews(filters);
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.get('/api/recruitment/interviews/:id', isAuthenticated, async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      res.json(interview);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  app.post('/api/recruitment/interviews', isAuthenticated, async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(interviewData);
      res.status(201).json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview data", errors: error.errors });
      }
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  app.put('/api/recruitment/interviews/:id', isAuthenticated, async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.partial().parse(req.body);
      const interview = await storage.updateInterview(req.params.id, interviewData);
      res.json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview data", errors: error.errors });
      }
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  app.delete('/api/recruitment/interviews/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
