/** Klienta (FS JS) forma – sakrīt ar `public/fs/js/dashboard.js` payload. */

import type { LoanPaymentClient } from "./private-loan";

export type SubscriptionDeviceClient = {
  id: number;
  name: string;
  note: string;
  amount: number;
  termStart: string;
  termEnd: string;
};

export type SubscriptionClient = {
  id: string;
  name: string;
  category: string;
  amount: number;
  /** Summa var mainīties katru periodu (DB `is_dynamic_amount`). */
  dynamicAmount?: boolean;
  /** Pēc apmaksas nākamajam termiņam rādīt iepriekšējā perioda bāzes summu. */
  dynamicCarryPrevious?: boolean;
  /** Bāzes summa tikai periodam `dueAmountOverrideFor` (ja dinamisks). */
  dueAmountOverride?: number | null;
  dueAmountOverrideFor?: string;
  period: string;
  date: string;
  icon: string | null;
  color: string | null;
  note: string;
  termStart: string;
  termEnd: string;
  devices: SubscriptionDeviceClient[];
  isPrivateLoan?: boolean;
  loanPrincipal?: number;
  loanTotalRepay?: number;
  loanPayments?: LoanPaymentClient[];
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number | string;
  period: string;
  next_payment_date: string;
  icon: string | null;
  color: string | null;
  note: string | null;
  term_start: string | null;
  term_end: string | null;
  devices: unknown;
  is_dynamic_amount?: boolean;
  is_dynamic_carry_previous?: boolean;
  due_amount_override?: number | string | null;
  due_amount_override_for?: string | null;
  is_private_loan?: boolean;
  loan_principal?: number | string | null;
  loan_total_repay?: number | string | null;
  loan_payments?: unknown;
};
