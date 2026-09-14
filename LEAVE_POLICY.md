# Leave Policy System Documentation

## Overview

The PeoplePilot leave module is driven by a **per-leave-type policy engine**. Each leave type (e.g. Annual Leave, Sick Leave) may be associated with exactly one policy that defines how entitlement is allocated (accrual), whether and how much unused leave carries over, how much service is required before the leave can be used, maximum consecutive days per request, advance-notice requirements, and whether documentation is required.

The policy engine is the server-side **source of truth** for all leave validation. The reference implementation lives in `server/lib/leave-policy.ts`; storage operations are in `server/storage.ts`; the HTTP layer is in `server/routes.ts`.

## Policy Model

### `leave_types` (shared/schema.ts)

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | uuid (pk) | Stable identifier referenced by balances, requests, policies |
| `name` | varchar | Display name, e.g. "Annual Leave" |
| `code` | varchar | Short code, e.g. `AL` |
| `description` | text | Optional description shown to employees |
| `days_allowed` | integer (not null) | Yearly entitlement **in working days** |
| `carry_forward` | boolean | Legacy flag; retained for compatibility. Policy `carryForward` is authoritative |
| `color` | varchar | Hex color for UI badges |
| `is_active` | boolean | Inactive types cannot be used in new requests and are hidden from the request dropdown |

### `leave_policies` (shared/schema.ts)

One policy row per leave type (`uq_leave_policies_type` unique index on `leave_type_id`).

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `accrual_method` | varchar | `front-loaded` | How entitlement is granted: `front-loaded`, `pro-rated`, `monthly-accrual` |
| `carry_forward` | boolean | false | Whether unused days carry into the next leave year |
| `carry_over_days` | integer | 0 | Maximum days that may carry over (0 = none carry / unlimited depends on `carryForward`) |
| `minimum_service_months` | integer | 0 | Months of service required before leave can be taken (0 = no minimum) |
| `max_consecutive_days` | integer | 0 | Maximum working days per single request (0 = unlimited) |
| `advance_notice_days` | integer | 0 | Minimum working days' notice before the start date (0 = none) |
| `leave_year_start_month` | integer | 1 | Start month of the leave year, 1 = January |
| `requires_documentation` | boolean | false | Reserved; indicates documents (e.g. medical certificate) are required |
| `is_active` | boolean | true | Disables the policy rules when false |

## Accrual Methods

Three methods are supported (`ACCRUAL_METHODS` in `server/lib/leave-policy.ts`).

### 1. Front-loaded (`front-loaded`)
Full yearly entitlement is granted on the first day of the leave year (for existing employees) or on the hire date (for mid-year hires).

**Example:** Annual Leave 20 days, leave year starting January. On 2026-01-01 the balance is seeded with `allocated = 20`.

### 2. Pro-rated (`pro-rated`)
For employees hired **after** the start of a leave year, entitlement is scaled by the fraction of the leave year remaining at the hire date, rounded to the nearest whole day (minimum 1 day).

Formula (`calculateProRatedEntitlement`):
```
months = fraction of leave year from max(hireDate, leaveYearStart) to leave year end
raw    = days_allowed * months / 12
grant  = max(1, round(raw))
```

**Example:** Annual Leave 20 days (year starts January), hired 2026-07-01 → exactly 6/12 of the year remains → `20 * 6 / 12 = 10` days.

### 3. Monthly accrual (`monthly-accrual`)
Entitlement accrues at **1/12th per completed month** of service. A request may never consume more than the amount accrued as of the request's **end date** (future accrual cannot be spent).

Formula (`accruedDaysAsOf`):
```
accrued = days_allowed * (completed_service_months / 12)   # floor to 2 decimals
```

Availability for a request (`effectiveAvailableDays`):
```
available = min(balance.remaining, max(0, accruedAsOf(endDate) - balance.used))
```

## Business-Day Calculation
`calculateWorkingDays(startDate, endDate)` counts **inclusive** days that fall on Monday through Friday. Weekends (Saturday, Sunday) are excluded. There is currently no public-holiday table; holidays are counted as working days.

