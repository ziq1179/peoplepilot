import type { LeavePolicy, LeaveType, Employee, LeaveBalance, LeaveRequest } from "@shared/schema";

export const ACCRUAL_METHODS = {
  FRONT_LOADED: "front-loaded",
  PRO_RATED: "pro-rated",
  MONTHLY_ACCRUAL: "monthly-accrual",
} as const;

export type AccrualMethod = (typeof ACCRUAL_METHODS)[keyof typeof ACCRUAL_METHODS];

export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const WORKING_WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

/**
 * Parse a date-only string (YYYY-MM-DD) as a local-time midnight Date.
 * This avoids the UTC drift caused by `new Date("YYYY-MM-DD")`.
 */
export function parseDateISO(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD (local time). */
export function toISODate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Inclusive leave-year period for the given start month (1 = January).
 * E.g. startMonth 1, year 2026 -> 2026-01-01 .. 2026-12-31.
 */
export function getLeaveYearPeriod(year: number, startMonth = 1): { start: Date; end: Date } {
  const start = parseDateISO(`${year}-${String(startMonth).padStart(2, "0")}-01`);
  const end = new Date(year + 1, startMonth - 1, 0); // last day of the month before next leave-year start
  return { start, end };
}

/** Working (business) days within an inclusive date range: Monday-Friday. */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = parseDateISO(startDate);
  const end = parseDateISO(endDate);
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Fractional months between two dates. Whole months are counted up to the
 * monthly anniversary of `start` inside `end`'s month, plus the fraction of
 * the final month already elapsed.
 */
export function monthsBetween(start: Date, end: Date): number {
  if (end <= start) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const endMonthDays = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  if (end.getDate() >= start.getDate()) {
    const daysFromAnniversary = end.getDate() - start.getDate();
    return months + daysFromAnniversary / endMonthDays;
  }
  months -= 1;
  return months + end.getDate() / endMonthDays;
}

/**
 * Pro-rated entitlement for an employee hired partway through a leave year.
 * Standard rule: yearly entitlement scaled by the fraction of the leave year
 * remaining after (max of hire date and leave-year start), rounded to the
 * nearest whole day, minimum 1 day.
 */
export function calculateProRatedEntitlement(
  daysAllowed: number,
  hireDate: string,
  year: number,
  startMonth = 1
): number {
  const { start, end } = getLeaveYearPeriod(year, startMonth);
  const hire = parseDateISO(hireDate);
  const anchor = hire > start ? hire : start;
  const months = monthsBetween(anchor, end);
  const raw = (daysAllowed * months) / 12;
  return Math.max(1, Math.round(raw));
}

/**
 * Allocation to seed a balance row for a given leave year.
 * - front-loaded: full entitlement for the year.
 * - pro-rated / monthly-accrual: pro-rated for mid-year hires, full otherwise.
 */
export function initialEntitlement(
  policy: Pick<LeavePolicy, "accrualMethod"> | undefined,
  daysAllowed: number,
  hireDate: string,
  year: number,
  startMonth = 1
): number {
  if (!policy) return daysAllowed;
  const { start } = getLeaveYearPeriod(year, startMonth);
  if (parseDateISO(hireDate) <= start) return daysAllowed;
  if (policy.accrualMethod === ACCRUAL_METHODS.FRONT_LOADED) return daysAllowed;
  return calculateProRatedEntitlement(daysAllowed, hireDate, year, startMonth);
}

/**
 * Accrued/banked days as of a given date within a leave year.
 * - front-loaded: full entitlement granted up front.
 * - pro-rated: the pro-rated entitlement is available in full once granted.
 * - monthly-accrual: 1/12th of the entitlement per completed month of service.
 */
export function accruedDaysAsOf(
  policy: Pick<LeavePolicy, "accrualMethod" | "leaveYearStartMonth">,
  daysAllowed: number,
  hireDate: string,
  year: number,
  asOf: string
): number {
  const startMonth = policy.leaveYearStartMonth ?? 1;
  if (policy.accrualMethod === ACCRUAL_METHODS.FRONT_LOADED) {
    return daysAllowed;
  }
  const { start } = getLeaveYearPeriod(year, startMonth);
  const hire = parseDateISO(hireDate);
  const anchor = hire > start ? hire : start;
  const day = parseDateISO(asOf);
  if (day < anchor) return 0;
  if (policy.accrualMethod === ACCRUAL_METHODS.PRO_RATED) {
    return calculateProRatedEntitlement(daysAllowed, hireDate, year, startMonth);
  }
  // monthly-accrual
  const fraction = monthsBetween(anchor, day) / 12;
  const accrued = (daysAllowed * fraction);
  return Math.floor(accrued * 100) / 100;
}

/**
 * Effective days an employee may book as of the end date of a request.
 * For monthly-accrual leave types this caps availability at the amount
 * accrued by the leave end date (a request may not consume future accrual).
 */
export function effectiveAvailableDays(
  policy: Pick<LeavePolicy, "accrualMethod" | "leaveYearStartMonth"> | undefined,
  daysAllowed: number,
  hireDate: string,
  year: number,
  balance: Pick<LeaveBalance, "allocated" | "used" | "remaining">,
  asOf: string
): number {
  if (!policy || policy.accrualMethod !== ACCRUAL_METHODS.MONTHLY_ACCRUAL) {
    return balance.remaining;
  }
  const accrued = accruedDaysAsOf(policy, daysAllowed, hireDate, year, asOf);
  return Math.min(balance.remaining, Math.max(0, accrued - (balance.used ?? 0)));
}

export interface RequestValidationContext {
  employee: Pick<Employee, "hireDate" | "status" | "id">;
  leaveType: Pick<LeaveType, "id" | "isActive" | "daysAllowed">;
  policy: LeavePolicy | undefined;
  balance: Pick<LeaveBalance, "allocated" | "used" | "remaining"> | undefined;
  overlap: LeaveRequest[] | undefined;
  startDate: string;
  endDate: string;
  today?: Date;
}

export interface RequestValidationResult {
  isValid: boolean;
  days: number;
  violations: string[];
  available: number;
}

/**
 * Validate a leave request against the applicable policy. Server-side source
 * of truth; the client performs the same checks for UX.
 */
export function validateLeaveRequest(ctx: RequestValidationContext): RequestValidationResult {
  const now = ctx.today ?? new Date();
  const todayISO = toISODate(now);
  const violations: string[] = [];

  if (ctx.startDate > ctx.endDate) {
    violations.push("Start date cannot be after end date");
  }
  if (ctx.startDate < todayISO) {
    violations.push("Leave cannot start in the past");
  }

  const days = calculateWorkingDays(ctx.startDate, ctx.endDate);
  if (days < 1) {
    violations.push("Leave must include at least one working day");
  }

  if (ctx.leaveType.isActive === false) {
    violations.push("This leave type is inactive");
  }

  if (ctx.policy) {
    const policy = ctx.policy;
    const serviceMonths = monthsBetween(
      parseDateISO(ctx.employee.hireDate),
      new Date(now.getFullYear(), now.getMonth(), now.getDate())
    );
    if (policy.minimumServiceMonths && serviceMonths < policy.minimumServiceMonths) {
      violations.push(
        `Not eligible yet: requires ${policy.minimumServiceMonths} month(s) of service`
      );
    }
    if (policy.maxConsecutiveDays && days > policy.maxConsecutiveDays) {
      violations.push(
        `Request exceeds maximum of ${policy.maxConsecutiveDays} consecutive day(s)`
      );
    }
    if (policy.advanceNoticeDays) {
      const minStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      minStart.setDate(minStart.getDate() + policy.advanceNoticeDays);
      if (parseDateISO(ctx.startDate) < minStart) {
        violations.push(
          `Advance notice required: at least ${policy.advanceNoticeDays} day(s) before start`
        );
      }
    }
  }

  const year = parseDateISO(ctx.startDate).getFullYear();
  let available = ctx.balance?.remaining ?? 0;
  if (ctx.balance) {
    available = effectiveAvailableDays(
      ctx.policy,
      ctx.leaveType.daysAllowed,
      ctx.employee.hireDate,
      year,
      ctx.balance,
      ctx.endDate
    );
    if (days > available) {
      violations.push(
        `Insufficient balance: ${days} day(s) requested but only ${Math.floor(available)} available`
      );
    }
  } else {
    violations.push("No leave balance found for this leave type and year");
  }

  if (ctx.overlap && ctx.overlap.length > 0) {
    violations.push("Overlapping leave request already exists for these dates");
  }

  return { isValid: violations.length === 0, days, violations, available };
}

/**
 * Build a standard default policy for a leave type. Used when creating
 * leave types without an explicit policy configuration.
 */
export function defaultLeavePolicy(leaveTypeId: string): Pick<
  LeavePolicy,
  "leaveTypeId" | "accrualMethod" | "carryForward" | "carryOverDays" | "minimumServiceMonths" | "maxConsecutiveDays" | "advanceNoticeDays" | "leaveYearStartMonth" | "requiresDocumentation" | "isActive"
> {
  return {
    leaveTypeId,
    accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
    carryForward: false,
    carryOverDays: 0,
    minimumServiceMonths: 0,
    maxConsecutiveDays: 0,
    advanceNoticeDays: 0,
    leaveYearStartMonth: 1,
    requiresDocumentation: false,
    isActive: true,
  };
}

/**
 * Standard out-of-the-box leave types + policies following common practice.
 * Entitlements are in working days; annual leave carries over a capped amount.
 */
export const STANDARD_LEAVE_TYPES: Array<{
  name: string;
  code: string;
  daysAllowed: number;
  color: string;
  description: string;
  policy: Partial<Omit<LeavePolicy, "leaveTypeId">>;
}> = [
  {
    name: "Annual Leave",
    code: "AL",
    daysAllowed: 20,
    color: "#3b82f6",
    description: "Annual paid leave for vacation and personal restoration.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: true,
      carryOverDays: 10,
      minimumServiceMonths: 3,
      maxConsecutiveDays: 15,
      advanceNoticeDays: 7,
      leaveYearStartMonth: 1,
      requiresDocumentation: false,
    },
  },
  {
    name: "Sick Leave",
    code: "SL",
    daysAllowed: 10,
    color: "#ef4444",
    description: "Paid leave for illness or injury, no carry-over.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: false,
      carryOverDays: 0,
      minimumServiceMonths: 0,
      maxConsecutiveDays: 0,
      advanceNoticeDays: 0,
      leaveYearStartMonth: 1,
      requiresDocumentation: false,
    },
  },
  {
    name: "Personal Leave",
    code: "PL",
    daysAllowed: 5,
    color: "#10b981",
    description: "Paid leave for personal matters such as appointments or errands.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: false,
      carryOverDays: 0,
      minimumServiceMonths: 0,
      maxConsecutiveDays: 3,
      advanceNoticeDays: 2,
      leaveYearStartMonth: 1,
      requiresDocumentation: false,
    },
  },
  {
    name: "Maternity Leave",
    code: "ML",
    daysAllowed: 90,
    color: "#8b5cf6",
    description: "Protected paid leave for birth or adoption of a child.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: false,
      carryOverDays: 0,
      minimumServiceMonths: 6,
      maxConsecutiveDays: 0,
      advanceNoticeDays: 21,
      leaveYearStartMonth: 1,
      requiresDocumentation: true,
    },
  },
  {
    name: "Paternity Leave",
    code: "PAT",
    daysAllowed: 14,
    color: "#06b6d4",
    description: "Paid leave for fathers and partners following the birth of a child.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: false,
      carryOverDays: 0,
      minimumServiceMonths: 6,
      maxConsecutiveDays: 14,
      advanceNoticeDays: 14,
      leaveYearStartMonth: 1,
      requiresDocumentation: true,
    },
  },
  {
    name: "Compassionate Leave",
    code: "CL",
    daysAllowed: 7,
    color: "#f59e0b",
    description: "Paid leave for bereavement or family emergencies.",
    policy: {
      accrualMethod: ACCRUAL_METHODS.FRONT_LOADED,
      carryForward: false,
      carryOverDays: 0,
      minimumServiceMonths: 0,
      maxConsecutiveDays: 0,
      advanceNoticeDays: 0,
      leaveYearStartMonth: 1,
      requiresDocumentation: false,
    },
  },
];