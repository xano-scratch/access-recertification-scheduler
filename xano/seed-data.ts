// Shared demo dataset for the recertification scheduler.
//
// The POST recert/seed endpoint builds its insert stack from these arrays at
// BUILD time (def modules run at build time), so there is one source of truth
// for the demo. Dates are anchored to "now" at request time (see `daysAgo` in
// api/seed.ts), so the overdue/current mix is always realistic against the
// moment the demo is seeded, not baked to a fixed calendar date.

export const DEMO_PASSWORD = "recert-demo";

export const DEMO_USERS = [
  { email: "alice@bank.example", name: "Alice Nguyen", role: "compliance_admin" },
  { email: "ravi@bank.example", name: "Ravi Patel", role: "reviewer" },
  { email: "val@bank.example", name: "Val Ortiz", role: "viewer" },
] as const;

// One interval rule per risk tier. This table IS the governed rule set the scan
// reads: change a number here and the next scan flags on the new cadence.
export const DEMO_POLICIES = [
  { risk_tier: "critical", interval_days: 30, require_dual_signoff: true },
  { risk_tier: "high", interval_days: 90, require_dual_signoff: false },
  { risk_tier: "medium", interval_days: 180, require_dual_signoff: false },
  { risk_tier: "low", interval_days: 365, require_dual_signoff: false },
] as const;

// Employees take ids 1..4 after a reset-truncate + insert in this order, which
// the entitlement rows below reference by that 1-based position.
export const DEMO_EMPLOYEES = [
  { name: "Dana Kim", email: "dana.kim@bank.example", department: "Retail Banking", status: "active" },
  { name: "Marcus Webb", email: "marcus.webb@bank.example", department: "Trading", status: "active" },
  { name: "Priya Shah", email: "priya.shah@bank.example", department: "Risk and Compliance", status: "active" },
  { name: "Tom Reyes", email: "tom.reyes@bank.example", department: "Operations", status: "terminated" },
] as const;

// granted_days_ago / recertified_days_ago are offsets from "now" applied when
// the seed runs. A grant is overdue when granted_at (or last_recertified_at, if
// set) plus its tier interval is in the past. Tom Reyes (employee 4) is
// terminated but still holds access, so his grants are flagged regardless of age.
export const DEMO_ENTITLEMENTS = [
  { employee_id: 1, system_name: "Core Banking Ledger", access_level: "read", risk_tier: "high", granted_days_ago: 400, recertified_days_ago: 20 },
  { employee_id: 1, system_name: "Wire Transfer Console", access_level: "admin", risk_tier: "critical", granted_days_ago: 120, recertified_days_ago: null },
  { employee_id: 2, system_name: "Trading Desk Terminal", access_level: "admin", risk_tier: "critical", granted_days_ago: 60, recertified_days_ago: null },
  { employee_id: 2, system_name: "Market Data Feed", access_level: "read", risk_tier: "medium", granted_days_ago: 90, recertified_days_ago: null },
  { employee_id: 3, system_name: "AML Case Manager", access_level: "admin", risk_tier: "high", granted_days_ago: 200, recertified_days_ago: null },
  { employee_id: 3, system_name: "Policy Archive", access_level: "read", risk_tier: "low", granted_days_ago: 300, recertified_days_ago: null },
  { employee_id: 4, system_name: "Core Banking Ledger", access_level: "read", risk_tier: "high", granted_days_ago: 150, recertified_days_ago: 10 },
  { employee_id: 4, system_name: "Ops Dashboard", access_level: "admin", risk_tier: "medium", granted_days_ago: 220, recertified_days_ago: null },
] as const;
