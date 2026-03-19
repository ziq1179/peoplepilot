/**
 * Payroll calculation utilities
 * - Tax calculation (simple bracket system)
 * - Gross/net pay from base salary, overtime, allowances, deductions
 */

/** Simple tax brackets (annual salary, cumulative). Configurable per jurisdiction. */
const TAX_BRACKETS = [
  { max: 20000, rate: 0 },
  { max: 50000, rate: 0.1 },
  { max: 100000, rate: 0.2 },
  { max: Infinity, rate: 0.25 },
];

/** Calculate tax for a given annual gross salary */
export function calculateTax(annualGross: number): number {
  let tax = 0;
  let previousMax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (annualGross <= previousMax) break;
    const taxableInBracket = Math.min(annualGross, bracket.max) - previousMax;
    tax += taxableInBracket * bracket.rate;
    previousMax = bracket.max;
  }
  return Math.round(tax * 100) / 100;
}

/** Calculate tax for a pay period (prorated from annual) */
export function calculateTaxForPeriod(
  periodGross: number,
  payPeriodsPerYear: number = 24
): number {
  const annualized = periodGross * payPeriodsPerYear;
  const annualTax = calculateTax(annualized);
  return Math.round((annualTax / payPeriodsPerYear) * 100) / 100;
}

/** Overtime multiplier (e.g. 1.5x for hours over 40/week) */
const OVERTIME_RATE = 1.5;

export interface PayrollInput {
  baseSalaryAnnual: number;
  regularHours: number;
  overtimeHours: number;
  allowances?: number;
  deductions?: number;
  payPeriodsPerYear?: number; // 12=monthly, 24=semi-monthly, 26=bi-weekly
}

export interface PayrollOutput {
  baseSalary: number;
  overtime: number;
  grossPay: number;
  allowances: number;
  deductions: number;
  taxableIncome: number;
  taxes: number;
  netPay: number;
}

export function calculatePayroll(input: PayrollInput): PayrollOutput {
  const periodsPerYear = input.payPeriodsPerYear ?? 24;
  const basePerPeriod = input.baseSalaryAnnual / periodsPerYear;
  const hourlyRate = (input.baseSalaryAnnual / 52) / 40; // assume 40h/week
  const overtimePay = input.overtimeHours * hourlyRate * OVERTIME_RATE;
  const allowances = input.allowances ?? 0;
  const deductions = input.deductions ?? 0;
  const grossPay = basePerPeriod + overtimePay + allowances;
  const taxableIncome = grossPay - deductions;
  const taxes = calculateTaxForPeriod(Math.max(0, taxableIncome), periodsPerYear);
  const netPay = grossPay - deductions - taxes;

  return {
    baseSalary: Math.round(basePerPeriod * 100) / 100,
    overtime: Math.round(overtimePay * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    allowances,
    deductions,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    netPay: Math.round(Math.max(0, netPay) * 100) / 100,
  };
}
