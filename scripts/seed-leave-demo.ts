#!/usr/bin/env npx tsx
/**
 * Seed demo LEAVE data for PeoplePilot (idempotent / re-runnable).
 *
 * What it does:
 *   1. Ensures every employee has a balance row for every active leave type
 *      in the current leave year (creates missing rows only; existing rows
 *      are left untouched).
 *   2. Replaces the leave_requests table with a curated demo set:
 *      - approved history (past), pending requests (future).
 *   3. Recomputes each employee's balance so `used` = sum of approved request
 *      days and `remaining` = allocated - used (consistent data).
 *
 * Run: node dist or via esbuild bundle like scripts/migrate-leave-policies.ts
 * Logins (password demo123): admin, hr.demo, manager.demo, employee.demo, john.dev, jane.sales
 */
import { db } from "../server/db";
import {
  employees,
  leaveTypes,
  leavePolicies,
  leaveBalances,
  leaveRequests,
} from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  initialEntitlement,
  calculateWorkingDays,
} from "../server/lib/leave-policy";

type Status = "pending" | "approved" | "rejected";

interface DemoRequest {
  emp: string; // full name, see employee below
  code: string; // leave type code AL/SL/PL/ML/PAT/CL
  start: string;
  end: string;
  status: Status;
  reason: string;
  approvedBy?: string; // full name of approver (required for approved/rejected)
  comments?: string;
}

// Name lookup key (match schema: firstName + lastName)
function fullName(e: { firstName: string; lastName: string }): string {
  return `${e.firstName} ${e.lastName}`;
}

const DEMO_REQUESTS: DemoRequest[] = [
  // ---- Approved history (past) ----
  { emp: "Mike Manager", code: "AL", start: "2026-01-12", end: "2026-01-16", status: "approved", reason: "Family trip", approvedBy: "Alex Admin", comments: "Approved - enjoy the trip!" },
  { emp: "Jane Sales", code: "AL", start: "2026-02-09", end: "2026-02-13", status: "approved", reason: "Winter break", approvedBy: "Mike Manager", comments: "Approved - enjoy your time off." },
  { emp: "Emma Employee", code: "PL", start: "2026-02-23", end: "2026-02-23", status: "approved", reason: "Moving house", approvedBy: "Mike Manager", comments: "Approved - good luck with the move!" },
  { emp: "John Developer", code: "SL", start: "2026-03-23", end: "2026-03-24", status: "approved", reason: "Flu recovery", approvedBy: "Mike Manager", comments: "Approved - get well soon." },
  { emp: "Sarah HR", code: "AL", start: "2026-04-06", end: "2026-04-10", status: "approved", reason: "Spring break", approvedBy: "Alex Admin", comments: "Approved - have a great break." },
  { emp: "Jane Sales", code: "SL", start: "2026-04-20", end: "2026-04-21", status: "approved", reason: "Migraine", approvedBy: "Mike Manager", comments: "Approved - take care." },
  { emp: "John Developer", code: "AL", start: "2026-06-29", end: "2026-07-03", status: "approved", reason: "Summer vacation", approvedBy: "Mike Manager", comments: "Approved - have a wonderful summer!" },
  { emp: "Emma Employee", code: "AL", start: "2026-12-22", end: "2026-12-24", status: "approved", reason: "End of year vacation", approvedBy: "Mike Manager", comments: "Approved - enjoy the holidays." },

  // ---- Pending (future, waiting for manager approval) ----
  { emp: "John Developer", code: "AL", start: "2026-10-05", end: "2026-10-09", status: "pending", reason: "Fall hiking trip" },
  { emp: "Emma Employee", code: "PL", start: "2026-10-01", end: "2026-10-01", status: "pending", reason: "Personal appointment" },
  { emp: "Emma Employee", code: "SL", start: "2026-10-12", end: "2026-10-13", status: "pending", reason: "Scheduled follow-up appointment" },
  { emp: "Jane Sales", code: "AL", start: "2026-11-23", end: "2026-11-27", status: "pending", reason: "Thanksgiving week off" },
];