**Example:** Date range `2026-12-22 (Tue) … 2026-12-24 (Thu)` = 3 working days. A Friday→Monday range is 2 days.

## Carry-Over & Year-End Rollover

### Carry-over rule
A balance row carries unused days into the next leave year **only if the policy has `carryForward = true`**. The carried amount is capped at `carryOverDays`:

```
carried = min(previousYear.remaining, carryOverDays)
```

### Rollover endpoint
```
POST /api/leave/rollover          (Admin only)
Body (optional): { "prevYear": 2025, "newYear": 2026 }
```
Defaults to `prevYear = currentYear - 1`, `newYear = currentYear`.

For each leave type with `carryForward = true`, the endpoint:
1. Reads the previous year's `remaining` for each employee.
2. Computes `carried = min(remaining, carryOverDays)`.
3. Creates/updates the `newYear` balance as `allocated = entitlement + carried`, `used = 0`, `remaining = allocated`.

This is performed in a single database transaction (`rolloverLeaveBalances`). Example response:
```json
{ "message": "Rollover complete: 5 balance(s) updated", "updated": 5 }
```

### Legacy manual flow
`carry_forward` on `leave_types` is retained for compatibility only. New configuration should be done through Leave Types → policy settings (or the policies API), and rollover through the `/api/leave/rollover` endpoint rather than manual balance edits.

## Eligibility & Request Validation

On submission, `POST /api/leave/requests` runs `validateLeaveRequest` server-side (client mirrors the checks for UX). The request **must** satisfy all of the following:

1. `startDate <= endDate`.
2. `startDate` not in the past.
3. At least 1 working day in the range.
4. Leave type is active; the type exists.
5. If a policy exists:
   - Employee has at least `minimumServiceMonths` of service (via `hireDate`).
   - `daysRequested <= maxConsecutiveDays` (when `> 0`).
   - Start date is at least `advanceNoticeDays` in advance (when `> 0`). Note the notice and service-month checks run against whole months via `monthsBetween`.
6. Sufficient balance for the *leave year of the start date*; balance is capped by accrued entitlement for `monthly-accrual` types (see above).
7. No **overlapping** request (`getLeaveRequestsOverlap`); overlap comparison ignores `rejected` requests.
8. `employeeId` is forced server-side to the authenticated user's employee record — requests cannot be submitted on behalf of other employees.

Violations are returned as:
```json
{
  "message": "Leave request validation failed",
  "days": 3,
  "violations": ["Insufficient balance: 4 day(s) requested but only 3 available"],
  "available": 3
}
```

## Approval Workflow

- `PUT /api/leave/requests/:id/approve` — Manager/HR only. Rules:
  - Request must currently be `pending`.
  - The approver **cannot approve their own request** (returns `400 You cannot approve your own leave request`).
  - Employee must have sufficient `remaining` balance for `daysRequested`.
  - Sets `status = approved`, `approvedBy`, `approvalDate`, `comments`; deducts the days from the employee's balance for that leave year (`used += days`, `remaining -= days`).
- `PUT /api/leave/requests/:id/reject` — Manager/HR only. Rules:
  - Request must currently be `pending`.
  - Sets `status = rejected`, `approvedBy`, `approvalDate`, `comments`. Balance is **not** affected.

Status flow: `pending → approved | rejected` (final states; a terminal request cannot be re-opened).

> Note: approval updates the request and the balance in two sequential storage calls. For single-user flows this is atomic enough in practice, but it is not wrapped in a database transaction; retiring this into `storage.approveLeaveRequest` as a transaction is a potential hardening step.

## Balance Model

`leave_balances` is keyed by `(employeeId, leaveTypeId, year)` — the `uq_leave_balances_emp_type_year` unique index prevents duplicates.

- `allocated` — seeded as `initialEntitlement(policy, daysAllowed, hireDate, year, startMonth)`:
  - `front-loaded`: full `daysAllowed` (also full for pre-year hires).
  - `pro-rated` / `monthly-accrual`: full for pre-year hires, pro-rated otherwise.
