#!/usr/bin/env npx tsx
/**
 * Seed Demo Data for PeoplePilot
 * Populates the database with sample data for demo purposes.
 * Run: npm run db:seed
 * Login: All demo users have password "demo123"
 */

import "dotenv/config";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import {
  company,
  departments,
  positions,
  users,
  employees,
  teams,
  leaveTypes,
  leaveRequests,
  leaveBalances,
  attendanceRecords,
  timesheets,
  jobPostings,
  applications,
  performanceReviews,
  payrollRecords,
} from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const DEMO_PASSWORD = "demo123";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set. Check your .env file.");
    process.exit(1);
  }

  console.log("🌱 Seeding demo data for PeoplePilot...\n");

  // Check if demo data already exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  if (existingAdmin.length > 0) {
    console.log("⚠️  Demo data already exists (user 'admin' found).");
    console.log("   To re-seed, use a fresh database or remove demo users first.\n");
    process.exit(0);
  }

  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  // 1. Company
  const [companyRow] = await db
    .insert(company)
    .values({
      name: "Acme Corporation",
      legalName: "Acme Corp Ltd",
      address: "123 Business Park, Tech City",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
      phone: "+1 (555) 123-4567",
      email: "info@acme-demo.com",
      website: "https://acme-demo.com",
    })
    .returning();
  const companyId = companyRow!.id;
  console.log("  ✓ Company: Acme Corporation");

  // 2. Departments
  const deptRows = await db
    .insert(departments)
    .values([
      { name: "Engineering", description: "Product development and technology", budget: "2500000" },
      { name: "Sales", description: "Sales and business development", budget: "1200000" },
      { name: "Human Resources", description: "HR and people operations", budget: "800000" },
      { name: "Marketing", description: "Marketing and brand", budget: "900000" },
      { name: "Operations", description: "Operations and support", budget: "1100000" },
    ])
    .returning();
  const deptIds = Object.fromEntries(deptRows.map((d) => [d.name, d.id]));
  console.log("  ✓ Departments: 5");

  // 3. Positions
  const posData = [
    { title: "Software Engineer", departmentId: deptIds.Engineering, minSalary: "80000", maxSalary: "140000" },
    { title: "Senior Engineer", departmentId: deptIds.Engineering, minSalary: "120000", maxSalary: "180000" },
    { title: "Sales Representative", departmentId: deptIds.Sales, minSalary: "50000", maxSalary: "90000" },
    { title: "HR Manager", departmentId: deptIds["Human Resources"], minSalary: "70000", maxSalary: "110000" },
    { title: "Marketing Specialist", departmentId: deptIds.Marketing, minSalary: "55000", maxSalary: "85000" },
    { title: "Operations Coordinator", departmentId: deptIds.Operations, minSalary: "45000", maxSalary: "70000" },
  ];
  const posRows = await db.insert(positions).values(posData).returning();
  const posByTitle = Object.fromEntries(posRows.map((p) => [p.title, p.id]));
  console.log("  ✓ Positions: 6");

  // 4. Users (admin, hr, manager, employee)
  const userData = [
    { username: "admin", email: "admin@acme-demo.com", firstName: "Alex", lastName: "Admin", role: "admin" as const },
    { username: "hr.demo", email: "hr@acme-demo.com", firstName: "Sarah", lastName: "HR", role: "hr" as const },
    { username: "manager.demo", email: "manager@acme-demo.com", firstName: "Mike", lastName: "Manager", role: "manager" as const },
    { username: "employee.demo", email: "employee@acme-demo.com", firstName: "Emma", lastName: "Employee", role: "employee" as const },
    { username: "john.dev", email: "john@acme-demo.com", firstName: "John", lastName: "Developer", role: "employee" as const },
    { username: "jane.sales", email: "jane@acme-demo.com", firstName: "Jane", lastName: "Sales", role: "employee" as const },
  ];
  const userRows = await db
    .insert(users)
    .values(
      userData.map((u) => ({
        ...u,
        password: hashedPassword,
      }))
    )
    .returning();
  const userByUsername = Object.fromEntries(userRows.map((u) => [u.username, u]));
  console.log("  ✓ Users: 6 (password: demo123)");

  // 5. Employees (link to users)
  const empData = [
    { userId: userByUsername["admin"].id, firstName: "Alex", lastName: "Admin", email: "admin@acme-demo.com", hireDate: "2022-01-15", departmentId: deptIds["Human Resources"], positionId: posByTitle["HR Manager"], employeeId: "EMP0001", salary: "95000" },
    { userId: userByUsername["hr.demo"].id, firstName: "Sarah", lastName: "HR", email: "hr@acme-demo.com", hireDate: "2022-03-01", departmentId: deptIds["Human Resources"], positionId: posByTitle["HR Manager"], employeeId: "EMP0002", salary: "85000" },
    { userId: userByUsername["manager.demo"].id, firstName: "Mike", lastName: "Manager", email: "manager@acme-demo.com", hireDate: "2021-06-15", departmentId: deptIds.Engineering, positionId: posByTitle["Senior Engineer"], employeeId: "EMP0003", salary: "145000" },
    { userId: userByUsername["employee.demo"].id, firstName: "Emma", lastName: "Employee", email: "employee@acme-demo.com", hireDate: "2023-02-01", departmentId: deptIds.Engineering, positionId: posByTitle["Software Engineer"], employeeId: "EMP0004", managerId: null as string | null, salary: "95000" },
    { userId: userByUsername["john.dev"].id, firstName: "John", lastName: "Developer", email: "john@acme-demo.com", hireDate: "2023-05-10", departmentId: deptIds.Engineering, positionId: posByTitle["Software Engineer"], employeeId: "EMP0005", managerId: null as string | null, salary: "88000" },
    { userId: userByUsername["jane.sales"].id, firstName: "Jane", lastName: "Sales", email: "jane@acme-demo.com", hireDate: "2023-08-20", departmentId: deptIds.Sales, positionId: posByTitle["Sales Representative"], employeeId: "EMP0006", managerId: null as string | null, salary: "62000" },
  ];
  const empRows = await db.insert(employees).values(empData).returning();

  // Set manager IDs (Mike manages Emma and John)
  const mikeEmp = empRows.find((e) => e.employeeId === "EMP0003")!;
  const emmaEmp = empRows.find((e) => e.employeeId === "EMP0004")!;
  const johnEmp = empRows.find((e) => e.employeeId === "EMP0005")!;
  await db.update(employees).set({ managerId: mikeEmp.id }).where(eq(employees.id, emmaEmp.id));
  await db.update(employees).set({ managerId: mikeEmp.id }).where(eq(employees.id, johnEmp.id));

  // Update department managers
  await db.update(departments).set({ managerId: empRows[0].id }).where(eq(departments.id, deptIds["Human Resources"]));
  await db.update(departments).set({ managerId: mikeEmp.id }).where(eq(departments.id, deptIds.Engineering));

  const empIds = Object.fromEntries(empRows.map((e) => [e.employeeId, e.id]));
  console.log("  ✓ Employees: 6");

  // 6. Teams
  await db.insert(teams).values([
    { name: "Backend Team", departmentId: deptIds.Engineering, teamLeadId: mikeEmp.id },
    { name: "Inside Sales", departmentId: deptIds.Sales },
  ]);
  console.log("  ✓ Teams: 2");

  // 7. Leave Types
  const leaveTypeRows = await db
    .insert(leaveTypes)
    .values([
      { name: "Annual Leave", daysAllowed: 20, carryForward: true, color: "#3b82f6" },
      { name: "Sick Leave", daysAllowed: 10, carryForward: false, color: "#ef4444" },
      { name: "Personal Leave", daysAllowed: 5, carryForward: false, color: "#10b981" },
    ])
    .returning();
  const annualLeaveId = leaveTypeRows.find((l) => l.name === "Annual Leave")!.id;
  const sickLeaveId = leaveTypeRows.find((l) => l.name === "Sick Leave")!.id;
  console.log("  ✓ Leave Types: 3");

  // 8. Leave Balances (current year)
  const year = new Date().getFullYear();
  for (const emp of empRows) {
    for (const lt of leaveTypeRows) {
      await db.insert(leaveBalances).values({
        employeeId: emp.id,
        leaveTypeId: lt.id,
        year,
        allocated: lt.daysAllowed,
        used: lt.name === "Annual Leave" ? 2 : 0,
        remaining: lt.name === "Annual Leave" ? lt.daysAllowed - 2 : lt.daysAllowed,
      });
    }
  }
  console.log("  ✓ Leave Balances: initialized for all employees");

  // 9. Leave Requests (sample)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  const endDate = new Date(futureDate);
  endDate.setDate(endDate.getDate() + 2);
  await db.insert(leaveRequests).values({
    employeeId: emmaEmp.id,
    leaveTypeId: annualLeaveId,
    startDate: futureDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    daysRequested: 3,
    reason: "Family vacation",
    status: "pending",
  });
  console.log("  ✓ Leave Requests: 1 pending");

  // 10. Attendance (last 5 working days)
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().split("T")[0];
    const clockIn = new Date(d);
    clockIn.setHours(9, 0, 0, 0);
    const clockOut = new Date(d);
    clockOut.setHours(17, 30, 0, 0);
    for (const emp of empRows.slice(2, 6)) {
      await db.insert(attendanceRecords).values({
        employeeId: emp.id,
        date: dateStr,
        clockIn: clockIn,
        clockOut: clockOut,
        totalHours: "8.5",
        status: "present",
        location: "office",
      });
    }
  }
  console.log("  ✓ Attendance: sample records for last 5 days");

  // 11. Timesheets (current week)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  for (const emp of empRows.slice(2, 6)) {
    await db.insert(timesheets).values({
      employeeId: emp.id,
      weekStartDate: weekStartStr,
      weekEndDate: weekEndStr,
      totalHours: "40",
      regularHours: "40",
      overtimeHours: "0",
      status: "draft",
    });
  }
  console.log("  ✓ Timesheets: current week drafts");

  // 12. Job Posting
  const [jobRow] = await db
    .insert(jobPostings)
    .values({
      title: "Senior Software Engineer",
      description: "Join our engineering team to build scalable products.",
      departmentId: deptIds.Engineering,
      positionId: posByTitle["Senior Engineer"],
      location: "San Francisco (Hybrid)",
      employmentType: "full-time",
      salaryMin: "120000",
      salaryMax: "180000",
      status: "open",
      openings: 2,
      postedBy: mikeEmp.id,
      postedAt: new Date(),
    })
    .returning();
  console.log("  ✓ Job Postings: 1 open");

  // 13. Application
  await db.insert(applications).values({
    jobPostingId: jobRow!.id,
    candidateName: "Demo Candidate",
    candidateEmail: "candidate@example.com",
    status: "screening",
    rating: 4,
    appliedAt: new Date(),
  });
  console.log("  ✓ Applications: 1 sample");

  // 14. Performance Review (sample)
  await db.insert(performanceReviews).values({
    employeeId: emmaEmp.id,
    reviewerId: mikeEmp.id,
    reviewPeriodStart: "2024-01-01",
    reviewPeriodEnd: "2024-12-31",
    overallRating: 4,
    technicalSkillsRating: 4,
    communicationRating: 5,
    leadershipRating: 3,
    teamworkRating: 5,
    problemSolvingRating: 4,
    status: "draft",
  });
  console.log("  ✓ Performance Reviews: 1 sample");

  // 15. Payroll record (sample)
  await db.insert(payrollRecords).values({
    employeeId: emmaEmp.id,
    payPeriodStart: "2024-12-01",
    payPeriodEnd: "2024-12-15",
    baseSalary: "3958.33",
    overtime: "0",
    bonuses: "0",
    deductions: "200",
    taxes: "650",
    netPay: "3108.33",
    status: "processed",
    processedAt: new Date(),
  });
  console.log("  ✓ Payroll: 1 sample record");

  console.log("\n✅ Demo data seeded successfully!\n");
  console.log("📋 Demo logins (password: demo123):");
  console.log("   • admin       - Full access");
  console.log("   • hr.demo     - HR functions");
  console.log("   • manager.demo - Manager view");
  console.log("   • employee.demo - Employee view");
  console.log("   • john.dev    - Developer");
  console.log("   • jane.sales  - Sales rep");
  console.log("");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
