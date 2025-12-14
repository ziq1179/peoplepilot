import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      username: string;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

/**
 * Middleware to check if user has one of the required roles
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "User not found in session" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Forbidden", 
        requiredRoles: roles,
        userRole: req.user.role 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is HR or admin
 */
export const requireHR = requireRole('admin', 'hr');

/**
 * Middleware to check if user is manager or above
 */
export const requireManager = requireRole('admin', 'hr', 'manager');

/**
 * Middleware to check if user can access their own resource or has admin/hr role
 */
export const requireOwnershipOrRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Allow if user has required role
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Allow if user is accessing their own resource
    const resourceId = req.params.id || req.params.userId || req.params.employeeId;
    if (resourceId && req.user.id === resourceId) {
      return next();
    }

    // Check if user is accessing their own employee record
    // This would require additional logic to check employee.userId === req.user.id
    // For now, we'll just check the direct ID match

    res.status(403).json({ 
      message: "Forbidden - You can only access your own resources",
      requiredRoles: roles 
    });
  };
};