- `used` — increments only when a request is **approved**.
- `remaining` — `allocated - used`; recomputed on approval.

When no policy row exists, balance initialization behaves as `front-loaded` with full entitlement.

## Standard Leave Types (seed / migration)

`scripts/migrate-leave-policies.ts` (idempotent; also used by `scripts/seed-demo-data.ts`):

| Name | Code | Days | Accrual | Carry | Cap | Min service | Max consecutive | Notice | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Annual Leave | AL | 20 | front-loaded | yes | 10 | 3 mo | 15 | 7 d | no |
| Sick Leave | SL | 10 | front-loaded | no | 0 | 0 | 0 | 0 | no |
| Personal Leave | PL | 5 | front-loaded | no | 0 | 0 | 3 | 2 d | no |
| Maternity Leave | ML | 90 | front-loaded | no | 0 | 6 mo | 0 | 21 d | yes |
| Paternity Leave | PAT | 14 | front-loaded | no | 0 | 6 mo | 14 | 14 d | yes |
| Compassionate Leave | CL | 7 | front-loaded | no | 0 | 0 | 0 | 0 | no |

## API Endpoints

- `GET /api/leave/types` — list leave types.
- `POST /api/leave/types` — create type (HR/Admin).
- `PUT /api/leave/types/:id` — update type (HR/Admin).
- `DELETE /api/leave/types/:id` — delete type (HR/Admin).
- `GET /api/leave/policies` — list all policies (any authenticated user).
- `POST /api/leave/policies` — upsert policy for a leave type (HR/Admin).
- `DELETE /api/leave/policies/:leaveTypeId` — delete a type's policy (HR/Admin).
- `POST /api/leave/rollover` — year-end rollover (Admin only).
- `POST /api/leave/requests` — submit request (validated; employee forced).
- `PUT /api/leave/requests/:id/approve` — approve (Manager/HR; no self-approval).
- `PUT /api/leave/requests/:id/reject` — reject (Manager/HR).

## Admin Configuration (UI)

Settings → **Leave Types** exposes the following per-type policy fields: code, description, days allowed, carry-forward toggle + cap, accrual method, leave-year start month, minimum service months, max consecutive days, advance notice days, requires documentation, active toggle. A **Year-End Rollover** action runs `POST /api/leave/rollover` for the current year transition.

## FAQ

**Q: Can an employee see their exact future accrual?**
A: Balances show `remaining`. For `monthly-accrual` types the UI/server cap availability at the amount accrued by the request end date; an employee will see reduced availability until accrual catches up.

**Q: What happens to unused Annual Leave at year end?**
A: Run the rollover by an Admin. Up to 10 days (configured cap) carry into the new year; the rest is forfeited per policy.

**Q: Are public holidays excluded from the day count?**
A: No — only weekends. A holiday table is listed under future enhancements.

**Q: Can HR submit leave on behalf of an employee?**
A: No. `employeeId` is always taken from the authenticated user's employee record.

**Q: Can a manager approve their own leave?**
A: No. The server rejects self-approval with `400`.

**Q: Can a request for next year be submitted?**
A: Yes, provided the balance for the *start-date year* exists/suffices and all other rules pass.

## Related Files

- `server/lib/leave-policy.ts` — policy engine (accrual, working days, validation, standard types).
- `server/storage.ts` — `getLeavePolicies`, `getLeavePolicyByLeaveType`, `upsertLeavePolicy`, `rolloverLeaveBalances`, `getLeaveRequestsOverlap`, policy-aware `initializeLeaveBalancesForEmployee`.
- `server/routes.ts` — policies/rollover/requests/approve/reject routes.
- `shared/schema.ts` — `leavePolicies`, `leaveTypes`, `leaveBalances`, `leaveRequests`.
- `client/src/pages/LeaveTypes.tsx` — policy configuration UI + rollover action.
- `client/src/pages/Leave.tsx` — request page (business-day calculation, approve/reject).
- `scripts/migrate-leave-policies.ts` — idempotent seed/migration of standard types + policies.