function toISODate(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  const year = new Date().getFullYear();

  const allEmployees = await db.select().from(employees);
  const allTypes = await db.select().from(leaveTypes);
  const policies = await db.select().from(leavePolicies);
  const startMonth = policies[0]?.leaveYearStartMonth ?? 1;

  const empByName = new Map(allEmployees.map((e) => [fullName(e), e]));
  const typeByCode = new Map(allTypes.map((t) => [t.code, t]));

  // ---- 1. Fill missing leave balances (idempotent) ----
  let balancesCreated = 0;
  for (const emp of allEmployees) {
    for (const type of allTypes) {
      if (type.isActive === false) continue;
      const existing = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.employeeId, emp.id),
            eq(leaveBalances.leaveTypeId, type.id),
            eq(leaveBalances.year, year)
          )
        );
      if (existing.length > 0) continue;

      const policy = policies.find((p) => p.leaveTypeId === type.id);
      const allocated = initialEntitlement(
        policy,
        type.daysAllowed,
        toISODate(emp.hireDate),
        year,
        startMonth
      );
      await db.insert(leaveBalances).values({
        employeeId: emp.id,
        leaveTypeId: type.id,
        year,
        allocated,
        used: 0,
        remaining: allocated,
      });
      balancesCreated++;
    }
  }
  console.log(`1) Leave balances: created ${balancesCreated} missing row(s) for ${year}.`);

  // ---- 2. Replace leave requests with curated demo set ----
  const existingReqIds = await db.select({ id: leaveRequests.id }).from(leaveRequests);
  if (existingReqIds.length > 0) {
    await db
      .delete(leaveRequests)
      .where(
        inArray(
          leaveRequests.id,
          existingReqIds.map((r) => r.id)
        )
      );
    console.log(`   Cleared ${existingReqIds.length} previous request(s) (test artifacts).`);
  }

  let inserted = 0;
  for (const demo of DEMO_REQUESTS) {
    const employee = empByName.get(demo.emp);
    const type = typeByCode.get(demo.code);
    if (!employee || !type) {
      console.error(`   SKIP unknown emp/type: ${demo.emp}/${demo.code}`);
      continue;
    }
    const approver = demo.approvedBy ? empByName.get(demo.approvedBy) : undefined;
    const days = calculateWorkingDays(demo.start, demo.end);
    await db.insert(leaveRequests).values({
      employeeId: employee.id,
      leaveTypeId: type.id,
      startDate: demo.start,
      endDate: demo.end,
      daysRequested: days,
      reason: demo.reason,
      status: demo.status,
      approvedBy: approver?.id ?? null,
      approvalDate: demo.status === "pending" ? null : new Date(`${demo.end}T17:00:00`),
      comments: demo.comments ?? null,
    });
    inserted++;
  }
  console.log(`   Inserted ${inserted} demo request(s).`);

  // ---- 3. Recompute balances to match approved requests ----
  const allBalances = await db.select().from(leaveBalances);
  const allRequests = await db.select().from(leaveRequests);
  let balancesUpdated = 0;

  for (const bal of allBalances) {
    if (bal.year !== year) continue;
    const approvedDays = allRequests
      .filter(
        (r) =>
          r.employeeId === bal.employeeId &&
          r.leaveTypeId === bal.leaveTypeId &&
          r.status === "approved" &&
          new Date(`${r.startDate}T00:00:00`).getFullYear() === year
      )
      .reduce((sum, r) => sum + r.daysRequested, 0);
    const remaining = Math.max(0, bal.allocated - approvedDays);
    if (bal.used !== approvedDays || bal.remaining !== remaining) {
      await db
        .update(leaveBalances)
        .set({ used: approvedDays, remaining })
        .where(eq(leaveBalances.id, bal.id));
      balancesUpdated++;
    }
  }
  console.log(`2) Balances reconciled: updated ${balancesUpdated} row(s) to match approved requests.`);

  console.log("\nDemo leave data ready!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await db.$client.end();
    } catch {
      // ignore
    }
  });