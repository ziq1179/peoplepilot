import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertDepartmentSchema,
  insertPositionSchema,
  insertEmployeeSchema,
  insertLeaveTypeSchema,
  insertLeaveRequestSchema,
  insertPayrollRecordSchema,
  insertPerformanceReviewSchema,
  insertDocumentSchema 
} from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth setup (includes /api/register, /api/login, /api/logout, /api/user routes)
  setupAuth(app);

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
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post('/api/departments', isAuthenticated, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put('/api/departments/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, departmentData);
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete('/api/departments/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/positions', isAuthenticated, async (req, res) => {
    try {
      const positionData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid position data", errors: error.errors });
      }
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Failed to create position" });
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
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
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

  app.post('/api/employees', isAuthenticated, async (req, res) => {
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

  app.put('/api/employees/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
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

  app.put('/api/leave/requests/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = req.user as any;
      
      const leaveRequest = await storage.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(403).json({ message: "Employee profile not found" });
      }
      
      const updatedRequest = await storage.updateLeaveRequest(id, {
        status: 'approved',
        approvedBy: employee.id,
        approvalDate: new Date(),
        comments: comments || null,
      });
      
      const balances = await storage.getLeaveBalances(leaveRequest.employeeId, new Date().getFullYear());
      const balance = balances.find(b => b.leaveTypeId === leaveRequest.leaveTypeId);
      
      if (balance) {
        await storage.updateLeaveBalance(balance.id, {
          used: (balance.used || 0) + leaveRequest.daysRequested,
          remaining: balance.remaining - leaveRequest.daysRequested,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  });

  app.put('/api/leave/requests/:id/reject', isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
