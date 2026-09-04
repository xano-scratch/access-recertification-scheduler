import { query, s, c, ref, withFilters, fl } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { employees } from "../tables/employees.js";
import { entitlements } from "../tables/entitlements.js";
import { recertPolicies } from "../tables/recert-policies.js";
import { recertReviews } from "../tables/recert-reviews.js";
import { reviewSignoffs } from "../tables/review-signoffs.js";
import { DEMO_USERS, DEMO_POLICIES, DEMO_EMPLOYEES, DEMO_ENTITLEMENTS, DEMO_PASSWORD } from "../seed-data.js";

// An epoch-ms timestamp `n` days before the moment the seed runs.
const daysAgo = (n: number) => withFilters(c.now(), fl.sub(n * 86400000), fl.to_int());

/**
 * Reset the demo to a known, browsable state. Truncates every table (resetting
 * ids) and re-inserts the seed users, policies, employees, and entitlements,
 * with grant/recert dates anchored to now so the overdue mix is realistic. Open
 * so a reviewer can reset the demo without redeploying. The insert stack is
 * built from xano/seed-data.ts at build time.
 */
export const seedQuery = query({
  name: "seed",
  verb: "POST",
  apiGroup: recertApi,
  stack: [
    s.db.truncate({ table: reviewSignoffs, reset: true }),
    s.db.truncate({ table: recertReviews, reset: true }),
    s.db.truncate({ table: entitlements, reset: true }),
    s.db.truncate({ table: recertPolicies, reset: true }),
    s.db.truncate({ table: employees, reset: true }),
    s.db.truncate({ table: users, reset: true }),
    ...DEMO_USERS.map((u) =>
      s.db.add({ table: users, row: { email: u.email, password: c.text(DEMO_PASSWORD), name: u.name, role: u.role } }),
    ),
    ...DEMO_POLICIES.map((p) =>
      s.db.add({
        table: recertPolicies,
        row: { risk_tier: p.risk_tier, interval_days: p.interval_days, require_dual_signoff: p.require_dual_signoff },
      }),
    ),
    ...DEMO_EMPLOYEES.map((e) =>
      s.db.add({ table: employees, row: { name: e.name, email: e.email, department: e.department, status: e.status } }),
    ),
    ...DEMO_ENTITLEMENTS.map((x) =>
      s.db.add({
        table: entitlements,
        row: {
          employee_id: c.int(x.employee_id),
          system_name: x.system_name,
          access_level: x.access_level,
          risk_tier: x.risk_tier,
          status: "active",
          granted_at: daysAgo(x.granted_days_ago),
          last_recertified_at: x.recertified_days_ago === null ? c.null() : daysAgo(x.recertified_days_ago),
        },
      }),
    ),
  ],
  response: {
    ok: c.bool(true),
    users: c.int(DEMO_USERS.length),
    employees: c.int(DEMO_EMPLOYEES.length),
    entitlements: c.int(DEMO_ENTITLEMENTS.length),
    policies: c.int(DEMO_POLICIES.length),
  },
});
